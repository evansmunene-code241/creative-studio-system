// Check authentication
if (!checkAuth()) {
  window.location.href = 'index.html';
}

let currentProjectId = null;
let currentDeliverableId = null;

// Initialize portal
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  document.getElementById('clientUsername').textContent = user.username || 'Client';

  loadProjects();
  loadNotifications();
  setInterval(loadNotifications, 30000); // Refresh every 30 seconds
});

// Section Navigation
function showSection(sectionName) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const section = document.getElementById(sectionName + '-section');
  if (section) {
    section.classList.add('active');
    event.target.classList.add('active');

    if (sectionName === 'projects') {
      loadProjects();
    } else if (sectionName === 'deliverables') {
      loadDeliverables();
    } else if (sectionName === 'messages') {
      loadConversations();
    } else if (sectionName === 'invoices') {
      loadInvoices();
    }
  }
}

// ============ PROJECTS ============

function loadProjects() {
  const token = getToken();
  const container = document.getElementById('projectsList');

  fetch(`${API_URL}/projects`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(projects => {
      if (!projects || projects.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No projects assigned to you yet.</p></div>';
        updateProjectStats([]);
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Deadline</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${projects.map(p => `
                <tr>
                  <td><strong>${escapeHtml(p.name)}</strong></td>
                  <td><span class="status-badge status-${p.status}">${p.status}</span></td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${p.progress}%"></div>
                    </div>
                    ${p.progress}%
                  </td>
                  <td>${formatDate(p.deadline)}</td>
                  <td>
                    <button class="btn btn-primary" onclick="viewProjectDetails(${p.id})">View</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      updateProjectStats(projects);
    })
    .catch(e => {
      console.error('Error loading projects:', e);
      container.innerHTML = '<div class="empty-state"><p>Failed to load projects</p></div>';
    });
}

function updateProjectStats(projects) {
  const active = projects.filter(p => p.status !== 'completed').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  
  document.getElementById('activeProjectsCount').textContent = active;
  document.getElementById('completedProjectsCount').textContent = completed;
  
  // Calculate pending approvals from deliverables
  fetch(`${API_URL}/approvals/pending`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then(r => r.json())
    .then(deliverables => {
      document.getElementById('pendingApprovalsCount').textContent = deliverables.length || 0;
    })
    .catch(e => console.error('Error loading pending approvals:', e));
}

function viewProjectDetails(projectId) {
  const token = getToken();

  fetch(`${API_URL}/projects/${projectId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(project => {
      alert(`Project: ${project.name}\n\nStatus: ${project.status}\nProgress: ${project.progress}%\nDeadline: ${formatDate(project.deadline)}\n\n${project.description || ''}`);
    })
    .catch(e => alert('Failed to load project details'));
}

// ============ DELIVERABLES ============

function loadDeliverables() {
  const token = getToken();
  const container = document.getElementById('deliverablesList');

  fetch(`${API_URL}/approvals/pending`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(deliverables => {
      if (!deliverables || deliverables.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No pending deliverables.</p></div>';
        return;
      }

      container.innerHTML = deliverables.map(d => `
        <div class="deliverable-card">
          <div class="deliverable-header">
            <h4 class="deliverable-title">${escapeHtml(d.title)}</h4>
            <span class="status-badge status-${d.status}">${d.status}</span>
          </div>
          <div class="deliverable-meta">
            <span class="deliverable-status"><strong>Project:</strong> ${escapeHtml(d.projectName)}</span>
            <span><strong>Due:</strong> ${formatDate(d.dueDate)}</span>
          </div>
          ${d.description ? `<div class="deliverable-description">${escapeHtml(d.description)}</div>` : ''}
          <div class="deliverable-actions">
            <button class="btn btn-primary" onclick="viewDeliverableDetail(${d.id})">View Details</button>
            ${d.status === 'pending' || d.status === 'submitted' ? `
              <button class="btn btn-success" onclick="openApprovalModal(${d.id})">Approve</button>
              <button class="btn btn-danger" onclick="openRejectionModal(${d.id})">Reject</button>
            ` : ''}
          </div>
        </div>
      `).join('');
    })
    .catch(e => {
      console.error('Error loading deliverables:', e);
      container.innerHTML = '<div class="empty-state"><p>Failed to load deliverables</p></div>';
    });
}

function viewDeliverableDetail(deliverableId) {
  const token = getToken();

  fetch(`${API_URL}/approvals/${deliverableId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(d => {
      currentDeliverableId = d.id;
      document.getElementById('deliverableTitle').textContent = d.title;
      document.getElementById('deliverableStatus').textContent = d.status;
      document.getElementById('deliverableStatus').className = `status-badge status-${d.status}`;
      document.getElementById('deliverableDueDate').textContent = formatDate(d.dueDate);
      document.getElementById('deliverableDescription').textContent = d.description || 'No description';
      document.getElementById('deliverableNotes').textContent = d.submissionNotes || 'No notes';

      // Show/hide action buttons based on status
      const actions = document.getElementById('deliverableActions');
      if (d.status === 'pending' || d.status === 'submitted') {
        actions.innerHTML = `
          <p><strong>Status:</strong> Awaiting your approval</p>
        `;
        document.getElementById('approveBtnModal').style.display = 'inline-block';
        document.getElementById('rejectBtnModal').style.display = 'inline-block';
      } else if (d.status === 'approved') {
        actions.innerHTML = `
          <p style="color: #10b981;"><strong>✓ Approved on:</strong> ${formatDate(d.approvalDate)}</p>
          ${d.approvalNotes ? `<p><strong>Approval Notes:</strong> ${escapeHtml(d.approvalNotes)}</p>` : ''}
        `;
        document.getElementById('approveBtnModal').style.display = 'none';
        document.getElementById('rejectBtnModal').style.display = 'none';
      } else if (d.status === 'rejected') {
        actions.innerHTML = `
          <p style="color: #ef4444;"><strong>✕ Rejected on:</strong> ${formatDate(d.rejectionDate)}</p>
          ${d.rejectionReason ? `<p><strong>Reason:</strong> ${escapeHtml(d.rejectionReason)}</p>` : ''}
        `;
        document.getElementById('approveBtnModal').style.display = 'none';
        document.getElementById('rejectBtnModal').style.display = 'none';
      }

      document.getElementById('deliverableModal').style.display = 'block';
    })
    .catch(e => alert('Failed to load deliverable details'));
}

function openApprovalModal(deliverableId) {
  currentDeliverableId = deliverableId;
  viewDeliverableDetail(deliverableId);
}

function openRejectionModal(deliverableId) {
  currentDeliverableId = deliverableId;
  viewDeliverableDetail(deliverableId);
}

function approveDeliverable() {
  if (!currentDeliverableId) return;

  const token = getToken();
  const notes = document.getElementById('approvalNotes').value;

  fetch(`${API_URL}/approvals/${currentDeliverableId}/approve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ approvalNotes: notes })
  })
    .then(r => r.json())
    .then(data => {
      alert('Deliverable approved successfully');
      closeDeliverableModal();
      loadDeliverables();
    })
    .catch(e => alert('Failed to approve deliverable'));
}

function rejectDeliverable() {
  if (!currentDeliverableId) return;

  const token = getToken();
  const reason = document.getElementById('approvalNotes').value;

  if (!reason) {
    alert('Please provide a reason for rejection');
    return;
  }

  fetch(`${API_URL}/approvals/${currentDeliverableId}/reject`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ rejectionReason: reason })
  })
    .then(r => r.json())
    .then(data => {
      alert('Deliverable rejected');
      closeDeliverableModal();
      loadDeliverables();
    })
    .catch(e => alert('Failed to reject deliverable'));
}

function closeDeliverableModal() {
  document.getElementById('deliverableModal').style.display = 'none';
  document.getElementById('approvalNotes').value = '';
  currentDeliverableId = null;
}

// ============ MESSAGES ============

function loadConversations() {
  const token = getToken();
  const container = document.getElementById('conversationsList');

  fetch(`${API_URL}/projects`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(projects => {
      if (!projects || projects.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No projects to discuss.</p></div>';
        return;
      }

      container.innerHTML = projects.map(p => `
        <div class="conversation-item" onclick="loadProjectMessages(${p.id}, '${escapeHtml(p.name)}')">
          <div class="conversation-name">${escapeHtml(p.name)}</div>
          <div class="conversation-preview">Click to view discussion</div>
        </div>
      `).join('');
    })
    .catch(e => console.error('Error loading conversations:', e));
}

function loadProjectMessages(projectId, projectName) {
  currentProjectId = projectId;
  const token = getToken();
  const thread = document.getElementById('messageThread');

  fetch(`${API_URL}/communications/project/${projectId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(messages => {
      if (!messages || messages.length === 0) {
        thread.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 20px;">No messages yet. Start a discussion!</p>';
      } else {
        thread.innerHTML = messages.map(m => {
          const isOwn = m.senderId === JSON.parse(localStorage.getItem('user') || '{}').id;
          return `
            <div class="message-bubble ${isOwn ? 'sent' : 'received'}">
              <div>
                <div class="bubble-content">${escapeHtml(m.content)}</div>
                <div class="bubble-time">${new Date(m.createdAt).toLocaleString()}</div>
              </div>
            </div>
          `;
        }).join('');
      }

      document.getElementById('messageInputArea').style.display = 'block';
    })
    .catch(e => {
      console.error('Error loading messages:', e);
      thread.innerHTML = '<p style="color: #ef4444;">Failed to load messages</p>';
    });
}

function sendMessage() {
  if (!currentProjectId) {
    alert('Please select a project first');
    return;
  }

  const token = getToken();
  const content = document.getElementById('messageInput').value;

  if (!content.trim()) {
    alert('Please enter a message');
    return;
  }

  fetch(`${API_URL}/communications/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      projectId: currentProjectId,
      content: content,
      type: 'message'
    })
  })
    .then(r => r.json())
    .then(data => {
      document.getElementById('messageInput').value = '';
      loadProjectMessages(currentProjectId, 'Project');
    })
    .catch(e => alert('Failed to send message'));
}

// ============ INVOICES ============

function loadInvoices() {
  const token = getToken();
  const container = document.getElementById('invoicesList');

  fetch(`${API_URL}/projects`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(projects => {
      let totalInvoiced = 0;
      let totalPaid = 0;
      let totalPending = 0;

      // For now, show project budgets as invoices
      const invoices = projects.map(p => {
        const status = p.spent >= p.budget ? 'paid' : 'pending';
        if (status === 'paid') totalPaid += p.budget;
        else totalPending += p.budget;
        totalInvoiced += p.budget;

        return {
          id: p.id,
          number: `INV-${p.id}`,
          project: p.name,
          amount: p.budget,
          status: status,
          dueDate: p.deadline
        };
      });

      document.getElementById('totalInvoiced').textContent = `$${totalInvoiced.toFixed(2)}`;
      document.getElementById('totalPaid').textContent = `$${totalPaid.toFixed(2)}`;
      document.getElementById('totalPending').textContent = `$${totalPending.toFixed(2)}`;

      if (invoices.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No invoices yet.</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => `
                <tr>
                  <td><strong>${inv.number}</strong></td>
                  <td>${escapeHtml(inv.project)}</td>
                  <td>$${inv.amount.toFixed(2)}</td>
                  <td><span class="status-badge status-${inv.status}">${inv.status}</span></td>
                  <td>${formatDate(inv.dueDate)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(e => {
      console.error('Error loading invoices:', e);
      container.innerHTML = '<div class="empty-state"><p>Failed to load invoices</p></div>';
    });
}

// ============ NOTIFICATIONS ============

function loadNotifications() {
  const token = getToken();

  fetch(`${API_URL}/notifications/unread`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(notifications => {
      const badge = document.getElementById('notificationBadge');
      if (notifications && notifications.length > 0) {
        badge.textContent = notifications.length;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }

      displayNotifications(notifications);
    })
    .catch(e => console.error('Error loading notifications:', e));
}

function displayNotifications(notifications) {
  const container = document.getElementById('notificationsList');

  if (!notifications || notifications.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding: 20px;"><p>No notifications</p></div>';
    return;
  }

  container.innerHTML = notifications.map(n => `
    <div class="notification-item ${n.isRead ? '' : 'unread'}" onclick="markNotificationAsRead(${n.id})">
      <div class="notification-title">${escapeHtml(n.title)}</div>
      <div class="notification-message">${escapeHtml(n.message || '')}</div>
      <div class="notification-time">${formatDate(n.createdAt)}</div>
    </div>
  `).join('');
}

function toggleNotifications() {
  const panel = document.getElementById('notificationsPanel');
  panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  if (panel.style.display === 'flex') {
    loadNotifications();
  }
}

function markNotificationAsRead(notificationId) {
  const token = getToken();

  fetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(() => loadNotifications())
    .catch(e => console.error('Error marking notification as read:', e));
}

// ============ HELPERS ============

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
