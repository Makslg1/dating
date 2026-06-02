import { Component, OnDestroy, inject, signal } from '@angular/core';
import confetti from 'canvas-confetti';
import { DateState } from '../date-state';

const WEB3FORMS_ACCESS_KEY = '840fe769-2c44-404f-b82d-46808569b683';

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
        <p>Я уже считаю минуты до встречи. До скорого! 😍</p>
        <div class="card-final">
          <p>📅 {{ state.prettyDate(state.dateIso()!) }} в {{ state.time() }}</p>
          <p>🎯 {{ state.chosenTitles() }}</p>
        </div>
        <p class="cd-label">До нашего свидания осталось:</p>
        <div class="countdown">{{ countdown() }}</div>

        <p class="cd-label">А пока — пиши мне:</p>
        <div class="contacts-links">
          <a class="contact vk" href="https://vk.com/mr_maksim_maltsev" target="_blank" rel="noopener">VK</a>
          <a class="contact tg" href="https://t.me/bigmax555" target="_blank" rel="noopener">Telegram</a>
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
      .contacts-links { display: flex; gap: 0.6rem; justify-content: center; }
      .contact {
        text-decoration: none;
        font-weight: 800;
        color: #fff;
        padding: 0.55rem 1.2rem;
        border-radius: 999px;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
      }
      .contact.vk { background: #0077ff; }
      .contact.tg { background: #2aabee; }
      @keyframes pop {
        0% { transform: scale(0); }
        70% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }
    `,
  ],
})
export class DoneScreen implements OnDestroy {
  readonly state = inject(DateState);
  readonly countdown = signal('');
  private timer: ReturnType<typeof setInterval> | undefined;

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
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'submit failed');
      this.celebrate();
    } catch {
      this.state.error.set('Не получилось отправить 😢 Проверь интернет и попробуй ещё раз.');
    } finally {
      this.state.sending.set(false);
    }
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
