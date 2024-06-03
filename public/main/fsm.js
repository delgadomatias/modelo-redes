var lastTwoAcceptStates = [];
var greekLetterNames = [
  "alpha",
  "beta",
  "gamma",
  "delta",
  "epsilon",
  "zeta",
  "eta",
  "theta",
  "iota",
  "kappa",
  "lambda",
  "mu",
  "nu",
  "xi",
  "omicron",
  "pi",
  "rho",
  "sigma",
  "tau",
  "upsilon",
  "phi",
  "chi",
  "psi",
  "omega",
];

function convertLatexShortcuts(text) {
  // html greek characters
  for (var i = 0; i < greekLetterNames.length; i++) {
    var name = greekLetterNames[i];
    text = text.replace(
      new RegExp("\\\\" + name, "g"),
      String.fromCharCode(913 + i + (i > 16)),
    );
    text = text.replace(
      new RegExp("\\\\" + name.toLowerCase(), "g"),
      String.fromCharCode(945 + i + (i > 16)),
    );
  }

  // subscripts
  for (var i = 0; i < 10; i++) {
    text = text.replace(
      new RegExp("_" + i, "g"),
      String.fromCharCode(8320 + i),
    );
  }

  return text;
}

function textToXML(text) {
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  var result = "";
  for (var i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i);
    if (c >= 0x20 && c <= 0x7e) {
      result += text[i];
    } else {
      result += "&#" + c + ";";
    }
  }
  return result;
}

function drawArrow(c, x, y, angle) {
  var dx = Math.cos(angle);
  var dy = Math.sin(angle);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
  c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
  c.fill();
}

function canvasHasFocus() {
  return (document.activeElement || document.body) == document.body;
}

function drawText(c, originalText, x, y, angleOrNull, isSelected) {
  text = convertLatexShortcuts(originalText);
  c.font = '20px "Inter", serif';
  var width = c.measureText(text).width;

  // center the text
  x -= width / 2;

  // position the text intelligently if given an angle
  if (angleOrNull != null) {
    var cos = Math.cos(angleOrNull);
    var sin = Math.sin(angleOrNull);
    var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
    var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
    var slide =
      sin * Math.pow(Math.abs(sin), 40) * cornerPointX -
      cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
    x += cornerPointX - sin * slide;
    y += cornerPointY + cos * slide;
  }

  // draw text and caret (round the coordinates so the caret falls on a pixel)
  if ("advancedFillText" in c) {
    c.advancedFillText(text, originalText, x + width / 2, y, angleOrNull);
  } else {
    x = Math.round(x);
    y = Math.round(y);
    c.fillText(text, x, y + 6);
    if (isSelected && caretVisible && canvasHasFocus() && document.hasFocus()) {
      x += width;
      c.beginPath();
      c.moveTo(x, y - 10);
      c.lineTo(x, y + 10);
      c.stroke();
    }
  }
}

var caretTimer;
var caretVisible = true;

function resetCaret() {
  clearInterval(caretTimer);
  caretTimer = setInterval("caretVisible = !caretVisible; draw()", 500);
  caretVisible = true;
}

var canvas;
var nodeRadius = 25;
var nodes = [];
var links = [];

var cursorVisible = true;
var snapToPadding = 6; // pixels
var hitTargetPadding = 6; // pixels
var selectedObject = null; // either a Link or a Node
var currentLink = null; // a Link
var movingObject = false;
var originalClick;

function drawUsing(c) {
  c.clearRect(
    0,
    0,
    canvas.getBoundingClientRect().width,
    canvas.getBoundingClientRect().height,
  );
  c.save();
  c.translate(0.5, 0.5);

  for (var i = 0; i < nodes.length; i++) {
    c.lineWidth = 1.7;
    c.fillStyle = c.strokeStyle =
      nodes[i] == selectedObject ? "#ff5924" : "white";
    nodes[i].draw(c);
  }
  for (var i = 0; i < links.length; i++) {
    c.lineWidth = 1.7;
    c.fillStyle = c.strokeStyle =
      links[i] == selectedObject ? "#ff5924" : "white";
    links[i].draw(c);
  }
  if (currentLink != null) {
    c.lineWidth = 1.7;
    c.fillStyle = c.strokeStyle = "white";
    currentLink.draw(c);
  }

  c.restore();
}

function drawPrimSolution(c, nodes, links) {
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.translate(0.5, 0.5);

  for (var i = 0; i < nodes.length; i++) {
    c.lineWidth = 1.7;
    c.fillStyle = c.strokeStyle =
      nodes[i] == selectedObject ? "#ff5924" : "white";
    nodes[i].draw(c);
  }
  for (var i = 0; i < links.length; i++) {
    c.lineWidth = 1.7;
    c.fillStyle = c.strokeStyle =
      links[i] == selectedObject ? "#ff5924" : "white";
    links[i].draw(c);
  }
  if (currentLink != null) {
    c.lineWidth = 1.7;
    c.fillStyle = c.strokeStyle = "white";
    currentLink.draw(c);
  }

  c.restore();
}

function draw() {
  drawUsing(canvas.getContext("2d"));
  saveBackup();
}

function selectObject(x, y) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].containsPoint(x, y)) {
      return nodes[i];
    }
  }
  for (var i = 0; i < links.length; i++) {
    if (links[i].containsPoint(x, y)) {
      return links[i];
    }
  }
  return null;
}

function snapNode(node) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] == node) continue;

    if (Math.abs(node.x - nodes[i].x) < snapToPadding) {
      node.x = nodes[i].x;
    }

    if (Math.abs(node.y - nodes[i].y) < snapToPadding) {
      node.y = nodes[i].y;
    }
  }
}

window.onload = function () {
  canvas = document.getElementById("canvas");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  restoreBackup();
  draw();

  canvas.onmousedown = function (e) {
    var mouse = crossBrowserRelativeMousePos(e);
    selectedObject = selectObject(mouse.x, mouse.y);
    movingObject = false;
    originalClick = mouse;

    if (selectedObject != null) {
      if (shift && selectedObject instanceof Node) {
        currentLink = new SelfLink(selectedObject, mouse);
      } else {
        movingObject = true;
        deltaMouseX = deltaMouseY = 0;
        if (selectedObject.setMouseStart) {
          selectedObject.setMouseStart(mouse.x, mouse.y);
        }
      }
      resetCaret();
    } else if (shift) {
      currentLink = new TemporaryLink(mouse, mouse);
    }

    draw();

    if (canvasHasFocus()) {
      // disable drag-and-drop only if the canvas is already focused
      return false;
    } else {
      // otherwise, let the browser switch the focus away from wherever it was
      resetCaret();
      return true;
    }
  };

  canvas.ondblclick = function (e) {
    var mouse = crossBrowserRelativeMousePos(e);
    selectedObject = selectObject(mouse.x, mouse.y);

    if (selectedObject == null) {
      selectedObject = new Node(mouse.x, mouse.y);
      nodes.push(selectedObject);
      resetCaret();
      draw();
    } else if (selectedObject instanceof Node) {
      if (selectedObject.isAcceptState) {
        selectedObject.isAcceptState = false;
        // Eliminar el nodo del seguimiento de los dos últimos estados de aceptación
        lastTwoAcceptStates = lastTwoAcceptStates.filter(
          (node) => node !== selectedObject,
        );
      } else {
        // Si intentamos agregar un tercer estado de aceptación, revertir el estado del último nodo
        if (lastTwoAcceptStates.length === 2) {
          lastTwoAcceptStates[1].isAcceptState = false;
          lastTwoAcceptStates.pop();
        }
        selectedObject.isAcceptState = true;
        lastTwoAcceptStates.push(selectedObject);
      }
      draw();
    }
  };

  canvas.onmousemove = function (e) {
    var mouse = crossBrowserRelativeMousePos(e);

    if (currentLink != null) {
      var targetNode = selectObject(mouse.x, mouse.y);
      if (!(targetNode instanceof Node)) {
        targetNode = null;
      }

      if (selectedObject == null) {
        if (targetNode != null) {
          currentLink = new StartLink(targetNode, originalClick);
        } else {
          currentLink = new TemporaryLink(originalClick, mouse);
        }
      } else {
        if (targetNode == selectedObject) {
          currentLink = new SelfLink(selectedObject, mouse);
        } else if (targetNode != null) {
          currentLink = new Link(selectedObject, targetNode);
        } else {
          currentLink = new TemporaryLink(
            selectedObject.closestPointOnCircle(mouse.x, mouse.y),
            mouse,
          );
        }
      }
      draw();
    }

    if (movingObject) {
      selectedObject.setAnchorPoint(mouse.x, mouse.y);
      if (selectedObject instanceof Node) {
        snapNode(selectedObject);
      }
      draw();
    }
  };

  canvas.onmouseup = function (e) {
    movingObject = false;

    if (currentLink != null) {
      if (!(currentLink instanceof TemporaryLink)) {
        selectedObject = currentLink;
        links.push(currentLink);
        resetCaret();
      }
      currentLink = null;
      draw();
    }
  };
};

var shift = false;

document.onkeydown = function (e) {
  var key = crossBrowserKey(e);

  if (key == 16) {
    shift = true;
  } else if (!canvasHasFocus()) {
    // don't read keystrokes when other things have focus
    return true;
  } else if (key == 8) {
    // backspace key
    if (selectedObject != null && "text" in selectedObject) {
      selectedObject.text = selectedObject.text.substr(
        0,
        selectedObject.text.length - 1,
      );
      resetCaret();
      draw();
    }

    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false;
  } else if (key == 46) {
    // delete key
    if (selectedObject != null) {
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i] == selectedObject) {
          nodes.splice(i--, 1);
        }
      }
      for (var i = 0; i < links.length; i++) {
        if (
          links[i] == selectedObject ||
          links[i].node == selectedObject ||
          links[i].nodeA == selectedObject ||
          links[i].nodeB == selectedObject
        ) {
          links.splice(i--, 1);
        }
      }
      selectedObject = null;
      draw();
    }
  }
};

document.onkeyup = function (e) {
  var key = crossBrowserKey(e);

  if (key == 16) {
    shift = false;
  }
};

document.onkeypress = function (e) {
  // don't read keystrokes when other things have focus
  var key = crossBrowserKey(e);
  if (!canvasHasFocus()) {
    // don't read keystrokes when other things have focus
    return true;
  } else if (
    key >= 0x20 &&
    key <= 0x7e &&
    !e.metaKey &&
    !e.altKey &&
    !e.ctrlKey &&
    selectedObject != null &&
    "text" in selectedObject
  ) {
    selectedObject.text += String.fromCharCode(key);
    resetCaret();
    draw();

    // don't let keys do their actions (like space scrolls down the page)
    return false;
  } else if (key == 8) {
    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false;
  }
};

function crossBrowserKey(e) {
  e = e || window.event;
  return e.which || e.keyCode;
}

function crossBrowserElementPos(e) {
  e = e || window.event;
  var obj = e.target || e.srcElement;
  var x = 0,
    y = 0;
  while (obj.offsetParent) {
    x += obj.offsetLeft;
    y += obj.offsetTop;
    obj = obj.offsetParent;
  }
  return { x: x, y: y };
}

function crossBrowserMousePos(e) {
  e = e || window.event;
  return {
    x:
      e.pageX ||
      e.clientX +
        document.body.scrollLeft +
        document.documentElement.scrollLeft,
    y:
      e.pageY ||
      e.clientY + document.body.scrollTop + document.documentElement.scrollTop,
  };
}

function crossBrowserRelativeMousePos(e) {
  var element = crossBrowserElementPos(e);
  var mouse = crossBrowserMousePos(e);
  return {
    x: mouse.x - element.x,
    y: mouse.y - element.y,
  };
}

function output(text) {
  var element = document.getElementById("output");
  element.style.display = "block";
  element.value = text;
}

function saveAsPNG() {
  var oldSelectedObject = selectedObject;
  selectedObject = null;
  drawUsing(canvas.getContext("2d"));
  selectedObject = oldSelectedObject;
  var pngData = canvas.toDataURL("image/png");
  document.location.href = pngData;
}

function saveAsSVG() {
  var exporter = new ExportAsSVG();
  var oldSelectedObject = selectedObject;
  selectedObject = null;
  drawUsing(exporter);
  selectedObject = oldSelectedObject;
  var svgData = exporter.toSVG();
  output(svgData);
  // Chrome isn't ready for this yet, the 'Save As' menu item is disabled
  // document.location.href = 'data:image/svg+xml;base64,' + btoa(svgData);
}

function saveAsLaTeX() {
  var exporter = new ExportAsLaTeX();
  var oldSelectedObject = selectedObject;
  selectedObject = null;
  drawUsing(exporter);
  selectedObject = oldSelectedObject;
  var texData = exporter.toLaTeX();
  output(texData);
}

function restoreBackup() {
  if (!localStorage || !JSON) {
    return;
  }

  try {
    var backup = JSON.parse(localStorage["fsm"]);

    for (var i = 0; i < backup.nodes.length; i++) {
      var backupNode = backup.nodes[i];
      var node = new Node(backupNode.x, backupNode.y);
      node.isAcceptState = backupNode.isAcceptState;
      node.text = backupNode.text;
      nodes.push(node);

      if (node.isAcceptState) {
        if (lastTwoAcceptStates.length === 2) {
          // Si ya tenemos dos estados de aceptación, eliminamos el más antiguo
          lastTwoAcceptStates.shift();
        }
        lastTwoAcceptStates.push(node);
      }
    }
    for (var i = 0; i < backup.links.length; i++) {
      var backupLink = backup.links[i];
      var link = null;
      if (backupLink.type == "SelfLink") {
        link = new SelfLink(nodes[backupLink.node]);
        link.anchorAngle = backupLink.anchorAngle;
        link.text = backupLink.text;
      } else if (backupLink.type == "StartLink") {
        link = new StartLink(nodes[backupLink.node]);
        link.deltaX = backupLink.deltaX;
        link.deltaY = backupLink.deltaY;
        link.text = backupLink.text;
      } else if (backupLink.type == "Link") {
        link = new Link(nodes[backupLink.nodeA], nodes[backupLink.nodeB]);
        link.parallelPart = backupLink.parallelPart;
        link.perpendicularPart = backupLink.perpendicularPart;
        link.text = backupLink.text;
        link.lineAngleAdjust = backupLink.lineAngleAdjust;
      }
      if (link != null) {
        links.push(link);
      }
    }
  } catch (e) {
    localStorage["fsm"] = "";
  }
}

function saveBackup() {
  if (!localStorage || !JSON) {
    return;
  }

  var backup = {
    nodes: [],
    links: [],
  };
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var backupNode = {
      x: node.x,
      y: node.y,
      text: node.text,
      isAcceptState: node.isAcceptState,
    };
    backup.nodes.push(backupNode);
  }
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var backupLink = null;
    if (link instanceof SelfLink) {
      backupLink = {
        type: "SelfLink",
        node: nodes.indexOf(link.node),
        text: link.text,
        anchorAngle: link.anchorAngle,
      };
    } else if (link instanceof StartLink) {
      backupLink = {
        type: "StartLink",
        node: nodes.indexOf(link.node),
        text: link.text,
        deltaX: link.deltaX,
        deltaY: link.deltaY,
      };
    } else if (link instanceof Link) {
      backupLink = {
        type: "Link",
        nodeA: nodes.indexOf(link.nodeA),
        nodeB: nodes.indexOf(link.nodeB),
        text: link.text,
        lineAngleAdjust: link.lineAngleAdjust,
        parallelPart: link.parallelPart,
        perpendicularPart: link.perpendicularPart,
      };
    }
    if (backupLink != null) {
      backup.links.push(backupLink);
    }
  }

  localStorage["fsm"] = JSON.stringify(backup);
}

function det(a, b, c, d, e, f, g, h, i) {
  return a * e * i + b * f * g + c * d * h - a * f * h - b * d * i - c * e * g;
}

function circleFromThreePoints(x1, y1, x2, y2, x3, y3) {
  var a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
  var bx = -det(
    x1 * x1 + y1 * y1,
    y1,
    1,
    x2 * x2 + y2 * y2,
    y2,
    1,
    x3 * x3 + y3 * y3,
    y3,
    1,
  );
  var by = det(
    x1 * x1 + y1 * y1,
    x1,
    1,
    x2 * x2 + y2 * y2,
    x2,
    1,
    x3 * x3 + y3 * y3,
    x3,
    1,
  );
  var c = -det(
    x1 * x1 + y1 * y1,
    x1,
    y1,
    x2 * x2 + y2 * y2,
    x2,
    y2,
    x3 * x3 + y3 * y3,
    x3,
    y3,
  );
  return {
    x: -bx / (2 * a),
    y: -by / (2 * a),
    radius: Math.sqrt(bx * bx + by * by - 4 * a * c) / (2 * Math.abs(a)),
  };
}

function fixed(number, digits) {
  return number.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
}

class Node {
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
    if (this.isAcceptState) {
      c.beginPath();
      c.arc(this.x, this.y, nodeRadius - 6, 0, 2 * Math.PI, false);
      c.stroke();
    }
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

function Link(a, b) {
  this.nodeA = a;
  this.nodeB = b;
  this.text = "";
  this.lineAngleAdjust = 0; // value to add to textAngle when link is straight line

  // make anchor point relative to the locations of nodeA and nodeB
  this.parallelPart = 0.5; // percentage from nodeA to nodeB
  this.perpendicularPart = 0; // pixels from line between nodeA and nodeB
}

Link.prototype.getAnchorPoint = function () {
  var dx = this.nodeB.x - this.nodeA.x;
  var dy = this.nodeB.y - this.nodeA.y;
  var scale = Math.sqrt(dx * dx + dy * dy);
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
};

Link.prototype.setAnchorPoint = function (x, y) {
  var dx = this.nodeB.x - this.nodeA.x;
  var dy = this.nodeB.y - this.nodeA.y;
  var scale = Math.sqrt(dx * dx + dy * dy);
  this.parallelPart =
    (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
  this.perpendicularPart =
    (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
  // snap to a straight line
  if (
    this.parallelPart > 0 &&
    this.parallelPart < 1 &&
    Math.abs(this.perpendicularPart) < snapToPadding
  ) {
    this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
    this.perpendicularPart = 0;
  }
};

Link.prototype.getEndPointsAndCircle = function () {
  if (this.perpendicularPart == 0) {
    var midX = (this.nodeA.x + this.nodeB.x) / 2;
    var midY = (this.nodeA.y + this.nodeB.y) / 2;
    var start = this.nodeA.closestPointOnCircle(midX, midY);
    var end = this.nodeB.closestPointOnCircle(midX, midY);
    return {
      hasCircle: false,
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
    };
  }
  var anchor = this.getAnchorPoint();
  var circle = circleFromThreePoints(
    this.nodeA.x,
    this.nodeA.y,
    this.nodeB.x,
    this.nodeB.y,
    anchor.x,
    anchor.y,
  );
  var isReversed = this.perpendicularPart > 0;
  var reverseScale = isReversed ? 1 : -1;
  var startAngle =
    Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) -
    (reverseScale * nodeRadius) / circle.radius;
  var endAngle =
    Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) +
    (reverseScale * nodeRadius) / circle.radius;
  var startX = circle.x + circle.radius * Math.cos(startAngle);
  var startY = circle.y + circle.radius * Math.sin(startAngle);
  var endX = circle.x + circle.radius * Math.cos(endAngle);
  var endY = circle.y + circle.radius * Math.sin(endAngle);
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
};

Link.prototype.draw = function (c) {
  var stuff = this.getEndPointsAndCircle();
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
  if (stuff.hasCircle) {
    // drawArrow(
    //   c,
    //   stuff.endX,
    //   stuff.endY,
    //   stuff.endAngle - stuff.reverseScale * (Math.PI / 2),
    // );
  } else {
    // drawArrow(
    //   c,
    //   stuff.endX,
    //   stuff.endY,
    //   Math.atan2(stuff.endY - stuff.startY, stuff.endX - stuff.startX),
    // );
  }
  // draw the text
  if (stuff.hasCircle) {
    var startAngle = stuff.startAngle;
    var endAngle = stuff.endAngle;
    if (endAngle < startAngle) {
      endAngle += Math.PI * 2;
    }
    var textAngle = (startAngle + endAngle) / 2 + stuff.isReversed * Math.PI;
    var textX = stuff.circleX + stuff.circleRadius * Math.cos(textAngle);
    var textY = stuff.circleY + stuff.circleRadius * Math.sin(textAngle);
    drawText(c, this.text, textX, textY, textAngle, selectedObject == this);
  } else {
    var textX = (stuff.startX + stuff.endX) / 2;
    var textY = (stuff.startY + stuff.endY) / 2;
    var textAngle = Math.atan2(
      stuff.endX - stuff.startX,
      stuff.startY - stuff.endY,
    );
    drawText(
      c,
      this.text,
      textX,
      textY,
      textAngle + this.lineAngleAdjust,
      selectedObject == this,
    );
  }
};

Link.prototype.containsPoint = function (x, y) {
  var stuff = this.getEndPointsAndCircle();
  if (stuff.hasCircle) {
    var dx = x - stuff.circleX;
    var dy = y - stuff.circleY;
    var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
    if (Math.abs(distance) < hitTargetPadding) {
      var angle = Math.atan2(dy, dx);
      var startAngle = stuff.startAngle;
      var endAngle = stuff.endAngle;
      if (stuff.isReversed) {
        var temp = startAngle;
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
    var dx = stuff.endX - stuff.startX;
    var dy = stuff.endY - stuff.startY;
    var length = Math.sqrt(dx * dx + dy * dy);
    var percent =
      (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
    var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
    return percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding;
  }
  return false;
};

function SelfLink(node, mouse) {
  this.node = node;
  this.anchorAngle = 0;
  this.mouseOffsetAngle = 0;
  this.text = "";

  if (mouse) {
    this.setAnchorPoint(mouse.x, mouse.y);
  }
}

SelfLink.prototype.setMouseStart = function (x, y) {
  this.mouseOffsetAngle =
    this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
};

SelfLink.prototype.setAnchorPoint = function (x, y) {
  this.anchorAngle =
    Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle;
  // snap to 90 degrees
  var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
  if (Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap;
  // keep in the range -pi to pi so our containsPoint() function always works
  if (this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
  if (this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
};

SelfLink.prototype.getEndPointsAndCircle = function () {
  var circleX = this.node.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
  var circleY = this.node.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
  var circleRadius = 0.75 * nodeRadius;
  var startAngle = this.anchorAngle - Math.PI * 0.8;
  var endAngle = this.anchorAngle + Math.PI * 0.8;
  var startX = circleX + circleRadius * Math.cos(startAngle);
  var startY = circleY + circleRadius * Math.sin(startAngle);
  var endX = circleX + circleRadius * Math.cos(endAngle);
  var endY = circleY + circleRadius * Math.sin(endAngle);
  return {
    hasCircle: true,
    startX: startX,
    startY: startY,
    endX: endX,
    endY: endY,
    startAngle: startAngle,
    endAngle: endAngle,
    circleX: circleX,
    circleY: circleY,
    circleRadius: circleRadius,
  };
};

SelfLink.prototype.draw = function (c) {
  var stuff = this.getEndPointsAndCircle();
  // draw arc
  c.beginPath();
  c.arc(
    stuff.circleX,
    stuff.circleY,
    stuff.circleRadius,
    stuff.startAngle,
    stuff.endAngle,
    false,
  );
  c.stroke();
  // draw the text on the loop farthest from the node
  var textX = stuff.circleX + stuff.circleRadius * Math.cos(this.anchorAngle);
  var textY = stuff.circleY + stuff.circleRadius * Math.sin(this.anchorAngle);
  drawText(
    c,
    this.text,
    textX,
    textY,
    this.anchorAngle,
    selectedObject == this,
  );
  // draw the head of the arrow
  drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle + Math.PI * 0.4);
};

SelfLink.prototype.containsPoint = function (x, y) {
  var stuff = this.getEndPointsAndCircle();
  var dx = x - stuff.circleX;
  var dy = y - stuff.circleY;
  var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
  return Math.abs(distance) < hitTargetPadding;
};

function StartLink(node, start) {
  this.node = node;
  this.deltaX = 0;
  this.deltaY = 0;
  this.text = "";

  if (start) {
    this.setAnchorPoint(start.x, start.y);
  }
}

StartLink.prototype.setAnchorPoint = function (x, y) {
  this.deltaX = x - this.node.x;
  this.deltaY = y - this.node.y;

  if (Math.abs(this.deltaX) < snapToPadding) {
    this.deltaX = 0;
  }

  if (Math.abs(this.deltaY) < snapToPadding) {
    this.deltaY = 0;
  }
};

StartLink.prototype.getEndPoints = function () {
  var startX = this.node.x + this.deltaX;
  var startY = this.node.y + this.deltaY;
  var end = this.node.closestPointOnCircle(startX, startY);
  return {
    startX: startX,
    startY: startY,
    endX: end.x,
    endY: end.y,
  };
};

StartLink.prototype.draw = function (c) {
  var stuff = this.getEndPoints();

  // draw the line
  c.beginPath();
  c.moveTo(stuff.startX, stuff.startY);
  c.lineTo(stuff.endX, stuff.endY);
  c.stroke();

  // draw the text at the end without the arrow
  var textAngle = Math.atan2(
    stuff.startY - stuff.endY,
    stuff.startX - stuff.endX,
  );
  drawText(
    c,
    this.text,
    stuff.startX,
    stuff.startY,
    textAngle,
    selectedObject == this,
  );

  // draw the head of the arrow
  drawArrow(c, stuff.endX, stuff.endY, Math.atan2(-this.deltaY, -this.deltaX));
};

StartLink.prototype.containsPoint = function (x, y) {
  var stuff = this.getEndPoints();
  var dx = stuff.endX - stuff.startX;
  var dy = stuff.endY - stuff.startY;
  var length = Math.sqrt(dx * dx + dy * dy);
  var percent =
    (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
  var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
  return percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding;
};

function TemporaryLink(from, to) {
  this.from = from;
  this.to = to;
}

TemporaryLink.prototype.draw = function (c) {
  // draw the line
  c.beginPath();
  c.moveTo(this.to.x, this.to.y);
  c.lineTo(this.from.x, this.from.y);
  c.stroke();

  // draw the head of the arrow
  drawArrow(
    c,
    this.to.x,
    this.to.y,
    Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x),
  );
};

// TODO: NEW

class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(vertex, priority) {
    this.queue.push({ vertex, priority });
    this.sort();
  }

  dequeue() {
    return this.queue.shift();
  }

  sort() {
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

class Graph {
  constructor() {
    this.edges = {};
    this.visited = {};
  }

  addEdge(src, dest, weight) {
    if (!this.edges[src]) this.edges[src] = {};
    if (!this.edges[dest]) this.edges[dest] = {};

    this.edges[src][dest] = weight;
    this.edges[dest][src] = weight; // Grafo no dirigido
  }

  findStartNode() {
    for (const node in this.edges) {
      if (Object.keys(this.edges[node]).length > 0) {
        return node;
      }
    }
    return null;
  }

  primsMST(startNode = null) {
    if (!startNode) {
      startNode = this.findStartNode();
      if (!startNode) {
        return []; // No hay aristas en el grafo
      }
    }

    // Inicializar el estado del grafo
    for (const node in this.edges) {
      this.visited[node] = false;
    }

    this.visited[startNode] = true;
    let pq = new PriorityQueue();
    let result = [];

    // Inicializar la cola de prioridad con las aristas del nodo de inicio
    for (const neighbor in this.edges[startNode]) {
      pq.enqueue(
        { src: startNode, dest: neighbor },
        this.edges[startNode][neighbor],
      );
    }

    // Procesar la cola de prioridad
    while (!pq.isEmpty()) {
      let {
        vertex: { src, dest },
        priority: weight,
      } = pq.dequeue();
      if (!this.visited[dest]) {
        this.visited[dest] = true;
        result.push({ src, dest, weight });

        for (const neighbor in this.edges[dest]) {
          if (!this.visited[neighbor]) {
            pq.enqueue(
              { src: dest, dest: neighbor },
              this.edges[dest][neighbor],
            );
          }
        }
      }
    }

    return result;
  }
}

// Kruskal Implementation

class UnionFind {
  constructor(elements) {
    this.parent = {};

    elements.forEach((e) => (this.parent[e] = e));
  }

  union(a, b) {
    this.parent[this.find(a)] = this.find(b);
  }

  find(a) {
    while (this.parent[a] !== a) {
      a = this.parent[a];
    }

    return a;
  }

  connected(a, b) {
    return this.find(a) === this.find(b);
  }
}

function kruskal(graph) {
  graph.sort((a, b) => a.weight - b.weight);

  const nodes = new Set(graph.map((e) => [e.src, e.dest]).flat());
  const unionFind = new UnionFind(nodes);

  const mst = [];

  for (let edge of graph) {
    if (!unionFind.connected(edge.src, edge.dest)) {
      unionFind.union(edge.src, edge.dest);
      mst.push(edge);
    }
  }

  return mst;
}

// Dijkstra

function dijkstraAlgorithm(graph) {
  const costs = Object.assign({ end: Infinity }, graph.start);
  const parents = { end: null };
  const processed = [];

  let node = findLowestCostNode(costs, processed);

  while (node) {
    let cost = costs[node];
    let children = graph[node];
    for (let n in children) {
      let newCost = cost + children[n];
      if (!costs[n] || costs[n] > newCost) {
        costs[n] = newCost;
        parents[n] = node;
      }
    }
    processed.push(node);
    node = findLowestCostNode(costs, processed);
  }

  let optimalPath = ["end"];
  let parent = parents.end;
  while (parent) {
    optimalPath.push(parent);
    parent = parents[parent];
  }
  optimalPath.reverse();
  return { distance: costs.end, path: optimalPath };
}

function findLowestCostNode(costs, processed) {
  return Object.keys(costs).reduce((lowest, node) => {
    if (lowest === null || costs[node] < costs[lowest]) {
      if (!processed.includes(node)) {
        lowest = node;
      }
    }
    return lowest;
  }, null);
}

function onReset() {
  const alert = confirm("¿Estás seguro de que deseas reiniciar el grafo?");
  if (alert) {
    nodes = [];
    links = [];
    document.querySelector("#solutions-div").innerHTML = "";
    draw();
  }
}

let mstPrimSolution = [];
let mstKruskalSolution = [];
let dijkstraSolution = [];

function resolveByPrim() {
  // First, adapt the Edges for the solution
  const edges = links.map((link) => {
    return {
      src: link.nodeA.text,
      dest: link.nodeB.text,
      weight: parseFloat(link.text),
    };
  });

  // Then, add the edges to the graph
  const g = new Graph(nodes.length);
  edges.map((edge) => {
    const { src, dest, weight } = edge;
    g.addEdge(src, dest, weight);
  });

  // Finally, resolve the MST
  mstPrimSolution = g.primsMST();
}
function resolveByKruskal() {
  const edges = links.map((link) => {
    return {
      src: link.nodeA.text,
      dest: link.nodeB.text,
      weight: parseFloat(link.text),
    };
  });

  mstKruskalSolution = kruskal(edges);
}

let graph = {};

function resolveByDijkstra() {
  //   First, adapt the input
  //   Like this:
  //   const graph = {
  //     start: {A: 5, B: 2},
  //     A: {C: 4, D: 2},
  //     B: {A: 8, D: 7},
  //     C: {D: 6, end: 3},
  //     D: {end: 1},
  //     end: {}
  //   };
  //   Start = accept state
  //   End = last node with accept state

  graph = {
    start: {},
    end: {},
  };

  if (lastTwoAcceptStates.length === 2) {
    let startNode = lastTwoAcceptStates[0];
    // Debo encontrar las relaciones del nodo start
    links.map((link) => {
      if (link.nodeA.text === startNode.text) {
        graph.start[link.nodeB.text] = parseFloat(link.text);
      }
    });

    nodes.map((node) => {
      if (
        node.text !== startNode.text &&
        node.text !== lastTwoAcceptStates[1].text
      ) {
        graph[node.text] = {};
        links.map((link) => {
          if (link.nodeA.text === node.text) {
            if (link.nodeB.text !== lastTwoAcceptStates[1].text) {
              graph[node.text][link.nodeB.text] = parseFloat(link.text);
            } else {
              graph[node.text]["end"] = parseFloat(link.text);
            }
          }
        });
      }
    });
  }
  dijkstraSolution = dijkstraAlgorithm(graph);
}

const resetButton = document.querySelector("#reset-btn");
resetButton.addEventListener("click", onReset);

let resolveBy = [];

const primOption = document.querySelector("#Prim-option input");
const kruskalOption = document.querySelector("#Kruskal-option input");
const dijkstraOption = document.querySelector("#Dijkstra-option input");

primOption.addEventListener("click", (e) => {
  const isChecked = e.target.checked;
  if (isChecked) {
    return resolveBy.push("Prim");
  }

  resolveBy = resolveBy.filter((resolve) => resolve !== "Prim");
});

kruskalOption.addEventListener("click", (e) => {
  const isChecked = e.target.checked;
  if (isChecked) {
    return resolveBy.push("Kruskal");
  }

  resolveBy = resolveBy.filter((resolve) => resolve !== "Kruskal");
});

dijkstraOption.addEventListener("click", (e) => {
  const isChecked = e.target.checked;
  if (isChecked) {
    return resolveBy.push("Dijkstra");
  }

  resolveBy = resolveBy.filter((resolve) => resolve !== "Dijkstra");
});

const resolveButton = document.querySelector("#resolve");
const solutionsDiv = document.querySelector("#solutions-div");

resolveButton.addEventListener("click", () => {
  const existentPrimSolution = document.querySelector("#prim-solution");
  const existentKruskalSolution = document.querySelector("#kruskal-solution");
  const existentDijkstraSolution = document.querySelector("#dijkstra-solution");

  if (resolveBy.length === 0) {
    if (existentPrimSolution) {
      existentPrimSolution.remove();
    }

    if (existentKruskalSolution) {
        existentKruskalSolution.remove();
    }

    if (existentDijkstraSolution) {
        existentDijkstraSolution.remove()
    }

    return
  }


  if (!resolveBy.includes("Prim") && existentPrimSolution) {
    existentPrimSolution.remove();
  }

  if (!resolveBy.includes("Kruskal") && existentKruskalSolution) {
    existentKruskalSolution.remove();
  }

  if (!resolveBy.includes("Dijkstra") && existentDijkstraSolution) {
    existentDijkstraSolution.remove();
  }

  if (resolveBy.includes("Prim")) {
    resolveByPrim();
    solutionsDiv.innerHTML = "";
    const div = document.createElement("div");
    const header = document.createElement("h2");
    header.className = "font-bold";
    header.style.fontSize = "3rem";
    header.textContent = "Solución por el algoritmo de Prim";
    div.append(header);
    div.className = "flex flex-col gap-2";
    div.id = "prim-solution";
    solutionsDiv.append(div);
    const newCanvas = document.createElement("canvas");
    newCanvas.classList.add("bg-[#0b0b0f]");
    newCanvas.classList.add("rounded-xl");
    newCanvas.setAttribute("width", "1100");
    newCanvas.setAttribute("height", "600");
    newCanvas.id = "prim-canvas";
    div.append(newCanvas);
    const newNodes = [];
    const newLinks = [];
    mstPrimSolution.map((node) => {
      const { src, dest, weight } = node;
      const oldNodePosition = nodes.find((node) => node.text === src);
      const oldNodeDestPosition = nodes.find((node) => node.text === dest);
      const nodeA = new Node(oldNodePosition.x, oldNodePosition.y);
      nodeA.text = src;
      const nodeB = new Node(oldNodeDestPosition.x, oldNodeDestPosition.y);
      nodeB.text = dest;
      newNodes.push(nodeA);
      newNodes.push(nodeB);
      const link = new Link(nodeA, nodeB);
      link.text = weight.toString();
      newLinks.push(link);
    });
    drawPrimSolution(newCanvas.getContext("2d"), newNodes, newLinks);
  }
  if (resolveBy.includes("Kruskal")) {
    resolveByKruskal();
    if (existentKruskalSolution) {
      existentKruskalSolution.remove();
    }
    const div = document.createElement("div");
    const header = document.createElement("h2");
    header.className = "font-bold";
    header.style.fontSize = "3rem";
    header.textContent = "Solución por el algoritmo de Kruskal";
    div.append(header);
    div.id = "kruskal-solution";
    div.className = "flex flex-col gap-2";
    solutionsDiv.append(div);
    const newCanvas = document.createElement("canvas");
    newCanvas.classList.add("bg-[#0b0b0f]");
    newCanvas.classList.add("rounded-xl");
    newCanvas.setAttribute("width", "1100");
    newCanvas.setAttribute("height", "600");
    newCanvas.id = "kruskal-canvas";
    div.append(newCanvas);
    const newNodes = [];
    const newLinks = [];
    mstKruskalSolution.map((node) => {
      const { src, dest, weight } = node;
      const oldNodePosition = nodes.find((node) => node.text === src);
      const oldNodeDestPosition = nodes.find((node) => node.text === dest);
      const nodeA = new Node(oldNodePosition.x, oldNodePosition.y);
      nodeA.text = src;
      const nodeB = new Node(oldNodeDestPosition.x, oldNodeDestPosition.y);
      nodeB.text = dest;
      newNodes.push(nodeA);
      newNodes.push(nodeB);
      const link = new Link(nodeA, nodeB);
      link.text = weight.toString();
      newLinks.push(link);
    });

    drawPrimSolution(newCanvas.getContext("2d"), newNodes, newLinks);
  }
  if (resolveBy.includes("Dijkstra")) {
    resolveByDijkstra();
    if (existentDijkstraSolution) {
      existentDijkstraSolution.remove();
    }
    const div = document.createElement("div");
    const header = document.createElement("h2");
    header.className = "font-bold";
    header.style.fontSize = "3rem";
    header.textContent = "Solución por el algoritmo de Dijkstra";
    div.append(header);
    div.className = "flex flex-col gap-2";
    div.id = "dijkstra-solution";
    solutionsDiv.append(div);
    const newCanvas = document.createElement("canvas");
    newCanvas.classList.add("bg-[#0b0b0f]");
    newCanvas.classList.add("rounded-xl");
    newCanvas.setAttribute("width", "1100");
    newCanvas.setAttribute("height", "600");
    newCanvas.id = "prim-canvas";
    div.append(newCanvas);
    const newNodes = [];
    const newLinks = [];
    // dijkstraSolution me da algo asi:
    // path: ["2", "3", "end"]
    // La idea es adaptarlo para crear nodos y links en base a eso.
    // Se leeria algo asi: De lastTwoAcceptStates[0] (es el comienzo) a "2", luego a "3" y finalmente al "end" que es lastTwoAcceptStates[1]. La idea seria mapearlo algo asi:
    // {src: lastTwoAcceptStates[0], dest: "2", weight: 5}, {src: "2", dest: "3", weight: 4}, {src: "3", dest: "end", weight: 3}
    // Y luego crear los nodos y links en base a eso.

    // const startNodePosition = nodes.find(
    //   (node) => node.text === lastTwoAcceptStates[0].text,
    // );
    //
    // // Crea un nuevo nodo para el nodo inicial y añádelo a newNodes
    // const startNode = new Node(startNodePosition.x, startNodePosition.y);
    // startNode.text = lastTwoAcceptStates[0].text;
    // newNodes.push(startNode);

    dijkstraSolution.path.map((node, index) => {
      if (index === dijkstraSolution.path.length - 1) return;
      // if (index === 1) {
      //   let destNodeFromFirst = newNodes.find((node) => node.text === node);
      //   let nLink = new Link(newNodes[0], newNodes[1]);
      //   console.log(node, graph);
      //   nLink.text = graph["start"][node].toString();
      //   newLinks.push(nLink);
      // }

      const src = node;
      let dest = dijkstraSolution.path[index + 1];
      const weight = graph[src][dest];
      if (dest === "end") {
        dest = lastTwoAcceptStates[1].text;
      }
      const oldNodePosition = nodes.find((node) => node.text === src);
      const oldNodeDestPosition = nodes.find((node) => node.text === dest);
      const nodeA = new Node(oldNodePosition.x, oldNodePosition.y);
      nodeA.text = src;
      const nodeB = new Node(oldNodeDestPosition.x, oldNodeDestPosition.y);
      nodeB.text = dest;
      newNodes.push(nodeA);
      newNodes.push(nodeB);
      const link = new Link(nodeA, nodeB);
      link.text = weight.toString();
      newLinks.push(link);
    });

    drawPrimSolution(newCanvas.getContext("2d"), newNodes, newLinks);
  }

  // Scroll into view
  let offset = 45;
  let elementPosition = solutionsDiv.getBoundingClientRect().top;
  let offsetPosition = elementPosition + window.pageYOffset - offset;
  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  })

});
