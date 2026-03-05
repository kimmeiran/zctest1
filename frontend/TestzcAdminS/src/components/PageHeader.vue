<template>
  <div class="page-header">
    <div class="back-button" @click="handleBack">
      <i class="arrow-left" :class="{ 'blue-theme': theme === 'blue' }"></i>
    </div>
    <h1 class="title" :class="{ 'blue-theme': theme === 'blue' }">{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

defineProps<{
  title: string;
  theme?: 'blue' | 'gold';
}>();

const router = useRouter();

const handleBack = () => {
  router.back();
};
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 10px 0;
}

.back-button {
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.arrow-left {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-left: 2px solid #333;
  border-bottom: 2px solid #333;
  transform: rotate(45deg);
}

.arrow-left.blue-theme {
  border-left-color: #19a7e8;
  border-bottom-color: #19a7e8;
}

.title {
  color: #ffd700;
  font-size: 28px;
  font-weight: bold;
}

.title.blue-theme {
  color: #19a7e8;
}

@media (max-width: 768px) {
  .page-header {
    padding: 8px 0;
  }

  .title {
    font-size: 24px;
  }
}
</style> 