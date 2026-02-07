import { create } from 'zustand';
import type { 
  Song, 
  Track, 
  Pattern, 
  Note, 
  TransportState, 
  PianoRollViewState, 
  Quantize, 
  NESChannel 
} from '@/types/engine';

interface DAWState {
  // Song
  song: Song;
  
  // Transport
  transportState: TransportState;
  bpm: number;
  currentTick: number;
  loopEnabled: boolean;
  loopStart: number;  // tick
  loopEnd: number;    // tick
  
  // UI
  selectedInstrumentId: string;
  selectedTrackId: string;
  pianoRollView: PianoRollViewState;
  
  // MIDI (note: don't use Set in zustand, use number array)
  midiConnected: boolean;
  midiDeviceName: string | null;
  
  // Audio engine initialized
  engineReady: boolean;
}

interface DAWActions {
  // Transport
  play: () => void;
  stop: () => void;
  toggleRecord: () => void;
  setBpm: (bpm: number) => void;
  setCurrentTick: (tick: number) => void;
  toggleLoop: () => void;
  setLoopRegion: (start: number, end: number) => void;
  
  // Track
  setTrackVolume: (trackId: string, volume: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  setTrackInstrument: (trackId: string, instrumentId: string) => void;
  setSelectedTrack: (trackId: string) => void;
  
  // Notes (piano roll editing)
  addNote: (trackId: string, note: Omit<Note, 'id'>) => void;
  removeNote: (trackId: string, noteId: string) => void;
  updateNote: (trackId: string, noteId: string, updates: Partial<Note>) => void;
  selectNotes: (noteIds: string[]) => void;
  clearSelection: () => void;
  
  // Instrument
  setSelectedInstrument: (instrumentId: string) => void;
  
  // Piano roll view
  setPianoRollScroll: (x: number, y: number) => void;
  setPianoRollZoom: (zoomX: number, zoomY: number) => void;
  setQuantize: (q: Quantize) => void;
  
  // MIDI
  setMidiConnected: (connected: boolean, deviceName?: string) => void;
  
  // Engine
  setEngineReady: (ready: boolean) => void;
  
  // Song
  setSongName: (name: string) => void;
}

// Helper to generate IDs
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Initial State Setup
const DEFAULT_PPQN = 96;
const DEFAULT_BPM = 150;
const PATTERN_LENGTH = DEFAULT_PPQN * 4 * 4; // 4 bars

const createDefaultPattern = (name: string): Pattern => ({
  id: generateId(),
  name,
  lengthTicks: PATTERN_LENGTH,
  notes: [],
});

const createDefaultTracks = (): Track[] => {
  const defaults: { name: string; channel: NESChannel; instrument: string }[] = [
    { name: 'Pulse 1', channel: 'pulse1', instrument: 'mm-lead' },
    { name: 'Pulse 2', channel: 'pulse2', instrument: 'mm-echo' },
    { name: 'Triangle', channel: 'triangle', instrument: 'mm-bass' },
    { name: 'Noise', channel: 'noise', instrument: 'mm-kick' },
  ];

  return defaults.map((def, index) => ({
    id: generateId(), // or use deterministic IDs if needed, but random is fine
    name: def.name,
    channel: def.channel,
    instrumentId: def.instrument,
    patterns: [createDefaultPattern('Pattern 1')],
    activePatternIndex: 0,
    volume: 1.0,
    muted: false,
    solo: false,
  }));
};

const defaultTracks = createDefaultTracks();

const initialState: DAWState = {
  song: {
    id: generateId(),
    name: 'New Song',
    bpm: DEFAULT_BPM,
    ppqn: DEFAULT_PPQN,
    tracks: defaultTracks,
  },
  transportState: 'stopped',
  bpm: DEFAULT_BPM,
  currentTick: 0,
  loopEnabled: false,
  loopStart: 0,
  loopEnd: PATTERN_LENGTH,
  selectedInstrumentId: 'mm-lead',
  selectedTrackId: defaultTracks[0].id,
  pianoRollView: {
    scrollX: 0,
    scrollY: 60 * 20, // scroll to middle C approx
    zoomX: 1,
    zoomY: 20,
    quantize: '1/16',
    selectedNoteIds: [],
    activeTrackId: defaultTracks[0].id,
  },
  midiConnected: false,
  midiDeviceName: null,
  engineReady: false,
};

export const useDAWStore = create<DAWState & DAWActions>((set) => ({
  ...initialState,

  // Transport
  play: () => set({ transportState: 'playing' }),
  stop: () => set({ transportState: 'stopped', currentTick: 0 }),
  toggleRecord: () => set((state) => ({ 
    transportState: state.transportState === 'recording' ? 'stopped' : 'recording' 
  })),
  setBpm: (bpm) => set((state) => ({ 
    bpm, 
    song: { ...state.song, bpm } 
  })),
  setCurrentTick: (tick) => set({ currentTick: tick }),
  toggleLoop: () => set((state) => ({ loopEnabled: !state.loopEnabled })),
  setLoopRegion: (start, end) => set({ loopStart: start, loopEnd: end }),

  // Track
  setTrackVolume: (trackId, volume) => set((state) => ({
    song: {
      ...state.song,
      tracks: state.song.tracks.map((t) => 
        t.id === trackId ? { ...t, volume } : t
      ),
    },
  })),
  toggleTrackMute: (trackId) => set((state) => ({
    song: {
      ...state.song,
      tracks: state.song.tracks.map((t) => 
        t.id === trackId ? { ...t, muted: !t.muted } : t
      ),
    },
  })),
  toggleTrackSolo: (trackId) => set((state) => ({
    song: {
      ...state.song,
      tracks: state.song.tracks.map((t) => 
        t.id === trackId ? { ...t, solo: !t.solo } : t
      ),
    },
  })),
  setTrackInstrument: (trackId, instrumentId) => set((state) => ({
    song: {
      ...state.song,
      tracks: state.song.tracks.map((t) => 
        t.id === trackId ? { ...t, instrumentId } : t
      ),
    },
  })),
  setSelectedTrack: (trackId) => set((state) => ({ 
    selectedTrackId: trackId,
    pianoRollView: { ...state.pianoRollView, activeTrackId: trackId }
  })),

  // Notes
  addNote: (trackId, noteData) => set((state) => {
    const newNote: Note = { ...noteData, id: generateId() };
    return {
      song: {
        ...state.song,
        tracks: state.song.tracks.map((t) => {
          if (t.id !== trackId) return t;
          const pattern = t.patterns[t.activePatternIndex];
          return {
            ...t,
            patterns: t.patterns.map((p, idx) => 
              idx === t.activePatternIndex 
                ? { ...p, notes: [...p.notes, newNote] } 
                : p
            ),
          };
        }),
      },
    };
  }),
  removeNote: (trackId, noteId) => set((state) => ({
    song: {
      ...state.song,
      tracks: state.song.tracks.map((t) => {
        if (t.id !== trackId) return t;
        return {
          ...t,
          patterns: t.patterns.map((p, idx) => 
            idx === t.activePatternIndex 
              ? { ...p, notes: p.notes.filter((n) => n.id !== noteId) } 
              : p
          ),
        };
      }),
    },
  })),
  updateNote: (trackId, noteId, updates) => set((state) => ({
    song: {
      ...state.song,
      tracks: state.song.tracks.map((t) => {
        if (t.id !== trackId) return t;
        return {
          ...t,
          patterns: t.patterns.map((p, idx) => 
            idx === t.activePatternIndex 
              ? {
                  ...p,
                  notes: p.notes.map((n) => 
                    n.id === noteId ? { ...n, ...updates } : n
                  ),
                }
              : p
          ),
        };
      }),
    },
  })),
  selectNotes: (noteIds) => set((state) => ({
    pianoRollView: { ...state.pianoRollView, selectedNoteIds: noteIds },
  })),
  clearSelection: () => set((state) => ({
    pianoRollView: { ...state.pianoRollView, selectedNoteIds: [] },
  })),

  // Instrument
  setSelectedInstrument: (instrumentId) => set({ selectedInstrumentId: instrumentId }),

  // Piano Roll View
  setPianoRollScroll: (x, y) => set((state) => ({
    pianoRollView: { ...state.pianoRollView, scrollX: x, scrollY: y },
  })),
  setPianoRollZoom: (zoomX, zoomY) => set((state) => ({
    pianoRollView: { ...state.pianoRollView, zoomX, zoomY },
  })),
  setQuantize: (q) => set((state) => ({
    pianoRollView: { ...state.pianoRollView, quantize: q },
  })),

  // MIDI
  setMidiConnected: (connected, deviceName) => set({ 
    midiConnected: connected, 
    midiDeviceName: deviceName || null 
  }),

  // Engine
  setEngineReady: (ready) => set({ engineReady: ready }),

  // Song
  setSongName: (name) => set((state) => ({ 
    song: { ...state.song, name } 
  })),
}));
