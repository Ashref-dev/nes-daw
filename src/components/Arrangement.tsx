import { useEffect, useRef } from "react";
import { useDAWContext } from "../context/useDAWContext";
import { InstrumentType } from "../types";
import { CELL_WIDTH_PX, PIANO_ROLL_NOTES } from "../constants";
import { Trash2, Sparkles, XCircle } from "lucide-react";

export function Arrangement({ playheadStep }: { playheadStep: number }) {
  const {
    project,
    selectedTrackId,
    setSelectedTrackId,
    deleteTrack,
    updateTrack,
    toggleMute,
    toggleSolo,
    addTrack,
    clearTrackNotes,
    handleGenerateTrack,
    seek,
    isPlaying,
    autoScroll,
  } = useDAWContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPlaying && autoScroll && scrollRef.current && playheadStep >= 0) {
      const container = scrollRef.current;
      const playheadX = playheadStep * CELL_WIDTH_PX;
      const viewLeft = container.scrollLeft;
      const viewRight = viewLeft + container.clientWidth;

      if (playheadX < viewLeft || playheadX > viewRight - 50) {
        container.scrollTo({ left: playheadX - 50, behavior: "auto" });
      }
    }
  }, [playheadStep, isPlaying, autoScroll]);

  const timelineSteps = Array.from(
    { length: project.totalSteps },
    (_, step) => step,
  );

  const selectTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#C4C1B3] font-sans text-[#4E4A42]">
      {/* Track Headers (Left sidebar) */}
      <div className="flex w-72 flex-none flex-col overflow-y-auto border-r border-[#4E4A42] bg-[#D1CEC1]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#4E4A42] bg-[#D1CEC1] p-3">
          <span className="text-[11px] font-bold tracking-widest text-[#4E4A42] uppercase">
            Instrument Slots
          </span>
          <button
            type="button"
            onClick={addTrack}
            className="flex h-5 w-5 items-center justify-center border border-[#4E4A42] pb-0.5 text-lg leading-none transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
          >
            +
          </button>
        </div>

        {project.tracks.map((track, i) => (
          <div
            key={track.id}
            className={`group relative flex flex-col gap-1 border-b border-l-4 border-[#4E4A42] p-3 transition-all ${selectedTrackId === track.id ? "border-l-[#4E4A42] bg-[#BAB5A1]" : "bg-opacity-40 hover:bg-opacity-60 border-l-[#4E4A42]/30 bg-[#BAB5A1]"}`}
          >
            <button
              type="button"
              onClick={() => selectTrack(track.id)}
              className="absolute inset-0 z-0"
              aria-label={`Select ${track.name}`}
            />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest">
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                <div
                  className="relative h-4 w-4 cursor-pointer overflow-hidden rounded-full border border-[#4E4A42] shadow-sm"
                  title="Change Track Color"
                >
                  <div
                    className="pointer-events-none h-full w-full"
                    style={{ backgroundColor: track.color }}
                  />
                  <input
                    type="color"
                    value={track.color || "#4E4A42"}
                    onChange={(e) =>
                      updateTrack(track.id, { color: e.target.value })
                    }
                    className="absolute -top-4 -left-4 h-12 w-12 cursor-pointer opacity-0"
                  />
                </div>
              </div>
              <select
                value={track.instrument}
                onChange={(e) =>
                  updateTrack(track.id, {
                    instrument: e.target.value as InstrumentType,
                  })
                }
                onClick={(e) => e.stopPropagation()}
                className="cursor-pointer appearance-none bg-transparent text-right text-[10px] font-bold tracking-widest text-[#4E4A42] uppercase opacity-60 outline-none hover:opacity-100"
              >
                <option value="square">Square</option>
                <option value="triangle">Triangle</option>
                <option value="sawtooth">Sawtooth</option>
                <option value="pulse">Pulse</option>
                <option value="fmsquare">FM Square</option>
                <option value="fmsawtooth">FM Sawtooth</option>
                <option value="fmtriangle">FM Triangle</option>
                <option value="fatsquare">Fat Square</option>
                <option value="fatsawtooth">Fat Saw</option>
                <option value="fattriangle">Fat Tri</option>
                <option value="pwm">PWM</option>
                <option value="amtriangle">AM Tri</option>
              </select>
            </div>

            <div className="relative z-10 mt-1 mb-1 flex items-center justify-between pr-12">
              <input
                type="text"
                value={track.name}
                onChange={(e) =>
                  updateTrack(track.id, { name: e.target.value })
                }
                className="w-full border-b border-transparent bg-transparent pl-1 text-sm font-bold tracking-widest text-[#4E4A42] uppercase transition-colors outline-none hover:border-[#4E4A42]/20 focus:border-[#4E4A42]/60"
                onClick={(e) => e.stopPropagation()}
              />
              <div
                className={`absolute right-0 z-10 flex items-center gap-1 bg-transparent pl-2 transition-opacity ${selectedTrackId === track.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute(track.id);
                  }}
                  className={`flex h-5 w-5 items-center justify-center border border-[#4E4A42] text-[9px] font-bold ${track.muted ? "bg-[#4E4A42] text-[#D1CEC1]" : "hover:bg-[#4E4A42] hover:text-[#D1CEC1]"}`}
                  title="Mute"
                >
                  M
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSolo(track.id);
                  }}
                  className={`flex h-5 w-5 items-center justify-center border border-[#4E4A42] text-[9px] font-bold ${track.solo ? "bg-[#4E4A42] text-[#D1CEC1]" : "hover:bg-[#4E4A42] hover:text-[#D1CEC1]"}`}
                  title="Solo"
                >
                  S
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-2 flex items-center justify-between">
              <div className="mr-2 flex flex-1 items-center gap-2">
                <span className="text-[9px] font-bold tracking-widest opacity-60">
                  VOL
                </span>
                <input
                  type="range"
                  min="-40"
                  max="0"
                  value={track.volume}
                  onChange={(e) =>
                    updateTrack(track.id, { volume: parseInt(e.target.value) })
                  }
                  className="h-1 flex-1 appearance-none rounded-none bg-[#4E4A42]/20 accent-[#4E4A42] outline-none"
                  title="Volume"
                />
                <span className="w-6 text-right font-mono text-[9px] opacity-60">
                  {track.volume}
                </span>
              </div>

              <div
                className={`relative z-20 flex gap-1 transition-opacity ${selectedTrackId === track.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateTrack(
                      `A new ${track.instrument} line for ${track.name}`,
                    );
                  }}
                  className="border border-transparent p-1 text-[#4E4A42] transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
                  title="AI Generate new layer"
                >
                  <Sparkles size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearTrackNotes(track.id);
                  }}
                  className="border border-transparent p-1 text-[#4E4A42] transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
                  title="Clear Notes"
                >
                  <XCircle size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTrack(track.id);
                  }}
                  className="border border-transparent p-1 text-[#4E4A42] transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
                  title="Delete Track"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Lanes (Right) */}
      <div
        className="relative flex-1 overflow-x-auto overflow-y-auto bg-[#C4C1B3]"
        ref={scrollRef}
      >
        <div
          style={{ width: project.totalSteps * CELL_WIDTH_PX }}
          className="min-h-full"
        >
          {/* Tick Rulers */}
          <button
            type="button"
            className="sticky top-0 z-20 flex h-8 cursor-pointer border-b border-[#4E4A42] bg-[#D1CEC1]"
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const step = Math.max(
                0,
                Math.floor((e.clientX - rect.left) / CELL_WIDTH_PX),
              );
              seek(step);
            }}
            onClick={() => seek(playheadStep >= 0 ? playheadStep : 0)}
          >
            {timelineSteps.map((step) => (
              <div
                key={`timeline-step-${step}`}
                className={`pointer-events-none h-full flex-none border-l p-1 text-[10px] font-bold tracking-widest text-[#4E4A42] ${step % 16 === 0 ? "border-[#4E4A42]" : "border-[#4E4A42]/30"} ${step % 4 === 0 ? "bg-[#BAB5A1]/20" : ""}`}
                style={{ width: CELL_WIDTH_PX }}
              >
                {step % 16 === 0
                  ? "0" + (Math.floor(step / 16) + 1) + ":00"
                  : ""}
              </div>
            ))}
          </button>

          <div className="relative pt-2">
            {/* Background Grid */}
            <div
              className="pointer-events-none absolute inset-0 flex"
              style={{ top: 8, height: "calc(100% - 8px)" }}
            >
              {timelineSteps.map((step) => (
                <div
                  key={`grid-step-${step}`}
                  className={`flex-none border-l ${step % 16 === 0 ? "border-[#4E4A42]" : step % 4 === 0 ? "border-[#4E4A42]/40" : "border-[#4E4A42]/10"}`}
                  style={{ width: CELL_WIDTH_PX }}
                />
              ))}
            </div>

            {/* Track Blocks */}
            <div className="relative z-10 flex flex-col space-y-4 px-0">
              {project.tracks.map((track) => (
                <div
                  key={track.id}
                  className="relative mx-0 h-20 overflow-hidden border-b border-[#4E4A42]/20 bg-transparent"
                >
                  {track.notes.map((note) => {
                    const noteIndex = PIANO_ROLL_NOTES.indexOf(note.note);
                    const normIndex =
                      noteIndex !== -1
                        ? noteIndex / (PIANO_ROLL_NOTES.length - 1)
                        : 0.5;
                    const topPx = normIndex * 74 + 2; // Scale 0-74 to fit in 80px
                    return (
                      <div
                        key={note.id}
                        className="absolute h-[3px] overflow-hidden rounded-full opacity-80 mix-blend-multiply"
                        style={{
                          left: note.startStep * CELL_WIDTH_PX,
                          width: Math.max(
                            2,
                            note.durationSteps * CELL_WIDTH_PX - 1,
                          ),
                          backgroundColor: track.color || "#4E4A42",
                          top: topPx,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Playhead */}
            {playheadStep >= 0 && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-30 w-[2px] bg-[#C13A3A] shadow-[0_0_10px_rgba(193,58,58,0.5)]"
                style={{ left: playheadStep * CELL_WIDTH_PX }}
              >
                <div className="absolute top-0 -left-1.5 h-0 w-0 border-t-[8px] border-r-[6px] border-l-[6px] border-t-[#C13A3A] border-r-transparent border-l-transparent" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
