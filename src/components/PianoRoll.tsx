import { useEffect, useRef, useState } from "react";
import { useDAWContext } from "../context/useDAWContext";
import { PIANO_ROLL_NOTES, CELL_WIDTH_PX, ROW_HEIGHT_PX } from "../constants";
import { AudioManager } from "../lib/audio";

const GRID_ROWS = Array.from({ length: 12 }, (_, row) => row);
const GRID_COLUMNS = Array.from({ length: 4 }, (_, column) => column);

export function PianoRoll({ playheadStep }: { playheadStep: number }) {
  const { project, selectedTrackId, setProject, isPlaying, autoScroll } =
    useDAWContext();
  const activeTrack = project.tracks.find((t) => t.id === selectedTrackId);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stampDuration, setStampDuration] = useState(2);

  useEffect(() => {
    if (isPlaying && autoScroll && containerRef.current && playheadStep >= 0) {
      const container = containerRef.current;
      const playheadX = playheadStep * CELL_WIDTH_PX;
      const viewLeft = container.scrollLeft;
      const viewRight = viewLeft + container.clientWidth;

      // Keep Keyboard Sidebar in mind, it is 64px width (w-16) or similar
      if (playheadX < viewLeft || playheadX > viewRight - 100) {
        container.scrollTo({
          left: Math.max(0, playheadX - 64),
          behavior: "auto",
        });
      }
    }
  }, [playheadStep, isPlaying, autoScroll]);

  const handleCellClick = (noteStr: string, step: number) => {
    if (!activeTrack) return;

    const existingIndex = activeTrack.notes.findIndex(
      (n) =>
        n.note === noteStr &&
        step >= n.startStep &&
        step < n.startStep + n.durationSteps,
    );

    if (existingIndex >= 0) {
      setProject((p) => {
        return {
          ...p,
          tracks: p.tracks.map((t) => {
            if (t.id === activeTrack.id) {
              const newNotes = [...t.notes];
              newNotes.splice(existingIndex, 1);
              return { ...t, notes: newNotes };
            }
            return t;
          }),
        };
      });
    } else {
      if (!isPlaying) {
        AudioManager.previewNote(noteStr, activeTrack.instrument);
      }

      setProject((p) => ({
        ...p,
        tracks: p.tracks.map((t) => {
          if (t.id === activeTrack.id) {
            return {
              ...t,
              notes: [
                ...t.notes,
                {
                  id: "n_" + Date.now() + Math.random(),
                  note: noteStr,
                  startStep: step,
                  durationSteps: stampDuration,
                  velocity: 0.8,
                },
              ],
            };
          }
          return t;
        }),
      }));
    }
  };

  if (!activeTrack) {
    return (
      <div className="flex h-full flex-col items-center justify-center font-bold tracking-[0.2em] text-[#4E4A42] uppercase opacity-50">
        Select a track to edit
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-[#D1CEC1] text-[#4E4A42]">
      {/* Piano Roll Header */}
      <div className="flex h-10 items-center justify-between border-b border-[#4E4A42] bg-[#BAB5A1] px-4 text-[10px] font-bold tracking-widest uppercase">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 border border-[#4E4A42] bg-[#4E4A42] opacity-80" />
          <span className="">
            {activeTrack.name}{" "}
            <span className="ml-2 opacity-60">({activeTrack.instrument})</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-60">Draw Length:</span>
          <select
            value={stampDuration}
            onChange={(e) => setStampDuration(parseInt(e.target.value))}
            className="border border-[#4E4A42] bg-transparent px-2 py-1 font-bold text-[#4E4A42] outline-none"
          >
            <option value={1}>1/16</option>
            <option value={2}>1/8</option>
            <option value={4}>1/4 (Beat)</option>
            <option value={16}>1 Bar</option>
          </select>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-auto" ref={containerRef}>
        {/* Keyboard sidebar */}
        <div className="sticky left-0 z-40 w-16 flex-none border-r border-[#4E4A42] bg-[#D1CEC1]">
          {PIANO_ROLL_NOTES.map((note) => {
            const isBlack = note.includes("b");
            return (
              <button
                type="button"
                key={note}
                className={`flex cursor-pointer items-center justify-end border-b border-[#4E4A42] px-2 text-[10px] font-bold tracking-widest select-none hover:bg-[#4E4A42] hover:text-[#D1CEC1] ${isBlack ? "bg-opacity-40 bg-[#BAB5A1] text-[#4E4A42]" : "bg-[#D1CEC1] text-[#4E4A42]"}`}
                style={{ height: ROW_HEIGHT_PX }}
                onMouseDown={() =>
                  AudioManager.previewNote(note, activeTrack.instrument)
                }
              >
                {note}
              </button>
            );
          })}
        </div>

        {/* Grid Area */}
        <div
          className="relative cursor-crosshair bg-transparent"
          style={{
            width: project.totalSteps * CELL_WIDTH_PX,
            height: PIANO_ROLL_NOTES.length * ROW_HEIGHT_PX,
          }}
        >
          {/* Background SVG Grid for performance */}
          <svg
            aria-hidden="true"
            focusable="false"
            className="pointer-events-none absolute inset-0 opacity-20 mix-blend-multiply"
            width={project.totalSteps * CELL_WIDTH_PX}
            height={PIANO_ROLL_NOTES.length * ROW_HEIGHT_PX}
          >
            <defs>
              <pattern
                id="gridPattern"
                width={CELL_WIDTH_PX * 4}
                height={ROW_HEIGHT_PX * 12}
                patternUnits="userSpaceOnUse"
              >
                {/* Rows lines */}
                {GRID_ROWS.map((row) => (
                  <line
                    key={`horizontal-grid-${row}`}
                    x1="0"
                    y1={row * ROW_HEIGHT_PX}
                    x2={CELL_WIDTH_PX * 4}
                    y2={row * ROW_HEIGHT_PX}
                    stroke="#4E4A42"
                    strokeWidth="1"
                  />
                ))}
                {/* 16th cols */}
                {GRID_COLUMNS.map((column) => (
                  <line
                    key={`vertical-grid-${column}`}
                    x1={column * CELL_WIDTH_PX}
                    y1="0"
                    x2={column * CELL_WIDTH_PX}
                    y2={ROW_HEIGHT_PX * 12}
                    stroke="#4E4A42"
                    strokeWidth={column === 0 ? "2" : "1"}
                    opacity={column === 0 ? "1" : "0.5"}
                  />
                ))}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridPattern)" />
          </svg>

          {/* Interactive clickable overlay */}
          <button
            type="button"
            className="absolute inset-0 z-10"
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const step = Math.floor(x / CELL_WIDTH_PX);
              const row = Math.floor(y / ROW_HEIGHT_PX);
              if (row >= 0 && row < PIANO_ROLL_NOTES.length) {
                handleCellClick(PIANO_ROLL_NOTES[row], step);
              }
            }}
            onClick={() => handleCellClick(PIANO_ROLL_NOTES[0], 0)}
          >
            {/* Render Notes */}
            {activeTrack.notes.map((note) => {
              const rowIndex = PIANO_ROLL_NOTES.indexOf(note.note);
              if (rowIndex === -1) return null;

              return (
                <div
                  key={note.id}
                  className="pointer-events-none absolute flex items-center overflow-hidden border border-[#4E4A42] bg-[#4E4A42] px-1 opacity-80 shadow-sm"
                  style={{
                    left: note.startStep * CELL_WIDTH_PX,
                    top: rowIndex * ROW_HEIGHT_PX + 1,
                    width: note.durationSteps * CELL_WIDTH_PX - 1,
                    height: ROW_HEIGHT_PX - 2,
                  }}
                >
                  <span className="truncate text-[9px] font-bold tracking-widest text-[#D1CEC1] uppercase">
                    {note.note}
                  </span>
                </div>
              );
            })}

            {/* Playhead in Piano Roll */}
            {playheadStep >= 0 && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-30 w-[2px] bg-[#C13A3A] shadow-[0_0_10px_rgba(193,58,58,0.5)]"
                style={{ left: playheadStep * CELL_WIDTH_PX }}
              >
                <div className="absolute top-0 -left-1.5 h-0 w-0 border-t-[8px] border-r-[6px] border-l-[6px] border-t-[#C13A3A] border-r-transparent border-l-transparent" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
