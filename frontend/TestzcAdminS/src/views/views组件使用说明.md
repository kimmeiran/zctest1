# Views 组件使用说明

本文档按照 Main.vue 的菜单结构组织，方便快速查找组件。

## 📋 目录

- [主要路由组件](#主要路由组件)
- [Main.vue 菜单结构](#mainvue-菜单结构)
  - [账号管理](#账号管理)
  - [考核站管理](#考核站管理)
  - [字典管理](#字典管理)
  - [部门管理](#部门管理)
  - [资源题库](#资源题库)
  - [组卷管理](#组卷管理)
  - [组卷规则](#组卷规则)
  - [技能考核](#技能考核)
  - [考核成绩](#考核成绩)
  - [报名人员管理](#报名人员管理)
- [子组件详细说明](#子组件详细说明)
- [未使用或备份文件](#未使用或备份文件)

---

## 主要路由组件

### Main.vue
- **状态**: ✅ 已使用
- **路由**: `/home`
- **功能**: 主页面，包含侧边栏导航和内容区域，根据用户角色显示不同的菜单项
- **引用位置**: `src/router.ts`

### Login.vue
- **状态**: ✅ 已使用
- **路由**: `/login`
- **功能**: 登录页面，包含账号、密码和验证码输入
- **引用位置**: `src/router.ts`

### FilePreview.vue
- **状态**: ✅ 已使用
- **路由**: `/preview`
- **功能**: 文件预览页面，用于预览文档
- **引用位置**: `src/router.ts`、`src/router/index.ts`

---

## Main.vue 菜单结构

Main.vue 根据用户角色显示不同的菜单。以下按照完整菜单结构（总管理员 role=6）组织，并标注各角色的可见性。

### 账号管理

**菜单文字**: "账号管理"（子菜单）

#### 管理部门列表
- **菜单文字**: "管理部门列表"
- **组件**: `account/index.vue` (AdminManagement)
- **状态**: ✅ 已使用
- **activeView**: `teacherList`
- **引用位置**: `Main.vue` (第228行、第285行)
- **功能**: 管理员列表管理，包括搜索、新增、编辑、删除管理员
- **可见角色**: 总管理员 (role=6)
- **子组件**: 
  - `account/AccountModal.vue` - 账号新增/编辑弹窗

#### 职工列表
- **菜单文字**: "职工列表"
- **组件**: `student/index.vue` (WorkerManagement)
- **状态**: ✅ 已使用
- **activeView**: `student`
- **引用位置**: `Main.vue` (第229行、第286行)
- **功能**: 职工列表管理，包括搜索、新增、导入、批量下载、编辑、删除职工
- **可见角色**: 所有角色（总管理员、考核站管理员等）

---

### 考核站管理

**菜单文字**: "考核站管理"

- **组件**: `examStation/index.vue` (ExamStationManagement)
- **状态**: ✅ 已使用
- **activeView**: `考核站管理`
- **引用位置**: `Main.vue` (第243行、第298行)
- **功能**: 考核站管理，包括考核站的增删改查
- **可见角色**: 总管理员 (role=6)

---

### 字典管理

**菜单文字**: "字典管理"

- **组件**: `DictionaryManagement.vue`
- **状态**: ✅ 已使用
- **activeView**: `字典管理`
- **引用位置**: `Main.vue` (第241行、第296行)
- **功能**: 字典管理，包括职业(工种)、技能等级等字典数据的增删改查
- **可见角色**: 总管理员 (role=6)

---

### 部门管理

**菜单文字**: "部门管理"

- **组件**: `department/DepartmentManagement.vue`
- **状态**: ✅ 已使用
- **activeView**: `部门管理`
- **引用位置**: `Main.vue` (第242行、第297行)
- **功能**: 部门管理，包括部门的树形结构展示、新增、编辑、删除
- **可见角色**: 总管理员 (role=6)

---

### 资源题库

**菜单文字**: "资源题库"

- **组件**: `BasicExamManage.vue`
- **状态**: ✅ 已使用
- **activeView**: `资源题库`
- **引用位置**: `Main.vue` (第230行、第287行)
- **功能**: 资源题库管理，包括题库列表、新增、编辑、删除、导入题目、查看题目等
- **可见角色**: 总管理员 (role=6)、命题专家 (role=2)、审题专家 (role=3)
- **子组件**: 
  - `question/QuestionList.vue` - 题库列表
  - `question/QuestionModal.vue` - 题库新增/编辑弹窗
  - `question/QuestionTable.vue` - 题目表格
  - `question/ImportResultModal.vue` - 导入结果弹窗
  - `question/ImportQuestion.vue` - 导入题目页面

#### ⚠️ 未使用的组件
- **ProExamManage.vue**: 主观题库管理（已导入但未在模板中使用，可能为历史遗留代码）

---

### 组卷管理

**菜单文字**: "组卷管理"

> **注意**: 菜单中显示为"组卷管理"，但实际上对应的是"手动组卷"功能。自动组卷和历史手动组卷功能已注释但组件仍在使用。

#### 手动组卷（当前使用）
- **菜单文字**: "组卷管理"（实际对应手动组卷）
- **组件**: `new/PaperManagement2.vue`
- **状态**: ✅ 已使用
- **activeView**: `手动组卷`
- **引用位置**: `Main.vue` (第233行、第290行)
- **功能**: 手动组卷管理，包括试卷列表、新增、编辑、删除、派发、下载等
- **可见角色**: 所有角色（总管理员、管理、命题专家、审题专家、考核站管理员）
- **子组件**: 
  - `new/ManualPaperPage.vue` - 手动组卷页面
  - `new/PaperDetailView.vue` - 试卷详情视图
  - `new/AutoPaperModal.vue` - 自动组卷弹窗
  - `new/manualPaper/QuestionBankPickerModal.vue` - 题库选择弹窗

#### 自动组卷（已注释但组件仍在使用）
- **组件**: `AutoPaperManage.vue`
- **状态**: ✅ 已使用（菜单中已注释）
- **activeView**: `自动组卷`
- **引用位置**: `Main.vue` (第232行、第292行)
- **功能**: 自动组卷管理
- **备注**: 菜单中已注释该功能，但组件仍在使用

#### 历史手动组卷（已注释但组件仍在使用）
- **组件**: `PaperManagement.vue`
- **状态**: ✅ 已使用（菜单中已注释）
- **activeView**: `历史手动组卷`
- **引用位置**: `Main.vue` (第234行、第289行)
- **功能**: 历史手动组卷管理
- **备注**: 菜单中已注释该功能，但组件仍在使用

---

### 组卷规则

**菜单文字**: "组卷规则"

- **组件**: `questionGroupRule/QuestionGroupRule.vue`
- **状态**: ✅ 已使用
- **activeView**: `组卷规则`
- **引用位置**: `Main.vue` (第237行、第293行)
- **功能**: 组卷规则管理，包括规则列表、新增、编辑、删除
- **可见角色**: 总管理员 (role=6)
- **子组件**: 
  - `questionGroupRule/RuleDialog.vue` - 规则编辑弹窗

---

### 技能考核

**菜单文字**: "技能考核"

- **组件**: `SkillExam.vue`
- **状态**: ✅ 已使用
- **activeView**: `技能考核`
- **引用位置**: `Main.vue` (第235行、第300行)
- **功能**: 技能考试管理，包括试卷上传、文件列表、筛选等
- **可见角色**: 总管理员 (role=6)

---

### 考核成绩

**菜单文字**: "考核成绩"（子菜单）

#### 成绩列表
- **菜单文字**: "成绩列表"
- **组件**: `StudentScore.vue`
- **状态**: ✅ 已使用
- **activeView**: `查看成绩`
- **引用位置**: `Main.vue` (第238行、第294行)
- **功能**: 查看成绩，包括考试列表、学生列表、题目查看、成绩分析等
- **可见角色**: 总管理员 (role=6)、考核站管理员 (role=4，含原阅卷专家权限)
- **子组件**: 
  - `ExamAnalysis.vue` - 考试分析
  - `studentScore/StudentDetail.vue` - 学生详情

#### 成绩分析
- **菜单文字**: "成绩分析"
- **组件**: `ScoreAnalysis.vue`
- **状态**: ✅ 已使用
- **activeView**: `成绩分析`
- **引用位置**: `Main.vue` (第239行、第299行)
- **功能**: 成绩分析，包括总体统计、按工种和等级分组的统计分析
- **可见角色**: 总管理员 (role=6)、考核站管理员 (role=4，含原阅卷专家权限)

---

### 报名人员管理

**菜单文字**: "报名人员管理"

- **组件**: `teachExam/ExamPapers.vue`
- **状态**: ✅ 已使用
- **activeView**: `考试试卷`
- **引用位置**: `Main.vue` (第236行、第301行)
- **功能**: 考试试卷管理（报名人员管理），包括试卷列表、筛选、查看报名人员等
- **可见角色**: 总管理员 (role=6)、考核站管理员 (role=4，含原阅卷专家权限)
- **子组件**: 
  - `teachExam/ExamApplicants.vue` - 考试报名人员列表

---

### 考试人员管理（已注释但组件仍在使用）

**菜单文字**: "考试人员管理"（菜单中已注释）

- **组件**: `ClassManagement.vue`
- **状态**: ✅ 已使用（菜单中已注释）
- **activeView**: `考试人员管理`
- **引用位置**: `Main.vue` (第240行、第295行)
- **功能**: 考试人员管理，包括人员的增删改查、批量导入
- **备注**: 菜单中已注释该功能，但组件仍在使用

---

## 角色权限说明

Main.vue 根据用户角色显示不同的菜单。**当前仅保留三类角色**：4 考核站管理员、5 总管理、8 审卷专家（原管理与总管理员已合并为 5 总管理）。

### 角色定义（仅三类）
- **role=4**: 考核站管理员（含阅卷/判分、成绩导入等；无资源题库、组卷管理）
- **role=5**: 总管理（原管理+总管理员合并，所有权限）
- **role=8**: 审卷专家

### 各角色可见菜单

#### 总管理 (role=5)
- 账号管理（管理员列表、职工列表）
- 考核站管理、字典管理
- 资源题库、组卷规则、组卷管理
- 考试管理、试卷申请
- 考核成绩（成绩列表）、证书管理、技能考核
- 日志监控

#### 考核站管理员 (role=4)
- 职工列表、试卷申请、组卷规则
- 考试管理、考核成绩（成绩列表）、证书管理、技能考核

#### 审卷专家 (role=8)
- 组卷管理

---

## 子组件详细说明

### question/ 目录下的组件

#### QuestionList.vue
- **状态**: ✅ 已使用
- **引用位置**: `BasicExamManage.vue` (第35行)
- **功能**: 题库列表展示，包括搜索、分页、操作按钮等

#### QuestionModal.vue
- **状态**: ✅ 已使用
- **引用位置**: `BasicExamManage.vue` (第36行)
- **功能**: 题库新增/编辑弹窗

#### QuestionTable.vue
- **状态**: ✅ 已使用
- **引用位置**: `BasicExamManage.vue` (第37行)
- **功能**: 题目表格展示，包括题目的增删改查
- **子组件**: `AddQuestionModal.vue` - 添加题目弹窗

#### ImportResultModal.vue
- **状态**: ✅ 已使用
- **引用位置**: `BasicExamManage.vue` (第38行)
- **功能**: 导入结果弹窗，显示导入成功或失败的结果

#### ImportQuestion.vue
- **状态**: ✅ 已使用
- **引用位置**: `BasicExamManage.vue` (第39行)
- **功能**: 导入题目页面
- **子组件**: `PreviewModal.vue` - 预览弹窗

#### AddQuestionModal.vue
- **状态**: ✅ 已使用
- **引用位置**: `QuestionTable.vue` (第317行)
- **功能**: 添加题目弹窗
- **子组件**:
  - `editQuestion/BaseInfoSelect.vue` - 基础信息选择
  - `editQuestion/QuestionContent.vue` - 题目内容编辑

#### PreviewModal.vue
- **状态**: ✅ 已使用
- **引用位置**: `ImportQuestion.vue` (第324行)
- **功能**: 预览弹窗

#### editQuestion/BaseInfoSelect.vue
- **状态**: ✅ 已使用
- **引用位置**: `AddQuestionModal.vue` (第298行)
- **功能**: 基础信息选择组件

#### editQuestion/QuestionContent.vue
- **状态**: ✅ 已使用
- **引用位置**: `AddQuestionModal.vue` (第299行)
- **功能**: 题目内容编辑组件

---

### new/ 目录下的组件

#### ManualPaperPage.vue
- **状态**: ✅ 已使用
- **引用位置**: `PaperManagement2.vue` (第377行)
- **功能**: 手动组卷页面，包括试卷基本信息、题库选择、题目选择等
- **子组件**: `manualPaper/QuestionBankPickerModal.vue` - 题库选择弹窗

#### PaperDetailView.vue
- **状态**: ✅ 已使用
- **引用位置**: `PaperManagement2.vue` (第378行)
- **功能**: 试卷详情视图

#### AutoPaperModal.vue
- **状态**: ✅ 已使用
- **引用位置**: `PaperManagement2.vue` (第379行)
- **功能**: 自动组卷弹窗

#### manualPaper/QuestionBankPickerModal.vue
- **状态**: ✅ 已使用
- **引用位置**: `ManualPaperPage.vue` (第153行)
- **功能**: 题库选择弹窗

---

### account/ 目录下的组件

#### AccountModal.vue
- **状态**: ✅ 已使用
- **引用位置**: `account/index.vue` (第212行)
- **功能**: 账号新增/编辑弹窗

---

### questionGroupRule/ 目录下的组件

#### RuleDialog.vue
- **状态**: ✅ 已使用
- **引用位置**: `QuestionGroupRule.vue` (第45行)
- **功能**: 组卷规则编辑弹窗

---

### studentScore/ 目录下的组件

#### StudentDetail.vue
- **状态**: ✅ 已使用
- **引用位置**: `StudentScore.vue` (第279行)
- **功能**: 学生详情页面，显示员工的考试详情、题目列表和答案
- **说明**: 包含客观题和主观题的展示，支持主观题评分功能
- **文档**: 该组件有详细的 README.md 说明文档

#### index.js
- **状态**: ⚠️ 存在但未使用
- **功能**: 可能是导出文件或配置文件
- **备注**: 需要确认其用途

#### README.md
- **状态**: ✅ 文档文件
- **功能**: StudentDetail 组件的使用说明文档

---

### teachExam/ 目录下的组件

#### ExamApplicants.vue
- **状态**: ✅ 已使用
- **引用位置**: `ExamPapers.vue` (第148行)
- **功能**: 考试报名人员列表

---

## 未使用或备份文件

### 历史备份文件

#### history/Main copy.vue
- **状态**: ❌ 未使用
- **功能**: Main.vue 的历史备份文件
- **建议**: 可以删除

#### department/DepartmentManagement copy.vue
- **状态**: ❌ 未使用
- **功能**: DepartmentManagement.vue 的备份文件
- **建议**: 可以删除

#### student/WorkerManagement copy.vue
- **状态**: ❌ 未使用
- **功能**: WorkerManagement 的备份文件
- **建议**: 可以删除

#### new/AutoPaperModal copy.vue
- **状态**: ❌ 未使用
- **功能**: AutoPaperModal.vue 的备份文件
- **建议**: 可以删除

#### new/AutoPaperModal copy 2.vue
- **状态**: ❌ 未使用
- **功能**: AutoPaperModal.vue 的备份文件
- **建议**: 可以删除

#### new/ManualPaperPage copy.vue
- **状态**: ❌ 未使用
- **功能**: ManualPaperPage.vue 的备份文件
- **建议**: 可以删除

---

### 路由中引用但文件不存在的组件

#### PersonalCenter.vue
- **状态**: ⚠️ 路由中引用但文件不存在
- **路由**: `/personal-center` (在 `src/router/index.ts` 中定义)
- **功能**: 个人中心页面（推测）
- **引用位置**: `src/router/index.ts` (第9行)
- **备注**: 文件不存在，可能是遗留的路由配置

#### ExamDetail.vue
- **状态**: ⚠️ 路由中引用但文件不存在
- **路由**: `/exam-detail` (在 `src/router/index.ts` 中定义)
- **功能**: 考试详情页面（推测）
- **引用位置**: `src/router/index.ts` (第14行)
- **备注**: 文件不存在，可能是遗留的路由配置

#### ScorePage.vue
- **状态**: ⚠️ 路由中引用但文件不存在
- **路由**: `/score-page` (在 `src/router/index.ts` 中定义)
- **功能**: 成绩页面（推测）
- **引用位置**: `src/router/index.ts` (第24行)
- **备注**: 文件不存在，可能是遗留的路由配置

---

## 组件使用统计

### 总览
- **总组件数**: 约 40+ 个
- **已使用组件**: 约 35 个
- **未使用组件**: 约 5-7 个（主要是备份文件）
- **路由中引用但文件不存在**: 3 个（PersonalCenter.vue、ExamDetail.vue、ScorePage.vue）

### 主要功能模块
1. **账号管理**: 2 个组件
2. **题库管理**: 9 个组件
3. **组卷管理**: 7 个组件
4. **考试管理**: 2 个组件
5. **成绩管理**: 3 个组件
6. **系统管理**: 4 个组件

---

## 快速查找指南

### 按菜单文字查找组件

| 菜单文字 | 组件路径 | activeView |
|---------|---------|-----------|
| 管理部门列表 | `account/index.vue` | `teacherList` |
| 职工列表 | `student/index.vue` | `student` |
| 考核站管理 | `examStation/index.vue` | `考核站管理` |
| 字典管理 | `DictionaryManagement.vue` | `字典管理` |
| 部门管理 | `department/DepartmentManagement.vue` | `部门管理` |
| 资源题库 | `BasicExamManage.vue` | `资源题库` |
| 组卷管理 | `new/PaperManagement2.vue` | `手动组卷` |
| 组卷规则 | `questionGroupRule/QuestionGroupRule.vue` | `组卷规则` |
| 技能考核 | `SkillExam.vue` | `技能考核` |
| 成绩列表 | `StudentScore.vue` | `查看成绩` |
| 成绩分析 | `ScoreAnalysis.vue` | `成绩分析` |
| 报名人员管理 | `teachExam/ExamPapers.vue` | `考试试卷` |

---

## 注意事项

1. **组卷管理**: 菜单中显示为"组卷管理"，但实际上对应的是"手动组卷"功能（`PaperManagement2.vue`）。自动组卷和历史手动组卷功能已注释但组件仍在使用。

2. **ProExamManage.vue**: 已导入但未在模板中使用，建议确认是否需要保留

3. **PaperManagement.vue**: 菜单中已注释，但组件仍在使用

4. **AutoPaperManage.vue**: 菜单中已注释，但组件仍在使用

5. **ClassManagement.vue**: 菜单中已注释，但组件仍在使用

6. **备份文件**: 建议清理所有带 "copy" 的备份文件，以减少代码冗余

7. **路由配置问题**: `src/router/index.ts` 中引用了不存在的组件文件（PersonalCenter.vue、ExamDetail.vue、ScorePage.vue），建议清理或创建对应的组件文件

8. **question/editQuestion/answer/**: 该目录为空，可能需要确认是否需要保留

---

## 更新记录

- 2024-01-XX: 创建文档，记录所有组件的使用情况
- 2024-01-XX: 按照 Main.vue 菜单结构重新组织文档，方便快速查找组件

---

## 维护建议

1. 定期检查未使用的组件，及时清理
2. 删除所有备份文件，使用版本控制工具管理代码历史
3. 对于已注释但仍在使用的组件，建议明确其用途或移除
4. 建议为每个组件添加注释说明其功能和使用场景
5. 建议统一菜单文字和组件功能的对应关系，避免混淆
