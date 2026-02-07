'use client';

import { useEffect, useRef, useCallback } from 'react';
import { scheduler } from '@/audio/scheduler';
import { useDAWStore } from '@/store/daw-store';
import { useNESEngine } from './use-nes-engine';

const LOWER_ROW: Record<string, number> = {
  z: 48, s: 49, x: 50, d: 51, c: 52, v: 53,
  g: 54, b: 55, h: 56, n: 57, j: 58, m: 59,
};

const UPPER_ROW: Record<string, number> = {
  q: 60, '2': 61, w: 62, '3': 63, e: 64, r: 65,
  '5': 66, t: 67, '6': 68, y: 69, '7': 70, u: 71,
  i: 72, '9': 73, o: 74, '0': 75, p: 76,
};

const KEY_MAP: Record<string, number> = { ...LOWER_ROW, ...UPPER_ROW };

export function useKeyboard() {
  const { playNote, stopNote, isReady } = useNESEngine();
  const voiceMapRef = useRef<Map<string, number>>(new Map());
  const recordStartTickRef = useRef<Map<string, { midiNote: number; tick: number }>>(new Map());

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isReady) return;
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      const key = e.key.toLowerCase();
      const midiNote = KEY_MAP[key];
      if (midiNote === undefined) return;
      if (voiceMapRef.current.has(key)) return;

      const state = useDAWStore.getState();
      const track = state.song.tracks.find((t) => t.id === state.selectedTrackId);
      if (!track) return;

      const voiceId = playNote(track.channel, midiNote, 100, track.instrumentId);
      if (voiceId !== -1) {
        voiceMapRef.current.set(key, voiceId);
      }

      if (state.transportState === 'recording') {
        recordStartTickRef.current.set(key, { midiNote, tick: scheduler.getCurrentTick() });
      }
    },
    [isReady, playNote]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const voiceId = voiceMapRef.current.get(key);
      if (voiceId !== undefined) {
        stopNote(voiceId);
        voiceMapRef.current.delete(key);
      }

      const recordEntry = recordStartTickRef.current.get(key);
      if (recordEntry) {
        recordStartTickRef.current.delete(key);
        const state = useDAWStore.getState();
        if (state.transportState === 'recording') {
          const endTick = scheduler.getCurrentTick();
          const durationTicks = Math.max(1, endTick - recordEntry.tick);
          state.addNote(state.selectedTrackId, {
            midiNote: recordEntry.midiNote,
            startTick: recordEntry.tick,
            durationTicks,
            velocity: 100,
          });
        }
      }
    },
    [stopNote]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
