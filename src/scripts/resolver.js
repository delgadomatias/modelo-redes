import { Graph } from "./algorithms/prim.js";
import { WeightedGraph } from "./algorithms/dijkstra.js";
import { Link, Node } from "./elements/index.js";
import { acceptedNodes, drawSolution, links, nodes, onReset } from "./main.js";

let dijkstraSolution = [];
let mstPrimSolution = [];
let resolveBy = [];

export function executeResolver() {
  const dijkstraOption = document.querySelector("#Dijkstra-option input");
  const primOption = document.querySelector("#Prim-option input");
  const resetButton = document.querySelector("#reset-btn");
  const resolveButton = document.querySelector("#resolve");
  const solutionsDiv = document.querySelector("#solutions-div");

  resetButton.addEventListener("click", onReset);

  function createNewCanvas() {
    const canvas = document.createElement("canvas");
    canvas.classList.add("bg-[#0b0b0f]");
    canvas.classList.add("rounded-xl");
    canvas.setAttribute("width", "1100");
    canvas.setAttribute("height", "600");
    return canvas;
  }

  function createHeader(title) {
    const header = document.createElement("h2");
    header.className = "font-bold";
    header.style.fontSize = "3rem";
    header.textContent = title;
    return header;
  }

  function createDivWithHeader(title) {
    const div = document.createElement("div");
    const header = createHeader(title);
    div.append(header);
    div.className = "flex flex-col gap-2";
    return div;
  }

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

  function resolveByDijkstra() {
    let dijkstraGraph = new WeightedGraph();

    // First, add the vertices to the graph
    nodes.map((node) => {
      dijkstraGraph.addVertex(node.text);
    });

    // Then, add the edges
    links.map((link) => {
      const src = link.nodeA.text;
      const dest = link.nodeB.text;
      const weight = parseFloat(link.text);
      dijkstraGraph.addEdge(src, dest, weight);
    });

    if (acceptedNodes.length < 2) {
      let sortedNodes = nodes
        .map((node) => node.text)
        .sort((a, b) => a.localeCompare(b));

      return dijkstraGraph.Dijkstra(
        sortedNodes[0],
        sortedNodes[sortedNodes.length - 1],
      );
    }

    return dijkstraGraph.Dijkstra(acceptedNodes[0].text, acceptedNodes[1].text);
  }

  primOption.addEventListener("click", (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      return resolveBy.push("Prim");
    }

    resolveBy = resolveBy.filter((resolve) => resolve !== "Prim");
  });

  dijkstraOption.addEventListener("click", (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      return resolveBy.push("Dijkstra");
    }

    resolveBy = resolveBy.filter((resolve) => resolve !== "Dijkstra");
  });

  resolveButton.addEventListener("click", () => {
    const existentPrimSolution = document.querySelector("#prim-solution");
    const existentDijkstraSolution =
      document.querySelector("#dijkstra-solution");

    if (resolveBy.length === 0) {
      if (existentPrimSolution) {
        existentPrimSolution.remove();
      }

      if (existentDijkstraSolution) {
        existentDijkstraSolution.remove();
      }

      return;
    }

    if (!resolveBy.includes("Prim") && existentPrimSolution) {
      existentPrimSolution.remove();
    }

    if (!resolveBy.includes("Dijkstra") && existentDijkstraSolution) {
      existentDijkstraSolution.remove();
    }

    if (resolveBy.includes("Prim")) {
      resolveByPrim();
      solutionsDiv.innerHTML = "";

      // Create the section for the solution
      const div = createDivWithHeader("Solución por el algoritmo de Prim");
      div.id = "prim-solution";
      solutionsDiv.append(div);

      // Below, create the canvas for the solution
      const newCanvas = createNewCanvas();
      newCanvas.id = "prim-canvas";
      div.append(newCanvas);

      // Draw the solution
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
      drawSolution(newCanvas.getContext("2d"), newNodes, newLinks);
    }

    if (resolveBy.includes("Dijkstra")) {
      dijkstraSolution = resolveByDijkstra();
      if (existentDijkstraSolution) {
        existentDijkstraSolution.remove();
      }

      const div = createDivWithHeader("Solución por el algoritmo de Dijkstra");
      div.id = "dijkstra-solution";
      solutionsDiv.append(div);

      const newCanvas = createNewCanvas();
      newCanvas.id = "dijkstra-canvas";
      div.append(newCanvas);

      const newNodes = [];
      const newLinks = [];

      for (let i = 0; i < dijkstraSolution.length - 1; i++) {
        const node = dijkstraSolution[i];
        const nextNode = dijkstraSolution[i + 1];
        const sourceNode = nodes.find((n) => n.text === node);
        const linkBetweenNodes = links.find(
          (link) => link.nodeA.text === node && link.nodeB.text === nextNode,
        );
        newNodes.push(sourceNode);
        newLinks.push(linkBetweenNodes);
      }

      const lastNode = nodes.find(
        (node) => node.text === dijkstraSolution[dijkstraSolution.length - 1],
      );
      newNodes.push(lastNode);

      drawSolution(newCanvas.getContext("2d"), newNodes, newLinks);
    }

    // Scroll into view
    let offset = 45;
    let elementPosition = solutionsDiv.getBoundingClientRect().top;
    let offsetPosition = elementPosition + window.pageYOffset - offset;
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  });
}

const dijkstraOption = document.querySelector("#Dijkstra-option input");
const primOption = document.querySelector("#Prim-option input");
const resetButton = document.querySelector("#reset-btn");
const resolveButton = document.querySelector("#resolve");
const solutionsDiv = document.querySelector("#solutions-div");

resetButton.addEventListener("click", onReset);

function createNewCanvas() {
  const canvas = document.createElement("canvas");
  canvas.classList.add("bg-[#0b0b0f]");
  canvas.classList.add("rounded-xl");
  canvas.setAttribute("width", "1100");
  canvas.setAttribute("height", "600");
  return canvas;
}

function createHeader(title) {
  const header = document.createElement("h2");
  header.className = "font-bold";
  header.style.fontSize = "3rem";
  header.textContent = title;
  return header;
}

function createDivWithHeader(title) {
  const div = document.createElement("div");
  const header = createHeader(title);
  div.append(header);
  div.className = "flex flex-col gap-2";
  return div;
}

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

function resolveByDijkstra() {
  let dijkstraGraph = new WeightedGraph();

  // First, add the vertices to the graph
  nodes.map((node) => {
    dijkstraGraph.addVertex(node.text);
  });

  // Then, add the edges
  links.map((link) => {
    const src = link.nodeA.text;
    const dest = link.nodeB.text;
    const weight = parseFloat(link.text);
    dijkstraGraph.addEdge(src, dest, weight);
  });

  if (acceptedNodes.length < 2) {
    let sortedNodes = nodes
      .map((node) => node.text)
      .sort((a, b) => a.localeCompare(b));

    return dijkstraGraph.Dijkstra(
      sortedNodes[0],
      sortedNodes[sortedNodes.length - 1],
    );
  }

  return dijkstraGraph.Dijkstra(acceptedNodes[0].text, acceptedNodes[1].text);
}

primOption.addEventListener("click", (e) => {
  const isChecked = e.target.checked;
  if (isChecked) {
    return resolveBy.push("Prim");
  }

  resolveBy = resolveBy.filter((resolve) => resolve !== "Prim");
});

dijkstraOption.addEventListener("click", (e) => {
  const isChecked = e.target.checked;
  if (isChecked) {
    return resolveBy.push("Dijkstra");
  }

  resolveBy = resolveBy.filter((resolve) => resolve !== "Dijkstra");
});

resolveButton.addEventListener("click", () => {
  const existentPrimSolution = document.querySelector("#prim-solution");
  const existentDijkstraSolution = document.querySelector("#dijkstra-solution");

  if (resolveBy.length === 0) {
    if (existentPrimSolution) {
      existentPrimSolution.remove();
    }

    if (existentDijkstraSolution) {
      existentDijkstraSolution.remove();
    }

    return;
  }

  if (!resolveBy.includes("Prim") && existentPrimSolution) {
    existentPrimSolution.remove();
  }

  if (!resolveBy.includes("Dijkstra") && existentDijkstraSolution) {
    existentDijkstraSolution.remove();
  }

  if (resolveBy.includes("Prim")) {
    resolveByPrim();
    solutionsDiv.innerHTML = "";

    // Create the section for the solution
    const div = createDivWithHeader("Solución por el algoritmo de Prim");
    div.id = "prim-solution";
    solutionsDiv.append(div);

    // Below, create the canvas for the solution
    const newCanvas = createNewCanvas();
    newCanvas.id = "prim-canvas";
    div.append(newCanvas);

    // Draw the solution
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
    drawSolution(newCanvas.getContext("2d"), newNodes, newLinks);
  }

  if (resolveBy.includes("Dijkstra")) {
    dijkstraSolution = resolveByDijkstra();
    if (existentDijkstraSolution) {
      existentDijkstraSolution.remove();
    }

    const div = createDivWithHeader("Solución por el algoritmo de Dijkstra");
    div.id = "dijkstra-solution";
    solutionsDiv.append(div);

    const newCanvas = createNewCanvas();
    newCanvas.id = "dijkstra-canvas";
    div.append(newCanvas);

    const newNodes = [];
    const newLinks = [];

    for (let i = 0; i < dijkstraSolution.length - 1; i++) {
      const node = dijkstraSolution[i];
      const nextNode = dijkstraSolution[i + 1];
      const sourceNode = nodes.find((n) => n.text === node);
      const linkBetweenNodes = links.find(
        (link) => link.nodeA.text === node && link.nodeB.text === nextNode,
      );
      newNodes.push(sourceNode);
      newLinks.push(linkBetweenNodes);
    }

    const lastNode = nodes.find(
      (node) => node.text === dijkstraSolution[dijkstraSolution.length - 1],
    );
    newNodes.push(lastNode);

    drawSolution(newCanvas.getContext("2d"), newNodes, newLinks);
  }

  // Scroll into view
  let offset = 45;
  let elementPosition = solutionsDiv.getBoundingClientRect().top;
  let offsetPosition = elementPosition + window.pageYOffset - offset;
  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
});
