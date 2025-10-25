import axios from 'axios';

export interface TTSProvider {
  speakStream(text: string, voiceId?: string): AsyncIterable<Buffer>;
}

export class ElevenLabsTTS implements TTSProvider {
  private apiKey: string;
  private defaultVoiceId: string;

  constructor(apiKey: string, defaultVoiceId: string = '21m00Tcm4TlvDq8ikWAM') {
    this.apiKey = apiKey;
    this.defaultVoiceId = defaultVoiceId;
  }

  async *speakStream(text: string, voiceId?: string): AsyncIterable<Buffer> {
    const voice = voiceId || this.defaultVoiceId;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream`;

    console.log(`🔊 Streaming TTS for text: "${text.slice(0, 50)}..."`);

    try {
      const response = await axios.post(
        url,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 30000
        }
      );

      // Stream the audio chunks
      for await (const chunk of response.data) {
        yield chunk;
      }

      console.log(`✅ TTS stream completed`);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }
}

// Factory function
export function createTTSProvider(): TTSProvider {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  return new ElevenLabsTTS(apiKey, voiceId);
}

