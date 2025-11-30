// Admin Roles & Users Management
// Uses API_URL from admin.js

// Initialize roles management
async function initRoles() {
  await loadAllUsers();
}

// Load all users with roles
async function loadAllUsers() {
  const token = localStorage.getItem('token');
  const container = document.getElementById('allUsers');

  try {
    const response = await fetch(`${API_URL}/roles/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load users');

    const users = await response.json();
    displayUsersTable(users);
    updateUserStats(users);
  } catch (error) {
    console.error('Error loading users:', error);
    container.innerHTML = '<div class="empty-state"><p>Failed to load users</p></div>';
  }
}

// Display users table
function displayUsersTable(users) {
  const container = document.getElementById('allUsers');

  if (users.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No users registered yet.</p></div>';
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td><strong>${user.username}</strong></td>
              <td>${user.email}</td>
              <td>
                <select onchange="changeUserRole(${user.id}, this.value)" class="role-select">
                  <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                  <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                  <option value="team-member" ${user.role === 'team-member' ? 'selected' : ''}>Team Member</option>
                  <option value="client" ${user.role === 'client' ? 'selected' : ''}>Client</option>
                  <option value="guest" ${user.role === 'guest' ? 'selected' : ''}>Guest</option>
                </select>
              </td>
              <td><span class="status-badge status-${user.status === 'approved' ? 'active' : 'pending'}">${user.status}</span></td>
              <td>${formatDate(user.createdAt)}</td>
              <td>
                <button class="btn-danger" onclick="deleteUser(${user.id}, '${user.username}')">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Style the role selects
  document.querySelectorAll('.role-select').forEach(select => {
    select.style.padding = '6px 10px';
    select.style.borderRadius = '4px';
    select.style.border = '1px solid #e2e8f0';
    select.style.fontSize = '13px';
    select.style.cursor = 'pointer';
  });
}

// Update user stats
function updateUserStats(users) {
  const activeUsers = users.filter(u => u.status === 'approved').length;
  document.getElementById('activeUsersCount').textContent = activeUsers;
}

// Change user role
async function changeUserRole(userId, newRole) {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/roles/assign/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: newRole })
    });

    if (!response.ok) throw new Error('Failed to update role');

    const data = await response.json();
    alert(`Role updated to: ${data.role}`);
    await loadAllUsers();
  } catch (error) {
    console.error('Error changing role:', error);
    alert('Failed to update role');
    await loadAllUsers();
  }
}

// Delete user
async function deleteUser(userId, username) {
  if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
    return;
  }

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/admin/delete-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) throw new Error('Failed to delete user');

    alert('User deleted successfully');
    await loadAllUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Failed to delete user');
  }
}

// Filter users by role
function filterUsersByRole() {
  const selectedRole = document.getElementById('roleFilter').value;
  const token = localStorage.getItem('token');

  if (!selectedRole) {
    loadAllUsers();
    return;
  }

  fetch(`${API_URL}/roles/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(users => {
      const filtered = users.filter(u => u.role === selectedRole);
      displayUsersTable(filtered);
    })
    .catch(e => console.error('Error filtering users:', e));
}

// Load tasks
async function loadTasks() {
  const token = localStorage.getItem('token');
  const container = document.getElementById('tasksList');

  try {
    const response = await fetch(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load projects');

    const projects = await response.json();
    let allTasks = [];

    // Load tasks for each project
    for (const project of projects) {
      try {
        const taskResponse = await fetch(`${API_URL}/tasks/project/${project.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (taskResponse.ok) {
          const tasks = await taskResponse.json();
          allTasks = allTasks.concat(tasks.map(t => ({ ...t, projectName: project.name })));
        }
      } catch (e) {
        console.error('Error loading tasks for project:', project.id);
      }
    }

    displayTasksTable(allTasks);
    updateTaskStats(allTasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
    container.innerHTML = '<div class="empty-state"><p>Failed to load tasks</p></div>';
  }
}

// Display tasks table
function displayTasksTable(tasks) {
  const container = document.getElementById('tasksList');

  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No tasks found.</p></div>';
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Task Title</th>
            <th>Project</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assigned To</th>
            <th>Due Date</th>
            <th>Est. Hours</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(task => `
            <tr>
              <td>${task.title}</td>
              <td>${task.projectName || 'N/A'}</td>
              <td><span class="status-badge task-status-${task.status}">${task.status}</span></td>
              <td><span class="priority-${task.priority}">${task.priority}</span></td>
              <td>${task.assignedToName || 'Unassigned'}</td>
              <td>${formatDate(task.dueDate)}</td>
              <td>${task.estimatedHours ? task.estimatedHours + 'h' : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Update task stats
function updateTaskStats(tasks) {
  const pendingTasks = tasks.filter(t => ['todo', 'in-progress', 'review'].includes(t.status)).length;
  document.getElementById('pendingTasksCount').textContent = pendingTasks;
}

// Filter tasks by status
function filterTasksByStatus() {
  const selectedStatus = document.getElementById('taskStatusFilter').value;
  const token = localStorage.getItem('token');

  fetch(`${API_URL}/projects`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(async (projects) => {
      let allTasks = [];

      for (const project of projects) {
        try {
          const taskResponse = await fetch(`${API_URL}/tasks/project/${project.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (taskResponse.ok) {
            const tasks = await taskResponse.json();
            allTasks = allTasks.concat(tasks.map(t => ({ ...t, projectName: project.name })));
          }
        } catch (e) {
          console.error('Error loading tasks for project:', project.id);
        }
      }

      if (selectedStatus) {
        allTasks = allTasks.filter(t => t.status === selectedStatus);
      }

      displayTasksTable(allTasks);
    })
    .catch(e => console.error('Error filtering tasks:', e));
}

// Helper function
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('allUsers')) {
    initRoles();
  }
  if (document.getElementById('tasksList')) {
    loadTasks();
  }
});
