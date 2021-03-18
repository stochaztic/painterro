/* eslint no-continue: 0 */
export default class FloodTool {
  constructor(main) {
    this.ctx = main.ctx;
    this.el = main.toolContainer;
    this.main = main;
    this.wrapper = main.wrapper;
    this.tolerance = 10;
  }

  setTolerance(amt) {
    this.tolerance = amt;
  }

  handleMouseDown(event) {
    const mainClass = event.target.classList[0];
    if (mainClass === 'ptro-crp-el') {
      const opts = {
        x: (event.clientX - this.main.elLeft()) + this.main.scroller.scrollLeft,
        y: (event.clientY - this.main.elTop()) + this.main.scroller.scrollTop,
        tolerance: this.tolerance * 10.2,
      };
      this.doFlood(opts);
    }
  }

  static getColorFromData(imageData, i) {
    return [imageData[i], imageData[i + 1], imageData[i + 2], imageData[i + 3]];
  }

  static matchColorFromData(imageData, i, color, tolerance) {
    if (tolerance <= 1) {
      return imageData[i] === color[0]
        && imageData[i + 1] === color[1]
        && imageData[i + 2] === color[2]
        && imageData[i + 3] === color[3];
    }
    const diff = Math.abs(imageData[i] - color[0])
      + Math.abs(imageData[i + 1] - color[1])
      + Math.abs(imageData[i + 2] - color[2])
      + Math.abs(imageData[i + 3] - color[3]);
    return diff <= (tolerance);
  }

  static getIndex(x, y, width) {
    return ((y * width) + x) * 4;
  }

  static emptyAt(xdata, y) {
    if (xdata === undefined) return true;
    for (let i = 0; i < xdata.length; i += 1) {
      if (y >= xdata[i].first && y <= xdata[i].second) {
        return false;
      }
    }
    return true;
  }

  doFlood(opts) {
    const oldImageData = this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h);
    const newCanvas = document.createElement('canvas');
    const { width } = oldImageData;
    const { height } = oldImageData;
    const oldData = oldImageData.data;
    newCanvas.width = width;
    newCanvas.height = height;
    newCanvas.backgroundColor = 'transparent';
    const newCtx = newCanvas.getContext('2d');
    newCtx.fillStyle = this.main.colorWidgetState.fill.alphaColor;
    if (newCtx.fillStyle === 'rgba(0, 0, 0, 0)') {
      return;
    }
    const pointStack = [];
    const createdDict = [];
    let nx;
    let ny;
    let nindex;
    let runningLeft = false;
    let runningRight = false;
    let testy;
    let testindex;
    ny = Math.floor(opts.y);
    nx = Math.floor(opts.x);
    pointStack.push(nx);
    pointStack.push(ny);
    nindex = FloodTool.getIndex(nx, ny, width);
    const oldColor = FloodTool.getColorFromData(oldData, nindex);
    while (pointStack.length) {
      ny = pointStack.pop();
      nx = pointStack.pop();
      nindex = FloodTool.getIndex(nx, ny, width);
      if (!FloodTool.matchColorFromData(oldData, nindex, oldColor, opts.tolerance)) { continue; }
      if (!FloodTool.emptyAt(newCtx, nx, ny)) { continue; }
      // march to the top
      testy = ny - 1;
      testindex = nindex - (width * 4);
      while (testy >= 0
        && FloodTool.matchColorFromData(oldData, testindex, oldColor, opts.tolerance)) {
        ny = testy;
        nindex = testindex;
        testy = ny - 1;
        testindex = nindex - (width * 4);
      }
      // nx,ny is highest matching value in this col
      // march down, while testing on either side
      testy = ny;
      testindex = nindex;
      runningLeft = false;
      runningRight = false;
      while (testy < height
        && FloodTool.matchColorFromData(oldData, testindex, oldColor, opts.tolerance)) {
        // test left
        if (nx > 0) {
          if (!runningLeft
            && FloodTool.matchColorFromData(oldData, testindex - 4, oldColor, opts.tolerance)
            && FloodTool.emptyAt(createdDict[nx - 1], testy)) {
            runningLeft = true;
            pointStack.push(nx - 1);
            pointStack.push(testy);
          } else if (runningLeft
              && !FloodTool.matchColorFromData(oldData, testindex - 4, oldColor, opts.tolerance)) {
            runningLeft = false;
          }
        }
        // test right
        if (nx < width - 1) {
          if (!runningRight
            && FloodTool.matchColorFromData(oldData, testindex + 4, oldColor, opts.tolerance)
            && FloodTool.emptyAt(createdDict[nx + 1], testy)) {
            runningRight = true;
            pointStack.push(nx + 1);
            pointStack.push(testy);
          } else if (runningRight
            && !FloodTool.matchColorFromData(oldData, testindex + 4, oldColor, opts.tolerance)) {
            runningRight = false;
          }
        }
        // proceed down
        testy += 1;
        testindex += (width * 4);
      }
      // testy is one past the end of the matching color. Use it as height of rect.
      newCtx.fillRect(nx, ny, 1, (testy - ny));
      if (!createdDict[nx]) createdDict[nx] = [];
      createdDict[nx].push({ first: ny, second: testy - 1 });
    }
    this.ctx.drawImage(newCanvas, 0, 0);
    this.main.worklog.captureState();
  }
}
