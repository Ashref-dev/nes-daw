# midi.ashref.tn

A browser-based Digital Audio Workstation (DAW) for creating authentic NES (Nintendo Entertainment System) music with Mega Man-style sounds. Play, compose, and record chiptune music directly in your browser using Web Audio API synthesis.

Live at **[midi.ashref.tn](https://midi.ashref.tn)**

![midi.ashref.tn](https://img.shields.io/badge/midi.ashref.tn-NES%20DAW-ff4a4a)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

## Features

### Audio Engine
- **Authentic NES Sound Chip Emulation**: 4-channel synthesis (Pulse 1, Pulse 2, Triangle, Noise)
- **Periodic Wave Synthesis**: Custom-generated duty cycle waves (12.5%, 25%, 50%, 75%) using Fourier series
- **Web Audio API**: Real-time low-latency synthesis, no samples or external dependencies
- **Mega Man-Inspired Instruments**: 12 presets including lead, echo, bass, arpeggios, kick, snare, hi-hat, and cymbal

### Composition Tools
- **Piano Roll Editor**: Canvas-based timeline with dark theme and channel color coding
- **Note Editing**: Click to add, right-click to remove, drag to move, drag edge to resize
- **Multi-Track View**: Ghost notes from other tracks at 30% opacity for context
- **Transport Controls**: Play, Stop, Record, Pause with BPM control (30-300)
- **Looping**: Enable/disable loop regions for continuous playback
- **Quantization**: 1/4, 1/8, 1/16, 1/32 note grid snapping

### Input Methods
- **MIDI Keyboard Support**: Web MIDI API integration with hot-plug detection
- **Computer Keyboard**: Z-M row (C3-B3) and Q-P row (C4-E5) piano mapping
- **Virtual Piano Keyboard**: 4-octave clickable keyboard at the bottom of the screen
- **Mouse**: Full piano roll interaction with click, drag, and resize

### Recording
- **Real-time Recording**: Capture MIDI/keyboard input to the active pattern
- **Tick-Accurate Timing**: Records at current scheduler position with quantized start times
- **Multi-Track**: Record to any of the 4 NES channels independently

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19 + Tailwind CSS 4
- **State**: Zustand 5
- **Audio**: Web Audio API (no external libraries)
- **MIDI**: Web MIDI API

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A modern browser with Web Audio and Web MIDI support (Chrome, Edge, Firefox)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ashref-dev/midi.ashref.tn.git
cd midi.ashref.tn

# Install dependencies
bun install
# or
npm install

# Run development server
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

1. **Start Audio**: Click the landing screen to initialize the AudioContext
2. **Select a Track**: Click a track in the left panel (Pulse 1, Pulse 2, Triangle, Noise)
3. **Play Notes**:
   - Use your MIDI keyboard
   - Use computer keyboard (Z-M for lower octave, Q-P for upper)
   - Click the virtual piano keys at the bottom
4. **Record**: Click the Record button (red circle) and play notes
5. **Edit**: Click in the piano roll to add notes, right-click to remove, drag to move
6. **Playback**: Click Play to hear your composition

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main DAW layout
│   ├── layout.tsx         # Root layout with dark theme
│   └── globals.css        # Global styles
├── audio/                  # Audio engine (singleton pattern)
│   ├── nes-engine.ts      # Core NES synthesis engine
│   ├── scheduler.ts       # Transport scheduler (look-ahead pattern)
│   ├── midi-manager.ts    # Web MIDI API wrapper
│   ├── instruments.ts     # Mega Man-style instrument presets
│   └── pulse-waves.ts     # Periodic wave generation
├── components/             # React components
│   ├── piano-roll/        # Canvas-based piano roll
│   ├── tracks/            # Track panel sidebar
│   ├── transport/         # Transport controls bar
│   └── instruments/       # Virtual keyboard
├── hooks/                  # Custom React hooks
│   ├── use-nes-engine.ts  # Engine initialization
│   ├── use-scheduler.ts   # Transport control
│   ├── use-midi.ts        # MIDI input handling
│   └── use-keyboard.ts    # Computer keyboard input
├── store/                  # Zustand state management
│   └── daw-store.ts       # Global DAW state
└── types/                  # TypeScript definitions
    └── engine.ts          # Core types (Note, Track, Channel, etc.)
```

## Audio Engine Details

### NES Channel Specifications

| Channel | Waveform | Frequency Range | Use Case |
|---------|----------|-----------------|----------|
| Pulse 1 | Square (12.5%, 25%, 50%, 75%) | Full MIDI | Melody, lead |
| Pulse 2 | Square (12.5%, 25%, 50%, 75%) | Full MIDI | Echo, harmony |
| Triangle | Triangle wave | Full MIDI | Bass, low-end |
| Noise | Pseudorandom noise | Limited | Drums, percussion |

### Synthesis Approach
- **Pulse Waves**: Generated via `createPeriodicWave()` with Fourier coefficients for authentic NES duty cycles
- **Triangle**: Native Web Audio `triangle` oscillator type
- **Noise**: Bandpass-filtered buffer source with pseudorandom samples
- **Envelope**: ADSR-style with instant attack, configurable decay/sustain/release

### Instruments

| ID | Name | Channel | Characteristics |
|----|------|---------|----------------|
| mm-lead | MM Lead (Chirp) | Pulse 1 | 25% duty, medium decay, iconic Mega Man chirp |
| mm-echo | MM Echo | Pulse 2 | 25% duty, longer decay, quieter echo |
| pulse-50 | Square 50% | Pulse 1 | Full square, sustained |
| mm-arp | MM Arpeggio | Pulse 1 | Major chord arpeggio pattern |
| mm-bass | MM Bass | Triangle | Short gated triangle for punchy bass |
| triangle-sustain | Triangle Sustain | Triangle | Long sustained bass |
| mm-kick | MM Kick | Noise | Fast decay, low frequency |
| mm-snare | MM Snare | Noise | Medium decay |
| mm-hihat | MM Hi-Hat | Noise | Short mode, very fast decay |
| mm-cymbal | MM Cymbal | Noise | Short mode, longer decay |

## Keyboard Shortcuts

### Computer Keyboard
| Key | Note |
|-----|------|
| Z | C3 |
| S | C#3 |
| X | D3 |
| D | D#3 |
| C | E3 |
| V | F3 |
| G | F#3 |
| B | G3 |
| H | G#3 |
| N | A3 |
| J | A#3 |
| M | B3 |
| Q | C4 |
| 2 | C#4 |
| W | D4 |
| ... | ... |
| P | E5 |

### Piano Roll
- **Mouse Wheel**: Scroll vertical (notes)
- **Shift + Mouse Wheel**: Scroll horizontal (time)
- **Left Click**: Add note (empty) / Select note (existing)
- **Right Click**: Remove note
- **Drag Note Body**: Move note (quantized)
- **Drag Right Edge**: Resize note duration

## Development

### Project Structure Philosophy
- **Singleton Pattern**: Audio engine, scheduler, and MIDI manager are singletons
- **Store-Driven UI**: Zustand store holds all state; canvas reads directly via `getState()`
- **No Re-renders on Canvas**: Piano roll uses `requestAnimationFrame` loop reading from store
- **Hooks Bridge**: React hooks connect singletons to components

### Building for Production

```bash
bun run build
# or
npm run build
```

The output will be in `.next/` for deployment to Vercel or other Next.js-compatible platforms.

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Web Audio API | ✅ | ✅ | ✅ | ✅ |
| Web MIDI API | ✅ | ✅ | ✅* | ❌ |
| Canvas 2D | ✅ | ✅ | ✅ | ✅ |

*Firefox requires enabling Web MIDI in `about:config`

## Future Enhancements

- [ ] Export to NSF (NES Sound Format)
- [ ] Export to WAV
- [ ] Pattern sequencing (arrangement view)
- [ ] Effects (pitch bend, vibrato, duty cycle sweep)
- [ ] Save/load songs (JSON export/import)
- [ ] DPCM channel support (sample playback)
- [ ] Mobile/touch optimization

## Credits

Created by **[Ashref.Tn](https://ashref.tn)** | [GitHub](https://github.com/Ashref-dev)

Inspired by the iconic soundtracks of:
- Mega Man 1 (1987, Capcom)
- Mega Man 2 (1988, Capcom)
- The NES APU (Audio Processing Unit)

## License

MIT License - feel free to use, modify, and distribute.

---

**Built with passion by Ashref.Tn**
