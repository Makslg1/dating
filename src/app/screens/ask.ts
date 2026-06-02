import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import confetti from 'canvas-confetti';
import { COMPLIMENTS, DateState } from '../date-state';

@Component({
  selector: 'app-ask',
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
        <button class="btn yes" [style.transform]="'scale(' + yesScale() + ')'" (click)="yes()">
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
        <img class="please-meme" src="puss-in-boots-shrek.gif" alt="Ну пожалуйста" />
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
          <img src="fist-pump-juvat-westendorp.gif" alt="Ура!" />
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
        border: 4px solid #fff;
        box-shadow: 0 10px 28px rgba(255, 77, 109, 0.4);
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
      .name { font-weight: 800; color: var(--ink-soft); margin: 0; font-size: 0.95rem; }
      .compliment {
        font-size: 1.4rem;
        color: var(--rose);
        margin: 0.3rem 0;
        min-height: 1.4rem;
        transition: opacity 0.3s ease;
      }
      .question { font-size: 1.8rem; font-weight: 900; margin: 0; }
      .buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin: 0.9rem 0;
        min-height: 56px;
      }
      .please-meme {
        width: 150px;
        max-width: 60%;
        border-radius: 14px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
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
        background: rgba(255, 255, 255, 0.92);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        animation: pop-in 0.35s ease;
      }
      .yes-overlay img { width: min(70vw, 320px); border-radius: 16px; }
      .yes-text { font-size: 2.6rem; color: var(--rose); margin: 0; }
      .btn.no {
        background: #fff;
        color: var(--ink-soft);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      }
      .btn.no.fled { position: fixed; z-index: 50; transition: left 0.15s ease, top 0.15s ease; }
      .about {
        background: rgba(255, 255, 255, 0.65);
        border-radius: 18px;
        padding: 0.8rem 1rem;
        max-width: 420px;
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

  yesScale(): number {
    return Math.min(1 + this.noIndex() * 0.12, 1.8);
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
