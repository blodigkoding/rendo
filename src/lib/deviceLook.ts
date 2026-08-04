import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Å se seg rundt med telefonen.
 *
 * I førstepersonsvisningen holder du telefonen opp foran deg. Snur du deg mot
 * hylla, skal bildet snu seg med deg – det er slik man orienterer seg i en
 * butikk, ikke ved å dra med fingeren.
 *
 * Vi bruker `deviceorientation`, som gir telefonens rotasjon i forhold til
 * bakken. Kompassretningen kan vi ikke bruke direkte: butikkplanen vet ikke
 * hvor nord er. Derfor låser vi et nullpunkt idet du slår på funksjonen, og
 * legger *endringen* oppå retningen du går i. Da peker bildet dit du peker
 * telefonen, uansett hvordan butikken ligger i terrenget.
 */

export interface Look {
  /** Endring i retning, i radianer, mot klokka sett ovenfra. */
  yaw: number;
  /** Endring opp/ned, i radianer. Positivt er oppover. */
  pitch: number;
}

type Quat = [x: number, y: number, z: number, w: number];

const DEG = Math.PI / 180;

function multiply(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

/**
 * Telefonens rotasjon som kvaternion. Rekkefølgen er den W3C fastsetter for
 * `deviceorientation`: alfa om z, beta om x, gamma om y, satt sammen som YXZ.
 * Deretter vippes referansen fra «skjermen flatt på bordet» til «skjermen mot
 * ansiktet», og til slutt korrigeres for hvordan telefonen holdes.
 */
function orientationQuaternion(alpha: number, beta: number, gamma: number, screen: number): Quat {
  const c1 = Math.cos(beta / 2);
  const s1 = Math.sin(beta / 2);
  const c2 = Math.cos(alpha / 2);
  const s2 = Math.sin(alpha / 2);
  const c3 = Math.cos(-gamma / 2);
  const s3 = Math.sin(-gamma / 2);

  // YXZ
  let q: Quat = [
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 - s1 * s2 * c3,
    c1 * c2 * c3 + s1 * s2 * s3,
  ];

  // −90° om x: skjermen står opp, ikke ned.
  q = multiply(q, [-Math.SQRT1_2, 0, 0, Math.SQRT1_2]);
  // Skjermrotasjon: liggende telefon skal ikke gi skjev horisont.
  q = multiply(q, [0, 0, Math.sin(-screen / 2), Math.cos(-screen / 2)]);
  return q;
}

/** Retningen telefonens bakside peker i, som yaw og pitch. */
function aim(q: Quat): Look {
  const [x, y, z, w] = q;
  // Kameraets blikkretning er −z rotert med q.
  const fx = -(2 * (x * z + w * y));
  const fy = -(2 * (y * z - w * x));
  const fz = -(1 - 2 * (x * x + y * y));
  return { yaw: Math.atan2(fx, -fz), pitch: Math.asin(Math.max(-1, Math.min(1, fy))) };
}

function screenAngle(): number {
  const angle = window.screen?.orientation?.angle ?? 0;
  return angle * DEG;
}

interface Permission {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
}

/** Har telefonen sensor i det hele tatt? */
export function deviceLookSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

export interface DeviceLook {
  supported: boolean;
  active: boolean;
  /** Nekter telefonen oss tilgang, sier vi fra i stedet for å bare la være. */
  denied: boolean;
  /** Leses i animasjonsløkka, så avlesningen ikke gir en ny render per måling. */
  look: React.RefObject<Look>;
  /** Må kalles fra et trykk – iOS spør om lov først. */
  toggle: () => void;
  /** Nullstiller retningen til der telefonen peker nå. */
  recenter: () => void;
}

export function useDeviceLook(enabled: boolean): DeviceLook {
  const [active, setActive] = useState(false);
  const [denied, setDenied] = useState(false);
  const look = useRef<Look>({ yaw: 0, pitch: 0 });
  const zero = useRef<Look | null>(null);
  const supported = deviceLookSupported();

  // Går man ut av førstepersonsvisningen, slås sensoren av.
  useEffect(() => {
    if (!enabled) {
      setActive(false);
      look.current = { yaw: 0, pitch: 0 };
      zero.current = null;
    }
  }, [enabled]);

  useEffect(() => {
    if (!active) return;

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha === null || event.beta === null || event.gamma === null) return;
      const q = orientationQuaternion(
        event.alpha * DEG,
        event.beta * DEG,
        event.gamma * DEG,
        screenAngle(),
      );
      const now = aim(q);
      if (!zero.current) zero.current = now;

      // Retningen pakkes til (−π, π] så den ikke hopper et helt omdreining.
      let yaw = now.yaw - zero.current.yaw;
      while (yaw > Math.PI) yaw -= 2 * Math.PI;
      while (yaw < -Math.PI) yaw += 2 * Math.PI;

      look.current = {
        yaw,
        // Blikket begrenses – man bøyer ikke nakken rett opp i en butikk.
        pitch: Math.max(-1.1, Math.min(1.1, now.pitch - zero.current.pitch)),
      };
    };

    window.addEventListener('deviceorientation', onOrientation);
    return () => window.removeEventListener('deviceorientation', onOrientation);
  }, [active]);

  const toggle = useCallback(() => {
    if (active) {
      setActive(false);
      look.current = { yaw: 0, pitch: 0 };
      zero.current = null;
      return;
    }

    const request = (DeviceOrientationEvent as unknown as Permission).requestPermission;
    if (typeof request === 'function') {
      // iOS gir bare tilgang når spørsmålet kommer rett fra et trykk.
      request()
        .then((result) => {
          if (result === 'granted') {
            zero.current = null;
            setActive(true);
            setDenied(false);
          } else {
            setDenied(true);
          }
        })
        .catch(() => setDenied(true));
      return;
    }

    zero.current = null;
    setActive(true);
  }, [active]);

  const recenter = useCallback(() => {
    zero.current = null;
    look.current = { yaw: 0, pitch: 0 };
  }, []);

  return { supported, active, denied, look, toggle, recenter };
}
