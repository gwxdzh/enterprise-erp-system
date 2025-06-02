import { createPinia } from 'pinia';
import type { App } from 'vue';

const pinia = createPinia();

export function setupStore(app: App<Element>) {
  app.use(pinia);
}

export default pinia; 