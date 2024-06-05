import { Link, Node, SelfLink, StartLink } from "../elements/index.js";
import { acceptedNodes, links, nodes } from "../main.js";

export function restoreBackup() {
  if (!localStorage || !JSON) {
    return;
  }

  try {
    const backup = JSON.parse(localStorage["fsm"]);

    for (let i = 0; i < backup.nodes.length; i++) {
      const backupNode = backup.nodes[i];
      const node = new Node(backupNode.x, backupNode.y);
      node.isAcceptState = backupNode.isAcceptState;
      node.text = backupNode.text;
      if (node.isAcceptState) {
        acceptedNodes.push(node);
      }
      nodes.push(node);
    }
    for (let i = 0; i < backup.links.length; i++) {
      const backupLink = backup.links[i];
      let link = null;
      if (backupLink.type === "SelfLink") {
        link = new SelfLink(nodes[backupLink.node]);
        link.anchorAngle = backupLink.anchorAngle;
        link.text = backupLink.text;
      } else if (backupLink.type === "StartLink") {
        link = new StartLink(nodes[backupLink.node]);
        link.deltaX = backupLink.deltaX;
        link.deltaY = backupLink.deltaY;
        link.text = backupLink.text;
      } else if (backupLink.type === "Link") {
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

export function saveBackup() {
  if (!localStorage || !JSON) {
    return;
  }

  const backup = {
    nodes: [],
    links: [],
  };

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const backupNode = {
      x: node.x,
      y: node.y,
      text: node.text,
      isAcceptState: node.isAcceptState,
    };
    backup.nodes.push(backupNode);
  }

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    let backupLink = null;
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
