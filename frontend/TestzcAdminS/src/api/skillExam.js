import request from "@/utils/request";

/**
 * 获取技能考核试卷列表
 */
export function getSkillExamList(params) {
  return request.post(`/api/skill-exam/list`, params || {});
}

/**
 * 上传技能考核试卷（对接后端 POST /api/file/upload，见 skill zcexam-skill-exam-fix）
 */
export function uploadSkillExam(formData) {
  return request.post(`/api/file/upload`, formData);
}

/**
 * 删除技能考核试卷
 */
export function deleteSkillExam(id) {
  return request.delete(`/api/skill-exam/${id}`);
}

/**
 * 下载技能考核试卷
 */
export function downloadSkillExam(id) {
  return request.get(`/api/skill-exam/${id}/download`, {
    
    responseType: "blob",
  });
}

/**
 * 获取技能考核试卷详情（用于查看）
 */
export function getSkillExamById(id) {
  return request.get(`/api/skill-exam/${id}`);
}
