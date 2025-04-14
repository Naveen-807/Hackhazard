// filepath: c:\Users\Lokesh\Desktop\Demo\Hackhazard\src\services\tts-service.ts
// Text-to-speech service using Web Speech API

export interface TTSOptions {
  voice?: string;
  speed?: number;
}

// Function to play speech audio using the Web Speech API
export function playSpeech(text: string, options: TTSOptions = { voice: 'default', speed: 1.0 }): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.speed || 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Get available voices and set to a natural-sounding one if available
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a good voice based on preferences
    let preferredVoice;
    
    if (options.voice && options.voice !== 'default') {
      // If a specific voice name is provided, try to find it
      preferredVoice = voices.find(voice => 
        voice.name.toLowerCase().includes(options.voice!.toLowerCase())
      );
    }
    
    // If no specific voice found, try to find a good quality voice
    if (!preferredVoice) {
      preferredVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.name.includes('Daniel') ||
        voice.name.includes('Samantha')
      );
    }
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
}

// Mock function to simulate what would be a call to Groq API
// In a real implementation, this would use an actual TTS API
export async function textToSpeech(
  text: string,
  options: TTSOptions = { voice: 'default', speed: 1.0 }
): Promise<string> {
  // In a production environment, this would call an actual TTS API
  // For now, we'll just return the text that would be spoken
  
  // Use the Web Speech API directly
  playSpeech(text, options);
  
  return text;
}