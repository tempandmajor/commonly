// Transcription service - not implemented yet
// This service will be implemented when OpenAI integration is added

export interface TranscriptionOptions {
  language?: string | undefined;
  prompt?: string | undefined;
  response_format?: 'json' | undefined| 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number | undefined;
  timestamp_granularities?: ('word' | undefined| 'segment')[];
}

export interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  text: string;
  segments?: TranscriptionSegment[] | undefined;
  words?: TranscriptionWord[] | undefined;
  language?: string | undefined;
  duration?: number | undefined;
}

export interface TranscriptionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: TranscriptionResult | undefined;
  error?: string | undefined;
  createdAt: Date;
  completedAt?: Date | undefined;
}

class TranscriptionService {
  private jobs: Map<string, TranscriptionJob> = new Map();

  constructor() {
    // Transcription service not implemented yet
  }

  async transcribeAudio(
    audioFile: File | Blob,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    throw new Error('Transcription service not implemented yet');
  }

  async transcribeVideo(
    videoFile: File | Blob,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    throw new Error('Transcription service not implemented yet');
  }

  async transcribeLongAudio(
    audioFile: File | Blob,
    options: TranscriptionOptions = {}
  ): Promise<string> {
    throw new Error('Transcription service not implemented yet');
  }

  getJobStatus(jobId: string): TranscriptionJob | null {
    return this.jobs.get(jobId) || null;
  }

  convertToSRT(result: TranscriptionResult): string {
    throw new Error('Transcription service not implemented yet');
  }

  convertToVTT(result: TranscriptionResult): string {
    throw new Error('Transcription service not implemented yet');
  }

  async startRealtimeTranscription(
    stream: MediaStream,
    onTranscription: (text: string) => void,
    options: TranscriptionOptions = {}
  ): Promise<() => void> {
    throw new Error('Transcription service not implemented yet');
  }
}

export default new TranscriptionService();
