import { drawArrow } from "../../fm-main.js";

export class FmTemporaryLink {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }

  draw(c) {
    // draw the line
    c.beginPath();
    c.moveTo(this.to.x, this.to.y);
    c.lineTo(this.from.x, this.from.y);
    c.stroke();

    // Draw the head of the arrow
    drawArrow(
      c,
      this.to.x,
      this.to.y,
      Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x),
    );
  }
}
