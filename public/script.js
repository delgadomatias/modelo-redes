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
  constructor(vertices) {
    this.vertices = vertices;
    this.edges = Array(vertices)
      .fill(null)
      .map(() => Array(vertices).fill(Infinity));
    this.visited = Array(vertices).fill(false);
  }

  addEdge(src, dest, weight) {
    this.edges[src][dest] = weight;
    this.edges[dest][src] = weight;
  }

  primsMST() {
    this.visited[0] = true;
    let pq = new PriorityQueue();
    let result = [];

    // Inicializamos la cola de prioridad con las aristas del vértice 0
    for (let j = 0; j < this.vertices; j++) {
      if (this.edges[0][j] !== Infinity) {
        pq.enqueue({ src: 0, dest: j }, this.edges[0][j]);
      }
    }

    // Procesamos la cola de prioridad
    while (!pq.isEmpty()) {
      let {
        vertex: { src, dest },
        priority: weight,
      } = pq.dequeue();
      if (!this.visited[dest]) {
        this.visited[dest] = true;
        result.push({ src, dest, weight });

        for (let j = 0; j < this.vertices; j++) {
          if (this.edges[dest][j] != Infinity && !this.visited[j]) {
            pq.enqueue({ src: dest, dest: j }, this.edges[dest][j]);
          }
        }
      }
    }

    return result;
  }
}

// Crear una instancia del grafo con el número de vértices
const g = new Graph(5);

// Añadir aristas y sus pesos
g.addEdge(2, 5, 5);
g.addEdge(5, 6, 8);
// g.addEdge(0, 1, 2);
// g.addEdge(0, 3, 6);
// g.addEdge(1, 2, 3);
// g.addEdge(1, 3, 8);
// g.addEdge(1, 4, 5);
// g.addEdge(2, 4, 7);
// g.addEdge(3, 4, 9);

// Ejecutar el algoritmo de Prim para obtener el árbol de expansión mínima
const mst = g.primsMST();
console.log(mst);
