// Check authentication
if (!checkAuth()) {
  window.location.href = 'index.html';
}

// Mobile hamburger menu functions
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const hamburgerBtn = document.getElementById('hamburgerBtn');

  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
  hamburgerBtn.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const hamburgerBtn = document.getElementById('hamburgerBtn');

  sidebar.classList.remove('active');
  overlay.classList.remove('active');
  hamburgerBtn.classList.remove('active');
}

// Close sidebar when a nav item is clicked
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', closeSidebar);
});

let storageChart = null;
let overviewStorageChart = null;
let allFiles = [];
let allBackups = [];

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// File upload handlers
uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    fileInput.files = files;
    uploadFile();
  }
});

fileInput.addEventListener('change', uploadFile);

function uploadFile() {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  uploadProgress.style.display = 'block';

  fetch(`${API_URL}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    uploadProgress.style.display = 'none';
    if (data.message) {
      showAlert('File uploaded successfully!', 'success');
      fileInput.value = '';
      loadFiles();
      loadOverviewStats();
    } else {
      showAlert(data.error || 'Upload failed', 'error');
    }
  })
  .catch(err => {
    uploadProgress.style.display = 'none';
    showAlert('Upload error: ' + err.message, 'error');
  });
}

function loadFiles() {
  const filesList = document.getElementById('filesList');

  fetch(`${API_URL}/files/list`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  .then(res => res.json())
  .then(data => {
    allFiles = data.files || [];
    displayFiles(allFiles);
  })
  .catch(err => console.error('Error loading files:', err));
}

function displayFiles(files) {
  const filesList = document.getElementById('filesList');
  
  if (!files || files.length === 0) {
    filesList.innerHTML = '<p style="text-align: center; color: #999;">No files uploaded yet</p>';
    return;
  }

  filesList.innerHTML = files.map(file => `
    <div class="file-item">
      <div class="file-item-info">
        <div class="file-name">${escapeHtml(file.originalName)}</div>
        <div class="file-size">${formatFileSize(file.fileSize)} • ${formatDateSimpleEAT(file.uploadedAt)} • <span style="color: #27ae60;">✓ Ready</span></div>
      </div>
      <div class="file-actions">
        <button onclick="downloadFile(${file.id})" title="Download" class="action-btn download-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
        <button onclick="backupFile(${file.id})" title="Backup" class="action-btn backup-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 5 7 3 17 3 17 5"></polyline>
          </svg>
        </button>
        <button onclick="deleteFile(${file.id})" title="Delete" class="action-btn delete-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function filterFiles() {
  const searchTerm = document.getElementById('fileSearch').value.toLowerCase();
  const filtered = allFiles.filter(f => 
    f.originalName.toLowerCase().includes(searchTerm)
  );
  displayFiles(filtered);
}

function sortFiles() {
  const sortBy = document.getElementById('fileSortBy').value;
  let sorted = [...allFiles];
  
  if (sortBy === 'name') {
    sorted.sort((a, b) => a.originalName.localeCompare(b.originalName));
  } else if (sortBy === 'size') {
    sorted.sort((a, b) => b.fileSize - a.fileSize);
  } else {
    sorted.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }
  
  displayFiles(sorted);
}

function downloadFile(fileId) {
  fetch(`${API_URL}/files/download/${fileId}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'file';
    a.click();
    window.URL.revokeObjectURL(url);
  })
  .catch(err => showAlert('Download error: ' + err.message, 'error'));
}

function backupFile(fileId) {
  fetch(`${API_URL}/backups/file/${fileId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  .then(res => res.json())
  .then(data => {
    if (data.message) {
      showAlert('File backed up successfully!', 'success');
      loadBackups();
      loadOverviewStats();
    } else {
      showAlert(data.error || 'Backup failed', 'error');
    }
  })
  .catch(err => showAlert('Backup error: ' + err.message, 'error'));
}

function deleteFile(fileId) {
  if (!confirm('Are you sure you want to delete this file?')) return;

  fetch(`${API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  .then(res => res.json())
  .then(data => {
    if (data.message) {
      showAlert('File deleted successfully', 'success');
      loadFiles();
      loadOverviewStats();
    } else {
      showAlert(data.error || 'Delete failed', 'error');
    }
  })
  .catch(err => showAlert('Delete error: ' + err.message, 'error'));
}

// Backup functions
function loadBackups() {
  const backupList = document.getElementById('backupListTab');
  
  if (!backupList) {
    return;
  }

  fetch(`${API_URL}/backups/history`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  .then(res => res.json())
  .then(data => {
    allBackups = data.backups || [];
    displayBackups(allBackups);
  })
  .catch(err => {
    console.error('Error loading backups:', err);
    const backupList = document.getElementById('backupListTab');
    if (backupList) {
      backupList.innerHTML = '<p style="text-align: center; color: #999;">No backups yet</p>';
    }
  });
}

function displayBackups(backups) {
  const backupList = document.getElementById('backupListTab');
  
  if (!backups || backups.length === 0) {
    backupList.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">No backups yet. Click "Backup" on a file to create one.</p>';
    return;
  }

  const statusColor = {
    'completed': '#10b981',
    'failed': '#ef4444',
    'pending': '#f59e0b'
  };

  backupList.innerHTML = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #ddd; background: #f9fafb;">
          <th style="padding: 12px; text-align: left; font-weight: 600;">📄 File</th>
          <th style="padding: 12px; text-align: left; font-weight: 600;">💾 Size</th>
          <th style="padding: 12px; text-align: left; font-weight: 600;">Status</th>
          <th style="padding: 12px; text-align: left; font-weight: 600;">🕐 Created</th>
        </tr>
      </thead>
      <tbody>
        ${backups.map(backup => {
          const timeStr = formatDateEAT(backup.createdAt);
          
          return `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: 500;">${escapeHtml(backup.fileName || 'Unknown')}</td>
            <td style="padding: 12px;">${formatFileSize(backup.fileSize || 0)}</td>
            <td style="padding: 12px;">
              <span style="
                display: inline-block;
                background: ${statusColor[backup.status] || '#666'};
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: capitalize;
              ">
                ${backup.status}
              </span>
            </td>
            <td style="padding: 12px; color: #666; font-size: 13px;">${timeStr}</td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function filterBackups() {
  const searchTerm = document.getElementById('backupSearch').value.toLowerCase();
  const statusFilter = document.getElementById('backupStatusFilter').value;
  
  let filtered = allBackups.filter(b => {
    const matchesSearch = b.fileName.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  displayBackups(filtered);
}

// Overview functions
function loadOverviewStats() {
  // Get file count
  fetch(`${API_URL}/files/list`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  .then(res => res.json())
  .then(data => {
    const fileCount = data.files ? data.files.length : 0;
    document.getElementById('totalFiles').textContent = fileCount;
  });

  // Get backup count
  fetch(`${API_URL}/backups/history`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  .then(res => res.json())
  .then(data => {
    const backupCount = data.backups ? data.backups.length : 0;
    document.getElementById('totalBackups').textContent = backupCount;
    
    // Show last backup time
    if (data.backups && data.backups.length > 0) {
      const lastBackup = new Date(data.backups[0].createdAt);
      const timeAgo = getTimeAgo(lastBackup);
      document.getElementById('lastActivity').textContent = timeAgo;
    }
  });

  // Get storage info
  loadStorageStats();
}

// Format date to East African Time (UTC+3)
function formatDateEAT(dateString) {
  if (!dateString) return 'N/A';
  try {
    // Parse the date - handle both ISO strings and timestamps
    let date;
    if (typeof dateString === 'string') {
      // If it's a string, ensure it's in ISO format
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const options = {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    return date.toLocaleString('en-US', options);
  } catch (e) {
    return 'Invalid Date';
  }
}

// Format date to simple date string in EAT
function formatDateSimpleEAT(dateString) {
  if (!dateString) return 'N/A';
  try {
    // Parse the date - handle both ISO strings and timestamps
    let date;
    if (typeof dateString === 'string') {
      // If it's a string, ensure it's in ISO format
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const options = {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    return date.toLocaleString('en-US', options);
  } catch (e) {
    return 'Invalid Date';
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
  return Math.floor(seconds / 86400) + ' days ago';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showTab(tabName) {
  // Always show overview tab
  document.getElementById('overviewTab').style.display = 'block';
  
  // Hide other secondary tabs
  document.getElementById('filesTab').style.display = 'none';
  document.getElementById('backupsTab').style.display = 'none';
  document.getElementById('profileTab').style.display = 'none';

  // Remove active class from all nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Set active nav item and show selected tab
  const navItems = document.querySelectorAll('.nav-item');
  
  if (tabName === 'overview') {
    navItems[0].classList.add('active');
    loadOverviewStats();
  } else if (tabName === 'files') {
    document.getElementById('filesTab').style.display = 'block';
    navItems[1].classList.add('active');
    loadFiles();
  } else if (tabName === 'backups') {
    document.getElementById('backupsTab').style.display = 'block';
    navItems[2].classList.add('active');
    setTimeout(loadBackups, 100);
  } else if (tabName === 'profile') {
    document.getElementById('profileTab').style.display = 'block';
    navItems[3].classList.add('active');
    loadProfile();
  }
}

function loadProfile() {
  fetch(`${API_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  .then(res => res.json())
  .then(data => {
    if (data.user) {
      const user = data.user;
      document.getElementById('profileUsername').value = user.username;
      document.getElementById('profileEmail').value = user.email;
      document.getElementById('profilePhone').value = user.phone || '';
      document.getElementById('profileAddress').value = user.address || '';
      document.getElementById('profileCity').value = user.city || '';
      document.getElementById('profileCountry').value = user.country || '';
      document.getElementById('profileBio').value = user.bio || '';
    }
  })
  .catch(err => console.error('Error loading profile:', err));
}

document.addEventListener('DOMContentLoaded', () => {
  const user = getUserInfo();
  if (user) {
    // Update top navbar
    document.getElementById('topUserAvatar').textContent = user.username.charAt(0).toUpperCase();
    document.getElementById('topUsername').textContent = `Welcome, ${user.username}`;
    
    // Update sidebar
    document.getElementById('sidebarUsername').textContent = user.username;
    document.getElementById('sidebarEmail').textContent = user.email;

    // Set role badge
    const roleBadge = document.getElementById('roleBadge');
    if (user.role === 'admin') {
      roleBadge.textContent = '⭐ Admin';
      roleBadge.style.background = '#dc2626';
      roleBadge.style.color = 'white';
    } else if (user.role === 'manager') {
      roleBadge.textContent = '👨‍💼 Manager';
      roleBadge.style.background = '#f59e0b';
      roleBadge.style.color = 'white';
    } else {
      roleBadge.textContent = '👤 Team Member';
      roleBadge.style.background = '#3b82f6';
      roleBadge.style.color = 'white';
    }
  }

  // Profile form submission
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = {
        username: document.getElementById('profileUsername').value,
        phone: document.getElementById('profilePhone').value,
        address: document.getElementById('profileAddress').value,
        city: document.getElementById('profileCity').value,
        country: document.getElementById('profileCountry').value,
        bio: document.getElementById('profileBio').value
      };

      fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          showProfileAlert('Profile updated successfully!', 'success');
        } else {
          showProfileAlert(data.error || 'Update failed', 'error');
        }
      })
      .catch(err => showProfileAlert('Error: ' + err.message, 'error'));
    });
  }

  // Password form submission
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (newPassword !== confirmPassword) {
        showProfileAlert('New passwords do not match', 'error');
        return;
      }

      fetch(`${API_URL}/profile/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          showProfileAlert('Password changed successfully!', 'success');
          passwordForm.reset();
        } else {
          showProfileAlert(data.error || 'Password change failed', 'error');
        }
      })
      .catch(err => showProfileAlert('Error: ' + err.message, 'error'));
    });
  }

  loadOverviewStats();
  loadFiles();
  loadStorageStats();
  
  // Refresh every 30 seconds
  setInterval(loadFiles, 30000);
  setInterval(loadStorageStats, 30000);
});

function showProfileAlert(message, type = 'error') {
  const alertContainer = document.getElementById('profileAlertContainer');
  if (!alertContainer) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alertContainer.appendChild(alert);

  setTimeout(() => alert.remove(), 5000);
}

function loadStorageStats() {
  fetch(`${API_URL}/files/stats/storage`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  .then(res => res.json())
  .then(data => {
    if (data.used !== undefined) {
      const usedMB = data.usedMB || 0;
      const maxMB = data.maxMB || 50;
      const percentage = Math.min((usedMB / maxMB) * 100, 100);

      // Update sidebar storage
      document.getElementById('storageUsed').textContent = Math.round(usedMB);
      document.getElementById('storageFill').style.width = percentage + '%';

      // Color code based on usage
      const storageFill = document.getElementById('storageFill');
      if (percentage > 90) {
        storageFill.style.background = '#ef4444'; // Red
        if (!document.querySelector('.storage-warning')) {
          showAlert(`⚠️ Storage almost full (${Math.round(percentage)}% used)`, 'warning');
        }
      } else if (percentage > 75) {
        storageFill.style.background = '#f59e0b'; // Yellow
      } else {
        storageFill.style.background = '#10b981'; // Green
      }

      // Update overview stats
      const availableMB = maxMB - usedMB;
      document.getElementById('overviewStorageUsedText').textContent = Math.round(usedMB);
      document.getElementById('overviewStorageMaxText').textContent = maxMB;
      document.getElementById('overviewStorageAvailable').textContent = Math.round(availableMB);
      document.getElementById('storageUsedPercent').textContent = Math.round(percentage) + '%';
      document.getElementById('storageUsedText').textContent = Math.round(usedMB);
      document.getElementById('storageMaxText').textContent = maxMB;

      // Draw overview storage chart
      const ctx = document.getElementById('overviewStorageChart');
      if (ctx) {
        const unused = 100 - percentage;
        
        if (overviewStorageChart) {
          overviewStorageChart.data.datasets[0].data = [percentage, unused];
          overviewStorageChart.update();
        } else {
          overviewStorageChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['Used', 'Available'],
              datasets: [{
                data: [percentage, unused],
                backgroundColor: [
                  'rgba(37, 99, 235, 0.8)',
                  'rgba(226, 232, 240, 1)'
                ],
                borderColor: [
                  'rgba(37, 99, 235, 1)',
                  'rgba(226, 232, 240, 1)'
                ],
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    font: { size: 13, weight: '600' },
                    color: '#334155',
                    padding: 16
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.label + ': ' + Math.round(context.parsed) + '%';
                    }
                  }
                }
              }
            }
          });
        }
      }

      // Draw files storage chart
      const ctx2 = document.getElementById('storageChart');
      if (ctx2) {
        const unused = 100 - percentage;
        
        if (storageChart) {
          storageChart.data.datasets[0].data = [percentage, unused];
          storageChart.update();
        } else {
          storageChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
              labels: ['Used', 'Available'],
              datasets: [{
                data: [percentage, unused],
                backgroundColor: [
                  'rgba(37, 99, 235, 0.8)',
                  'rgba(226, 232, 240, 1)'
                ],
                borderColor: [
                  'rgba(37, 99, 235, 1)',
                  'rgba(226, 232, 240, 1)'
                ],
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    font: { size: 13, weight: '600' },
                    color: '#334155',
                    padding: 16
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.label + ': ' + Math.round(context.parsed) + '%';
                    }
                  }
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
