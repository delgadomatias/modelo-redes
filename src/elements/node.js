export class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.mouseOffsetX = 0;
    this.mouseOffsetY = 0;
    this.isAcceptState = false;
    this.text = "";
  }

  setMouseStart(x, y) {
    this.mouseOffsetX = this.x - x;
    this.mouseOffsetY = this.y - y;
  }

  setAnchorPoint(x, y) {
    this.x = x + this.mouseOffsetX;
    this.y = y + this.mouseOffsetY;
  }

  draw(c) {
    // draw the circle
    c.beginPath();
    c.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI, false);
    c.stroke();

    // draw the text
    drawText(c, this.text, this.x, this.y, null, selectedObject == this);

    // draw a double circle for an accept state
    // if (this.isAcceptState) {
    //   c.beginPath();
    //   c.arc(this.x, this.y, nodeRadius - 6, 0, 2 * Math.PI, false);
    //   c.stroke();
    // }
  }

  closestPointOnCircle(x, y) {
    var dx = x - this.x;
    var dy = y - this.y;
    var scale = Math.sqrt(dx * dx + dy * dy);
    return {
      x: this.x + (dx * nodeRadius) / scale,
      y: this.y + (dy * nodeRadius) / scale,
    };
  }

  containsPoint(x, y) {
    return (
      (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) <
      nodeRadius * nodeRadius
    );
  }
}
