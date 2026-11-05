
<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  task: { type: Object, default: null },
  tasks: { type: Array, default: () => [] },
})

const emit = defineEmits(['save', 'cancel'])

function getToday() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const form = reactive({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  category: 'learning',
  dueDate: '',
})

const showErrors = ref(false)
const isEditing = computed(() => props.task !== null)

watch(
  () => props.task,
  (task) => {
    form.title = task?.title ?? ''
    form.description = task?.description ?? ''
    form.status = task?.status ?? 'todo'
    form.priority = task?.priority ?? 'medium'
    form.category = task?.category ?? 'learning'
    form.dueDate = task?.dueDate ?? ''
    showErrors.value = false
  },
  { immediate: true }
)

const statusLabels = {
  todo: 'Заплановано',
  progress: 'У роботі',
  done: 'Виконано',
}

const priorityLabels = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
}

const categoryLabels = {
  learning: 'Навчання',
  work: 'Робота',
  personal: 'Особисте',
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T12:00:00`)

  const validCalendarDate =
    !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value

  if (!validCalendarDate) return false

  // Для нових завдань минулі дати заборонені.
  // Під час редагування старих завдань вони дозволені.
  if (!isEditing.value && value < getToday()) return false

  return true
}

// Перевірка унікальності назви без урахування регістру.
const duplicateTitle = computed(() => {
  const title = form.title.trim().toLocaleLowerCase('uk-UA')

  if (!title) return false

  return props.tasks.some((task) =>
    (task.title || '').trim().toLocaleLowerCase('uk-UA') === title &&
    task.id !== props.task?.id
  )
})

const errors = computed(() => {
  const result = {}
  const title = form.title.trim()
  const description = form.description.trim()

  if (!title) {
    result.title = 'Вкажіть назву завдання.'
  } else if (title.length < 3) {
    result.title = 'Назва має містити щонайменше 3 символи.'
  } else if (title.length > 80) {
    result.title = 'Максимальна довжина — 80 символів.'
  } else if (duplicateTitle.value) {
    result.title = 'Завдання з такою назвою вже існує.'
  }

  if (description.length > 300) {
    result.description = 'Опис не повинен перевищувати 300 символів.'
  }

  if (!['todo', 'progress', 'done'].includes(form.status)) {
    result.status = 'Оберіть коректний статус.'
  }

  if (!['low', 'medium', 'high'].includes(form.priority)) {
    result.priority = 'Оберіть коректний пріоритет.'
  }

  if (!['learning', 'work', 'personal'].includes(form.category)) {
    result.category = 'Оберіть категорію.'
  }

  if (!isValidDate(form.dueDate)) {
    result.dueDate = isEditing.value
      ? 'Укажіть коректну дату завершення.'
      : 'Дата завершення не може бути в минулому.'
  }

  return result
})

function clearForm() {
  form.title = ''
  form.description = ''
  form.status = 'todo'
  form.priority = 'medium'
  form.category = 'learning'
  form.dueDate = ''
  showErrors.value = false
}

function submit() {
  showErrors.value = true

  if (Object.keys(errors.value).length > 0) return

  emit('save', {
    id: props.task?.id ?? null,
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
    priority: form.priority,
    category: form.category,
    dueDate: form.dueDate,
  })
}
</script>

<template>
  <section class="tf5-panel" aria-label="Форма завдання">
    <h2>{{ isEditing ? 'Редагування завдання' : 'Нове завдання' }}</h2>

    <form class="tf5-form" novalidate @submit.prevent="submit">
      <label>
        Назва завдання *
        <input
          v-model.trim="form.title"
          type="text"
          maxlength="80"
          placeholder="Назва завдання"
          aria-describedby="tf5-title-help tf5-title-error"
          :aria-invalid="showErrors && !!errors.title"
          required
        />
        <small id="tf5-title-help">
          Залишилося символів: {{ 80 - form.title.length }} із 80
        </small>
        <p
          v-if="showErrors && errors.title"
          id="tf5-title-error"
          class="tf5-error"
        >
          {{ errors.title }}
        </p>
      </label>

      <label>
        Опис
        <textarea
          v-model.trim="form.description"
          rows="3"
          maxlength="300"
          placeholder="Деталі виконання"
          aria-describedby="tf5-description-help tf5-description-error"
          :aria-invalid="showErrors && !!errors.description"
        ></textarea>
        <small id="tf5-description-help">
          Залишилося символів: {{ 300 - form.description.length }} із 300
        </small>
        <p
          v-if="showErrors && errors.description"
          id="tf5-description-error"
          class="tf5-error"
        >
          {{ errors.description }}
        </p>
      </label>

      <div class="tf5-form-grid">
        <label>
          Статус *
          <select v-model="form.status" required>
            <option value="todo">Заплановано</option>
            <option value="progress">У роботі</option>
            <option value="done">Виконано</option>
          </select>
        </label>

        <label>
          Пріоритет *
          <select v-model="form.priority" required>
            <option value="low">Низький</option>
            <option value="medium">Середній</option>
            <option value="high">Високий</option>
          </select>
        </label>

        <label>
          Категорія *
          <select v-model="form.category" required>
            <option value="learning">Навчання</option>
            <option value="work">Робота</option>
            <option value="personal">Особисте</option>
          </select>
        </label>
      </div>

      <label>
        Термін виконання *
        <input
          v-model="form.dueDate"
          type="date"
          :min="isEditing ? undefined : getToday()"
          aria-describedby="tf5-date-error"
          :aria-invalid="showErrors && !!errors.dueDate"
          required
        />
        <p
          v-if="showErrors && errors.dueDate"
          id="tf5-date-error"
          class="tf5-error"
        >
          {{ errors.dueDate }}
        </p>
      </label>

      <div class="tf5-preview">
        <strong>Попередній перегляд</strong>
        <p>{{ form.title || 'Назва нового завдання' }}</p>
        <span>
          {{ statusLabels[form.status] }} ·
          {{ priorityLabels[form.priority] }} ·
          {{ categoryLabels[form.category] }}
        </span>
      </div>

      <p v-if="showErrors && (errors.status || errors.priority || errors.category)" class="tf5-error">
        {{ errors.status || errors.priority || errors.category }}
      </p>

      <div class="tf5-actions">
        <button type="submit" class="tf5-btn tf5-btn--primary">
          {{ isEditing ? 'Зберегти зміни' : 'Створити завдання' }}
        </button>

        <button
          v-if="!isEditing"
          type="button"
          class="tf5-btn"
          @click="clearForm"
        >
          Очистити форму
        </button>

        <button type="button" class="tf5-btn" @click="emit('cancel')">
          Скасувати
        </button>
      </div>
    </form>
  </section>
</template>
