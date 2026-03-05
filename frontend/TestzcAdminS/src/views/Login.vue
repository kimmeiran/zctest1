<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="login-title">中车考核管理工具</h1>

      <div class="form-group">
        <input type="text" name="username" autocomplete="username" class="form-input" placeholder="账号" v-model="username" />
      </div>

      <div class="form-group">
        <input type="password" name="password" autocomplete="current-password" class="form-input" placeholder="密码" v-model="password" />
      </div>

      <div class="verification-code">
        <input type="text" class="form-input code-input" placeholder="验证码" v-model="verificationCode" />
        <div class="code-display" @click="refreshCaptcha">
          <img
            v-if="captchaImageUrl"
            :src="captchaImageUrl"
            alt="验证码"
            class="captcha-img"
            @click.prevent="refreshCaptcha"
          />
        </div>
      </div>

      <button class="login-button" :disabled="isLoading" @click="handleLogin">{{ isLoading ? '登录中...' : '登录' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { login } from "@/api/user";
import { ElMessage } from "element-plus";

const router = useRouter();

// 登录表单数据
const username = ref("");
const password = ref("");
const verificationCode = ref("");
const isLoading = ref(false);
// 验证码图片 URL（来自后端 GET /api/captcha，与登录同 Session）
const captchaImageUrl = ref("");
const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "";
const refreshCaptcha = () => {
  captchaImageUrl.value = `${getBaseUrl()}/api/captcha?t=${Date.now()}`;
};

// 处理登录
const handleLogin = async () => {
  // 简单验证
  if (!username.value) {
    ElMessage.warning("请输入账号");
    return;
  }

  if (!password.value) {
    ElMessage.warning("请输入密码");
    return;
  }
  if (!verificationCode.value) {
    ElMessage.warning("请输入验证码");
    return;
  }

  isLoading.value = true;

  try {
    let response;
    // 调用真实接口
    response = await login(
      username.value,
      password.value,
      verificationCode.value
    );

    console.log("登录响应", response);

    if (response.code === 200) {
      // 存储登录状态和用户信息
      const token = response.data.token;
      const userInfo = response.data.userInfo;
      localStorage.setItem("token", token);
      sessionStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem(
        "user",
        JSON.stringify({
          username: userInfo.account,
          id: userInfo.id || userInfo.teachId, // 优先使用真正的用户ID（account.getId()），如果没有则使用teachId
          teachId: userInfo.teachId, // 保留teachId字段以备后用
          teachName: userInfo.teachName,
          account: userInfo.account,
          role: userInfo.role,
          status: userInfo.status,
          stationId: userInfo.stationId,
          stationName: userInfo.stationName,
          createTime: userInfo.createTime,
          updateTime: userInfo.updateTime
        })
      );

      // 导航到首页
      router.push("/home");
    } else {
      // 显示错误信息
      ElMessage.error(`登录失败: ${response.msg || "未知错误"}`);
      // 刷新验证码
      refreshCaptcha();
      verificationCode.value = ""; // 清空验证码输入
    }
  } catch (error) {
    console.error("登录失败:", error);
    // 刷新验证码
    refreshCaptcha();
    verificationCode.value = "";
  } finally {
    isLoading.value = false;
  }
};

// 组件挂载时请求后端验证码图片
onMounted(() => {
  refreshCaptcha();
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-box {
  width: 400px;
  padding: 40px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 500;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--color-primary-brand);
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.verification-code {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.code-input {
  flex: 1;
}

.code-display {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100px;
  height: 40px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.captcha-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-button {
  width: 100%;
  height: 40px;
  background-color: var(--color-primary-brand);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover:not(:disabled) {
  background-color: var(--color-primary-brand-hover);
}

.login-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .login-box {
    width: 90%;
    padding: 20px;
  }
}
</style>
