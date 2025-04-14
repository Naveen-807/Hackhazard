import { OpenAI } from 'openai';

// Create an OpenAI compatible client but point it to Groq's API
export const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

// Helper function to generate text with Groq models
export async function generateText(prompt: string) {
  try {
    const response = await ai.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating text with Groq:', error);
    return '';
  }
}
