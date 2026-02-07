'use client';

import { useEffect, useCallback, useRef } from 'react';
import { nesEngine } from '@/audio/nes-engine';
import { INSTRUMENTS } from '@/audio/instruments';
import { useDAWStore } from '@/store/daw-store';
import type { NESChannel } from '@/types/engine';

interface UseNESEngineReturn {
  init: () => void;
  playNote: (channel: NESChannel, midiNote: number, velocity: number, instrumentId: string) => number;
  stopNote: (voiceId: number) => void;
  setVolume: (volume: number) => void;
  mute: (muted: boolean) => void;
  isReady: boolean;
}

export function useNESEngine(): UseNESEngineReturn {
  const setEngineReady = useDAWStore((state) => state.setEngineReady);
  const isReady = useDAWStore((state) => state.engineReady);
  const initAttemptedRef = useRef(false);

  const init = useCallback(() => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const initEngine = () => {
      try {
        nesEngine.init();
        setEngineReady(true);
      } catch (err) {
        console.error('Failed to init NES engine:', err);
        setEngineReady(false);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEngine, { once: true });
    } else {
      initEngine();
    }
  }, [setEngineReady]);

  const playNote = useCallback(
    (channel: NESChannel, midiNote: number, velocity: number, instrumentId: string): number => {
      if (!isReady) return -1;

      const instrument = INSTRUMENTS[instrumentId];
      if (!instrument) return -1;

      let voiceId = -1;

      if (channel === 'pulse1' || channel === 'pulse2') {
        voiceId = nesEngine.playPulseNote(
          channel,
          midiNote,
          velocity,
          instrument.dutyCycle ?? 0.5,
          instrument.envelope
        );
      } else if (channel === 'triangle') {
        voiceId = nesEngine.playTriangleNote(midiNote, instrument.envelope);
      } else if (channel === 'noise') {
        const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
        voiceId = nesEngine.playNoise(
          instrument.noiseMode ?? 'long',
          frequency,
          velocity,
          instrument.envelope
        );
      }

      return voiceId;
    },
    [isReady]
  );

  const stopNote = useCallback((voiceId: number) => {
    nesEngine.stopNote(voiceId);
  }, []);

  const setVolume = useCallback((volume: number) => {
    nesEngine.setVolume(volume);
  }, []);

  const mute = useCallback((muted: boolean) => {
    nesEngine.mute(muted);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return {
    init,
    playNote,
    stopNote,
    setVolume,
    mute,
    isReady,
  };
}
