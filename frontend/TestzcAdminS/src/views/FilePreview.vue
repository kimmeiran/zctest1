<template>
    <div class="preview-page">
        <!-- <h1>文件预览页面</h1>
        <p>如果你看到这个文字，说明页面加载成功了</p> -->
        <div class="preview-header">
            <div class="title">{{ fileName || '文件预览' }}</div>
            <div class="actions">
                <a v-if="downloadBlobUrl || src" :href="downloadBlobUrl || src" :download="fileName || undefined" target="_blank" rel="noopener" class="btn">下载</a>
            </div>
        </div>
        <div class="preview-body">
            <template v-if="isXlsUnsupported">
                <div class="fallback xls-fallback">
                    <p>.xls 格式暂不支持在线预览</p>
                    <p class="fallback-hint">请点击右上角「下载」后使用 Excel 或 WPS 打开</p>
                </div>
            </template>
            <component v-else-if="componentRef && effectiveSrc" :is="componentRef" :src="effectiveSrc" style="height: 100%; width: 100%;" @rendered="onRendered" @error="onError" />
            <div v-else class="fallback">
                <p>暂不支持该文件类型，正在为你打开原文件...</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request'
import VueOfficeDocx from '@vue-office/docx'
import '@vue-office/docx/lib/index.css'
import VueOfficePdf from '@vue-office/pdf'
import VueOfficeExcel from '@vue-office/excel'
import '@vue-office/excel/lib/index.css'

const route = useRoute()

const src = computed(() => {
    const raw = String(route.query.src || '')
    try {
        if (/%[0-9A-Fa-f]{2}/.test(raw)) return decodeURIComponent(raw)
        return raw
    } catch (e) {
        return raw
    }
})
/** 服务端文件名，用于 /api/file/preview?fileName=xxx 拉取（带鉴权） */
const queryFileName = computed(() => String(route.query.fileName || ''))
const ext = computed(() => String(route.query.ext || '').toLowerCase())
const fileName = computed(() => String(route.query.name || ''))

const componentRef = computed(() => {
    if (ext.value === 'docx') return VueOfficeDocx
    if (ext.value === 'pdf') return VueOfficePdf
    if (ext.value === 'xlsx' || ext.value === 'xls') return VueOfficeExcel
    return null
})

const arrayBufferSrc = ref(null)
const downloadBlobUrl = ref('')
/** Excel：传 Blob（带 MIME）或 ArrayBuffer；.xls 若组件不支持则走 fallback 仅下载 */
const excelBlobSrc = ref(null)
const effectiveSrc = computed(() => {
    if (excelBlobSrc.value) return excelBlobSrc.value
    if (arrayBufferSrc.value) return arrayBufferSrc.value
    return src.value
})
/** .xls 老格式 vue-office 可能不支持，仅显示下载 */
const isXlsUnsupported = ref(false)

const onRendered = () => {}
const onError = () => {
    if (src.value) window.open(src.value, '_blank')
}

/** 通过带鉴权的接口拉取文件（在线查看时新标签页用 fileName 自己请求，才能拿到数据） */
async function fetchByFileName() {
    if (!componentRef.value || !queryFileName.value) return
    arrayBufferSrc.value = null
    excelBlobSrc.value = null
    isXlsUnsupported.value = false
    if (downloadBlobUrl.value) {
        URL.revokeObjectURL(downloadBlobUrl.value)
        downloadBlobUrl.value = ''
    }
    try {
        const res = await request.get('/api/file/preview', {
            params: { fileName: queryFileName.value },
            responseType: 'arraybuffer'
        })
        const buf = res.data
        const byteLength = buf && typeof buf.byteLength === 'number' ? buf.byteLength : 0
        if (buf && byteLength > 0) {
            const blobUrl = URL.createObjectURL(new Blob([buf]))
            downloadBlobUrl.value = blobUrl
            if (ext.value === 'xlsx') {
                const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                excelBlobSrc.value = blob
            } else if (ext.value === 'xls') {
                isXlsUnsupported.value = true
            } else {
                arrayBufferSrc.value = buf
            }
        }
    } catch (e) {
        console.error('预览文件拉取失败', e)
    }
}

function fetchAsArrayBuffer() {
    if (!componentRef.value || !src.value) return
    arrayBufferSrc.value = null
    fetch(src.value, { credentials: 'include' })
        .then(async (res) => {
            if (!res.ok) throw new Error('获取文件失败: ' + res.status)
            const buf = await res.arrayBuffer()
            arrayBufferSrc.value = buf
        })
        .catch(() => {
            arrayBufferSrc.value = null
        })
}

function loadFile() {
    if (queryFileName.value) {
        fetchByFileName()
    } else if (src.value) {
        fetchAsArrayBuffer()
    }
}

onMounted(() => {
    if (!componentRef.value && src.value) window.open(src.value, '_blank')
    loadFile()
})

watch([() => route.query.fileName, () => route.query.src, () => route.query.ext], () => {
    loadFile()
})

onUnmounted(() => {
    if (downloadBlobUrl.value) URL.revokeObjectURL(downloadBlobUrl.value)
})
</script>

<style scoped>
.preview-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background: #fff;
}
.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #eee;
}
.title {
    font-size: 14px;
    color: #333;
}
.actions .btn {
    font-size: 12px;
    color: #1890ff;
}
.preview-body {
    flex: 1;
    height: calc(100vh - 48px);
}
.fallback {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #666;
    text-align: center;
}
.fallback.xls-fallback .fallback-hint {
    margin-top: 8px;
    font-size: 13px;
    color: #999;
}
</style>


