<template>
  <g-container
    height="100%"
    width="100%"
    :justify="Justify.SpaceAround"
    :align="Align.FlexStart"
  >
    <g-rect
      width="100%"
      height="100%"
      fill="#223652"
      :padding="30"
      :align="Align.FlexStart"
    >
      <OrderComponent v-for="i of 30" :initial-y="i * 30 + 20"></OrderComponent>
    </g-rect>
  </g-container>
</template>

<script setup lang="ts">
import { Align, Justify } from "yoga-layout";
import { GContainer, GRect } from "#els/appRenderers.ts";
import testImg from "../assets/bat.png";
import OrderComponent from "./OrderComponent.vue";

const img = new Image();
img.src = testImg;
</script>
