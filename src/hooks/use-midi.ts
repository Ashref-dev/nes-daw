'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { midiManager } from '@/audio/midi-manager';
import { scheduler } from '@/audio/scheduler';
import { useDAWStore } from '@/store/daw-store';
import { useNESEngine } from './use-nes-engine';

interface UseMIDIReturn {
  isConnected: boolean;
  deviceName: string | null;
  activeNotes: Set<number>;
}

export function useMIDI(): UseMIDIReturn {
  const setMidiConnected = useDAWStore((state) => state.setMidiConnected);
  const midiConnected = useDAWStore((state) => state.midiConnected);
  const midiDeviceName = useDAWStore((state) => state.midiDeviceName);

  const { playNote, stopNote, isReady } = useNESEngine();
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const voiceMapRef = useRef<Map<number, number>>(new Map());
  const recordStartTickRef = useRef<Map<number, number>>(new Map());
  const initAttemptedRef = useRef(false);

  const handleNoteOn = useCallback(
    (midiNote: number, velocity: number) => {
      if (!isReady) return;

      const state = useDAWStore.getState();
      const selectedTrack = state.song.tracks.find((t) => t.id === state.selectedTrackId);
      if (!selectedTrack) return;

      const channel = selectedTrack.channel;
      const instrumentId = selectedTrack.instrumentId;

      const voiceId = playNote(channel, midiNote, velocity, instrumentId);
      if (voiceId !== -1) {
        voiceMapRef.current.set(midiNote, voiceId);
        setActiveNotes((prev) => new Set([...prev, midiNote]));
      }

      if (state.transportState === 'recording') {
        recordStartTickRef.current.set(midiNote, scheduler.getCurrentTick());
      }
    },
    [isReady, playNote]
  );

  const handleNoteOff = useCallback(
    (midiNote: number) => {
      const voiceId = voiceMapRef.current.get(midiNote);
      if (voiceId !== undefined) {
        stopNote(voiceId);
        voiceMapRef.current.delete(midiNote);
        setActiveNotes((prev) => {
          const next = new Set(prev);
          next.delete(midiNote);
          return next;
        });
      }

      const startTick = recordStartTickRef.current.get(midiNote);
      if (startTick !== undefined) {
        recordStartTickRef.current.delete(midiNote);
        const state = useDAWStore.getState();
        if (state.transportState === 'recording') {
          const endTick = scheduler.getCurrentTick();
          const durationTicks = Math.max(1, endTick - startTick);
          state.addNote(state.selectedTrackId, {
            midiNote,
            startTick,
            durationTicks,
            velocity: 100,
          });
        }
      }
    },
    [stopNote]
  );

  const handleConnectionChange = useCallback(
    (connected: boolean, deviceName: string | null) => {
      setMidiConnected(connected, deviceName ?? undefined);
    },
    [setMidiConnected]
  );

  useEffect(() => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const initMIDI = async () => {
      try {
        midiManager.setConnectionCallback(handleConnectionChange);
        await midiManager.init();
      } catch (err) {
        console.warn('MIDI init failed:', err);
      }
    };

    initMIDI();

    return () => {
      midiManager.dispose();
    };
  }, [handleConnectionChange]);

  useEffect(() => {
    midiManager.setNoteOnCallback(handleNoteOn);
    midiManager.setNoteOffCallback(handleNoteOff);
  }, [handleNoteOn, handleNoteOff]);

  return {
    isConnected: midiConnected,
    deviceName: midiDeviceName,
    activeNotes,
  };
}
