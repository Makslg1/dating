import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import confetti from 'canvas-confetti';
import { DateState, Meeting } from '../date-state';
import { Notify } from '../notify';

const WEB3FORMS_ACCESS_KEY = '840fe769-2c44-404f-b82d-46808569b683';

@Component({
  selector: 'app-done',
  template: `
    @if (!state.showList()) {
      <section class="screen">
        <h2>Почти всё! 🎀</h2>
        <div class="summary">
          <p><span>📅</span> {{ state.prettyDate(state.dateIso()!) }}</p>
          <p><span>⏰</span> {{ state.time() }}</p>
          <p><span>🎯</span> {{ state.chosenTitles() }}</p>
          <p><span>🚗</span> Заеду на Camry или встретимся на месте — как тебе удобнее</p>
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

        @if (state.meetings().length) {
          <p>{{ state.meetings().length === 1 ? 'Наше свидание' : 'Наши свидания' }} 💕</p>
          @for (m of state.meetings(); track m.id) {
            <div class="card-final meeting">
              <p class="m-date">📅 {{ state.prettyDate(m.dateIso) }} в {{ m.time }}</p>
              <p>🎯 {{ state.titlesFor(m.activities, m.customActivity) }}</p>
              @if (m.comment) { <p class="m-note">💬 {{ m.comment }}</p> }
              <p class="m-cd">⏳ {{ countdowns()[m.id] }}</p>
              @if (state.meetings().length > 1) {
                <button class="btn ghost cancel" [disabled]="cancelingId() === m.id" (click)="cancel(m)">
                  {{ cancelingId() === m.id ? 'Отменяю…' : '✕ Отменить это свидание' }}
                </button>
              } @else {
                <p class="keep">Это свидание остаётся — без тебя никак 🥰</p>
              }
            </div>
          }
        } @else {
          <p>Свиданий пока нет 🤷 Запланируем новое? 😊</p>
        }

        @if (cancelError()) { <p class="err">{{ cancelError() }}</p> }

        <button class="btn primary plan" (click)="state.planAnother()">➕ В начало — запланировать ещё</button>

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
      .card-final {
        background: rgba(255, 255, 255, 0.8);
        border-radius: var(--radius);
        padding: 1rem;
        font-weight: 700;
        width: 100%;
      }
      .meeting { display: flex; flex-direction: column; gap: 0.3rem; }
      .m-date { font-weight: 900; font-size: 1.05rem; }
      .m-note { color: var(--ink-soft); font-style: italic; }
      .m-cd {
        font-family: "Caveat", cursive;
        font-size: 1.7rem;
        font-weight: 700;
        color: var(--rose);
        margin: 0.2rem 0;
      }
      .cancel { color: #b00038; font-weight: 800; align-self: center; padding: 0.4rem 0.8rem; }
      .keep { color: var(--rose); font-weight: 700; margin: 0.2rem 0 0; font-size: 0.92rem; }
      .plan { width: 100%; }
      .cd-label { color: var(--ink-soft); font-weight: 700; margin: 0; }
      .reschedule {
        width: 100%;
        margin-top: 0.4rem;
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
  private readonly notify = inject(Notify);

  readonly countdowns = signal<Record<string, string>>({});
  readonly cancelingId = signal<string | null>(null);
  readonly cancelError = signal<string | null>(null);

  readonly note = signal('');
  readonly noteSending = signal(false);
  readonly noteSent = signal(false);
  readonly noteError = signal<string | null>(null);

  private timer: ReturnType<typeof setInterval> | undefined;

  ngOnInit(): void {
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  private tick(): void {
    const map: Record<string, string> = {};
    for (const m of this.state.meetings()) {
      map[m.id] = this.format(this.state.toDate(m.dateIso, m.time));
    }
    this.countdowns.set(map);
  }

  private format(target: Date): string {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return 'уже пора! 🥳';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${d} дн ${h} ч ${m} мин ${s} сек`;
  }

  async submit(): Promise<void> {
    this.state.sending.set(true);
    this.state.error.set(null);

    try {
      const meta = await this.collectMeta();
      const message =
        `Наташа согласилась пойти на свидание! 🎉\n\n` +
        `📅 Когда: ${this.state.prettyDate(this.state.dateIso()!)} в ${this.state.time()}\n` +
        `🎯 Чем заняться: ${this.state.chosenTitles()}\n` +
        `💬 Комментарий Наташи: ${this.state.comment() || '—'}\n\n` +
        `🚗 Заехать на Camry или встретить на месте — как ей удобнее.\n` +
        `Это свидание №${this.state.meetings().length + 1}.`;

      const data = await this.post({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: '💘 Наташа согласилась на свидание!',
        from_name: 'Свидание с Наташей',
        message,
        ...meta,
      });
      if (!data.success) throw new Error(data.message || 'submit failed');
      this.state.addCurrentAsMeeting();
      this.celebrate();
    } catch {
      this.state.error.set('Не получилось отправить 😢 Проверь интернет и попробуй ещё раз.');
    } finally {
      this.state.sending.set(false);
    }
  }

  async cancel(m: Meeting): Promise<void> {
    this.cancelingId.set(m.id);
    this.cancelError.set(null);

    // Письмо — по возможности (оно уходит на сервере, даже если ответ не дочитался).
    // Саму отмену применяем в любом случае, чтобы свидание точно пропало из списка.
    try {
      const meta = await this.collectMeta();
      const message =
        `Наташа отменила свидание ❌\n\n` +
        `📅 Было назначено: ${this.state.prettyDate(m.dateIso)} в ${m.time}\n` +
        `🎯 Планировалось: ${this.state.titlesFor(m.activities, m.customActivity)}`;
      await this.post({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: '❌ Наташа отменила свидание',
        from_name: 'Свидание с Наташей',
        message,
        ...meta,
      });
    } catch {
      /* не блокируем отмену из-за сетевого сбоя при чтении ответа */
    }
    this.state.cancelMeeting(m.id);
    this.tick();
    this.cancelingId.set(null);
  }

  async sendNote(): Promise<void> {
    const text = this.note().trim();
    if (!text) return;
    this.noteSending.set(true);
    this.noteError.set(null);

    const next = this.state.meetings()[0];
    try {
      const meta = await this.collectMeta();
      const message =
        `Наташа написала по свиданию ✉️\n\n` +
        `«${text}»\n\n` +
        `📅 Ближайшее свидание: ${next ? `${this.state.prettyDate(next.dateIso)} в ${next.time}` : '—'}`;

      const data = await this.post({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: '✉️ Сообщение от Наташи (детали/перенос)',
        from_name: 'Свидание с Наташей',
        message,
        ...meta,
      });
      if (!data.success) throw new Error(data.message || 'note failed');
      this.note.set('');
      this.noteSent.set(true);
    } catch {
      this.noteError.set('Не получилось отправить 😢 Попробуй ещё раз.');
    } finally {
      this.noteSending.set(false);
    }
  }

  private collectMeta(): Promise<Record<string, string>> {
    return this.notify.collectMeta();
  }

  private post(payload: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
    return this.notify.post(payload);
  }

  private celebrate(): void {
    const burst = () => confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
    burst();
    setTimeout(burst, 400);
    setTimeout(burst, 800);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
