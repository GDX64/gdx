<template>
  <div
    class="flex w-full justify-center items-center leading-relaxed text-sec-950 relative group/cv"
  >
    <div class="cv-container px-4 py-4 flex flex-col">
      <header class="flex items-start flex-col text-sm">
        <div class="flex items-start justify-between w-full">
          <h1 class="text-prime-800 text-xl sm:text-3xl mb-2">{{ cvData.name }}</h1>
          <a
            href="/CV_Gabriel_Machado.pdf"
            download="cv_gabriel_machado.pdf"
            class="group-hover/cv:opacity-100 group-hover/cv:scale-100 opacity-0 scale-75 transition-all"
            v-if="hasDownload"
          >
            <Download
              class="w-9 h-9 text-prime-800 rounded-md border-2 border-prime-800 p-1 hover:bg-prime-200 cursor-pointer"
            ></Download>
          </a>
        </div>
        <h2 class="text-prime-800 text-xl mb-4">{{ cvData.title }}</h2>
        <div
          class="w-full grid justify-start grid-cols-[min-content_min-content] gap-2 text-xs mb-2"
          :class="{
            'sm:grid-cols-3': cvData.arrUserInfo.length > 5,
            'sm:grid-cols-4': cvData.arrUserInfo.length === 4,
          }"
        >
          <template v-for="userInfo of cvData.arrUserInfo">
            <div class="flex w-max pr-2">
              <component
                :is="componentMap[userInfo.icon]"
                class="cv-icon fill-sec-700"
              ></component
              ><a :href="userInfo.link" v-if="userInfo.link">{{ userInfo.text }}</a>
              <span v-else class="whitespace-nowrap">{{ userInfo.text }}</span>
            </div>
          </template>
        </div>
      </header>
      <div v-for="(category, categoryIndex) of cvData.categories">
        <FieldTitleVue :title="category.title"></FieldTitleVue>
        <template v-for="(data, fieldIndex) of category.fields">
          <FieldVue
            :main="data.title"
            :date-and-place="data.schoolPlaceDate"
            :description="data.description"
            class="mb-2"
          ></FieldVue>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import FieldVue from './CVField.vue';
import FieldTitleVue from './FieldTitle.vue';
import GitHub from '../../assets/github-brands.svg';
import Globe from '../../assets/globe-solid.svg';
import Envelope from '../../assets/envelope-solid.svg';
import Location from '../../assets/location-pin-solid.svg';
import Mobile from '../../assets/mobile-solid.svg';
import Linkedin from '../../assets/linkedin-brands.svg';
import { Icons } from './SimpleCVTypes';
import { injectCV } from './CVStore';
import Download from '../../assets/download.svg?component';

const { data: cvData } = injectCV();
defineProps<{
  hasDownload: boolean;
}>();

const componentMap = {
  [Icons.Globe]: Globe,
  [Icons.Mobile]: Mobile,
  [Icons.GitHub]: GitHub,
  [Icons.Envelope]: Envelope,
  [Icons.Location]: Location,
  [Icons.Linkedin]: Linkedin,
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Lato&display=swap');

@media screen and (min-width: 800px) {
  .cv-container {
    min-height: 1123px;
  }
}

.cv-container {
  max-width: 794px;
  font-family: 'Lato', sans-serif;
  overflow: hidden;
}

.cv-container a {
  @apply text-prime-600 underline;
}

.cv-icon {
  height: 16px;
  margin-right: 5px;
}
</style>
