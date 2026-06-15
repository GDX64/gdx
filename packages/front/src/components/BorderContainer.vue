<template>
  <div
    class="hover:bg-prime-100 rounded-md transition-all card-shadow bg-bg-100 border border-bg-400 hover:border-prime-500"
  >
    <slot></slot>
  </div>
</template>

<style scoped>
.card-shadow {
  box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.2);
}
</style>
