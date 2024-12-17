<template>
  <canvas ref="canvas" class="absolute top-0 left-0 h-full w-full"></canvas>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useCanvasDPI } from '../../utils/rxjsUtils';
import shaderCode from './shader1.wgsl?raw';
const { canvas, pixelSize } = useCanvasDPI();

onMounted(() => {
  initWebGPU(canvas.value!);
});

async function initWebGPU(canvas: HTMLCanvasElement) {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter!.requestDevice();
  const context = canvas.getContext('webgpu');
  if (!context) {
    throw new Error('WebGPU is not supported');
  }
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  const module = device.createShaderModule({
    code: shaderCode,
    label: 'simple-vertex-shader',
  });

  const pipeline = device.createRenderPipeline({
    label: 'our hardcoded red triangle pipeline',
    layout: 'auto',
    vertex: {
      entryPoint: 'vs',
      module,
    },
    fragment: {
      entryPoint: 'fs',
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const texture = context.getCurrentTexture().createView();

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: 'our basic canvas renderPass',
    colorAttachments: [
      <GPURenderPassColorAttachment>{
        view: texture,
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  };

  function render() {
    // Get the current texture from the canvas context and
    // set it as the texture to render to.

    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: 'our encoder' });

    // make a render pass encoder to encode render specific commands
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline);
    pass.draw(3); // call our vertex shader 3 times
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
  }

  render();
}
</script>
