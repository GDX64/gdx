import { computed, reactive } from "vue";
import { min, scaleLinear } from "d3";
import { ElementInterface } from "#els/renderTypes.ts";

export type ScaleLimits = {
  minY: number;
  maxY: number;
  minX: number;
  maxX: number;
};

export function useScales(domain: () => ScaleLimits) {
  const size = reactive({
    width: 0,
    height: 0,
  });

  const scales = computed(() => {
    const { minY, maxY, minX, maxX } = domain();
    const imageLimits = image();

    const scaleX = scaleLinear()
      .domain([minX, maxX])
      .range([imageLimits.minX, imageLimits.maxX])
      .nice(10);

    const scaleY = scaleLinear()
      .domain([minY, maxY])
      .range([imageLimits.maxY, imageLimits.minY])
      .nice(10);

    return { scaleX, scaleY };
  });

  function drawScale(ctx: CanvasRenderingContext2D, element: ElementInterface) {
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

  function drawTicks(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const { scaleX, scaleY } = scales.value;
    const [_, maxX] = scaleX.domain();
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

  function image() {
    const padding = 30;
    const minX = padding;
    const maxX = size.width - padding;
    const minY = padding;
    const maxY = size.height - padding;
    return { minX, maxX, minY, maxY };
  }

  return { scales, drawScale, size };
}
