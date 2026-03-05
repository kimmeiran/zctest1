# StudentDetail 组件

## 概述
`StudentDetail` 组件是员工答题详情页的独立组件，用于显示员工的考试详情、题目列表和答案。

## 功能特性
- 显示员工基本信息和考试信息
- 展示客观题（单选题、多选题、判断题、填空题）的答题情况
- 展示主观题（简答题、综合题）的答题情况和评分功能
- 支持主观题分数输入和保存
- 实时更新总分显示

## Props

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| currentStudent | Object | 是 | - | 当前员工信息对象 |
| currentExam | Object | 是 | - | 当前考试信息对象 |
| examTotal | Object | 是 | - | 考试总结信息对象 |
| examDetails | Array | 是 | - | 考试详情数组 |
| isLoadingQuestions | Boolean | 否 | false | 是否正在加载题目 |
| questionsError | String | 否 | null | 题目加载错误信息 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| goBack | - | 返回按钮点击事件 |
| retryFetchQuestions | - | 重试获取题目事件 |
| updateTotalScore | scoreDiff | 总分更新事件，参数为分数差值 |

## 使用方法

```vue
<template>
  <StudentDetail
    :current-student="currentStudent"
    :current-exam="currentExam"
    :exam-total="examTotal"
    :exam-details="examDetails"
    :is-loading-questions="isLoadingQuestions"
    :questions-error="questionsError"
    @go-back="handleGoBack"
    @retry-fetch-questions="handleRetry"
    @update-total-score="handleUpdateScore"
  />
</template>

<script setup>
import StudentDetail from './studentScore/StudentDetail.vue';

// 处理返回事件
const handleGoBack = () => {
  // 返回上一级页面
};

// 处理重试事件
const handleRetry = () => {
  // 重新获取题目数据
};

// 处理总分更新
const handleUpdateScore = (scoreDiff) => {
  // 更新总分显示
};
</script>
```

## 数据结构

### currentStudent 对象结构
```javascript
{
  employeeId: "员工工号",
  employeeName: "员工姓名",
  department: "部门",
  position: "职位"
}
```

### currentExam 对象结构
```javascript
{
  id: "考试ID",
  examLevel: "考试等级",
  applicantCount: "报考人数"
}
```

### examTotal 对象结构
```javascript
{
  employeeId: "员工工号",
  objectiveScore: "客观题得分",
  department: "部门",
  position: "职位",
  employeeName: "员工姓名"
}
```

### examDetails 数组结构
```javascript
[
  {
    id: "题目ID",
    questionSubType: "题目类型", // single, multiple, judge, fillBlank, essay, summary
    questionContent: "题目内容",
    answer: "正确答案",
    studentAnser: "学生答案",
    score: "题目分值",
    subjectiveScore: "主观题得分",
    originalScore: "原始分数"
  }
]
```

## 样式定制
组件使用 scoped 样式，可以通过 CSS 变量或深度选择器进行样式定制。

## 注意事项
1. 组件依赖 Element Plus 的 ElMessage 组件
2. 需要传入完整的员工和考试信息
3. 主观题分数保存后会自动更新总分显示
4. 组件内部处理了图片内容的渲染
