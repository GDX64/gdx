<template>
  <g-container
    :gap="10"
    :padding="20"
    height="100%"
    width="100%"
    :justify="Justify.SpaceAround"
  >
    <g-rect :width="height" :height="height" :fill="0xff0000"></g-rect>
    <g-container
      :gap="4"
      :flexDirection="FlexDirection.Row"
      :padding="0"
      :height="200"
      :grow="1"
      :justify="Justify.SpaceBetween"
      :align="Align.Center"
    >
      <g-rect
        :maxWidth="800"
        height="100%"
        :fill="0xffff00"
        :gap="10"
        :justify="Justify.SpaceEvenly"
        :wrap="Wrap.Wrap"
      >
        <g-rect
          :width="20"
          :height="20"
          :fill="0x0000ff"
          v-for="x in 40"
        ></g-rect>
      </g-rect>
      <g-rect
        :width="200"
        :height="200"
        :fill="color"
        :gap="10"
        :justify="Justify.SpaceBetween"
        @click="changeColor"
      >
        <g-rect :width="50" :height="30" :fill="0xff0000"></g-rect>
        <g-rect :width="50" :height="30" :fill="0xff0000"></g-rect>
        <g-rect :width="50" :height="30" :fill="0xff0000"></g-rect>
      </g-rect>
    </g-container>
    <g-rect :width="200" :height="100" :fill="0xffffff" :grow="1"></g-rect>
  </g-container>
</template>

<script setup lang="ts">
import { Align, FlexDirection, Justify, Wrap } from "yoga-layout";
import { useAnimationFrames } from "@gdx/utils";
import { ref } from "vue";

const height = ref(0);
useAnimationFrames(({ elapsed }) => {
  height.value = Math.sin(elapsed / 1000) * 200 + 200;
});

const color = ref(0xffffff);
function changeColor() {
  color.value = Math.round(Math.random() * 0xffffff);
}
</script>
