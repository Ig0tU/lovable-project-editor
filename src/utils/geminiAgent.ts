import { Intent } from './domModifier';

export interface GeminiResponse {
  intent: Intent;
  confidence?: number;
  reasoning?: string;
}

export class GeminiAgent {
  private apiKey: string;
  private endpoint: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async processCommand(command: string): Promise<Intent> {
    try {
      const systemPrompt = `You are an intelligent DOM modification agent. Your job is to interpret natural language commands and convert them into structured DOM modification intents.

IMPORTANT: You must respond with ONLY a valid JSON object that matches this Intent interface:
{
  "action": "add" | "modify" | "remove" | "style" | "hide" | "show",
  "target": string,
  "properties"?: Record<string, string>,
  "content"?: string,
  "selector"?: string,
  "position"?: "before" | "after" | "prepend" | "append"
}

Examples:
- "Add a red banner at the top saying 'Special Offer'" → {"action": "add", "target": "div", "content": "Special Offer", "properties": {"style": "position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: white; text-align: center; padding: 12px; z-index: 9999; font-weight: bold;"}, "selector": "body", "position": "prepend"}
- "Hide all advertisements" → {"action": "hide", "target": "", "selector": "[class*='ad'], [id*='ad'], .advertisement, .ads"}
- "Change all buttons to blue" → {"action": "style", "target": "", "selector": "button", "properties": {"backgroundColor": "#3b82f6", "color": "white"}}

User command: "${command}"

Respond with ONLY the JSON object, no explanations or additional text:`;

      const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      const generatedText = data.candidates[0].content.parts[0].text.trim();
      
      // Clean up the response - remove any markdown formatting or extra text
      let jsonText = generatedText;
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }

      try {
        const intent = JSON.parse(jsonText) as Intent;
        
        // Validate the intent structure
        if (!intent.action || !['add', 'modify', 'remove', 'style', 'hide', 'show'].includes(intent.action)) {
          throw new Error('Invalid action in generated intent');
        }

        return intent;
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', generatedText);
        throw new Error('Failed to parse AI response as valid JSON intent');
      }

    } catch (error) {
      console.error('GeminiAgent error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('403')) {
          throw new Error('Invalid API key. Please check your Gemini API key.');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('API quota exceeded. Please check your Gemini API usage limits.');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const testResponse = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test'
            }]
          }],
          generationConfig: {
            maxOutputTokens: 1,
          }
        })
      });

      return testResponse.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
}
