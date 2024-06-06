class UnionFind {
  constructor(elements) {
    this.parent = {};

    elements.forEach((e) => (this.parent[e] = e));
  }

  union(a, b) {
    this.parent[this.find(a)] = this.find(b);
  }

  find(a) {
    while (this.parent[a] !== a) {
      a = this.parent[a];
    }

    return a;
  }

  connected(a, b) {
    return this.find(a) === this.find(b);
  }
}

export function kruskal(graph) {
  graph.sort((a, b) => a.weight - b.weight);

  const nodes = new Set(graph.map((e) => [e.src, e.dest]).flat());
  const unionFind = new UnionFind(nodes);
  let finalWeight = 0;

  const mst = [];

  for (let edge of graph) {
    if (!unionFind.connected(edge.src, edge.dest)) {
      unionFind.union(edge.src, edge.dest);
      mst.push(edge);
    }
  }

  mst.forEach((edge) => {
    finalWeight += edge.weight;
  });

  return {
    mst,
    finalWeight,
  };
}
