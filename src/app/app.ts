import { AfterViewInit, Component, OnDestroy, computed, inject, signal } from '@angular/core';
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
export class App implements AfterViewInit, OnDestroy {
  protected readonly state = inject(DateState);
  protected readonly musicOn = signal(false);

  private readonly order = ['ask', 'when', 'what', 'done'];
  protected readonly progress = computed(() => {
    const i = this.order.indexOf(this.state.step());
    return (i / (this.order.length - 1)) * 100;
  });

  private readonly targetVol = 0.35;
  private fadeTimer: ReturnType<typeof setInterval> | undefined;

  ngAfterViewInit(): void {
    const audio = this.audio();
    if (!audio) return;
    audio.volume = 0;
    // Пытаемся включить сразу; если браузер блокирует автозвук —
    // запускаем при первом касании/клике/нажатии клавиши.
    this.play();
    const onFirst = () => this.play();
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) =>
      window.addEventListener(ev, onFirst, { once: true }),
    );
  }

  protected toggleMusic(): void {
    const audio = this.audio();
    if (!audio) return;
    if (this.musicOn()) {
      this.stopFade();
      audio.pause();
      this.musicOn.set(false);
    } else {
      this.play();
    }
  }

  private play(): void {
    const audio = this.audio();
    if (!audio || this.musicOn()) return;
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        this.musicOn.set(true);
        this.fadeIn(audio);
      })
      .catch(() => {
        /* автозвук заблокирован — стартуем при первом действии пользователя */
      });
  }

  private fadeIn(audio: HTMLAudioElement): void {
    this.stopFade();
    const step = this.targetVol / 35; // ~3.5 секунды нарастания
    this.fadeTimer = setInterval(() => {
      const v = Math.min(this.targetVol, audio.volume + step);
      audio.volume = v;
      if (v >= this.targetVol) this.stopFade();
    }, 100);
  }

  private stopFade(): void {
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = undefined;
    }
  }

  private audio(): HTMLAudioElement | null {
    return document.getElementById('bg-music') as HTMLAudioElement | null;
  }

  ngOnDestroy(): void {
    this.stopFade();
  }
}
