<template>
  <thead>
    <tr>
      <th>
        <input type="checkbox" :checked="isAllSelected" @change="$emit('check-all')" />
      </th>

      <template v-for="column in columns" :key="column.sortValue">
        <th
          @click.prevent="sortHandler(column.sortValue, column.sortable)"
          :class="{ sortable: column.sortable, active: sortValue === column.sortValue }"
        >
          {{ column.title }}
          <span v-if="column.sortable && sortValue === column.sortValue">
            {{ sortDirection === 'asc' ? '↑' : '↓' }}
          </span>
        </th>
      </template>
    </tr>
  </thead>
</template>

<script setup lang="ts">
import type { UTableColumn } from '@/types/ui.types'
import type { SortDirection } from '@/types/ui.types'
import type { UTableColumnSortValue } from '@/types/ui.types'

interface Props {
  columns: UTableColumn[]
  isAllSelected: boolean
  sortValue: string | null
  sortDirection: SortDirection
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'check-all'): void
  (e: 'sort', value: UTableColumnSortValue): void
}>()

function sortHandler(sortValue: UTableColumnSortValue, sortable: boolean | undefined) {
  if (sortable && sortValue) {
    emit('sort', sortValue)
  }
}
</script>

<style scoped>
thead {
  background: #f5f5f5;
  border-bottom: 2px solid #ddd;
}

th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

th.sortable {
  cursor: pointer;
  user-select: none;
}

th.sortable:hover {
  background: #eeeeee;
}

th.active {
  color: #4caf50;
}

td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
</style>
