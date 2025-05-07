<template>
  <g-raw
    fill="white"
    :width="size.width"
    :height="size.height"
    :drawFunction="drawFn"
    :border="1"
    borderColor="#000000"
    :padding="30"
  >
    <g-rect
      height="100%"
      width="100%"
      :flexDirection="FlexDirection.Row"
      :gap="10"
      :paddingX="30"
      :align="Align.FlexEnd"
    >
      <g-raw
        v-for="(bar, index) of bars"
        :key="bar.label"
        :metaData="bar"
        :grow="1"
        :height="Math.abs(scales.scaleY.deltaScale(bar.value))"
        :fill="hovered.has(index) ? 'red' : bar.color"
        @pointerenter="hovered.add(index)"
        @pointerleave="hovered.delete(index)"
        :drawFunction="barDrawFn"
      >
      </g-raw>
    </g-rect>
  </g-raw>
</template>

<script setup lang="ts">
import { Align, FlexDirection, GRaw, GRect } from "#els/appRenderers.ts";
import { ElementInterface } from "#els/renderTypes.ts";
import { LinScale } from "@gdx/utils";
import { computed, reactive, watchEffect } from "vue";
import { interpolateReds } from "d3";

const hovered = reactive(new Set<number>());

type BarData = {
  value: number;
  label: string;
  color?: string;
};

const barsRaw: BarData[] = [
  { value: 8, label: ".ts" },
  { value: 3, label: ".js" },
  { value: 2, label: ".html" },
  { value: 3, label: ".css" },
  { value: 1, label: ".svg" },
];

const paddingX = computed(() => {
  const maxValue = Math.max(...barsRaw.map((bar) => bar.value));
  const maxLabel = maxValue.toString().length * 10;
  return Math.max(30, maxLabel + 10);
});

const paddingY = 30;

const limits = computed(() => {
  const minY = 0;
  const maxY = Math.max(...barsRaw.map((bar) => bar.value));
  const minX = 0;
  const maxX = barsRaw.length - 1;
  return { minY, maxY, minX, maxX };
});

const { scales, drawTicks } = useScales(() => limits.value);

const bars = computed(() => {
  return barsRaw.map((bar) => {
    const maxValue = Math.max(...barsRaw.map((b) => b.value));
    return {
      ...bar,
      color: interpolateReds(bar.value / maxValue),
    };
  });
});

watchEffect(() => {
  console.log([...bars.value]);
});

const size = reactive({
  width: 800,
  height: 500,
});

type ScaleLimits = {
  minY: number;
  maxY: number;
  minX: number;
  maxX: number;
};

function drawFn(ctx: CanvasRenderingContext2D, element: ElementInterface) {
  const { scaleX, scaleY } = scales.value;
  const { minY, maxY, minX, maxX } = limits.value;
  ctx.beginPath();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.rect(0, 0, element.getWidth(), element.getHeight());
  ctx.fill();
  ctx.stroke();
  ctx.moveTo(scaleX.scale(0), scaleY.scale(0));
  ctx.lineTo(scaleX.scale(0), scaleY.scale(maxY));
  ctx.moveTo(scaleX.scale(0), scaleY.scale(0));
  ctx.lineTo(scaleX.scale(maxX), scaleY.scale(0));
  ctx.stroke();

  drawTicks(ctx);
}

function barDrawFn(ctx: CanvasRenderingContext2D, element: ElementInterface) {
  ctx.fillStyle = element.attrs.fill?.toString() ?? "white";
  ctx.beginPath();
  ctx.roundRect(0, 0, element.getWidth(), element.getHeight(), 5);
  ctx.closePath();
  ctx.fill();
  const metaData: BarData = element.attrs.metaData;
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    metaData.label,
    element.getWidth() / 2,
    element.getHeight() + 10
  );
}

function useScales(limits: () => ScaleLimits) {
  const scales = computed(() => {
    const { minY, maxY, minX, maxX } = limits();
    const scaleX = LinScale.fromPoints(
      minX,
      paddingX.value,
      maxX,
      size.width - paddingX.value
    );
    const scaleY = LinScale.fromPoints(
      minY,
      size.height - paddingY,
      maxY,
      paddingY
    );
    return { scaleX, scaleY };
  });

  function drawTicks(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const { scaleX, scaleY } = scales.value;
    const { maxX, maxY } = limits();
    const maxTicksSupported = Math.abs(scaleY.deltaScale(maxY) / 20);
    let ticks = Math.floor(Math.min(maxTicksSupported, maxY));
    const increment = Math.floor(maxY / ticks);
    ticks = Math.floor(maxY / increment);
    for (let i = 1; i < ticks + 1; i++) {
      const tickValue = i * increment;
      const y = scaleY.scale(tickValue);
      ctx.beginPath();
      ctx.strokeStyle = "black";
      const x0 = scaleX.scale(0);
      ctx.moveTo(x0 - 5, y);
      ctx.lineTo(x0 + 5, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x0 + 5, y);
      ctx.lineTo(scaleX.scale(maxX), y);
      ctx.strokeStyle = "#d7d7d7";
      ctx.stroke();
      ctx.fillStyle = "black";
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      ctx.fillText(tickValue.toString(), x0 - 8, y);
    }
    ctx.restore();
  }

  return { scales, drawTicks };
}
</script>
