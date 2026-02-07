import type { NESChannel } from '@/types/engine';

export interface ScheduledNote {
  channel: NESChannel;
  midiNote: number;
  velocity: number;
  startTick: number;
  durationTicks: number;
  instrumentId: string;
}

export type NoteScheduleCallback = (note: ScheduledNote, audioTime: number, duration: number) => void;
export type TickCallback = (tick: number) => void;
export type TransportChangeCallback = (state: 'playing' | 'stopped' | 'recording') => void;

class Scheduler {
  private bpm: number = 150;
  private ppqn: number = 96;
  
  private state: 'stopped' | 'playing' | 'recording' = 'stopped';
  private currentTick: number = 0;
  
  private audioContext: AudioContext | null = null;
  private scheduleAheadTime: number = 0.1;
  private schedulerInterval: number = 25;
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private nextTickTime: number = 0;
  
  private loopEnabled: boolean = false;
  private loopStart: number = 0;
  private loopEnd: number = 1536;
  
  private songLength: number = 1536;
  
  private scheduledNotes: ScheduledNote[] = [];
  
  private onNoteSchedule: NoteScheduleCallback | null = null;
  private onTick: TickCallback | null = null;
  private onTransportChange: TransportChangeCallback | null = null;
  
  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
  }
  
  setBpm(bpm: number): void {
    this.bpm = Math.max(30, Math.min(300, bpm));
  }
  
  getBpm(): number { return this.bpm; }
  
  setPpqn(ppqn: number): void { this.ppqn = ppqn; }
  
  setLoop(enabled: boolean, start?: number, end?: number): void {
    this.loopEnabled = enabled;
    if (start !== undefined) this.loopStart = start;
    if (end !== undefined) this.loopEnd = end;
  }
  
  setSongLength(ticks: number): void {
    this.songLength = ticks;
  }
  
  loadNotes(notes: ScheduledNote[]): void {
    this.scheduledNotes = [...notes];
  }
  
  setNoteScheduleCallback(cb: NoteScheduleCallback): void { this.onNoteSchedule = cb; }
  setTickCallback(cb: TickCallback): void { this.onTick = cb; }
  setTransportChangeCallback(cb: TransportChangeCallback): void { this.onTransportChange = cb; }
  
  private ticksToSeconds(ticks: number): number {
    const secondsPerBeat = 60.0 / this.bpm;
    return (ticks / this.ppqn) * secondsPerBeat;
  }
  
  getPositionSeconds(): number {
    return this.ticksToSeconds(this.currentTick);
  }
  
  getCurrentTick(): number { return this.currentTick; }
  
  getState(): 'stopped' | 'playing' | 'recording' { return this.state; }
  
  play(): void {
    if (!this.audioContext || this.state === 'playing') return;
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.state = 'playing';
    this.nextTickTime = this.audioContext.currentTime;
    this.onTransportChange?.('playing');
    this.startScheduler();
  }
  
  record(): void {
    if (!this.audioContext) return;
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.state = 'recording';
    this.nextTickTime = this.audioContext.currentTime;
    this.onTransportChange?.('recording');
    this.startScheduler();
  }
  
  stop(): void {
    this.state = 'stopped';
    this.stopScheduler();
    this.currentTick = 0;
    this.onTransportChange?.('stopped');
    this.onTick?.(0);
  }
  
  pause(): void {
    this.state = 'stopped';
    this.stopScheduler();
    this.onTransportChange?.('stopped');
  }
  
  seekTo(tick: number): void {
    this.currentTick = Math.max(0, tick);
    this.onTick?.(this.currentTick);
    if (this.state === 'playing' && this.audioContext) {
      this.nextTickTime = this.audioContext.currentTime;
    }
  }
  
  private startScheduler(): void {
    this.stopScheduler();
    this.timerHandle = setInterval(() => this.schedulerTick(), this.schedulerInterval);
  }
  
  private stopScheduler(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }
  
  private schedulerTick(): void {
    if (!this.audioContext || this.state === 'stopped') return;
    
    while (this.nextTickTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.processTickAtTime(this.currentTick, this.nextTickTime);
      this.advanceTick();
    }
  }
  
  private processTickAtTime(tick: number, audioTime: number): void {
    this.onTick?.(tick);
    
    for (const note of this.scheduledNotes) {
      if (note.startTick === tick) {
        const durationSecs = this.ticksToSeconds(note.durationTicks);
        this.onNoteSchedule?.(note, audioTime, durationSecs);
      }
    }
  }
  
  private advanceTick(): void {
    const secondsPerTick = this.ticksToSeconds(1);
    this.nextTickTime += secondsPerTick;
    this.currentTick++;
    
    if (this.loopEnabled && this.currentTick >= this.loopEnd) {
      this.currentTick = this.loopStart;
    }
    else if (!this.loopEnabled && this.currentTick >= this.songLength) {
      this.stop();
    }
  }
  
  dispose(): void {
    this.stop();
    this.scheduledNotes = [];
    this.audioContext = null;
  }
}

export const scheduler = new Scheduler();
