// 某个莫名其妙的没 polyfill
import 'core-js/features/array/flat-map';

import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
