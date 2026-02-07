'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { nesEngine } from '@/audio/nes-engine';
import { INSTRUMENTS } from '@/audio/instruments';
import { useDAWStore } from '@/store/daw-store';

function getNoteColor(channel: string): string {
  switch (channel) {
    case 'pulse1': return '#4a9eff';
    case 'pulse2': return '#4aff8a';
    case 'triangle': return '#ff4a4a';
    case 'noise': return '#b04aff';
    default: return '#4a9eff';
  }
}

export function VirtualKeyboard() {
  const selectedTrackId = useDAWStore((state) => state.selectedTrackId);
  const tracks = useDAWStore((state) => state.song.tracks);
  
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set());
  const activeVoices = useRef<Map<number, number>>(new Map());
  const isMouseDown = useRef(false);

  const keys: { note: number; isBlack: boolean; label?: string }[] = [];
  const startNote = 36;
  const endNote = 83;

  for (let i = startNote; i <= endNote; i++) {
    const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
    const label = (i % 12 === 0) ? `C${Math.floor(i / 12) - 1}` : undefined;
    keys.push({ note: i, isBlack, label });
  }

  const whiteKeys = keys.filter(k => !k.isBlack);
  const blackKeys = keys.filter(k => k.isBlack);

  const playNote = useCallback((note: number) => {
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return;

    const instrument = INSTRUMENTS[track.instrumentId];
    if (!instrument) return;

    if (activeVoices.current.has(note)) {
      nesEngine.stopNote(activeVoices.current.get(note)!);
      activeVoices.current.delete(note);
    }

    let voiceId = -1;
    const velocity = 100;

    if (track.channel === 'pulse1' || track.channel === 'pulse2') {
      voiceId = nesEngine.playPulseNote(
        track.channel,
        note,
        velocity,
        instrument.dutyCycle,
        instrument.envelope
      );
    } else if (track.channel === 'triangle') {
      voiceId = nesEngine.playTriangleNote(note, instrument.envelope);
    } else if (track.channel === 'noise') {
      const freq = 440 * Math.pow(2, (note - 69) / 12);
      voiceId = nesEngine.playNoise(
        instrument.noiseMode || 'long',
        freq,
        velocity,
        instrument.envelope
      );
    }

    if (voiceId !== -1) {
      activeVoices.current.set(note, voiceId);
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.add(note);
        return next;
      });
    }
  }, [selectedTrackId, tracks]);

  const stopNote = useCallback((note: number) => {
    const voiceId = activeVoices.current.get(note);
    if (voiceId !== undefined) {
      nesEngine.stopNote(voiceId);
      activeVoices.current.delete(note);
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    }
  }, []);

  const handleMouseDown = (note: number) => {
    isMouseDown.current = true;
    playNote(note);
  };

  const handleMouseUp = (note: number) => {
    isMouseDown.current = false;
    stopNote(note);
  };

  const handleMouseEnter = (note: number) => {
    if (isMouseDown.current) {
      playNote(note);
    }
  };

  const handleMouseLeave = (note: number) => {
    if (isMouseDown.current) {
      stopNote(note);
    }
  };

  useEffect(() => {
    const handleGlobalUp = () => {
      isMouseDown.current = false;
      activeVoices.current.forEach((voiceId) => nesEngine.stopNote(voiceId));
      activeVoices.current.clear();
      setPressedKeys(new Set());
    };
    window.addEventListener('mouseup', handleGlobalUp);
    return () => window.removeEventListener('mouseup', handleGlobalUp);
  }, []);

  const currentTrack = tracks.find(t => t.id === selectedTrackId);
  const activeColor = currentTrack ? getNoteColor(currentTrack.channel) : '#4a9eff';

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '56px', 
        backgroundColor: '#111', 
        borderTop: '1px solid #333',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 4px',
        userSelect: 'none'
      }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: '1200px', height: '100%', display: 'flex' }}>
        {whiteKeys.map((key) => {
          const isPressed = pressedKeys.has(key.note);
          return (
            <div
              key={key.note}
              onMouseDown={(e) => { e.preventDefault(); handleMouseDown(key.note); }}
              onMouseUp={() => handleMouseUp(key.note)}
              onMouseEnter={() => handleMouseEnter(key.note)}
              onMouseLeave={() => handleMouseLeave(key.note)}
              style={{
                flex: 1,
                backgroundColor: isPressed ? activeColor : '#ddd',
                border: '1px solid #999',
                borderTop: 'none',
                borderBottomLeftRadius: '3px',
                borderBottomRightRadius: '3px',
                margin: '0 1px',
                height: '100%',
                position: 'relative',
                zIndex: 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '4px',
                fontSize: '10px',
                color: isPressed ? '#fff' : '#444',
                fontWeight: 'bold',
                boxShadow: isPressed ? 'inset 0 2px 5px rgba(0,0,0,0.3)' : 'inset 0 -2px 5px rgba(255,255,255,0.5)'
              }}
            >
              {key.label}
            </div>
          );
        })}

        {blackKeys.map((key) => {
            const prevWhiteNote = key.note - 1;
            const whiteKeyIndex = whiteKeys.findIndex(wk => wk.note === prevWhiteNote);
            
            if (whiteKeyIndex === -1) return null;

            const percentPerWhite = 100 / whiteKeys.length;
            const leftPercent = (whiteKeyIndex + 1) * percentPerWhite;
            const isPressed = pressedKeys.has(key.note);

            return (
              <div
                key={key.note}
                onMouseDown={(e) => { e.preventDefault(); handleMouseDown(key.note); }}
                onMouseUp={() => handleMouseUp(key.note)}
                onMouseEnter={() => handleMouseEnter(key.note)}
                onMouseLeave={() => handleMouseLeave(key.note)}
                style={{
                  position: 'absolute',
                  left: `calc(${leftPercent}% - 0.75%)`, 
                  width: '1.5%', 
                  height: '60%',
                  backgroundColor: isPressed ? activeColor : '#222',
                  zIndex: 2,
                  borderBottomLeftRadius: '2px',
                  borderBottomRightRadius: '2px',
                  border: '1px solid #000',
                  cursor: 'pointer',
                  boxShadow: isPressed ? 'inset 0 2px 5px rgba(0,0,0,0.5)' : '2px 2px 2px rgba(0,0,0,0.3)'
                }}
              />
            );
        })}
      </div>
    </div>
  );
}
