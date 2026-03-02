import { createSSRApp } from 'vue'
import App from './App.vue'

// UnoCSS
import 'uno.css'
import 'virtual:uno.css'

// Pinia
import { createPinia } from 'pinia'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  app.use(pinia)

  // 挂载到 globalData 供工具函数使用
  // @ts-ignore
  if (typeof getApp !== 'undefined') {
    // @ts-ignore
    const globalApp = getApp()
    if (globalApp && !globalApp.globalData) {
      // @ts-ignore
      globalApp.globalData = {}
    }
    if (globalApp && globalApp.globalData) {
      // @ts-ignore
      globalApp.globalData.store = pinia
    }
  }

  return {
    app
  }
}
