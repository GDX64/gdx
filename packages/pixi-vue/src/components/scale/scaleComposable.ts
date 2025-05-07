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
  const padding = 15;
  const gridColor = "#e5e5e5";

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
    ctx.moveTo(scaleX(0), scaleY(minY));
    ctx.lineTo(scaleX(0), scaleY(maxY));
    ctx.moveTo(scaleX(minX), scaleY(0));
    ctx.lineTo(scaleX(maxX), scaleY(0));
    ctx.stroke();

    drawTicks(ctx);
  }

  function drawTicks(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const { scaleX, scaleY } = scales.value;
    const [minX, maxX] = scaleX.domain();
    const [minY, maxY] = scaleY.domain();
    const ticksY = scaleY.ticks();
    ticksY.forEach((tickValue) => {
      if (tickValue === 0) {
        return;
      }
      const y = scaleY(tickValue);
      ctx.beginPath();
      ctx.save();
      ctx.moveTo(scaleX(minX), y);
      ctx.setLineDash([5, 5]);
      ctx.lineTo(scaleX(maxX), y);
      ctx.strokeStyle = gridColor;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.strokeStyle = "black";
      const x0 = scaleX(0);
      ctx.moveTo(x0 - 5, y);
      ctx.lineTo(x0 + 5, y);
      ctx.stroke();

      ctx.fillStyle = "black";
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      ctx.fillText(tickValue.toString(), x0 - 8, y);
    });
    const ticksX = scaleX.ticks();
    ticksX.forEach((tickValue) => {
      if (tickValue === 0) {
        return;
      }
      const x = scaleX(tickValue);
      ctx.beginPath();
      ctx.save();
      ctx.moveTo(x, scaleY(minY));
      ctx.setLineDash([5, 5]);
      ctx.lineTo(x, scaleY(maxY));
      ctx.strokeStyle = gridColor;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.strokeStyle = "black";
      const y0 = scaleY(0);
      ctx.moveTo(x, y0 - 5);
      ctx.lineTo(x, y0 + 5);
      ctx.stroke();

      ctx.fillStyle = "black";
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.fillText(tickValue.toString(), x, y0 + 8);
    });
    ctx.restore();
  }

  function image() {
    const minX = padding;
    const maxX = size.width - padding;
    const minY = padding;
    const maxY = size.height - padding;
    return { minX, maxX, minY, maxY };
  }

  return { scales, drawScale, size };
}
