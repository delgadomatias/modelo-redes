import {
  Link,
  Node,
  SelfLink,
  StartLink,
  TemporaryLink,
} from "./elements/index.js";
import { restoreBackup } from "./utils/index.js";

export class Main {
  acceptedNodes = [];
  canvas;
  caretTimer;
  caretVisible = true;
  currentLink = null;
  hitTargetPadding = 6;
  key;
  links = [];
  mouse;
  movingObject = false;
  nodeRadius = 26;
  nodes = [];
  originalClick;
  selectedObject = null;
  shift = false;
  snapToPadding = 6;
  targetNode;
  saveBackupFn;
  backupName = "";

  static instance;
  static getInstance() {
    if (!Main.instance) {
      Main.instance = new Main();
    }

    return Main.instance;
  }

  isLastAcceptedNode = (node) => {
    return this.acceptedNodes[this.acceptedNodes.length - 1] === node;
  };

  setSaveBackupFn = (fn) => {
    this.saveBackupFn = fn;
  };

  makeRestoreBackup(name) {
    this.backupName = name;
    restoreBackup(name);
  }

  addNode = (node) => {
    this.nodes.push(node);
  };

  addAcceptedNode = (node) => {
    this.acceptedNodes.push(node);
  };

  canvasHasFocus = () => {
    return (document.activeElement || document.body) === document.body;
  };

  drawUsing = (c) => {
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.save();
    c.translate(0.5, 0.5);

    for (let i = 0; i < this.nodes.length; i++) {
      c.lineWidth = 1.7;
      c.fillStyle = c.strokeStyle =
        this.nodes[i] === this.selectedObject ? "#ff5924" : "white";
      this.nodes[i].draw(c);
    }

    for (let i = 0; i < this.links.length; i++) {
      c.lineWidth = 1.7;

      c.fillStyle = c.strokeStyle =
        this.links[i] === this.selectedObject ? "#ff5924" : "white";
      this.links[i].draw(c);
    }

    if (this.currentLink != null) {
      c.lineWidth = 1.7;
      c.fillStyle = c.strokeStyle = "white";
      this.currentLink.draw(c);
    }

    c.restore();
  };

  draw = () => {
    if (!this.canvas) return;
    this.drawUsing(this.canvas.getContext("2d"));
    this.saveBackupFn(this.backupName);
  };

  drawText = (c, text, x, y, angleOrNull, isSelected) => {
    c.font = '20px "Inter", serif';
    const width = c.measureText(text).width;

    // Center the text
    x -= width / 2;

    // Position the text intelligently if given an angle
    if (angleOrNull != null) {
      let cos = Math.cos(angleOrNull);
      let sin = Math.sin(angleOrNull);
      let cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
      let cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
      let slide =
        sin * Math.pow(Math.abs(sin), 40) * cornerPointX -
        cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
      x += cornerPointX - sin * slide;
      y += cornerPointY + cos * slide;
    }

    // Draw text and caret (round the coordinates so the caret falls on a pixel)
    if ("advancedFillText" in c) {
      c.advancedFillText(text, text, x + width / 2, y, angleOrNull);
    } else {
      x = Math.round(x);
      y = Math.round(y);
      c.fillText(text, x, y + 6);

      if (
        isSelected &&
        this.caretVisible &&
        this.canvasHasFocus() &&
        document.hasFocus()
      ) {
        x += width;
        c.beginPath();
        c.moveTo(x, y - 10);
        c.lineTo(x, y + 10);
        c.stroke();
      }
    }
  };

  drawOnCanvas = (c, nodes, links) => {
    let i;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.save();
    c.translate(0.5, 0.5);

    for (i = 0; i < nodes.length; i++) {
      c.lineWidth = 1.7;
      c.fillStyle = c.strokeStyle =
        nodes[i] === this.selectedObject ? "#ff5924" : "white";
      nodes[i].draw(c);
    }

    for (i = 0; i < links.length; i++) {
      c.lineWidth = 1.7;
      c.fillStyle = c.strokeStyle =
        links[i] === this.selectedObject ? "#ff5924" : "white";
      links[i].draw(c);
    }

    if (this.currentLink != null) {
      c.lineWidth = 1.7;
      c.fillStyle = c.strokeStyle = "white";
      this.currentLink.draw(c);
    }

    c.restore();
  };

  drawSolution = (c, nodes, links) => {
    this.drawOnCanvas(c, nodes, links);
  };

  onReset = () => {
    const alert = confirm("¿Estás seguro de que deseas reiniciar el grafo?");
    if (alert) {
      this.nodes = [];
      this.links = [];
      this.acceptedNodes = [];
      if (document.querySelector("#solutions-div")) {
        document.querySelector("#solutions-div").innerHTML = "";
      }
      this.draw();
    }
  };

  resetCaret = () => {
    clearInterval(this.caretTimer);
    this.caretVisible = !this.caretVisible;
    this.caretTimer = setInterval(this.draw, 500);
    this.caretVisible = true;
  };

  selectObject = (x, y) => {
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].containsPoint(x, y)) {
        return this.nodes[i];
      }
    }

    for (let i = 0; i < this.links.length; i++) {
      if (this.links[i].containsPoint(x, y)) {
        return this.links[i];
      }
    }

    return null;
  };

  snapNode = (node) => {
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i] === node) continue;

      if (Math.abs(node.x - this.nodes[i].x) < this.snapToPadding) {
        node.x = this.nodes[i].x;
      }

      if (Math.abs(node.y - this.nodes[i].y) < this.snapToPadding) {
        node.y = this.nodes[i].y;
      }
    }
  };

  crossBrowserKey = (e) => {
    e = e || window.event;
    return e.which || e.keyCode;
  };

  crossBrowserElementPos = (e) => {
    e = e || window.event;
    let obj = e.target || e.srcElement;
    let x = 0,
      y = 0;
    while (obj.offsetParent) {
      x += obj.offsetLeft;
      y += obj.offsetTop;
      obj = obj.offsetParent;
    }
    return { x: x, y: y };
  };

  crossBrowserMousePos = (e) => {
    e = e || window.event;
    return {
      x:
        e.pageX ||
        e.clientX +
          document.body.scrollLeft +
          document.documentElement.scrollLeft,
      y:
        e.pageY ||
        e.clientY +
          document.body.scrollTop +
          document.documentElement.scrollTop,
    };
  };

  drawArrow = (c, x, y, angle) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
    c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
    c.fill();
  };

  crossBrowserRelativeMousePos = (e) => {
    const element = this.crossBrowserElementPos(e);
    const mouse = this.crossBrowserMousePos(e);
    return {
      x: mouse.x - element.x,
      y: mouse.y - element.y,
    };
  };

  startListeners = (canvas) => {
    if (!canvas) return;
    this.canvas = canvas;

    if (this.canvas) {
      this.canvas.width = canvas.offsetWidth;
      this.canvas.height = canvas.offsetHeight;
      this.startCanvasListeners();
    }

    this.draw();

    document.onkeydown = (e) => {
      this.key = this.crossBrowserKey(e);

      if (this.key === 16) {
        this.shift = true;
      } else if (!this.canvasHasFocus()) {
        // don't read keystrokes when other things have focus
        return true;
      } else if (this.key === 8) {
        // backspace key
        if (this.selectedObject != null && "text" in this.selectedObject) {
          this.selectedObject.text = this.selectedObject.text.substr(
            0,
            this.selectedObject.text.length - 1,
          );
          this.resetCaret();
          this.draw();
        }

        // backspace is a shortcut for the back button, but do NOT want to change pages
        return false;
      } else if (this.key === 46) {
        // delete key
        if (this.selectedObject != null) {
          for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i] === this.selectedObject) {
              this.nodes.splice(i--, 1);
            }
          }
          for (let i = 0; i < this.links.length; i++) {
            if (
              this.links[i] === this.selectedObject ||
              this.links[i].node === this.selectedObject ||
              this.links[i].nodeA === this.selectedObject ||
              this.links[i].nodeB === this.selectedObject
            ) {
              this.links.splice(i--, 1);
            }
          }
          this.selectedObject = null;
          this.draw();
        }
      }
    };
    document.onkeyup = (e) => {
      this.key = this.crossBrowserKey(e);

      if (this.key === 16) {
        this.shift = false;
      }
    };

    document.onkeypress = (e) => {
      // don't read keystrokes when other things have focus
      const allowSlash = window.location.pathname === "/flujo-maximo";
      this.key = this.crossBrowserKey(e);

      if (!this.canvasHasFocus()) {
        // don't read keystrokes when other things have focus
        return true;
      } else if (
        this.key >= 0x20 &&
        this.key <= 0x7e &&
        !e.metaKey &&
        !e.altKey &&
        !e.ctrlKey &&
        this.selectedObject != null &&
        "text" in this.selectedObject
      ) {
        // Allow only numbers and slash
        if (!(this.selectedObject instanceof Node)) {
          if ((this.key < 48 || this.key > 57) && this.key !== 47) {
            return false;
          }
        }

        if (this.key === 47 && !allowSlash) {
          // disallow slashes unless in the max flow page
          return false;
        }

        // Count the number of slash (allow only one per link)
        if (this.key === 47) {
          let slashCount = 0;
          for (let i = 0; i < this.selectedObject.text.length; i++) {
            if (this.selectedObject.text[i] === "/") {
              slashCount++;
            }
          }

          if (slashCount >= 1) {
            return false;
          }
        }

        this.selectedObject.text += String.fromCharCode(this.key);
        this.resetCaret();
        this.draw();

        // don't let keys do their actions (like space scrolls down the page)
        return false;
      } else if (this.key === 8) {
        // backspace is a shortcut for the back button, but do NOT want to change pages
        return false;
      }
    };
  };

  startCanvasListeners = () => {
    this.canvas.onmousedown = (e) => {
      this.mouse = this.crossBrowserRelativeMousePos(e);
      this.selectedObject = this.selectObject(this.mouse.x, this.mouse.y);
      this.movingObject = false;
      this.originalClick = this.mouse;

      if (this.selectedObject != null) {
        if (this.shift && this.selectedObject instanceof Node) {
          this.currentLink = new SelfLink(this.selectedObject, this.mouse);
        } else {
          this.movingObject = true;
          if (this.selectedObject.setMouseStart) {
            this.selectedObject.setMouseStart(this.mouse.x, this.mouse.y);
          }
        }
        this.resetCaret();
      } else if (this.shift) {
        this.currentLink = new TemporaryLink(this.mouse, this.mouse);
      }

      this.draw();

      if (this.canvasHasFocus()) {
        // disable drag-and-drop only if the canvas is already focused
        return false;
      } else {
        // otherwise, let the browser switch the focus away from wherever it was
        this.resetCaret();
        return true;
      }
    };

    this.canvas.ondblclick = (e) => {
      this.mouse = this.crossBrowserRelativeMousePos(e);
      this.selectedObject = this.selectObject(this.mouse.x, this.mouse.y);

      if (this.selectedObject == null) {
        this.selectedObject = new Node(this.mouse.x, this.mouse.y);
        this.nodes.push(this.selectedObject);
        this.resetCaret();
        this.draw();
      } else if (this.selectedObject instanceof Node) {
        if (!this.selectedObject.isAcceptState) {
          if (this.acceptedNodes.length === 2) {
            // Cambia el estado del último nodo aceptado a falso
            let lastAcceptedNode = this.acceptedNodes[1];
            lastAcceptedNode.isAcceptState = false;

            // Elimina el último nodo de la lista de nodos aceptados
            this.acceptedNodes = this.acceptedNodes.slice(0, 1);
          }

          // Agrega el nodo seleccionado a la lista de nodos aceptados
          this.acceptedNodes.push(this.selectedObject);
          this.selectedObject.isAcceptState = true;
        } else {
          // Si el nodo seleccionado ya es un nodo aceptado, cambia su estado a falso
          this.selectedObject.isAcceptState = false;

          // Elimina el nodo seleccionado de la lista de nodos aceptados
          this.acceptedNodes = this.acceptedNodes.filter(
            (node) => node !== this.selectedObject,
          );
        }

        this.draw();
      }
    };

    this.canvas.onmousemove = (e) => {
      this.mouse = this.crossBrowserRelativeMousePos(e);

      if (this.currentLink != null) {
        this.targetNode = this.selectObject(this.mouse.x, this.mouse.y);
        if (!(this.targetNode instanceof Node)) {
          this.targetNode = null;
        }

        if (this.selectedObject == null) {
          if (this.targetNode != null) {
            this.currentLink = new StartLink(
              this.targetNode,
              this.originalClick,
            );
          } else {
            this.currentLink = new TemporaryLink(
              this.originalClick,
              this.mouse,
            );
          }
        } else {
          if (this.targetNode === this.selectedObject) {
            this.currentLink = new SelfLink(this.selectedObject, this.mouse);
          } else if (this.targetNode != null) {
            this.currentLink = new Link(this.selectedObject, this.targetNode);
          } else {
            this.currentLink = new TemporaryLink(
              this.selectedObject.closestPointOnCircle(
                this.mouse.x,
                this.mouse.y,
              ),
              this.mouse,
            );
          }
        }
        this.draw();
      }

      if (this.movingObject) {
        this.selectedObject.setAnchorPoint(this.mouse.x, this.mouse.y);
        if (this.selectedObject instanceof Node) {
          this.snapNode(this.selectedObject);
        }
        this.draw();
      }
    };

    this.canvas.onmouseup = () => {
      this.movingObject = false;

      if (this.currentLink != null) {
        if (!(this.currentLink instanceof TemporaryLink)) {
          this.selectedObject = this.currentLink;
          this.links.push(this.currentLink);
          this.resetCaret();
        }
        this.currentLink = null;
        this.draw();
      }
    };
  };
}
