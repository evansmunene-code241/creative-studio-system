// Check authentication
if (!checkAuth()) {
  window.location.href = 'index.html';
}

// Check if user is admin - Liza only
const user = JSON.parse(localStorage.getItem('user') || '{}');
if (user.role !== 'admin' || user.username !== 'Liza') {
  showAlert('Access Denied: Only Liza (Admin) can access this dashboard', 'error');
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 2000);
}

let adminStorageChart = null;

// Collapsible sections
function toggleCollapsible(headerElement) {
  const card = headerElement.closest('.collapsible-card');
  const body = card.querySelector('.collapsible-body');
  
  card.classList.toggle('collapsed');
  body.style.display = body.style.display === 'none' ? 'block' : 'none';
}

// Financial tabs
function switchFinancialTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  const tabElement = document.getElementById(tabName + '-tab');
  if (tabElement) {
    tabElement.classList.add('active');
  }
  
  // Mark button as active
  event.target.closest('.tab-button').classList.add('active');
}

// Section navigation
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });

  // Remove active class from all nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  // Show selected section
  const section = document.getElementById(sectionName + '-section');
  if (section) {
    section.classList.add('active');
  }

  // Add active class to clicked nav link
  event.target.classList.add('active');

  // Load data for the section
  if (sectionName === 'overview') {
    loadAdminStorageStats();
    loadProjectStats();
  } else if (sectionName === 'projects') {
    loadProjects();
  } else if (sectionName === 'users') {
    loadPendingUsers();
    loadAllUsersNew();
  } else if (sectionName === 'tasks') {
    loadTasks();
  } else if (sectionName === 'financials') {
    loadFinancialSummary();
  } else if (sectionName === 'logs') {
    loadBackupHistory();
    loadBackupLogs();
    loadAuditLogs();
  }
}

// Load pending users
function loadPendingUsers() {
  const pendingUsers = document.getElementById('pendingUsers');

  fetch(`${API_URL}/admin/pending-users`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.users || data.users.length === 0) {
        pendingUsers.innerHTML = '<div class="empty-state"><p>No pending users</p></div>';
        return;
      }

      pendingUsers.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${data.users.map(user => `
                <tr>
                  <td><strong>${escapeHtml(user.username)}</strong></td>
                  <td>${escapeHtml(user.email)}</td>
                  <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onclick="approveUser(${user.id})" class="btn-success">Approve</button>
                    <button onclick="rejectUser(${user.id})" class="btn-danger">Reject</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(err => console.error('Error loading pending users:', err));
}

// Load all users (new)
function loadAllUsersNew() {
  const allUsers = document.getElementById('allUsers');

  fetch(`${API_URL}/roles/users`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => res.json())
    .then(users => {
      if (!users || users.length === 0) {
        allUsers.innerHTML = '<div class="empty-state"><p>No approved users</p></div>';
        return;
      }

      allUsers.innerHTML = `
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
                  <td><strong>${escapeHtml(user.username)}</strong></td>
                  <td>${escapeHtml(user.email)}</td>
                  <td>
                    <select onchange="changeUserRole(${user.id}, this.value)" style="padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 13px;">
                      <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                      <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                      <option value="team-member" ${user.role === 'team-member' ? 'selected' : ''}>Team Member</option>
                      <option value="client" ${user.role === 'client' ? 'selected' : ''}>Client</option>
                      <option value="guest" ${user.role === 'guest' ? 'selected' : ''}>Guest</option>
                    </select>
                  </td>
                  <td><span class="status-badge status-${user.status === 'approved' ? 'active' : 'pending'}">${user.status}</span></td>
                  <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onclick="deleteUserAdmin(${user.id}, '${user.username}')" class="btn-danger">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(err => console.error('Error loading all users:', err));
}

// Load backup history with modern card layout
function loadBackupHistory() {
  const container = document.getElementById('backupHistoryCard');
  const countSpan = document.getElementById('backupCount');

  fetch(`${API_URL}/backups/admin/history`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.backups || data.backups.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>📭 No backups yet</p></div>';
        countSpan.textContent = '0';
        return;
      }

      countSpan.textContent = data.backups.length;

      const backupHTML = data.backups.slice(0, 20).map(backup => {
        const date = new Date(backup.createdAt);
        const completedAt = backup.completedAt ? new Date(backup.completedAt) : null;
        const fileSize = backup.fileSize ? formatFileSize(backup.fileSize) : 'N/A';
        
        // Format exact time with seconds
        const formattedTime = date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        
        const formattedCompleted = completedAt ? completedAt.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) : null;
        
        const statusBadge = backup.status === 'completed' 
          ? '<span class="backup-status-completed">✅ Completed</span>'
          : backup.status === 'failed'
          ? '<span class="backup-status-failed">❌ Failed</span>'
          : '<span class="backup-status-pending">⏳ Pending</span>';

        return `
          <div class="backup-history-item">
            <div class="backup-header">
              <div class="backup-info">
                <h4>📄 ${escapeHtml(backup.fileName || 'Unknown File')}</h4>
                <div class="backup-meta">
                  <span class="backup-user">👤 ${escapeHtml(backup.username)}</span>
                  <span class="backup-size">💾 ${fileSize}</span>
                  <span class="backup-time">🕐 ${formattedTime}</span>
                </div>
              </div>
              <div class="backup-status-container">
                ${statusBadge}
              </div>
            </div>
            ${formattedCompleted ? `<div class="backup-footer">✓ Completed: ${formattedCompleted}</div>` : ''}
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="backup-history-list">
          ${backupHTML}
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
          Showing latest ${Math.min(20, data.backups.length)} of ${data.backups.length} backups
        </div>
      `;
    })
    .catch(err => {
      console.error('Error loading backup history:', err);
      container.innerHTML = '<div class="error"><p>Failed to load backup history</p></div>';
    });
}

// Format file size
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Load backup logs (legacy function)
function loadBackupLogs() {
  const backupLogs = document.getElementById('backupLogs');

  fetch(`${API_URL}/admin/backup-logs`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.logs || data.logs.length === 0) {
        backupLogs.innerHTML = '<div class="empty-state"><p>No backup logs</p></div>';
        return;
      }

      backupLogs.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>File</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.logs.slice(0, 50).map(log => `
                <tr>
                  <td>${escapeHtml(log.username || 'System')}</td>
                  <td>${escapeHtml(log.originalName || 'N/A')}</td>
                  <td><span class="status-badge status-${log.status}">${log.status}</span></td>
                  <td>${new Date(log.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(err => console.error('Error loading backup logs:', err));
}

// Load audit logs
function loadAuditLogs() {
  const auditLogs = document.getElementById('auditLogs');

  fetch(`${API_URL}/admin/audit-logs`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.logs || data.logs.length === 0) {
        auditLogs.innerHTML = '<div class="empty-state"><p>No audit logs</p></div>';
        return;
      }

      auditLogs.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.logs.slice(0, 50).map(log => `
                <tr>
                  <td>${escapeHtml(log.username || 'System')}</td>
                  <td>${escapeHtml(log.action)}</td>
                  <td style="font-size: 13px; max-width: 200px;">${escapeHtml(log.details || '-')}</td>
                  <td>${new Date(log.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(err => console.error('Error loading audit logs:', err));
}

// Load admin storage stats
function loadAdminStorageStats() {
  fetch(`${API_URL}/admin/storage-stats`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.summary) {
        const summary = data.summary;
        document.getElementById('totalUsersText').textContent = summary.totalUsers;
        document.getElementById('totalStorageText').textContent = summary.totalUsedMB + ' MB';
        document.getElementById('maxStorageText').textContent = summary.totalMaxMB + ' MB';
        document.getElementById('overallPercentageText').textContent = summary.overallPercentage + '%';
        document.getElementById('storageUsagePercent').textContent = summary.overallPercentage + '%';

        // Create bar chart showing top users by storage
        const ctx = document.getElementById('adminStorageChart');
        if (ctx && data.stats.length > 0) {
          const topUsers = data.stats.slice(0, 10);
          const usernames = topUsers.map(u => u.username);
          const storages = topUsers.map(u => parseFloat(u.usedMB));

          if (adminStorageChart) {
            adminStorageChart.data.labels = usernames;
            adminStorageChart.data.datasets[0].data = storages;
            adminStorageChart.update();
          } else {
            const canvas = ctx;
            adminStorageChart = new Chart(canvas, {
              type: 'bar',
              data: {
                labels: usernames,
                datasets: [{
                  label: 'Storage Used (MB)',
                  data: storages,
                  backgroundColor: 'rgba(37, 99, 235, 0.8)',
                  borderColor: 'rgba(37, 99, 235, 1)',
                  borderWidth: 2,
                  borderRadius: 6
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    max: 50
                  }
                }
              }
            });
          }
        }
      }
    })
    .catch(err => console.error('Error loading storage stats:', err));
}

// Load project stats
function loadProjectStats() {
  fetch(`${API_URL}/projects`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => res.json())
    .then(projects => {
      const active = projects.filter(p => p.status !== 'completed').length;
      document.getElementById('activeProjectsCount').textContent = active;
    })
    .catch(err => console.error('Error loading project stats:', err));
}

// Load projects list
function loadProjects() {
  const projectsList = document.getElementById('projectsList');
  
  fetch(`${API_URL}/projects`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => res.json())
    .then(projects => {
      if (!projects || projects.length === 0) {
        projectsList.innerHTML = '<div class="empty-state"><p>No projects</p></div>';
        return;
      }

      projectsList.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Client</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Start Date</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${projects.map(project => `
                <tr>
                  <td><strong>${escapeHtml(project.name)}</strong></td>
                  <td>${escapeHtml(project.clientName || 'N/A')}</td>
                  <td><span class="status-badge status-${project.status}">${project.status}</span></td>
                  <td><span style="color: ${project.priority === 'high' ? '#ef4444' : project.priority === 'medium' ? '#f59e0b' : '#22c55e'};">${project.priority}</span></td>
                  <td>${new Date(project.startDate).toLocaleDateString()}</td>
                  <td>${new Date(project.deadline).toLocaleDateString()}</td>
                  <td>
                    <button onclick="editProject(${project.id})" class="btn-primary">Edit</button>
                    <button onclick="deleteProject(${project.id})" class="btn-danger">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(err => console.error('Error loading projects:', err));
}

// Load tasks
function loadTasks() {
  const tasksList = document.getElementById('tasksList');
  
  fetch(`${API_URL}/tasks`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => res.json())
    .then(tasks => {
      if (!tasks || tasks.length === 0) {
        tasksList.innerHTML = '<div class="empty-state"><p>No tasks</p></div>';
        return;
      }

      tasksList.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Project</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(task => `
                <tr>
                  <td><strong>${escapeHtml(task.title)}</strong></td>
                  <td>${escapeHtml(task.projectName || 'N/A')}</td>
                  <td>${escapeHtml(task.assignedToName || 'Unassigned')}</td>
                  <td><span class="status-badge status-${task.status}">${task.status}</span></td>
                  <td><span style="color: ${task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#22c55e'};">${task.priority}</span></td>
                  <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button onclick="editTask(${task.id})" class="btn-primary">Edit</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(err => console.error('Error loading tasks:', err));
}

// Project actions
function editProject(projectId) {
  showAlert('Edit project functionality coming soon', 'info');
}

function deleteProject(projectId) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  
  fetch(`${API_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(res => res.json())
    .then(data => {
      showAlert('Project deleted successfully', 'success');
      loadProjects();
    })
    .catch(err => {
      showAlert('Failed to delete project', 'error');
      console.error(err);
    });
}

// Task actions
function editTask(taskId) {
  showAlert('Edit task functionality coming soon', 'info');
}

// User role management
function changeUserRole(userId, newRole) {
  fetch(`${API_URL}/roles/assign/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: newRole })
  })
    .then(res => res.json())
    .then(data => {
      showAlert(`Role updated to ${newRole}`, 'success');
    })
    .catch(err => {
      showAlert('Failed to update role', 'error');
      loadAllUsersNew();
    });
}

// User actions
function approveUser(userId) {
  fetch(`${API_URL}/admin/approve-user`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        showAlert('User approved successfully!', 'success');
        loadPendingUsers();
      } else {
        showAlert(data.error || 'Failed to approve user', 'error');
      }
    })
    .catch(err => showAlert('Error: ' + err.message, 'error'));
}

function rejectUser(userId) {
  if (!confirm('Are you sure you want to reject this user?')) return;

  fetch(`${API_URL}/admin/reject-user`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        showAlert('User rejected successfully', 'success');
        loadPendingUsers();
      } else {
        showAlert(data.error || 'Failed to reject user', 'error');
      }
    })
    .catch(err => showAlert('Error: ' + err.message, 'error'));
}

function deleteUserAdmin(userId, username) {
  if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

  fetch(`${API_URL}/admin/delete-user`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        showAlert('User deleted successfully', 'success');
        loadAllUsersNew();
      } else {
        showAlert(data.error || 'Failed to delete user', 'error');
      }
    })
    .catch(err => showAlert('Error: ' + err.message, 'error'));
}

// Financial Summary
async function loadFinancialSummary() {
  try {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    
    // Get dashboard summary
    const dashRes = await fetch(`${API_URL}/financial/dashboard?year=${year}&month=${month}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const dashData = await dashRes.json();
    const summary = dashData.summary || {};

    // Get invoices
    const invRes = await fetch(`${API_URL}/invoices`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const invoices = await invRes.json();

    // Get expenses
    const expRes = await fetch(`${API_URL}/expenses`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const expenses = await expRes.json();

    // Get payments
    const payRes = await fetch(`${API_URL}/payments`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const payments = await payRes.json();

    // Update revenue and expenses
    document.getElementById('totalRevenueAmount').textContent = formatCurrency(summary.totalPaid || 0);
    document.getElementById('totalPendingAmount').textContent = formatCurrency(summary.totalPending || 0);
    document.getElementById('totalExpensesAmount').textContent = formatCurrency(summary.totalExpenses || 0);
    
    const profit = (summary.totalPaid || 0) - (summary.totalExpenses || 0);
    document.getElementById('totalProfitAmount').textContent = formatCurrency(profit);

    // Invoice summary
    document.getElementById('totalInvoicesCount').textContent = invoices.length;
    document.getElementById('paidInvoicesCount').textContent = invoices.filter(i => i.status === 'paid').length;
    document.getElementById('pendingInvoicesCount').textContent = invoices.filter(i => i.status === 'sent').length;
    document.getElementById('overdueInvoicesCount').textContent = invoices.filter(i => i.status === 'overdue').length;

    // Expense summary
    document.getElementById('totalExpensesCount').textContent = expenses.length;
    const monthExpenses = expenses.filter(e => {
      const eDate = new Date(e.expenseDate);
      return eDate.getFullYear() === year && eDate.getMonth() + 1 === month;
    });
    document.getElementById('monthExpensesAmount').textContent = formatCurrency(
      monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    );

    // Top category
    const categoryMap = {};
    expenses.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      document.getElementById('topExpenseCategory').textContent = topCategory[0];
      document.getElementById('topExpenseCategoryAmount').textContent = formatCurrency(topCategory[1]);
    }

    // Payment summary
    document.getElementById('totalPaymentsCount').textContent = payments.length;
    const monthPayments = payments.filter(p => {
      const pDate = new Date(p.paymentDate);
      return pDate.getFullYear() === year && pDate.getMonth() + 1 === month;
    });
    document.getElementById('monthPaymentsCount').textContent = monthPayments.length;
    const monthPaymentsAmount = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    document.getElementById('monthPaymentsAmount').textContent = formatCurrency(monthPaymentsAmount);

    // Collection rate
    const paidAmount = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalAmount = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const collectionRate = totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(0) : 0;
    document.getElementById('collectionRate').textContent = collectionRate + '%';

  } catch (error) {
    console.error('Error loading financial summary:', error);
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
  }).format(amount || 0);
}

// Helper function
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show alert
function showAlert(message, type) {
  const alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  
  let bgColor, textColor, borderColor;
  if (type === 'success') {
    bgColor = '#dcfce7';
    textColor = '#166534';
    borderColor = '#86efac';
  } else if (type === 'info') {
    bgColor = '#dbeafe';
    textColor = '#0c4a6e';
    borderColor = '#7dd3fc';
  } else {
    bgColor = '#fee2e2';
    textColor = '#991b1b';
    borderColor = '#fecaca';
  }
  
  alert.style.cssText = `
    padding: 12px;
    margin-bottom: 15px;
    border-radius: 4px;
    background: ${bgColor};
    color: ${textColor};
    border: 1px solid ${borderColor};
  `;

  alertContainer.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
  // Set admin username
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  document.getElementById('adminUsername').textContent = user.username || 'Admin';

  // Load overview on startup
  loadPendingUsers();
  loadBackupHistory();
  loadBackupLogs();
  loadAuditLogs();
  loadAdminStorageStats();
  loadProjectStats();
  loadFinancialSummary();

  // Refresh data periodically
  setInterval(() => {
    loadPendingUsers();
    loadBackupHistory();
    loadBackupLogs();
    loadAuditLogs();
    loadAdminStorageStats();
    loadProjectStats();
    loadFinancialSummary();
  }, 60000);
});
