import { Component, ElementRef, OnDestroy, OnInit, input, viewChild } from '@angular/core';
import { parseGIF, decompressFrames, type ParsedFrame } from 'gifuct-js';

/**
 * Проигрывает GIF, рисуя кадры на <canvas> вручную.
 * Нужно, потому что iOS Safari (особенно в режиме энергосбережения) «замораживает»
 * нативные <img> с GIF — а покадровую отрисовку через setTimeout браузер не останавливает.
 */
@Component({
  selector: 'gif-player',
  template: `<canvas #cv></canvas>`,
  styles: [
    `
      :host { display: block; }
      canvas { width: 100%; height: auto; display: block; border-radius: inherit; }
    `,
  ],
})
export class GifPlayer implements OnInit, OnDestroy {
  readonly src = input.required<string>();
  private readonly cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');

  private timer: ReturnType<typeof setTimeout> | undefined;
  private destroyed = false;

  async ngOnInit(): Promise<void> {
    try {
      const buf = await fetch(this.src()).then((r) => r.arrayBuffer());
      if (this.destroyed) return;
      const gif = parseGIF(buf);
      const frames = decompressFrames(gif, true);
      if (frames.length) this.play(gif.lsd.width, gif.lsd.height, frames);
    } catch {
      /* не удалось — оставляем пустой холст, ничего не ломается */
    }
  }

  private play(w: number, h: number, frames: ParsedFrame[]): void {
    const canvas = this.cv().nativeElement;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const temp = document.createElement('canvas');
    const tctx = temp.getContext('2d');
    if (!tctx) return;

    let prevDisposal = 0;
    let prev: { left: number; top: number; width: number; height: number } | null = null;

    const draw = (idx: number) => {
      if (this.destroyed) return;
      const frame = frames[idx];
      const dims = frame.dims;

      if (idx === 0) {
        ctx.clearRect(0, 0, w, h);
      } else if (prevDisposal === 2 && prev) {
        ctx.clearRect(prev.left, prev.top, prev.width, prev.height);
      }

      temp.width = dims.width;
      temp.height = dims.height;
      const imageData = tctx.createImageData(dims.width, dims.height);
      imageData.data.set(frame.patch);
      tctx.putImageData(imageData, 0, 0);
      ctx.drawImage(temp, dims.left, dims.top);

      prevDisposal = frame.disposalType;
      prev = dims;

      const delay = frame.delay && frame.delay > 10 ? frame.delay : 100;
      const next = (idx + 1) % frames.length;
      this.timer = setTimeout(() => draw(next), delay);
    };

    draw(0);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.timer) clearTimeout(this.timer);
  }
}
