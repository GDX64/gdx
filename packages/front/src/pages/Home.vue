<script setup lang="ts">
import ADown from '../assets/arrow-down.svg?component';
import Button from '../components/Button.vue';
import NavBar from '../components/NavBar.vue';
import Experience from '../components/Experience.vue';
import perfil from '../assets/perfil.jfif?url';
import ProjectPresentation from '../components/ProjectPresentation.vue';
import archpelagusURL from '../assets/project_images/archpelagus_print.jpg?url';
import archpelagusURL2 from '../assets/project_images/boat_render.jpg?url';
import gaussianMergeURL from '../assets/project_images/gaussians.png?url';
import pbdKitesURL from '../assets/project_images/image.jpg?url';
import quadTreeURL from '../assets/project_images/quad_tree.png?url';
import triangleURL from '../assets/project_images/triangle_example.ppm?url';
import birdsURL from '../assets/project_images/birds_example.jpg?url';
import LinkedinRound from '../components/Contacts/LinkedinRound.vue';
import GithubRound from '../components/Contacts/GithubRound.vue';
import InstagramRound from '../components/Contacts/InstagramRound.vue';
import { CVLinks } from '../components/CV/glmachadoCVData';
import Kite from '../components/kite/Kite.vue';
import { estimateRefreshRate, useAsyncComputed } from '@gdx/utils';
import BorderContainer from '../components/BorderContainer.vue';
import { computed, ref, watchEffect } from 'vue';

const refreshRate = useAsyncComputed(async () => {
  return estimateRefreshRate();
}, null);

enum DisplayMode {
  EXPERIENCE,
  EDUCATION,
}
const displayOption = ref(DisplayMode.EXPERIENCE);
const experienceContainer = ref<HTMLElement>();
const educationContainer = ref<HTMLElement>();

watchEffect(() => {
  if (displayOption.value === DisplayMode.EXPERIENCE) {
    experienceContainer.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    educationContainer.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

const experiences = [
  {
    company: 'Nelogica',
    date: '2026 - Now',
    title: 'Software Developer V',
    description:
      'Building international home broker platforms with AI-assisted workflows, real-time systems, and high-performance rendering using WebAssembly (Rust) and WebGPU.',
    tags: ['Rust', 'WebAssembly', 'WebGPU', 'AI'],
  },
  {
    company: 'Nelogica',
    date: '2025 - 2026',
    title: 'Tech Lead - Administrative Systems',
    description:
      'Led a full-stack team responsible for the company intranet and extranet using PHP and TypeScript, driving the rewrite of both systems to modernize architecture and technology stack.',
    tags: ['PHP', 'Typescript', 'FullStack'],
  },
  {
    company: 'Nelogica',
    date: '2024 - 2025',
    title: 'Tech Lead - macOS and Web Platforms',
    description:
      'Led web and macOS trading products, including Profit Web, with TypeScript, Electron, Web Workers, and WebSockets. Platforms reached tens of thousands of users and processed billions of dollars in monthly orders.',
    tags: ['Typescript', 'Electron', 'WebSockets', 'macOS'],
  },
  {
    company: 'Nelogica',
    date: '2024',
    title: 'Software Developer IV',
    description:
      'Led development of Profit Android and Profit iOS with TypeScript, Vue.js, Kotlin, and Swift. Mobile apps reached hundreds of thousands of active users and processed billions of dollars in monthly orders.',
    tags: ['iOS', 'Android', 'Kotlin', 'Swift'],
  },
  {
    company: 'Nelogica',
    date: '2022 - 2024',
    title: 'Software Developer III',
    description:
      'Built and launched the first Profit macOS platform with Electron and TypeScript for real-time market data and order execution.',
    tags: ['Electron', 'Typescript', 'macOS'],
  },
  {
    company: 'Nelogica',
    date: '2021 - 2022',
    title: 'Software Developer II',
    description:
      'Improved runtime performance and initiated the migration of a multi-million-line JavaScript codebase to TypeScript.',
    tags: ['Typescript', 'Performance'],
  },
  {
    company: 'Nelogica',
    date: '2020 - 2021',
    title: 'Software Developer I',
    description:
      'Built trading interfaces for Profit Web and Vector Web using JavaScript, Vue.js, HTML, and CSS.',
    tags: ['Javascript', 'VueJS', 'HTML', 'CSS'],
  },
];

const education = [
  {
    company: 'UFRGS',
    date: 'In Progress',
    title: "Master's in Data Visualization",
    description:
      'Graduate studies focused on data visualization, visual analytics, and interactive systems.',
    tags: ['Data Visualization', 'Visual Analytics'],
  },
  {
    company: 'UFJF',
    date: '2014 - 2019',
    title: "Bachelor's in Electronic Engineering",
    description:
      'Emphasis on signal processing, embedded software, and electronics using Matlab, Python, and C with FreeRTOS.',
    tags: ['DSP', 'Matlab', 'Embedded'],
  },
  {
    company: 'UBA, Buenos Aires',
    date: '2019',
    title: 'Electronic Engineering Exchange Program',
    description:
      'Graduate-level coursework in speech recognition, pattern recognition, biomedical signal processing, and adaptive filtering.',
    tags: ['DSP', 'Matlab'],
  },
  {
    company: 'ETPC, Volta Redonda',
    date: '2011 - 2013',
    title: 'Electro-Mechanical Technician',
    description:
      'Technical school where I learned about electronics, mechanics, and automation, and had my first contact with programming.',
    tags: ['Electronics', 'Mechanics', 'Automation'],
  },
];

const selectedExperienceGroup = computed(() => {
  return displayOption.value === DisplayMode.EXPERIENCE ? experiences : education;
});
</script>

<template>
  <NavBar class="animate-appear animate-delay-[3s]"></NavBar>
  <main
    class="flex flex-col items-center px-2 md:px-10 text-text-prime pb-10 max-w-[1420px] w-full"
  >
    <section
      class="w-full min-h-[calc(100vh-96px)] flex flex-col relative touch-pan-y"
      id="landing"
    >
      <Kite
        class="absolute top-0 left-0 animate-appear"
        v-if="refreshRate"
        :sampleRate="refreshRate"
      ></Kite>
      <div class="grow flex flex-col justify-center py-10">
        <div class="w-full flex justify-between">
          <div class="">
            <label for="" class="text-text-label text-xl font-semibold animate-appear"
              >Hi! My name is</label
            >
            <h1
              class="md:text-6xl text-3xl font-extrabold mb-6 animate-appear animate-delay-[1s]"
            >
              Gabriel Machado
            </h1>
            <label
              for=""
              class="text-text-label text-xl font-semibold animate-appear animate-delay-[2s]"
              >And I am a</label
            >
            <h1
              class="md:text-6xl text-3xl font-extrabold animate-appear animate-delay-[3s]"
            >
              Software Engineer
            </h1>
          </div>
          <div
            class="flex flex-col justify-between md:visible invisible animate-appear animate-delay-[3s]"
          >
            <LinkedinRound></LinkedinRound>
            <GithubRound></GithubRound>
            <InstagramRound></InstagramRound>
          </div>
        </div>
      </div>

      <div class="flex justify-center w-full pb-16 animate-appear animate-delay-[3s]">
        <a href="#about-me">
          <Button class="flex items-center gap-2"><span>About Me</span> <ADown /></Button>
        </a>
      </div>
    </section>
    <section id="about-me" class="w-full pt-20">
      <div
        class="flex justify-between flex-wrap gap-4 [&_a]:decoration-prime-400 [&_a]:underline"
      >
        <div
          id="about-me-content"
          class="max-w-[560px] min-w-[380px] flex flex-col gap-7 text-xl self-start sticky top-[96px]"
        >
          <p>
            In 2020 I graduated in Electrical Engineering at UFJF. But even before that,
            throughout my whole studies I was always deeply interested in science,
            mathemathics and technology.
          </p>
          <p>
            I started programming with relays and logic gates in technical school, and
            then with microcontrollers and MATLAB in college. My
            <a :href="CVLinks.bachelorThesis">bachelor's thesis</a>
            was about signal processing techniques to identify harmonic distortion in
            power systems, implementing signal processing Algorithms in MATLAB, and I am
            quite proud of that.
          </p>
          <p>
            After graduating I started working at Nelogica, where I fell in love with web
            development and graphics programming in the
            <a :href="CVLinks.profitWeb" target="_blank">Profit Web</a> project. Right
            after I got some familiarity with the projects I started to work on
            performance improvements for the aplication and bringing new technologies to
            the stack.
          </p>
          <p>
            Nowdays we manage codebases that target web,
            <a :href="CVLinks.profitChartAndroid" target="_blank">Android</a>,
            <a :href="CVLinks.IOS" target="_blank">IOS</a> and
            <a :href="CVLinks.profitChartMacOS" target="_blank">macOS</a>, with hundreds
            of thousands of active users, trading billions of reais in stocks every day in
            the brazilian, foring market and crypto exchanges.
          </p>
          <p>
            As a side project I am developing a game called
            <a :href="CVLinks.archpelagus" target="_blank">Archpelagus</a>, a Real Time
            Strategy game. I am also always testing with cutting edge web technologies,
            like Webassembly and WebGPU, and from time to time I write about it.
          </p>
        </div>
        <div class="max-w-[min(600px,100%)] grow">
          <div
            class="flex gap-4 cursor-pointer mb-4 items-center text-xl text-text-label font-semibold h-10 underline-offset-4 justify-between"
          >
            <h3
              :class="
                displayOption === DisplayMode.EXPERIENCE ? '!decoration-prime-300' : ''
              "
              @click="displayOption = DisplayMode.EXPERIENCE"
              class="px-2 py-1 rounded-md transition-all decoration-bg-300 underline"
            >
              Experiences
            </h3>
            <h3
              @click="displayOption = DisplayMode.EDUCATION"
              :class="
                displayOption === DisplayMode.EDUCATION ? '!decoration-prime-300' : ''
              "
              class="px-2 py-1 rounded-md transition-all decoration-bg-300 underline"
            >
              Education
            </h3>
          </div>
          <div
            class="overflow-x-auto flex gap-4 no-scrollbar snap-x snap-mandatory max-w-full"
          >
            <div
              class="flex flex-col gap-2 w-full shrink-0 px-2 snap-start scroll-mt-[200px]"
              ref="experienceContainer"
            >
              <Experience
                v-for="exp in experiences"
                :company="exp.company"
                :date="exp.date"
                :title="exp.title"
                :description="exp.description"
                :tags="exp.tags"
                :key="exp.title"
              ></Experience>
            </div>
            <div
              class="flex flex-col gap-2 w-full shrink-0 px-2 snap-start scroll-mt-[200px]"
              ref="educationContainer"
            >
              <Experience
                v-for="exp in education"
                :company="exp.company"
                :date="exp.date"
                :title="exp.title"
                :description="exp.description"
                :tags="exp.tags"
                :key="exp.title"
              ></Experience>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section id="projects" class="py-20">
      <div class="w-full pb-10">
        <label class="text-text-label text-lg font-bold">Personal projects</label>
        <h2 class="font-bold text-5xl mt-5">What I've been working on</h2>
      </div>
      <div
        class="grid xl:grid-cols-[1fr_1fr] grid-cols-1 gap-2"
        style="grid-auto-rows: 1fr"
      >
        <ProjectPresentation
          title="Archpelagus"
          description="This is an RTS game like Age of Empites, but with boats and islands. 
          My backend is written in rust and the frontend in typescript. 
          I am using webassembly to run the game logic in the browser and websockets to communicate with the server. 
          Quite fancy stuff!"
          class="rounded-md row-span-2"
          :tags="['WebgGL', 'WebAssembly', 'Rust', 'ThreeJS', 'WebSockets']"
          :imgURL="[archpelagusURL, archpelagusURL2]"
          url="https://archpelagus.glmachado.com"
        ></ProjectPresentation>
        <ProjectPresentation
          title="Spatial indexing"
          description="Some approaches to spatial indexing, wich is a technique to optimize searchs in space widly used in games like my own."
          :tags="['Algorithms', 'Canvas2D', 'Typescript']"
          :imgURL="quadTreeURL"
          url="/space-index"
        ></ProjectPresentation>
        <ProjectPresentation
          title="Merging Gaussians"
          description="Collapsing a pile of weighted Gaussian kernels into fewer of them using moment matching, with interactive demos in 1D and 2D, covering covariance ellipses, spectral and Cholesky decompositions."
          :tags="['Math', 'Algorithms', 'Canvas2D', 'Typescript']"
          :imgURL="gaussianMergeURL"
          url="/gaussian-merge"
        ></ProjectPresentation>
        <ProjectPresentation
          title="How the kites are drawn"
          description="The kites drifting across the header are a little simulation. This post pulls one apart: filtered noise for wind-like motion, a hand-rolled 3D model-view-projection renderer on the 2D canvas, and Position Based Dynamics for the trailing ropes, with interactive demos."
          :tags="['Signal Processing', '3D', 'Simulation', 'Canvas2D', 'Typescript']"
          :imgURL="pbdKitesURL"
          url="/pbd-kites"
        ></ProjectPresentation>
        <ProjectPresentation
          title="SIMD Rasterization"
          description="Basics with how to do SIMD with rust and compile it to webassembly. I used triangle rasterization as an example as it is highly parallelizable."
          :tags="['WebgGL', 'WebAssembly', 'Rust', 'ThreeJS']"
          :imgURL="triangleURL"
          url="/simd-rasterization"
        ></ProjectPresentation>
        <ProjectPresentation
          title="More fun stuff"
          description="Random cool projects with little context I like to keep around to show to my friends."
          :tags="['WebgGL', 'WebAssembly', 'Rust', 'Typescript']"
          :imgURL="birdsURL"
          url="/more-fun-stuff"
        ></ProjectPresentation>
      </div>
    </section>
    <section id="contact" class="w-full">
      <BorderContainer
        class="min-h-[300px] w-full rounded-lg p-10 flex gap-10 items-start flex-wrap"
      >
        <div class="flex flex-col gap-6 w-min grow">
          <h2 class="font-bold text-3xl">Interested? Let's get in touch!</h2>
          <p class="font-semibold max-w-[600px]">
            If you are interested in my work, or just want to say hi and talk about
            programming, feel free to send me a message. I'd be happy to hear from you!
          </p>
          <div class="grow"></div>
          <div class="flex gap-4">
            <LinkedinRound></LinkedinRound>
            <GithubRound></GithubRound>
            <InstagramRound></InstagramRound>
          </div>
        </div>
        <img :src="perfil" class="rounded-3xl w-[200px] aspect-square grayscale h-auto" />
      </BorderContainer>
    </section>
  </main>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
