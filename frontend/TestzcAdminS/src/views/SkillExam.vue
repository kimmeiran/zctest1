<template>
  <div class="skill-exam">
    <h2 class="page-title">技能考试管理</h2>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="btn btn-add" @click="showUploadModal">
        <span class="plus-icon">+</span> 上传试卷文件
      </button>
    </div>

    <!-- 数据表格（数据来源：/api/file/list） -->
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>文件名</th>
            <th>文件类型</th>
            <th>大小</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in listDisplay" :key="item.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ item.fileName || '-' }}</td>
            <td>{{ item.fileType || '-' }}</td>
            <td>{{ formatSize(item.sizeBytes) }}</td>
            <td>{{ item.createTime || '-' }}</td>
            <td class="operations">
              <a href="#" class="view-link" @click.prevent="handleView(item)">查看</a>
              <a href="#" class="download-link" @click.prevent="handleDownload(item)">下载</a>
              <a href="#" class="delete-link" @click.prevent="handleDelete(item)">删除</a>
            </td>
          </tr>
          <tr v-if="!isLoading && listDisplay.length === 0">
            <td colspan="6" style="text-align: center; padding: 20px; color: #909399;">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <div class="pagination">
        <button
          class="btn btn-sm"
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1 || isLoading"
        >上一页</button>
        <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
        <button
          class="btn btn-sm"
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages || isLoading"
        >下一页</button>
      </div>
    </div>

    <!-- 上传试卷弹窗 -->
    <div class="modal-overlay" v-if="showUploadModalFlag" @mousedown.self="closeUploadModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>技能考试</h3>
          <button class="close-button" @click="closeUploadModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="required">考试名称</label>
            <input
              type="text"
              class="form-input"
              v-model="uploadForm.examName"
              placeholder="请输入考试名称"
            />
          </div>
          <div class="form-group">
            <label class="required">考核站</label>
            <select class="form-select" v-model="uploadForm.stationId">
              <option value="">请选择考核站</option>
              <option v-for="s in examStations" :key="s.id" :value="s.id">{{ s.stationName }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="required">考试类型</label>
            <select class="form-select" v-model="uploadForm.examType">
              <option value="">请选择考试类型</option>
              <option value="理论">理论</option>
              <option value="实操">实操</option>
            </select>
          </div>
          <div class="form-group">
            <label class="required">考试时间</label>
            <input
              type="datetime-local"
              class="form-input"
              v-model="uploadForm.examTime"
              placeholder="选择考试时间"
            />
          </div>
          <div class="form-group">
            <label class="required">上传试卷文件</label>
            <div
              class="file-upload-area"
              :class="{ 'drag-over': isDragOver }"
              @drop.prevent="handleDrop"
              @dragover.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              @click="triggerFileInput"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".docx,.doc,.pdf,.xlsx"
                @change="handleFileChange"
                style="display: none"
              />
              <div class="upload-placeholder">
                <span class="upload-icon">📄</span>
                <p>点击或拖拽文件到此处</p>
                <p class="upload-hint">仅支持 Word (.docx/.doc)、PDF (.pdf)、Excel (.xlsx)</p>
                <p v-if="uploadForm.file" class="file-name">{{ uploadForm.file.name }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeUploadModal" :disabled="isSaving">取消</button>
          <button class="btn btn-primary" @click="submitUpload" :disabled="isSaving">
            {{ isSaving ? '提交中...' : '提交' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/utils/request";
import { listFiles, deleteFileById, getSkillExamFileRawPath, getSkillExamFileName } from "@/api/file";
import { uploadSkillExam } from "@/api/skillExam";
import { getAllExamStations } from "@/api/examStation";

const list = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const isLoading = ref(false);
const isSaving = ref(false);
const examStations = ref([]);

const searchInfo = ref({});

const showUploadModalFlag = ref(false);
const isDragOver = ref(false);

const uploadForm = ref({
  examName: "",
  stationId: "",
  examType: "",
  examTime: "",
  file: null,
});
const fileInput = ref(null);

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));

// 当前页展示的列表（前端分页）
const listDisplay = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return list.value.slice(start, start + pageSize.value);
});

const formatSize = (bytes) => {
  if (bytes == null || bytes === undefined) return "-";
  const n = Number(bytes);
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(1) + " MB";
};

const fetchList = async () => {
  isLoading.value = true;
  try {
    // 技能考核列表与后端 POST /api/file/list 对齐（见 skill zcexam-skill-exam-fix）
    const res = await listFiles(searchInfo.value);
    const data = res?.data || res;
    if (data?.code === 200) {
      const arr = Array.isArray(data.data) ? data.data : [];
      list.value = arr;
      totalItems.value = arr.length;
    } else {
      list.value = [];
      totalItems.value = 0;
      if (data?.code && data.code !== 200) {
        ElMessage.warning(data?.msg || "查询失败");
      }
    }
  } catch (e) {
    console.error("获取文件列表失败:", e);
    list.value = [];
    totalItems.value = 0;
    ElMessage.warning("获取列表失败，请确认接口 /api/file/list 可用");
  } finally {
    isLoading.value = false;
  }
};

const search = () => {
  currentPage.value = 1;
  fetchList();
};

const reset = () => {
  searchInfo.value = {};
  currentPage.value = 1;
  fetchList();
};

const goToPage = (p) => {
  if (p >= 1 && p <= totalPages.value) {
    currentPage.value = p;
    fetchList();
  }
};

const showUploadModal = () => {
  uploadForm.value = {
    examName: "",
    stationId: "",
    examType: "",
    examTime: "",
    file: null,
  };
  showUploadModalFlag.value = true;
};

const closeUploadModal = () => {
  showUploadModalFlag.value = false;
};

const triggerFileInput = () => fileInput.value?.click();

const ALLOWED_EXT = [".docx", ".doc", ".pdf", ".xlsx"];
const checkFileExt = (file) => {
  if (!file?.name) return false;
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  return ALLOWED_EXT.includes(ext);
};

const setFileIfValid = (file) => {
  if (!file) return;
  if (!checkFileExt(file)) {
    ElMessage.warning("仅支持 Word (.docx/.doc)、PDF (.pdf)、Excel (.xlsx) 格式");
    return;
  }
  uploadForm.value.file = file;
};

const handleFileChange = (e) => {
  const file = e.target?.files?.[0];
  setFileIfValid(file);
  e.target.value = "";
};

const handleDrop = (e) => {
  isDragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  setFileIfValid(file);
};

const submitUpload = async () => {
  if (!uploadForm.value.examName) {
    ElMessage.warning("请输入考试名称");
    return;
  }
  if (!uploadForm.value.stationId) {
    ElMessage.warning("请选择考核站");
    return;
  }
  if (!uploadForm.value.examType) {
    ElMessage.warning("请选择考试类型");
    return;
  }
  if (!uploadForm.value.examTime) {
    ElMessage.warning("请选择考试时间");
    return;
  }
  if (!uploadForm.value.file) {
    ElMessage.warning("请上传试卷文件");
    return;
  }
  if (!checkFileExt(uploadForm.value.file)) {
    ElMessage.warning("仅支持 Word (.docx/.doc)、PDF (.pdf)、Excel (.xlsx) 格式");
    return;
  }

  isSaving.value = true;
  try {
    const fd = new FormData();
    fd.append("examName", uploadForm.value.examName);
    fd.append("stationId", uploadForm.value.stationId);
    fd.append("examType", uploadForm.value.examType);
    fd.append("examTime", uploadForm.value.examTime);
    fd.append("file", uploadForm.value.file);

    const res = await uploadSkillExam(fd);
    const data = res?.data || res;
    if (data?.code === 200) {
      ElMessage.success("上传成功");
      closeUploadModal();
      fetchList();
    } else {
      ElMessage.error(data?.msg || "上传失败");
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || "上传失败，请确认接口已实现");
  } finally {
    isSaving.value = false;
  }
};

const router = useRouter();
const handleView = (item) => {
  const fileName = getSkillExamFileName(item);
  if (!fileName) {
    ElMessage.warning("无法获取文件名");
    return;
  }
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  const name = item.fileName || fileName;
  const previewRoute = router.resolve({
    path: "/preview",
    query: { fileName, ext, name },
  });
  window.open(window.location.origin + previewRoute.href, "_blank");
};

const handleDownload = async (item) => {
  const path = getSkillExamFileRawPath(item);
  if (!path) {
    ElMessage.warning("无下载地址");
    return;
  }
  try {
    const res = await request.get(path, { responseType: "blob" });
    const blob = res.data;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.fileName || `file-${item.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ElMessage.success("已下载");
  } catch (e) {
    console.error("下载失败:", e);
    ElMessage.error("下载失败，请稍后重试");
  }
};

const handleDelete = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件"${item.fileName}"吗？`,
      "确认删除",
      { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" }
    );
  } catch {
    return;
  }
  try {
    const res = await deleteFileById(item.id);
    const data = res?.data || res;
    if (data?.code === 200) {
      ElMessage.success("删除成功");
      fetchList();
    } else {
      ElMessage.error(data?.msg || "删除失败");
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || "删除失败");
  }
};

const fetchExamStations = async () => {
  try {
    const res = await getAllExamStations();
    const data = res?.data || res;
    if (data?.code === 200 && data?.data) {
      examStations.value = Array.isArray(data.data) ? data.data : [];
    }
  } catch (e) {
    console.error("获取考核站失败:", e);
  }
};

onMounted(() => {
  fetchExamStations();
  fetchList();
});
</script>

<style scoped>
.skill-exam {
  padding: 20px;
}
.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}
.search-area {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.search-group { display: flex; align-items: center; gap: 10px; }
.search-group label { min-width: 70px; }
.form-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 160px;
}
.search-buttons { display: flex; gap: 10px; }
.action-buttons { margin-bottom: 20px; }
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary { background: #409eff; color: white; }
.btn-secondary { background: #909399; color: white; }
.btn-add { background: #409eff; color: white; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.table-responsive { overflow-x: auto; }
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}
.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}
.data-table th { background: #f5f7fa; font-weight: bold; }
.operations { white-space: nowrap; }
.operations a { margin-right: 12px; color: #409eff; text-decoration: none; }
.operations a:hover { text-decoration: underline; }
.download-link { color: #67c23a !important; }
.delete-link { color: #f56c6c !important; }
.pagination-container { margin-top: 20px; display: flex; justify-content: center; }
.pagination { display: flex; align-items: center; gap: 15px; }
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-container {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-body { padding: 20px; }
.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group label.required::after { content: " *"; color: red; }
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
}
.file-upload-area {
  padding: 24px;
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  background: #fafafa;
}
.file-upload-area:hover,
.file-upload-area.drag-over { border-color: #409eff; background: #ecf5ff; }
.upload-placeholder p { margin: 8px 0; color: #666; }
.upload-hint { font-size: 12px; color: #909399; }
.file-name { color: #409eff; font-weight: 500; }
</style>
