import { Room, RoomEvent } from 'livekit-client';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import { AgentPipeline } from './pipeline.js';
import { randomUUID } from 'crypto';

dotenv.config();

async function generateAgentToken(roomName: string): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit API credentials not configured');
  }

  const agentIdentity = `agent:${randomUUID().slice(0, 8)}`;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: agentIdentity,
    ttl: '1h'
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true
  });

  return await at.toJwt();
}

async function startAgent() {
  console.log('🤖 Bio Agent Starting...\n');

  const livekitUrl = process.env.LIVEKIT_URL;
  
  if (!livekitUrl) {
    throw new Error('LIVEKIT_URL not configured');
  }

  // For development, we'll join a default room
  // In production, the agent would join rooms dynamically
  const roomName = process.env.AGENT_ROOM || 'bio-agent:default';
  
  console.log(`🔗 Connecting to room: ${roomName}`);
  console.log(`🌐 LiveKit URL: ${livekitUrl}\n`);

  try {
    // Generate token for agent
    const token = await generateAgentToken(roomName);

    // Create and connect room
    const room = new Room({
      adaptiveStream: true,
      dynacast: true
    });

    // Initialize pipeline
    const pipeline = new AgentPipeline(room);

    // Room event handlers
    room.on(RoomEvent.Connected, () => {
      console.log('✅ Agent connected to room');
      console.log(`👤 Agent identity: ${room.localParticipant.identity}\n`);
      console.log('🎧 Listening for user audio...\n');
    });

    room.on(RoomEvent.Disconnected, () => {
      console.log('❌ Agent disconnected from room');
    });

    room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log(`👋 User joined: ${participant.identity}`);
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log(`👋 User left: ${participant.identity}`);
    });

    // Connect to room
    await room.connect(livekitUrl, token);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n⏹️ Shutting down agent...');
      await pipeline.cleanup();
      await room.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n⏹️ Shutting down agent...');
      await pipeline.cleanup();
      await room.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting agent:', error);
    process.exit(1);
  }
}

// Start the agent
startAgent();

