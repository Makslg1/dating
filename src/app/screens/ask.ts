import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import confetti from 'canvas-confetti';
import { COMPLIMENTS, DateState } from '../date-state';

@Component({
  selector: 'app-ask',
  template: `
    <section class="screen">
      <div class="hero">
        @if (!photoError()) {
          <img class="avatar" [src]="photoSrc()" alt="Максим" (error)="photoError.set(true)" />
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

      <div class="contacts">
        <span class="contacts-label">Связаться со мной:</span>
        <div class="contacts-links">
          <a class="contact vk" href="https://vk.com/mr_maksim_maltsev" target="_blank" rel="noopener">
            VK
          </a>
          <a class="contact tg" href="https://t.me/bigmax555" target="_blank" rel="noopener">
            Telegram
          </a>
        </div>
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
      .avatar {
        width: 168px;
        height: 168px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #fff;
        box-shadow: 0 10px 28px rgba(255, 77, 109, 0.4);
        background: var(--cream);
      }
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
      .contacts { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-top: 0.3rem; }
      .contacts-label { font-weight: 700; color: var(--ink-soft); font-size: 0.95rem; }
      .contacts-links { display: flex; gap: 0.6rem; }
      .contact {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        text-decoration: none;
        font-weight: 800;
        color: #fff;
        padding: 0.55rem 1.2rem;
        border-radius: 999px;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
        transition: transform 0.15s ease;
      }
      .contact:active { transform: scale(0.95); }
      .contact.vk { background: #0077ff; }
      .contact.tg { background: #2aabee; }
      @media (min-width: 720px) {
        .question { font-size: 2.6rem; }
        .avatar { width: 210px; height: 210px; }
      }
    `,
  ],
})
export class AskScreen implements OnInit, OnDestroy {
  readonly state = inject(DateState);
  readonly photoError = signal(false);
  readonly photos = ['maksim.jpg', 'maksim2.jpg'];
  readonly photoSrc = signal(this.photos[0]);
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
  private pi = 0;

  yesScale(): number {
    return Math.min(1 + this.noIndex() * 0.12, 1.8);
  }

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.ci = (this.ci + 1) % COMPLIMENTS.length;
      this.compliment.set(COMPLIMENTS[this.ci]);
      this.pi = (this.pi + 1) % this.photos.length;
      this.photoSrc.set(this.photos[this.pi]);
    }, 2600);
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
