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
      <OrderComponent
        v-for="order of orders"
        v-model:position-y="order.position"
        :top="order.position"
      ></OrderComponent>
    </g-rect>
  </g-container>
</template>

<script setup lang="ts">
import { Align, Justify } from "yoga-layout";
import { GContainer, GRect } from "#els/appRenderers.ts";
import testImg from "../assets/bat.png";
import OrderComponent from "./OrderComponent.vue";
import { reactive } from "vue";

const img = new Image();
img.src = testImg;

const orders = reactive(
  [...Array(10)].map((_, i) => {
    return {
      id: i,
      position: i * 20 + 20,
      price: Math.random() * 1000,
    };
  })
);
</script>
