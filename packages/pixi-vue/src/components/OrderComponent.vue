<template>
  <GRect
    :flexDirection="FlexDirection.Row"
    :height="16"
    :gapCol="5"
    :padding="0"
  >
    <GImage :image="imgUrl" :width="32"></GImage>
    <GRect
      fill="#b85b5e"
      :roundness="4"
      :align="Align.Center"
      :border="1"
      borderColor="#ff8e8e"
      :justify="Justify.Center"
      :paddingX="6"
    >
      <GText text="Sim." fill="white" :fontSize="14"></GText>
    </GRect>
    <GRect
      fill="#635c34"
      :roundness="4"
      :align="Align.Center"
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
        <GText text="1004835" fill="white" :fontSize="14"></GText>
      </GRect>
      <GText text="L 1300" fill="white" :fontSize="14"></GText>
      <GRect
        fill="#529546"
        :roundness="4"
        :justify="Justify.Center"
        :paddingX="6"
      >
        <GText text="R$ 238.54" fill="white" :fontSize="14"></GText>
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
      <GText text="X" fill="white" :fontSize="14"></GText>
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
} from "#els/appRenderers.ts";
import imgUrl from "../assets/bat.png";
</script>
