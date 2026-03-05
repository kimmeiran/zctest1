import request from "@/utils/request"
import { Response } from './types'

// 获取验证码
export const getCaptchaUrl = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || "";
  return `${baseURL}/api/captcha?`
}

// 登录
export const login = async (username: string, password: string, captcha: string) => {
  try {
    const response = await request.post(
      `/api/login`,
      {
        username,
        password,
        captcha,
      },
      {
        withCredentials: true, // 与 GET /api/captcha 共用 SESSION Cookie，后端才能校验验证码
      },
    )

    // 检查响应状态
    if (response.data.code === 200) {
      // 存储 token 到 localStorage
      if (response.data.data && response.data.data.token) {
        localStorage.setItem("token", response.data.data.token)
      }
    }

    return response.data
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

// 更新密码
export const updatePassword = async (newPassword: string): Promise<Response> => {
  try {
    const response = await request.post(
      `/api/account/updatePassword`,
      { newPassword },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('更新密码失败:', error);
    throw error;
  }
};

// 登出（仅记录日志，不执行其他操作）
export const logout = async (): Promise<Response> => {
  try {
    const response = await request.post(
      `/api/logout`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error('登出日志记录失败:', error);
    throw error;
  }
};
