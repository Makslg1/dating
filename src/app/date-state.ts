import { Injectable, signal } from '@angular/core';

export type Step = 'ask' | 'when' | 'what' | 'done';

export interface Activity {
  id: string;
  emoji: string;
  title: string;
  img: string;
  joke: string;
}

export interface DayOption {
  iso: string;
  dow: string;
  label: string;
  isToday: boolean;
}

export interface Slot {
  time: string;
  disabled: boolean;
}

export const ACTIVITIES: Activity[] = [
  {
    id: 'bike',
    emoji: '🚲',
    title: 'Покататься на велике',
    img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=640&h=420&fit=crop',
    joke: 'У меня даже шлем есть… кажется. Догонишь — твоя победа 😄',
  },
  {
    id: 'park',
    emoji: '🌳',
    title: 'Погулять в парке',
    img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=640&h=420&fit=crop',
    joke: 'Беру плед и термос, с тебя — хорошее настроение 🧺',
  },
  {
    id: 'sushi',
    emoji: '🍣',
    title: 'Сходить на суши',
    img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=640&h=420&fit=crop',
    joke: 'Обещаю не воровать твои роллы… почти 🥢',
  },
  {
    id: 'restaurant',
    emoji: '🍽️',
    title: 'Сходить в ресторан',
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=640&h=420&fit=crop',
    joke: 'Платит тот, у кого машина. То есть я 🚗',
  },
];

export const COMPLIMENTS: string[] = [
  'Ты гибче моих планов на вечер 🤸‍♀️',
  '10.0 от судей и от моего сердца ❤️',
  'Грация — это вообще про тебя',
  'Я готов крутить сальто, лишь бы ты сказала «да»',
  'Самая красивая гимнастка в этом интернете',
  'С тобой даже понедельник — выходной',
];

const DOW = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DOW_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const MON_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MON_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

@Injectable({ providedIn: 'root' })
export class DateState {
  readonly step = signal<Step>('ask');
  readonly dateIso = signal<string | null>(null);
  readonly time = signal<string | null>(null);
  readonly activities = signal<string[]>([]);
  readonly comment = signal('');
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  goto(s: Step): void {
    this.step.set(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  pickDate(iso: string): void {
    this.dateIso.set(iso);
    this.time.set(null);
  }

  toggleActivity(id: string): void {
    const cur = this.activities();
    this.activities.set(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  upcomingDays(count = 21): DayOption[] {
    const out: DayOption[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < count; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push({
        iso,
        dow: DOW[d.getDay()],
        label: `${d.getDate()} ${MON_SHORT[d.getMonth()]}`,
        isToday: i === 0,
      });
    }
    return out;
  }

  /** Мой график: Пн/Ср/Пт после 20:00, Вт/Чт после 17:00, выходные — весь день */
  private startHour(day: number): number {
    if (day === 1 || day === 3 || day === 5) return 20;
    if (day === 2 || day === 4) return 17;
    return 9; // суббота / воскресенье
  }

  slotsFor(iso: string): Slot[] {
    const [y, m, dd] = iso.split('-').map(Number);
    const d = new Date(y, m - 1, dd);
    const start = this.startHour(d.getDay());
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const slots: Slot[] = [];
    for (let h = start; h <= 22; h++) {
      for (const min of [0, 30]) {
        if (h === 22 && min === 30) continue;
        const time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const disabled = isToday && h * 60 + min <= nowMin;
        slots.push({ time, disabled });
      }
    }
    return slots;
  }

  availabilityNote(iso: string): string {
    const [y, m, dd] = iso.split('-').map(Number);
    const day = new Date(y, m - 1, dd).getDay();
    if (day === 1 || day === 3 || day === 5) return 'В этот день я свободен после 20:00 🌙';
    if (day === 2 || day === 4) return 'В этот день я свободен после 17:00 🕔';
    return 'Выходной — я свободен весь день 🎉';
  }

  prettyDate(iso: string): string {
    const [y, m, dd] = iso.split('-').map(Number);
    const d = new Date(y, m - 1, dd);
    return `${DOW_FULL[d.getDay()]}, ${dd} ${MON_GEN[m - 1]}`;
  }

  /** Локальная дата+время в объект Date для отсчёта */
  targetDate(): Date | null {
    const iso = this.dateIso();
    const t = this.time();
    if (!iso || !t) return null;
    const [y, m, dd] = iso.split('-').map(Number);
    const [hh, mm] = t.split(':').map(Number);
    return new Date(y, m - 1, dd, hh, mm, 0, 0);
  }

  chosenTitles(): string {
    return ACTIVITIES.filter((a) => this.activities().includes(a.id))
      .map((a) => `${a.emoji} ${a.title}`)
      .join(', ');
  }
}
