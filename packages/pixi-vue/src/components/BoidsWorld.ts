import { Vec2 } from "@gdx/utils";

const SPEED = 50;

const BOID_SIZE = 50;
const TOO_CLOSE = BOID_SIZE;

const NEAR = BOID_SIZE * 2;
export class Boid {
  position: Vec2 = new Vec2(0, 0);
  velocity: Vec2 = new Vec2(0, 0);

  get rotation(): number {
    return Math.atan2(this.velocity.y, this.velocity.x);
  }

  isTooClose(other: Boid): boolean {
    return this.position.sub(other.position).length() < TOO_CLOSE;
  }

  isNear(other: Boid): boolean {
    return this.position.sub(other.position).length() < NEAR;
  }
}

export class BoidsWorld {
  boids: Map<number, Boid> = new Map<number, Boid>();
  dt = 0.016;
  sceneWidth = 1;
  sceneHeight = 1;
  currentID = 0;

  static TOO_CLOSE: number = TOO_CLOSE;
  static NEAR: number = NEAR;
  static BOID_SIZE: number = BOID_SIZE;

  create(n: number): void {
    this.boids.clear();
    for (let i = 0; i < n; i++) {
      this.boids.set(this.currentID, this.createBoid());
      this.currentID += 1;
    }
  }

  private createBoid() {
    const boid = new Boid();
    boid.position.x = Math.random() * this.sceneWidth - this.sceneWidth / 2;
    boid.position.y = Math.random() * this.sceneHeight - this.sceneHeight / 2;
    boid.velocity.set(Math.random() * 2 - 1.3, Math.random() * 2 - 1);
    boid.velocity = boid.velocity.normalize().scale(SPEED);
    return boid;
  }

  findWithID(id: any): Boid | null {
    return this.boids.get(id) ?? null;
  }

  update(): void {
    const dt = this.dt;
    const boids = this.boids;
    boids.forEach((boid) => {
      let velocity = boid.velocity;
      let posSum = new Vec2(0, 0);
      let nearCount = 0;
      boids.forEach((other) => {
        if (boid !== other && boid.isTooClose(other)) {
          velocity = other.position
            .sub(boid.position)
            .normalize()
            .scale(-0.05 * boid.velocity.length())
            .add(boid.velocity);
        } else if (boid !== other && boid.isNear(other)) {
          velocity = velocity.add(other.velocity.scale(0.01));
          posSum = posSum.add(other.position);
          nearCount += 1;
        }
      });
      const nearAverage = posSum.scale(nearCount ? 1 / nearCount : 0);
      velocity = velocity.add(
        nearAverage.sub(boid.position).normalize().scale(0.01)
      );
      boid.velocity = velocity.normalize().scale(SPEED);
    });
    boids.forEach((boid) => {
      boid.position = boid.position.add(boid.velocity.scale(dt));
      boid.position.x = (boid.position.x + this.sceneWidth) % this.sceneWidth;
      boid.position.y = (boid.position.y + this.sceneHeight) % this.sceneHeight;
    });
  }
}
