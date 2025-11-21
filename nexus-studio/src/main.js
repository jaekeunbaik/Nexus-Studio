import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.config.errorHandler = (err, instance, info) => {
    console.error("Global Error:", err, info);
    // Create a visible error message on the screen
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.backgroundColor = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.padding = '20px';
    errorDiv.style.whiteSpace = 'pre-wrap';
    errorDiv.innerText = `Runtime Error: ${err.message}\n${info}`;
    document.body.appendChild(errorDiv);
};

app.mount('#app')
