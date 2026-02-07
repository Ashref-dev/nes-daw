'use client';

import { useState, useCallback } from 'react';
import { TransportBar } from '@/components/transport/transport-bar';
import { TrackPanel } from '@/components/tracks/track-panel';
import PianoRoll from '@/components/piano-roll/piano-roll';
import { VirtualKeyboard } from '@/components/instruments/virtual-keyboard';
import { useNESEngine } from '@/hooks/use-nes-engine';
import { useMIDI } from '@/hooks/use-midi';
import { useScheduler } from '@/hooks/use-scheduler';
import { useKeyboard } from '@/hooks/use-keyboard';

export default function Home() {
  const [started, setStarted] = useState(false);
  useNESEngine();
  useMIDI();
  const { play, stop, record } = useScheduler();
  useKeyboard();

  const handleStart = useCallback(() => {
    setStarted(true);
  }, []);

  if (!started) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          gap: '24px',
          cursor: 'pointer',
        }}
        onClick={handleStart}
      >
        <h1
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#00ff00',
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          NES DAW
        </h1>
        <p
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: '14px',
            color: '#666',
          }}
        >
          Click anywhere to start audio engine
        </p>
        <div
          style={{
            width: '80px',
            height: '80px',
            border: '2px solid #00ff00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32">
            <polygon points="6,2 28,16 6,30" fill="#00ff00" />
          </svg>
        </div>
        <p
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: '10px',
            color: '#444',
            marginTop: '32px',
          }}
        >
          Connect a MIDI keyboard for live playing
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden',
      }}
    >
      <TransportBar onPlay={play} onStop={stop} onRecord={record} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <TrackPanel />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PianoRoll />
        </div>
      </div>
      <VirtualKeyboard />
    </div>
  );
}
