import type { Instrument, NESChannel } from '@/types/engine';

export const INSTRUMENTS: Record<string, Instrument> = {
  // -- PULSE INSTRUMENTS --
  'mm-lead': {
    id: 'mm-lead',
    name: 'MM Lead (Chirp)',
    channel: 'pulse1',
    dutyCycle: 0.25,
    envelope: { attack: 0, decay: 0.3, sustain: 0.6, release: 0.01 },
    // The iconic Mega Man chirp: starts at 12.5%, switches to 25% after 2 frames
    dutyCycleSequence: [0.125, 0.25],
    dutyCycleSwitchFrames: 2,
  },
  'mm-echo': {
    id: 'mm-echo',
    name: 'MM Echo',
    channel: 'pulse2',
    dutyCycle: 0.25,
    envelope: { attack: 0, decay: 0.5, sustain: 0.3, release: 0.01 },
    // Echo is same as lead but quieter (handled by velocity in engine)
  },
  'pulse-50': {
    id: 'pulse-50',
    name: 'Square 50%',
    channel: 'pulse1',
    dutyCycle: 0.5,
    envelope: { attack: 0, decay: 0.8, sustain: 0.7, release: 0.05 },
  },
  'pulse-25': {
    id: 'pulse-25',
    name: 'Pulse 25%',
    channel: 'pulse1',
    dutyCycle: 0.25,
    envelope: { attack: 0, decay: 0.6, sustain: 0.5, release: 0.02 },
  },
  'pulse-125': {
    id: 'pulse-125',
    name: 'Pulse 12.5%',
    channel: 'pulse1',
    dutyCycle: 0.125,
    envelope: { attack: 0, decay: 0.4, sustain: 0.4, release: 0.01 },
  },
  'mm-arp': {
    id: 'mm-arp',
    name: 'MM Arpeggio',
    channel: 'pulse1',
    dutyCycle: 0.5,
    envelope: { attack: 0, decay: 1.0, sustain: 0.8, release: 0.02 },
    arpeggioPattern: [0, 4, 7],  // major chord
    arpeggioSpeed: 3,  // frames per step (very fast NES arp)
  },
  
  // -- TRIANGLE INSTRUMENTS --
  'mm-bass': {
    id: 'mm-bass',
    name: 'MM Bass',
    channel: 'triangle',
    envelope: { attack: 0, decay: 0.2, sustain: 0, release: 0 },
    // Short gated triangle for punchy bass
  },
  'triangle-sustain': {
    id: 'triangle-sustain',
    name: 'Triangle Sustain',
    channel: 'triangle',
    envelope: { attack: 0, decay: 0, sustain: 1.0, release: 0.05 },
    // Long sustained triangle for melodic bass lines
  },
  
  // -- NOISE INSTRUMENTS --
  'mm-kick': {
    id: 'mm-kick',
    name: 'MM Kick',
    channel: 'noise',
    noiseMode: 'long',
    envelope: { attack: 0, decay: 0.08, sustain: 0, release: 0 },
    // Very fast decay for punchy kick
  },
  'mm-snare': {
    id: 'mm-snare',
    name: 'MM Snare',
    channel: 'noise',
    noiseMode: 'long',
    envelope: { attack: 0, decay: 0.15, sustain: 0, release: 0 },
    // Medium decay for snare
  },
  'mm-hihat': {
    id: 'mm-hihat',
    name: 'MM Hi-Hat',
    channel: 'noise',
    noiseMode: 'short',
    envelope: { attack: 0, decay: 0.05, sustain: 0, release: 0 },
    // Very short metallic hit
  },
  'mm-cymbal': {
    id: 'mm-cymbal',
    name: 'MM Cymbal',
    channel: 'noise',
    noiseMode: 'short',
    envelope: { attack: 0, decay: 0.4, sustain: 0.1, release: 0.1 },
    // Longer metallic ring
  },
};

// Helper to get instruments by channel
export function getInstrumentsByChannel(channel: NESChannel): Instrument[] {
  return Object.values(INSTRUMENTS).filter(i => i.channel === channel);
}

// Get default instrument for a channel
export function getDefaultInstrument(channel: NESChannel): Instrument {
  const defaults: Record<NESChannel, string> = {
    pulse1: 'mm-lead',
    pulse2: 'mm-echo',
    triangle: 'mm-bass',
    noise: 'mm-kick',
  };
  return INSTRUMENTS[defaults[channel]];
}
