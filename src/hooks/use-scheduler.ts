'use client';

import { useEffect, useCallback, useRef } from 'react';
import { scheduler } from '@/audio/scheduler';
import { nesEngine } from '@/audio/nes-engine';
import { INSTRUMENTS } from '@/audio/instruments';
import { useDAWStore } from '@/store/daw-store';
import type { ScheduledNote } from '@/audio/scheduler';

interface UseSchedulerReturn {
  play: () => void;
  stop: () => void;
  record: () => void;
  pause: () => void;
  seekTo: (tick: number) => void;
  isPlaying: boolean;
  isRecording: boolean;
  currentTick: number;
}

export function useScheduler(): UseSchedulerReturn {
  const transportState = useDAWStore((state) => state.transportState);
  const currentTick = useDAWStore((state) => state.currentTick);
  const bpm = useDAWStore((state) => state.bpm);
  const song = useDAWStore((state) => state.song);
  const loopEnabled = useDAWStore((state) => state.loopEnabled);
  const loopStart = useDAWStore((state) => state.loopStart);
  const loopEnd = useDAWStore((state) => state.loopEnd);

  const setCurrentTick = useDAWStore((state) => state.setCurrentTick);

  const engineReady = useDAWStore((state) => state.engineReady);
  const initAttemptedRef = useRef(false);

  const loadNotesFromPatterns = useCallback((): ScheduledNote[] => {
    const notes: ScheduledNote[] = [];

    song.tracks.forEach((track) => {
      const pattern = track.patterns[track.activePatternIndex];
      if (!pattern) return;

      pattern.notes.forEach((note) => {
        notes.push({
          channel: track.channel,
          midiNote: note.midiNote,
          velocity: note.velocity,
          startTick: note.startTick,
          durationTicks: note.durationTicks,
          instrumentId: track.instrumentId,
        });
      });
    });

    return notes;
  }, [song.tracks]);

  const play = useCallback(() => {
    if (!engineReady) return;

    const notes = loadNotesFromPatterns();
    scheduler.loadNotes(notes);
    scheduler.play();
  }, [engineReady, loadNotesFromPatterns]);

  const stop = useCallback(() => {
    scheduler.stop();
    nesEngine.stopAllNotes();
  }, []);

  const record = useCallback(() => {
    if (!engineReady) return;

    const notes = loadNotesFromPatterns();
    scheduler.loadNotes(notes);
    scheduler.record();
  }, [engineReady, loadNotesFromPatterns]);

  const pause = useCallback(() => {
    scheduler.pause();
  }, []);

  const seekTo = useCallback((tick: number) => {
    scheduler.seekTo(tick);
    setCurrentTick(tick);
  }, [setCurrentTick]);

  useEffect(() => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const tryAttachContext = () => {
      const ctx = nesEngine.getContext();
      if (ctx) {
        scheduler.setAudioContext(ctx);
        scheduler.setBpm(useDAWStore.getState().bpm);
        const state = useDAWStore.getState();
        scheduler.setLoop(state.loopEnabled, state.loopStart, state.loopEnd);
        return true;
      }
      return false;
    };

    if (!tryAttachContext()) {
      const interval = setInterval(() => {
        if (tryAttachContext()) {
          clearInterval(interval);
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 30000);
    }

    const handleNoteSchedule = (note: ScheduledNote, _audioTime: number, duration: number) => {
      if (!useDAWStore.getState().engineReady) return;

      const instrument = INSTRUMENTS[note.instrumentId];
      if (!instrument) return;

      let voiceId = -1;

      if (note.channel === 'pulse1' || note.channel === 'pulse2') {
        voiceId = nesEngine.playPulseNote(
          note.channel,
          note.midiNote,
          note.velocity,
          instrument.dutyCycle ?? 0.5,
          instrument.envelope
        );
      } else if (note.channel === 'triangle') {
        voiceId = nesEngine.playTriangleNote(note.midiNote, instrument.envelope);
      } else if (note.channel === 'noise') {
        const freq = 440 * Math.pow(2, (note.midiNote - 69) / 12);
        voiceId = nesEngine.playNoise(
          instrument.noiseMode ?? 'long',
          freq,
          note.velocity,
          instrument.envelope
        );
      }

      if (voiceId !== -1) {
        setTimeout(() => {
          nesEngine.stopNote(voiceId);
        }, duration * 1000);
      }
    };

    const handleTick = (tick: number) => {
      useDAWStore.getState().setCurrentTick(tick);
    };

    scheduler.setNoteScheduleCallback(handleNoteSchedule);
    scheduler.setTickCallback(handleTick);

    return () => {
      scheduler.dispose();
    };
  }, []);

  useEffect(() => {
    scheduler.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    scheduler.setLoop(loopEnabled, loopStart, loopEnd);
  }, [loopEnabled, loopStart, loopEnd]);

  return {
    play,
    stop,
    record,
    pause,
    seekTo,
    isPlaying: transportState === 'playing',
    isRecording: transportState === 'recording',
    currentTick,
  };
}
