import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import confetti from 'canvas-confetti';
import { COMPLIMENTS, DateState } from '../date-state';
import { GifPlayer } from '../gif-player';

@Component({
  selector: 'app-ask',
  imports: [GifPlayer],
  template: `
    <section class="screen">
      <div class="hero">
        @if (!photoError()) {
          <div class="avatar-wrap">
            @for (p of photos; track p; let i = $index) {
              <img
                class="avatar layer"
                [class.show]="i === photoIndex()"
                [src]="p"
                alt="Максим"
                (error)="photoError.set(true)"
              />
            }
          </div>
        } @else {
          <div class="avatar fallback">🙋‍♂️</div>
        }
        <p class="name">Это Максим 👋</p>
      </div>

      <p class="compliment accent-font">{{ compliment() }}</p>

      <h1 class="question">Наташа,<br />пойдёшь со мной<br />на свидание?</h1>

      <div class="buttons">
        <button class="btn yes" [style.fontSize.rem]="yesFontRem()" (click)="yes()">
          Да! ❤️
        </button>
        <button
          class="btn no"
          [class.fled]="fled()"
          [style.left.px]="fled() ? pos().x : null"
          [style.top.px]="fled() ? pos().y : null"
          (mouseenter)="runAway($event)"
          (click)="runAway($event)"
        >
          {{ noTexts[noIndex()] }}
        </button>
      </div>

      @if (noIndex() >= 2) {
        <gif-player class="please-meme" src="puss-in-boots-shrek.gif" />
      }

      <div class="about">
        <p>
          Я программист, так что собрать сайтик мне несложно 😎 Тебе — весело, а
          мне — приятно. Идеальная сделка, правда?
        </p>
        <p class="small">P.S. у меня есть машина — заеду за тобой сам 🚗</p>
      </div>

      @if (celebrating()) {
        <div class="yes-overlay">
          <gif-player src="fist-pump-juvat-westendorp.gif" />
          <p class="yes-text accent-font">Е-е-есть! 🎉</p>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .screen {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
      }
      .hero { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
      .avatar-wrap { position: relative; width: 132px; height: 132px; }
      .avatar {
        width: 132px;
        height: 132px;
        border-radius: 50%;
        object-fit: cover;
        border: 5px solid #fff;
        box-shadow: 0 0 0 2px rgba(214, 51, 108, 0.22), 0 16px 34px rgba(214, 51, 108, 0.32);
        background: var(--cream);
      }
      .avatar.layer {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 1.1s ease-in-out;
      }
      .avatar.layer.show { opacity: 1; }
      .avatar.fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
      }
      .name {
        font-weight: 800;
        color: var(--ink-soft);
        margin: 0;
        font-size: 0.78rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .compliment {
        font-size: 1.7rem;
        color: var(--berry);
        margin: 0.2rem 0;
        min-height: 1.7rem;
        transition: opacity 0.3s ease;
      }
      .question {
        font-size: 2rem;
        font-weight: 600;
        margin: 0.1rem 0 0;
        color: var(--ink);
        line-height: 1.05;
      }
      .buttons {
        display: flex;
        gap: 0.9rem;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        margin: 1.1rem 0 0.2rem;
        min-height: 58px;
      }
      .btn.yes {
        padding: 0.62em 1.5em;
        line-height: 1;
        transform-origin: center;
        transition: font-size 0.28s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.22s ease,
          filter 0.2s ease, transform 0.18s ease;
      }
      .please-meme {
        width: 160px;
        max-width: 62%;
        border-radius: 16px;
        box-shadow: 0 10px 26px rgba(176, 38, 74, 0.32);
        animation: pop-in 0.4s ease;
      }
      @keyframes pop-in {
        0% { transform: scale(0); }
        70% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }
      .yes-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
        background: rgba(255, 246, 240, 0.9);
        backdrop-filter: blur(8px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        animation: pop-in 0.35s ease;
      }
      .yes-overlay gif-player { width: min(70vw, 320px); border-radius: 18px; display: block; }
      .yes-text { font-family: var(--font-accent); font-size: 3.2rem; color: var(--berry); margin: 0; }
      .btn.no {
        background: #fff;
        color: var(--ink-soft);
        box-shadow: var(--shadow-sm);
      }
      .btn.no.fled { position: fixed; z-index: 50; transition: left 0.15s ease, top 0.15s ease; }
      .about {
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.7);
        border-radius: 18px;
        padding: 0.85rem 1.05rem;
        max-width: 430px;
        color: var(--ink);
        font-weight: 600;
        font-size: 0.95rem;
      }
      .about p { margin: 0.25rem 0; }
      .about .small { font-size: 0.85rem; color: var(--ink-soft); margin-top: 0.3rem; }
      @media (min-width: 720px) {
        .screen { gap: 0.6rem; }
        .question { font-size: 2.6rem; }
        .compliment { font-size: 1.8rem; }
        .avatar-wrap, .avatar { width: 200px; height: 200px; }
      }
    `,
  ],
})
export class AskScreen implements OnInit, OnDestroy {
  readonly state = inject(DateState);
  readonly photoError = signal(false);
  readonly photos = ['maksim.jpg', 'maksim2.jpg'];
  readonly photoIndex = signal(0);
  readonly compliment = signal(COMPLIMENTS[0]);
  readonly noIndex = signal(0);
  readonly fled = signal(false);
  readonly celebrating = signal(false);
  readonly pos = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  readonly noTexts = [
    'Нет',
    'Точно нет?',
    'Подумай ещё 🥹',
    'Кнопка сломалась',
    'Ну пожалуйста 🥺',
    'Я уже накачал велик 🚲',
    'Столик забронирован…',
    'Поздно, я влюбился',
  ];

  private timer: ReturnType<typeof setInterval> | undefined;
  private ci = 0;

  /** Кнопка «Да» растёт через размер шрифта (em-падинги тянутся следом) — без наезда на соседей */
  yesFontRem(): number {
    return Math.min(1.05 + this.noIndex() * 0.16, 2.2);
  }

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.ci = (this.ci + 1) % COMPLIMENTS.length;
      this.compliment.set(COMPLIMENTS[this.ci]);
      this.photoIndex.update((i) => (i + 1) % this.photos.length);
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  runAway(ev: Event): void {
    ev.preventDefault();
    const pad = 16;
    const bw = 150;
    const bh = 56;
    const x = Math.random() * (window.innerWidth - bw - pad * 2) + pad;
    const y = Math.random() * (window.innerHeight - bh - pad * 2) + pad;
    this.pos.set({ x, y });
    this.fled.set(true);
    this.noIndex.update((i) => Math.min(i + 1, this.noTexts.length - 1));
  }

  yes(): void {
    this.celebrating.set(true);
    confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 } });
    setTimeout(() => this.state.goto('when'), 2000);
  }
}
