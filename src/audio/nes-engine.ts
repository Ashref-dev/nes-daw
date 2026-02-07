import { createNESPulseWaves, type PulseWaveSet, type DutyCycle } from './pulse-waves';
import type { NESChannel, EnvelopeParams } from '@/types/engine';

export type NotePlaybackParams = {
  dutyCycle?: DutyCycle;
  velocity: number;
  envelope?: EnvelopeParams;
  noiseMode?: 'long' | 'short';
};

interface ActiveVoice {
  source: AudioScheduledSourceNode;
  gain: GainNode;
  channel: NESChannel;
}

class NESEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private channelGains: Record<NESChannel, GainNode> | null = null;
  private pulseWaves: PulseWaveSet | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private activeVoices: Map<number, ActiveVoice> = new Map();
  private nextVoiceId = 1;
  private isMuted = false;
  private masterVolume = 0.5;

  constructor() {}

  public init() {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.masterGain.connect(this.ctx.destination);

    this.channelGains = {
      pulse1: this.ctx.createGain(),
      pulse2: this.ctx.createGain(),
      triangle: this.ctx.createGain(),
      noise: this.ctx.createGain(),
    };

    this.channelGains.pulse1.connect(this.masterGain);
    this.channelGains.pulse2.connect(this.masterGain);
    this.channelGains.triangle.connect(this.masterGain);
    this.channelGains.noise.connect(this.masterGain);

    this.pulseWaves = createNESPulseWaves(this.ctx);
    this.createNoiseBuffer();
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  private midiToFreq(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  private applyEnvelope(
    ctx: AudioContext,
    paramGain: GainNode,
    velocity: number,
    startTime: number,
    envelope?: EnvelopeParams
  ) {
    const decay = envelope?.decay ?? 0.1;
    const sustain = envelope?.sustain ?? 0.5;

    const peakGain = velocity / 127;
    const sustainLevel = peakGain * sustain;

    paramGain.gain.setValueAtTime(0, startTime);
    paramGain.gain.linearRampToValueAtTime(peakGain, startTime + 0.005);
    paramGain.gain.linearRampToValueAtTime(sustainLevel, startTime + 0.005 + decay);
  }

  public playPulseNote(
    channel: 'pulse1' | 'pulse2',
    midiNote: number,
    velocity: number,
    dutyCycle: DutyCycle = 0.5,
    envelope?: EnvelopeParams
  ): number {
    if (!this.ctx || !this.pulseWaves || !this.channelGains) return -1;

    const osc = this.ctx.createOscillator();
    const voiceGain = this.ctx.createGain();
    const frequency = this.midiToFreq(midiNote);

    osc.setPeriodicWave(this.pulseWaves[dutyCycle]);
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    this.applyEnvelope(this.ctx, voiceGain, velocity, this.ctx.currentTime, envelope);

    osc.connect(voiceGain);
    voiceGain.connect(this.channelGains[channel]);

    osc.start();

    const id = this.nextVoiceId++;
    this.activeVoices.set(id, { source: osc, gain: voiceGain, channel });

    osc.onended = () => {
      this.activeVoices.delete(id);
    };

    return id;
  }

  public playTriangleNote(midiNote: number, envelope?: EnvelopeParams): number {
    if (!this.ctx || !this.channelGains) return -1;

    const osc = this.ctx.createOscillator();
    const voiceGain = this.ctx.createGain();
    const frequency = this.midiToFreq(midiNote);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    const peakGain = 0.25; 
    
    voiceGain.gain.setValueAtTime(0, this.ctx.currentTime);
    voiceGain.gain.linearRampToValueAtTime(peakGain, this.ctx.currentTime + 0.005);
    
    if (envelope) {
         const sustainLevel = peakGain * envelope.sustain;
         voiceGain.gain.linearRampToValueAtTime(sustainLevel, this.ctx.currentTime + 0.005 + envelope.decay);
    }

    osc.connect(voiceGain);
    voiceGain.connect(this.channelGains.triangle);

    osc.start();

    const id = this.nextVoiceId++;
    this.activeVoices.set(id, { source: osc, gain: voiceGain, channel: 'triangle' });

    osc.onended = () => {
      this.activeVoices.delete(id);
    };

    return id;
  }

  public playNoise(
    mode: 'long' | 'short',
    frequency: number,
    velocity: number,
    envelope?: EnvelopeParams
  ): number {
    if (!this.ctx || !this.noiseBuffer || !this.channelGains) return -1;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    filter.Q.value = 1;

    const voiceGain = this.ctx.createGain();

    this.applyEnvelope(this.ctx, voiceGain, velocity, this.ctx.currentTime, envelope);

    source.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(this.channelGains.noise);

    source.start();

    const id = this.nextVoiceId++;
    this.activeVoices.set(id, { source, gain: voiceGain, channel: 'noise' });

    source.onended = () => {
      this.activeVoices.delete(id);
    };

    return id;
  }

  public stopNote(voiceId: number) {
    if (!this.ctx) return;
    const voice = this.activeVoices.get(voiceId);
    if (!voice) return;

    const now = this.ctx.currentTime;
    
    voice.gain.gain.cancelScheduledValues(now);
    
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + 0.005);

    voice.source.stop(now + 0.010);
  }

  public scheduleNote(
    channel: NESChannel,
    midiNote: number,
    startTime: number,
    duration: number,
    params: NotePlaybackParams
  ) {
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const delay = Math.max(0, startTime - now);
    
    setTimeout(() => {
        let id = -1;
        if (channel === 'pulse1' || channel === 'pulse2') {
            id = this.playPulseNote(channel, midiNote, params.velocity, params.dutyCycle, params.envelope);
        } else if (channel === 'triangle') {
            id = this.playTriangleNote(midiNote, params.envelope);
        } else if (channel === 'noise') {
            const freq = this.midiToFreq(midiNote);
            id = this.playNoise(params.noiseMode || 'long', freq, params.velocity, params.envelope);
        }
        
        if (id !== -1) {
            setTimeout(() => {
                this.stopNote(id);
            }, duration * 1000);
        }
    }, delay * 1000);
  }

  public stopAllNotes() {
    this.activeVoices.forEach((voice, id) => {
        this.stopNote(id);
    });
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && !this.isMuted) {
        this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx?.currentTime || 0, 0.01);
    }
  }

  public mute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
        const target = muted ? 0 : this.masterVolume;
        this.masterGain.gain.setTargetAtTime(target, this.ctx?.currentTime || 0, 0.01);
    }
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public dispose() {
    this.stopAllNotes();
    if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
    }
  }
}

export const nesEngine = new NESEngine();
