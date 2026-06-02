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

export interface Meeting {
  id: string;
  dateIso: string;
  time: string;
  activities: string[];
  customActivity: string;
  comment: string;
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
  readonly error = signal<string | null>(null);

  /** Подтверждённые свидания */
  readonly meetings = signal<Meeting[]>([]);
  /** На экране 'done' показываем список встреч (true) или форму нового свидания (false) */
  readonly showList = signal(false);

  private readonly STORAGE_KEY = 'natasha-dates-v2';

  constructor() {
    this.restore();
  }

  private get storage(): Storage | null {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  }

  /** Сохраняем список свиданий, чтобы при повторном заходе сразу показать их и отсчёт */
  persist(): void {
    this.storage?.setItem(this.STORAGE_KEY, JSON.stringify(this.meetings()));
  }

  private restore(): void {
    try {
      const raw = this.storage?.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || !arr.length) return;
      this.meetings.set(arr.filter((m) => m?.dateIso && m?.time));
      if (this.meetings().length) {
        this.showList.set(true);
        this.step.set('done');
      }
    } catch {
      /* битые данные — игнорируем */
    }
  }

  private newId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${this.meetings().length}`;
  }

  /** Добавляем текущий выбор как новое свидание */
  addCurrentAsMeeting(): void {
    const iso = this.dateIso();
    const t = this.time();
    if (!iso || !t) return;
    const meeting: Meeting = {
      id: this.newId(),
      dateIso: iso,
      time: t,
      activities: [...this.activities()],
      customActivity: this.customActivity(),
      comment: this.comment(),
    };
    this.meetings.update((list) => [...list, meeting]);
    this.persist();
    this.showList.set(true);
  }

  cancelMeeting(id: string): void {
    this.meetings.update((list) => list.filter((m) => m.id !== id));
    this.persist();
  }

  /** Сброс текущего выбора и переход к началу — чтобы запланировать ещё свидание */
  planAnother(): void {
    this.dateIso.set(null);
    this.time.set(null);
    this.activities.set([]);
    this.customActivity.set('');
    this.comment.set('');
    this.error.set(null);
    this.showList.set(false);
    this.goto('ask');
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
  toDate(iso: string, t: string): Date {
    const [y, m, dd] = iso.split('-').map(Number);
    const [hh, mm] = t.split(':').map(Number);
    return new Date(y, m - 1, dd, hh, mm, 0, 0);
  }

  titlesFor(activities: string[], custom: string): string {
    const parts = ACTIVITIES.filter((a) => activities.includes(a.id)).map(
      (a) => `${a.emoji} ${a.title}`,
    );
    if (activities.includes('custom') && custom.trim()) {
      parts.push(`✏️ Свой вариант: ${custom.trim()}`);
    }
    return parts.join(', ');
  }

  /** Заголовки для текущего (ещё не подтверждённого) выбора */
  chosenTitles(): string {
    return this.titlesFor(this.activities(), this.customActivity());
  }
}
