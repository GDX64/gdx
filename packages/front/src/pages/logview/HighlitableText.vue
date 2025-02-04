<script lang="ts">
import { defineComponent, h, VNode } from 'vue';

function messageHTML(message: string, search?: string) {
  if (!search) {
    return h('div', message);
  }
  const rgx = new RegExp(search, 'ig');

  const textNodes: VNode[] = [];
  let currentIndex = 0;
  for (const match of message.matchAll(rgx)) {
    const str = match[0];
    const index = match.index;
    textNodes.push(h('span', message.slice(currentIndex, index)));
    textNodes.push(h('span', { class: 'log-view-highlight' }, str));
    currentIndex = index + str.length;
  }
  textNodes.push(h('span', message.slice(currentIndex)));
  return h('div', textNodes);
}

export default defineComponent({
  props: {
    value: {
      type: String,
      required: true,
    },
    search: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    return () => messageHTML(props.value, props.search);
  },
});
</script>

<style>
.log-view-highlight {
  @apply bg-prime-200 rounded-sm;
}
</style>
