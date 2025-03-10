<template>
  <div class="flex gap-10 text-base flex-wrap w-full">
    <canvas ref="canvas" class="my-canvas" @pointermove="onPointerMove"></canvas>
    <div class="flex flex-col items-start gap-4 mb-2 grow min-w-96">
      <div class="flex gap-2 w-full">
        <label>Calc Time:</label>
        <span>{{ drawTime.toFixed(2) }}ms</span>
      </div>
      <div class="flex flex-col gap-1 font-semibold w-full">
        <label>Radius</label>
        <input type="range" min="1" max="20" v-model.number="radius" />
      </div>
      <div class="flex flex-col gap-1 font-semibold w-full">
        <label>Circles</label>
        <input
          type="range"
          min="1"
          max="2000"
          v-model.number="circlesNumber"
          @input="onRestart"
        />
      </div>
      <div class="grow"></div>
      <Button class="rounded-md px-2 w-full" @click="onRestart">Restart</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAnimationFrames, useCanvasDPI, useSize, useVisibility } from '@gdx/utils';
import { GridIndex } from './GridIndex';
import { Vec2 } from '@gdx/utils';
import { Entity, SpaceIndex } from './SpaceIndexTypes';
import { LinScale } from '@gdx/utils';
import { measureTime } from '../../utils/benchMark';
import { QuadTreeIndex } from './QuadTreeIndex';
import { SpatialGridColors } from './SpatialGridColors';
import { HashGridIndex } from './HashGridIndex';
import Button from '../../components/Button.vue';

const GRID_SIZE = 100;
const CIRC_RADIUS = 1;
const radius = ref(10);
const V = 10;
const circlesNumber = ref(100);

const props = defineProps<{
  kind: 'quadtree' | 'grid' | 'hashgrid';
}>();

const drawTime = ref(0);

const pointerPositon = ref(Vec2.new(0, 0));

const { canvas, size } = useCanvasDPI();

let collection: SpaceIndex<Circle> = createCollection();

onMounted(() => {
  onRestart();
});

const { isVisible } = useVisibility(canvas);

useAnimationFrames(() => {
  if (!isVisible.value) {
    return;
  }
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) {
    return;
  }
  const { elapsed } = measureTime(() => {
    evolveSimulation(0.016);
  });

  drawTime.value = elapsed * 0.05 + drawTime.value * 0.95;

  const scaleX = LinScale.fromPoints(0, 0, GRID_SIZE, size.width);
  const scaleY = LinScale.fromPoints(0, 0, GRID_SIZE, size.height);
  const worldPointer = Vec2.new(
    scaleX.invert(pointerPositon.value.x),
    scaleY.invert(pointerPositon.value.y)
  );

  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, size.width, size.height);

  ctx.fillStyle = SpatialGridColors.circles;

  for (const circle of collection.iter()) {
    circle.debugDraw(ctx, scaleX, scaleY);
  }

  collection.drawQuery(worldPointer, radius.value, ctx);

  const nearPointer = collection.query(worldPointer, radius.value);
  for (const circle of nearPointer) {
    ctx.fillStyle = SpatialGridColors.queryCircle;
    circle.debugDraw(ctx, scaleX, scaleY);
  }

  ctx.restore();
});

function evolveSimulation(dt: number) {
  const newCircles: Circle[] = [];
  for (const circle of collection.iter()) {
    const near = collection.query(circle.position(), circle.radius * 2);
    const newCircle = circle.clone();
    for (const other of near) {
      if (circle !== other) {
        newCircle.collide(other);
      }
    }
    newCircles.push(newCircle);
  }

  collection = createCollection();

  for (const circle of newCircles) {
    const deltaV = circle.v.mul(dt);
    circle.pos = circle.pos.add(deltaV);
    const hitsX = circle.position().x < 0 || circle.position().x > GRID_SIZE;
    const hitsY = circle.position().y < 0 || circle.position().y > GRID_SIZE;

    if (hitsX) {
      circle.v = Vec2.new(-circle.v.x, circle.v.y);
    }
    if (hitsY) {
      circle.v = Vec2.new(circle.v.x, -circle.v.y);
    }
    if (hitsX || hitsY) {
      circle.pos = Vec2.new(
        Math.max(0, Math.min(GRID_SIZE, circle.pos.x)),
        Math.max(0, Math.min(GRID_SIZE, circle.pos.y))
      );
    }

    collection.insert(circle);
  }
}

function createCollection() {
  if (props.kind === 'quadtree') {
    return new QuadTreeIndex<Circle>(GRID_SIZE);
  }
  if (props.kind === 'hashgrid') {
    return new HashGridIndex<Circle>(radius.value * 2, GRID_SIZE);
  }
  return new GridIndex<Circle>(radius.value, GRID_SIZE);
}

function randCircles() {
  const circles = Array.from({ length: circlesNumber.value }, () => {
    const v = Vec2.new((Math.random() * 2 - 1) * V, (Math.random() * 2 - 1) * V);
    return new Circle(
      Vec2.new(Math.random() * GRID_SIZE, Math.random() * GRID_SIZE),
      CIRC_RADIUS,
      v
    );
  });
  return circles;
}

class Circle implements Entity {
  constructor(public pos: Vec2, public radius: number, public v: Vec2) {}

  position(): Vec2 {
    return this.pos;
  }

  clone() {
    return new Circle(this.pos.clone(), this.radius, this.v.clone());
  }

  debugDraw(ctx: CanvasRenderingContext2D, scaleX: LinScale, scaleY: LinScale): void {
    ctx.beginPath();
    ctx.arc(
      scaleX.scale(this.pos.x),
      scaleY.scale(this.pos.y),
      scaleX.alpha * this.radius,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }

  collide(other: Circle) {
    const delta = other.pos.sub(this.pos);
    const dist = delta.length();
    const overlap = this.radius + other.radius - dist;
    if (overlap > 0) {
      const normal = delta.div(dist);
      const mtd = normal.mul(overlap);
      this.pos = this.pos.sub(mtd.div(2));
      this.v = other.v;
    }
  }
}

function onPointerMove(e: PointerEvent) {
  pointerPositon.value = Vec2.new(e.offsetX, e.offsetY);
}

function onRestart() {
  collection = createCollection();
  for (const circle of randCircles()) {
    collection.insert(circle);
  }
}
</script>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

.my-canvas {
  font-family: monospace sans-serif;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
  border: 1px solid rgb(0, 0, 0);
  touch-action: none;
}
</style>
