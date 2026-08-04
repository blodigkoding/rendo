import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { Checkout, StorePlan, Vec2 } from '../data/types';
import { FACING_VECTOR } from '../lib/geometry';
import { MAP_PALETTE as C } from '../lib/palette';
import type { MapInsets, MapTarget, MapViewProps } from './Map2D';
import { LabelLayer, LabelProjector, type LabelNodes, type SceneLabel } from './SceneLabels';
import type { Fix } from '../lib/positioning';
import { FitIcon, RotateLeftIcon, RotateRightIcon } from './icons';

/**
 * Butikken som isometrisk modell.
 *
 * Kameraet er ortografisk og låst til fire faste hjørner. Man drar for å flytte
 * og kniper for å zoome – akkurat som i planen – og roterer med knapper i stedet
 * for å kunne snurre modellen ut av kontroll.
 */

/** Plan-koordinater (x, y) → scenekoordinater (x, z). */
const toScene = (p: Vec2, height = 0): [number, number, number] => [p.x, height, p.y];

/** Isometrisk fallvinkel. */
const PITCH = Math.atan(Math.SQRT1_2);
const CAMERA_DISTANCE = 120;
const SLAB = 0.45;

function directionFor(yaw: number) {
  return new THREE.Vector3(
    Math.sin(yaw) * Math.cos(PITCH),
    Math.sin(PITCH),
    Math.cos(yaw) * Math.cos(PITCH),
  ).normalize();
}

/* ---------------------------------------------------------------- innredning */

const PLINTH = 0.12;
const CAP = 0.06;

/**
 * Reolene tegnes som tre instansierte objekter – sokler, kropper og treplater –
 * i stedet for tre hundre enkeltbokser. Det er forskjellen på 40 og 60 bilder i
 * sekundet på en telefon.
 */
function Fixtures({ plan, targets }: { plan: StorePlan; targets: MapTarget[] }) {
  const plinths = useRef<THREE.InstancedMesh>(null);
  const bodies = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);

  const count = plan.fixtures.length;
  const targetFixtures = useMemo(() => new Set(targets.map((t) => t.fixture.id)), [targets]);
  const targetDepartments = useMemo(() => new Set(targets.map((t) => t.departmentId)), [targets]);

  // Plassering endres bare når planen gjør det.
  useEffect(() => {
    const matrix = new THREE.Matrix4();
    const place = (
      mesh: THREE.InstancedMesh | null,
      height: (f: (typeof plan.fixtures)[number]) => number,
      y: (f: (typeof plan.fixtures)[number]) => number,
      inset: number,
    ) => {
      if (!mesh) return;
      plan.fixtures.forEach((f, i) => {
        matrix.compose(
          new THREE.Vector3(f.x + f.w / 2, y(f), f.y + f.d / 2),
          new THREE.Quaternion(),
          new THREE.Vector3(f.w * inset, height(f), f.d * inset),
        );
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };

    const body = (f: (typeof plan.fixtures)[number]) =>
      Math.max(0.1, f.heightCm / 100 - PLINTH - CAP);

    place(plinths.current, () => PLINTH, () => PLINTH / 2, 0.96);
    place(bodies.current, body, (f) => PLINTH + body(f) / 2, 1);
    place(caps.current, () => CAP, (f) => PLINTH + body(f) + CAP / 2, 1.04);
  }, [plan]);

  // Fargene endres når man velger en vare – og forteller hva slags innredning
  // det er: kjøl og frys er kjølige og metalliske, tørrvarer varme med treplate.
  useEffect(() => {
    const colour = new THREE.Color();
    plan.fixtures.forEach((f, i) => {
      const isTarget = targetFixtures.has(f.id);
      const inDept = targetDepartments.has(f.departmentId);
      const cold = f.type === 'cooler' || f.type === 'freezer';
      const base = cold ? C.cold : f.type === 'island' ? C.shelf : C.shelf;
      const shelf = isTarget
        ? C.ink
        : inDept
          ? cold
            ? C.coldDept
            : C.shelfDept
          : targetFixtures.size > 0
            ? cold
              ? C.coldDim
              : C.shelfDim
            : base;
      bodies.current?.setColorAt(i, colour.set(shelf));
      plinths.current?.setColorAt(i, colour.set(isTarget ? C.ink : cold ? C.coldEdge : C.floorEdge));
      caps.current?.setColorAt(
        i,
        colour.set(isTarget ? C.ink : cold ? C.coldTrim : C.wood),
      );
    });
    for (const mesh of [bodies.current, plinths.current, caps.current]) {
      if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [plan, targetFixtures, targetDepartments]);

  /** Glassfronten på kjøl og lokket på frysekummene, tegnet for seg. */
  const glass = useMemo(() => {
    return plan.fixtures
      .filter((f) => f.type === 'cooler' || f.type === 'freezer')
      .map((f) => {
        const height = f.heightCm / 100;
        const chest = f.type === 'freezer' && f.heightCm < 120;
        const n = FACING_VECTOR[f.facing];
        return {
          id: f.id,
          chest,
          // Kummen får lokk på toppen, skapet glass i fronten.
          position: chest
            ? ([f.x + f.w / 2, height + 0.02, f.y + f.d / 2] as const)
            : ([
                f.x + f.w / 2 + (n.x * f.w) / 2,
                height * 0.62,
                f.y + f.d / 2 + (n.y * f.d) / 2,
              ] as const),
          size: chest
            ? ([f.w * 0.92, 0.05, f.d * 0.92] as const)
            : ([
                n.x !== 0 ? 0.04 : f.w * 0.94,
                height * 0.62,
                n.x !== 0 ? f.d * 0.94 : 0.04,
              ] as const),
        };
      });
  }, [plan]);

  return (
    <group>
      {glass.map((piece) => (
        <mesh key={piece.id} position={[...piece.position]}>
          <boxGeometry args={[...piece.size]} />
          <meshStandardMaterial
            color={piece.chest ? '#dbe6ea' : '#c6d5da'}
            transparent
            opacity={piece.chest ? 0.7 : 0.45}
            roughness={0.25}
            metalness={0.1}
          />
        </mesh>
      ))}

      <instancedMesh ref={plinths} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={bodies} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial roughness={0.75} />
      </instancedMesh>
    </group>
  );
}

/**
 * En kasse: benk med treplate, samlebånd og terminal. Nok detalj til at man
 * kjenner den igjen ovenfra.
 */
function Counter({ counter }: { counter: Checkout }) {
  const height = 0.9;
  const along = Math.max(counter.w, counter.d);
  const across = Math.min(counter.w, counter.d);
  const lengthwise = counter.w >= counter.d;

  /** Legger et element langs disken, uansett hvilken vei den står. */
  const along3 = (a: number, b: number): [number, number, number] =>
    lengthwise ? [a, 0, b] : [b, 0, a];
  const size3 = (a: number, b: number, h: number): [number, number, number] =>
    lengthwise ? [a, h, b] : [b, h, a];

  const belt = along3(-along * 0.12, 0);
  const terminal = along3(along * 0.34, 0);

  return (
    <group position={[counter.x + counter.w / 2, 0, counter.y + counter.d / 2]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[counter.w, height, counter.d]} />
        <meshStandardMaterial color={C.shelf} roughness={0.92} />
      </mesh>
      <mesh position={[0, height + 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[counter.w * 1.06, 0.06, counter.d * 1.1]} />
        <meshStandardMaterial color={C.wood} roughness={0.75} />
      </mesh>
      <mesh position={[belt[0], height + 0.08, belt[2]]}>
        <boxGeometry args={size3(along * 0.6, 0.03, across * 0.5)} />
        <meshStandardMaterial color={C.ink} roughness={0.6} />
      </mesh>
      <group position={terminal}>
        <mesh position={[0, height + 0.22, 0]} castShadow>
          <boxGeometry args={size3(0.36, 0.36, 0.34)} />
          <meshStandardMaterial color={C.floorEdge} roughness={0.9} />
        </mesh>
        <mesh position={[0, height + 0.46, 0]} castShadow>
          <boxGeometry args={size3(0.3, 0.22, 0.05)} />
          <meshStandardMaterial color={C.ink} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Checkouts({ plan }: { plan: StorePlan }) {
  return (
    <group>
      {plan.checkouts.map((counter) => (
        <Counter key={counter.id} counter={counter} />
      ))}
    </group>
  );
}

/**
 * Lukkede rom, som lageret bak vareutleveringen. Rommet har tak – skal man ikke
 * inn dit, er det ingen grunn til å se innredningen – og én luke mot butikken.
 */
function Rooms({ plan }: { plan: StorePlan }) {
  const t = 0.24;

  return (
    <group>
      {plan.rooms.map((room) => {
        const h = room.heightCm / 100;
        const { opening } = room;
        const vertical = opening.side === 'west' || opening.side === 'east';
        const wallX = opening.side === 'west' ? room.x : room.x + room.w;
        const wallY = opening.side === 'north' ? room.y : room.y + room.d;

        // Veggen med luken deles i to; de tre andre står hele.
        const before = opening.at;
        const after = (vertical ? room.d : room.w) - opening.at - opening.width;

        const walls: Array<{ key: string; cx: number; cz: number; w: number; d: number }> = vertical
          ? [
              { key: 'a', cx: wallX, cz: room.y + before / 2, w: t, d: before },
              {
                key: 'b',
                cx: wallX,
                cz: room.y + room.d - after / 2,
                w: t,
                d: after,
              },
              { key: 'c', cx: room.x + room.w - (opening.side === 'west' ? 0 : room.w), cz: 0, w: 0, d: 0 },
            ]
          : [];

        // Motstående vegg og de to tverrveggene.
        const rest = vertical
          ? [
              {
                key: 'opp',
                cx: opening.side === 'west' ? room.x + room.w : room.x,
                cz: room.y + room.d / 2,
                w: t,
                d: room.d,
              },
              { key: 'n', cx: room.x + room.w / 2, cz: room.y, w: room.w, d: t },
              { key: 's', cx: room.x + room.w / 2, cz: room.y + room.d, w: room.w, d: t },
            ]
          : [
              {
                key: 'opp',
                cx: room.x + room.w / 2,
                cz: opening.side === 'north' ? room.y + room.d : room.y,
                w: room.w,
                d: t,
              },
              { key: 'w', cx: room.x, cz: room.y + room.d / 2, w: t, d: room.d },
              { key: 'e', cx: room.x + room.w, cz: room.y + room.d / 2, w: t, d: room.d },
              { key: 'a', cx: room.x + before / 2, cz: wallY, w: before, d: t },
              { key: 'b', cx: room.x + room.w - after / 2, cz: wallY, w: after, d: t },
            ];

        const all = [...walls.filter((wall) => wall.w > 0 || wall.d > 0), ...rest];

        return (
          <group key={room.id}>
            {all.map((wall) => (
              <mesh
                key={wall.key}
                position={[wall.cx, h / 2, wall.cz]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[Math.max(wall.w, t), h, Math.max(wall.d, t)]} />
                <meshStandardMaterial color={C.floorEdge} roughness={1} />
              </mesh>
            ))}

            {/* tak */}
            <mesh position={[room.x + room.w / 2, h + 0.06, room.y + room.d / 2]} castShadow receiveShadow>
              <boxGeometry args={[room.w + t, 0.12, room.d + t]} />
              <meshStandardMaterial color={C.shelf} roughness={1} />
            </mesh>

            {/* luken markeres på gulvet foran åpningen */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[
                vertical
                  ? wallX + (opening.side === 'west' ? -0.9 : 0.9)
                  : room.x + opening.at + opening.width / 2,
                0.012,
                vertical
                  ? room.y + opening.at + opening.width / 2
                  : wallY + (opening.side === 'north' ? -0.9 : 0.9),
              ]}
            >
              <planeGeometry args={vertical ? [1.6, opening.width] : [opening.width, 1.6]} />
              <meshBasicMaterial color={C.sage} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Gulvplaten, formet som butikken, med tykkelse så den leser som en modell. */
function Slab({
  plan,
  picking,
  onPick,
}: {
  plan: StorePlan;
  picking: boolean;
  onPick: (point: Vec2) => void;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    plan.outline.forEach((point, index) => {
      if (index === 0) shape.moveTo(point.x, point.y);
      else shape.lineTo(point.x, point.y);
    });
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: SLAB, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);
    return geo;
  }, [plan.outline]);

  return (
    <mesh
      geometry={geometry}
      receiveShadow
      castShadow
      onPointerDown={(event) => {
        if (!picking) return;
        event.stopPropagation();
        onPick({ x: event.point.x, y: event.point.z });
      }}
    >
      <meshStandardMaterial color={C.floor} roughness={1} />
    </mesh>
  );
}

/** Lav brystning langs ytterveggen. */
function Perimeter({ plan, tall }: { plan: StorePlan; tall?: boolean }) {
  const thickness = 0.18;
  // Sett ovenfra holder det med en lav brystning. Går man inne i butikken må
  // veggene stå i full høyde, ellers mister øyet all følelse av størrelse.
  const height = tall ? plan.wallHeightCm / 100 : 0.55;

  const walls = plan.outline.map((point, index) => {
    const next = plan.outline[(index + 1) % plan.outline.length];
    const dx = next.x - point.x;
    const dz = next.y - point.y;
    return {
      key: index,
      length: Math.hypot(dx, dz) + thickness,
      angle: Math.atan2(dz, dx),
      cx: (point.x + next.x) / 2,
      cz: (point.y + next.y) / 2,
    };
  });

  return (
    <group>
      {walls.map((wall) => (
        <mesh
          key={wall.key}
          position={[wall.cx, height / 2, wall.cz]}
          rotation={[0, -wall.angle, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[wall.length, height, thickness]} />
          <meshStandardMaterial color={C.floorEdge} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Inngangen malt på gulvet. */
function Entrances({ plan }: { plan: StorePlan }) {
  return (
    <group>
      {plan.entrances.map((entrance) => (
        <mesh
          key={entrance.id}
          rotation={[-Math.PI / 2, 0, 0]}
          position={toScene(entrance.position, 0.01)}
        >
          <planeGeometry args={[3.2, 1.6]} />
          <meshBasicMaterial color={C.sage} />
        </mesh>
      ))}
    </group>
  );
}

/** Avdelingsnavn og inngang, samlet som etiketter i skjermplanet. */
function useSceneLabels(plan: StorePlan, targets: MapTarget[]): SceneLabel[] {
  const active = new Set(targets.map((t) => t.departmentId));

  return useMemo(() => {
    interface Group {
      dept: string;
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
      top: number;
      facing: string;
    }
    const groups = new Map<string, Group>();

    for (const fixture of plan.fixtures) {
      const key = `${fixture.departmentId}|${fixture.aisle}`;
      const group = groups.get(key) ?? {
        dept: fixture.departmentId,
        minX: Infinity,
        maxX: -Infinity,
        minZ: Infinity,
        maxZ: -Infinity,
        top: 0,
        facing: fixture.facing,
      };
      group.minX = Math.min(group.minX, fixture.x);
      group.maxX = Math.max(group.maxX, fixture.x + fixture.w);
      group.minZ = Math.min(group.minZ, fixture.y);
      group.maxZ = Math.max(group.maxZ, fixture.y + fixture.d);
      group.top = Math.max(group.top, fixture.heightCm / 100);
      groups.set(key, group);
    }

    const labels: SceneLabel[] = [...groups.entries()].map(([key, group]) => {
      const vertical = group.maxZ - group.minZ > group.maxX - group.minX;
      const near = group.facing === 'west' || group.facing === 'north' ? 0.3 : 0.7;
      return {
        key,
        text: plan.departments.find((d) => d.id === group.dept)?.name ?? group.dept,
        position: [
          vertical ? (group.minX + group.maxX) / 2 : group.minX + (group.maxX - group.minX) * near,
          group.top + 0.35,
          vertical ? group.minZ + (group.maxZ - group.minZ) * near : (group.minZ + group.maxZ) / 2,
        ] as [number, number, number],
        muted: targets.length > 0 && !active.has(group.dept),
      };
    });

    const firstCheckout = plan.checkouts[0];
    if (firstCheckout) {
      labels.push({
        key: firstCheckout.id,
        text: 'Kasser',
        position: [firstCheckout.x + firstCheckout.w / 2, 1.6, firstCheckout.y + firstCheckout.d / 2],
        className: 'scene__tag--soft',
      });
    }

    for (const room of plan.rooms) {
      labels.push({
        key: room.id,
        text: room.name,
        position: [room.x + room.w / 2, room.heightCm / 100 + 0.5, room.y + room.d / 2],
        className: 'scene__tag--soft',
      });
    }

    for (const entrance of plan.entrances) {
      labels.push({
        key: entrance.id,
        text: entrance.name,
        position: [entrance.position.x, 0.9, entrance.position.y],
        className: 'scene__tag--soft',
      });
    }

    return labels;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, targets.length, [...active].join(',')]);
}

function Route({ route }: { route: Vec2[] }) {
  return (
    <group>
      <Line points={route.map((p) => toScene(p, 0.04))} color="#ffffff" lineWidth={11} />
      <Line points={route.map((p) => toScene(p, 0.07))} color={C.ink} lineWidth={5} />
    </group>
  );
}

function OriginMarker({ origin }: { origin: Vec2 }) {
  return (
    <group position={toScene(origin, 0.03)}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.52, 0.66, 48]} />
        <meshBasicMaterial color={C.ink} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 32]} />
        <meshBasicMaterial color={C.ink} />
      </mesh>
    </group>
  );
}

/**
 * Målet vises som en stang som rekker over reolene, med en kule i den høyden
 * varen faktisk står. Da ser man både hvor og hvor høyt.
 */
function TargetMarker({ target }: { target: MapTarget }) {
  const shelf = target.heightCm / 100;
  const pole = Math.max(target.fixture.heightCm / 100 + 0.9, shelf + 0.9);

  return (
    <group position={toScene(target.marker)}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.36, 0.46, 40]} />
        <meshBasicMaterial color={C.ink} />
      </mesh>
      <mesh position={[0, pole / 2, 0]}>
        <cylinderGeometry args={[0.026, 0.026, pole, 8]} />
        <meshBasicMaterial color={C.ink} />
      </mesh>
      <mesh position={[0, shelf, 0]}>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshBasicMaterial color={C.ink} />
      </mesh>
    </group>
  );
}

/**
 * Førstepersonsvisning: kameraet står i øyehøyde der kunden er, og ser dit man
 * går. Posisjonen kommer fra `PositionSource` – i dag simulert, senere fra
 * faste punkter i butikken.
 */
function FirstPerson({ fix }: { fix: Fix }) {
  const camera = useRef<THREE.PerspectiveCamera>(null);
  const look = useRef(new THREE.Vector3());
  const eye = 1.65;

  useFrame((_, delta) => {
    const cam = camera.current;
    if (!cam) return;
    const lerp = Math.min(1, delta * 8);
    cam.position.lerp(new THREE.Vector3(fix.point.x, eye, fix.point.y), lerp);
    look.current.lerp(
      new THREE.Vector3(
        // Blikket senkes litt, som når man ser etter varer i hylla.
        fix.point.x + Math.cos(fix.heading) * 6,
        eye - 0.5,
        fix.point.y + Math.sin(fix.heading) * 6,
      ),
      lerp,
    );
    cam.lookAt(look.current);
  });

  return (
    <PerspectiveCamera
      ref={camera}
      makeDefault
      /* 60° leser som et menneskeøye på en telefon. Bredere gjør at hyller ser
         lavere ut enn de er. */
      fov={60}
      near={0.05}
      far={200}
      position={[fix.point.x, eye, fix.point.y]}
    />
  );
}

/* -------------------------------------------------------------------- kamera */

interface RigProps {
  plan: StorePlan;
  targets: MapTarget[];
  route: Vec2[] | null;
  insets: MapInsets;
  yaw: number;
  fitToken: number;
}

function CameraRig({ plan, targets, route, insets, yaw, fitToken }: RigProps) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, size } = useThree();
  const desiredTarget = useRef(new THREE.Vector3());
  const desiredPosition = useRef(new THREE.Vector3());
  const desiredZoom = useRef(20);
  /** Har brukeren flyttet modellen selv? Da lar vi den stå. */
  const moved = useRef(false);
  const lastFitKey = useRef('');

  useEffect(() => {
    const ortho = camera as THREE.OrthographicCamera;
    const key = [
      route ? `r${route.length}` : '',
      targets.map((t) => t.id).join(','),
      yaw.toFixed(2),
      fitToken,
    ].join('|');
    if (key !== lastFitKey.current) {
      lastFitKey.current = key;
      moved.current = false;
    } else if (moved.current) {
      return;
    }

    // Punktene som skal få plass i bildet.
    const focus: Vec2[] =
      route && route.length > 1
        ? route
        : targets.length > 0
          ? targets.map((t) => t.marker)
          : plan.outline;
    const minSpan = targets.length === 1 && !route ? 11 : route ? 14 : 6;

    const box = new THREE.Box2();
    focus.forEach((p) => box.expandByPoint(new THREE.Vector2(p.x, p.y)));
    const centre = box.getCenter(new THREE.Vector2());
    const measured = box.getSize(new THREE.Vector2());
    const spanX = Math.max(measured.x, minSpan);
    const spanZ = Math.max(measured.y, minSpan);

    // Høyden på innredningen teller med når vi skal ramme inn.
    const tallest = focus === plan.outline ? 2.4 : 2.2;

    const direction = directionFor(yaw);
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, direction).normalize();
    const screenUp = new THREE.Vector3().crossVectors(direction, right).normalize();

    // Projiser hjørnene av området på kameraets bildeplan.
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const dx of [-spanX / 2, spanX / 2]) {
      for (const dz of [-spanZ / 2, spanZ / 2]) {
        for (const dy of [0, tallest]) {
          const point = new THREE.Vector3(dx, dy, dz);
          minU = Math.min(minU, point.dot(right));
          maxU = Math.max(maxU, point.dot(right));
          minV = Math.min(minV, point.dot(screenUp));
          maxV = Math.max(maxV, point.dot(screenUp));
        }
      }
    }

    const padding = 14;
    const availableW = Math.max(120, size.width - insets.right - padding * 2);
    const availableH = Math.max(120, size.height - insets.top - insets.bottom - padding * 2);
    const zoom = Math.min(availableW / Math.max(0.1, maxU - minU), availableH / Math.max(0.1, maxV - minV));

    desiredZoom.current = Math.max(4, Math.min(90, zoom));
    desiredTarget.current.set(centre.x, tallest / 2, centre.y);
    desiredPosition.current
      .copy(desiredTarget.current)
      .addScaledVector(direction, CAMERA_DISTANCE);

    ortho.near = -CAMERA_DISTANCE * 2;
    ortho.far = CAMERA_DISTANCE * 4;
    // Forskyv bildet forbi søkefelt og ark.
    ortho.setViewOffset(
      size.width,
      size.height,
      insets.right / 2,
      (insets.bottom - insets.top) / 2,
      size.width,
      size.height,
    );
    ortho.updateProjectionMatrix();
  }, [plan, targets, route, yaw, insets, size.width, size.height, camera, fitToken]);

  useFrame((_, delta) => {
    if (moved.current) {
      controls.current?.update();
      return;
    }
    const ortho = camera as THREE.OrthographicCamera;
    // Står kameraet der det skal, er det ingenting å regne på.
    const settled =
      camera.position.distanceToSquared(desiredPosition.current) < 0.0004 &&
      Math.abs(ortho.zoom - desiredZoom.current) < 0.01;
    if (settled) {
      controls.current?.update();
      return;
    }
    const lerp = Math.min(1, delta * 3.4);
    camera.position.lerp(desiredPosition.current, lerp);
    ortho.zoom += (desiredZoom.current - ortho.zoom) * lerp;
    ortho.updateProjectionMatrix();
    if (controls.current) {
      controls.current.target.lerp(desiredTarget.current, lerp);
      controls.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controls}
      /* Fallvinkelen er låst, så modellen holder seg isometrisk uansett hvordan
         man snurrer den. To fingre roterer og zoomer, én finger flytter. */
      enableRotate
      minPolarAngle={Math.PI / 2 - PITCH}
      maxPolarAngle={Math.PI / 2 - PITCH}
      enableDamping
      dampingFactor={0.14}
      rotateSpeed={0.7}
      zoomSpeed={0.9}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      }}
      touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      onStart={() => {
        moved.current = true;
      }}
    />
  );
}

/* ---------------------------------------------------------------------- lys */

function Lighting({ plan, targets }: { plan: StorePlan; targets: MapTarget[] }) {
  const span = Math.max(plan.width, plan.depth);
  const { gl } = useThree();

  // Butikken står stille. Skyggene trenger bare regnes ut når noe faktisk
  // endrer seg, ikke seksti ganger i sekundet.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl, plan, targets]);

  return (
    <>
      <ambientLight intensity={1.35} />
      <directionalLight
        castShadow
        position={[plan.width * 0.9, span * 1.1, plan.depth * 1.25]}
        intensity={1.5}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
        shadow-camera-near={0.1}
        shadow-camera-far={span * 4}
      />
      <directionalLight position={[-span, span * 0.6, -span * 0.4]} intensity={0.35} />
    </>
  );
}

/* --------------------------------------------------------------------- scene */

function Scene({
  plan,
  targets,
  route,
  origin,
  picking,
  insets,
  onPick,
  fix,
  showLabels = true,
  yaw,
  fitToken,
  labels,
  labelNodes,
}: MapViewProps & {
  yaw: number;
  fitToken: number;
  labels: SceneLabel[];
  labelNodes: LabelNodes;
}) {

  return (
    <>
      <color attach="background" args={[C.backdrop]} />
      <Lighting plan={plan} targets={targets} />

      {/* underlaget modellen står på */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[plan.width / 2, -SLAB, plan.depth / 2]}
        receiveShadow
      >
        <planeGeometry args={[plan.width * 6, plan.depth * 6]} />
        <meshStandardMaterial color={C.backdrop} roughness={1} />
      </mesh>

      {/* fanger opp trykk utenfor butikken, så brukeren får beskjed */}
      {picking && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[plan.width / 2, -SLAB + 0.01, plan.depth / 2]}
          onPointerDown={(event) => {
            event.stopPropagation();
            onPick({ x: event.point.x, y: event.point.z });
          }}
        >
          <planeGeometry args={[plan.width * 5, plan.depth * 5]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      <Slab plan={plan} picking={picking} onPick={onPick} />

      {/* Tak, bare når man går inne – da blir rommet et rom. */}
      {fix && (
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[plan.width / 2, plan.wallHeightCm / 100, plan.depth / 2]}
        >
          <planeGeometry args={[plan.width * 1.2, plan.depth * 1.2]} />
          <meshStandardMaterial color="#f4f3f0" roughness={1} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Perimeter plan={plan} tall={Boolean(fix)} />
      <Entrances plan={plan} />
      <Rooms plan={plan} />
      <Checkouts plan={plan} />
      <Fixtures plan={plan} targets={targets} />
      {route && route.length > 1 && <Route route={route} />}
      {origin && <OriginMarker origin={origin} />}
      {targets.map((item) => (
        <TargetMarker key={item.id} target={item} />
      ))}

      {showLabels && <LabelProjector labels={labels} nodes={labelNodes} />}
      {fix ? (
        <FirstPerson fix={fix} />
      ) : (
        <CameraRig
        plan={plan}
        targets={targets}
        route={route}
        insets={insets}
          yaw={yaw}
          fitToken={fitToken}
        />
      )}
    </>
  );
}

export function Map3D(props: MapViewProps) {
  const { insets, picking } = props;
  // Fire faste hjørner å se butikken fra.
  const [corner, setCorner] = useState(0);
  const [fitToken, setFitToken] = useState(0);
  const yaw = Math.PI / 4 + (corner * Math.PI) / 2;
  const labelNodes = useRef(new Map<string, HTMLDivElement>());
  const labels = useSceneLabels(props.plan, props.targets);

  return (
    <div className={`map map--scene${picking ? ' map--picking' : ''}`}>
      <Canvas
        className="map__canvas"
        dpr={[1, 2]}
        shadows
        flat /* ingen tone mapping – hvitt skal være hvitt */
        orthographic
        camera={{ position: [40, 40, 40], zoom: 18, near: -400, far: 800 }}
      >
        <Scene
          {...props}
          yaw={yaw}
          fitToken={fitToken}
          labels={labels}
          labelNodes={labelNodes}
        />
      </Canvas>

      {props.showLabels !== false && <LabelLayer labels={labels} nodes={labelNodes} />}

      {!props.fix && (
      <div className="map__zoom" style={{ right: 12 + insets.right, bottom: 16 + insets.bottom }}>
        <button
          type="button"
          aria-label="Snu mot venstre"
          onClick={() => setCorner((c) => (c + 3) % 4)}
        >
          <RotateLeftIcon />
        </button>
        <button
          type="button"
          aria-label="Snu mot høyre"
          onClick={() => setCorner((c) => (c + 1) % 4)}
        >
          <RotateRightIcon />
        </button>
        <button type="button" aria-label="Tilpass visningen" onClick={() => setFitToken((t) => t + 1)}>
          <FitIcon />
        </button>
      </div>
      )}
    </div>
  );
}
