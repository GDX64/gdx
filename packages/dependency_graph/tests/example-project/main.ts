import App from "./App.vue";
import { createApp } from "vue";
import { add } from "./some-dep";

createApp(App).mount("#app");
add(1, 2);
