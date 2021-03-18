export default class StampTool {
  constructor(main, stamps) {
    this.ctx = main.ctx;
    this.el = main.toolContainer;
    this.main = main;
    this.wrapper = main.wrapper;
    this.stamps = stamps;
    this.setStamp(this.stamps[0].value);
  }

  getStamp() {
    return this.stamp;
  }

  setStamp(stamp) {
    this.stamp = stamp;
  }

  handleMouseDown(event) {
    const mainClass = event.target.classList[0];
    if (mainClass === 'ptro-crp-el') {
      const opts = {
        x: (event.clientX - this.main.elLeft()) + this.main.scroller.scrollLeft,
        y: (event.clientY - this.main.elTop()) + this.main.scroller.scrollTop,
        nextTool: 'stamp',
      };
      const url = this.getStamp();
      this.main.inserter.handleStamp(url, opts);
    }
  }
}
