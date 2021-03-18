export default class EmojiTool {
  constructor(main) {
    this.ctx = main.ctx;
    this.main = main;
    this.setEmoji('😂');
    this.setFontSize(main.params.defaultFontSize);
  }

  changeEmoji() {
    // debugger;
    this.setEmoji(this.currentEmoji === '😂' ? '🐱‍👤' : '😂');
  }

  setEmoji(str) {
    this.currentEmoji = str;
    const btn = this.main.bar.querySelector('.ptro-icon-emoji');
    btn.innerText = str;
  }

  setFontSize(size) {
    this.fontSize = size;
  }

  handleMouseDown(event) {
    const mainClass = event.target.classList[0];
    if (mainClass === 'ptro-crp-el') {
      const x = (event.clientX - this.main.elLeft()) + this.main.scroller.scrollLeft;
      const y = (event.clientY - this.main.elTop()) + this.main.scroller.scrollTop;

      this.ctx.font = `${this.fontSize}px serif`;
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
