import { KeyboardLayout } from "../types";

export interface KeyboardPianoKey {
  key: string;
  note: string;
  label: string;
  isBlackKey: boolean;
  aliases?: string[];
}

const QWERTY_KEYS: KeyboardPianoKey[] = [
  { key: "z", note: "C3", label: "Z", isBlackKey: false },
  { key: "s", note: "Db3", label: "S", isBlackKey: true },
  { key: "x", note: "D3", label: "X", isBlackKey: false },
  { key: "d", note: "Eb3", label: "D", isBlackKey: true },
  { key: "c", note: "E3", label: "C", isBlackKey: false },
  { key: "v", note: "F3", label: "V", isBlackKey: false },
  { key: "g", note: "Gb3", label: "G", isBlackKey: true },
  { key: "b", note: "G3", label: "B", isBlackKey: false },
  { key: "h", note: "Ab3", label: "H", isBlackKey: true },
  { key: "n", note: "A3", label: "N", isBlackKey: false },
  { key: "j", note: "Bb3", label: "J", isBlackKey: true },
  { key: "m", note: "B3", label: "M", isBlackKey: false },
  { key: "q", note: "C4", label: "Q", isBlackKey: false },
  { key: "2", note: "Db4", label: "2", isBlackKey: true, aliases: ["é"] },
  { key: "w", note: "D4", label: "W", isBlackKey: false },
  { key: "3", note: "Eb4", label: "3", isBlackKey: true, aliases: ['"'] },
  { key: "e", note: "E4", label: "E", isBlackKey: false },
  { key: "r", note: "F4", label: "R", isBlackKey: false },
  { key: "5", note: "Gb4", label: "5", isBlackKey: true, aliases: ["("] },
  { key: "t", note: "G4", label: "T", isBlackKey: false },
  { key: "6", note: "Ab4", label: "6", isBlackKey: true, aliases: ["-"] },
  { key: "y", note: "A4", label: "Y", isBlackKey: false },
  { key: "7", note: "Bb4", label: "7", isBlackKey: true, aliases: ["è"] },
  { key: "u", note: "B4", label: "U", isBlackKey: false },
  { key: "i", note: "C5", label: "I", isBlackKey: false },
];

const AZERTY_KEYS: KeyboardPianoKey[] = [
  { key: "w", note: "C3", label: "W", isBlackKey: false },
  { key: "s", note: "Db3", label: "S", isBlackKey: true },
  { key: "x", note: "D3", label: "X", isBlackKey: false },
  { key: "d", note: "Eb3", label: "D", isBlackKey: true },
  { key: "c", note: "E3", label: "C", isBlackKey: false },
  { key: "v", note: "F3", label: "V", isBlackKey: false },
  { key: "g", note: "Gb3", label: "G", isBlackKey: true },
  { key: "b", note: "G3", label: "B", isBlackKey: false },
  { key: "h", note: "Ab3", label: "H", isBlackKey: true },
  { key: "n", note: "A3", label: "N", isBlackKey: false },
  { key: "j", note: "Bb3", label: "J", isBlackKey: true },
  { key: ",", note: "B3", label: ",", isBlackKey: false },
  { key: "a", note: "C4", label: "A", isBlackKey: false },
  { key: "2", note: "Db4", label: "2", isBlackKey: true, aliases: ["é"] },
  { key: "z", note: "D4", label: "Z", isBlackKey: false },
  { key: "3", note: "Eb4", label: "3", isBlackKey: true, aliases: ['"'] },
  { key: "e", note: "E4", label: "E", isBlackKey: false },
  { key: "r", note: "F4", label: "R", isBlackKey: false },
  { key: "5", note: "Gb4", label: "5", isBlackKey: true, aliases: ["("] },
  { key: "t", note: "G4", label: "T", isBlackKey: false },
  { key: "6", note: "Ab4", label: "6", isBlackKey: true, aliases: ["-"] },
  { key: "y", note: "A4", label: "Y", isBlackKey: false },
  { key: "7", note: "Bb4", label: "7", isBlackKey: true, aliases: ["è"] },
  { key: "u", note: "B4", label: "U", isBlackKey: false },
  { key: "i", note: "C5", label: "I", isBlackKey: false },
];

export const KEYBOARD_PIANO_KEYS: Record<KeyboardLayout, KeyboardPianoKey[]> = {
  qwerty: QWERTY_KEYS,
  azerty: AZERTY_KEYS,
};

export function getKeyboardPianoNote(
  layout: KeyboardLayout,
  key: string,
): KeyboardPianoKey | undefined {
  return KEYBOARD_PIANO_KEYS[layout].find(
    (pianoKey) =>
      pianoKey.key === key.toLowerCase() ||
      pianoKey.aliases?.includes(key.toLowerCase()),
  );
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

export function isTextCompositionEvent(event: KeyboardEvent) {
  return (
    event.isComposing ||
    event.key === "Dead" ||
    event.key === "Process"
  );
}
