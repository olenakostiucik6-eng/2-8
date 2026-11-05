
import { reactive } from 'vue'
import initialTasks from '../data/tasks'

const allowedStatuses = ['todo', 'progress', 'done']
const allowedPriorities = ['low', 'medium', 'high']
const allowedCategories = ['learning', 'work', 'personal']

// Єдине реактивне сховище для HomePage і TasksPage.
export const taskState = reactive({
  tasks: initialTasks.map((task) => ({
    ...task,
    category: task.category ?? 'learning',
  })),
})

function findTask(id) {
  return taskState.tasks.find((task) => task.id === Number(id))
}

function normalizeValues(values) {
  return {
    title: String(values.title ?? '').trim(),
    description: String(values.description ?? '').trim(),
    status: allowedStatuses.includes(values.status) ? values.status : 'todo',
    priority: allowedPriorities.includes(values.priority) ? values.priority : 'medium',
    category: allowedCategories.includes(values.category) ? values.category : 'learning',
    dueDate: values.dueDate || '',
  }
}

export function addTask(values) {
  const taskValues = normalizeValues(values)

  if (taskValues.title.length < 3 || taskValues.title.length > 80) return false

  const nextId = Math.max(0, ...taskState.tasks.map((task) => task.id)) + 1

  taskState.tasks.unshift({ id: nextId, ...taskValues })
  return true
}

export function updateTask(values) {
  const task = findTask(values.id)
  if (!task) return false

  const taskValues = normalizeValues(values)

  if (taskValues.title.length < 3 || taskValues.title.length > 80) return false

  Object.assign(task, taskValues)
  return true
}

export function setTaskStatus({ id, status }) {
  if (!allowedStatuses.includes(status)) return false

  const task = findTask(id)
  if (!task) return false

  task.status = status
  return true
}

export function setTaskPriority({ id, priority }) {
  if (!allowedPriorities.includes(priority)) return false

  const task = findTask(id)
  if (!task) return false

  task.priority = priority
  return true
}

export function deleteTask(id) {
  const index = taskState.tasks.findIndex(
    (task) => task.id === Number(id)
  )

  if (index === -1) return false

  taskState.tasks.splice(index, 1)
  return true
}
