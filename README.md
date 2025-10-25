# Bio for Dummies - LiveKit Voice Agent

Real-time voice agent for explaining biomedical terms using LiveKit, OpenAI, and ElevenLabs.

## Architecture

```
Extension (LiveKit Client) ←→ LiveKit Cloud ←→ Agent (Node.js)
     ↓ publishes audio              ↓              ↓ processes
     ↓ subscribes audio             ↓              ↓ STT → LLM → TTS
     ↓ data channels                ↓              ↓ retrieval
```

## Prerequisites

- Node.js 18+ and pnpm
- LiveKit Cloud account
- API Keys: OpenAI, ElevenLabs, LiveKit API key + secret

## Setup

```bash
# Install dependencies
pnpm install

# Build shared types
cd packages/types && pnpm build && cd ../..

# Configure environment
cp .env.example .env
# Edit .env and add: LIVEKIT_API_SECRET, OPENAI_API_KEY, ELEVENLABS_API_KEY
```

## Run

```bash
# Terminal 1: Token server
cd server && pnpm dev

# Terminal 2: Agent  
cd agent && pnpm dev

# Terminal 3: Extension build
cd extension && pnpm dev
```

Load extension: `chrome://extensions` → Developer mode → Load unpacked → select `extension/dist`

## Usage

1. Click extension icon
2. Hold mic button and speak: "What is a cytokine storm?"
3. Release button
4. View live captions and answer with sources

## Structure

```
├── extension/    # Chrome MV3 + React + LiveKit client
├── server/       # Fastify token server
├── agent/        # LiveKit agent (STT → LLM → TTS)
└── packages/     # Shared types
```

## Notes

- Audio pipeline partially implemented (STT/TTS providers defined, LiveKit integration needs audio format conversion)
- Current STT uses OpenAI Whisper API (local whisper.cpp interface available)
- Extension icons are placeholders - replace with actual PNG files
