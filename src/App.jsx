
import React from 'react'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableTask({ task, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={task.completed ? 'done' : ''}
    >
      <button
        type="button"
        className="drag-handle"
        {...listeners}
        aria-label={`Drag ${task.title}`}
        title="Drag to reorder"
      >
        ⠿
      </button>

      {children}
    </li>
  )
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  // 4.edit task
  const [editingTaskId, setEditingTaskId] = useState(null) // → which task is currently being edited
  const [editTitle, setEditTitle] = useState('')  // → temporary text typed into the Edit input
  const [searchQuery, setSearchQuery] = useState('') // search task
  const [dueDate, setDueDate] = useState('') // due date for task
  const [priority, setPriority] = useState('medium') // priority for task
  const [category, setCategory] = useState('personal') // category for task
  const [darkMode, setDarkMode] = useState(false) // dark mode toggle
  const [sortBy, setSortBy] = useState('newest') // sort tasks by newest or oldest

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true })
      .order('title', { ascending: true })

    if (error) setError(error.message)
    else setTasks(data)
    setLoading(false)
  }

  async function addTask(event) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return

    setSaving(true)
    setError('')
    const { data, error } = await supabase
      .from('tasks')
      .insert({ title: cleanTitle, due_date: dueDate || null, priority: priority,  category: category})
      .select()
      .single()

    if (error) setError(error.message)
    else {
      setTasks((current) => [data, ...current])
      setTitle('')
      setDueDate('')
      setPriority('medium')
      setCategory('personal')
    }
    setSaving(false)
  }

  async function toggleTask(task) {
    setError('')
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed,  completed_at: task.completed ? null : new Date().toISOString(), })
      .eq('id', task.id)
      .select()
      .single()

    if (error) setError(error.message)
    else setTasks((current) => current.map((item) => item.id === task.id ? data : item))
  }

  async function deleteTask(id) {
    setError('')
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) setError(error.message)
    else setTasks((current) => current.filter((task) => task.id !== id))
  }

  async function saveEditedTask(id) {
    const cleanTitle = editTitle.trim()
  
    if (!cleanTitle) {
      setError('Task title cannot be empty.')
      return
    }
  
    setError('')
  
    const { data, error } = await supabase
      .from('tasks')
      .update({ title: cleanTitle })
      .eq('id', id)
      .select()
      .single()
  
    if (error) {
      setError(error.message)
    } else {
      setTasks((current) =>
        current.map((task) => task.id === id ? data : task)
      )
      setEditingTaskId(null)
      setEditTitle('')
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event
  
    if (!over || active.id === over.id) return
  
    const oldIndex = tasks.findIndex((task) => task.id === active.id)
    const newIndex = tasks.findIndex((task) => task.id === over.id)
  
    const reorderedTasks = arrayMove(tasks, oldIndex, newIndex)
  
    // Update the screen immediately
    setTasks(reorderedTasks)
  
    // Save the new order in Supabase
    const results = await Promise.all(
      reorderedTasks.map((task, index) =>
        supabase
          .from('tasks')
          .update({ position: index })
          .eq('id', task.id)
      )
    )
  
    const failedUpdate = results.find((result) => result.error)
  
    if (failedUpdate) {
      setError(failedUpdate.error.message)
      loadTasks()
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && !task.completed) ||
      (filter === 'completed' && task.completed)
  
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  
    return matchesFilter && matchesSearch
  })

  const remaining = tasks.filter((task) => !task.completed).length

  return (
    <main className={`page ${darkMode ? 'dark-mode' : ''}`}>
      <section className="todo-card" aria-labelledby="page-title">
        <p className="eyebrow">SIMPLE TASK LIST</p>
        <div className="title-row">
          <h1 id="page-title">My tasks</h1>
          <button type="button" className="theme-toggle" onClick={() => setDarkMode((current) => !current)}>
           {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <p className="summary">{remaining} {remaining === 1 ? 'task' : 'tasks'} left to do</p>

        <form className="add-form" onSubmit={addTask}>
          <label className="sr-only" htmlFor="task-title">New task</label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to be done?"
            maxLength="160"
            disabled={saving}
          />

          <input type="date" value={dueDate}  onChange={(event) => setDueDate(event.target.value)}
              disabled={saving} aria-label="Due date"/>
              <select value={priority} onChange={(event) => setPriority(event.target.value)}
               disabled={saving} aria-label="Task priority">
               <option value="low">Low</option>
               <option value="medium">Medium</option>
               <option value="high">High</option>
             </select>

             <select value={category} onChange={(event) => setCategory(event.target.value)}
              disabled={saving} aria-label="Task category">
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="study">Study</option>
              <option value="shopping">Shopping</option>
             </select>

          <button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add task'}</button>
        </form>
        <div className="filters">
        <input
  className="search-input"
  type="text"
  value={searchQuery}
  onChange={(event) => setSearchQuery(event.target.value)}
  placeholder="Search tasks..."
/>
  <button
    className={filter === 'all' ? 'active-filter' : ''}
    onClick={() => setFilter('all')}
  >
    All
  </button>

  <button
    className={filter === 'active' ? 'active-filter' : ''}
    onClick={() => setFilter('active')}
  >
    Active
  </button>

  <button
    className={filter === 'completed' ? 'active-filter' : ''}
    onClick={() => setFilter('completed')}
  >
    Completed
  </button>
</div>


  {error && <p className="error" role="alert">{error}</p>}

        {loading ? (
          <p className="empty">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="empty">No tasks yet. Add your first one above.</p>
        ) : (
          <DndContext collisionDetection={closestCenter}  onDragEnd={handleDragEnd}>
        <SortableContext items={filteredTasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}>
       <ul className="task-list">
            {filteredTasks.map((task) => (
              <SortableTask key={task.id} task={task}>
              <label>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task)}
                  aria-label={`Mark ${task.title} as ${
                    task.completed ? 'incomplete' : 'complete'
                  }`}
                />
            
                {editingTaskId === task.id ? (
                  <input
                    className="edit-input"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    autoFocus
                  />
                ) : (
                  <span>{task.title}</span>
                )}
              </label>
            
              <div className="task-meta">
           {task.due_date && (
             <span className="due-date">
               Due: {new Date(`${task.due_date}T00:00:00`).toLocaleDateString()}
             </span>
            )}

            <span className={`priority priority-${task.priority}`}>
               {task.priority}
            </span>

            <span className={`category category-${task.category}`}>
               {task.category}
            </span>

            {task.completed && task.completed_at && (
            <span className="completed-date">
              Completed: {new Date(task.completed_at).toLocaleString()}
            </span>
             )}
           </div>
            
              <div className="task-actions">
                {editingTaskId === task.id ? (
                  <>
                    <button type="button" onClick={() => saveEditedTask(task.id)}>
                      Save
                    </button>
            
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTaskId(null)
                        setEditTitle('')
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTaskId(task.id)
                      setEditTitle(task.title)
                    }}
                  >
                    Edit
                  </button>
                )}
            
                <button
                  className="delete"
                  onClick={() => deleteTask(task.id)}
                  aria-label={`Delete ${task.title}`}
                >
                  Delete
                </button>
              </div>
            </SortableTask>
            ))}
           </ul>
         </SortableContext>
        </DndContext>
        )}
      </section>
    </main>
  )
}
