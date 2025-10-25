import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface STTProvider {
  start(): Promise<void>;
  write(audioData: Int16Array): void;
  stop(): Promise<void>;
  on(event: 'partial', listener: (text: string) => void): this;
  on(event: 'final', listener: (text: string) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
}

export class WhisperSTT extends EventEmitter implements STTProvider {
  private modelPath: string;
  private process: ChildProcess | null = null;
  private buffer: string = '';
  private isRunning: boolean = false;

  constructor(modelPath: string = './models/ggml-base.en.bin') {
    super();
    this.modelPath = modelPath;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('WhisperSTT already running');
    }

    console.log('🎤 Starting Whisper STT...');

    // Note: This is a simplified implementation
    // In production, you'd spawn the actual whisper.cpp process
    // For now, we'll create a mock implementation that demonstrates the interface
    
    this.isRunning = true;
    console.log('✅ Whisper STT started (mock mode)');
  }

  write(audioData: Int16Array): void {
    if (!this.isRunning) {
      return;
    }

    // In a real implementation, this would:
    // 1. Convert Int16Array to the format whisper.cpp expects
    // 2. Write to the whisper process stdin
    // 3. Read from stdout and parse transcription results
    
    // Mock: Simulate partial transcriptions
    // This would be replaced with actual whisper.cpp integration
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('⏹️ Stopping Whisper STT...');
    
    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    this.isRunning = false;
    console.log('✅ Whisper STT stopped');
  }
}

// Simple OpenAI Whisper API-based STT as an alternative
export class OpenAIWhisperSTT extends EventEmitter implements STTProvider {
  private audioBuffer: Int16Array[] = [];
  private isRunning: boolean = false;
  private silenceThreshold: number = 500; // ms
  private lastAudioTime: number = 0;
  private checkInterval: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('OpenAIWhisperSTT already running');
    }

    console.log('🎤 Starting OpenAI Whisper STT...');
    this.isRunning = true;
    this.audioBuffer = [];
    this.lastAudioTime = Date.now();

    // Check for silence and process accumulated audio
    this.checkInterval = setInterval(() => {
      this.checkForSilence();
    }, 100);

    console.log('✅ OpenAI Whisper STT started');
  }

  write(audioData: Int16Array): void {
    if (!this.isRunning) {
      return;
    }

    // Accumulate audio data
    this.audioBuffer.push(audioData);
    this.lastAudioTime = Date.now();

    // Emit partial (in real implementation, this would use streaming)
    // For now, just log
    if (this.audioBuffer.length % 50 === 0) {
      this.emit('partial', '[Processing audio...]');
    }
  }

  private checkForSilence(): void {
    const now = Date.now();
    const silenceDuration = now - this.lastAudioTime;

    if (silenceDuration > this.silenceThreshold && this.audioBuffer.length > 0) {
      // Process accumulated audio
      this.processAudio();
    }
  }

  private async processAudio(): Promise<void> {
    if (this.audioBuffer.length === 0) {
      return;
    }

    console.log(`📝 Processing ${this.audioBuffer.length} audio chunks...`);
    
    // In real implementation:
    // 1. Convert Int16Array buffer to WAV/MP3
    // 2. Call OpenAI Whisper API
    // 3. Emit final transcription
    
    // Mock result for now
    this.emit('final', 'Mock transcription: User spoke something');
    this.audioBuffer = [];
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('⏹️ Stopping OpenAI Whisper STT...');
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Process any remaining audio
    await this.processAudio();

    this.isRunning = false;
    console.log('✅ OpenAI Whisper STT stopped');
  }
}

// Factory function
export function createSTTProvider(): STTProvider {
  const whisperPath = process.env.WHISPER_MODEL_PATH;
  
  // For now, use OpenAI Whisper API-based STT
  // Can be switched to WhisperSTT once whisper.cpp is set up
  return new OpenAIWhisperSTT();
}

