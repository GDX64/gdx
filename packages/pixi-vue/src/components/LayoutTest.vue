<template>
  <g-container
    height="100%"
    width="100%"
    :justify="Justify.SpaceAround"
    :align="Align.FlexStart"
  >
    <g-rect width="100%" height="100%" fill="#223652" :padding="30">
      <OrderComponent></OrderComponent>
    </g-rect>
  </g-container>
</template>

<script setup lang="ts">
import { Align, Justify } from "yoga-layout";
import { ref } from "vue";
import { GContainer, GRect } from "#els/appRenderers.ts";
import testImg from "../assets/bat.png";
import OrderComponent from "./OrderComponent.vue";

const img = new Image();
img.src = testImg;

const color = ref(0xffffff);
function changeColor() {
  color.value = Math.round(Math.random() * 0xffffff);
}
</script>
