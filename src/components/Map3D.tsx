import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Checkout, Fixture, StorePlan, Vec2 } from '../data/types';
import { MAP_PALETTE as C } from '../lib/palette';
import type { MapInsets, MapTarget, MapViewProps } from './Map2D';
import { LabelLayer, LabelProjector, type LabelNodes, type SceneLabel } from './SceneLabels';
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

function FixtureMesh({
  fixture,
  state,
}: {
  fixture: Fixture;
  state: 'plain' | 'dim' | 'dept' | 'target';
}) {
  const height = fixture.heightCm / 100;
  const plinth = 0.12;
  const cap = 0.06;
  const body = Math.max(0.1, height - plinth - cap);
  const cx = fixture.x + fixture.w / 2;
  const cz = fixture.y + fixture.d / 2;

  const bodyColor =
    state === 'target' ? C.ink : state === 'dept' ? C.shelfDept : state === 'dim' ? C.shelfDim : C.shelf;

  return (
    <group position={[cx, 0, cz]}>
      {/* sokkel */}
      <mesh position={[0, plinth / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[fixture.w * 0.96, plinth, fixture.d * 0.96]} />
        <meshStandardMaterial color={state === 'target' ? C.ink : C.floorEdge} roughness={0.9} />
      </mesh>

      {/* selve reolen */}
      <mesh position={[0, plinth + body / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[fixture.w, body, fixture.d]} />
        <meshStandardMaterial color={bodyColor} roughness={0.92} />
      </mesh>

      {/* treplate på topp – gir varmen fra referansen og markerer overkanten */}
      <mesh position={[0, plinth + body + cap / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[fixture.w * 1.04, cap, fixture.d * 1.04]} />
        <meshStandardMaterial
          color={state === 'target' ? C.ink : C.wood}
          roughness={0.75}
        />
      </mesh>
    </group>
  );
}

function Fixtures({ plan, targets }: { plan: StorePlan; targets: MapTarget[] }) {
  const targetFixtures = new Set(targets.map((t) => t.fixture.id));
  const targetDepartments = new Set(targets.map((t) => t.departmentId));
  const hasTargets = targets.length > 0;

  return (
    <group>
      {plan.fixtures.map((fixture) => (
        <FixtureMesh
          key={fixture.id}
          fixture={fixture}
          state={
            targetFixtures.has(fixture.id)
              ? 'target'
              : targetDepartments.has(fixture.departmentId)
                ? 'dept'
                : hasTargets
                  ? 'dim'
                  : 'plain'
          }
        />
      ))}
    </group>
  );
}

/**
 * Kassene og vareutleveringen.
 *
 * En kasse er en benk med samlebånd, terminal og skjerm – nok detalj til at man
 * kjenner den igjen ovenfra. Vareutleveringen er en bredere disk med luke bak.
 */
function Counter({ counter }: { counter: Checkout }) {
  const isPickup = counter.kind === 'pickup';
  const height = isPickup ? 1.05 : 0.9;
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
      {/* benken */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[counter.w, height, counter.d]} />
        <meshStandardMaterial color={C.shelf} roughness={0.92} />
      </mesh>

      {/* benkeplate i tre */}
      <mesh position={[0, height + 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[counter.w * 1.06, 0.06, counter.d * 1.1]} />
        <meshStandardMaterial color={C.wood} roughness={0.75} />
      </mesh>

      {isPickup ? (
        <>
          {/* luke bak disken */}
          <mesh
            position={along3(0, -across * 0.9)}
            castShadow
            receiveShadow
          >
            <boxGeometry args={size3(along * 0.9, 0.18, 2.1)} />
            <meshStandardMaterial color={C.floorEdge} roughness={1} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <boxGeometry args={size3(along * 0.5, 0.05, 0.06)} />
            <meshBasicMaterial color={C.sage} />
          </mesh>
        </>
      ) : (
        <>
          {/* samlebånd */}
          <mesh position={[belt[0], height + 0.08, belt[2]]}>
            <boxGeometry args={size3(along * 0.6, 0.03, across * 0.5)} />
            <meshStandardMaterial color={C.ink} roughness={0.6} />
          </mesh>
          {/* terminal med skjerm */}
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
        </>
      )}
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
function Perimeter({ plan }: { plan: StorePlan }) {
  const thickness = 0.18;
  const height = 0.55;

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

    for (const counter of plan.checkouts) {
      if (counter.kind === 'checkout' && counter.id !== 'co-1') continue;
      labels.push({
        key: counter.id,
        text: counter.kind === 'checkout' ? 'Kasser' : counter.name,
        position: [counter.x + counter.w / 2, 1.6, counter.y + counter.d / 2],
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
      enableRotate={false}
      enableDamping
      dampingFactor={0.16}
      zoomSpeed={0.9}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
      onStart={() => {
        moved.current = true;
      }}
    />
  );
}

/* ---------------------------------------------------------------------- lys */

function Lighting({ plan }: { plan: StorePlan }) {
  const span = Math.max(plan.width, plan.depth);
  return (
    <>
      <ambientLight intensity={1.35} />
      <directionalLight
        castShadow
        position={[plan.width * 0.9, span * 1.1, plan.depth * 1.25]}
        intensity={1.5}
        shadow-mapSize={[2048, 2048]}
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
      <Lighting plan={plan} />

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
      <Perimeter plan={plan} />
      <Entrances plan={plan} />
      <Checkouts plan={plan} />
      <Fixtures plan={plan} targets={targets} />
      {route && route.length > 1 && <Route route={route} />}
      {origin && <OriginMarker origin={origin} />}
      {targets.map((item) => (
        <TargetMarker key={item.id} target={item} />
      ))}

      <LabelProjector labels={labels} nodes={labelNodes} />
      <CameraRig
        plan={plan}
        targets={targets}
        route={route}
        insets={insets}
        yaw={yaw}
        fitToken={fitToken}
      />
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

      <LabelLayer labels={labels} nodes={labelNodes} />

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
    </div>
  );
}
