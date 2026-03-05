<template>
  <router-view></router-view>
  <BackToTop />
</template>

<script setup lang="ts">
import BackToTop from "@/components/BackToTop.vue";
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.5;
  color: #333;
}
</style> 