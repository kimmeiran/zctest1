<template>
  <div class="breadcrumb-nav">
    <template v-for="(item, index) in items" :key="index">
      <span v-if="index > 0" class="breadcrumb-separator">{{ separator }}</span>
      <a
        v-if="item.onClick"
        href="#"
        class="breadcrumb-link"
        @click.prevent="item.onClick"
      >{{ item.label }}</a>
      <span v-else class="breadcrumb-current">{{ item.label }}</span>
    </template>
  </div>
</template>

<script setup>
defineProps({
  /** 面包屑项：{ label: 显示文本, onClick?: 点击回调，无则为当前页 } */
  items: {
    type: Array,
    required: true,
    validator: (val) => val.every(i => typeof i.label === 'string')
  },
  /** 分隔符 */
  separator: {
    type: String,
    default: ' / '
  }
});
</script>

<style scoped>
.breadcrumb-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
}

.breadcrumb-separator {
  margin: 0 6px;
  color: #bfbfbf;
}

.breadcrumb-link {
  color: #c70019;
  text-decoration: none;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  color: #333;
  font-weight: 500;
}
</style>
