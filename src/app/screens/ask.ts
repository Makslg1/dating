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

      <div class="about">
        <p>
          Я программист, так что собрать сайтик мне несложно 😎 Тебе — весело, а
          мне — приятно. Идеальная сделка, правда?
        </p>
        <p class="small">P.S. у меня есть машина — заеду за тобой сам 🚗</p>
      </div>
    </section>
  `,
  styles: [
    `
      .screen {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;
      }
      .hero { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
      .avatar-wrap { position: relative; width: 168px; height: 168px; }
      .avatar {
        width: 168px;
        height: 168px;
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
      .name { font-weight: 800; color: var(--ink-soft); margin: 0; }
      .compliment {
        font-size: 1.7rem;
        color: var(--rose);
        margin: 0.4rem 0;
        min-height: 1.7rem;
        transition: opacity 0.3s ease;
      }
      .question { font-size: 2.1rem; font-weight: 900; }
      .buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin: 1.2rem 0;
        min-height: 60px;
      }
      .btn.no {
        background: #fff;
        color: var(--ink-soft);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      }
      .btn.no.fled { position: fixed; z-index: 50; transition: left 0.15s ease, top 0.15s ease; }
      .about {
        background: rgba(255, 255, 255, 0.65);
        border-radius: 18px;
        padding: 1rem 1.2rem;
        max-width: 420px;
        color: var(--ink);
        font-weight: 600;
      }
      .about .small { font-size: 0.9rem; color: var(--ink-soft); margin-top: 0.4rem; }
      @media (min-width: 720px) {
        .question { font-size: 2.6rem; }
        .avatar-wrap, .avatar { width: 210px; height: 210px; }
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
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
    setTimeout(() => this.state.goto('when'), 450);
  }
}
