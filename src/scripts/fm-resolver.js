import { links, nodes, onReset } from "./fm-main.js";

export function executeResolver() {
  if (window.location.pathname !== "/flujo-maximo") return;

  const resetButton = document.querySelector("#fm-reset-btn");
  const resolveButton = document.querySelector("#fm-resolve");
  resetButton.addEventListener("click", onReset);
  resolveButton.addEventListener("click", onResolve);

  // let graph = [
  //   [0, 16, 13, 0, 0, 0],
  //   [0, 0, 10, 12, 0, 0],
  //   [0, 4, 0, 0, 14, 0],
  //   [0, 0, 9, 0, 0, 20],
  //   [0, 0, 0, 7, 0, 4],
  //   [0, 0, 0, 0, 0, 0],
  // ];

  function createAdjacencyMatrix(nodes, links) {
    // Paso 1: Crear una matriz vacía del tamaño de los nodos

    const matrix = Array(nodes.length)
      .fill()
      .map(() => Array(nodes.length).fill(0));

    // Paso 2: Iterar sobre los enlaces
    links.forEach((link) => {
      // Paso 3: Encontrar los índices de nodeA y nodeB
      const indexA = nodes.findIndex((node) => node.text === link.nodeA.text);
      const indexB = nodes.findIndex((node) => node.text === link.nodeB.text);

      // Paso 4: Actualizar la matriz de adyacencia con los valores de textStart y textEnd
      matrix[indexA][indexB] = parseFloat(link.textEnd);
      matrix[indexB][indexA] = parseFloat(link.textStart);
    });

    return matrix;
  }
  function onResolve() {
    const matrix = createAdjacencyMatrix(nodes, links);
    console.log(links);
    console.log(matrix);
  }
}
