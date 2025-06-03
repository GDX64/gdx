export class MyNode<T extends { id: string }> {
  constructor(public data: T, public children: MyNode<T>[]) {}

  addChild(child: MyNode<T>): void {
    if (this.children.every((c) => c.id !== child.id)) {
      this.children.push(child);
    }
  }

  get id(): string {
    return this.data.id;
  }

  findShortestPathToNode(node: MyNode<T>): MyNode<T>[] | null {
    if (this === node) {
      return [this];
    }

    const paths = this.children
      .map((child) => {
        const path = child.findShortestPathToNode(node);
        if (path != null && path.length > 0) {
          return [this, ...path];
        }
        return null;
      })
      .filter((path) => path != null);
    if (!paths.length) {
      return null;
    }
    const shortestPath = paths.reduce((a, b) => {
      const aIsShorter = a.length < b.length;
      return aIsShorter ? a : b;
    });
    return shortestPath;
  }

  turnIntoDAG(): {
    root: MyNode<T>;
    shortestPaths: Map<string, MyNode<T>[]>;
  } {
    function findShortestPaths(
      node: MyNode<T>,
      currentPath: MyNode<T>[],
      shortestPaths = new Map<string, MyNode<T>[]>()
    ) {
      for (const child of node.children) {
        const childPath = [...currentPath, child];
        const currentShortestPath = shortestPaths.get(child.id);
        if (!currentShortestPath || currentShortestPath.length > childPath.length) {
          shortestPaths.set(child.id, childPath);
        }
        findShortestPaths(child, childPath, shortestPaths);
      }
      return shortestPaths;
    }
    const shortestPaths = findShortestPaths(this, [this]);
    for (const node of [...this.iter()]) {
      node.clearChildren();
    }
    for (const path of shortestPaths.values()) {
      for (let i = 0; i < path.length - 1; i++) {
        const parent = path[i];
        const child = path[i + 1];
        if (!this.findShortestPathToNode(child)) {
          parent.addChild(child);
        }
      }
    }
    return {
      root: this,
      shortestPaths,
    };
  }

  findNodeById(id: string): MyNode<T> | null {
    if (this.id === id) {
      return this;
    }
    for (const child of this.children) {
      const foundNode = child.findNodeById(id);
      if (foundNode) {
        return foundNode;
      }
    }
    return null;
  }

  clearChildren(): void {
    this.children = [];
  }

  getLinks() {
    const links: { source: MyNode<T>; target: MyNode<T> }[] = [];
    this.children.forEach((child) => {
      links.push({ source: this, target: child });
      links.push(...child.getLinks());
    });
    return links;
  }

  *iter(): Generator<MyNode<T>> {
    yield this;
    for (const child of this.children) {
      yield* child.iter();
    }
  }
}
