
<script setup>
import { ref, computed } from 'vue'

import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskForm from '../components/TaskForm.vue'
import TaskListControls from '../components/TaskListControls.vue'

import {
  taskState,
  addTask,
  updateTask,
  deleteTask,
  setTaskStatus,
  setTaskPriority,
} from '../store/tasks'

import '../css/task-components.css'
import '../css/task-form.css'
import '../css/task-list.css'

const searchText = ref('')
const selectedStatus = ref('all')
const selectedPriority = ref('all')
const sortOrder = ref('newest')
const onlyActive = ref(false)

const showForm = ref(false)
const editingId = ref(null)

const editingTask = computed(
  () => taskState.tasks.find(
    (task) => task.id === editingId.value
  ) ?? null
)

// Формуємо список за пошуком і вибраними фільтрами.
const visibleTasks = computed(() => {
  const term = searchText.value.trim().toLocaleLowerCase('uk-UA')

  const priorityWeight = {
    high: 3,
    medium: 2,
    low: 1,
  }

  const statusWeight = {
    progress: 3,
    todo: 2,
    done: 1,
  }

  const result = taskState.tasks.filter((task) => {
    const taskText =
      `${task.title} ${task.description ?? ''}`
        .toLocaleLowerCase('uk-UA')

    const matchesText = !term || taskText.includes(term)

    const matchesStatus =
      selectedStatus.value === 'all' ||
      task.status === selectedStatus.value

    const matchesPriority =
      selectedPriority.value === 'all' ||
      task.priority === selectedPriority.value

    const matchesActive =
      !onlyActive.value || task.status !== 'done'

    return matchesText &&
      matchesStatus &&
      matchesPriority &&
      matchesActive
  })

  // Сортуємо копію масиву, не змінюючи спільне сховище.
  return result.sort((a, b) => {
    if (sortOrder.value === 'title') {
      return a.title.localeCompare(b.title, 'uk-UA') || b.id - a.id
    }

    if (sortOrder.value === 'priority') {
      return priorityWeight[b.priority] -
        priorityWeight[a.priority] || b.id - a.id
    }

    if (sortOrder.value === 'status') {
      return statusWeight[b.status] -
        statusWeight[a.status] || b.id - a.id
    }

    if (
      sortOrder.value === 'dueDate' ||
      sortOrder.value === 'dueDateDesc'
    ) {
      // Завдання без дати залишаються в кінці.
      if (!a.dueDate && !b.dueDate) return b.id - a.id
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1

      const comparison = a.dueDate.localeCompare(b.dueDate)

      return sortOrder.value === 'dueDateDesc'
        ? -comparison || b.id - a.id
        : comparison || b.id - a.id
    }

    return b.id - a.id
  })
})

// Відсоток виконаних завдань серед знайдених.
const completedPercentage = computed(() => {
  if (visibleTasks.value.length === 0) return 0

  const completed = visibleTasks.value.filter(
    (task) => task.status === 'done'
  ).length

  return Math.round(
    completed / visibleTasks.value.length * 100
  )
})

function resetFilters() {
  searchText.value = ''
  selectedStatus.value = 'all'
  selectedPriority.value = 'all'
  sortOrder.value = 'newest'
  onlyActive.value = false
}

function startCreate() {
  editingId.value = null
  showForm.value = true
}

function startEdit(id) {
  editingId.value = id
  showForm.value = true
}

function cancelForm() {
  editingId.value = null
  showForm.value = false
}

function saveTask(values) {
  const saved = values.id === null
    ? addTask(values)
    : updateTask(values)

  if (saved) {
    cancelForm()
  }
}

function handleDelete(id) {
  const task = taskState.tasks.find(
    (item) => item.id === id
  )

  if (!task) return

  const confirmed = window.confirm(
    `Видалити завдання «${task.title}»?`
  )

  if (!confirmed) return

  if (deleteTask(id) && editingId.value === id) {
    cancelForm()
  }
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">TASKFLOW / TASK MANAGER</div>

        <h1>Керування завданнями</h1>

        <p>
          Створюйте, редагуйте, знаходьте, сортуйте та видаляйте завдання.
        </p>

        <button
          type="button"
          class="tf5-btn tf5-btn--primary tf5-new"
          @click="startCreate"
        >
          + Додати завдання
        </button>
      </section>

      <TaskForm
        v-if="showForm"
        :key="editingId ?? 'new'"
        :task="editingTask"
        :tasks="taskState.tasks"
        @save="saveTask"
        @cancel="cancelForm"
      />

      <TaskListControls
        v-model:search="searchText"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:sort="sortOrder"
        v-model:onlyActive="onlyActive"
        @reset="resetFilters"
      />

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">TASK LIST</div>
            <h2>Список завдань</h2>
          </div>

          <div class="tf3-counter">
            <div>
              Показано: {{ visibleTasks.length }}
              із {{ taskState.tasks.length }}
            </div>
            <div>
              Виконано: {{ completedPercentage }}%
            </div>
          </div>
        </div>

        <div
          v-if="visibleTasks.length"
          class="tf3-task-grid"
        >
          <TaskCard
            v-for="task in visibleTasks"
            :key="task.id"
            :task="task"
            :editable="true"
            @status-change="setTaskStatus"
            @priority-change="setTaskPriority"
            @edit="startEdit"
            @delete="handleDelete"
          />
        </div>

        <div
          v-else-if="taskState.tasks.length === 0"
          class="tf5-empty"
        >
          <h3>Список завдань порожній</h3>
          <p>Усі завдання видалено. Додайте нове завдання, щоб продовжити роботу.</p>
          <button
            type="button"
            class="tf5-btn tf5-btn--primary"
            @click="startCreate"
          >
            Додати завдання
          </button>
        </div>

        <div v-else class="tf5-empty">
          <p>За поточними умовами завдань не знайдено.</p>
          <button
            type="button"
            class="tf5-btn"
            @click="resetFilters"
          >
            Показати всі завдання
          </button>
        </div>
      </section>
    </div>

    <AppTabbar active="tasks" />
  </f7-page>
</template>
