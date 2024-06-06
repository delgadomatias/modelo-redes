import { Main } from "./main.js";
import { WeightedGraph } from "./algorithms/dijkstra.js";
import { Link, Node } from "./elements/index.js";
import { fordFulkerson } from "./algorithms/max-flow.js";
import { kruskal } from "./algorithms/kruskal.js";

export class Resolver {
  dijkstraSolution = [];
  mstKruskalSolution = [];
  resolveBy = [];
  main = Main.getInstance();

  maxFlowSolution = [];

  static instance;
  static getInstance() {
    if (!Resolver.instance) {
      Resolver.instance = new Resolver();
    }
    return Resolver.instance;
  }

  runForPrimAndDijkstra = () => {
    const dijkstraOption = document.querySelector("#Dijkstra-option input");
    const primOption = document.querySelector("#Kruskal-option input");
    const resetButton = document.querySelector("#reset-btn");
    const resolveButton = document.querySelector("#resolve");
    const solutionsDiv = document.querySelector("#solutions-div");
    const solutionsContainer = document.querySelector("#solutions-container");

    resetButton?.addEventListener("click", this.main.onReset);

    primOption?.addEventListener("click", (e) => {
      const isChecked = e.target.checked;
      if (isChecked) {
        this.resolveBy.push("Kruskal");
        return;
      }

      this.resolveBy = this.resolveBy.filter(
        (resolve) => resolve !== "Kruskal",
      );
    });

    dijkstraOption?.addEventListener("click", (e) => {
      const isChecked = e.target.checked;
      if (isChecked) {
        this.resolveBy.push("Dijkstra");
        return;
      }

      this.resolveBy = this.resolveBy.filter(
        (resolve) => resolve !== "Dijkstra",
      );
    });

    resolveButton?.addEventListener("click", () => {
      if (this.main.nodes.length === 0) return;

      const existentPrimSolution = document.querySelector("#kruskal-solution");
      const existentDijkstraSolution =
        document.querySelector("#dijkstra-solution");

      if (this.resolveBy.length === 0) {
        solutionsContainer.classList.remove("flex");
        solutionsContainer.classList.add("hidden");
        if (existentPrimSolution) {
          existentPrimSolution.remove();
        }

        if (existentDijkstraSolution) {
          existentDijkstraSolution.remove();
        }

        return;
      }

      if (!this.resolveBy.includes("Kruskal") && existentPrimSolution) {
        existentPrimSolution.remove();
      }

      if (!this.resolveBy.includes("Dijkstra") && existentDijkstraSolution) {
        existentDijkstraSolution.remove();
      }

      solutionsContainer.classList.remove("hidden");
      solutionsContainer.classList.add("flex");

      if (this.resolveBy.includes("Kruskal")) {
        const finalWeight = this.resolveByKruskal();
        solutionsDiv.innerHTML = "";

        // Create the section for the solution
        const div = this.createDivWithHeader(
          "Solución por el algoritmo de Kruskal",
        );
        div.id = "kruskal-solution";
        solutionsDiv.append(div);

        // Below, create the canvas for the solution
        const newCanvas = this.createNewCanvas();
        newCanvas.id = "kruskal-canvas";
        div.append(newCanvas);

        const newH3 = document.createElement("h3");
        newH3.textContent = `Distancia total: ${finalWeight}`;
        newH3.className = "font-medium text-3xl ml-2";
        div.append(newH3);

        // Draw the solution
        const newNodes = [];
        const newLinks = [];
        this.mstKruskalSolution.map((node) => {
          const { src, dest, weight } = node;
          const oldNodePosition = this.main.nodes.find(
            (node) => node.text === src,
          );
          const oldNodeDestPosition = this.main.nodes.find(
            (node) => node.text === dest,
          );
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

        this.main.drawSolution(newCanvas.getContext("2d"), newNodes, newLinks);
      }

      if (this.resolveBy.includes("Dijkstra")) {
        const { path, sumWeight } = this.resolveByDijkstra();
        this.dijkstraSolution = path;

        if (existentDijkstraSolution) {
          existentDijkstraSolution.remove();
        }

        const div = this.createDivWithHeader(
          "Solución por el algoritmo de Dijkstra",
        );
        div.id = "dijkstra-solution";
        solutionsDiv.append(div);

        const newCanvas = this.createNewCanvas();
        newCanvas.id = "dijkstra-canvas";
        div.append(newCanvas);

        const newH3 = document.createElement("h3");
        newH3.textContent = `Distancia total: ${sumWeight}`;
        newH3.className = "font-medium text-3xl ml-2";
        div.append(newH3);

        const newNodes = [];
        const newLinks = [];

        for (let i = 0; i < this.dijkstraSolution.length - 1; i++) {
          const node = this.dijkstraSolution[i];
          const nextNode = this.dijkstraSolution[i + 1];
          const sourceNode = this.main.nodes.find((n) => n.text === node);
          const linkBetweenNodes = this.main.links.find(
            (link) => link.nodeA.text === node && link.nodeB.text === nextNode,
          );
          newNodes.push(sourceNode);
          newLinks.push(linkBetweenNodes);
        }

        const lastNode = this.main.nodes.find(
          (node) =>
            node.text ===
            this.dijkstraSolution[this.dijkstraSolution.length - 1],
        );
        newNodes.push(lastNode);

        this.main.drawSolution(newCanvas.getContext("2d"), newNodes, newLinks);
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
  };

  runForMaxFlow = () => {
    const resetButton = document.querySelector("#fm-reset-btn");
    const resolveButton = document.querySelector("#fm-resolve");

    resetButton.addEventListener("click", this.main.onReset);
    resolveButton.addEventListener("click", this.onResolve);
  };

  onResolve = () => {
    const solutionsContainer = document.querySelector(
      "#fm-solutions-container",
    );

    let s = parseFloat(this.main.acceptedNodes[0]?.text) - 1 || null;
    let t = parseFloat(this.main.acceptedNodes[1]?.text) - 1 || null;

    solutionsContainer.classList.remove("hidden");
    solutionsContainer.classList.add("flex");

    if (!s || !t) {
      alert("Por favor, seleccione un nodo de inicio y un nodo de fin");
      return;
    }

    const graph = this.createAdjacencyMatrix();
    const maxFlow = fordFulkerson(graph, s, t);
    console.log(maxFlow);
  };

  createAdjacencyMatrix = () => {
    // Paso 1: Crear una matriz vacía del tamaño de los nodos

    const matrix = Array(this.main.nodes.length)
      .fill(0)
      .map(() => Array(this.main.nodes.length).fill(0));

    console.log(matrix);

    // Paso 2: Iterar sobre los enlaces
    this.main.links.forEach((link) => {
      // Paso 3: Encontrar los índices de nodeA y nodeB
      const sepLink = link.text.split("/");
      const indexA = this.main.nodes.findIndex(
        (node) => node.text === link.nodeA.text,
      );
      const indexB = this.main.nodes.findIndex(
        (node) => node.text === link.nodeB.text,
      );

      // // Paso 4: Actualizar la matriz de adyacencia con los valores de textStart y textEnd
      matrix[indexA][indexB] = parseFloat(sepLink[1]);
      matrix[indexB][indexA] = parseFloat(sepLink[0]);
    });

    return matrix;
  };

  createNewCanvas = () => {
    const canvas = document.createElement("canvas");
    canvas.classList.add("bg-[#0b0b0f]");
    canvas.classList.add("rounded-xl");
    canvas.setAttribute("width", "1100");
    canvas.setAttribute("height", "600");
    return canvas;
  };

  createHeader = (title) => {
    const header = document.createElement("h2");
    header.className = "font-bold";
    header.style.fontSize = "3rem";
    header.textContent = title;
    return header;
  };

  createDivWithHeader = (title) => {
    const div = document.createElement("div");
    const header = this.createHeader(title);
    div.append(header);
    div.className = "flex flex-col gap-2";
    return div;
  };

  resolveByKruskal = () => {
    // First, adapt the Edges for the solution
    const edges = this.main.links.map((link) => {
      return {
        src: link.nodeA.text,
        dest: link.nodeB.text,
        weight: parseFloat(link.text),
      };
    });

    const { mst, finalWeight } = kruskal(edges);
    this.mstKruskalSolution = mst;
    return finalWeight;
  };

  resolveByDijkstra = () => {
    let dijkstraGraph = new WeightedGraph();

    // First, add the vertices to the graph
    this.main.nodes.map((node) => {
      dijkstraGraph.addVertex(node.text);
    });

    // Then, add the edges
    this.main.links.map((link) => {
      const src = link.nodeA.text;
      const dest = link.nodeB.text;
      const weight = parseFloat(link.text);
      dijkstraGraph.addEdge(src, dest, weight);
    });

    if (this.main.acceptedNodes.length < 2) {
      let sortedNodes;

      // Check if some node have a letter in the text
      if (this.main.nodes.some((node) => isNaN(parseFloat(node.text)))) {
        sortedNodes = this.main.nodes
          .map((node) => node.text)
          .sort((a, b) => a.localeCompare(b));
      } else {
        sortedNodes = this.main.nodes
          .map((node) => parseFloat(node.text))
          .sort((a, b) => a - b);
      }

      return dijkstraGraph.Dijkstra(
        sortedNodes[0].toString(),
        sortedNodes[sortedNodes.length - 1].toString(),
      );
    }

    return dijkstraGraph.Dijkstra(
      this.main.acceptedNodes[0].text,
      this.main.acceptedNodes[1].text,
    );
  };
}
