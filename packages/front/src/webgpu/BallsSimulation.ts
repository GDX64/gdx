import { createComputePipeline, createDrawPipeline, initDevice } from './ballsDraw';
import { workGroupSize } from './shaders';

type SimulationData = {
  mousePos: Float32Array;
  killed: boolean;
  forceConstant: Float32Array;
  mouseDown: boolean;
};

export function start(canvas: HTMLCanvasElement, balls: number) {
  const data = {
    mousePos: new Float32Array(2),
    updateMousePos,
    killed: false,
    forceConstant: new Float32Array([1]),
    mouseDown: false,
  };
  initSimulation(canvas, balls, data);

  function updateMousePos(event: PointerEvent) {
    data.mousePos[0] = (event.offsetX / canvas.width) * 2 - 1;
    data.mousePos[1] = ((canvas.height - event.offsetY) / canvas.height) * 2 - 1;
  }
  return data;
}

async function initSimulation(
  canvas: HTMLCanvasElement,
  balls: number,
  data: SimulationData
) {
  const NUM_BALLS = balls;
  const BUFFER_SIZE = NUM_BALLS * 6 * Float32Array.BYTES_PER_ELEMENT;
  const VERTEX_SIZE = NUM_BALLS * 2 * Float32Array.BYTES_PER_ELEMENT;

  const { device, context, presentationFormat } = await initDevice(canvas);
  const {
    sceneBuffer,
    input,
    mouseBuffer,
    pipeline,
    bindGroup,
    output,
    stagingBuffer,
    forceBuffer,
    mouseDown,
  } = createComputePipeline(device, BUFFER_SIZE, VERTEX_SIZE);
  const { draw } = createDrawPipeline(
    device,
    context,
    presentationFormat,
    output,
    sceneBuffer,
    NUM_BALLS
  );

  let inputBalls = new Float32Array(new ArrayBuffer(BUFFER_SIZE));
  const width = canvas.width;
  const height = canvas.height;
  const randX = () => random(0, width);
  const randY = () => random(0, height);
  for (let i = 0; i < NUM_BALLS; i++) {
    inputBalls[i * 6 + 0] = 1;
    inputBalls[i * 6 + 2] = randX();
    inputBalls[i * 6 + 3] = randY();
    inputBalls[i * 6 + 4] = random(-100, 100) / 100;
    inputBalls[i * 6 + 5] = random(-100, 100) / 100;
  }

  device.queue.writeBuffer(
    sceneBuffer,
    0,
    new Float32Array([canvas.width, canvas.height])
  );

  device.queue.writeBuffer(input, 0, inputBalls);

  while (true) {
    if (data.killed) {
      return;
    }
    device.queue.writeBuffer(mouseBuffer, 0, data.mousePos);
    device.queue.writeBuffer(forceBuffer, 0, data.forceConstant);
    device.queue.writeBuffer(mouseDown, 0, new Uint32Array([data.mouseDown ? 1 : 0]));
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    const dispatchSize = Math.ceil(NUM_BALLS / workGroupSize);
    passEncoder.dispatchWorkgroups(dispatchSize);
    passEncoder.end();
    draw(commandEncoder);
    commandEncoder.copyBufferToBuffer(output, 0, stagingBuffer, 0, BUFFER_SIZE);
    commandEncoder.copyBufferToBuffer(output, 0, input, 0, BUFFER_SIZE);

    const commands = commandEncoder.finish();
    device.queue.submit([commands]);
    await raf();
  }
}

function random(a: number, b: number) {
  return Math.random() * (b - a) + a;
}

function raf() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}
