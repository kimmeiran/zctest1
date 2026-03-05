/**
 * 表单验证工具函数
 * 提供常用的表单字段验证方法
 */

/**
 * 验证必填字段
 * @param {string} value - 字段值
 * @param {string} fieldName - 字段名称（用于错误消息）
 * @returns {string} 错误消息，如果验证通过则返回空字符串
 */
export const validateRequired = (value, fieldName = '此字段') => {
  if (!value && value !== 0) return `请输入${fieldName}`;
  if (typeof value === 'string' && !value.trim()) return `请输入${fieldName}`;
  return '';
};

/**
 * 验证数字
 * @param {string|number} value - 字段值
 * @param {string} fieldName - 字段名称（用于错误消息）
 * @returns {string} 错误消息，如果验证通过则返回空字符串
 */
export const validateNumber = (value, fieldName = '此字段') => {
  if (value === '' || value === null || value === undefined) return '';
  if (!/^\d+$/.test(String(value))) return `${fieldName}必须是数字`;
  return '';
};

/**
 * 验证姓名（不能包含数字）
 * @param {string} value - 字段值
 * @param {string} fieldName - 字段名称（用于错误消息）
 * @returns {string} 错误消息，如果验证通过则返回空字符串
 */
export const validateName = (value, fieldName = '姓名') => {
  if (!value) return '';
  if (/\d/.test(value)) return `${fieldName}不能包含数字`;
  return '';
};

/**
 * 验证电子邮件
 * @param {string} value - 字段值
 * @returns {string} 错误消息，如果验证通过则返回空字符串
 */
export const validateEmail = (value) => {
  if (!value) return '';
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(value)) return '请输入有效的电子邮件地址';
  return '';
};

/**
 * 验证手机号码
 * @param {string} value - 字段值
 * @returns {string} 错误消息，如果验证通过则返回空字符串
 */
export const validatePhone = (value) => {
  if (!value) return '';
  // 中国大陆手机号验证规则
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(value)) return '请输入有效的手机号码';
  return '';
};

/**
 * 验证字符串长度
 * @param {string} value - 字段值
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @param {string} fieldName - 字段名称（用于错误消息）
 * @returns {string} 错误消息，如果验证通过则返回空字符串
 */
export const validateLength = (value, min, max, fieldName = '此字段') => {
  if (!value) return '';
  if (min && value.length < min) return `${fieldName}长度不能少于${min}个字符`;
  if (max && value.length > max) return `${fieldName}长度不能超过${max}个字符`;
  return '';
};

/**
 * 验证两个字段是否相同（如密码和确认密码）
 * @param {string} value1 - 第一个字段值
 * @param {string} value2 - 第二个字段值
 * @param {string} fieldName - 字段名称（用于错误消息）
 * @returns {string} 错误消息，如果验证通过则返回空字符串
 */
export const validateMatch = (value1, value2, fieldName = '两个字段') => {
  if (!value1 || !value2) return '';
  if (value1 !== value2) return `${fieldName}不匹配`;
  return '';
};

/**
 * 验证表单字段
 * @param {Object} form - 表单数据对象
 * @param {Object} rules - 验证规则对象
 * @returns {Object} 包含错误信息的对象
 */
export const validateForm = (form, rules) => {
  const errors = {};
  let isValid = true;

  for (const field in rules) {
    const fieldRules = rules[field];
    let fieldError = '';

    // 遍历字段的所有验证规则
    for (const rule of fieldRules) {
      const { validator, params = [], message } = rule;
      
      // 执行验证函数
      const error = validator(form[field], ...params);
      
      if (error) {
        fieldError = message || error;
        isValid = false;
        break;
      }
    }

    errors[field] = fieldError;
  }

  return { errors, isValid };
};