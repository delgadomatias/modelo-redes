import { Main } from "../main.js";

export class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.mouseOffsetX = 0;
    this.mouseOffsetY = 0;
    this.isAcceptState = false;
    this.text = "";
    this.main = Main.getInstance();
  }

  setMouseStart(x, y) {
    this.mouseOffsetX = this.x - x;
    this.mouseOffsetY = this.y - y;
  }

  setAnchorPoint(x, y) {
    this.x = x + this.mouseOffsetX;
    this.y = y + this.mouseOffsetY;
  }

  draw = (c) => {
    // draw the circle
    c.beginPath();
    c.arc(this.x, this.y, this.main.nodeRadius, 0, 2 * Math.PI, false);
    c.stroke();

    // draw the text
    this.main.drawText(
      c,
      this.text,
      this.x,
      this.y,
      null,
      this.main.selectedObject === this,
    );

    // draw a double circle for an accept state
    if (this.isAcceptState) {
      const isLastAccepted = this.main.isLastAcceptedNode(this);
      let color;

      color = isLastAccepted ? "green" : "blue";

      if (this.main.acceptedNodes.length === 1) {
        color = "blue";
      }

      c.strokeStyle = color;
      c.fillStyle = color;

      c.beginPath();
      c.arc(this.x, this.y, this.main.nodeRadius, 0, 2 * Math.PI, false);
      c.stroke();
    }
  };

  closestPointOnCircle(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    const scale = Math.sqrt(dx * dx + dy * dy);

    return {
      x: this.x + (dx * this.main.nodeRadius) / scale,
      y: this.y + (dy * this.main.nodeRadius) / scale,
    };
  }

  containsPoint(x, y) {
    return (
      (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) <
      this.main.nodeRadius * this.main.nodeRadius
    );
  }
}
