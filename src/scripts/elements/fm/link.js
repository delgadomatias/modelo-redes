import { circleFromThreePoints } from "../../utils/index.js";
import { FmMain } from "../../fm-main-dos.js";

// export class FMLink {
//   constructor(a, b) {
//     this.nodeA = a;
//     this.nodeB = b;
//     this.textStart = "";
//     this.textEnd = "";
//     this.main = FmMain.getInstance();
//
//     this.lineAngleAdjust = 0; // value to add to textAngle when link is straight line
//
//     // make anchor point relative to the locations of nodeA and nodeB
//     this.parallelPart = 0.5; // percentage from nodeA to nodeB
//     this.perpendicularPart = 0; // pixels from line between nodeA and nodeB
//   }
//
//   getAnchorPoint() {
//     const dx = this.nodeB.x - this.nodeA.x;
//     const dy = this.nodeB.y - this.nodeA.y;
//     const scale = Math.sqrt(dx * dx + dy * dy);
//     return {
//       x:
//         this.nodeA.x +
//         dx * this.parallelPart -
//         (dy * this.perpendicularPart) / scale,
//       y:
//         this.nodeA.y +
//         dy * this.parallelPart +
//         (dx * this.perpendicularPart) / scale,
//     };
//   }
//
//   setAnchorPoint(x, y) {
//     const dx = this.nodeB.x - this.nodeA.x;
//     const dy = this.nodeB.y - this.nodeA.y;
//     const scale = Math.sqrt(dx * dx + dy * dy);
//     this.parallelPart =
//       (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
//     this.perpendicularPart =
//       (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
//     // snap to a straight line
//     if (
//       this.parallelPart > 0 &&
//       this.parallelPart < 1 &&
//       Math.abs(this.perpendicularPart) < this.main.snapToPadding
//     ) {
//       this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
//       this.perpendicularPart = 0;
//     }
//   }
//
//   getEndPointsAndCircle() {
//     if (this.perpendicularPart === 0) {
//       let midX = (this.nodeA.x + this.nodeB.x) / 2;
//       let midY = (this.nodeA.y + this.nodeB.y) / 2;
//       let start = this.nodeA.closestPointOnCircle(midX, midY);
//       let end = this.nodeB.closestPointOnCircle(midX, midY);
//       return {
//         hasCircle: false,
//         startX: start.x,
//         startY: start.y,
//         endX: end.x,
//         endY: end.y,
//       };
//     }
//
//     let anchor = this.getAnchorPoint();
//     let circle = circleFromThreePoints(
//       this.nodeA.x,
//       this.nodeA.y,
//       this.nodeB.x,
//       this.nodeB.y,
//       anchor.x,
//       anchor.y,
//     );
//     let isReversed = this.perpendicularPart > 0;
//     let reverseScale = isReversed ? 1 : -1;
//     let startAngle =
//       Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) -
//       (reverseScale * this.main.nodeRadius) / circle.radius;
//     let endAngle =
//       Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) +
//       (reverseScale * this.main.nodeRadius) / circle.radius;
//     let startX = circle.x + circle.radius * Math.cos(startAngle);
//     let startY = circle.y + circle.radius * Math.sin(startAngle);
//     let endX = circle.x + circle.radius * Math.cos(endAngle);
//     let endY = circle.y + circle.radius * Math.sin(endAngle);
//
//     return {
//       hasCircle: true,
//       startX: startX,
//       startY: startY,
//       endX: endX,
//       endY: endY,
//       startAngle: startAngle,
//       endAngle: endAngle,
//       circleX: circle.x,
//       circleY: circle.y,
//       circleRadius: circle.radius,
//       reverseScale: reverseScale,
//       isReversed: isReversed,
//     };
//   }
//
//   draw(c) {
//     const stuff = this.getEndPointsAndCircle();
//     // Dibuja la línea entre nodeA y nodeB
//     const startCoords = this.nodeA.closestPointOnCircle(
//       this.nodeB.x,
//       this.nodeB.y,
//     );
//
//     const endCoords = this.nodeB.closestPointOnCircle(
//       this.nodeA.x,
//       this.nodeA.y,
//     );
//
//     // draw arc
//     c.beginPath();
//
//     if (stuff.hasCircle) {
//       c.arc(
//         stuff.circleX,
//         stuff.circleY,
//         stuff.circleRadius,
//         stuff.startAngle,
//         stuff.endAngle,
//         stuff.isReversed,
//       );
//     } else {
//       c.moveTo(startCoords.x, startCoords.y);
//       c.lineTo(endCoords.x, endCoords.y);
//     }
//     c.stroke();
//
//     //
//     // c.beginPath();
//     // c.moveTo(startCoords.x, startCoords.y);
//     // c.lineTo(endCoords.x, endCoords.y);
//     // c.stroke();
//
//     // Calcula el ángulo de la línea
//     const angle = Math.atan2(
//       endCoords.y - startCoords.y,
//       endCoords.x - startCoords.x,
//     );
//
//     // Separación adicional para los textos
//     const textOffset = 10;
//     const perpendicularOffset = 20;
//
//     // Calcula las posiciones del texto
//     const startX =
//       startCoords.x +
//       Math.cos(angle) * textOffset -
//       Math.sin(angle) * perpendicularOffset;
//
//     const startY =
//       startCoords.y +
//       Math.sin(angle) * textOffset +
//       Math.cos(angle) * perpendicularOffset;
//
//     const endX =
//       endCoords.x -
//       Math.cos(angle) * textOffset +
//       Math.sin(angle) * perpendicularOffset;
//     const endY =
//       endCoords.y -
//       Math.sin(angle) * textOffset -
//       Math.cos(angle) * perpendicularOffset;
//
//     // Dibuja el texto en una posición fija relativa a los nodos de inicio y final
//     this.main.drawText(
//       c,
//       this.textStart,
//       startX,
//       startY,
//       null,
//       this === this.main.selectedObject && !this.main.editingEndText,
//     );
//
//     this.main.drawText(
//       c,
//       this.textEnd,
//       endX,
//       endY,
//       null,
//       this === this.main.selectedObject && this.main.editingEndText,
//     );
//   }
//
//   containsPoint(x, y) {
//     const stuff = this.getEndPointsAndCircle();
//     if (stuff.hasCircle) {
//       const dx = x - stuff.circleX;
//       const dy = y - stuff.circleY;
//       const distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
//       if (Math.abs(distance) < this.main.hitTargetPadding) {
//         let angle = Math.atan2(dy, dx);
//         let startAngle = stuff.startAngle;
//         let endAngle = stuff.endAngle;
//         if (stuff.isReversed) {
//           const temp = startAngle;
//           startAngle = endAngle;
//           endAngle = temp;
//         }
//
//         if (endAngle < startAngle) {
//           endAngle += Math.PI * 2;
//         }
//
//         if (angle < startAngle) {
//           angle += Math.PI * 2;
//         } else if (angle > endAngle) {
//           angle -= Math.PI * 2;
//         }
//
//         return angle > startAngle && angle < endAngle;
//       }
//     } else {
//       let dx = stuff.endX - stuff.startX;
//       let dy = stuff.endY - stuff.startY;
//       let length = Math.sqrt(dx * dx + dy * dy);
//       let percent =
//         (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
//       let distance =
//         (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
//       return (
//         percent > 0 &&
//         percent < 1 &&
//         Math.abs(distance) < this.main.hitTargetPadding
//       );
//     }
//
//     return false;
//   }
// }
export class FMLink {
  constructor(a, b) {
    this.nodeA = a;
    this.nodeB = b;
    this.textStart = "";
    this.textEnd = "";
    this.main = FmMain.getInstance();

    this.lineAngleAdjust = 0; // value to add to textAngle when link is straight line

    // make anchor point relative to the locations of nodeA and nodeB
    this.parallelPart = 0.5; // percentage from nodeA to nodeB
    this.perpendicularPart = 0; // pixels from line between nodeA and nodeB

    // Initialize text positions
    // this.updateTextPositions();
  }

  getAnchorPoint() {
    const dx = this.nodeB.x - this.nodeA.x;
    const dy = this.nodeB.y - this.nodeA.y;
    const scale = Math.sqrt(dx * dx + dy * dy);
    return {
      x:
        this.nodeA.x +
        dx * this.parallelPart -
        (dy * this.perpendicularPart) / scale,
      y:
        this.nodeA.y +
        dy * this.parallelPart +
        (dx * this.perpendicularPart) / scale,
    };
  }

  setAnchorPoint(x, y) {
    const dx = this.nodeB.x - this.nodeA.x;
    const dy = this.nodeB.y - this.nodeA.y;
    const scale = Math.sqrt(dx * dx + dy * dy);
    this.parallelPart =
      (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
    this.perpendicularPart =
      (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
    // snap to a straight line
    if (
      this.parallelPart > 0 &&
      this.parallelPart < 1 &&
      Math.abs(this.perpendicularPart) < this.main.snapToPadding
    ) {
      this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
      this.perpendicularPart = 0;
    }

    // Update text positions after setting the anchor point
    // this.updateTextPositions();
  }

  getEndPointsAndCircle() {
    if (this.perpendicularPart === 0) {
      let midX = (this.nodeA.x + this.nodeB.x) / 2;
      let midY = (this.nodeA.y + this.nodeB.y) / 2;
      let start = this.nodeA.closestPointOnCircle(midX, midY);
      let end = this.nodeB.closestPointOnCircle(midX, midY);
      return {
        hasCircle: false,
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
      };
    }

    let anchor = this.getAnchorPoint();
    let circle = circleFromThreePoints(
      this.nodeA.x,
      this.nodeA.y,
      this.nodeB.x,
      this.nodeB.y,
      anchor.x,
      anchor.y,
    );
    let isReversed = this.perpendicularPart > 0;
    let reverseScale = isReversed ? 1 : -1;
    let startAngle =
      Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) -
      (reverseScale * this.main.nodeRadius) / circle.radius;
    let endAngle =
      Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) +
      (reverseScale * this.main.nodeRadius) / circle.radius;
    let startX = circle.x + circle.radius * Math.cos(startAngle);
    let startY = circle.y + circle.radius * Math.sin(startAngle);
    let endX = circle.x + circle.radius * Math.cos(endAngle);
    let endY = circle.y + circle.radius * Math.sin(endAngle);

    return {
      hasCircle: true,
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      startAngle: startAngle,
      endAngle: endAngle,
      circleX: circle.x,
      circleY: circle.y,
      circleRadius: circle.radius,
      reverseScale: reverseScale,
      isReversed: isReversed,
    };
  }

  draw = (c) => {
    let textY;
    let textAngle;
    let textX;
    const stuff = this.getEndPointsAndCircle();
    // draw arc
    c.beginPath();
    if (stuff.hasCircle) {
      c.arc(
        stuff.circleX,
        stuff.circleY,
        stuff.circleRadius,
        stuff.startAngle,
        stuff.endAngle,
        stuff.isReversed,
      );
    } else {
      c.moveTo(stuff.startX, stuff.startY);
      c.lineTo(stuff.endX, stuff.endY);
    }
    c.stroke();
    // draw the head of the arrow
    // if(stuff.hasCircle) {
    //     drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle - stuff.reverseScale * (Math.PI / 2));
    // } else {
    //     drawArrow(c, stuff.endX, stuff.endY, Math.atan2(stuff.endY - stuff.startY, stuff.endX - stuff.startX));
    // }

    // draw the text
    if (stuff.hasCircle) {
      const startAngle = stuff.startAngle;
      let endAngle = stuff.endAngle;
      if (endAngle < startAngle) {
        endAngle += Math.PI * 2;
      }
      textAngle = (startAngle + endAngle) / 2 + stuff.isReversed * Math.PI;
      textX = stuff.circleX + stuff.circleRadius * Math.cos(textAngle);
      textY = stuff.circleY + stuff.circleRadius * Math.sin(textAngle);
      this.main.drawText(
        c,
        this.textStart,
        textX,
        textY,
        textAngle,
        this.main.selectedObject === this,
      );
    } else {
      textX = (stuff.startX + stuff.endX) / 2;
      textY = (stuff.startY + stuff.endY) / 2;
      textAngle = Math.atan2(
        stuff.endX - stuff.startX,
        stuff.startY - stuff.endY,
      );

      this.main.drawText(
        c,
        this.textStart,
        textX,
        textY,
        textAngle + this.lineAngleAdjust,
        this.main.selectedObject === this,
      );
    }
  };

  // draw = (c) => {
  //   const stuff = this.getEndPointsAndCircle();
  //   const textOffset = 20; // Adjust this value as needed
  //
  //   // draw arc
  //   c.beginPath();
  //   if (stuff.hasCircle) {
  //     c.arc(
  //       stuff.circleX,
  //       stuff.circleY,
  //       stuff.circleRadius,
  //       stuff.startAngle,
  //       stuff.endAngle,
  //       stuff.isReversed,
  //     );
  //   } else {
  //     c.moveTo(stuff.startX, stuff.startY);
  //     c.lineTo(stuff.endX, stuff.endY);
  //   }
  //   c.stroke();
  //
  //   // draw the text
  //   const angle = Math.atan2(
  //     stuff.endY - stuff.startY,
  //     stuff.endX - stuff.startX,
  //   );
  //
  //   // Determine the direction of the text based on the angle of the line
  //   const direction = angle > Math.PI / 2 && angle < (3 * Math.PI) / 2 ? -1 : 1;
  //
  //   // Position the start text at the start point, offset by a fixed amount in the direction perpendicular to the line or arc
  //   const textStartX =
  //     stuff.startX + direction * Math.cos(angle + Math.PI / 2) * textOffset;
  //   const textStartY =
  //     stuff.startY + direction * Math.sin(angle + Math.PI / 2) * textOffset;
  //
  //   // Position the end text at the end point, offset by a fixed amount in the direction perpendicular to the line or arc
  //   const textEndX =
  //     stuff.endX - direction * Math.cos(angle + Math.PI / 2) * textOffset;
  //   const textEndY =
  //     stuff.endY - direction * Math.sin(angle + Math.PI / 2) * textOffset;
  //
  //   this.main.drawText(
  //     c,
  //     this.textStart,
  //     textStartX,
  //     textStartY,
  //     angle,
  //     this.main.selectedObject === this,
  //   );
  //
  //   this.main.drawText(
  //     c,
  //     this.textEnd,
  //     textEndX,
  //     textEndY,
  //     angle,
  //     this.main.selectedObject === this,
  //   );
  // };

  // draw = (c) => {
  //   const stuff = this.getEndPointsAndCircle();
  //   const textOffset = 20; // Adjust this value as needed
  //
  //   // draw arc
  //   c.beginPath();
  //   if (stuff.hasCircle) {
  //     c.arc(
  //       stuff.circleX,
  //       stuff.circleY,
  //       stuff.circleRadius,
  //       stuff.startAngle,
  //       stuff.endAngle,
  //       stuff.isReversed,
  //     );
  //   } else {
  //     c.moveTo(stuff.startX, stuff.startY);
  //     c.lineTo(stuff.endX, stuff.endY);
  //   }
  //   c.stroke();
  //
  //   // draw the text
  //   const angle = Math.atan2(
  //     stuff.endY - stuff.startY,
  //     stuff.endX - stuff.startX,
  //   );
  //
  //   // Determine the direction of the text based on the angle of the line
  //   const direction = angle > Math.PI / 2 && angle < (3 * Math.PI) / 2 ? -1 : 1;
  //
  //   // Position the start text at the start point, offset by a fixed amount in the direction perpendicular to the line or arc
  //   const textStartX =
  //     stuff.startX + direction * Math.cos(angle + Math.PI / 2) * textOffset;
  //   const textStartY =
  //     stuff.startY + direction * Math.sin(angle + Math.PI / 2) * textOffset;
  //
  //   // Position the end text at the end point, offset by a fixed amount in the direction perpendicular to the line or arc
  //   const textEndX =
  //     stuff.endX - direction * Math.cos(angle + Math.PI / 2) * textOffset;
  //   const textEndY =
  //     stuff.endY - direction * Math.sin(angle + Math.PI / 2) * textOffset;
  //
  //   this.main.drawText(
  //     c,
  //     this.textStart,
  //     textStartX,
  //     textStartY,
  //     angle,
  //     this.main.selectedObject === this,
  //   );
  //
  //   this.main.drawText(
  //     c,
  //     this.textEnd,
  //     textEndX,
  //     textEndY,
  //     angle,
  //     this.main.selectedObject === this,
  //   );
  // };

  // draw(c) {
  //   const stuff = this.getEndPointsAndCircle();
  //   // Dibuja la línea entre nodeA y nodeB
  //   const startCoords = this.nodeA.closestPointOnCircle(
  //     this.nodeB.x,
  //     this.nodeB.y,
  //   );
  //
  //   const endCoords = this.nodeB.closestPointOnCircle(
  //     this.nodeA.x,
  //     this.nodeA.y,
  //   );
  //
  //   // draw arc
  //   c.beginPath();
  //
  //   if (stuff.hasCircle) {
  //     c.arc(
  //       stuff.circleX,
  //       stuff.circleY,
  //       stuff.circleRadius,
  //       stuff.startAngle,
  //       stuff.endAngle,
  //       stuff.isReversed,
  //     );
  //   } else {
  //     c.moveTo(startCoords.x, startCoords.y);
  //     c.lineTo(endCoords.x, endCoords.y);
  //   }
  //   c.stroke();
  //
  //   // Dibuja el texto en las posiciones calculadas
  //   this.main.drawText(
  //     c,
  //     this.textStart,
  //     this.textStartX,
  //     this.textStartY,
  //     null,
  //     this === this.main.selectedObject && !this.main.editingEndText,
  //   );
  //
  //   this.main.drawText(
  //     c,
  //     this.textEnd,
  //     this.textEndX,
  //     this.textEndY,
  //     null,
  //     this === this.main.selectedObject && this.main.editingEndText,
  //   );
  // }

  containsPoint(x, y) {
    const stuff = this.getEndPointsAndCircle();
    if (stuff.hasCircle) {
      const dx = x - stuff.circleX;
      const dy = y - stuff.circleY;
      const distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
      if (Math.abs(distance) < this.main.hitTargetPadding) {
        let angle = Math.atan2(dy, dx);
        let startAngle = stuff.startAngle;
        let endAngle = stuff.endAngle;
        if (stuff.isReversed) {
          const temp = startAngle;
          startAngle = endAngle;
          endAngle = temp;
        }

        if (endAngle < startAngle) {
          endAngle += Math.PI * 2;
        }

        if (angle < startAngle) {
          angle += Math.PI * 2;
        } else if (angle > endAngle) {
          angle -= Math.PI * 2;
        }

        return angle > startAngle && angle < endAngle;
      }
    } else {
      let dx = stuff.endX - stuff.startX;
      let dy = stuff.endY - stuff.startY;
      let length = Math.sqrt(dx * dx + dy * dy);
      let percent =
        (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
      let distance =
        (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
      return (
        percent > 0 &&
        percent < 1 &&
        Math.abs(distance) < this.main.hitTargetPadding
      );
    }

    return false;
  }
}
