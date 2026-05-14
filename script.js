// ============================================================================
// AI TODO PLANNER - Complete JavaScript Application
// ============================================================================

// State Management
const state = {
    tasks: [],
    currentView: 'all',
    currentSort: 'date',
    editingTaskId: null,
    suggestedTasks: [],
    reminderIntervals: {},
};

// DOM Elements
const taskInput = document.getElementById('taskInput');
const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
const addTaskBtn = document.getElementById('addTaskBtn');
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const viewBtns = document.querySelectorAll('.view-btn');
const sortSelect = document.getElementById('sortBy');
const notificationArea = document.getElementById('notificationArea');
const aiSuggestions = document.getElementById('aiSuggestions');
const suggestionsContent = document.getElementById('suggestionsContent');
const applySuggestionsBtn = document.getElementById('applySuggestionsBtn');

// Modal Elements
const taskModal = document.getElementById('taskModal');
const modalTitle = document.getElementById('modalTitle');
const modalTaskTitle = document.getElementById('modalTaskTitle');
const modalTaskDesc = document.getElementById('modalTaskDesc');
const modalTaskPriority = document.getElementById('modalTaskPriority');
const modalTaskDueDate = document.getElementById('modalTaskDueDate');
const modalTaskCategory = document.getElementById('modalTaskCategory');
const modalTaskReminder = document.getElementById('modalTaskReminder');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const deleteTaskBtn = document.getElementById('deleteTaskBtn');

// Reminder Elements
const reminderNotification = document.getElementById('reminderNotification');
const reminderTitle = document.getElementById('reminderTitle');
const reminderDesc = document.getElementById('reminderDesc');

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadTasksFromStorage();
    setupEventListeners();
    renderTasks();
    checkReminders();
    setInterval(checkReminders, 60000); // Check reminders every minute
});

function setupEventListeners() {
    aiAnalyzeBtn.addEventListener('click', analyzeTaskInput);
    addTaskBtn.addEventListener('click', addTaskManually);
    applySuggestionsBtn.addEventListener('click', applySuggestedTasks);
    sortSelect.addEventListener('change', handleSort);
    saveTaskBtn.addEventListener('click', saveTask);
    deleteTaskBtn.addEventListener('click', deleteTask);

    viewBtns.forEach((btn) => {
        btn.addEventListener('click', handleViewChange);
    });

    taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            addTaskManually();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskModal();
            closeAISuggestions();
        }
    });
}

// ============================================================================
// AI ANALYSIS ENGINE
// ============================================================================

function analyzeTaskInput() {
    const input = taskInput.value.trim();

    if (!input) {
        showNotification('Please describe your tasks or plans', 'error');
        return;
    }

    // Show loading state
    aiAnalyzeBtn.disabled = true;
    aiAnalyzeBtn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';

    // Simulate AI processing
    setTimeout(() => {
        const analyzedTasks = parseAndOrganizeTasks(input);
        state.suggestedTasks = analyzedTasks;
        displaySuggestions(analyzedTasks);
        taskInput.value = '';

        aiAnalyzeBtn.disabled = false;
        aiAnalyzeBtn.innerHTML = '<span class="btn-icon">✨</span> AI Organize';
    }, 800);
}

function parseAndOrganizeTasks(text) {
    const tasks = [];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

    const keywords = {
        work: ['work', 'project', 'meeting', 'presentation', 'report', 'email', 'deadline'],
        shopping: ['buy', 'shop', 'groceries', 'store', 'mall', 'purchase', 'items'],
        health: ['health', 'doctor', 'exercise', 'gym', 'medicine', 'appointment', 'appointment'],
        personal: ['call', 'family', 'friend', 'home', 'clean', 'organize'],
    };

    const timeKeywords = {
        today: ['today', 'now', 'asap', 'immediately'],
        tomorrow: ['tomorrow', 'next day'],
        week: ['this week', 'next week', 'soon'],
        month: ['this month', 'next month', 'later'],
    };

    sentences.forEach((sentence) => {
        const trimmed = sentence.trim();
        if (trimmed.length < 5) return;

        // Determine priority
        const urgentWords = ['urgent', 'asap', 'critical', 'important', 'must', 'immediately'];
        const isUrgent = urgentWords.some((word) =>
            trimmed.toLowerCase().includes(word)
        );

        const taskText = trimmed
            .replace(/^(i need to|i have to|i should|need to|have to|should)/i, '')
            .trim();

        // Extract category
        let category = 'other';
        for (const [cat, keys] of Object.entries(keywords)) {
            if (keys.some((key) => trimmed.toLowerCase().includes(key))) {
                category = cat;
                break;
            }
        }

        // Extract time frame
        let dueDate = null;
        const now = new Date();
        for (const [timeframe, timeWords] of Object.entries(timeKeywords)) {
            if (timeWords.some((word) => trimmed.toLowerCase().includes(word))) {
                if (timeframe === 'today') {
                    dueDate = now;
                } else if (timeframe === 'tomorrow') {
                    dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                } else if (timeframe === 'week') {
                    dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                } else if (timeframe === 'month') {
                    dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                }
                break;
            }
        }

        tasks.push({
            title: taskText.substring(0, 50),
            description: taskText,
            priority: isUrgent ? 'high' : 'medium',
            category: category,
            dueDate: dueDate,
            suggested: true,
        });
    });

    return tasks;
}

function displaySuggestions(tasks) {
    aiSuggestions.classList.remove('hidden');

    suggestionsContent.innerHTML = tasks
        .map((task, index) => {
            const priorityClass = `${task.priority}-priority`;
            const dueText = task.dueDate
                ? new Date(task.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                  })
                : 'No date';

            return `
                <div class="suggestion-item ${priorityClass}">
                    <div class="suggestion-text">
                        <div class="suggestion-title">${escapeHtml(task.title)}</div>
                        <div class="suggestion-meta">
                            <span>${task.category}</span> • <span>${dueText}</span>
                        </div>
                    </div>
                    <span class="suggestion-badge">${task.priority}</span>
                </div>
            `;
        })
        .join('');
}

function applySuggestedTasks() {
    state.suggestedTasks.forEach((suggestedTask) => {
        const task = {
            id: Date.now() + Math.random(),
            title: suggestedTask.title,
            description: suggestedTask.description,
            priority: suggestedTask.priority,
            category: suggestedTask.category,
            dueDate: suggestedTask.dueDate,
            completed: false,
            reminder: false,
            createdAt: new Date(),
        };
        state.tasks.push(task);
    });

    saveTasksToStorage();
    renderTasks();
    closeAISuggestions();
    showNotification(`✅ Added ${state.suggestedTasks.length} tasks from AI suggestions`, 'success');
    state.suggestedTasks = [];
}

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

function addTaskManually() {
    const title = taskInput.value.trim();

    if (!title) {
        showNotification('Please enter a task title', 'error');
        return;
    }

    const task = {
        id: Date.now() + Math.random(),
        title: title,
        description: '',
        priority: 'medium',
        category: 'other',
        dueDate: null,
        completed: false,
        reminder: false,
        createdAt: new Date(),
    };

    state.tasks.push(task);
    saveTasksToStorage();
    taskInput.value = '';
    renderTasks();
    showNotification('✅ Task added successfully', 'success');
}

function updateTask(id, updatedData) {
    const taskIndex = state.tasks.findIndex((t) => t.id === id);
    if (taskIndex !== -1) {
        state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updatedData };
        saveTasksToStorage();
    }
}

function deleteTaskFromState(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveTasksToStorage();
    renderTasks();
    showNotification('🗑️ Task deleted', 'info');
}

function toggleTaskComplete(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage();
        renderTasks();
    }
}

// ============================================================================
// RENDERING
// ============================================================================

function renderTasks() {
    let filteredTasks = [...state.tasks];

    // Apply view filter
    if (state.currentView === 'pending') {
        filteredTasks = filteredTasks.filter((t) => !t.completed);
    } else if (state.currentView === 'completed') {
        filteredTasks = filteredTasks.filter((t) => t.completed);
    } else if (state.currentView === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        filteredTasks.sort(
            (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
        );
    }

    // Apply sorting
    if (state.currentSort === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        filteredTasks.sort(
            (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
        );
    } else if (state.currentSort === 'duedate') {
        filteredTasks.sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
            const dateB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
            return dateA - dateB;
        });
    } else {
        filteredTasks.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    // Render tasks
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '';
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        tasksList.innerHTML = filteredTasks
            .map((task) => createTaskCardHTML(task))
            .join('');

        // Add event listeners to task cards
        document.querySelectorAll('.task-card').forEach((card) => {
            const checkbox = card.querySelector('.task-checkbox');
            const editBtn = card.querySelector('.edit-btn');
            const taskId = parseFloat(card.dataset.taskId);

            checkbox.addEventListener('change', () => {
                toggleTaskComplete(taskId);
            });

            editBtn.addEventListener('click', () => {
                openTaskModal(taskId);
            });

            card.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('input')) {
                    openTaskModal(taskId);
                }
            });
        });
    }

    updateStats();
}

function createTaskCardHTML(task) {
    const isOverdue =
        task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
    const dueText = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '';

    return `
        <div class="task-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-header">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-title">${escapeHtml(task.title)}</div>
                <button class="task-menu">⋮</button>
            </div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
                <span class="priority-badge ${task.priority}">
                    ${task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '✓'}
                    ${task.priority}
                </span>
                <span class="category-badge">${task.category}</span>
                ${task.reminder ? '<span class="reminder-indicator">🔔 Reminder set</span>' : ''}
            </div>
            ${dueText ? `
                <div class="due-date ${isOverdue ? 'overdue' : ''}">
                    📅 ${dueText}
                    ${isOverdue ? ' (Overdue!)' : ''}
                </div>
            ` : ''}
            <div class="task-actions">
                <button class="edit-btn">✏️ Edit</button>
            </div>
        </div>
    `;
}

function updateStats() {
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter((t) => t.completed).length;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
}

// ============================================================================
// MODAL MANAGEMENT
// ============================================================================

function openTaskModal(taskId) {
    state.editingTaskId = taskId;
    const task = state.tasks.find((t) => t.id === taskId);

    if (task) {
        modalTitle.textContent = 'Edit Task';
        modalTaskTitle.value = task.title;
        modalTaskDesc.value = task.description;
        modalTaskPriority.value = task.priority;
        modalTaskCategory.value = task.category;
        modalTaskReminder.checked = task.reminder;

        if (task.dueDate) {
            const date = new Date(task.dueDate);
            const isoString = date.toISOString().slice(0, 16);
            modalTaskDueDate.value = isoString;
        } else {
            modalTaskDueDate.value = '';
        }

        deleteTaskBtn.style.display = 'inline-block';
    } else {
        modalTitle.textContent = 'New Task';
        modalTaskTitle.value = '';
        modalTaskDesc.value = '';
        modalTaskPriority.value = 'medium';
        modalTaskCategory.value = 'other';
        modalTaskReminder.checked = false;
        modalTaskDueDate.value = '';
        deleteTaskBtn.style.display = 'none';
    }

    taskModal.classList.remove('hidden');
}

function closeTaskModal() {
    taskModal.classList.add('hidden');
    state.editingTaskId = null;
}

function saveTask() {
    const title = modalTaskTitle.value.trim();

    if (!title) {
        showNotification('Please enter a task title', 'error');
        return;
    }

    const taskData = {
        title: title,
        description: modalTaskDesc.value,
        priority: modalTaskPriority.value,
        category: modalTaskCategory.value,
        dueDate: modalTaskDueDate.value ? new Date(modalTaskDueDate.value) : null,
        reminder: modalTaskReminder.checked,
    };

    if (state.editingTaskId) {
        updateTask(state.editingTaskId, taskData);
        showNotification('✏️ Task updated', 'success');
    } else {
        const newTask = {
            id: Date.now() + Math.random(),
            ...taskData,
            completed: false,
            createdAt: new Date(),
        };
        state.tasks.push(newTask);
        showNotification('✅ Task created', 'success');
    }

    saveTasksToStorage();
    renderTasks();
    closeTaskModal();
}

function deleteTask() {
    if (state.editingTaskId && confirm('Are you sure you want to delete this task?')) {
        deleteTaskFromState(state.editingTaskId);
        closeTaskModal();
    }
}

// ============================================================================
// VIEW & SORT MANAGEMENT
// ============================================================================

function handleViewChange(e) {
    viewBtns.forEach((btn) => btn.classList.remove('active'));
    e.target.classList.add('active');
    state.currentView = e.target.dataset.view;
    renderTasks();
}

function handleSort(e) {
    state.currentSort = e.target.value;
    renderTasks();
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </div>
        <div class="notification-text">${message}</div>
        <button class="notification-close">✕</button>
    `;

    notificationArea.appendChild(notification);

    notification
        .querySelector('.notification-close')
        .addEventListener('click', () => {
            notification.remove();
        });

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ============================================================================
// REMINDER SYSTEM
// ============================================================================

function checkReminders() {
    const now = new Date();
    state.tasks.forEach((task) => {
        if (
            task.reminder &&
            !task.completed &&
            task.dueDate &&
            !state.reminderIntervals[task.id]
        ) {
            const dueDate = new Date(task.dueDate);
            const timeUntilDue = dueDate - now;

            // Show reminder if task is due within next 5 minutes
            if (timeUntilDue > 0 && timeUntilDue < 5 * 60 * 1000) {
                showReminder(task);
                state.reminderIntervals[task.id] = true;
            }
        }
    });
}

function showReminder(task) {
    reminderTitle.textContent = task.title;
    reminderDesc.textContent = task.description || 'This task is due soon!';
    reminderNotification.classList.remove('hidden');

    setTimeout(() => {
        if (!reminderNotification.classList.contains('hidden')) {
            reminderNotification.classList.add('hidden');
        }
    }, 10000);
}

function dismissReminder() {
    reminderNotification.classList.add('hidden');
}

function completeFromReminder() {
    reminderNotification.classList.add('hidden');
    // Note: In a real app, you'd need to track which task the reminder is for
}

// ============================================================================
// LOCAL STORAGE
// ============================================================================

function saveTasksToStorage() {
    localStorage.setItem('todoTasks', JSON.stringify(state.tasks));
}

function loadTasksFromStorage() {
    const stored = localStorage.getItem('todoTasks');
    if (stored) {
        try {
            state.tasks = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading tasks from storage:', e);
            state.tasks = [];
        }
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeAISuggestions() {
    aiSuggestions.classList.add('hidden');
}