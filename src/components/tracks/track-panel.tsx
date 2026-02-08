'use client';

import React from 'react';
import { useDAWStore } from '@/store/daw-store';
import { getInstrumentsByChannel } from '@/audio/instruments';
import type { NESChannel } from '@/types/engine';

const CHANNEL_COLORS: Record<NESChannel, string> = {
  pulse1: '#4a9eff',
  pulse2: '#4aff8a',
  triangle: '#ff4a4a',
  noise: '#b04aff',
};

export function TrackPanel() {
  const {
    song,
    selectedTrackId,
    setSelectedTrack,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackVolume,
    setTrackInstrument,
  } = useDAWStore();

  return (
    <div
      style={{
        width: '240px',
        backgroundColor: '#111111',
        borderRight: '2px solid #222222',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        fontFamily: "'Courier New', monospace",
        color: '#eeeeee',
      }}
    >
      <div
        style={{
          padding: '10px',
          borderBottom: '2px solid #222222',
          backgroundColor: '#1a1a1a',
          fontSize: '14px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        NES Channels
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', padding: '4px' }}>
        {song.tracks.map((track) => {
          const isSelected = selectedTrackId === track.id;
          const channelColor = CHANNEL_COLORS[track.channel];
          const instruments = getInstrumentsByChannel(track.channel);

          return (
            <div
              key={track.id}
              onClick={() => setSelectedTrack(track.id)}
              style={{
                marginBottom: '4px',
                padding: '8px',
                backgroundColor: isSelected ? '#1a1a1a' : '#151515',
                border: `2px solid ${isSelected ? channelColor : '#222222'}`,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'relative',
                opacity: track.muted ? 0.4 : 1,
                filter: track.muted ? 'grayscale(100%)' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: isSelected ? '#ffffff' : '#aaaaaa',
                    textTransform: 'uppercase',
                  }}
                >
                  {track.name}
                </span>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: channelColor,
                    boxShadow: isSelected ? `0 0 4px ${channelColor}` : 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTrackMute(track.id);
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: track.muted ? '#ff4a4a' : '#222222',
                    border: '1px solid #444444',
                    color: track.muted ? '#000000' : '#888888',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  title="Mute"
                >
                  M
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTrackSolo(track.id);
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: track.solo ? '#ffe600' : '#222222',
                    border: '1px solid #444444',
                    color: track.solo ? '#000000' : '#888888',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  title="Solo"
                >
                  S
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={track.volume}
                  onChange={(e) => {
                    e.stopPropagation();
                    setTrackVolume(track.id, parseFloat(e.target.value));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    height: '4px',
                    accentColor: channelColor,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  title={`Volume: ${Math.round(track.volume * 100)}%`}
                />
              </div>

              <select
                value={track.instrumentId}
                onChange={(e) => {
                  e.stopPropagation();
                  setTrackInstrument(track.id, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  color: '#cccccc',
                  border: '1px solid #333333',
                  padding: '4px',
                  fontSize: '10px',
                  fontFamily: "'Courier New', monospace",
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {instruments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
