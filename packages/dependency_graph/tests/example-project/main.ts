import App from "./App.vue";
import { createApp } from "vue";
import { add } from "./some-dep";
import { awaitTime } from "@gdx/utils";

createApp(App).mount("#app");
awaitTime(1000).then(() => {
  add(1, 2);
});
