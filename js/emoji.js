import { Picker } from 'emoji-picker-element';
import { KEYS } from './utils';

export default class EmojiTool {
  constructor(main) {
    this.ctx = main.ctx;
    this.main = main;
    this.fontFamily = '"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Twemoji Mozilla","Noto Color Emoji","EmojiOne Color","Android Emoji",sans-serif';
    this.setFontSize(main.params.defaultFontSize);
    this.picker = null;
    this.btn = this.main.bar.querySelector('.ptro-icon-emoji');
    this.btn.style.fontFamily = this.fontFamily;
    this.setEmoji('😀');
  }

  changeEmoji() {
    if (!this.picker) {
      this.picker = new Picker();
      this.picker.classList.add('light');

      // Safari bugfix
      const style = document.createElement('style');
      style.textContent = '.picker { z-index: 1; }';
      this.picker.shadowRoot.appendChild(style);

      this.picker.addEventListener('emoji-click', (event) => {
        if (event && event.detail && event.detail.unicode) {
          this.setEmoji(event.detail.unicode);
        }
      });
      this.picker.style.display = 'flex';
      this.main.wrapper.appendChild(this.picker);
    } else {
      this.picker.style.display = 'flex';
    }
  }

  deactivatePicker() {
    if (this.picker) {
      this.picker.style.display = 'none';
    }
  }

  setEmoji(str) {
    this.currentEmoji = str;
    this.btn.innerText = str;
    this.deactivatePicker();
  }

  setFontSize(size) {
    this.fontSize = size;
  }

  close() {
    this.deactivatePicker();
  }

  handleKeyDown(event) {
    if (event.keyCode === KEYS.esc && this.picker.style.display === 'flex') {
      this.deactivatePicker();
      event.stopPropagation();
      event.preventDefault();
    }
  }

  handleMouseDown(event) {
    const mainClass = event.target.classList[0];
    if (mainClass === 'ptro-crp-el') {
      const x = (event.clientX - this.main.elLeft()) + this.main.scroller.scrollLeft;
      const y = (event.clientY - this.main.elTop()) + this.main.scroller.scrollTop;

      this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const oldFill = this.ctx.fillStyle;
      this.ctx.fillStyle = 'black';
      this.ctx.fillText(this.currentEmoji, x, y);
      this.ctx.fillStyle = oldFill;
      this.main.worklog.captureState();
    }
  }
}
