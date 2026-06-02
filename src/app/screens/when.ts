import { Component, computed, inject } from '@angular/core';
import { DateState } from '../date-state';

@Component({
  selector: 'app-when',
  template: `
    <section class="screen">
      <h2>Когда тебе удобно? 🗓️</h2>
      <p class="hint">Доставка принцессы до двери на машине включена 🚗👑</p>

      <div class="days">
        @for (d of days; track d.iso) {
          <button class="chip day" [class.active]="state.dateIso() === d.iso" (click)="state.pickDate(d.iso)">
            <span class="dow">{{ d.dow }}</span>
            <span class="dnum">{{ d.label }}</span>
            @if (d.isToday) { <span class="today">сегодня</span> }
          </button>
        }
      </div>

      @if (state.dateIso()) {
        <p class="avail">{{ state.availabilityNote(state.dateIso()!) }}</p>
        <div class="slots">
          @for (s of slots(); track s.time) {
            <button
              class="chip time"
              [disabled]="s.disabled"
              [class.active]="state.time() === s.time"
              (click)="state.time.set(s.time)"
            >
              {{ s.time }}
            </button>
          }
        </div>
      } @else {
        <p class="hint">Сначала выбери денёк ☝️</p>
      }

      <div class="nav">
        <button class="btn ghost" (click)="state.goto('ask')">← назад</button>
        <button class="btn primary" [disabled]="!state.dateIso() || !state.time()" (click)="state.goto('what')">
          Дальше →
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .screen { display: flex; flex-direction: column; gap: 0.7rem; }
      h2 { font-size: 1.8rem; font-weight: 900; text-align: center; }
      .hint { text-align: center; color: var(--ink-soft); font-weight: 600; margin: 0; }
      .avail {
        text-align: center;
        font-weight: 800;
        color: var(--rose);
        background: rgba(255, 255, 255, 0.6);
        border-radius: 12px;
        padding: 0.5rem;
        margin: 0.4rem 0;
      }
      .days {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;
        padding: 0.4rem 0.2rem 0.8rem;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }
      .chip {
        flex: 0 0 auto;
        border: 2px solid transparent;
        background: #fff;
        border-radius: 16px;
        padding: 0.6rem 0.8rem;
        font-family: inherit;
        font-weight: 800;
        color: var(--ink);
        cursor: pointer;
        transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
        scroll-snap-align: start;
      }
      .chip:active { transform: scale(0.95); }
      .chip.day { display: flex; flex-direction: column; align-items: center; min-width: 64px; }
      .chip .dow { color: var(--rose); font-size: 0.85rem; }
      .chip .dnum { font-size: 1rem; }
      .chip .today { font-size: 0.65rem; color: var(--ink-soft); }
      .chip.active { border-color: var(--rose); background: var(--cream); }
      .slots {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
        gap: 0.5rem;
      }
      .chip.time { text-align: center; }
      .chip.time:disabled { opacity: 0.4; cursor: not-allowed; text-decoration: line-through; }
      .nav { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; gap: 0.5rem; }
    `,
  ],
})
export class WhenScreen {
  readonly state = inject(DateState);
  readonly days = this.state.upcomingDays();
  readonly slots = computed(() => {
    const iso = this.state.dateIso();
    return iso ? this.state.slotsFor(iso) : [];
  });
}
