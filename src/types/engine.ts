// Channel types
export type NESChannel = 'pulse1' | 'pulse2' | 'triangle' | 'noise';

export type DutyCycle = 0.125 | 0.25 | 0.5 | 0.75;

// Envelope (NES-style ADSR)
export interface EnvelopeParams {
  attack: number;   // seconds (NES: usually 0 = instant)
  decay: number;    // seconds
  sustain: number;  // 0-1 level
  release: number;  // seconds (NES: usually 0 = instant cut)
}

// A single note in the piano roll
export interface Note {
  id: string;
  midiNote: number;      // 0-127
  startTick: number;     // position in ticks (PPQN-based)
  durationTicks: number; // length in ticks
  velocity: number;      // 0-127
}

// A pattern is a fixed-length container of notes
export interface Pattern {
  id: string;
  name: string;
  lengthTicks: number;  // total length (e.g., 4 bars * PPQN * 4)
  notes: Note[];
}

// A track represents one NES channel
export interface Track {
  id: string;
  name: string;
  channel: NESChannel;
  instrumentId: string;
  patterns: Pattern[];
  activePatternIndex: number;
  volume: number;   // 0-1
  muted: boolean;
  solo: boolean;
}

// Instrument definition (preset)
export interface Instrument {
  id: string;
  name: string;
  channel: NESChannel;       // which channel type this instrument uses
  dutyCycle?: DutyCycle;      // for pulse channels
  envelope: EnvelopeParams;
  noiseMode?: 'long' | 'short';  // for noise channel
  // Mega Man specific effects
  dutyCycleSequence?: DutyCycle[];  // for duty cycle sweep (chirp effect)
  dutyCycleSwitchFrames?: number;   // frames before switching duty cycle
  vibratoSpeed?: number;     // Hz
  vibratoDepth?: number;     // cents
  arpeggioPattern?: number[]; // semitone offsets [0, 4, 7] for major chord arp
  arpeggioSpeed?: number;     // frames per step
}

// Song
export interface Song {
  id: string;
  name: string;
  bpm: number;
  ppqn: number;  // pulses per quarter note (default 96)
  tracks: Track[];
}

// Transport state
export type TransportState = 'stopped' | 'playing' | 'recording';

// Quantization options
export type Quantize = '1/4' | '1/8' | '1/16' | '1/32';

// Piano roll view state
export interface PianoRollViewState {
  scrollX: number;
  scrollY: number;
  zoomX: number;     // pixels per tick
  zoomY: number;     // pixels per note row
  quantize: Quantize;
  selectedNoteIds: string[];
  activeTrackId: string | null;
}

// MIDI state
export interface MIDIState {
  connected: boolean;
  deviceName: string | null;
  activeNotes: Set<number>;  // currently held MIDI notes
}
