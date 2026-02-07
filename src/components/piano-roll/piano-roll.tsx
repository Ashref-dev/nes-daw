'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useDAWStore } from '@/store/daw-store';
import type { NESChannel, Quantize } from '@/types/engine';

const CHANNEL_COLORS: Record<NESChannel, string> = {
  pulse1: '#4a9eff',
  pulse2: '#4aff8a',
  triangle: '#ff4a4a',
  noise: '#b04aff',
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEYS = [1, 3, 6, 8, 10]; // Indices in NOTE_NAMES

const KEY_WIDTH = 60;

const PianoRoll = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  
  const dragState = useRef<{
    isDragging: boolean;
    mode: 'move' | 'resize' | null;
    noteId: string | null;
    startTick: number;
    startMidi: number;
    startDuration: number;
    startX: number;
    startY: number;
  }>({
    isDragging: false,
    mode: null,
    noteId: null,
    startTick: 0,
    startMidi: 0,
    startDuration: 0,
    startX: 0,
    startY: 0
  });

  const getMousePos = (e: React.MouseEvent | MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getGridPos = (mouseX: number, mouseY: number, state: ReturnType<typeof useDAWStore.getState>) => {
    const { scrollX, scrollY, zoomX, zoomY } = state.pianoRollView;
    
    const gridPixelX = mouseX - KEY_WIDTH;
    const gridPixelY = mouseY;

    const tick = (gridPixelX / zoomX) + scrollX;
    const noteExact = 127 - (gridPixelY + scrollY - zoomY / 2) / zoomY;
    const midiNote = Math.round(noteExact);

    return { tick, midiNote, gridPixelX, gridPixelY };
  };

  const quantizeTick = (tick: number, q: Quantize, ppqn: number) => {
    let ticksPerStep = ppqn;
    if (q === '1/8') ticksPerStep = ppqn / 2;
    if (q === '1/16') ticksPerStep = ppqn / 4;
    if (q === '1/32') ticksPerStep = ppqn / 8;

    return Math.round(tick / ticksPerStep) * ticksPerStep;
  };

  const handleWindowMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current.isDragging || !dragState.current.noteId) return;

    const state = useDAWStore.getState();
    const { zoomX, zoomY, quantize } = state.pianoRollView;
    const { startX, startY, startTick, startMidi, startDuration, noteId, mode } = dragState.current;
    const ppqn = state.song.ppqn;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const deltaTicks = deltaX / zoomX;
    const deltaMidi = -deltaY / zoomY; 

    if (mode === 'move') {
      const rawNewTick = startTick + deltaTicks;
      const rawNewMidi = startMidi + deltaMidi;
      
      const newStartTick = Math.max(0, quantizeTick(rawNewTick, quantize, ppqn));
      const newMidiNote = Math.max(0, Math.min(127, Math.floor(rawNewMidi + 0.5)));
      
      if (newStartTick !== startTick || newMidiNote !== startMidi) {
        state.updateNote(state.selectedTrackId, noteId, {
          startTick: newStartTick,
          midiNote: newMidiNote
        });
      }
    } else if (mode === 'resize') {
      const rawNewDur = startDuration + deltaTicks;
      const targetEndTick = startTick + rawNewDur;
      const quantizedEndTick = quantizeTick(targetEndTick, quantize, ppqn);
      const newDuration = Math.max(1, quantizedEndTick - startTick);
      
      if (newDuration !== startDuration) {
        state.updateNote(state.selectedTrackId, noteId, {
          durationTicks: newDuration
        });
      }
    }
  }, []);

  const handleWindowMouseUp = useCallback(() => {
    if (dragState.current.isDragging) {
      dragState.current.isDragging = false;
      dragState.current.mode = null;
      dragState.current.noteId = null;
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      
      if (canvasRef.current) canvasRef.current.style.cursor = 'crosshair';
    }
  }, [handleWindowMouseMove]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const state = useDAWStore.getState();
    const { song, pianoRollView, currentTick, selectedTrackId } = state;
    const { scrollX, scrollY, zoomX, zoomY } = pianoRollView;
    const { width, height } = canvas;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    const startTick = Math.floor(scrollX);
    const endTick = startTick + (width - KEY_WIDTH) / zoomX;
    const startNote = Math.floor(127 - (scrollY + height) / zoomY);
    const endNote = Math.ceil(127 - scrollY / zoomY);

    const safeStartNote = Math.max(0, startNote);
    const safeEndNote = Math.min(127, endNote);

    const ppqn = song.ppqn;

    // Horizontal Lines (Notes)
    for (let note = safeStartNote; note <= safeEndNote; note++) {
      const y = Math.floor((127 - note) * zoomY - scrollY);
      const isBlack = BLACK_KEYS.includes(note % 12);
      
      if (isBlack) {
        ctx.fillStyle = '#111';
        ctx.fillRect(KEY_WIDTH, y, width - KEY_WIDTH, zoomY);
      }
      
      if (note === 60) {
        ctx.fillStyle = '#1a2233';
        ctx.fillRect(KEY_WIDTH, y, width - KEY_WIDTH, zoomY);
      }

      ctx.beginPath();
      ctx.strokeStyle = '#1a1a1a';
      if (note % 12 === 0) ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 1;
      ctx.moveTo(KEY_WIDTH, y + zoomY);
      ctx.lineTo(width, y + zoomY);
      ctx.stroke();
    }

    const pixelsPerTick = zoomX;
    
    let tickStep = ppqn / 4;
    if (pixelsPerTick * tickStep < 5) tickStep = ppqn;
    
    const startGridTick = Math.floor(startTick / tickStep) * tickStep;
    
    for (let t = startGridTick; t <= endTick; t += tickStep) {
      const x = KEY_WIDTH + (t - scrollX) * zoomX;
      
      ctx.beginPath();
      const isBar = t % (ppqn * 4) === 0;
      const isBeat = t % ppqn === 0;
      
      if (isBar) {
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
      } else if (isBeat) {
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
      } else {
      ctx.strokeStyle = '#161616';
      ctx.lineWidth = 0.5;
      }

      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    song.tracks.forEach(track => {
      if (track.id === selectedTrackId) return;
      const pattern = track.patterns[track.activePatternIndex];
      const notes = pattern.notes;
      const channelColor = CHANNEL_COLORS[track.channel];

      ctx.save();
      ctx.globalAlpha = 0.3;
      notes.forEach(note => {
        const noteY = (127 - note.midiNote) * zoomY - scrollY;
        const noteX = KEY_WIDTH + (note.startTick - scrollX) * zoomX;
        const noteW = note.durationTicks * zoomX;
        const noteH = zoomY - 1;

        if (noteX + noteW < KEY_WIDTH || noteX > width || noteY + noteH < 0 || noteY > height) return;

        ctx.fillStyle = channelColor;
        const r = 3;
        ctx.beginPath();
        ctx.roundRect(Math.max(KEY_WIDTH, noteX), noteY, Math.max(1, noteW - (noteX < KEY_WIDTH ? KEY_WIDTH - noteX : 0)), noteH, r);
        ctx.fill();
      });
      ctx.restore();
    });

    const track = song.tracks.find(t => t.id === selectedTrackId);
    if (track) {
      const pattern = track.patterns[track.activePatternIndex];
      const notes = pattern.notes;
      const channelColor = CHANNEL_COLORS[track.channel];

      notes.forEach(note => {
        const noteY = (127 - note.midiNote) * zoomY - scrollY;
        const noteX = KEY_WIDTH + (note.startTick - scrollX) * zoomX;
        const noteW = note.durationTicks * zoomX;
        const noteH = zoomY - 1;

        if (noteX + noteW < KEY_WIDTH || noteX > width || noteY + noteH < 0 || noteY > height) {
          return;
        }

        const isSelected = pianoRollView.selectedNoteIds.includes(note.id);

        ctx.fillStyle = isSelected ? '#ffffff' : channelColor;
        
        const r = 3;
        ctx.beginPath();
        ctx.roundRect(Math.max(KEY_WIDTH, noteX), noteY, Math.max(1, noteW - (noteX < KEY_WIDTH ? KEY_WIDTH - noteX : 0)), noteH, r);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#ffcc00' : 'rgba(0,0,0,0.3)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
      });
    }

    const playheadX = KEY_WIDTH + (currentTick - scrollX) * zoomX;
    if (playheadX >= KEY_WIDTH && playheadX <= width) {
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, 0);
      ctx.lineTo(playheadX + 5, 0);
      ctx.lineTo(playheadX, 8);
      ctx.fill();
    }

    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, KEY_WIDTH, height);
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(KEY_WIDTH, 0);
    ctx.lineTo(KEY_WIDTH, height);
    ctx.stroke();

    for (let note = safeStartNote; note <= safeEndNote; note++) {
      const y = Math.floor((127 - note) * zoomY - scrollY);
      const noteIdx = note % 12;
      const isBlack = BLACK_KEYS.includes(noteIdx);
      const name = NOTE_NAMES[noteIdx] + Math.floor(note / 12);

      // Key Rect
      if (isBlack) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, y, KEY_WIDTH * 0.6, zoomY); // Short black key
        
        // White key part underneath is covered by adjacent white keys visually in real piano, 
        // but in piano roll usually black keys just sit on top or are rows.
        // Let's do a simple row style but with visual indication
        ctx.fillStyle = '#222';
        ctx.fillRect(KEY_WIDTH * 0.6, y, KEY_WIDTH * 0.4, zoomY); // Remainder
      } else {
        ctx.fillStyle = '#eee';
        if (note === 60) ctx.fillStyle = '#ddd'; // Middle C darker white
        ctx.fillRect(0, y, KEY_WIDTH, zoomY);
        
        // Separator
        ctx.strokeStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(0, y + zoomY);
        ctx.lineTo(KEY_WIDTH, y + zoomY);
        ctx.stroke();
      }

      // Text label
      if (!isBlack || zoomY > 15) { // Hide text if too small
        ctx.fillStyle = isBlack ? '#888' : '#333';
        if (note === 60) ctx.fillStyle = '#000';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, KEY_WIDTH - 4, y + zoomY / 2);
      }
    }

    rafRef.current = requestAnimationFrame(render);
  }, []);

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (dragState.current.isDragging) return;

    const { x, y } = getMousePos(e);
    const state = useDAWStore.getState();
    const { tick, midiNote } = getGridPos(x, y, state);
    
    const track = state.song.tracks.find(t => t.id === state.selectedTrackId);
    if (!track) {
      if (canvasRef.current) canvasRef.current.style.cursor = 'crosshair';
      return;
    }
    
    const pattern = track.patterns[track.activePatternIndex];
    const note = pattern.notes.find(n => 
      n.midiNote === midiNote && 
      tick >= n.startTick && 
      tick < n.startTick + n.durationTicks
    );

    if (canvasRef.current) {
      if (note) {
        const noteX = KEY_WIDTH + (note.startTick - state.pianoRollView.scrollX) * state.pianoRollView.zoomX;
        const noteW = note.durationTicks * state.pianoRollView.zoomX;
        const rightEdge = noteX + noteW;
        
        if (x >= rightEdge - 8 && x <= rightEdge + 2) {
          canvasRef.current.style.cursor = 'ew-resize';
        } else {
          canvasRef.current.style.cursor = 'grab';
        }
      } else {
        canvasRef.current.style.cursor = 'crosshair';
      }
    }
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const state = useDAWStore.getState();
    const { setPianoRollScroll, pianoRollView } = state;
    
    const delta = e.deltaY;
    
    if (e.shiftKey) {
      const newScrollX = Math.max(0, pianoRollView.scrollX + delta * 0.5);
      setPianoRollScroll(newScrollX, pianoRollView.scrollY);
    } else {
      const targetScrollY = pianoRollView.scrollY - delta;
      setPianoRollScroll(pianoRollView.scrollX, targetScrollY);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const state = useDAWStore.getState();
    const { x, y } = getMousePos(e);
    
    if (x < KEY_WIDTH) return;

    const { tick, midiNote } = getGridPos(x, y, state);
    if (midiNote < 0 || midiNote > 127) return;

    // Find if clicked on a note
    const track = state.song.tracks.find(t => t.id === state.selectedTrackId);
    if (!track) return;
    
    const pattern = track.patterns[track.activePatternIndex];
    const clickedNote = pattern.notes.find(n => 
      n.midiNote === midiNote && 
      tick >= n.startTick && 
      tick < n.startTick + n.durationTicks
    );

    if (e.button === 0) {
      if (clickedNote) {
        state.selectNotes([clickedNote.id]);
        
        const noteX = KEY_WIDTH + (clickedNote.startTick - state.pianoRollView.scrollX) * state.pianoRollView.zoomX;
        const noteW = clickedNote.durationTicks * state.pianoRollView.zoomX;
        const rightEdge = noteX + noteW;
        const isResize = x >= rightEdge - 8;

        dragState.current = {
          isDragging: true,
          mode: isResize ? 'resize' : 'move',
          noteId: clickedNote.id,
          startTick: clickedNote.startTick,
          startMidi: clickedNote.midiNote,
          startDuration: clickedNote.durationTicks,
          startX: e.clientX,
          startY: e.clientY
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
        
        if (canvasRef.current) canvasRef.current.style.cursor = isResize ? 'ew-resize' : 'grabbing';

      } else {
        const quantizedStart = quantizeTick(tick, state.pianoRollView.quantize, state.song.ppqn);
        
        let defaultDur = state.song.ppqn;
        if (state.pianoRollView.quantize === '1/8') defaultDur = state.song.ppqn / 2;
        if (state.pianoRollView.quantize === '1/16') defaultDur = state.song.ppqn / 4;
        
        state.addNote(state.selectedTrackId, {
          midiNote,
          startTick: quantizedStart,
          durationTicks: defaultDur,
          velocity: 100
        });
      }
    } else if (e.button === 2) {
      if (clickedNote) {
        state.removeNote(state.selectedTrackId, clickedNote.id);
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0a0a0a] overflow-hidden relative select-none">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onContextMenu={(e) => e.preventDefault()}
        className="block"
      />
    </div>
  );
};

export default PianoRoll;
