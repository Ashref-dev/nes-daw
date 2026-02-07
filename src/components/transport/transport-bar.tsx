'use client';

import React from 'react';
import { useDAWStore } from '@/store/daw-store';
import type { Quantize } from '@/types/engine';

const QUANTIZE_OPTIONS: Quantize[] = ['1/4', '1/8', '1/16', '1/32'];

interface TransportBarProps {
  onPlay?: () => void;
  onStop?: () => void;
  onRecord?: () => void;
}

export function TransportBar({ onPlay, onStop, onRecord }: TransportBarProps) {
  const song = useDAWStore((s) => s.song);
  const transportState = useDAWStore((s) => s.transportState);
  const currentTick = useDAWStore((s) => s.currentTick);
  const bpm = useDAWStore((s) => s.bpm);
  const loopEnabled = useDAWStore((s) => s.loopEnabled);
  const midiConnected = useDAWStore((s) => s.midiConnected);
  const midiDeviceName = useDAWStore((s) => s.midiDeviceName);
  const quantize = useDAWStore((s) => s.pianoRollView.quantize);

  const storePlay = useDAWStore((s) => s.play);
  const storeStop = useDAWStore((s) => s.stop);
  const storeToggleRecord = useDAWStore((s) => s.toggleRecord);
  const setBpm = useDAWStore((s) => s.setBpm);
  const toggleLoop = useDAWStore((s) => s.toggleLoop);
  const setQuantize = useDAWStore((s) => s.setQuantize);
  const setSongName = useDAWStore((s) => s.setSongName);

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    }
    storePlay();
  };

  const handleStop = () => {
    if (onStop) {
      onStop();
    }
    storeStop();
  };

  const handleRecord = () => {
    if (onRecord) {
      onRecord();
    }
    storeToggleRecord();
  };

  const ppqn = song.ppqn;
  const bar = Math.floor(currentTick / (ppqn * 4)) + 1;
  const beat = Math.floor((currentTick % (ppqn * 4)) / ppqn) + 1;
  const tick = currentTick % ppqn;

  const posStr = `${String(bar).padStart(3, '0')}:${String(beat).padStart(2, '0')}:${String(tick).padStart(2, '0')}`;

  const isPlaying = transportState === 'playing';
  const isRecording = transportState === 'recording';

  const base: React.CSSProperties = {
    height: '48px',
    backgroundColor: '#0d0d0d',
    borderBottom: '1px solid #222',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: '12px',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
    color: '#aaa',
    width: '100%',
    flexShrink: 0,
  };

  const btnBase: React.CSSProperties = {
    border: '1px solid #333',
    backgroundColor: '#1a1a1a',
    color: '#888',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    fontSize: '10px',
    fontWeight: 'bold',
    height: '28px',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    letterSpacing: '1px',
  };

  const inputBase: React.CSSProperties = {
    backgroundColor: '#111',
    border: '1px solid #333',
    color: '#ccc',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
    outline: 'none',
    height: '28px',
    padding: '0 6px',
  };

  return (
    <div style={base}>
      <input
        type="text"
        value={song.name}
        onChange={(e) => setSongName(e.target.value)}
        style={{ ...inputBase, width: '120px' }}
      />

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={handleStop} style={btnBase} title="Stop">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="1" y="1" width="8" height="8" fill="#ccc" />
          </svg>
        </button>
        <button
          onClick={handlePlay}
          style={{
            ...btnBase,
            backgroundColor: isPlaying ? '#0a2a0a' : '#1a1a1a',
            borderColor: isPlaying ? '#00ff00' : '#333',
            boxShadow: isPlaying ? '0 0 6px #00ff0044' : 'none',
          }}
          title="Play"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <polygon points="1,0 10,5 1,10" fill={isPlaying ? '#00ff00' : '#ccc'} />
          </svg>
        </button>
        <button
          onClick={handleRecord}
          style={{
            ...btnBase,
            backgroundColor: isRecording ? '#2a0a0a' : '#1a1a1a',
            borderColor: isRecording ? '#ff0000' : '#333',
            boxShadow: isRecording ? '0 0 6px #ff000044' : 'none',
          }}
          title="Record"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <circle cx="5" cy="5" r="4" fill={isRecording ? '#ff0000' : '#ccc'} />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #222',
          padding: '4px 10px',
          fontFamily: "'Courier New', monospace",
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#00ff00',
          letterSpacing: '2px',
          minWidth: '130px',
          textAlign: 'center',
        }}
      >
        {posStr}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '10px', color: '#666' }}>BPM</span>
        <input
          type="number"
          min={30}
          max={300}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          style={{ ...inputBase, width: '50px', textAlign: 'center' }}
        />
      </div>

      <button
        onClick={toggleLoop}
        style={{
          ...btnBase,
          backgroundColor: loopEnabled ? '#1a1a00' : '#1a1a1a',
          borderColor: loopEnabled ? '#ffe600' : '#333',
          color: loopEnabled ? '#ffe600' : '#666',
        }}
      >
        LOOP
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '10px', color: '#666' }}>Q</span>
        <select
          value={quantize}
          onChange={(e) => setQuantize(e.target.value as Quantize)}
          style={{
            ...inputBase,
            width: '55px',
            cursor: 'pointer',
          }}
        >
          {QUANTIZE_OPTIONS.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            backgroundColor: midiConnected ? '#00ff00' : '#660000',
            boxShadow: midiConnected ? '0 0 4px #00ff00' : 'none',
          }}
        />
        <span style={{ fontSize: '10px', color: '#666' }}>
          {midiConnected ? midiDeviceName ?? 'MIDI' : 'NO MIDI'}
        </span>
      </div>
    </div>
  );
}
