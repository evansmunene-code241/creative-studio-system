const API_URL = 'http://localhost:3000/api';

// Check authentication
if (!checkAuth()) {
  window.location.href = 'index.html';
}

let revenueChart = null;
let expensesChart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  document.getElementById('username').textContent = user.username || 'User';

  // Load initial data
  loadOverview();
  loadClients();
  loadProjects();
});

// Section Navigation
function showSection(sectionName) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const section = document.getElementById(sectionName + '-section');
  if (section) {
    section.classList.add('active');
    event.target.classList.add('active');

    if (sectionName === 'invoices') {
      loadInvoices();
    } else if (sectionName === 'expenses') {
      loadExpenses();
    } else if (sectionName === 'reports') {
      loadReports();
    } else if (sectionName === 'budgets') {
      loadBudgets();
    }
  }
}

// ============ OVERVIEW ============

function loadOverview() {
  const token = getToken();
  const year = document.getElementById('yearSelect').value;
  const month = document.getElementById('monthSelect').value;

  let url = `${API_URL}/financial/dashboard?year=${year}`;
  if (month) {
    url += `&month=${month}`;
  }

  fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      updateMetrics(data.summary);
      loadRevenueChart();
      loadExpensesBreakdown();
      loadInvoiceStatus();
    })
    .catch(e => console.error('Error loading overview:', e));
}

function updateMetrics(summary) {
   document.getElementById('totalRevenue').textContent = `KES ${summary.totalInvoiced.toFixed(2)}`;
   document.getElementById('totalPaid').textContent = `KES ${summary.totalPaid.toFixed(2)}`;
   document.getElementById('totalExpenses').textContent = `KES ${summary.totalExpenses.toFixed(2)}`;
   document.getElementById('profit').textContent = `KES ${summary.profit.toFixed(2)}`;
   document.getElementById('profitMargin').textContent = summary.profitMargin;
}

function loadRevenueChart() {
  const token = getToken();
  const year = document.getElementById('yearSelect').value;

  fetch(`${API_URL}/financial/revenue?year=${year}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      const ctx = document.getElementById('revenueChart').getContext('2d');
      const months = data.map(d => d.month);
      const revenue = data.map(d => d.revenue);

      if (revenueChart) {
        revenueChart.data.labels = months;
        revenueChart.data.datasets[0].data = revenue;
        revenueChart.update();
      } else {
        revenueChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: months,
            datasets: [{
              label: 'Monthly Revenue',
              data: revenue,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: '#10b981'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                   callback: function(value) {
                     return 'KES ' + value.toFixed(0);
                   }
                 }
              }
            }
          }
        });
      }
    })
    .catch(e => console.error('Error loading revenue chart:', e));
}

function loadExpensesBreakdown() {
  const token = getToken();
  const year = document.getElementById('yearSelect').value;

  fetch(`${API_URL}/financial/expenses/breakdown?year=${year}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      const ctx = document.getElementById('expensesChart').getContext('2d');
      const categories = data.map(d => d.category);
      const amounts = data.map(d => d.amount);
      const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

      if (expensesChart) {
        expensesChart.data.labels = categories;
        expensesChart.data.datasets[0].data = amounts;
        expensesChart.update();
      } else {
        expensesChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: categories,
            datasets: [{
              data: amounts,
              backgroundColor: colors.slice(0, categories.length),
              borderColor: '#fff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    })
    .catch(e => console.error('Error loading expenses breakdown:', e));
}

function loadInvoiceStatus() {
  const token = getToken();

  fetch(`${API_URL}/financial/invoices/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      const container = document.getElementById('invoiceStatusContainer');
      const summary = data.reduce((acc, item) => {
        acc[item.status] = { count: item.count, total: item.total };
        return acc;
      }, {});

      container.innerHTML = `
        <div class="report-summary">
          ${Object.entries(summary).map(([status, info]) => `
            <div class="report-item">
              <div class="report-item-label">${capitalize(status)}</div>
              <div class="report-item-value">${info.count} invoices</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 5px;">KES ${info.total.toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
      `;
    })
    .catch(e => console.error('Error loading invoice status:', e));
}

// ============ INVOICES ============

function loadInvoices() {
  const token = getToken();
  const container = document.getElementById('invoicesList');

  fetch(`${API_URL}/invoices`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(invoices => {
      if (!invoices || invoices.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No invoices yet.</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => `
                <tr>
                  <td><strong>${escapeHtml(inv.invoiceNumber)}</strong></td>
                  <td>${escapeHtml(inv.clientName || 'N/A')}</td>
                  <td>${escapeHtml(inv.projectName || 'N/A')}</td>
                  <td>KES ${inv.amount.toFixed(2)}</td>
                  <td><span class="status-badge status-${inv.status}">${inv.status}</span></td>
                  <td>${formatDate(inv.dueDate)}</td>
                  <td>
                    ${inv.status !== 'paid' ? `<button class="btn-success" onclick="markInvoicePaid(${inv.id})">Mark Paid</button>` : ''}
                    <button class="btn-danger" onclick="deleteInvoice(${inv.id})">Delete</button>
                  </td>
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

function showInvoiceModal() {
  document.getElementById('invoiceForm').reset();
  document.getElementById('invoiceModal').style.display = 'block';
}

function closeInvoiceModal() {
  document.getElementById('invoiceModal').style.display = 'none';
}

function saveInvoice(event) {
  event.preventDefault();
  const token = getToken();

  const data = {
    clientId: document.getElementById('invoiceClient').value,
    projectId: document.getElementById('invoiceProject').value || null,
    amount: parseFloat(document.getElementById('invoiceAmount').value),
    issueDate: document.getElementById('invoiceIssueDate').value,
    dueDate: document.getElementById('invoiceDueDate').value,
    description: document.getElementById('invoiceDescription').value,
    notes: document.getElementById('invoiceNotes').value
  };

  fetch(`${API_URL}/invoices`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(r => r.json())
    .then(res => {
      closeInvoiceModal();
      loadInvoices();
      alert('Invoice created successfully');
    })
    .catch(e => alert('Failed to create invoice'));
}

function markInvoicePaid(invoiceId) {
  const token = getToken();

  fetch(`${API_URL}/invoices/${invoiceId}/pay`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount: 0, paymentDate: new Date().toISOString() })
  })
    .then(r => r.json())
    .then(res => {
      loadInvoices();
      loadOverview();
      alert('Invoice marked as paid');
    })
    .catch(e => alert('Failed to update invoice'));
}

function deleteInvoice(invoiceId) {
  if (!confirm('Are you sure?')) return;

  const token = getToken();

  fetch(`${API_URL}/invoices/${invoiceId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(res => {
      loadInvoices();
      alert('Invoice deleted');
    })
    .catch(e => alert('Failed to delete invoice'));
}

// ============ EXPENSES ============

function loadExpenses() {
  const token = getToken();
  const container = document.getElementById('expensesList');

  fetch(`${API_URL}/expenses`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(expenses => {
      if (!expenses || expenses.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No expenses recorded.</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map(exp => `
                <tr>
                  <td>${formatDate(exp.expenseDate)}</td>
                  <td>${escapeHtml(exp.projectName || 'N/A')}</td>
                  <td>${capitalize(exp.category)}</td>
                  <td>${escapeHtml(exp.vendor || 'N/A')}</td>
                  <td>KES ${exp.amount.toFixed(2)}</td>
                  <td>${escapeHtml(exp.description || '')}</td>
                  <td>
                    <button class="btn-danger" onclick="deleteExpense(${exp.id})">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(e => {
      console.error('Error loading expenses:', e);
      container.innerHTML = '<div class="empty-state"><p>Failed to load expenses</p></div>';
    });
}

function showExpenseModal() {
  document.getElementById('expenseForm').reset();
  document.getElementById('expenseModal').style.display = 'block';
}

function closeExpenseModal() {
  document.getElementById('expenseModal').style.display = 'none';
}

function saveExpense(event) {
  event.preventDefault();
  const token = getToken();

  const data = {
    projectId: document.getElementById('expenseProject').value,
    category: document.getElementById('expenseCategory').value,
    amount: parseFloat(document.getElementById('expenseAmount').value),
    vendor: document.getElementById('expenseVendor').value,
    expenseDate: document.getElementById('expenseDate').value,
    description: document.getElementById('expenseDescription').value
  };

  fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(r => r.json())
    .then(res => {
      closeExpenseModal();
      loadExpenses();
      loadOverview();
      alert('Expense recorded successfully');
    })
    .catch(e => alert('Failed to record expense'));
}

function deleteExpense(expenseId) {
  if (!confirm('Are you sure?')) return;

  const token = getToken();

  fetch(`${API_URL}/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(res => {
      loadExpenses();
      loadOverview();
      alert('Expense deleted');
    })
    .catch(e => alert('Failed to delete expense'));
}

// ============ REPORTS ============

function loadReports() {
  loadProfitabilityReport();
  loadCashflowReport();
}

function loadProfitabilityReport() {
  const token = getToken();
  const container = document.getElementById('profitabilityReport');

  fetch(`${API_URL}/financial/projects/profitability`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No project data.</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Revenue</th>
                <th>Expenses</th>
                <th>Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(p => `
                <tr>
                  <td><strong>${escapeHtml(p.projectName)}</strong></td>
                  <td>KES ${p.revenue.toFixed(2)}</td>
                  <td>KES ${p.expenses.toFixed(2)}</td>
                  <td class="${p.profit >= 0 ? 'positive' : 'negative'}">KES ${p.profit.toFixed(2)}</td>
                  <td>${p.profitMargin}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(e => console.error('Error loading profitability:', e));
}

function loadCashflowReport() {
  const token = getToken();
  const container = document.getElementById('cashflowReport');

  fetch(`${API_URL}/financial/cashflow`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No cash flow data.</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(cf => `
                <tr>
                  <td>${cf.month}</td>
                  <td>KES ${cf.paid.toFixed(2)}</td>
                  <td>KES ${cf.pending.toFixed(2)}</td>
                  <td><strong>KES ${(cf.paid + cf.pending).toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(e => console.error('Error loading cash flow:', e));
}

// ============ BUDGETS ============

function loadBudgets() {
  const token = getToken();
  const container = document.getElementById('budgetReport');

  fetch(`${API_URL}/financial/budget/vs/actual`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No budget data.</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Used</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(b => `
                <tr>
                  <td><strong>${escapeHtml(b.projectName)}</strong></td>
                  <td>KES ${b.budget.toFixed(2)}</td>
                  <td>KES ${b.spent.toFixed(2)}</td>
                  <td>KES ${b.remaining.toFixed(2)}</td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${b.percentUsed}%"></div>
                    </div>
                    ${b.percentUsed}%
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(e => console.error('Error loading budgets:', e));
}

// ============ HELPERS ============

function loadClients() {
  const token = getToken();

  fetch(`${API_URL}/clients`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(clients => {
      const select = document.getElementById('invoiceClient');
      clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        select.appendChild(option);
      });
    })
    .catch(e => console.error('Error loading clients:', e));
}

function loadProjects() {
  const token = getToken();

  fetch(`${API_URL}/projects`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(projects => {
      const select1 = document.getElementById('invoiceProject');
      const select2 = document.getElementById('expenseProject');

      projects.forEach(project => {
        const option1 = document.createElement('option');
        option1.value = project.id;
        option1.textContent = project.name;
        select1.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = project.id;
        option2.textContent = project.name;
        select2.appendChild(option2);
      });
    })
    .catch(e => console.error('Error loading projects:', e));
}

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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
