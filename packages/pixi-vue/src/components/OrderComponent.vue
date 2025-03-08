<template>
  <GRect
    :flexDirection="FlexDirection.Row"
    :height="17"
    :gapCol="5"
    :paddingX="5"
    :align="Align.Stretch"
    :fill="isHovered ? '#ffffff55' : undefined"
    @pointerMove="onPointerMove"
    @pointerDown="onPointerDown"
    @pointerUp="onPointerUp"
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
        fill="#529546"
        :roundness="4"
        :justify="Justify.Center"
        :paddingX="6"
      >
        <GText text="R$ 238.54" fill="white" :fontSize="fontSize"></GText>
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
</template>

<script lang="ts" setup>
import {
  Align,
  FlexDirection,
  GContainer,
  GImage,
  GRect,
  GText,
  Justify,
  Overflow,
} from "#els/appRenderers.ts";
import { ref } from "vue";
import imgUrl from "../assets/bat.png";

const fontSize = 12;
const isHovered = ref(false);
function onPointerDown() {}
function onPointerUp() {}
function onPointerMove() {}
function onPointerEnter() {
  isHovered.value = true;
}
function onPointerLeave() {
  isHovered.value = false;
}
</script>
