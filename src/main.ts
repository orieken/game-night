import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { installGlobalErrorReporting, reportClientError } from './services/errorReporter'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.config.errorHandler = (error, instance, info) => {
  reportClientError({
    kind: 'vue',
    error,
    component: instance?.$options.name ?? null,
    info
  })
  console.error(error)
}

installGlobalErrorReporting()

app.mount('#app')
