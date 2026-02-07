import type { DutyCycle } from '@/types/engine';

export type { DutyCycle };

export interface PulseWaveSet {
  0.125: PeriodicWave;
  0.25: PeriodicWave;
  0.5: PeriodicWave;
  0.75: PeriodicWave;
}

export function createPulseWave(ctx: AudioContext, dutyCycle: number): PeriodicWave {
  const real = new Float32Array(256);
  const imag = new Float32Array(256);
  for (let n = 1; n < 256; n++) {
    imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * dutyCycle);
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

export function createNESPulseWaves(ctx: AudioContext): PulseWaveSet {
  return {
    0.125: createPulseWave(ctx, 0.125),
    0.25: createPulseWave(ctx, 0.25),
    0.5: createPulseWave(ctx, 0.5),
    0.75: createPulseWave(ctx, 0.75),
  };
}
