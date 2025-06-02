<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">
        <img src="/logo_name.png" alt="Logo" class="logo-img-full" />
      </div>

      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="loginForm.password" placeholder="密码" prefix-icon="Lock" type="password" show-password />
        </el-form-item>

        <el-form-item class="login-btn">
          <el-button :loading="loading" type="primary" style="width: 100%" @click="handleLogin"> 登录 </el-button>
        </el-form-item>

        <div class="role-hint">
          <p>可用账号：</p>
          <p>管理员：admin / 123456</p>
          <p>销售员：sales / 123456</p>
          <p>采购员：purchase / 123456</p>
          <p>财务专员：finance / 123456</p>
          <p>质检员：qc / 123456</p>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormValidateCallback } from 'element-plus'
import { useUserStore } from '../../stores/user'

// 路由
const router = useRouter()
// 用户store
const userStore = useUserStore()

// 表单引用
const loginFormRef = ref<FormInstance>()
// 加载状态
const loading = ref(false)

// 登录表单
const loginForm = reactive({
  username: 'admin',
  password: '123456'
})

// 表单验证规则
const loginRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
})

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate((valid: boolean) => {
    if (valid) {
      try {
        loading.value = true

        // 调用登录方法
        const result = userStore.login(loginForm.username, loginForm.password)

        if (result.success) {
          ElMessage.success('登录成功')
          router.push('/')
        } else {
          ElMessage.error(result.message || '登录失败')
        }
      } catch (error) {
        console.error('登录失败', error)
        ElMessage.error('登录失败，请稍后再试')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
  background-image: url('/back.png');
  background-size: cover;
  background-position: center;
}

.login-box {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
}

.login-title .logo-img-full {
  width: 100%;
}

.login-form {
  width: 100%;
}

.login-btn {
  margin-top: 20px;
}

.role-hint {
  margin-top: 20px;
  font-size: 12px;
  color: #606266;
}

.role-hint p {
  margin: 3px 0;
}
</style>
