import { Component, computed, inject, signal } from '@angular/core';
import { DateState } from './date-state';
import { AskScreen } from './screens/ask';
import { WhenScreen } from './screens/when';
import { WhatScreen } from './screens/what';
import { DoneScreen } from './screens/done';

@Component({
  selector: 'app-root',
  imports: [AskScreen, WhenScreen, WhatScreen, DoneScreen],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly state = inject(DateState);
  protected readonly muted = signal(true);

  private readonly order = ['ask', 'when', 'what', 'done'];
  protected readonly progress = computed(() => {
    const i = this.order.indexOf(this.state.step());
    return (i / (this.order.length - 1)) * 100;
  });

  protected toggleMusic(): void {
    const audio = document.getElementById('bg-music') as HTMLAudioElement | null;
    if (!audio) return;
    if (this.muted()) {
      audio.volume = 0.35;
      audio.play().then(() => this.muted.set(false)).catch(() => this.muted.set(true));
    } else {
      audio.pause();
      this.muted.set(true);
    }
  }
}
