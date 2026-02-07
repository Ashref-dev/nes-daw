export type MIDINoteCallback = (midiNote: number, velocity: number) => void;
export type MIDIPitchBendCallback = (value: number) => void;
export type MIDIConnectionCallback = (connected: boolean, deviceName: string | null) => void;

class MIDIManager {
  private midiAccess: MIDIAccess | null = null;
  private activeInput: MIDIInput | null = null;
  
  private onNoteOn: MIDINoteCallback | null = null;
  private onNoteOff: MIDINoteCallback | null = null;
  private onPitchBend: MIDIPitchBendCallback | null = null;
  private onConnectionChange: MIDIConnectionCallback | null = null;
  
  async init(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not available in this browser');
      return false;
    }
    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      this.midiAccess.onstatechange = (e) => this.handleStateChange(e);
      this.connectToFirstInput();
      return true;
    } catch (err) {
      console.warn('MIDI access denied:', err);
      return false;
    }
  }
  
  private connectToFirstInput(): void {
    if (!this.midiAccess) return;
    for (const input of this.midiAccess.inputs.values()) {
      if (input.state === 'connected') {
        this.connectToInput(input);
        break;
      }
    }
  }
  
  private connectToInput(input: MIDIInput): void {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
    }
    this.activeInput = input;
    this.activeInput.onmidimessage = (e) => this.handleMessage(e);
    this.onConnectionChange?.(true, input.name ?? 'Unknown Device');
  }
  
  private handleStateChange(e: Event): void {
    const evt = e as MIDIConnectionEvent;
    if (evt.port?.type === 'input') {
      if (evt.port.state === 'connected' && !this.activeInput) {
        this.connectToInput(evt.port as MIDIInput);
      } else if (evt.port.state === 'disconnected' && this.activeInput?.id === evt.port.id) {
        this.activeInput = null;
        this.onConnectionChange?.(false, null);
        this.connectToFirstInput();
      }
    }
  }
  
  private handleMessage(event: MIDIMessageEvent): void {
    const data = event.data;
    if (!data || data.length < 2) return;
    
    const status = data[0];
    const command = status & 0xf0;
    const note = data[1];
    const velocity = data.length > 2 ? data[2] : 0;
    
    switch (command) {
      case 0x90:
        if (velocity > 0) {
          this.onNoteOn?.(note, velocity);
        } else {
          this.onNoteOff?.(note, 0);
        }
        break;
      case 0x80:
        this.onNoteOff?.(note, velocity);
        break;
      case 0xe0:
        const bendValue = ((data[2] << 7) | data[1]) - 8192;
        this.onPitchBend?.(bendValue / 8192);
        break;
    }
  }
  
  setNoteOnCallback(cb: MIDINoteCallback): void { this.onNoteOn = cb; }
  setNoteOffCallback(cb: MIDINoteCallback): void { this.onNoteOff = cb; }
  setPitchBendCallback(cb: MIDIPitchBendCallback): void { this.onPitchBend = cb; }
  setConnectionCallback(cb: MIDIConnectionCallback): void { this.onConnectionChange = cb; }
  
  getInputs(): MIDIInput[] {
    if (!this.midiAccess) return [];
    return Array.from(this.midiAccess.inputs.values());
  }
  
  connectToInputById(id: string): void {
    if (!this.midiAccess) return;
    const input = this.midiAccess.inputs.get(id);
    if (input) this.connectToInput(input);
  }
  
  isConnected(): boolean { return this.activeInput !== null; }
  getDeviceName(): string | null { return this.activeInput?.name ?? null; }
  
  dispose(): void {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      this.activeInput = null;
    }
    this.midiAccess = null;
  }
}

export const midiManager = new MIDIManager();
