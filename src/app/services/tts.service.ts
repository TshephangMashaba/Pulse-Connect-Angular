// tts.service.ts
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TextToSpeechService {
  private speechSynthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = new BehaviorSubject<boolean>(false);
  private currentText = '';
  private textNodes: Node[] = [];
  private wordBoundaries: { node: Node, start: number, end: number }[] = [];

  constructor(private ngZone: NgZone) {
    this.speechSynthesis = window.speechSynthesis;
    this.setupUtterance();
  }

  private setupUtterance() {
    this.utterance = new SpeechSynthesisUtterance();
    this.utterance.onend = () => this.ngZone.run(() => this.onEnd());
    this.utterance.onerror = () => this.ngZone.run(() => this.onEnd());
    this.utterance.onboundary = (event) => this.ngZone.run(() => this.onBoundary(event));
  }

  speak(text: string, textNodes: Node[] = [], wordBoundaries: any[] = []) {
    if (!this.utterance) return;
    
    this.stop();
    
    this.currentText = text;
    this.textNodes = textNodes;
    this.wordBoundaries = wordBoundaries;
    
    this.utterance.text = text;
    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;
    this.utterance.volume = 1.0;
    
    this.speechSynthesis.speak(this.utterance);
    this.isSpeaking.next(true);
  }

  pause() {
    if (this.speechSynthesis.speaking) {
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
    this.removeHighlights();
    this.isSpeaking.next(false);
  }

  private onBoundary(event: SpeechSynthesisEvent) {
    this.removeHighlights();
    
    if (event.name === 'word' && this.wordBoundaries.length > 0) {
      const charIndex = event.charIndex;
      const boundary = this.wordBoundaries.find(b => 
        charIndex >= b.start && charIndex < b.end
      );
      
      if (boundary) {
        this.highlightNode(boundary.node);
      }
    }
  }

  private highlightNode(node: Node) {
    if (node.parentElement) {
      const span = document.createElement('span');
      span.className = 'bg-yellow-200 text-black';
      node.parentElement.replaceChild(span, node);
      span.appendChild(node);
    }
  }

  private removeHighlights() {
    document.querySelectorAll('span.bg-yellow-200').forEach(element => {
      const parent = element.parentNode;
      if (parent) {
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }
    });
  }

  getIsSpeaking() {
    return this.isSpeaking.asObservable();
  }
}