import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InstrumentType, NoteEvent, Project, Track } from "../types";

interface GeneratedNotePayload {
  note?: string;
  startStep?: number | string;
  durationSteps?: number | string;
  velocity?: number | string;
}

interface GeneratedTrackPayload {
  name?: string;
  instrument?: string;
  notes?: GeneratedNotePayload[];
}

interface GeneratedSongPayload {
  tempo?: number;
  tracks?: GeneratedTrackPayload[];
}

function parseInteger(value: number | string | undefined, fallback: number) {
  const parsedValue = Number.parseInt(String(value ?? fallback), 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

function parseFloatValue(value: number | string | undefined, fallback: number) {
  const parsedValue = Number.parseFloat(String(value ?? fallback));
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

function mapGeneratedNotes({
  notes,
  totalSteps,
  startStep = 0,
  endStep = totalSteps,
  prefix,
  trackIndex,
}: {
  notes: GeneratedNotePayload[] | undefined;
  totalSteps: number;
  startStep?: number;
  endStep?: number;
  prefix: string;
  trackIndex: number;
}): NoteEvent[] {
  const uniqueNotes = new Map<string, NoteEvent>();

  notes?.forEach((generatedNote, noteIndex) => {
    if (!generatedNote.note) {
      return;
    }

    const rawStartStep = parseInteger(generatedNote.startStep, startStep);
    const safeStartStep = Math.max(
      startStep,
      Math.min(rawStartStep, endStep - 1),
    );
    const durationSteps = Math.max(
      1,
      parseInteger(generatedNote.durationSteps, 4),
    );
    const velocity = Math.max(
      0,
      Math.min(1, parseFloatValue(generatedNote.velocity, 0.8)),
    );
    const key = `${generatedNote.note}_${safeStartStep}`;

    if (!uniqueNotes.has(key)) {
      uniqueNotes.set(key, {
        id: `${prefix}_${Date.now()}_${trackIndex}_${noteIndex}`,
        note: generatedNote.note,
        startStep: Math.min(safeStartStep, totalSteps - 1),
        durationSteps,
        velocity,
      });
    }
  });

  return Array.from(uniqueNotes.values());
}

const geminiApiKey = process.env.GEMINI_API_KEY;

function getAiClient() {
  if (!geminiApiKey) return null;
  return new GoogleGenAI({ apiKey: geminiApiKey });
}

export function isGeminiAvailable() {
  return Boolean(geminiApiKey);
}

function requireAiClient() {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("Gemini AI is unavailable because GEMINI_API_KEY is not set.");
  }
  return ai;
}

const noteSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    note: { type: Type.STRING, description: "MIDI Note like 'C3', 'F#4'." },
    startStep: {
      type: Type.INTEGER,
      description: "Start position in 16th notes.",
    },
    durationSteps: {
      type: Type.INTEGER,
      description: "Duration in 16th notes.",
    },
    velocity: { type: Type.NUMBER, description: "0.0 to 1.0" },
  },
  required: ["note", "startStep", "durationSteps", "velocity"],
};

const trackSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    instrument: {
      type: Type.STRING,
      description:
        "'square', 'triangle', 'sawtooth', 'pulse', 'fmsquare', 'fmsawtooth', 'fmtriangle', 'fatsquare', 'fatsawtooth', 'fattriangle', 'pwm', 'amtriangle'",
    },
    notes: { type: Type.ARRAY, items: noteSchema },
  },
  required: ["name", "instrument", "notes"],
};

const MUSICAL_RULES = `
CRITICAL MUSICAL RULES:
- Be incredibly creative. Generate AS MANY tracks and notes as you need (don't limit to 4 tracks; create 6-10 if needed for lush chords, arp, counter-melody, deep bass, pad, etc).
- Style: NieR Automata OST, intensely brooding melancholy, emotional modern chiptune.
- Instruments: heavily utilize modern chiptune/retro sounds ('pwm', 'fmsquare', 'fatsawtooth', 'fmsawtooth', 'amtriangle', etc) alongside standard waveforms.
- Harmony: Advanced extended chords (min9, maj7, dim7, half-diminished, alterated), suspended chords, lush inversions, secondary dominants, and deeply impactful emotional closures/cadences.
- Melody: Weaving counterpoint, expressive intervals, suspensions, and appoggiaturas.
- Structure: Create a full compelling arrangement that flows and evolves beautifully across the entire requested duration. Do not repeat a single bar, make the progression evolve and modulate!
`;

export async function generateFullSong(
  prompt: string,
  totalSteps: number,
  currentTempo: number,
): Promise<Project> {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      tempo: { type: Type.INTEGER, description: "BPM (e.g. 70-130)" },
      tracks: { type: Type.ARRAY, items: trackSchema },
    },
    required: ["tempo", "tracks"],
  };

  const fullPrompt = `You are an expert music producer. Create a full multi-track song JSON.
Total duration: ${totalSteps} sixteenth notes (approx ${totalSteps / 16} bars).
User Request: ${prompt}

${MUSICAL_RULES}

Ensure notes stay within range C2-C6 and strictly respect duration bounds (startStep < ${totalSteps}). Make sure to utilize multiple tracks for harmony (arps, bass, lead, pads).`;

  const response = await requireAiClient().models.generateContent({
    model: "gemini-2.5-flash",
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.85,
    },
  });

  const data = JSON.parse(response.text || "{}") as GeneratedSongPayload;

  const tracks: Track[] = (data.tracks || []).map((trackData, trackIndex) => {
    const notes = mapGeneratedNotes({
      notes: trackData.notes,
      totalSteps,
      prefix: "n",
      trackIndex,
    });

    return {
      id: "trk_" + Date.now() + "_" + trackIndex,
      name: trackData.name || "Generated",
      instrument: (trackData.instrument || "square") as InstrumentType,
      color: ["#4E4A42", "#BAB5A1", "#C4C1B3", "#8B8678", "#5E5A51"][
        trackIndex % 5
      ],
      muted: false,
      solo: false,
      volume: -6,
      notes,
    };
  });

  return { tempo: data.tempo || currentTempo, totalSteps, tracks };
}

export async function generateSongExtension(
  prompt: string,
  context: Project,
  addedSteps: number,
): Promise<Project> {
  const startStep = context.totalSteps;
  const endStep = context.totalSteps + addedSteps;

  const contextStr = context.tracks
    .map(
      (t, i) =>
        `Track ${i} "${t.name}" (${t.instrument}) last notes: ` +
        t.notes
          .filter((n) => n.startStep >= startStep - 32)
          .slice(-10)
          .map((n) => `${n.note}@${n.startStep}`)
          .join(", "),
    )
    .join("\\n");

  const fullPrompt = `You are an expert producer extending a song. Context ends at step ${startStep}. Generate notes from ${startStep} to ${endStep}.

Tempo: ${context.tempo} BPM.
Existing Track context (last 2 bars notes):
${contextStr}

User Request: ${prompt}
${MUSICAL_RULES}

Output EXACTLY ${context.tracks.length} tracks in the exact same order. ONLY include NEW notes falling between step ${startStep} and ${endStep}. Continue the emotional progression strongly to build ${addedSteps / 16} more bars.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: { tracks: { type: Type.ARRAY, items: trackSchema } },
    required: ["tracks"],
  };

  const response = await requireAiClient().models.generateContent({
    model: "gemini-2.5-flash",
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.85,
    },
  });

  const data = JSON.parse(response.text || "{}") as GeneratedSongPayload;
  const updatedTracks = context.tracks.map((track, trackIndex) => {
    const generatedTrack = data.tracks?.[trackIndex];
    const notes = mapGeneratedNotes({
      notes: generatedTrack?.notes,
      totalSteps: endStep,
      startStep,
      endStep,
      prefix: "n_ext",
      trackIndex,
    });

    return { ...track, notes: [...track.notes, ...notes] };
  });

  return { ...context, totalSteps: endStep, tracks: updatedTracks };
}

export async function generateTrack(
  prompt: string,
  totalSteps: number,
  context: Project,
): Promise<Track> {
  const contextStr = context.tracks
    .map((t) => `Track "${t.name}" (${t.instrument})`)
    .join("\\n");

  const fullPrompt = `Add ONE new track to an existing composition.
Tempo: ${context.tempo} BPM. Duration: ${totalSteps} steps (16th notes).
Existing Tracks: ${contextStr}
User Request: ${prompt}
${MUSICAL_RULES} Make sure it harmonizes and adds emotion.`;

  const response = await requireAiClient().models.generateContent({
    model: "gemini-2.5-flash",
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: trackSchema,
      temperature: 0.85,
    },
  });

  const trackData = JSON.parse(response.text || "{}") as GeneratedTrackPayload;
  const notes = mapGeneratedNotes({
    notes: trackData.notes,
    totalSteps,
    prefix: "n_gen",
    trackIndex: 0,
  });

  return {
    id: "trk_" + Date.now(),
    name: trackData.name || "New Track",
    instrument: (trackData.instrument || "square") as InstrumentType,
    color: "#4E4A42",
    muted: false,
    solo: false,
    volume: -6,
    notes,
  };
}
