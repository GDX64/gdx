<script setup lang="ts">
import ADown from '../assets/arrow-down.svg?component';
import Button from '../components/Button.vue';
import NavBar from '../components/NavBar.vue';
import Experience from '../components/Experience.vue';
import perfil from '../assets/perfil.jfif?url';
import ProjectPresentation from '../components/ProjectPresentation.vue';
import archpelagusURL from '../assets/project_images/archpelagus_print.jpg?url';
import dataViz from '../assets/project_images/data-visualization.png?url';
import archpelagusURL2 from '../assets/project_images/boat_render.jpg?url';
import quadTreeURL from '../assets/project_images/quad_tree.png?url';
import wasmChart from '../assets/project_images/wasm_chart.png?url';
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
    date: '2024 - Now',
    description:
      'In late 2024 I became tech lead of the Profit Web team to focus again on the Profit Web project as well as web front end libraries and APIs.',
    title: 'Tech Lead',
    tags: ['Web', 'FrontEnd'],
  },
  {
    company: 'Nelogica',
    date: '2023 - 2024',
    title: 'Software Developer IV',
    description:
      'In 2023 I moved to Porto Alegre to work in office with the mobile team using our typescript codebase to target the mobile platforms. Today we have hundreds of thousands active users of the Profit Android and IOS apps monthly.',
    tags: ['iOS', 'Android', 'CapacitorJS'],
  },
  {
    company: 'Nelogica',
    date: '2022 - 2023',
    title: 'Software Developer III',
    description:
      'In late 2022 we developed the Profit Mac project using web technologies and electron, briging our products to thousands of MacOS users.',
    tags: ['Electron', 'MacOS'],
  },
  {
    company: 'Nelogica',
    date: '2021 - 2022',
    title: 'Software Developer II',
    description:
      'As I acquired more skills and experience, I started to guide my work towards the aplication performance and developer tools. In this year I introduced typescript to the web projects.',
    tags: ['Typescript', 'VueJS', 'WebSockets'],
  },
  {
    company: 'Nelogica',
    date: '2020 - 2021',
    title: 'Software Developer I',
    description:
      'In my first year at Nelogica, I worked on the Homebroker and ProfitWeb projects, using vuejs. The homebroker is a trading platform used by thousands of traders every day in several brazilian exchanges.',
    tags: ['Javascript', 'HTML', 'CSS'],
  },
  {
    company: 'PSA (Peugeot Citroën)',
    date: '2019',
    title: 'Engineering Intern',
    description:
      'I worked in the maintenance department, where I helped with spare parts management and maintenance planning.',
    tags: ['Excel'],
  },
];

const education = [
  {
    company: 'Federal University of Juiz de Fora',
    date: '2014 - 2020',
    title: 'Electrical Engineering',
    description:
      'I graduated in Electrical Engineering at the Federal University of Juiz de Fora. My bachelor thesis was about signal processing techniques to identify harmonic distortion in power systems.',
    tags: ['DSP', 'Matlab', 'Electronics'],
  },
  {
    company: 'University of Buenos Aires',
    date: '2019 - 2020',
    title: 'Electronic Engineering Interchange',
    description:
      "I took master's classes: speech recognition, pattern recognition, biomedical signal processing, adaptive filtering. It was a great experience to study in another country and take the classes I was most interested in.",
    tags: ['DSP', 'Matlab'],
  },
  {
    company: 'Escola Técnica Pandiá Calógeras',
    date: '2011 - 2014',
    title: 'Electromechnical Technician',
    description: `I did high school and technical school at the same time, where I learned about electronics, mechanics, and automation. I also had my first contact with programming, using relays and logic gates.`,
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
        <div class="max-w-[560px] min-w-[380px] flex flex-col gap-7 text-xl">
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
              class="flex flex-col gap-2 w-full shrink-0 px-2 snap-start"
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
              class="flex flex-col gap-2 w-full shrink-0 px-2 snap-start"
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
          title="Code Base Visualization"
          description="Visualize your codebase with graphs!"
          :tags="['Algorithms', 'Canvas2D', 'Typescript']"
          :imgURL="dataViz"
          url="/data-visualization"
        ></ProjectPresentation>
        <ProjectPresentation
          title="Wasm Chart"
          description="This is a chart built with rust compiled to webassembly, the idea is to visualize millions of data points at once in real time using some clever trees."
          :tags="['Algorithms', 'WebAssembly', 'Rust', 'Canvas2D']"
          :imgURL="wasmChart"
          url="/wasm-chart"
        ></ProjectPresentation>
        <ProjectPresentation
          title="More fun stuff"
          description="Random cool projects with little context I like to keep around to show to my friends."
          :tags="['WebgGL', 'WebAssembly', 'Rust', 'Typescript']"
          :imgURL="birdsURL"
          url="/more-fun-stuff"
        ></ProjectPresentation>
        <ProjectPresentation
          title="SIMD Rasterization"
          description="Basics with how to do SIMD with rust and compile it to webassembly. I used triangle rasterization as an example as it is highly parallelizable."
          :tags="['WebgGL', 'WebAssembly', 'Rust', 'ThreeJS']"
          :imgURL="triangleURL"
          url="/simd-rasterization"
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
