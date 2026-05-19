import { useCallback, useEffect, useMemo, useState } from "react";
import { useDAWContext } from "../context/useDAWContext";
import { TopBar } from "./TopBar";
import { Arrangement } from "./Arrangement";
import { PianoRoll } from "./PianoRoll";
import * as Tone from "tone";
import { useGlobalActions } from "../hooks/useGlobalActions";
import { useComputerKeyboardPiano } from "../hooks/useComputerKeyboardPiano";
import { useMidiInput } from "../hooks/useMidiInput";
import { DAWAction } from "../types";

export function Editor() {
  const {
    project,
    selectedTrackId,
    isGenerating,
    isPlaying,
    editorView,
    setEditorView,
    toggleEditorView,
    keyboardLayout,
    keyboardMode,
    isKeyboardRecording,
    togglePlayback,
    stopPlayback,
    toggleKeyboardRecording,
    addKeyboardRecordedNote,
  } = useDAWContext();
  const [playheadStep, setPlayheadStep] = useState(-1);
  const activeTrack = project.tracks.find(
    (track) => track.id === selectedTrackId,
  );

  const addRecordedNote = useCallback(
    (note: string, startStep: number, durationSteps: number) => {
      if (!activeTrack) {
        return;
      }

      addKeyboardRecordedNote(activeTrack.id, note, startStep, durationSteps);
    },
    [activeTrack, addKeyboardRecordedNote],
  );

  const actions = useMemo<DAWAction[]>(
    () => [
      {
        id: "transport.togglePlayback",
        label: "Play / pause",
        shortcut: " ",
        run: togglePlayback,
      },
      {
        id: "transport.stopPlayback",
        label: "Stop",
        shortcut: "Escape",
        run: stopPlayback,
      },
      {
        id: "view.toggleEditor",
        label: "Switch timeline / piano roll",
        shortcut: "Tab",
        run: toggleEditorView,
      },
      {
        id: "view.showTimeline",
        label: "Show timeline",
        shortcut: "F6",
        run: () => setEditorView("timeline"),
      },
      {
        id: "view.showPianoRoll",
        label: "Show piano roll",
        shortcut: "F7",
        run: () => setEditorView("pianoRoll"),
      },
      {
        id: "record.toggleKeyboard",
        label: "Arm keyboard record",
        shortcut: "F9",
        run: toggleKeyboardRecording,
      },
    ],
    [
      setEditorView,
      stopPlayback,
      toggleEditorView,
      toggleKeyboardRecording,
      togglePlayback,
    ],
  );

  const midiInput = useMidiInput({
    project,
    activeTrack,
    isPlaying,
    isKeyboardRecording,
    addRecordedNote,
  });

  useGlobalActions(actions, keyboardMode === "hotkeys");
  useComputerKeyboardPiano({
    keyboardLayout,
    project,
    activeTrack,
    isPlaying,
    isKeyboardRecording,
    enabled: keyboardMode === "piano",
    addRecordedNote,
  });

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
      <TopBar actions={actions} midiInput={midiInput} />

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-6 pb-0">
        <div className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditorView("timeline")}
              className={`border border-[#4E4A42] px-3 py-1 transition-colors ${editorView === "timeline" ? "bg-[#4E4A42] text-[#D1CEC1]" : "hover:bg-[#4E4A42] hover:text-[#D1CEC1]"}`}
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setEditorView("pianoRoll")}
              className={`border border-[#4E4A42] px-3 py-1 transition-colors ${editorView === "pianoRoll" ? "bg-[#4E4A42] text-[#D1CEC1]" : "hover:bg-[#4E4A42] hover:text-[#D1CEC1]"}`}
            >
              Piano Roll
            </button>
          </div>
          <span className="opacity-60">
            {keyboardMode === "hotkeys"
              ? "Hotkeys active · switch to Piano for FL-style keys"
              : "Piano mode active · keyboard plays selected track"}
          </span>
        </div>

        {editorView === "timeline" ? (
          <div className="flex min-h-0 flex-1 border border-[#4E4A42] bg-[#C4C1B3] shadow-inner">
            <Arrangement playheadStep={playheadStep} />
          </div>
        ) : (
          <div className="relative mb-6 flex min-h-0 flex-1 overflow-hidden border border-[#4E4A42] bg-[#D1CEC1] shadow-inner">
            <PianoRoll playheadStep={playheadStep} />
          </div>
        )}
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
