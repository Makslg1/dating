import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import confetti from 'canvas-confetti';
import { DateState } from '../date-state';

const WEB3FORMS_ACCESS_KEY = '840fe769-2c44-404f-b82d-46808569b683';
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

@Component({
  selector: 'app-done',
  template: `
    @if (!state.sent()) {
      <section class="screen">
        <h2>Почти всё! 🎀</h2>
        <div class="summary">
          <p><span>📅</span> {{ state.prettyDate(state.dateIso()!) }}</p>
          <p><span>⏰</span> {{ state.time() }}</p>
          <p><span>🎯</span> {{ state.chosenTitles() }}</p>
          <p><span>🚗</span> Заеду за тобой на машине — можно даже собираться лениво</p>
        </div>

        <textarea
          rows="3"
          placeholder="Хочешь что-то добавить? (необязательно) 💬"
          [value]="state.comment()"
          (input)="state.comment.set($any($event.target).value)"
        ></textarea>

        @if (state.error()) { <p class="err">{{ state.error() }}</p> }

        <div class="nav">
          <button class="btn ghost" (click)="state.goto('what')">← назад</button>
          <button class="btn primary" [disabled]="state.sending()" (click)="submit()">
            {{ state.sending() ? 'Отправляю…' : 'Отправить Максиму ❤️' }}
          </button>
        </div>
      </section>
    } @else {
      <section class="screen celebrate">
        <div class="big">🎉</div>
        <h2>Ты сделала мой день!</h2>
        <img class="done-meme" src="giphy.gif" alt="" />
        <p>Я уже считаю минуты до встречи. До скорого! 😍</p>
        <div class="card-final">
          <p>📅 {{ state.prettyDate(state.dateIso()!) }} в {{ state.time() }}</p>
          <p>🎯 {{ state.chosenTitles() }}</p>
        </div>
        <p class="cd-label">До нашего свидания осталось:</p>
        <div class="countdown">{{ countdown() }}</div>

        <div class="reschedule">
          <p class="cd-label">Нужно уточнить детали или перенести? Напиши — Максиму придёт сообщение:</p>
          @if (!noteSent()) {
            <textarea
              rows="2"
              placeholder="Например: давай на часик позже 🙏"
              [value]="note()"
              (input)="note.set($any($event.target).value)"
            ></textarea>
            @if (noteError()) { <p class="err">{{ noteError() }}</p> }
            <button class="btn primary" [disabled]="noteSending() || !note().trim()" (click)="sendNote()">
              {{ noteSending() ? 'Отправляю…' : 'Отправить Максиму ✉️' }}
            </button>
          } @else {
            <p class="note-ok">Отправлено ✓ Максим увидит 👍</p>
            <button class="btn ghost" (click)="noteSent.set(false)">Написать ещё</button>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      .screen { display: flex; flex-direction: column; gap: 0.8rem; }
      h2 { font-size: 1.9rem; font-weight: 900; text-align: center; }
      .summary {
        background: rgba(255, 255, 255, 0.7);
        border-radius: var(--radius);
        padding: 1rem 1.2rem;
        font-weight: 700;
      }
      .summary p { display: flex; gap: 0.6rem; align-items: flex-start; margin: 0.5rem 0; }
      .summary span { font-size: 1.2rem; }
      textarea {
        width: 100%;
        border: 2px solid #fff;
        border-radius: 16px;
        padding: 0.8rem;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
        outline: none;
        background: #fff;
      }
      textarea:focus { border-color: var(--rose); }
      .err { color: #b00038; font-weight: 700; text-align: center; }
      .nav { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }

      .celebrate { text-align: center; align-items: center; }
      .big { font-size: 4rem; animation: pop 0.6s ease; }
      .done-meme {
        width: 200px;
        max-width: 70%;
        border-radius: 16px;
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
      }
      .card-final {
        background: rgba(255, 255, 255, 0.8);
        border-radius: var(--radius);
        padding: 1rem;
        font-weight: 800;
        width: 100%;
      }
      .cd-label { color: var(--ink-soft); font-weight: 700; margin: 0; }
      .countdown {
        font-family: "Caveat", cursive;
        font-size: 2.4rem;
        font-weight: 700;
        color: var(--rose);
      }
      .reschedule {
        width: 100%;
        margin-top: 0.8rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 77, 109, 0.25);
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .note-ok { color: #1a8d3b; font-weight: 800; margin: 0; }
      @keyframes pop {
        0% { transform: scale(0); }
        70% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }
    `,
  ],
})
export class DoneScreen implements OnInit, OnDestroy {
  readonly state = inject(DateState);
  readonly countdown = signal('');

  readonly note = signal('');
  readonly noteSending = signal(false);
  readonly noteSent = signal(false);
  readonly noteError = signal<string | null>(null);

  private timer: ReturnType<typeof setInterval> | undefined;

  ngOnInit(): void {
    // Если ответ уже сохранён (повторный заход) — сразу запускаем отсчёт
    if (this.state.sent()) this.startCountdown();
  }

  async submit(): Promise<void> {
    this.state.sending.set(true);
    this.state.error.set(null);

    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: '🎉 Наташа сказала ДА! Детали свидания',
      from_name: 'Сайт-приглашение для Наташи',
      'Дата': this.state.prettyDate(this.state.dateIso()!),
      'Время': this.state.time(),
      'Чем заняться': this.state.chosenTitles(),
      'Комментарий Наташи': this.state.comment() || '—',
    };

    try {
      const data = await this.post(payload);
      if (!data.success) throw new Error(data.message || 'submit failed');
      this.state.persist();
      this.celebrate();
    } catch {
      this.state.error.set('Не получилось отправить 😢 Проверь интернет и попробуй ещё раз.');
    } finally {
      this.state.sending.set(false);
    }
  }

  async sendNote(): Promise<void> {
    const text = this.note().trim();
    if (!text) return;
    this.noteSending.set(true);
    this.noteError.set(null);

    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: '✉️ Наташа написала по свиданию (детали/перенос)',
      from_name: 'Сайт-приглашение для Наташи',
      'Сообщение от Наташи': text,
      'Текущая дата свидания': `${this.state.prettyDate(this.state.dateIso()!)} в ${this.state.time()}`,
    };

    try {
      const data = await this.post(payload);
      if (!data.success) throw new Error(data.message || 'note failed');
      this.note.set('');
      this.noteSent.set(true);
    } catch {
      this.noteError.set('Не получилось отправить 😢 Попробуй ещё раз.');
    } finally {
      this.noteSending.set(false);
    }
  }

  private async post(payload: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  private celebrate(): void {
    this.state.sent.set(true);
    const burst = () => confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
    burst();
    setTimeout(burst, 400);
    setTimeout(burst, 800);
    this.startCountdown();
  }

  private startCountdown(): void {
    if (this.timer) return;
    const tick = () => {
      const target = this.state.targetDate();
      if (!target) {
        this.countdown.set('');
        return;
      }
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        this.countdown.set('Уже пора! 🥳');
        if (this.timer) clearInterval(this.timer);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      this.countdown.set(`${d} дн ${h} ч ${m} мин ${s} сек`);
    };
    tick();
    this.timer = setInterval(tick, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
