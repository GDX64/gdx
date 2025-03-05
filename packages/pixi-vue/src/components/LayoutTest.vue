<template>
  <g-container
    :gap="10"
    :padding="20"
    height="100%"
    width="100%"
    :justify="Justify.SpaceAround"
  >
    <g-rect :width="300" :height="200" :fill="0xff0000"></g-rect>
    <g-container :gap="4" :flexDirection="FlexDirection.Row" :padding="0">
      <g-rect :width="500" :fill="0xffff00" :gap="4">
        <g-rect :width="100" :height="50" :fill="0x0000ff"></g-rect>
        <g-rect :width="100" :height="50" :fill="0x0000ff"></g-rect>
        <g-rect :width="100" :height="50" :fill="0x0000ff"></g-rect>
        <g-rect :width="100" :height="50" :fill="0x0000ff"></g-rect>
      </g-rect>
      <g-rect :width="200" :height="200" :fill="0xffffff"></g-rect>
    </g-container>
    <g-rect :width="200" :height="200" :fill="0xffffff"></g-rect>
  </g-container>
</template>

<script setup lang="ts">
import { FlexDirection, Justify } from "yoga-layout";
</script>
