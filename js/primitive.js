export default class PrimitiveTool {
  constructor(main) {
    this.ctx = main.ctx;
    this.el = main.toolContainer;
    this.main = main;
    this.helperCanvas = document.createElement('canvas');
    this.canvas = main.canvas;
  }

  activate(type) {
    this.type = type;
    this.state = {};
    if (type === 'line' || type === 'brush' || type === 'eraser' || type === 'arrow') {
      this.ctx.lineJoin = 'round';
    } else {
      this.ctx.lineJoin = 'miter';
    }
  }

  setLineWidth(width) {
    this.lineWidth = width;
  }

  setArrowLength(length) {
    this.arrowLength = length;
  }

  setEraserWidth(width) {
    this.eraserWidth = width;
  }

  handleMouseDown(event) {
    this.activate(this.type);
    const mainClass = event.target.classList[0];
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.main.colorWidgetState.line.alphaColor;
    this.ctx.fillStyle = this.main.colorWidgetState.fill.alphaColor;
    const scale = this.main.getScale();
    this.ctx.lineCap = 'round';
    if (mainClass === 'ptro-crp-el' || mainClass === 'ptro-zoomer') {
      this.tmpData = this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h);
      if (this.type === 'brush' || this.type === 'eraser') {
        this.state.cornerMarked = true;
        const cord = [
          (event.clientX - this.main.elLeft()) + this.main.scroller.scrollLeft,
          (event.clientY - this.main.elTop()) + this.main.scroller.scrollTop,
        ];
        const noPressure = event.pressure === undefined || event.pressure < 0.001;
        const cur = {
          x: cord[0] * scale,
          y: cord[1] * scale,
          percent: noPressure ? 1 : (event.pressure * 2),
        };

        this.points = [cur];
        this.drawBrushPath();
      } else {
        this.state.cornerMarked = true;
        this.centerCord = [
          (event.clientX - this.main.elLeft()) + this.main.scroller.scrollLeft,
          (event.clientY - this.main.elTop()) + this.main.scroller.scrollTop,
        ];
        this.centerCord = [this.centerCord[0] * scale, this.centerCord[1] * scale];
      }
    }
  }

  drawBrushPath() {
    const smPoints = this.points;
    if (smPoints.length === 0) return;
    let lineFill;
    const origComposition = this.ctx.globalCompositeOperation;
    const isEraser = this.type === 'eraser';
    lineFill = this.main.colorWidgetState.line.alphaColor;
    const bgIsTransparent = this.main.currentBackgroundAlpha !== 1.0;
    for (let i = 1; i <= (isEraser && bgIsTransparent ? 2 : 1); i += 1) {
      if (isEraser) {
        this.ctx.globalCompositeOperation = i === 1 && bgIsTransparent ? 'destination-out' : origComposition;
        lineFill = i === 1 && bgIsTransparent ? 'rgba(0,0,0,1)' : this.main.currentBackground;
      }
      let baseLineWidth = this.lineWidth;
      if (isEraser) {
        baseLineWidth = this.eraserWidth;
      }

      if (isEraser) { // Old attempt, eraser only
        // Draw 0th point as circle
        this.ctx.beginPath();
        this.ctx.lineWidth = 0;
        this.ctx.fillStyle = lineFill;
        this.ctx.arc(
          this.points[0].x, this.points[0].y,
          (baseLineWidth / 2) * this.points[0].percent,
          0, 2 * Math.PI,
        );
        this.ctx.fill();
        this.ctx.closePath();
        let last = this.points[0];

        this.ctx.save();
        smPoints.slice(1).forEach((p, i) => { // eslint-disable-line
          this.ctx.save();
          this.ctx.beginPath();

          const region = new Path2D();
          region.rect(0, 0, this.main.size.w, this.main.size.h);
          region.arc(
            last.x, last.y,
            (baseLineWidth / 2) * last.percent,
            0, 2 * Math.PI,
          );
          this.ctx.clip(region, 'evenodd');

          this.ctx.strokeStyle = lineFill;
          this.ctx.fillStyle = this.main.colorWidgetState.fill.alphaColor;

          this.ctx.moveTo(last.x, last.y);
          this.ctx.lineWidth = baseLineWidth * p.percent;
          this.ctx.lineTo(p.x, p.y);
          this.ctx.stroke();

          last = p;
          this.ctx.restore();
        });
        this.ctx.restore();
      } else {
        // Create new canvas and context
        const newCanvas = document.createElement('canvas');
        newCanvas.width = this.main.size.w;
        newCanvas.height = this.main.size.h;
        const newctx = newCanvas.getContext('2d');
        newctx.lineCap = 'round';

        // Draw 0th point as circle
        newctx.beginPath();
        newctx.lineWidth = 0;
        newctx.fillStyle = 'black';
        newctx.arc(
          this.points[0].x, this.points[0].y,
          (baseLineWidth / 2) * this.points[0].percent,
          0, 2 * Math.PI,
        );
        newctx.fill();
        let last = this.points[0];
        newctx.strokeStyle = 'black';
        newctx.fillStyle = this.main.colorWidgetState.fill.alphaColor;

        smPoints.slice(1).forEach((p, i) => { // eslint-disable-line
          newctx.beginPath();
          newctx.moveTo(last.x, last.y);
          newctx.lineWidth = baseLineWidth * p.percent;
          newctx.lineTo(p.x, p.y);
          newctx.stroke();

          last = p;
        });

        newctx.fillStyle = lineFill;
        newctx.globalCompositeOperation = 'source-in';
        newctx.fillRect(0, 0, this.main.size.w, this.main.size.h);
        this.ctx.drawImage(newCanvas, 0, 0);
      }
    }
    this.ctx.globalCompositeOperation = origComposition;
  }

  handleMouseMove(event) {
    if (this.state.cornerMarked) {
      this.ctx.putImageData(this.tmpData, 0, 0);
      this.curCord = [
        (event.clientX - this.main.elLeft()) + this.main.scroller.scrollLeft,
        (event.clientY - this.main.elTop()) + this.main.scroller.scrollTop,
      ];
      const scale = this.main.getScale();
      this.curCord = [this.curCord[0] * scale, this.curCord[1] * scale];

      if (this.type === 'brush' || this.type === 'eraser') {
        const noPressure = event.pressure === undefined || event.pressure < 0.001;
        const cur = {
          x: this.curCord[0],
          y: this.curCord[1],
          percent: noPressure ? 1 : (event.pressure * 2),
        };
        this.points.push(cur);
        this.drawBrushPath();
      } else if (this.type === 'line') {
        if (event.ctrlKey || event.shiftKey) {
          const deg = (Math.atan(
            -(this.curCord[1] - this.centerCord[1]) / (this.curCord[0] - this.centerCord[0]),
          ) * 180) / Math.PI;
          if (Math.abs(deg) < 45.0 / 2) {
            this.curCord[1] = this.centerCord[1];
          } else if (Math.abs(deg) > 45.0 + (45.0 / 2)) {
            this.curCord[0] = this.centerCord[0];
          } else {
            const base = (Math.abs(this.curCord[0] - this.centerCord[0])
              - Math.abs(this.centerCord[1] - this.curCord[1])) / 2;

            this.curCord[0] -= base * (this.centerCord[0] < this.curCord[0] ? 1 : -1);
            this.curCord[1] -= base * (this.centerCord[1] > this.curCord[1] ? 1 : -1);
          }
        }
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerCord[0], this.centerCord[1]);
        this.ctx.lineTo(this.curCord[0], this.curCord[1]);
        this.ctx.closePath();
        this.ctx.stroke();
      } else if (this.type === 'arrow') {
        let deg = (Math.atan(
          -(this.curCord[1] - this.centerCord[1]) / (this.curCord[0] - this.centerCord[0]),
        ) * 180) / Math.PI;
        if (event.ctrlKey || event.shiftKey) {
          if (Math.abs(deg) < 45.0 / 2) {
            this.curCord[1] = this.centerCord[1];
          } else if (Math.abs(deg) > 45.0 + (45.0 / 2)) {
            this.curCord[0] = this.centerCord[0];
          } else {
            const base = (Math.abs(this.curCord[0] - this.centerCord[0])
              - Math.abs(this.centerCord[1] - this.curCord[1])) / 2;

            this.curCord[0] -= base * (this.centerCord[0] < this.curCord[0] ? 1 : -1);
            this.curCord[1] -= base * (this.centerCord[1] > this.curCord[1] ? 1 : -1);
          }
        }
        if (this.curCord[0] < this.centerCord[0]) {
          deg = (180 + deg);
        }
        const { arrowLength } = this;
        const arrowAngle = this.main.params.defaultArrowAngle;
        const arrow = [
          [
            this.curCord[0] - (Math.cos((arrowAngle - deg) / (180 / Math.PI)) * arrowLength),
            this.curCord[1] - (Math.sin((arrowAngle - deg) / (180 / Math.PI)) * arrowLength),
          ],
          [
            this.curCord[0] - (Math.cos((-arrowAngle - deg) / (180 / Math.PI)) * arrowLength),
            this.curCord[1] - (Math.sin((-arrowAngle - deg) / (180 / Math.PI)) * arrowLength),
          ],
        ];
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerCord[0], this.centerCord[1]);
        this.ctx.lineTo(this.curCord[0], this.curCord[1]);
        this.ctx.moveTo(this.curCord[0], this.curCord[1]);
        this.ctx.lineTo(arrow[0][0], arrow[0][1]);
        this.ctx.moveTo(this.curCord[0], this.curCord[1]);
        this.ctx.lineTo(arrow[1][0], arrow[1][1]);
        this.ctx.closePath();
        this.ctx.stroke();
      } else if (this.type === 'rect') {
        this.ctx.beginPath();

        const tl = [
          this.centerCord[0],
          this.centerCord[1]];

        let w = this.curCord[0] - this.centerCord[0];
        let h = this.curCord[1] - this.centerCord[1];

        if (event.ctrlKey || event.shiftKey) {
          const min = Math.min(Math.abs(w), Math.abs(h));
          w = min * Math.sign(w);
          h = min * Math.sign(h);
        }
        const halfLW = Math.floor(this.lineWidth / 2);
        const oddCorrecter = this.lineWidth % 2;
        this.ctx.rect(
          tl[0] + halfLW, tl[1] + halfLW,
          (w - this.lineWidth) + oddCorrecter, (h - this.lineWidth) + oddCorrecter,
        );
        this.ctx.fill();
        this.ctx.strokeRect(tl[0], tl[1], w, h);
        this.ctx.closePath();
      } else if (this.type === 'ellipse') {
        this.ctx.beginPath();
        const x1 = this.centerCord[0];
        const y1 = this.centerCord[1];
        let w = this.curCord[0] - x1;
        let h = this.curCord[1] - y1;

        if (event.ctrlKey || event.shiftKey) {
          const min = Math.min(Math.abs(w), Math.abs(h));
          w = min * Math.sign(w);
          h = min * Math.sign(h);
        }

        const rX = Math.abs(w);
        const rY = Math.abs(h);

        const tlX = Math.min(x1, x1 + w);
        const tlY = Math.min(y1, y1 + h);

        this.ctx.save();
        let xScale = 1;
        let yScale = 1;
        let radius;
        const hR = rX / 2;
        const vR = rY / 2;
        if (rX > rY) {
          yScale = rX / rY;
          radius = hR;
        } else {
          xScale = rY / rX;
          radius = vR;
        }
        this.ctx.scale(1 / xScale, 1 / yScale);
        this.ctx.arc(
          (tlX + hR) * xScale,
          (tlY + vR) * yScale,
          radius, 0, 2 * Math.PI,
        );
        this.ctx.restore();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
      }
    }
  }

  handleMouseUp() {
    if (this.state.cornerMarked) {
      this.state.cornerMarked = false;
      this.main.worklog.captureState();
    }
  }

  setPixelSize(size) {
    this.pixelSize = size;
  }
}
