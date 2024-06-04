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

export class Graph {
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
