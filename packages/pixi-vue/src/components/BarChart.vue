<template>
  <g-raw
    fill="white"
    :drawFunction="drawFn"
    :border="1"
    borderColor="#000000"
    :padding="30"
    @layoutupdate="onLayoutUpdate"
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
        :height="Math.abs(scales.scaleY(bar.value) - scales.scaleY(0))"
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
import { computed, reactive, watchEffect } from "vue";
import { scaleLinear, interpolateReds } from "d3";

const hovered = reactive(new Set<number>());

type BarData = {
  value: number;
  label: string;
  color?: string;
};

const barsRaw: BarData[] = [
  { value: 131, label: ".ts" },
  { value: 77, label: ".js" },
  { value: 52, label: ".html" },
  { value: 66, label: ".css" },
  { value: 89, label: ".svg" },
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

function onLayoutUpdate(element: ElementInterface) {
  size.width = element.getWidth();
  size.height = element.getHeight();
}

function drawFn(ctx: CanvasRenderingContext2D, element: ElementInterface) {
  const { scaleX, scaleY } = scales.value;
  const [minX, maxX] = scaleX.domain();
  const [minY, maxY] = scaleY.domain();
  ctx.beginPath();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(0, 0, element.getWidth(), element.getHeight());
  ctx.fill();
  ctx.beginPath();
  ctx.rect(0.5, 0.5, element.getWidth() - 1, element.getHeight() - 1);
  ctx.stroke();
  ctx.moveTo(scaleX(0), scaleY(0));
  ctx.lineTo(scaleX(0), scaleY(maxY));
  ctx.moveTo(scaleX(0), scaleY(0));
  ctx.lineTo(scaleX(maxX), scaleY(0));
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
    const scaleX = scaleLinear()
      .domain([minX, maxX])
      .range([paddingX.value, size.width])
      .nice(10);
    const scaleY = scaleLinear()
      .domain([minY, maxY])
      .range([size.height - paddingY, paddingY])
      .nice(10);
    return { scaleX, scaleY };
  });

  function drawTicks(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const { scaleX, scaleY } = scales.value;
    const [_, maxX] = scaleX.range();
    const ticks = scaleY.ticks();
    ticks.forEach((tickValue) => {
      const y = scaleY(tickValue);
      ctx.beginPath();
      ctx.strokeStyle = "black";
      const x0 = scaleX(0);
      ctx.moveTo(x0 - 5, y);
      ctx.lineTo(x0 + 5, y);
      ctx.stroke();
      ctx.beginPath();
      if (tickValue !== 0) {
        ctx.save();
        ctx.moveTo(x0 + 5, y);
        ctx.setLineDash([5, 5]);
        ctx.lineTo(scaleX(maxX), y);
        ctx.strokeStyle = "#d7d7d7";
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = "black";
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      ctx.fillText(tickValue.toString(), x0 - 8, y);
    });
    ctx.restore();
  }

  return { scales, drawTicks };
}
</script>
