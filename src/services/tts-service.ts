// filepath: c:\Users\Lokesh\Desktop\Demo\Hackhazard\src\services\tts-service.ts
// Text-to-speech service using Web Speech API

export interface TTSOptions {
  voice?: string;
  speed?: number;
}

// Flag to track if user has interacted with the page
let hasUserInteracted = false;

// Flag to track if TTS is enabled
let ttsEnabled = true;

// Queue of speech messages to be played after user interaction
const speechQueue: {text: string, options: TTSOptions}[] = [];

// Set user interaction flag to true on first interaction
if (typeof window !== 'undefined') {
  const interactionEvents = ['click', 'touchstart', 'keydown'];
  
  interactionEvents.forEach(event => {
    window.addEventListener(event, () => {
      if (!hasUserInteracted) {
        hasUserInteracted = true;
        console.log("User has interacted with the page, speech now enabled");
        
        // Process any queued messages
        while (speechQueue.length > 0) {
          const queuedSpeech = speechQueue.shift();
          if (queuedSpeech) {
            speakDirectly(queuedSpeech.text, queuedSpeech.options);
          }
        }
        
        // Remove the speech interaction prompt if it exists
        const promptElement = document.getElementById('speech-interaction-prompt');
        if (promptElement) {
          promptElement.style.opacity = '0';
          setTimeout(() => {
            if (promptElement.parentNode) {
              promptElement.parentNode.removeChild(promptElement);
            }
          }, 1000); // Remove after fade-out animation
        }
      }
    }, { once: false });
  });
}

// Function to toggle TTS on and off
export function toggleTTS(): boolean {
  ttsEnabled = !ttsEnabled;
  if (!ttsEnabled) {
    // Cancel any ongoing speech if TTS is turned off
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
  return ttsEnabled;
}

// Function to check if TTS is currently enabled
export function isTTSEnabled(): boolean {
  return ttsEnabled;
}

// Function to create and show an interaction prompt
function showInteractionPrompt() {
  if (typeof window === 'undefined' || document.getElementById('speech-interaction-prompt')) {
    return; // Already showing or not in browser
  }
  
  const promptElement = document.createElement('div');
  promptElement.id = 'speech-interaction-prompt';
  promptElement.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    cursor: pointer;
    transition: opacity 0.5s ease;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  `;
  
  const iconHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  `;
  
  promptElement.innerHTML = `${iconHTML} Click anywhere to enable speech`;
  promptElement.addEventListener('click', () => {
    hasUserInteracted = true;
    promptElement.style.opacity = '0';
    setTimeout(() => {
      if (promptElement.parentNode) {
        promptElement.parentNode.removeChild(promptElement);
      }
    }, 500);
    
    // Process any queued messages
    while (speechQueue.length > 0) {
      const queuedSpeech = speechQueue.shift();
      if (queuedSpeech) {
        speakDirectly(queuedSpeech.text, queuedSpeech.options);
      }
    }
  });
  
  document.body.appendChild(promptElement);
}

// Internal function to directly speak text without queueing
function speakDirectly(text: string, options: TTSOptions = { voice: 'default', speed: 1.0 }): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !ttsEnabled) {
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.speed || 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Get available voices and set to a natural-sounding one if available
  let voices = window.speechSynthesis.getVoices();
  
  // If voices array is empty, try loading them
  if (!voices.length) {
    // Set a small timeout to allow voices to load
    setTimeout(() => {
      voices = window.speechSynthesis.getVoices();
      setVoiceAndSpeak();
    }, 100);
  } else {
    setVoiceAndSpeak();
  }
  
  function setVoiceAndSpeak() {
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
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  }
}

// Function to play speech audio using the Web Speech API
export function playSpeech(text: string, options: TTSOptions = { voice: 'default', speed: 1.0 }): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // If user hasn't interacted, queue the speech and show a prompt
  if (!hasUserInteracted) {
    console.log('Speech will be available after user interaction. Message queued:', text);
    speechQueue.push({text, options});
    
    // Show interaction prompt
    setTimeout(() => showInteractionPrompt(), 500);
    return;
  }
  
  // If user has interacted, speak directly
  speakDirectly(text, options);
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