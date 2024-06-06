import { FMLink, FmNode, FmSelfLink, FmStartLink } from "../elements/fm";
import { FmMain } from "../fm-main-dos.js";

// import { acceptedNodes, links, nodes } from "../main.js";

export function restoreBackup() {
  const main = FmMain.getInstance();

  if (!localStorage || !JSON) {
    return;
  }

  try {
    const backup = JSON.parse(localStorage["fm"]);

    for (let i = 0; i < backup.nodes.length; i++) {
      const backupNode = backup.nodes[i];
      const node = new FmNode(backupNode.x, backupNode.y);
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
      if (backupLink.type === "FmSelfLink") {
        link = new FmSelfLink(main.nodes[backupLink.node]);
        link.anchorAngle = backupLink.anchorAngle;
        link.textStart = backupLink.textStart;
        link.textEnd = backupLink.textEnd;
      } else if (backupLink.type === "FmStartLink") {
        link = new FmStartLink(main.nodes[backupLink.node]);
        link.deltaX = backupLink.deltaX;
        link.deltaY = backupLink.deltaY;
        link.textStart = backupLink.textStart;
        link.textEnd = backupLink.textEnd;
      } else if (backupLink.type === "FMLink") {
        link = new FMLink(
          main.nodes[backupLink.nodeA],
          main.nodes[backupLink.nodeB],
        );
        link.parallelPart = backupLink.parallelPart;
        link.perpendicularPart = backupLink.perpendicularPart;
        link.textStart = backupLink.textStart;
        link.textEnd = backupLink.textEnd;
        link.lineAngleAdjust = backupLink.lineAngleAdjust;
      }
      if (link != null) {
        main.links.push(link);
      }
    }
  } catch (e) {
    localStorage["fm"] = "";
  }
}

export function saveBackup() {
  const main = FmMain.getInstance();

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
    if (link instanceof FmSelfLink) {
      backupLink = {
        type: "FmSelfLink",
        node: main.nodes.indexOf(link.node),
        textStart: link.textStart,
        textEnd: link.textEnd,
        anchorAngle: link.anchorAngle,
      };
    } else if (link instanceof FmStartLink) {
      backupLink = {
        type: "FmStartLink",
        node: main.nodes.indexOf(link.node),
        textStart: link.textStart,
        textEnd: link.textEnd,
        deltaX: link.deltaX,
        deltaY: link.deltaY,
      };
    } else if (link instanceof FMLink) {
      backupLink = {
        type: "FMLink",
        nodeA: main.nodes.indexOf(link.nodeA),
        nodeB: main.nodes.indexOf(link.nodeB),
        textStart: link.textStart,
        textEnd: link.textEnd,
        lineAngleAdjust: link.lineAngleAdjust,
        parallelPart: link.parallelPart,
        perpendicularPart: link.perpendicularPart,
      };
    }
    if (backupLink != null) {
      backup.links.push(backupLink);
    }
  }

  localStorage["fm"] = JSON.stringify(backup);
}
