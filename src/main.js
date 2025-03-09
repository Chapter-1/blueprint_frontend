import './assets/main.css';
import '../node_modules/vue-awesome-paginate/dist/style.css';
import './assets/tailwind.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import VueAwesomePaginate from 'vue-awesome-paginate';

import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

import App from './App.vue';
import router from './router';

library.add(fas, far, fab);

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(VueAwesomePaginate);

app.component('font-awesome-icon', FontAwesomeIcon);

app.mount('#app');

// Kakao SDK 불러오기
import.meta.env.VITE_KAKAO_JS_KEY && (() => {
    const script = document.createElement("script");
    script.src = "https://developers.kakao.com/sdk/js/kakao.min.js";
    script.onload = () => {
      // Kakao SDK 초기화
      Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY);
      console.log("Kakao SDK 초기화:", Kakao.isInitialized());
    };
    document.head.appendChild(script);
  })();