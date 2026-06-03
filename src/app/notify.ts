import { Injectable } from '@angular/core';

const WEB3FORMS_ACCESS_KEY = '840fe769-2c44-404f-b82d-46808569b683';
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

/** Один общий сервис для писем: и «зашёл на страницу», и «отправил форму». */
@Injectable({ providedIn: 'root' })
export class Notify {
  /** Техническая инфа о посетителе: IP, гео, браузер, экран, часовой пояс. */
  async collectMeta(): Promise<Record<string, string>> {
    const meta: Record<string, string> = {};
    try {
      meta['Устройство'] = navigator.userAgent;
      meta['Язык'] = navigator.language;
      meta['Экран'] = `${screen.width}×${screen.height}`;
      meta['Часовой пояс'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
      meta['Время'] = new Date().toLocaleString('ru-RU');
      meta['Страница'] = location.href;
    } catch {
      /* недоступно — не критично */
    }
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch('https://ipwho.is/', { signal: ctrl.signal });
      clearTimeout(t);
      const d = await res.json();
      if (d && d.success !== false && d.ip) {
        meta['IP-адрес'] = d.ip;
        if (d.country) meta['Страна'] = d.country;
        if (d.connection?.isp) meta['Провайдер'] = d.connection.isp;
      }
    } catch {
      /* сервис IP недоступен — пропускаем, письмо всё равно уйдёт */
    }
    return meta;
  }

  /**
   * Письмо «кто-то открыл страницу». Шлём один раз за сессию,
   * только когда вкладка реально видима, и с короткой паузой —
   * чтобы префетч-загрузки и превью-боты ссылок отсеивались.
   */
  async pageOpened(): Promise<void> {
    try {
      if (sessionStorage.getItem('visit-pinged') === '1') return;
    } catch {
      /* sessionStorage недоступен — продолжаем без дедупликации */
    }
    await this.whenVisible();
    try {
      sessionStorage.setItem('visit-pinged', '1');
    } catch {
      /* ignore */
    }
    // короткая пауза: мгновенные технические заходы (префетч) сюда не дойдут
    await new Promise((r) => setTimeout(r, 1200));

    const meta = await this.collectMeta();
    const message =
      `Кто-то открыл страницу-приглашение 👀\n\n` +
      `Это ещё не значит, что форму заполнили — просто зашли по ссылке.\n` +
      `Похоже на живого человека? ${this.humanHint()}`;

    try {
      await this.post({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: '👀 Кто-то открыл приглашение Наташи',
        from_name: 'Приглашение для Наташи',
        message,
        ...meta,
      });
    } catch {
      /* не получилось — не страшно, это лишь уведомление */
    }
  }

  async post(payload: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  /** Грубая эвристика «живой браузер или бот/автоматизация». */
  private humanHint(): string {
    const reasons: string[] = [];
    try {
      const ua = navigator.userAgent || '';
      if ((navigator as { webdriver?: boolean }).webdriver) reasons.push('webdriver (автоматизация)');
      if (/bot|crawl|spider|slurp|preview|facebookexternalhit|telegrambot|whatsapp|vkshare|bingpreview|headless/i.test(ua)) {
        reasons.push('юзер-агент похож на бота/превью ссылки');
      }
      if (!navigator.hardwareConcurrency) reasons.push('нет данных о ядрах CPU');
      if (typeof navigator.languages !== 'undefined' && navigator.languages.length === 0) reasons.push('пустой список языков');
    } catch {
      /* ignore */
    }
    return reasons.length ? `⚠️ Возможно бот: ${reasons.join('; ')}` : 'Да, похоже на обычный браузер ✅';
  }

  private whenVisible(): Promise<void> {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      return Promise.resolve();
    }
    return new Promise((res) => {
      const on = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', on);
          res();
        }
      };
      document.addEventListener('visibilitychange', on);
    });
  }
}
