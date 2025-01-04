export class Vec2 {
  constructor(public x: number, public y: number) {}

  static new(x: number, y: number): Vec2 {
    return new Vec2(x, y);
  }

  set(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  distanceTo(v: Vec2): number {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
  }

  mul(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s);
  }

  div(s: number): Vec2 {
    return new Vec2(this.x / s, this.y / s);
  }

  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  scale(k: number): Vec2 {
    return new Vec2(this.x * k, this.y * k);
  }

  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  subScalar(s: number): Vec2 {
    return new Vec2(this.x - s, this.y - s);
  }

  addScalar(s: number): Vec2 {
    return new Vec2(this.x + s, this.y + s);
  }

  divScalar(s: number): Vec2 {
    return new Vec2(this.x / s, this.y / s);
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vec2 {
    const l = this.length();
    if (l === 0) return new Vec2(0, 0);
    return new Vec2(this.x / l, this.y / l);
  }
}
