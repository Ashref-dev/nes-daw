# NES DAW

Browser-based DAW for arranging, generating, importing, and exporting MIDI.

- Live app: https://daw.ashref.tn
- Optional AI generation with `GEMINI_API_KEY`

## Development

1. `bun install`
2. `cp .env.example .env.local`
3. Set `GEMINI_API_KEY` in `.env.local` if you want AI features
4. `bun run dev`

## Commands

- `bun run dev`
- `bun run dev:portless`
- `bun run lint`
- `bun run build`
