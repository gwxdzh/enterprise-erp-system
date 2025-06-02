import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 引入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 引入路由
import router from './router'
// 引入状态管理
import { setupStore } from './stores'

// 引入全局样式
import './styles/index.css'

const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用Element Plus
app.use(ElementPlus)
// 使用路由
app.use(router)
// 使用状态管理
setupStore(app)

app.mount('#app')
