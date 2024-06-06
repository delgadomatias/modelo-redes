import { Link, Node, SelfLink, StartLink } from "../elements/index.js";
import { Main } from "../main.js";

export function restoreBackup(name) {
  const main = Main.getInstance();
  main.nodes = [];
  main.links = [];
  main.acceptedNodes = [];

  if (!localStorage || !JSON) {
    return;
  }

  try {
    const backup = JSON.parse(localStorage.getItem(name));

    for (let i = 0; i < backup.nodes.length; i++) {
      const backupNode = backup.nodes[i];
      const node = new Node(backupNode.x, backupNode.y);
      node.isAcceptState = backupNode.isAcceptState;
      node.text = backupNode.text;
      if (node.isAcceptState) {
        main.addAcceptedNode(node);
      }
      main.addNode(node);
    }

    for (let i = 0; i < backup.links.length; i++) {
      const backupLink = backup.links[i];
      let link = null;
      if (backupLink.type === "SelfLink") {
        link = new SelfLink(main.nodes[backupLink.node]);
        link.anchorAngle = backupLink.anchorAngle;
        link.text = backupLink.text;
      } else if (backupLink.type === "StartLink") {
        link = new StartLink(main.nodes[backupLink.node]);
        link.deltaX = backupLink.deltaX;
        link.deltaY = backupLink.deltaY;
        link.text = backupLink.text;
      } else if (backupLink.type === "Link") {
        link = new Link(
          main.nodes[backupLink.nodeA],
          main.nodes[backupLink.nodeB],
        );
        link.parallelPart = backupLink.parallelPart;
        link.perpendicularPart = backupLink.perpendicularPart;
        link.text = backupLink.text;
        link.lineAngleAdjust = backupLink.lineAngleAdjust;
      }
      if (link != null) {
        main.links.push(link);
      }
    }
  } catch (e) {
    localStorage["fsm"] = "";
  }
}

export function saveBackup(name) {
  const main = Main.getInstance();

  if (!localStorage || !JSON) {
    return;
  }

  const backup = {
    nodes: [],
    links: [],
  };

  for (let i = 0; i < main.nodes.length; i++) {
    const node = main.nodes[i];
    const backupNode = {
      x: node.x,
      y: node.y,
      text: node.text,
      isAcceptState: node.isAcceptState,
    };
    backup.nodes.push(backupNode);
  }

  for (let i = 0; i < main.links.length; i++) {
    const link = main.links[i];
    let backupLink = null;
    if (link instanceof SelfLink) {
      backupLink = {
        type: "SelfLink",
        node: main.nodes.indexOf(link.node),
        text: link.text,
        anchorAngle: link.anchorAngle,
      };
    } else if (link instanceof StartLink) {
      backupLink = {
        type: "StartLink",
        node: main.nodes.indexOf(link.node),
        text: link.text,
        deltaX: link.deltaX,
        deltaY: link.deltaY,
      };
    } else if (link instanceof Link) {
      backupLink = {
        type: "Link",
        nodeA: main.nodes.indexOf(link.nodeA),
        nodeB: main.nodes.indexOf(link.nodeB),
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

  localStorage.setItem(name, JSON.stringify(backup));
}
