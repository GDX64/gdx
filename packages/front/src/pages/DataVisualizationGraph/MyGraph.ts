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

  static fromFileSystemArr(files: string[]) {
    const allFolders = new Set<string>();
    const nodes = new Map<string, MyNode<{ id: string }>>();
    const getNode = (id: string) => {
      const node = nodes.get(id);
      if (node) {
        return node;
      }
      const newNode = new MyNode({ id }, []);
      nodes.set(id, newNode);
      return newNode;
    };

    for (const file of files) {
      const paths = file.split('/');
      for (let i = 0; i < paths.length; i++) {
        const slice = paths.slice(0, i + 1);
        const fileOrFolder = slice.join('/');
        allFolders.add(fileOrFolder);
        if (!nodes.has(fileOrFolder)) {
          const node = getNode(fileOrFolder);
          const parentID = slice.slice(0, -1).join('/');
          const parentNode = getNode(parentID);
          parentNode.addChild(node);
        }
      }
    }

    const root = getNode('C:');
    function firstFolderWithMoreThanOneChild(
      node: MyNode<{ id: string }>
    ): MyNode<{ id: string }> | null {
      if (!node.children.length) {
        return null;
      }
      if (node.children.length > 1) {
        return node;
      }
      return firstFolderWithMoreThanOneChild(node.children.at(0)!);
    }
    return firstFolderWithMoreThanOneChild(root);
  }
}
