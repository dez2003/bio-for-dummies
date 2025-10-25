import Fastify from 'fastify';
import cors from '@fastify/cors';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Enable CORS for extension
await fastify.register(cors, {
  origin: true
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { ok: true, timestamp: new Date().toISOString() };
});

// Token generation endpoint
fastify.get('/token', async (request, reply) => {
  const { room, identity } = request.query as { room?: string; identity?: string };

  if (!room || !identity) {
    return reply.code(400).send({ error: 'Missing room or identity parameter' });
  }

  // Validate room name
  if (!room.startsWith('bio-agent:')) {
    return reply.code(400).send({ error: 'Invalid room name. Must start with "bio-agent:"' });
  }

  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('LiveKit API credentials not configured');
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: '5m' // 5 minutes
    });

    // Grant permissions
    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const token = await at.toJwt();

    return { token, room, identity };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate token' });
  }
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8787');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`✅ Server listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

