<template>
  <BorderContainer
    class="rounded-md p-3 pb-5 transition-transform flex flex-col min-h-[400px] group"
  >
    <div class="w-full grow flex flex-col gap-2 overflow-hidden">
      <div
        class="w-full relative rounded-md overflow-hidden grow min-h-[250px]"
        v-for="url of [imgURL].flat()"
      >
        <img
          loading="lazy"
          :src="url"
          alt="Project image"
          class="absolute top-0 left-0 w-full h-full object-cover bg-bg-950 cursor-pointer"
          @click="goToLink"
        />
      </div>
    </div>
    <div class="flex justify-between items-center">
      <h3 class="font-bold text-2xl py-2 cursor-pointer" @click="goToLink">
        {{ title }}
      </h3>
      <button @click="goToLink">
        <Arrow
          class="group-hover:text-prime-500 transition-all group-hover:animate-pointd"
        ></Arrow>
      </button>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <h4 class="text-text-label font-semibold">Tags</h4>
      <h4 class="text-text-label font-semibold">Description</h4>
      <TagList :tags="tags" class="flex-wrap h-min" />
      <p>{{ description }}</p>
    </div>
  </BorderContainer>
</template>

<script setup lang="ts">
import TagList from './TagList.vue';
import Arrow from '../assets/arrow-ne.svg?component';
import { useRouter } from 'vue-router';
import BorderContainer from './BorderContainer.vue';

const props = defineProps<{
  title: string;
  tags: string[];
  description: string;
  imgURL: string | string[];
  url: string;
}>();

const router = useRouter();

function goToLink() {
  if (props.url.startsWith('http')) {
    window.open(props.url, '_blank');
  } else {
    router.push({
      path: props.url,
    });
  }
}
</script>
