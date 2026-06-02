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

  protected readonly steps = [
    { key: 'ask', label: 'Вопрос' },
    { key: 'when', label: 'Когда' },
    { key: 'what', label: 'Что' },
    { key: 'done', label: 'Готово' },
  ];
  protected readonly stepIndex = computed(() =>
    Math.max(0, this.steps.findIndex((s) => s.key === this.state.step())),
  );
  protected readonly progress = computed(() => (this.stepIndex() / (this.steps.length - 1)) * 100);

  private readonly targetVol = 0.35;
  private fadeTimer: ReturnType<typeof setInterval> | undefined;

  /** Пользователь осознанно выключил музыку — больше не включаем её автоматически */
  private userOptedOut = false;
  private autoStart?: () => void;
  private readonly autoEvents = ['pointerdown', 'keydown', 'touchstart'];

  ngAfterViewInit(): void {
    const audio = this.audio();
    if (!audio) return;
    audio.volume = 0;
    // Пытаемся включить сразу; если браузер блокирует автозвук —
    // запускаем при первом действии пользователя (но только пока он не отказался).
    this.startPlayback();
    this.autoStart = () => this.startPlayback();
    this.autoEvents.forEach((ev) => window.addEventListener(ev, this.autoStart!));
  }

  private removeAutoStart(): void {
    if (!this.autoStart) return;
    this.autoEvents.forEach((ev) => window.removeEventListener(ev, this.autoStart!));
    this.autoStart = undefined;
  }

  protected toggleMusic(): void {
    const audio = this.audio();
    if (!audio) return;
    if (this.musicOn()) {
      // явное выключение — гасим и больше не автозапускаем
      this.userOptedOut = true;
      this.removeAutoStart();
      this.stopFade();
      audio.pause();
      this.musicOn.set(false);
    } else {
      // явное включение
      this.userOptedOut = false;
      this.startPlayback();
    }
  }

  private startPlayback(): void {
    if (this.userOptedOut) {
      this.removeAutoStart();
      return;
    }
    const audio = this.audio();
    if (!audio || this.musicOn()) return;
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        if (this.userOptedOut) {
          // успели выключить, пока промис резолвился — останавливаем
          audio.pause();
          this.musicOn.set(false);
          return;
        }
        this.musicOn.set(true);
        this.fadeIn(audio);
        this.removeAutoStart();
      })
      .catch(() => {
        /* всё ещё заблокировано — ждём следующего действия пользователя */
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
    this.removeAutoStart();
  }
}
