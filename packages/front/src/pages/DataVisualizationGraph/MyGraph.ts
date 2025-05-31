export class MyNode<T extends { id: string }> {
  constructor(public data: T, public children: MyNode<T>[]) {}

  addChild(child: MyNode<T>): void {
    this.children.push(child);
  }

  get id(): string {
    return this.data.id;
  }

  findPathToNode(node: MyNode<T>): MyNode<T>[] | null {
    if (this === node) {
      return [this];
    }

    const paths = this.children
      .map((child) => {
        const path = child.findPathToNode(node);
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
