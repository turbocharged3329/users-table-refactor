<template>
  <div v-if="visibleModel" class="modal-overlay" @click="visibleModel = false">
    <div class="modal" :class="`modal-${variant}`" @click.stop>
      <div class="modal-header">
        <slot name="header"></slot>
      </div>

      <div class="modal-body">
        <slot></slot>
      </div>

      <div class="modal-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'large'
}

defineProps<Props>()

const visibleModel = defineModel({
  type: Boolean,
  default: false,
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-x: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal.modal-large {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header :deep(h3) {
  margin: 0;
  font-size: 20px;
  color: #333;
}

:deep(.btn-close) {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

:deep(.btn-close:hover) {
  background: #f0f0f0;
  color: #333;
}

.modal-body {
  padding: 20px;
  box-sizing: border-box;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
