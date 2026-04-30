import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/styles/weixin.css';
import { initializeTheme } from './utils/themeSync';

const app = createApp(App);

initializeTheme();

app.use(router);
app.mount('#app');
