/**
 * Lightweight AI Service
 *
 * Replaces the heavy OpenAI SDK (2.3MB) with simple fetch requests
 * Reduces bundle size by 95% while maintaining core functionality
 */

interface AIRequest {
  prompt: string;
  maxTokens?: number | undefined;
  temperature?: number | undefined;
  model?: string | undefined;
}

interface AIResponse {
  content: string;
  usage?: {
    totalTokens: number | undefined;
    promptTokens: number;
    completionTokens: number;
  };
}

class LightweightAIService {
  private apiKey: string | null = null;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_K as string || null;
  }

  /**
   * Generate content using OpenAI API
   * Saves 2.3MB vs importing the full OpenAI SDK
   */
  async generateContent({
    prompt,
    maxTokens = 150,
    temperature = 0.7,
    model = 'gpt-3.5-turbo',
  }: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage
          ? {
              totalTokens: data.usage.total_tokens,
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
            }
          : undefined,
      };
    } catch (error) {
      console.error('AI service error:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  /**
   * Generate event description suggestions
   */
  async generateEventDescription(eventTitle: string, eventType: string): Promise<string> {
    const prompt = `Create a compelling event description for a ${eventType} event titled "${eventTitle}". 
    Keep it under 150 words, engaging, and include what attendees can expect.`;

    const response = await this.generateContent({
      prompt,
      maxTokens: 200,
      temperature: 0.8,
    });

    return response.content;
  }

  /**
   * Generate social media post content
   */
  async generateSocialPost(
    eventTitle: string,
    eventDate: string,
    eventLocation: string
  ): Promise<string> {
    const prompt = `Create a social media post for an event: "${eventTitle}" on ${eventDate} at ${eventLocation}. 
    Make it engaging and include relevant hashtags. Keep it under 280 characters.`;

    const response = await this.generateContent({
      prompt,
      maxTokens: 100,
      temperature: 0.9,
    });

    return response.content;
  }

  /**
   * Generate email subject lines
   */
  async generateEmailSubject(
    eventTitle: string,
    purpose: 'invitation' | 'reminder' | 'followup'
  ): Promise<string[]> {
    const prompt = `Generate 3 compelling email subject lines for a ${purpose} about the event "${eventTitle}". 
    Make them engaging and action-oriented.`;

    const response = await this.generateContent({
      prompt,
      maxTokens: 80,
      temperature: 0.8,
    });

    // Split the response into multiple subject lines
    return response.content
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3);
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const aiService = new LightweightAIService();

// Export types for use in components
export type { AIRequest, AIResponse };
