import { useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Edges, Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { StorePlan, Vec2 } from '../data/types';
import type { MapInsets, MapTarget, MapViewProps } from './Map2D';

/** Plan-koordinater (x, y) → scenekoordinater (x, z). */
const toScene = (p: Vec2, height = 0): [number, number, number] => [p.x, height, p.y];

const INK = '#0b0b0c';
const SHELF = '#ededef';
const SHELF_DIM = '#f5f5f6';
const EDGE = '#c6c6cb';

function Fixtures({ plan, targets }: { plan: StorePlan; targets: MapTarget[] }) {
  const targetFixtures = new Set(targets.map((t) => t.fixture.id));
  const targetDepartments = new Set(targets.map((t) => t.departmentId));
  const hasTargets = targets.length > 0;

  return (
    <group>
      {plan.fixtures.map((fixture) => {
        const isTarget = targetFixtures.has(fixture.id);
        const inDept = targetDepartments.has(fixture.departmentId);
        const height = fixture.heightCm / 100;
        const color = isTarget ? INK : inDept ? '#e2e2e5' : hasTargets ? SHELF_DIM : SHELF;
        return (
          <mesh
            key={fixture.id}
            position={[fixture.x + fixture.w / 2, height / 2, fixture.y + fixture.d / 2]}
          >
            <boxGeometry args={[fixture.w, height, fixture.d]} />
            <meshStandardMaterial color={color} roughness={0.95} metalness={0} />
            <Edges threshold={20} color={isTarget ? INK : EDGE} />
          </mesh>
        );
      })}
    </group>
  );
}

function Checkouts({ plan }: { plan: StorePlan }) {
  return (
    <group>
      {plan.checkouts.map((checkout) => (
        <mesh
          key={checkout.id}
          position={[checkout.x + checkout.w / 2, 0.5, checkout.y + checkout.d / 2]}
        >
          <boxGeometry args={[checkout.w, 1, checkout.d]} />
          <meshStandardMaterial color="#f3f3f4" roughness={0.95} metalness={0} />
          <Edges threshold={20} color={EDGE} />
        </mesh>
      ))}
    </group>
  );
}

/** Lav sokkel langs ytterveggen – gir modellen en kant uten å stenge utsikten. */
function Perimeter({ plan }: { plan: StorePlan }) {
  const thickness = 0.16;
  const height = 0.38;

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
        >
          <boxGeometry args={[wall.length, height, thickness]} />
          <meshStandardMaterial color="#f0f0f1" roughness={1} metalness={0} />
          <Edges threshold={20} color="#a9a9b0" />
        </mesh>
      ))}
    </group>
  );
}

function Floor({
  plan,
  picking,
  onPick,
}: {
  plan: StorePlan;
  picking: boolean;
  onPick: (point: Vec2) => void;
}) {
  // Gulvet følger butikkens faktiske form.
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    plan.outline.forEach((point, index) => {
      if (index === 0) shape.moveTo(point.x, point.y);
      else shape.lineTo(point.x, point.y);
    });
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [plan.outline]);

  return (
    <mesh
      geometry={geometry}
      onPointerDown={(event) => {
        if (!picking) return;
        event.stopPropagation();
        onPick({ x: event.point.x, y: event.point.z });
      }}
    >
      {/* Rent hvitt gulv – uavhengig av lyssettingen. */}
      <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
    </mesh>
  );
}

/**
 * Avdelingsnavn som skilt oppå reolene. De ligger flatt i modellen, langs raden
 * de hører til, slik at de aldri legger seg oppå hverandre slik svevende
 * etiketter gjør.
 */
function DepartmentLabels({ plan, targets }: { plan: StorePlan; targets: MapTarget[] }) {
  const active = new Set(targets.map((t) => t.departmentId));

  const labels = useMemo(() => {
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

    return [...groups.entries()].map(([key, group]) => {
      const vertical = group.maxZ - group.minZ > group.maxX - group.minX;
      // De to sidene av samme rad forskyves langs raden.
      const near = group.facing === 'west' || group.facing === 'north' ? 0.25 : 0.75;
      return {
        key,
        dept: group.dept,
        name: plan.departments.find((d) => d.id === group.dept)?.name ?? group.dept,
        x: vertical ? (group.minX + group.maxX) / 2 : group.minX + (group.maxX - group.minX) * near,
        z: vertical ? group.minZ + (group.maxZ - group.minZ) * near : (group.minZ + group.maxZ) / 2,
        y: group.top + 0.06,
        vertical,
      };
    });
  }, [plan]);

  return (
    <group>
      {labels.map((label) => (
        <Html
          key={label.key}
          transform
          sprite={false}
          position={[label.x, label.y, label.z]}
          rotation={[-Math.PI / 2, 0, label.vertical ? -Math.PI / 2 : 0]}
          /* drei deler CSS-piksler på 40 i transform-modus – dette gir ~0,5 m høy skrift. */
          scale={2}
          zIndexRange={[1, 0]}
          pointerEvents="none"
        >
          <div
            className={`scene__dept${active.has(label.dept) ? ' scene__dept--active' : ''}`}
            style={{ opacity: targets.length && !active.has(label.dept) ? 0.35 : 1 }}
          >
            {label.name}
          </div>
        </Html>
      ))}
    </group>
  );
}

/**
 * Forskyver bildet slik at det som er valgt ikke havner bak søkefeltet eller
 * produktpanelet.
 */
function ViewInsets({ insets }: { insets: MapInsets }) {
  const { camera, size } = useThree();

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.setViewOffset(
      size.width,
      size.height,
      insets.right / 2,
      (insets.bottom - insets.top) / 2,
      size.width,
      size.height,
    );
    perspective.updateProjectionMatrix();
    return () => {
      perspective.clearViewOffset();
    };
  }, [camera, size.width, size.height, insets.top, insets.right, insets.bottom]);

  return null;
}

function Route({ route }: { route: Vec2[] }) {
  return (
    <group>
      {/* Hvit halo litt under den sorte linja, ellers slåss de om dybden. */}
      <Line points={route.map((p) => toScene(p, 0.02))} color="#ffffff" lineWidth={10} />
      <Line points={route.map((p) => toScene(p, 0.05))} color={INK} lineWidth={4} />
    </group>
  );
}

function OriginMarker({ origin }: { origin: Vec2 }) {
  return (
    <group position={toScene(origin, 0.02)}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.62, 48]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.26, 32]} />
        <meshBasicMaterial color={INK} />
      </mesh>
    </group>
  );
}

/** Markerer varen i riktig høyde – det er her 3D faktisk hjelper. */
function TargetMarker({ target }: { target: MapTarget }) {
  const height = target.heightCm / 100;
  return (
    <group position={toScene(target.marker)}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.018, 0.018, height, 8]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <mesh position={[0, height, 0]}>
        <sphereGeometry args={[0.11, 20, 20]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.34, 0.42, 40]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <Html position={[0, height + 0.55, 0]} center distanceFactor={22} zIndexRange={[2, 0]}>
        <div className="scene__label scene__label--target">
          {target.stop ? `${target.stop} · ` : ''}
          {target.fixture.code} · {Math.round(target.heightCm)} cm
        </div>
      </Html>
    </group>
  );
}

/**
 * Beveger kameraet mykt mot det som er valgt: hele butikken når ingenting er
 * valgt, ellers varen eller ruten.
 */
function CameraRig({
  plan,
  targets,
  route,
}: {
  plan: StorePlan;
  targets: MapTarget[];
  route: Vec2[] | null;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, size } = useThree();
  const desiredTarget = useRef(new THREE.Vector3(plan.width / 2, 0, plan.depth / 2));
  const desiredPosition = useRef(new THREE.Vector3(plan.width / 2, 26, plan.depth + 20));

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;

    /** Avstanden som trengs for at et område av gitt størrelse får plass i bildet. */
    const distanceFor = (width: number, depth: number) => {
      const fov = (perspective.fov * Math.PI) / 180;
      const aspect = Math.max(0.35, size.width / Math.max(1, size.height));
      const needed = Math.max(depth, width / aspect);
      return needed / 2 / Math.tan(fov / 2);
    };

    /** Ser skrått ned på et område, med litt luft rundt. */
    const framePoints = (points: Vec2[], minSpan: number, margin = 1.35) => {
      const box = new THREE.Box3();
      points.forEach((p) => box.expandByPoint(new THREE.Vector3(p.x, 0, p.y)));
      const centre = box.getCenter(new THREE.Vector3());
      const measured = box.getSize(new THREE.Vector3());
      const width = Math.max(measured.x, minSpan);
      const depth = Math.max(measured.z, minSpan);
      // Skrå vinkel gjør at flaten dekker mer på høykant enn i dybden.
      const pitch = Math.PI / 3.1;
      const distance = distanceFor(width, depth * Math.sin(pitch) + 2) * margin;
      desiredTarget.current.set(centre.x, 0.8, centre.z);
      desiredPosition.current.set(
        centre.x,
        Math.max(6, distance * Math.sin(pitch)),
        centre.z + distance * Math.cos(pitch),
      );
    };

    if (route && route.length > 1) {
      // Korte ruter skal ikke gi et kamera som klistrer seg inntil hylla.
      framePoints(route, 13);
    } else if (targets.length === 1) {
      const { marker } = targets[0];
      framePoints([marker], 9, 1.1);
    } else if (targets.length > 1) {
      framePoints(
        targets.map((t) => t.marker),
        13,
      );
    } else {
      framePoints(plan.outline, 10, 1.12);
    }
  }, [plan, targets, route, camera, size.width, size.height]);

  useFrame((_, delta) => {
    const lerp = Math.min(1, delta * 2.6);
    camera.position.lerp(desiredPosition.current, lerp);
    if (controls.current) {
      controls.current.target.lerp(desiredTarget.current, lerp);
      controls.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.12}
      minDistance={5}
      maxDistance={70}
      maxPolarAngle={Math.PI / 2.15}
    />
  );
}

export function Map3D({ plan, targets, route, origin, picking, insets, onPick }: MapViewProps) {
  return (
    <div className={`map${picking ? ' map--picking' : ''}`}>
      <Canvas
        className="map__canvas"
        dpr={[1, 2]}
        flat /* ingen tone mapping – hvitt skal være hvitt */
        camera={{ fov: 38, near: 0.1, far: 400, position: [plan.width / 2, 26, plan.depth + 20] }}
      >
        <color attach="background" args={['#ffffff']} />
        <ambientLight intensity={1.9} />
        <directionalLight position={[18, 34, 12]} intensity={1.5} />
        <directionalLight position={[-20, 18, -10]} intensity={0.5} />

        {/* Fanger opp trykk utenfor butikken, så brukeren får beskjed. */}
        {picking && (
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[plan.width / 2, -0.05, plan.depth / 2]}
            onPointerDown={(event) => {
              event.stopPropagation();
              onPick({ x: event.point.x, y: event.point.z });
            }}
          >
            <planeGeometry args={[plan.width * 4, plan.depth * 4]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}

        <Floor plan={plan} picking={picking} onPick={onPick} />
        <Perimeter plan={plan} />
        <Checkouts plan={plan} />
        <Fixtures plan={plan} targets={targets} />
        <DepartmentLabels plan={plan} targets={targets} />
        {route && route.length > 1 && <Route route={route} />}
        {origin && <OriginMarker origin={origin} />}
        {targets.map((item) => (
          <TargetMarker key={item.id} target={item} />
        ))}

        <CameraRig plan={plan} targets={targets} route={route} />
        <ViewInsets insets={insets} />
      </Canvas>
    </div>
  );
}
