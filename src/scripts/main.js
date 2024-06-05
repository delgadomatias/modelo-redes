import { restoreBackup, saveBackup } from "./utils/index.js";
import {
  Link,
  Node,
  SelfLink,
  StartLink,
  TemporaryLink,
} from "./elements/index.js";
import { executeResolver } from "./resolver.js";

export let canvas;
export let caretTimer;
export let caretVisible = true;
export let currentLink = null;
export let hitTargetPadding = 6;
export let links = [];
export let movingObject = false;
export let nodeRadius = 30;
export let nodes = [];
export let originalClick;
export let selectedObject = null;
export let shift = false;
export let snapToPadding = 6;
let key;
let mouse;
let targetNode;
export let acceptedNodes = [];

document.addEventListener("astro:page-load", () => {
  if (window.location.pathname !== "/") return;

  executeResolver();
  document.onkeydown = () => {};
  document.onkeyup = () => {};
  document.onkeypress = null;

  canvas = document.querySelector("#canvas");

  shift = false;

  document.onkeydown = function (e) {
    key = crossBrowserKey(e);

    if (key === 16) {
      shift = true;
    } else if (!canvasHasFocus()) {
      // don't read keystrokes when other things have focus
      return true;
    } else if (key === 8) {
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
    } else if (key === 46) {
      // delete key
      if (selectedObject != null) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i] == selectedObject) {
            nodes.splice(i--, 1);
          }
        }
        for (let i = 0; i < links.length; i++) {
          if (
            links[i] === selectedObject ||
            links[i].node === selectedObject ||
            links[i].nodeA === selectedObject ||
            links[i].nodeB === selectedObject
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
    key = crossBrowserKey(e);

    if (key === 16) {
      shift = false;
    }
  };

  document.onkeypress = function (e) {
    // don't read keystrokes when other things have focus
    key = crossBrowserKey(e);
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
    } else if (key === 8) {
      // backspace is a shortcut for the back button, but do NOT want to change pages
      return false;
    }
  };

  if (!canvas) return;

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  canvas.onmousedown = () => {};
  canvas.ondblclick = () => {};
  canvas.onmousemove = () => {};
  canvas.onmouseup = () => {};
  canvas.ondblclick = () => {};

  canvas.onmousedown = function (e) {
    mouse = crossBrowserRelativeMousePos(e);
    selectedObject = selectObject(mouse.x, mouse.y);
    movingObject = false;
    originalClick = mouse;

    if (selectedObject != null) {
      if (shift && selectedObject instanceof Node) {
        currentLink = new SelfLink(selectedObject, mouse);
      } else {
        movingObject = true;
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
    mouse = crossBrowserRelativeMousePos(e);
    selectedObject = selectObject(mouse.x, mouse.y);

    if (selectedObject == null) {
      selectedObject = new Node(mouse.x, mouse.y);
      nodes.push(selectedObject);
      resetCaret();
      draw();
    } else if (selectedObject instanceof Node) {
      if (!selectedObject.isAcceptState) {
        console.log(acceptedNodes);
        if (acceptedNodes.length === 2) {
          // Cambia el estado del último nodo aceptado a falso
          let lastAcceptedNode = acceptedNodes[1];
          lastAcceptedNode.isAcceptState = false;

          // Elimina el último nodo de la lista de nodos aceptados
          acceptedNodes = acceptedNodes.slice(0, 1);
        }

        // Agrega el nodo seleccionado a la lista de nodos aceptados
        acceptedNodes.push(selectedObject);
        selectedObject.isAcceptState = true;
      } else {
        // Si el nodo seleccionado ya es un nodo aceptado, cambia su estado a falso
        selectedObject.isAcceptState = false;

        // Elimina el nodo seleccionado de la lista de nodos aceptados
        acceptedNodes = acceptedNodes.filter((node) => node !== selectedObject);
      }

      draw();
    }
  };

  canvas.onmousemove = function (e) {
    mouse = crossBrowserRelativeMousePos(e);

    if (currentLink != null) {
      targetNode = selectObject(mouse.x, mouse.y);
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
        if (targetNode === selectedObject) {
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

  canvas.onmouseup = function () {
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

  draw();
});

function canvasHasFocus() {
  return (document.activeElement || document.body) === document.body;
}

export function drawText(c, text, x, y, angleOrNull, isSelected) {
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

    if (isSelected && caretVisible && canvasHasFocus() && document.hasFocus()) {
      x += width;
      c.beginPath();
      c.moveTo(x, y - 10);
      c.lineTo(x, y + 10);
      c.stroke();
    }
  }
}

function drawOnCanvas(c, nodes, links) {
  let i;
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.translate(0.5, 0.5);

  for (i = 0; i < nodes.length; i++) {
    c.lineWidth = 1.7;
    c.fillStyle = c.strokeStyle =
      nodes[i] === selectedObject ? "#ff5924" : "white";
    nodes[i].draw(c);
  }

  for (i = 0; i < links.length; i++) {
    c.lineWidth = 1.7;
    c.fillStyle = c.strokeStyle =
      links[i] === selectedObject ? "#ff5924" : "white";
    links[i].draw(c);
  }

  if (currentLink != null) {
    c.lineWidth = 1.7;
    c.fillStyle = c.strokeStyle = "white";
    currentLink.draw(c);
  }

  c.restore();
}

export function drawSolution(c, nodes, links) {
  drawOnCanvas(c, nodes, links);
}

export function onReset() {
  const alert = confirm("¿Estás seguro de que deseas reiniciar el grafo?");
  if (alert) {
    nodes = [];
    links = [];
    acceptedNodes = [];
    document.querySelector("#solutions-div").innerHTML = "";
    draw();
  }
}

export function drawUsing(c) {
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.translate(0.5, 0.5);

  for (let i = 0; i < nodes.length; i++) {
    c.lineWidth = 1.7;
    c.fillStyle = c.strokeStyle =
      nodes[i] === selectedObject ? "#ff5924" : "white";
    nodes[i].draw(c);
  }

  for (let i = 0; i < links.length; i++) {
    c.lineWidth = 1.7;

    c.fillStyle = c.strokeStyle =
      links[i] === selectedObject ? "#ff5924" : "white";
    links[i].draw(c);
  }

  if (currentLink != null) {
    c.lineWidth = 1.7;
    c.fillStyle = c.strokeStyle = "white";
    currentLink.draw(c);
  }

  c.restore();
}

export function drawArrow(c, x, y, angle) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
  c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
  c.fill();
}

export function draw() {
  if (!canvas) return;
  drawUsing(canvas.getContext("2d"));
  saveBackup();
}

function resetCaret() {
  clearInterval(caretTimer);
  caretVisible = !caretVisible;
  caretTimer = setInterval(draw, 500);
  caretVisible = true;
}

function selectObject(x, y) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].containsPoint(x, y)) {
      return nodes[i];
    }
  }

  for (let i = 0; i < links.length; i++) {
    if (links[i].containsPoint(x, y)) {
      return links[i];
    }
  }
  return null;
}

function snapNode(node) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i] === node) continue;

    if (Math.abs(node.x - nodes[i].x) < snapToPadding) {
      node.x = nodes[i].x;
    }

    if (Math.abs(node.y - nodes[i].y) < snapToPadding) {
      node.y = nodes[i].y;
    }
  }
}

function crossBrowserKey(e) {
  e = e || window.event;
  return e.which || e.keyCode;
}

function crossBrowserElementPos(e) {
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
  const element = crossBrowserElementPos(e);
  const mouse = crossBrowserMousePos(e);
  return {
    x: mouse.x - element.x,
    y: mouse.y - element.y,
  };
}

// Listeners
window.onload = function () {
  canvas = document.getElementById("canvas");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  restoreBackup();
  draw();

  canvas.onmousedown = function (e) {
    mouse = crossBrowserRelativeMousePos(e);
    selectedObject = selectObject(mouse.x, mouse.y);
    movingObject = false;
    originalClick = mouse;

    if (selectedObject != null) {
      if (shift && selectedObject instanceof Node) {
        currentLink = new SelfLink(selectedObject, mouse);
      } else {
        movingObject = true;
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
    mouse = crossBrowserRelativeMousePos(e);
    selectedObject = selectObject(mouse.x, mouse.y);

    if (selectedObject == null) {
      selectedObject = new Node(mouse.x, mouse.y);
      nodes.push(selectedObject);
      resetCaret();
      draw();
    } else if (selectedObject instanceof Node) {
      if (!selectedObject.isAcceptState) {
        console.log(acceptedNodes);
        if (acceptedNodes.length === 2) {
          // Cambia el estado del último nodo aceptado a falso
          let lastAcceptedNode = acceptedNodes[1];
          lastAcceptedNode.isAcceptState = false;

          // Elimina el último nodo de la lista de nodos aceptados
          acceptedNodes = acceptedNodes.slice(0, 1);
        }

        // Agrega el nodo seleccionado a la lista de nodos aceptados
        acceptedNodes.push(selectedObject);
        selectedObject.isAcceptState = true;
      } else {
        // Si el nodo seleccionado ya es un nodo aceptado, cambia su estado a falso
        selectedObject.isAcceptState = false;

        // Elimina el nodo seleccionado de la lista de nodos aceptados
        acceptedNodes = acceptedNodes.filter((node) => node !== selectedObject);
      }

      draw();
    }
  };

  canvas.onmousemove = function (e) {
    mouse = crossBrowserRelativeMousePos(e);

    if (currentLink != null) {
      targetNode = selectObject(mouse.x, mouse.y);
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
        if (targetNode === selectedObject) {
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

  canvas.onmouseup = function () {
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

shift = false;

document.onkeydown = function (e) {
  key = crossBrowserKey(e);

  if (key === 16) {
    shift = true;
  } else if (!canvasHasFocus()) {
    // don't read keystrokes when other things have focus
    return true;
  } else if (key === 8) {
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
  } else if (key === 46) {
    // delete key
    if (selectedObject != null) {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] == selectedObject) {
          nodes.splice(i--, 1);
        }
      }
      for (let i = 0; i < links.length; i++) {
        if (
          links[i] === selectedObject ||
          links[i].node === selectedObject ||
          links[i].nodeA === selectedObject ||
          links[i].nodeB === selectedObject
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
  key = crossBrowserKey(e);

  if (key === 16) {
    shift = false;
  }
};

document.onkeypress = function (e) {
  // don't read keystrokes when other things have focus
  key = crossBrowserKey(e);
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
  } else if (key === 8) {
    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false;
  }
};

// document.addEventListener("keypress", (e) => {
//   key = crossBrowserKey(e);
//   if (!canvasHasFocus()) {
//     return true;
//   }
//
//   if (
//     key >= 0x20 &&
//     key <= 0x7e &&
//     !e.metaKey &&
//     !e.altKey &&
//     !e.ctrlKey &&
//     selectedObject != null
//   ) {
//     if (selectedObject instanceof Link) {
//       if (shift) {
//         // Editar el texto en el final de la relación
//         selectedObject.textEnd += String.fromCharCode(key);
//       } else {
//         // Editar el texto en el inicio de la relación
//         selectedObject.textStart += String.fromCharCode(key);
//       }
//       resetCaret();
//       draw();
//       return false;
//     } else if ("text" in selectedObject) {
//       selectedObject.text += String.fromCharCode(key);
//       resetCaret();
//       draw();
//       return false;
//     }
//   } else if (key === 8) {
//     // Evitar que la tecla de retroceso (backspace) realice su acción predeterminada
//     return false;
//   }
// });
