<script setup lang="ts">
import { ref, watch } from 'vue';
import Button from './Button.vue';
import ADown from '../assets/arrow-down.svg?component';
import Logo from '../assets/logo.svg?component';

const menuOpen = ref(false);

function closeMenu() {
  menuOpen.value = false;
}

// Prevent body scroll while the mobile menu is open.
watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : '';
});
</script>

<template>
  <nav
    class="w-full flex justify-center md:px-10 px-2 py-2 sticky top-0 left-0 backdrop-blur-sm z-20 bg-bg-50/50"
  >
    <div class="flex w-full items-center max-w-[1720px]">
      <div class="grow">
        <a href="/#landing">
          <Logo class="hover:text-hover transition-all hover:scale-105" />
        </a>
      </div>

      <!-- Desktop nav -->
      <ul class="gap-8 items-center font-semibold md:flex hidden m-0">
        <li>
          <a
            class="flex gap-4 transition-colors hover:text-hover hover:underline group"
            href="/#about-me"
            ><span>About Me</span> <ADown class="group-hover:animate-bounce"
          /></a>
        </li>
        <li>
          <a
            class="flex gap-4 transition-colors hover:text-hover hover:underline group"
            href="/#projects"
            ><span>Projects</span> <ADown class="group-hover:animate-bounce"
          /></a>
        </li>
        <li>
          <a
            class="flex gap-4 transition-colors hover:text-hover hover:underline group"
            href="/#contact"
            ><span>Contact</span> <ADown class="group-hover:animate-bounce"
          /></a>
        </li>
        <li>
          <a href="/cv">
            <Button>My Resume</Button>
          </a>
        </li>
      </ul>

      <!-- Mobile hamburger button -->
      <button
        class="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] z-30"
        :aria-expanded="menuOpen"
        aria-label="Toggle navigation menu"
        @click="menuOpen = !menuOpen"
      >
        <span
          class="block w-6 h-[2px] bg-current transition-all duration-300"
          :class="menuOpen ? 'translate-y-[7px] rotate-45' : ''"
        />
        <span
          class="block w-6 h-[2px] bg-current transition-all duration-300"
          :class="menuOpen ? 'opacity-0' : ''"
        />
        <span
          class="block w-6 h-[2px] bg-current transition-all duration-300"
          :class="menuOpen ? '-translate-y-[7px] -rotate-45' : ''"
        />
      </button>
    </div>

    <!-- Mobile menu overlay (teleported to body so `fixed` is relative to the
         viewport, not the backdrop-blurred nav which is its own containing block) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="menuOpen"
          class="md:hidden fixed inset-0 z-30 backdrop-blur-md bg-bg-50/90"
          @click="closeMenu"
        >
          <!-- Close button (X) -->
          <button
            class="absolute top-4 right-4 flex justify-center items-center w-10 h-10"
            aria-label="Close navigation menu"
            @click="closeMenu"
          >
            <span class="absolute block w-6 h-[2px] bg-current rotate-45" />
            <span class="absolute block w-6 h-[2px] bg-current -rotate-45" />
          </button>
        <ul
          class="flex flex-col gap-8 items-start justify-center h-full w-full px-10 font-semibold text-2xl m-0"
          @click.stop
        >
          <li class="w-full">
            <a
              class="flex justify-between items-center gap-4 transition-colors hover:text-hover hover:underline group"
              href="/#landing"
              @click="closeMenu"
              ><span>Home</span> <ADown class="group-hover:animate-bounce -rotate-90"
            /></a>
          </li>
          <li class="w-full">
            <a
              class="flex justify-between items-center gap-4 transition-colors hover:text-hover hover:underline group"
              href="/#about-me"
              @click="closeMenu"
              ><span>About Me</span> <ADown class="group-hover:animate-bounce -rotate-90"
            /></a>
          </li>
          <li class="w-full">
            <a
              class="flex justify-between items-center gap-4 transition-colors hover:text-hover hover:underline group"
              href="/#projects"
              @click="closeMenu"
              ><span>Projects</span> <ADown class="group-hover:animate-bounce -rotate-90"
            /></a>
          </li>
          <li class="w-full">
            <a
              class="flex justify-between items-center gap-4 transition-colors hover:text-hover hover:underline group"
              href="/#contact"
              @click="closeMenu"
              ><span>Contact</span> <ADown class="group-hover:animate-bounce -rotate-90"
            /></a>
          </li>
          <li class="w-full">
            <a
              class="flex justify-between items-center gap-4 transition-colors hover:text-hover hover:underline group"
              href="/cv"
              @click="closeMenu"
              ><span>My Resume</span> <ADown class="group-hover:animate-bounce -rotate-90"
            /></a>
          </li>
        </ul>
        </div>
      </Transition>
    </Teleport>
  </nav>
</template>
