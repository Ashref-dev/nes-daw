import { useEffect, useRef, useState } from "react";
import { MidiInputState, Project, Track } from "../types";
import { AudioManager } from "../lib/audio";
import { parseMidiNoteMessage } from "../lib/midiInput";

interface ActiveMidiNote {
  note: string;
  startStep: number;
}

type LatestMidiInputOptions = UseMidiInputOptions;

interface UseMidiInputOptions {
  project: Project;
  activeTrack: Track | undefined;
  isPlaying: boolean;
  isKeyboardRecording: boolean;
  addRecordedNote: (
    note: string,
    startStep: number,
    durationSteps: number,
  ) => void;
}

export function useMidiInput({
  project,
  activeTrack,
  isPlaying,
  isKeyboardRecording,
  addRecordedNote,
}: UseMidiInputOptions) {
  const [midiState, setMidiState] = useState<MidiInputState>(() =>
    "requestMIDIAccess" in navigator ? "disabled" : "unsupported",
  );
  const [midiInputNames, setMidiInputNames] = useState<string[]>([]);
  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const activeNotesRef = useRef<Map<string, ActiveMidiNote>>(new Map());
  const latestOptionsRef = useRef<LatestMidiInputOptions>({
    project,
    activeTrack,
    isPlaying,
    isKeyboardRecording,
    addRecordedNote,
  });

  useEffect(() => {
    latestOptionsRef.current = {
      project,
      activeTrack,
      isPlaying,
      isKeyboardRecording,
      addRecordedNote,
    };
  }, [activeTrack, addRecordedNote, isKeyboardRecording, isPlaying, project]);

  const finishRecordedNote = (activeNote: ActiveMidiNote) => {
    const { activeTrack, isPlaying, isKeyboardRecording, addRecordedNote } =
      latestOptionsRef.current;

    if (!activeTrack || !isPlaying || !isKeyboardRecording) {
      return;
    }

    const endStep = AudioManager.getCurrentStep();
    addRecordedNote(
      activeNote.note,
      activeNote.startStep,
      Math.max(1, Math.ceil(endStep - activeNote.startStep)),
    );
  };

  const syncInputs = (midiAccess: MIDIAccess) => {
    const inputs = Array.from(midiAccess.inputs.values()).filter(
      (input) => input.state !== "disconnected",
    );
    setMidiInputNames(inputs.map((input) => input.name || "MIDI input"));

    inputs.forEach((input) => {
      input.onmidimessage = (event) => {
        const { project, activeTrack } = latestOptionsRef.current;

        if (!activeTrack) {
          return;
        }

        if (!event.data) {
          return;
        }

        const message = parseMidiNoteMessage(event.data);
        if (!message) {
          return;
        }

        const noteId = `${input.id}:${message.note}`;
        if (message.type === "noteOn") {
          if (activeNotesRef.current.has(noteId)) {
            return;
          }

          activeNotesRef.current.set(noteId, {
            note: message.note,
            startStep: AudioManager.getCurrentStep(),
          });

          void AudioManager.init(project).then(() => {
            AudioManager.startPreviewNote(
              noteId,
              message.note,
              activeTrack.instrument,
            );
          });
          return;
        }

        const activeNote = activeNotesRef.current.get(noteId);
        AudioManager.stopPreviewNote(noteId);
        activeNotesRef.current.delete(noteId);

        if (activeNote) {
          finishRecordedNote(activeNote);
        }
      };
    });
  };

  const enableMidiInput = async () => {
    if (!navigator.requestMIDIAccess) {
      setMidiState("unsupported");
      return;
    }

    try {
      setMidiState("requesting");
      const midiAccess = await navigator.requestMIDIAccess();
      midiAccessRef.current = midiAccess;
      midiAccess.onstatechange = () => syncInputs(midiAccess);
      syncInputs(midiAccess);
      setMidiState("ready");
    } catch {
      setMidiState("error");
    }
  };

  useEffect(() => {
    const stopAllNotes = () => {
      activeNotesRef.current.forEach((activeNote, noteId) => {
        AudioManager.stopPreviewNote(noteId);
        finishRecordedNote(activeNote);
      });
      activeNotesRef.current.clear();
    };

    window.addEventListener("blur", stopAllNotes);
    document.addEventListener("visibilitychange", stopAllNotes);

    return () => {
      stopAllNotes();
      window.removeEventListener("blur", stopAllNotes);
      document.removeEventListener("visibilitychange", stopAllNotes);
    };
  });

  return {
    midiState,
    midiInputNames,
    enableMidiInput,
  };
}
