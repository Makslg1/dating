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
  from: string;
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
    img: 'activities/bike.jpg',
    joke: 'У меня даже шлем есть… кажется. Догонишь — твоя победа 😄',
  },
  {
    id: 'park',
    emoji: '🌳',
    title: 'Погулять в парке',
    img: 'activities/park.jpg',
    joke: 'Беру плед и термос, с тебя — хорошее настроение 🧺',
  },
  {
    id: 'sushi',
    emoji: '🍣',
    title: 'Сходить на суши',
    img: 'activities/sushi.jpg',
    joke: 'Обещаю не воровать твои роллы… почти 🥢',
  },
  {
    id: 'restaurant',
    emoji: '🍽️',
    title: 'Сходить в ресторан',
    img: 'activities/restaurant.jpg',
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
  readonly customActivity = signal('');
  readonly comment = signal('');
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  private readonly STORAGE_KEY = 'natasha-date-v1';

  constructor() {
    this.restore();
  }

  private get storage(): Storage | null {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  }

  /** Сохраняем ответ, чтобы при повторном заходе сразу показать обратный отсчёт */
  persist(): void {
    this.storage?.setItem(
      this.STORAGE_KEY,
      JSON.stringify({
        dateIso: this.dateIso(),
        time: this.time(),
        activities: this.activities(),
        customActivity: this.customActivity(),
        comment: this.comment(),
      }),
    );
  }

  private restore(): void {
    try {
      const raw = this.storage?.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d?.dateIso || !d?.time) return;
      this.dateIso.set(d.dateIso);
      this.time.set(d.time);
      this.activities.set(Array.isArray(d.activities) ? d.activities : []);
      this.customActivity.set(d.customActivity ?? '');
      this.comment.set(d.comment ?? '');
      this.sent.set(true);
      this.step.set('done');
    } catch {
      /* битые данные — игнорируем */
    }
  }

  goto(s: Step): void {
    this.step.set(s);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
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
      const day = d.getDay();
      const sh = this.startHour(day);
      out.push({
        iso,
        dow: DOW[day],
        label: `${d.getDate()} ${MON_SHORT[d.getMonth()]}`,
        isToday: i === 0,
        from: day === 0 || day === 6 ? 'весь день' : `с ${sh}:00`,
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
    const parts = ACTIVITIES.filter((a) => this.activities().includes(a.id)).map(
      (a) => `${a.emoji} ${a.title}`,
    );
    if (this.activities().includes('custom') && this.customActivity().trim()) {
      parts.push(`✏️ Свой вариант: ${this.customActivity().trim()}`);
    }
    return parts.join(', ');
  }
}
