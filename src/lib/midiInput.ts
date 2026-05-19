export interface ParsedMidiNoteMessage {
  type: "noteOn" | "noteOff";
  note: string;
  velocity: number;
}

const NOTE_NAMES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

export function midiNoteNumberToName(noteNumber: number) {
  const octave = Math.floor(noteNumber / 12) - 1;
  return `${NOTE_NAMES[noteNumber % 12]}${octave}`;
}

export function parseMidiNoteMessage(
  data: Uint8Array | number[],
): ParsedMidiNoteMessage | null {
  const [status = 0, noteNumber = 0, velocityValue = 0] = data;
  const command = status & 0xf0;

  if (command !== 0x80 && command !== 0x90) {
    return null;
  }

  return {
    type: command === 0x90 && velocityValue > 0 ? "noteOn" : "noteOff",
    note: midiNoteNumberToName(noteNumber),
    velocity: Math.max(0, Math.min(1, velocityValue / 127)),
  };
}
