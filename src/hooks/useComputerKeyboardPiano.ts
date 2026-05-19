import { useEffect, useRef } from "react";
import { KeyboardLayout, Project, Track } from "../types";
import { AudioManager } from "../lib/audio";
import { getKeyboardPianoNote, isEditableTarget } from "../lib/keyboardPiano";

interface ActiveKeyboardNote {
  note: string;
  startStep: number;
}

interface UseComputerKeyboardPianoOptions {
  keyboardLayout: KeyboardLayout;
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

export function useComputerKeyboardPiano({
  keyboardLayout,
  project,
  activeTrack,
  isPlaying,
  isKeyboardRecording,
  addRecordedNote,
}: UseComputerKeyboardPianoOptions) {
  const activeNotesRef = useRef<Map<string, ActiveKeyboardNote>>(new Map());

  useEffect(() => {
    const stopAllNotes = () => {
      activeNotesRef.current.forEach((_, key) => {
        AudioManager.stopPreviewNote(`${keyboardLayout}:${key}`);
      });
      activeNotesRef.current.clear();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isEditableTarget(event.target) || !activeTrack) {
        return;
      }

      const pianoKey = getKeyboardPianoNote(keyboardLayout, event.key);
      if (!pianoKey || activeNotesRef.current.has(event.key)) {
        return;
      }

      event.preventDefault();

      const inputId = `${keyboardLayout}:${event.key}`;
      const startStep = AudioManager.getCurrentStep();
      activeNotesRef.current.set(event.key, {
        note: pianoKey.note,
        startStep,
      });

      void AudioManager.init(project).then(() => {
        AudioManager.startPreviewNote(
          inputId,
          pianoKey.note,
          activeTrack.instrument,
        );
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const activeNote = activeNotesRef.current.get(event.key);
      if (!activeNote) {
        return;
      }

      const inputId = `${keyboardLayout}:${event.key}`;
      AudioManager.stopPreviewNote(inputId);
      activeNotesRef.current.delete(event.key);

      if (activeTrack && isPlaying && isKeyboardRecording) {
        const endStep = AudioManager.getCurrentStep();
        const durationSteps = Math.max(
          1,
          Math.ceil(endStep - activeNote.startStep),
        );
        addRecordedNote(activeNote.note, activeNote.startStep, durationSteps);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", stopAllNotes);

    return () => {
      stopAllNotes();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", stopAllNotes);
    };
  }, [
    activeTrack,
    addRecordedNote,
    isKeyboardRecording,
    isPlaying,
    keyboardLayout,
    project,
  ]);
}
