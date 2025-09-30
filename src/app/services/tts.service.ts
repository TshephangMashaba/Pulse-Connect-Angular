// tts.service.ts - Fixed version with HTML parsing
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TextToSpeechService {
  private speechSynthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = new BehaviorSubject<boolean>(false);
  private currentElement: HTMLElement | null = null;

  constructor(private ngZone: NgZone) {
    this.speechSynthesis = window.speechSynthesis;
    this.setupUtterance();
  }

  private setupUtterance() {
    this.utterance = new SpeechSynthesisUtterance();
    this.utterance.onend = () => this.ngZone.run(() => this.onEnd());
    this.utterance.onerror = (error) => this.ngZone.run(() => this.onError(error));
    this.utterance.onboundary = (event) => this.ngZone.run(() => this.onBoundary(event));
  }

  speak(text: string, element?: HTMLElement) {
    if (!this.utterance || !this.isSupported()) {
      console.warn('TTS not supported or utterance not available');
      return;
    }
    
    this.stop();
    
    // Store reference to element for highlighting
    this.currentElement = element || null;
    
    // Clean the text - remove HTML tags and extract plain text
    const cleanText = this.extractTextFromHTML(text);
    
    if (!cleanText.trim()) {
      console.warn('No text content to speak');
      return;
    }
    
    // Highlight the element if provided
    if (this.currentElement) {
      this.highlightElement(this.currentElement);
    }
    
    this.utterance.text = cleanText;
    this.utterance.rate = 0.9; // Slightly slower for better comprehension
    this.utterance.pitch = 1.0;
    this.utterance.volume = 1.0;
    
    try {
      this.speechSynthesis.speak(this.utterance);
      this.isSpeaking.next(true);
      console.log('TTS started speaking:', cleanText.substring(0, 100) + '...');
    } catch (error) {
      console.error('Error starting TTS:', error);
      this.isSpeaking.next(false);
    }
  }

  pause() {
    if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
      this.speechSynthesis.pause();
      this.isSpeaking.next(false);
    }
  }

  resume() {
    if (this.speechSynthesis.paused) {
      this.speechSynthesis.resume();
      this.isSpeaking.next(true);
    }
  }

  stop() {
    this.speechSynthesis.cancel();
    this.removeHighlights();
    this.isSpeaking.next(false);
  }

  private onEnd() {
    console.log('TTS finished speaking');
    this.removeHighlights();
    this.isSpeaking.next(false);
  }

  private onError(error: SpeechSynthesisErrorEvent) {
    console.error('TTS error:', error);
    this.removeHighlights();
    this.isSpeaking.next(false);
  }

  private onBoundary(event: SpeechSynthesisEvent) {
    // Optional: Implement word-by-word highlighting here if needed
    console.log('TTS boundary:', event);
  }

  // Extract plain text from HTML content
  private extractTextFromHTML(html: string): string {
    if (!html) return '';
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get text content (automatically strips HTML tags)
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up the text
    text = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .trim();
    
    return text;
  }

  private highlightElement(element: HTMLElement) {
    this.removeHighlights();
    element.classList.add('tts-highlight');
  }

  private removeHighlights() {
    if (this.currentElement) {
      this.currentElement.classList.remove('tts-highlight');
    }
    // Also remove any other highlights
    document.querySelectorAll('.tts-highlight').forEach(el => {
      el.classList.remove('tts-highlight');
    });
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.speechSynthesis.getVoices();
  }

  getIsSpeaking() {
    return this.isSpeaking.asObservable();
  }

  // Test method to verify TTS is working
  testTTS() {
    const testText = 'Text to speech is working correctly. This is a test.';
    this.speak(testText);
  }
}