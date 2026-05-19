import { useEffect, useState } from "react";
import { useDAWContext } from "../context/useDAWContext";
import { TopBar } from "./TopBar";
import { Arrangement } from "./Arrangement";
import { PianoRoll } from "./PianoRoll";
import * as Tone from "tone";

export function Editor() {
  const { isGenerating } = useDAWContext();
  const [playheadStep, setPlayheadStep] = useState(-1);

  useEffect(() => {
    let frameId: number;
    const loop = () => {
      if (Tone.Transport.state === "started") {
        const pos = Tone.Transport.position.toString().split(":");
        if (pos.length === 3) {
          const bars = parseFloat(pos[0]);
          const beats = parseFloat(pos[1]);
          const sixteenths = parseFloat(pos[2]);
          const step = bars * 16 + beats * 4 + sixteenths;
          setPlayheadStep(step);
        }
      } else {
        setPlayheadStep(-1);
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#D1CEC1] font-sans text-[#4E4A42] uppercase">
      <TopBar />

      {/* Resizable split between arrangement and piano roll */}
      <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6 pb-0">
        {/* Arrangement View (Top) */}
        <div className="flex h-1/2 min-h-64 flex-none border border-[#4E4A42] bg-[#C4C1B3] shadow-inner">
          <Arrangement playheadStep={playheadStep} />
        </div>

        {/* Piano Roll (Bottom) */}
        <div className="relative mb-6 flex flex-1 overflow-hidden border border-[#4E4A42] bg-[#D1CEC1] shadow-inner">
          <PianoRoll playheadStep={playheadStep} />
        </div>
      </div>

      {isGenerating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#D1CEC1]/90 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-6 h-16 w-16 animate-spin border-4 border-[#4E4A42] border-t-transparent"></div>
            <h2 className="text-xl font-bold tracking-widest text-[#4E4A42] uppercase opacity-80">
              Generating Melancholy...
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}
