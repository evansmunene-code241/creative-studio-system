/**
 * Confirmation Dialog System
 * Provides reusable confirmation dialogs for destructive actions
 */

// HTML for confirmation dialog (added dynamically)
function createConfirmDialogHTML() {
  return `
    <div id="confirmModal" class="modal confirm-modal" style="display:none;">
      <div class="confirm-overlay"></div>
      <div class="modal-content confirm-content">
        <div class="confirm-header">
          <h3 id="confirmTitle">Confirm Action</h3>
          <button class="close" onclick="closeConfirmDialog()">&times;</button>
        </div>
        
        <div class="confirm-body">
          <p id="confirmMessage">Are you sure?</p>
          <div id="confirmDetails" class="confirm-details" style="display:none;">
            <div id="confirmImpact" style="margin-top: 12px; padding: 12px; background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px;">
              <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>⚠ Impact:</strong></p>
              <p id="confirmImpactText" style="margin: 6px 0 0 0; font-size: 13px; color: #92400e;"></p>
            </div>
          </div>
        </div>
        
        <div class="confirm-footer">
          <button type="button" class="btn btn-secondary" onclick="closeConfirmDialog()">Cancel</button>
          <button type="button" class="btn btn-danger" id="confirmBtn" onclick="executeConfirmAction()">Delete</button>
        </div>
      </div>
    </div>
  `;
}

// Store confirm action callback
let confirmAction = null;
let confirmData = null;

// Show confirmation dialog
function showConfirmDialog(options = {}) {
  const {
    title = 'Confirm Delete',
    message = 'Are you sure you want to delete this item?',
    impact = null,
    confirmText = 'Delete',
    onConfirm = null,
    data = null,
    isDangerous = true
  } = options;

  // Create modal if it doesn't exist
  if (!document.getElementById('confirmModal')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = createConfirmDialogHTML();
    document.body.appendChild(tempDiv.firstElementChild);
  }

  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  
  const confirmBtn = document.getElementById('confirmBtn');
  confirmBtn.textContent = confirmText;
  
  if (isDangerous) {
    confirmBtn.className = 'btn btn-danger';
  } else {
    confirmBtn.className = 'btn btn-primary';
  }

  // Show impact if provided
  const detailsDiv = document.getElementById('confirmDetails');
  if (impact) {
    document.getElementById('confirmImpactText').textContent = impact;
    detailsDiv.style.display = 'block';
  } else {
    detailsDiv.style.display = 'none';
  }

  confirmAction = onConfirm;
  confirmData = data;

  modal.style.display = 'flex';

  // Focus confirm button for accessibility
  setTimeout(() => confirmBtn.focus(), 100);
}

// Execute confirmed action
function executeConfirmAction() {
  if (confirmAction && typeof confirmAction === 'function') {
    confirmAction(confirmData);
  }
  closeConfirmDialog();
}

// Close confirmation dialog
function closeConfirmDialog() {
  const modal = document.getElementById('confirmModal');
  if (modal) {
    modal.style.display = 'none';
  }
  confirmAction = null;
  confirmData = null;
}

// Handle Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeConfirmDialog();
  }
});

// =====================================================
// SPECIFIC CONFIRMATION DIALOGS
// =====================================================

// Delete Project Confirmation
function confirmDeleteProject(projectId, projectName, taskCount = 0) {
  showConfirmDialog({
    title: 'Delete Project',
    message: `Delete project "${projectName}"?`,
    impact: taskCount > 0 
      ? `This will delete ${taskCount} associated task(s). This action cannot be undone.`
      : 'This action cannot be undone.',
    confirmText: 'Delete Project',
    onConfirm: (data) => {
      deleteProject(data.projectId);
    },
    data: { projectId },
    isDangerous: true
  });
}

// Delete Invoice Confirmation
function confirmDeleteInvoice(invoiceId, invoiceNumber, status = '') {
  let impact = 'This will remove all associated payment records. This action cannot be undone.';
  if (status === 'paid') {
    impact = '⚠ This invoice has been marked as paid. Deleting it may affect financial reports. This action cannot be undone.';
  }

  showConfirmDialog({
    title: 'Delete Invoice',
    message: `Delete invoice ${invoiceNumber}?`,
    impact: impact,
    confirmText: 'Delete Invoice',
    onConfirm: (data) => {
      deleteInvoice(data.invoiceId);
    },
    data: { invoiceId },
    isDangerous: true
  });
}

// Delete Payment Confirmation
function confirmDeletePayment(paymentId, amount) {
  showConfirmDialog({
    title: 'Delete Payment',
    message: `Delete payment of ${formatCurrency(amount)}?`,
    impact: 'The associated invoice status will be updated. This action cannot be undone.',
    confirmText: 'Delete Payment',
    onConfirm: (data) => {
      deletePayment(data.paymentId);
    },
    data: { paymentId },
    isDangerous: true
  });
}

// Delete Expense Confirmation
function confirmDeleteExpense(expenseId, description, amount) {
  showConfirmDialog({
    title: 'Delete Expense',
    message: `Delete expense "${description}" (${formatCurrency(amount)})?`,
    impact: 'This will affect project budget calculations. This action cannot be undone.',
    confirmText: 'Delete Expense',
    onConfirm: (data) => {
      deleteExpense(data.expenseId);
    },
    data: { expenseId },
    isDangerous: true
  });
}

// Delete Budget Confirmation
function confirmDeleteBudget(budgetId, projectName) {
  showConfirmDialog({
    title: 'Delete Budget',
    message: `Delete budget for "${projectName}"?`,
    impact: 'Budget tracking for this project will be removed. This action cannot be undone.',
    confirmText: 'Delete Budget',
    onConfirm: (data) => {
      deleteBudget(data.budgetId);
    },
    data: { budgetId },
    isDangerous: true
  });
}

// Delete User Confirmation
function confirmDeleteUser(userId, username) {
  showConfirmDialog({
    title: 'Delete User Account',
    message: `Delete user account "${username}"?`,
    impact: 'All user data and activity logs will be preserved. The user will lose access. This action cannot be undone.',
    confirmText: 'Delete User',
    onConfirm: (data) => {
      deleteUserAdmin(data.userId, data.username);
    },
    data: { userId, username },
    isDangerous: true
  });
}

// Delete File Confirmation
function confirmDeleteFile(fileId, fileName, fileSize) {
  showConfirmDialog({
    title: 'Delete File',
    message: `Delete file "${fileName}"?`,
    impact: `This will remove ${fileName} (${formatFileSize(fileSize)}) from storage. This action cannot be undone.`,
    confirmText: 'Delete File',
    onConfirm: (data) => {
      deleteFileFromStorage(data.fileId);
    },
    data: { fileId },
    isDangerous: true
  });
}

// Reject User Registration Confirmation
function confirmRejectUser(userId, username) {
  showConfirmDialog({
    title: 'Reject Registration',
    message: `Reject registration request from "${username}"?`,
    impact: 'The user will not be able to access the system. They can register again later.',
    confirmText: 'Reject Registration',
    onConfirm: (data) => {
      rejectUser(data.userId);
    },
    data: { userId },
    isDangerous: false
  });
}

// Clear All Logs Confirmation
function confirmClearLogs(logType = 'audit') {
  const logTypeLabel = logType === 'audit' ? 'Audit Logs' : 'Backup Logs';
  showConfirmDialog({
    title: `Clear ${logTypeLabel}`,
    message: `Clear all ${logTypeLabel.toLowerCase()}?`,
    impact: `This will remove all ${logTypeLabel.toLowerCase()} records. This action cannot be undone and may affect compliance records.`,
    confirmText: `Clear ${logTypeLabel}`,
    onConfirm: (data) => {
      clearLogs(data.logType);
    },
    data: { logType },
    isDangerous: true
  });
}

// Generic confirmation (for custom actions)
function confirmAction(options = {}) {
  showConfirmDialog(options);
}

// Helper function to format file size (if not already defined)
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Initialize confirmation dialog
document.addEventListener('DOMContentLoaded', () => {
  // Create modal if it doesn't exist
  if (!document.getElementById('confirmModal')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = createConfirmDialogHTML();
    document.body.appendChild(tempDiv.firstElementChild);
  }

  // Close on overlay click
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('confirmModal');
    if (e.target === modal || (e.target.classList && e.target.classList.contains('confirm-overlay'))) {
      closeConfirmDialog();
    }
  });
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showConfirmDialog,
    closeConfirmDialog,
    confirmDeleteProject,
    confirmDeleteInvoice,
    confirmDeletePayment,
    confirmDeleteExpense,
    confirmDeleteBudget,
    confirmDeleteUser,
    confirmDeleteFile,
    confirmRejectUser,
    confirmClearLogs,
    confirmAction
  };
}
