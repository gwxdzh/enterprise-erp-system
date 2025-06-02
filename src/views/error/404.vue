<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <div class="error-desc">抱歉，您访问的页面不存在</div>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.error-content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  color: #409eff;
  margin: 0;
}

.error-desc {
  font-size: 20px;
  color: #666;
  margin: 20px 0 30px;
}
</style>
