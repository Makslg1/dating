import { Component, inject } from '@angular/core';
import { ACTIVITIES, DateState } from '../date-state';

@Component({
  selector: 'app-what',
  template: `
    <section class="screen">
      <h2>Чем займёмся? 😏</h2>
      <p class="hint">Выбирай сколько хочешь — растяжка не только у тебя 🤸‍♀️</p>

      <div class="cards">
        @for (a of activities; track a.id) {
          <button class="card" [class.active]="state.activities().includes(a.id)" (click)="state.toggleActivity(a.id)">
            <div class="img-wrap">
              <img [src]="a.img" [alt]="a.title" loading="lazy" />
              @if (state.activities().includes(a.id)) { <span class="check">✓</span> }
            </div>
            <div class="body">
              <span class="title">{{ a.emoji }} {{ a.title }}</span>
              <span class="joke">{{ a.joke }}</span>
            </div>
          </button>
        }
      </div>

      <div class="nav">
        <button class="btn ghost" (click)="state.goto('when')">← назад</button>
        <button class="btn primary" [disabled]="!state.activities().length" (click)="state.goto('done')">
          Дальше →
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .screen { display: flex; flex-direction: column; gap: 0.7rem; }
      h2 { font-size: 1.8rem; font-weight: 900; text-align: center; }
      .hint { text-align: center; color: var(--ink-soft); font-weight: 600; margin: 0 0 0.4rem; }
      .cards { display: grid; grid-template-columns: 1fr; gap: 0.9rem; }
      .card {
        border: 3px solid transparent;
        background: #fff;
        border-radius: var(--radius);
        padding: 0;
        overflow: hidden;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        box-shadow: 0 8px 22px rgba(214, 51, 91, 0.14);
      }
      .card:active { transform: scale(0.98); }
      .card.active { border-color: var(--rose); transform: translateY(-2px); }
      .img-wrap { position: relative; }
      .card img { width: 100%; height: 150px; object-fit: cover; display: block; background: var(--cream); }
      .check {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: var(--rose);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        box-shadow: 0 4px 12px rgba(255, 77, 109, 0.5);
      }
      .body { padding: 0.7rem 0.9rem 0.9rem; display: flex; flex-direction: column; gap: 0.2rem; }
      .title { font-weight: 900; font-size: 1.1rem; }
      .joke { color: var(--ink-soft); font-weight: 600; font-size: 0.92rem; }
      .nav { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; gap: 0.5rem; }
      @media (min-width: 720px) {
        .cards { grid-template-columns: 1fr 1fr; }
      }
    `,
  ],
})
export class WhatScreen {
  readonly state = inject(DateState);
  readonly activities = ACTIVITIES;
}
