// Admin Projects Management
// Uses API_URL from admin.js

// Initialize projects
async function initProjects() {
  await loadProjects();
  await loadTeamMembers();
  await loadClients();
}

// Load all projects
async function loadProjects() {
  const token = localStorage.getItem('token');
  const container = document.getElementById('projectsList');

  try {
    const response = await fetch(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load projects');

    const projects = await response.json();
    updateProjectsList(projects);
    updateProjectStats(projects);
  } catch (error) {
    console.error('Error loading projects:', error);
    container.innerHTML = '<div class="empty-state"><p>Failed to load projects</p></div>';
  }
}

// Update projects list display
function updateProjectsList(projects) {
  const container = document.getElementById('projectsList');

  if (projects.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No projects yet. Create one to get started.</p></div>';
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Client</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Progress</th>
            <th>Assigned To</th>
            <th>Deadline</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${projects.map(p => `
            <tr>
              <td><strong>${p.name}</strong></td>
              <td>${p.clientName || 'N/A'}</td>
              <td><span class="status-badge status-${getStatusClass(p.status)}">${p.status}</span></td>
              <td><span class="priority-${p.priority}">${p.priority}</span></td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${p.progress}%"></div>
                </div>
                ${p.progress}%
              </td>
              <td>${p.assignedToName || 'Unassigned'}</td>
              <td>${formatDate(p.deadline)}</td>
              <td>
                <button class="btn-success" onclick="editProject(${p.id})">Edit</button>
                <button class="btn-danger" onclick="deleteProject(${p.id})">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Update project stats
function updateProjectStats(projects) {
  const activeProjects = projects.filter(p => p.status !== 'completed').length;
  document.getElementById('activeProjectsCount').textContent = activeProjects;
}

// Show create project modal
function showCreateProjectModal() {
  document.getElementById('projectForm').reset();
  document.getElementById('projectModal').style.display = 'block';
}

// Close project modal
function closeProjectModal() {
  document.getElementById('projectModal').style.display = 'none';
}

// Save project
async function saveProject(event) {
  event.preventDefault();

  // Validate form
  const validation = validateProjectForm();
  if (!validation.valid) {
    console.warn('Form validation failed:', validation.errors);
    return;
  }

  const token = localStorage.getItem('token');
  const submitBtn = event.target.querySelector('button[type="submit"]');
  
  const formData = {
    name: document.getElementById('projectName').value.trim(),
    description: document.getElementById('projectDescription').value.trim(),
    clientId: document.getElementById('projectClient').value || null,
    startDate: document.getElementById('projectStartDate').value,
    deadline: document.getElementById('projectDeadline').value,
    priority: document.getElementById('projectPriority').value,
    budget: parseFloat(document.getElementById('projectBudget').value) || 0,
    assignedTo: document.getElementById('projectAssignTo').value || null
  };

  // Show loading state
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Failed to create project');

    showAlert('✓ Project created successfully', 'success');
    closeProjectModal();
    resetForm('projectForm');
    await loadProjects();
  } catch (error) {
    console.error('Error saving project:', error);
    showAlert('✗ Failed to create project: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Edit project
async function editProject(projectId) {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load project');

    const project = await response.json();
    
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description || '';
    document.getElementById('projectClient').value = project.clientId || '';
    document.getElementById('projectStartDate').value = project.startDate || '';
    document.getElementById('projectDeadline').value = project.deadline || '';
    document.getElementById('projectPriority').value = project.priority || 'medium';
    document.getElementById('projectBudget').value = project.budget || '';
    document.getElementById('projectAssignTo').value = project.assignedTo || '';

    // Change form to update mode
    const form = document.getElementById('projectForm');
    form.onsubmit = (e) => updateProject(e, projectId);
    document.querySelector('#projectModal h3').textContent = 'Edit Project';
    
    document.getElementById('projectModal').style.display = 'block';
  } catch (error) {
    console.error('Error loading project:', error);
    alert('Failed to load project');
  }
}

// Update project
async function updateProject(event, projectId) {
  event.preventDefault();

  const token = localStorage.getItem('token');
  const formData = {
    name: document.getElementById('projectName').value,
    description: document.getElementById('projectDescription').value,
    clientId: document.getElementById('projectClient').value || null,
    startDate: document.getElementById('projectStartDate').value,
    deadline: document.getElementById('projectDeadline').value,
    priority: document.getElementById('projectPriority').value,
    budget: parseFloat(document.getElementById('projectBudget').value) || 0,
    assignedTo: document.getElementById('projectAssignTo').value || null
  };

  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Failed to update project');

    closeProjectModal();
    await loadProjects();
    alert('Project updated successfully');
  } catch (error) {
    console.error('Error updating project:', error);
    alert('Failed to update project');
  }
}

// Delete project
async function deleteProject(projectId) {
  if (!confirm('Are you sure you want to delete this project?')) return;

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete project');

    await loadProjects();
    alert('Project deleted successfully');
  } catch (error) {
    console.error('Error deleting project:', error);
    alert('Failed to delete project');
  }
}

// Load team members for assignment
async function loadTeamMembers() {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/roles/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load team members');

    const users = await response.json();
    const select = document.getElementById('projectAssignTo');
    
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.username} (${user.role})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading team members:', error);
  }
}

// Load clients
async function loadClients() {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/clients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load clients');

    const clients = await response.json();
    const select = document.getElementById('projectClient');
    
    clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading clients:', error);
  }
}

// Helper functions
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function getStatusClass(status) {
  const statusMap = {
    'planning': 'pending',
    'in-progress': 'in-progress',
    'completed': 'active',
    'on-hold': 'pending'
  };
  return statusMap[status] || 'pending';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('projectsList')) {
    initProjects();
  }
});
