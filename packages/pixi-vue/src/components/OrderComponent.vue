<template>
  <GCache :position="PositionType.Absolute" :cacheKey="updateVersion">
    <GRect
      :flexDirection="FlexDirection.Row"
      :height="17"
      :gapCol="5"
      :paddingX="5"
      :align="Align.Stretch"
      :fill="isHovered ? '#ffffff55' : undefined"
      @pointerDown="onPointerDown"
      @pointerEnter="onPointerEnter"
      @pointerLeave="onPointerLeave"
    >
      <GRect
        :width="17"
        :height="17"
        :roundness="10"
        :overflow="Overflow.Hidden"
        :align="Align.Center"
        fill="white"
      >
        <GImage :image="imgUrl" :width="32" :height="16"></GImage>
      </GRect>
      <GRect
        fill="#b85b5e"
        :roundness="4"
        :align="Align.Center"
        :border="1"
        borderColor="#ff8e8e"
        :justify="Justify.Center"
        :paddingX="6"
      >
        <GText text="Sim." fill="white" :fontSize="fontSize"></GText>
      </GRect>
      <GRect
        fill="#635c34"
        :roundness="4"
        :align="Align.Stretch"
        :border="1"
        borderColor="#ffe042"
        :justify="Justify.Center"
        :paddingX="0"
        :flexDirection="FlexDirection.Row"
        :gap="5"
      >
        <GRect
          fill="#a03933"
          :roundness="4"
          :justify="Justify.Center"
          :paddingX="6"
        >
          <GText text="1004835" fill="white" :fontSize="fontSize"></GText>
        </GRect>
        <GContainer :align="Align.Center" :justify="Justify.Center">
          <GText text="L 1300" fill="white" :fontSize="fontSize"></GText>
        </GContainer>
        <GRect
          :fill="priceNum > 0 ? '#529546' : '#a03933'"
          :roundness="4"
          :justify="Justify.Center"
          :paddingX="6"
        >
          <GText :text="price" fill="white" :fontSize="fontSize"></GText>
        </GRect>
      </GRect>
      <GRect
        fill="#733542"
        :roundness="4"
        :justify="Justify.Center"
        :align="Align.Center"
        :width="16"
        :border="1"
        borderColor="#ff8e8e"
      >
        <GText text="X" fill="white" :fontSize="fontSize"></GText>
      </GRect>
    </GRect>
  </GCache>
</template>

<script lang="ts" setup>
import {
  Align,
  FlexDirection,
  GCache,
  GContainer,
  GImage,
  GRect,
  GText,
  Justify,
  Overflow,
  PositionType,
} from "#els/appRenderers.ts";
import {
  computed,
  getCurrentInstance,
  onBeforeUpdate,
  onUnmounted,
  ref,
} from "vue";
import imgUrl from "../assets/bat.png";
import { awaitTime } from "../../../utils/src/misc";

const fontSize = 12;
const isHovered = ref(false);
const isPressed = ref(false);
const orderPoitionY = defineModel<number>("positionY", {
  required: true,
});
const updateVersion = ref(0);
const instance = getCurrentInstance()!;

const priceNum = ref(0);

const price = computed(() => {
  return `$${priceNum.value.toFixed(2)}`;
});

updatePrice();

onBeforeUpdate(() => {
  updateVersion.value++;
});

document.addEventListener("pointerup", onPointerUp);
document.addEventListener("pointermove", onPointerMove);
onUnmounted(() => {
  document.removeEventListener("pointerup", onPointerUp);
  document.removeEventListener("pointermove", onPointerMove);
});

async function updatePrice() {
  while (true) {
    await awaitTime(Math.random() * 1000);
    if (instance.isUnmounted) return;
    priceNum.value += (Math.random() - 0.5) * 10;
  }
}

function onPointerDown() {
  isPressed.value = true;
}

function onPointerUp() {
  isPressed.value = false;
}

function onPointerMove(event: PointerEvent) {
  if (isPressed.value) {
    orderPoitionY.value += event.movementY;
  }
}

function onPointerEnter() {
  isHovered.value = true;
}
function onPointerLeave() {
  isHovered.value = false;
}
</script>
