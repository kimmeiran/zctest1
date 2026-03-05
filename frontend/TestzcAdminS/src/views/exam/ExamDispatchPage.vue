<template>
  <div class="exam-dispatch-page">
    <h2 class="page-title">考试管理 / 派发记录</h2>

    <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>考核站</th>
              <th>考试申请</th>
              <th>申请时间</th>
              <th>操作</th>
              <th>派发时间</th>
              <th>派发状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in dispatchRecordList" :key="item.id || idx">
              <td>{{ (currentPageRecord - 1) * pageSizeRecord + idx + 1 }}</td>
              <td>{{ item.stationName || '-' }}</td>
              <td>{{ applicationName(item) }}</td>
              <td>{{ formatDate(item.createTime) }}</td>
              <td class="operations">
                <a href="#" class="action-link" title="在线查看申请附件（支持 xlsx、xls、doc、docx、pdf）" @click.prevent="viewApplication(item)">在线查看</a>
                <span class="sep">|</span>
                <a href="#" class="action-link" title="下载申请附件" @click.prevent="downloadApplication(item)">下载</a>
              </td>
              <td>{{ formatDate(item.dispatchTime) }}</td>
              <td>
                <span :class="item.applicationStatus === 1 ? 'status-done' : 'status-pending'">
                  {{ item.applicationStatus === 1 ? '已派发' : '未派发' }}
                </span>
              </td>
              <td class="operations">
                <template v-if="item.applicationStatus === 1">
                  <a href="#" class="action-link" title="查看压缩包内 A3、A4 版本试卷名称" @click.prevent="showZipPaperNames(item)">浏览 A3/A4</a>
                  <span class="sep">|</span>
                  <a href="#" class="action-link" title="下载试卷压缩包（含 A3、A4 两种版本）" @click.prevent="downloadDispatch(item)">下载</a>
                </template>
                <span v-else class="text-muted">-</span>
              </td>
            </tr>
            <tr v-if="!isLoadingRecords && dispatchRecordList.length === 0">
              <td colspan="8" class="no-data">暂无派发记录</td>
            </tr>
          </tbody>
        </table>
    </div>
    <Pagination
      v-if="!isLoadingRecords && totalItemsRecord > 0"
      :total="totalItemsRecord"
      :current-page="currentPageRecord"
      :page-size="pageSizeRecord"
      @change="onPageChange"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import Pagination from '@/components/Pagination.vue';
import { getAllExamStations } from '@/api/examStation';
import request from '@/utils/request';
import { getPaperApplications } from '@/api/paperApplication';
import { downloadDispatchZip, getDispatchZipPaperNames } from '@/api/teachExam';

/** 支持在线预览的申请附件格式 */
const PREVIEW_EXTS = ['xlsx', 'xls', 'doc', 'docx', 'pdf'];
const router = useRouter();

const fullRecordList = ref([]);
const examStations = ref([]);
const isLoadingRecords = ref(false);

const currentPageRecord = ref(1);
const pageSizeRecord = ref(10);
const totalItemsRecord = computed(() => fullRecordList.value.length);
const dispatchRecordList = computed(() => {
  const start = (currentPageRecord.value - 1) * pageSizeRecord.value;
  return fullRecordList.value.slice(start, start + pageSizeRecord.value);
});

/** 申请名称：年度 + 备注（无则仅年度） */
const applicationName = (item) => {
  const year = item.year ?? item.applicationYear;
  const part = year != null ? '年度 ' + year : '-';
  const remark = item.remark && String(item.remark).trim();
  return remark ? part + ' ' + remark : part;
};

const formatDate = (str) => {
  if (!str) return '-';
  try {
    const d = new Date(str);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return str;
  }
};

const onPageChange = (page, size) => {
  currentPageRecord.value = page;
  pageSizeRecord.value = size;
  fetchDispatchRecords();
};

const fetchDispatchRecords = async () => {
  isLoadingRecords.value = true;
  try {
    const res = await getPaperApplications({
      stationId: undefined,
      year: undefined
    });
    const data = res?.data ?? res;
    let list = [];
    if (data?.code === 200 && data?.data !== undefined) {
      list = Array.isArray(data.data) ? data.data : (data.data?.list ? data.data.list : []);
    } else if (Array.isArray(data)) {
      list = data;
    } else if (data?.list) {
      list = Array.isArray(data.list) ? data.list : [];
    } else if (data?.data && Array.isArray(data.data)) {
      list = data.data;
    }
    fullRecordList.value = Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('获取派发记录失败', e);
    fullRecordList.value = [];
    ElMessage.error(e?.response?.data?.msg || e?.message || '获取派发记录失败');
  } finally {
    isLoadingRecords.value = false;
  }
};

const fetchStations = async () => {
  try {
    const res = await getAllExamStations();
    const data = res?.data ?? res;
    if (data?.code === 200 && data?.data) {
      examStations.value = Array.isArray(data.data) ? data.data : [];
    }
  } catch (e) {
    console.error('获取考核站失败', e);
  }
};

/** 从文件名取扩展名（小写） */
const getFileExt = (fileName) => {
  if (!fileName || typeof fileName !== 'string') return '';
  const last = fileName.split('.').pop();
  return last ? last.toLowerCase() : '';
};

/** 在线查看申请附件：支持 xlsx、xls、doc、docx、pdf。用 fileName 让预览页自己请求接口，避免新标签页无法访问 blob 导致表格为空 */
const viewApplication = async (item) => {
  const name = item.fileUrl || item.fileName;
  if (!name) {
    ElMessage.warning('该申请无附件');
    return;
  }
  const ext = getFileExt(name);
  if (PREVIEW_EXTS.includes(ext)) {
    const previewRoute = router.resolve({
      path: '/preview',
      query: {
        fileName: name,
        ext,
        name: item.fileName || name
      }
    });
    window.open(window.location.origin + previewRoute.href, '_blank');
  } else {
    try {
      const res = await request.get('/api/file', {
        params: { fileName: name },
        responseType: 'blob'
      });
      const blobUrl = URL.createObjectURL(res.data);
      window.open(blobUrl, '_blank');
      ElMessage.info('该格式仅支持新窗口打开，在线预览支持 xlsx、xls、doc、docx、pdf');
    } catch (e) {
      console.error('打开申请附件失败', e);
      ElMessage.error(e?.response?.data?.message || e?.message || '打开失败');
    }
  }
};

const downloadApplication = async (item) => {
  const name = item.fileUrl || item.fileName;
  if (!name) {
    ElMessage.warning('该申请无附件');
    return;
  }
  try {
    const res = await request.get('/api/file', {
      params: { fileName: name },
      responseType: 'blob'
    });
    const blob = res.data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName || name || '申请文件';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ElMessage.success('下载成功');
  } catch (e) {
    console.error('下载申请附件失败', e);
    ElMessage.error(e?.response?.data?.message || e?.message || '下载失败');
  }
};

const downloadDispatch = async (item) => {
  if (!item.id) return;
  try {
    const { blob, filename } = await downloadDispatchZip(String(item.id));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || '派发_' + item.id + '.zip';
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success('下载成功');
  } catch (e) {
    console.error('下载 zip 失败', e);
    ElMessage.error(e?.message || '下载失败');
  }
};

const showZipPaperNames = async (item) => {
  if (!item.id) return;
  try {
    const names = await getDispatchZipPaperNames(String(item.id));
    if (!names || names.length === 0) {
      ElMessage.info('该批次 zip 内暂无试卷名称');
      return;
    }
    ElMessageBox.alert('派发试卷压缩包内包含以下 A3、A4 版本试卷：\n\n' + names.join('\n'), '派发试卷（A3 / A4 版本）', {
      confirmButtonText: '确定',
      customClass: 'dispatch-paper-names-box'
    });
  } catch (e) {
    console.error('获取 zip 内卷名失败', e);
    ElMessage.error(e?.message || '获取失败');
  }
};

onMounted(() => {
  fetchStations();
  fetchDispatchRecords();
});
</script>

<style scoped>
.exam-dispatch-page {
  padding: 20px;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 500;
}

.table-responsive {
  overflow-x: auto;
  margin-top: 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background: #fafafa;
  font-weight: 500;
  color: #333;
}

.operations {
  white-space: nowrap;
}

.action-link {
  color: #1890ff;
  text-decoration: none;
  cursor: pointer;
}

.action-link:hover {
  text-decoration: underline;
}

.sep {
  margin: 0 6px;
  color: #d9d9d9;
}

.text-muted {
  color: #999;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 24px !important;
}

.status-done {
  color: #52c41a;
}

.status-pending {
  color: #faad14;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: #fff;
  border-radius: 4px;
  width: 480px;
  max-width: 90%;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.detail-row {
  margin-bottom: 12px;
}

.detail-row label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  color: #333;
}
</style>
