<script setup lang="ts">
import NavBar from '../../components/NavBar.vue';
import SimpleProjectPresentation from '../../components/SimpleProjectPresentation.vue';
import gravity from '../../assets/project_images/gravity.jpg?url';
import projections from '../../assets/project_images/projections.jpg?url';
import birds from '../../assets/project_images/birds_example.jpg?url';
import stack from '../../assets/project_images/stack_boxes.jpg?url';
</script>

<template>
  <NavBar></NavBar>
  <main
    class="flex flex-col px-2 md:px-10 text-text-prime pb-10 max-w-[1420px] w-full pt-16"
  >
    <h1 class="text-5xl font-bold">More Fun Stuff</h1>
    <div class="text-xl mt-10">
      <p>
        Here are some of my projects that do not have much context or are kind of
        incomplete. They might interest you somehow, though. So give a look and try to
        click around.
      </p>
    </div>

    <section class="grid grid-cols-1 gap-4 mt-16 sm:grid-cols-2">
      <SimpleProjectPresentation
        title="Gravity"
        description="This is not quite gravity, it is just an n-body simulation that I made to run some wasm code."
        :img-u-r-l="gravity"
        url="/gravity"
      ></SimpleProjectPresentation>
      <SimpleProjectPresentation
        title="Projections"
        description="Just a visualization of how to project a point into a plane. It was made with canvas 2d and DOMMatrix only."
        :img-u-r-l="projections"
        url="/archpelagus"
      ></SimpleProjectPresentation>
      <SimpleProjectPresentation
        title="Test Renderer"
        description="Sometimes I try to make custom renderers for vuejs and other libraries. Once I did one for solid. This example
        was made with vue custom renderer and pixijs. The birds are boids, they try to get together and fly together, but try no to 
        collide. A bunch of happy birds flying around."
        :img-u-r-l="birds"
        url="/libtest"
      ></SimpleProjectPresentation>
      <SimpleProjectPresentation
        title="Stack boxes"
        description="This project is more of a test for a feature in my work. I needed a layout algorithm that would stack boxes putting them
        as close as possible to the place where they wanted to be but without overlapping or going out of the screen. What I ended up doing is
        calculating the center of mass of the desired position of the boxes and recursively groupping them such that the resulting group
        would itself have its center of mass in the same position as the desired one. Pretty fancy stuff (not really)."
        :img-u-r-l="stack"
        url="/stack"
      ></SimpleProjectPresentation>
    </section>
  </main>
</template>
