import { onScopeDispose, reactive } from 'vue';
import { createUseMain } from './renderer/useStuff';

export const { useOnThread: useTest } = createUseMain(() => {
  const state = reactive({
    list: ['item 1'] as string[],
  });

  async function updateList() {
    state.list.push(`Item ${state.list.length + 1}`);
  }

  onScopeDispose(() => {
    // Clean up resources if needed
  });

  return {
    state,
    actions: {
      updateList,
    },
  };
}, 'my-identifier');
