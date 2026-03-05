<template>
  <img
    v-if="src"
    :src="src"
    :width="width"
    :height="height"
    :alt="alt"
    :class="imgClass"
    @error="onError"
  />
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { fetchImageAsBlobUrl } from '@/api/imageUpload.js'

const props = defineProps({
  path: { type: String, default: '' },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined },
  alt: { type: String, default: '' },
  imgClass: { type: String, default: '' }
})

const src = ref('')
let blobUrlToRevoke = null

const load = async () => {
  if (blobUrlToRevoke) {
    URL.revokeObjectURL(blobUrlToRevoke)
    blobUrlToRevoke = null
  }
  if (!props.path || typeof props.path !== 'string' || !props.path.trim()) {
    src.value = ''
    return
  }
  const url = await fetchImageAsBlobUrl(props.path.trim())
  if (url && url.startsWith('blob:')) blobUrlToRevoke = url
  src.value = url || ''
}

watch(() => props.path, load, { immediate: true })

onUnmounted(() => {
  if (blobUrlToRevoke) {
    URL.revokeObjectURL(blobUrlToRevoke)
    blobUrlToRevoke = null
  }
})

const onError = () => {
  src.value = ''
}
</script>
