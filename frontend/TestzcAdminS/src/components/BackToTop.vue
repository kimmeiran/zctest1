<template>
  <Transition name="back-to-top">
    <button
      v-show="visible"
      type="button"
      class="back-to-top-btn"
      aria-label="回到顶部"
      title="回到顶部"
      @click="scrollToTop"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";

const props = withDefaults(
  defineProps<{ scrollContainer?: HTMLElement | null }>(),
  { scrollContainer: undefined }
);

const visible = ref(false);
const scrollThreshold = 120;
const showAfterStopMs = 350;
let scrollTimer: ReturnType<typeof setTimeout> | null = null;
let currentTarget: Window | HTMLElement | null = null;

function getScrollTop(): number {
  if (currentTarget === window || !currentTarget) {
    return window.scrollY ?? document.documentElement.scrollTop ?? 0;
  }
  return (currentTarget as HTMLElement).scrollTop;
}

function onScroll() {
  visible.value = false;
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    scrollTimer = null;
    visible.value = getScrollTop() > scrollThreshold;
  }, showAfterStopMs);
}

function scrollToTop() {
  if (currentTarget === window || !currentTarget) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    (currentTarget as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
  }
}

function attach(target: Window | HTMLElement) {
  currentTarget = target;
  target.addEventListener("scroll", onScroll, { passive: true });
  visible.value = getScrollTop() > scrollThreshold;
}

function detach() {
  if (currentTarget) {
    currentTarget.removeEventListener("scroll", onScroll);
    currentTarget = null;
  }
  if (scrollTimer) {
    clearTimeout(scrollTimer);
    scrollTimer = null;
  }
  visible.value = false;
}

watch(
  () => props.scrollContainer,
  (el) => {
    detach();
    if (el) {
      attach(el);
    } else {
      attach(window);
    }
  },
  { immediate: false }
);

onMounted(() => {
  if (props.scrollContainer) {
    attach(props.scrollContainer);
  } else {
    attach(window);
  }
});

onBeforeUnmount(() => {
  detach();
});
</script>

<style scoped>
/* 适配电脑端 Web：更大的点击区域，标准右下角位置 */
.back-to-top-btn {
  position: fixed;
  right: 24px;
  bottom: 32px;
  z-index: 999;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(199, 0, 25, 0.92);
  color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
}
.back-to-top-btn:hover {
  background: #c70019;
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(199, 0, 25, 0.35);
}
.back-to-top-btn:active {
  transform: scale(0.96);
}
.back-to-top-btn svg {
  width: 22px;
  height: 22px;
}
/* 大屏电脑端：更舒适的尺寸与位置 */
@media (min-width: 1280px) {
  .back-to-top-btn {
    right: 32px;
    bottom: 40px;
    width: 48px;
    height: 48px;
  }
  .back-to-top-btn svg {
    width: 24px;
    height: 24px;
  }
}

.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
