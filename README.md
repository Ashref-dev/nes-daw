# daw.ashref.tn

Browser-based DAW for arranging, generating, importing, and exporting MIDI.

## Production URL

https://daw.ashref.tn

## Development

Prerequisite: Bun.

1. Install dependencies:
   `bun install`
2. Copy the environment file:
   `cp .env.example .env.local`
3. Set `GEMINI_API_KEY` in `.env.local` if you want AI generation features.
4. Start the app:
   `bun run dev`

## Commands

- `bun run dev` - start the Vite dev server
- `bun run dev:portless` - start the app through Portless
- `bun run format` - format the project with Prettier
- `bun run lint` - run ESLint and TypeScript checks
- `bun run build` - create a production build
