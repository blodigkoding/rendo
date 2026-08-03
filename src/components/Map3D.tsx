import { useEffect, useRef, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Edges, Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { StorePlan, Vec2 } from '../data/types';
import type { MapTarget } from './Map2D';

interface Props {
  plan: StorePlan;
  target: MapTarget | null;
  route: Vec2[] | null;
  origin: Vec2 | null;
  picking: boolean;
  onPick: (point: Vec2) => void;
}

/** Plan-koordinater (x, y) → scenekoordinater (x, z). */
const toScene = (p: Vec2, height = 0): [number, number, number] => [p.x, height, p.y];

const INK = '#0b0b0c';
const SHELF = '#ededef';
const SHELF_DIM = '#f5f5f6';
const EDGE = '#c6c6cb';

function Fixtures({ plan, target }: { plan: StorePlan; target: MapTarget | null }) {
  return (
    <group>
      {plan.fixtures.map((fixture) => {
        const isTarget = target?.fixture.id === fixture.id;
        const inDept = target && fixture.departmentId === target.departmentId;
        const height = fixture.heightCm / 100;
        const color = isTarget ? INK : inDept ? '#e2e2e5' : target ? SHELF_DIM : SHELF;
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

/** Lav sokkel rundt salgsflaten – gir modellen en kant uten å stenge for utsikten. */
function Perimeter({ plan }: { plan: StorePlan }) {
  const t = 0.14;
  const h = 0.36;
  const walls: Array<[number, number, number, number]> = [
    [plan.width / 2, plan.depth - t / 2, plan.width, t],
    [plan.width / 2, t / 2, plan.width, t],
    [t / 2, plan.depth / 2, t, plan.depth],
    [plan.width - t / 2, plan.depth / 2, t, plan.depth],
  ];
  return (
    <group>
      {walls.map(([cx, cz, w, d], i) => (
        <mesh key={i} position={[cx, h / 2, cz]}>
          <boxGeometry args={[w, h, d]} />
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
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[plan.width / 2, 0, plan.depth / 2]}
      onPointerDown={(event) => {
        if (!picking) return;
        event.stopPropagation();
        onPick({ x: event.point.x, y: event.point.z });
      }}
    >
      <planeGeometry args={[plan.width, plan.depth]} />
      <meshStandardMaterial color="#ffffff" roughness={1} metalness={0} />
    </mesh>
  );
}

function Route({ route }: { route: Vec2[] }) {
  const points = route.map((p) => toScene(p, 0.03));
  return (
    <group>
      <Line points={points} color="#ffffff" lineWidth={9} />
      <Line points={points} color={INK} lineWidth={4} />
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
  target,
  route,
}: {
  plan: StorePlan;
  target: MapTarget | null;
  route: Vec2[] | null;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();
  const desiredTarget = useRef(new THREE.Vector3(plan.width / 2, 0, plan.depth / 2));
  const desiredPosition = useRef(new THREE.Vector3(plan.width / 2, 26, plan.depth + 20));

  useEffect(() => {
    if (route && route.length > 1) {
      const box = new THREE.Box3();
      route.forEach((p) => box.expandByPoint(new THREE.Vector3(p.x, 0, p.y)));
      const centre = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const reach = Math.max(size.x, size.z, 8);
      desiredTarget.current.set(centre.x, 0.8, centre.z);
      desiredPosition.current.set(centre.x, reach * 0.95 + 6, centre.z + reach * 0.9 + 8);
    } else if (target) {
      desiredTarget.current.set(target.marker.x, 1.2, target.marker.y);
      desiredPosition.current.set(target.marker.x + 3, 9, target.marker.y + 12);
    } else {
      desiredTarget.current.set(plan.width / 2, 0, plan.depth / 2);
      desiredPosition.current.set(plan.width / 2, 26, plan.depth + 20);
    }
  }, [plan, target, route]);

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

export function Map3D({ plan, target, route, origin, picking, onPick }: Props) {
  return (
    <div className={`map${picking ? ' map--picking' : ''}`}>
      <Canvas
        className="map__canvas"
        dpr={[1, 2]}
        camera={{ fov: 38, near: 0.1, far: 400, position: [plan.width / 2, 26, plan.depth + 20] }}
      >
        <color attach="background" args={['#ffffff']} />
        <fog attach="fog" args={['#ffffff', 60, 150]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[18, 34, 12]} intensity={2.1} />
        <directionalLight position={[-20, 18, -10]} intensity={0.6} />

        <Floor plan={plan} picking={picking} onPick={onPick} />
        <Perimeter plan={plan} />
        <Checkouts plan={plan} />
        <Fixtures plan={plan} target={target} />
        {route && route.length > 1 && <Route route={route} />}
        {origin && <OriginMarker origin={origin} />}
        {target && <TargetMarker target={target} />}

        <CameraRig plan={plan} target={target} route={route} />
      </Canvas>
    </div>
  );
}
