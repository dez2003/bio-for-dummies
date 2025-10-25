import { Room, RemoteTrack, RemoteParticipant, Track } from 'livekit-client';
import type { UserPreferences, CaptionMessage, AnswerMessage, PageContext } from '@bio-agent/types';
import { createSTTProvider, STTProvider } from './providers/stt.js';
import { createTTSProvider, TTSProvider } from './providers/tts.js';
import { generateAnswer } from './providers/llm.js';

export class AgentPipeline {
  private room: Room;
  private sttProvider: STTProvider;
  private ttsProvider: TTSProvider;
  private userPreferences: UserPreferences;
  private pageContext?: PageContext;
  private isProcessing: boolean = false;

  constructor(room: Room) {
    this.room = room;
    this.sttProvider = createSTTProvider();
    this.ttsProvider = createTTSProvider();
    
    // Default preferences
    this.userPreferences = {
      mode: 'ELI5',
      detail: 'summary+sources'
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for new audio tracks from users
    this.room.on('trackSubscribed', async (track: RemoteTrack, publication, participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Audio && !participant.identity.startsWith('agent:')) {
        console.log(`🎧 Subscribed to audio track from ${participant.identity}`);
        await this.handleAudioTrack(track);
      }
    });

    // Listen for data messages (preferences, context)
    this.room.on('dataReceived', (payload: Uint8Array, participant) => {
      try {
        const message = JSON.parse(new TextDecoder().decode(payload));
        this.handleDataMessage(message, participant);
      } catch (error) {
        console.error('Error parsing data message:', error);
      }
    });

    // STT event handlers
    this.sttProvider.on('partial', (text: string) => {
      this.sendCaption({ type: 'partial', text });
    });

    this.sttProvider.on('final', async (text: string) => {
      this.sendCaption({ type: 'final', text });
      await this.processQuery(text);
    });

    this.sttProvider.on('error', (error: Error) => {
      console.error('STT error:', error);
    });
  }

  private handleDataMessage(message: any, participant?: RemoteParticipant): void {
    console.log('📨 Received data message:', message.type);

    if (message.type === 'preferences') {
      this.userPreferences = message.preferences;
      console.log(`⚙️ Updated preferences: ${this.userPreferences.mode}, ${this.userPreferences.detail}`);
    } else if (message.type === 'context') {
      this.pageContext = message.context;
      console.log(`📄 Received page context: ${this.pageContext?.title}`);
    }
  }

  private async handleAudioTrack(track: RemoteTrack): Promise<void> {
    console.log('🎤 Starting audio processing pipeline...');

    try {
      await this.sttProvider.start();

      // In a real implementation, we would:
      // 1. Get MediaStream from track
      // 2. Use Web Audio API or similar to convert to PCM
      // 3. Feed chunks to STT provider
      
      // Note: This requires proper audio processing
      // The actual implementation would use track.mediaStream and AudioContext
      
      console.log('✅ Audio pipeline initialized');
    } catch (error) {
      console.error('Error in audio pipeline:', error);
    }
  }

  private async processQuery(query: string): Promise<void> {
    if (this.isProcessing) {
      console.log('⏳ Already processing a query, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log(`❓ Processing query: "${query}"`);

    try {
      // Generate answer using LLM + retrieval
      const answer = await generateAnswer(
        query,
        this.userPreferences,
        this.pageContext?.selection || this.pageContext?.surroundingText
      );

      // Send answer metadata
      this.sendAnswer(answer);

      // Stream TTS response
      await this.streamTTSResponse(answer.summary);

    } catch (error) {
      console.error('Error processing query:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async streamTTSResponse(text: string): Promise<void> {
    console.log('🔊 Streaming TTS response...');

    try {
      // In a real implementation, we would:
      // 1. Get audio chunks from TTS provider
      // 2. Convert to appropriate format for LiveKit
      // 3. Publish as LocalAudioTrack
      
      // For now, we'll just iterate through the stream
      for await (const chunk of this.ttsProvider.speakStream(text)) {
        // TODO: Publish audio chunk to LiveKit room
        // This requires creating a LocalAudioTrack and publishing it
      }

      console.log('✅ TTS streaming completed');
    } catch (error) {
      console.error('Error streaming TTS:', error);
    }
  }

  private sendCaption(caption: CaptionMessage): void {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(caption));
    
    this.room.localParticipant.publishData(data, { reliable: true });
  }

  private sendAnswer(answer: AnswerMessage): void {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(answer));
    
    this.room.localParticipant.publishData(data, { reliable: true });
    console.log('✅ Sent answer to room');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up pipeline...');
    await this.sttProvider.stop();
  }
}

