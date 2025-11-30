// Financial Dashboard JavaScript

let revenueChart, expenseChart, cashFlowChart;
let currentInvoiceId = null;
let currentPaymentId = null;
let currentExpenseId = null;
let currentBudgetId = null;
let currentReportId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) {
        window.location.href = '/';
        return;
    }

    // Check if user has admin/manager role to access financial dashboard
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin' && user.role !== 'manager') {
        alert('Access Denied: Financial Dashboard is only available to Admins and Managers');
        window.location.href = '/dashboard';
        return;
    }

    setupMenuItems();
    setCurrentDate();
    loadDashboard();
    loadInvoices();
    loadPayments();
    loadExpenses();
    loadBudgets();
    loadReports();
    loadClients();
    loadProjects();
    setupCharts();
});

function setupMenuItems() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);

            menuItems.forEach(m => m.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function showSection(section) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(section).classList.add('active');
}

function setCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    document.getElementById('periodMonth').value = `${year}-${month}`;
    document.getElementById('reportStartDate').valueAsDate = today;
    document.getElementById('reportEndDate').valueAsDate = today;
}

// Dashboard
async function loadDashboard() {
    try {
        const month = document.getElementById('periodMonth').value;
        const [year, monthNum] = month.split('-');

        const response = await fetch(`${API_URL}/financial/dashboard?year=${year}&month=${monthNum}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load dashboard');

        const data = await response.json();
        const summary = data.summary;

        document.getElementById('totalRevenue').textContent = formatCurrency(summary.totalInvoiced);
        document.getElementById('totalPaid').textContent = formatCurrency(summary.totalPaid);
        document.getElementById('totalPending').textContent = formatCurrency(summary.totalPending);
        document.getElementById('totalExpenses').textContent = formatCurrency(summary.totalExpenses);
        document.getElementById('totalProfit').textContent = formatCurrency(summary.profit);
        document.getElementById('profitMargin').textContent = summary.profitMargin;
        document.getElementById('taxAmount').textContent = formatCurrency(summary.profit * 0.1);

        // Load charts
        loadRevenueChart(year);
        loadExpenseChart(year);
        loadCashFlowChart();
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

async function loadRevenueChart(year) {
    try {
        const response = await fetch(`${API_URL}/financial/revenue?year=${year}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load revenue data');

        const data = await response.json();

        const ctx = document.getElementById('revenueChart').getContext('2d');
        if (revenueChart) revenueChart.destroy();

        revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.month),
                datasets: [{
                    label: 'Monthly Revenue',
                    data: data.map(d => d.revenue),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
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
                            callback: (value) => formatCurrency(value)
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Revenue chart error:', error);
    }
}

async function loadExpenseChart(year) {
    try {
        const response = await fetch(`${API_URL}/financial/expenses/breakdown?year=${year}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load expense data');

        const data = await response.json();

        const ctx = document.getElementById('expenseChart').getContext('2d');
        if (expenseChart) expenseChart.destroy();

        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

        expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.category),
                datasets: [{
                    data: data.map(d => d.amount),
                    backgroundColor: colors.slice(0, data.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => formatCurrency(context.parsed)
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Expense chart error:', error);
    }
}

async function loadCashFlowChart() {
    try {
        const response = await fetch(`${API_URL}/financial/cashflow`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load cashflow data');

        const data = await response.json();

        const ctx = document.getElementById('cashFlowChart').getContext('2d');
        if (cashFlowChart) cashFlowChart.destroy();

        cashFlowChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.month),
                datasets: [
                    {
                        label: 'Paid',
                        data: data.map(d => d.paid),
                        backgroundColor: '#43e97b'
                    },
                    {
                        label: 'Pending',
                        data: data.map(d => d.pending),
                        backgroundColor: '#fa709a'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'x',
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        stacked: true,
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Cashflow chart error:', error);
    }
}

function setupCharts() {
    // Placeholder for initial chart setup
}

// Invoices
async function loadInvoices() {
    try {
        const response = await fetch(`${API_URL}/invoices`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load invoices');

        const invoices = await response.json();
        const tbody = document.getElementById('invoicesList');

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No invoices found</td></tr>';
            return;
        }

        tbody.innerHTML = invoices.map(inv => `
            <tr>
                <td>${inv.invoiceNumber || 'N/A'}</td>
                <td>${inv.clientName || 'N/A'}</td>
                <td>${formatCurrency(inv.amount)}</td>
                <td><span class="status-badge status-${inv.status}">${inv.status}</span></td>
                <td>${formatDate(inv.issueDate)}</td>
                <td>${formatDate(inv.dueDate)}</td>
                <td>
                    <button class="btn btn-small" onclick="editInvoice(${inv.id})">Edit</button>
                    <button class="btn btn-small" onclick="deleteInvoice(${inv.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load invoices error:', error);
    }
}

function openInvoiceModal() {
    currentInvoiceId = null;
    document.getElementById('invoiceForm').reset();
    document.getElementById('invoiceModal').classList.add('active');
}

function closeInvoiceModal() {
    document.getElementById('invoiceModal').classList.remove('active');
}

async function saveInvoice(event) {
    event.preventDefault();

    // Validate form
    const validation = validateInvoiceForm();
    if (!validation.valid) {
        console.warn('Form validation failed:', validation.errors);
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

    const invoiceData = {
        clientId: parseInt(document.getElementById('invoiceClientId').value),
        projectId: parseInt(document.getElementById('invoiceProjectId').value) || null,
        amount: parseFloat(document.getElementById('invoiceAmount').value),
        description: document.getElementById('invoiceDescription').value.trim(),
        issueDate: document.getElementById('invoiceIssueDate').value,
        dueDate: document.getElementById('invoiceDueDate').value
    };

    try {
        const method = currentInvoiceId ? 'PUT' : 'POST';
        const url = currentInvoiceId ? `${API_URL}/invoices/${currentInvoiceId}` : `${API_URL}/invoices`;

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoiceData)
        });

        if (!response.ok) throw new Error('Failed to save invoice');

        showAlert('✓ Invoice ' + (currentInvoiceId ? 'updated' : 'created') + ' successfully', 'success');
        closeInvoiceModal();
        resetForm('invoiceForm');
        loadInvoices();
    } catch (error) {
        console.error('Save invoice error:', error);
        showAlert('✗ Error saving invoice: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function deleteInvoice(id) {
    if (!confirm('Delete this invoice?')) return;

    try {
        const response = await fetch(`${API_URL}/invoices/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to delete invoice');

        loadInvoices();
        alert('Invoice deleted');
    } catch (error) {
        console.error('Delete invoice error:', error);
        alert('Error deleting invoice');
    }
}

// Payments
async function loadPayments() {
    try {
        const response = await fetch(`${API_URL}/payments`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load payments');

        const payments = await response.json();
        const tbody = document.getElementById('paymentsList');

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No payments found</td></tr>';
            return;
        }

        tbody.innerHTML = payments.map(pmt => `
            <tr>
                <td>${pmt.invoiceNumber || 'N/A'}</td>
                <td>${formatCurrency(pmt.amount)}</td>
                <td>${pmt.paymentMethod || 'N/A'}</td>
                <td><span class="status-badge status-${pmt.status}">${pmt.status}</span></td>
                <td>${formatDate(pmt.paymentDate)}</td>
                <td>${pmt.confirmationNumber || '-'}</td>
                <td>
                    <button class="btn btn-small" onclick="editPayment(${pmt.id})">Edit</button>
                    <button class="btn btn-small" onclick="deletePayment(${pmt.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load payments error:', error);
    }
}

function openPaymentModal() {
    currentPaymentId = null;
    document.getElementById('paymentForm').reset();
    document.getElementById('paymentModal').classList.add('active');
    loadUnpaidInvoices();
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

async function loadUnpaidInvoices() {
    try {
        const response = await fetch(`${API_URL}/invoices`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load invoices');

        const invoices = await response.json();
        const select = document.getElementById('paymentInvoiceId');

        const unpaid = invoices.filter(inv => inv.status !== 'paid');
        select.innerHTML = '<option value="">Select Invoice</option>' +
            unpaid.map(inv => `<option value="${inv.id}">${inv.invoiceNumber} - ${formatCurrency(inv.amount)}</option>`).join('');
    } catch (error) {
        console.error('Load unpaid invoices error:', error);
    }
}

async function savePayment(event) {
    event.preventDefault();

    // Validate form
    const validation = validatePaymentForm();
    if (!validation.valid) {
        console.warn('Form validation failed:', validation.errors);
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

    const paymentData = {
        invoiceId: parseInt(document.getElementById('paymentInvoiceId').value),
        amount: parseFloat(document.getElementById('paymentAmount').value),
        paymentMethod: document.getElementById('paymentMethod').value,
        paymentDate: document.getElementById('paymentDate').value,
        confirmationNumber: document.getElementById('confirmationNumber').value.trim(),
        notes: document.getElementById('paymentNotes').value.trim()
    };

    try {
        const method = currentPaymentId ? 'PUT' : 'POST';
        const url = currentPaymentId ? `${API_URL}/payments/${currentPaymentId}` : `${API_URL}/payments`;

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) throw new Error('Failed to save payment');

        showAlert('✓ Payment ' + (currentPaymentId ? 'updated' : 'recorded') + ' successfully', 'success');
        closePaymentModal();
        resetForm('paymentForm');
        loadPayments();
        loadDashboard();
    } catch (error) {
        console.error('Save payment error:', error);
        showAlert('✗ Error saving payment: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function deletePayment(id) {
    if (!confirm('Delete this payment?')) return;

    try {
        const response = await fetch(`${API_URL}/payments/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to delete payment');

        loadPayments();
        alert('Payment deleted');
    } catch (error) {
        console.error('Delete payment error:', error);
        alert('Error deleting payment');
    }
}

// Expenses
async function loadExpenses() {
    try {
        const response = await fetch(`${API_URL}/expenses`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load expenses');

        const expenses = await response.json();
        const tbody = document.getElementById('expensesList');

        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No expenses found</td></tr>';
            return;
        }

        tbody.innerHTML = expenses.map(exp => `
            <tr>
                <td>${exp.projectName || 'N/A'}</td>
                <td>${exp.category || 'N/A'}</td>
                <td>${exp.description || '-'}</td>
                <td>${formatCurrency(exp.amount)}</td>
                <td>${exp.vendor || '-'}</td>
                <td>${formatDate(exp.expenseDate)}</td>
                <td>
                    <button class="btn btn-small" onclick="editExpense(${exp.id})">Edit</button>
                    <button class="btn btn-small" onclick="deleteExpense(${exp.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load expenses error:', error);
    }
}

function openExpenseModal() {
    currentExpenseId = null;
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseModal').classList.add('active');
    loadProjects();
}

function closeExpenseModal() {
    document.getElementById('expenseModal').classList.remove('active');
}

async function saveExpense(event) {
    event.preventDefault();

    // Validate form
    const validation = validateExpenseForm();
    if (!validation.valid) {
        console.warn('Form validation failed:', validation.errors);
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

    const expenseData = {
        projectId: parseInt(document.getElementById('expenseProjectId').value),
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDescription').value.trim(),
        amount: parseFloat(document.getElementById('expenseAmount').value),
        vendor: document.getElementById('expenseVendor').value.trim(),
        expenseDate: document.getElementById('expenseDate').value
    };

    try {
        const method = currentExpenseId ? 'PUT' : 'POST';
        const url = currentExpenseId ? `${API_URL}/expenses/${currentExpenseId}` : `${API_URL}/expenses`;

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expenseData)
        });

        if (!response.ok) throw new Error('Failed to save expense');

        showAlert('✓ Expense ' + (currentExpenseId ? 'updated' : 'recorded') + ' successfully', 'success');
        closeExpenseModal();
        resetForm('expenseForm');
        loadExpenses();
        loadDashboard();
    } catch (error) {
        console.error('Save expense error:', error);
        showAlert('✗ Error saving expense: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;

    try {
        const response = await fetch(`${API_URL}/expenses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to delete expense');

        loadExpenses();
        loadDashboard();
        alert('Expense deleted');
    } catch (error) {
        console.error('Delete expense error:', error);
        alert('Error deleting expense');
    }
}

// Budgets
async function loadBudgets() {
    try {
        const response = await fetch(`${API_URL}/financial/budgets`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load budgets');

        const budgets = await response.json();
        const tbody = document.getElementById('budgetsList');

        if (budgets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No budgets found</td></tr>';
            return;
        }

        tbody.innerHTML = budgets.map(bgt => `
            <tr>
                <td>${bgt.projectName || 'N/A'}</td>
                <td>${bgt.category || 'General'}</td>
                <td>${formatCurrency(bgt.budgetAmount)}</td>
                <td>${formatCurrency(bgt.spent)}</td>
                <td>${formatCurrency(bgt.remaining)}</td>
                <td>${bgt.percentUsed}%</td>
                <td><span class="status-badge status-${bgt.status}">${bgt.status}</span></td>
                <td>
                    <button class="btn btn-small" onclick="editBudget(${bgt.id})">Edit</button>
                    <button class="btn btn-small" onclick="deleteBudget(${bgt.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load budgets error:', error);
    }
}

function openBudgetModal() {
    currentBudgetId = null;
    document.getElementById('budgetForm').reset();
    document.getElementById('budgetModal').classList.add('active');
    loadProjects();
}

function closeBudgetModal() {
    document.getElementById('budgetModal').classList.remove('active');
}

async function saveBudget(event) {
    event.preventDefault();

    // Validate form
    const validation = validateBudgetForm();
    if (!validation.valid) {
        console.warn('Form validation failed:', validation.errors);
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

    const budgetData = {
        projectId: parseInt(document.getElementById('budgetProjectId').value),
        budgetAmount: parseFloat(document.getElementById('budgetAmount').value),
        category: document.getElementById('budgetCategory').value
    };

    try {
        const method = currentBudgetId ? 'PUT' : 'POST';
        const url = currentBudgetId ? `${API_URL}/financial/budgets/${currentBudgetId}` : `${API_URL}/financial/budgets`;

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(budgetData)
        });

        if (!response.ok) throw new Error('Failed to save budget');

        showAlert('✓ Budget ' + (currentBudgetId ? 'updated' : 'created') + ' successfully', 'success');
        closeBudgetModal();
        resetForm('budgetForm');
        loadBudgets();
    } catch (error) {
        console.error('Save budget error:', error);
        showAlert('✗ Error saving budget: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function deleteBudget(id) {
    if (!confirm('Delete this budget?')) return;

    try {
        const response = await fetch(`${API_URL}/financial/budgets/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to delete budget');

        loadBudgets();
        alert('Budget deleted');
    } catch (error) {
        console.error('Delete budget error:', error);
        alert('Error deleting budget');
    }
}

// Reports
async function loadReports() {
    try {
        const response = await fetch(`${API_URL}/financial/reports`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load reports');

        const reports = await response.json();
        const tbody = document.getElementById('reportsList');

        if (reports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No reports found</td></tr>';
            return;
        }

        tbody.innerHTML = reports.map(rpt => `
            <tr>
                <td>${rpt.reportType || 'N/A'}</td>
                <td>${rpt.period || 'N/A'}</td>
                <td>${formatCurrency(rpt.totalRevenue)}</td>
                <td>${formatCurrency(rpt.totalExpenses)}</td>
                <td>${formatCurrency(rpt.profit)}</td>
                <td>${rpt.profitMargin || '0'}%</td>
                <td>${formatDate(rpt.createdAt)}</td>
                <td>
                    <button class="btn btn-small" onclick="viewReport(${rpt.id})">View</button>
                    <button class="btn btn-small" onclick="downloadReport(${rpt.id})">Download</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load reports error:', error);
    }
}

function openReportModal() {
    currentReportId = null;
    document.getElementById('reportForm').reset();
    document.getElementById('reportModal').classList.add('active');
}

function closeReportModal() {
    document.getElementById('reportModal').classList.remove('active');
}

async function saveReport(event) {
    event.preventDefault();

    const reportData = {
        reportType: document.getElementById('reportType').value,
        period: document.getElementById('reportPeriod').value,
        startDate: document.getElementById('reportStartDate').value,
        endDate: document.getElementById('reportEndDate').value
    };

    try {
        const response = await fetch(`${API_URL}/financial/reports/generate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        });

        if (!response.ok) throw new Error('Failed to generate report');

        closeReportModal();
        loadReports();
        alert('Report generated');
    } catch (error) {
        console.error('Save report error:', error);
        alert('Error generating report');
    }
}

async function loadClients() {
    try {
        const response = await fetch(`${API_URL}/clients`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load clients');

        const clients = await response.json();
        const selects = [
            document.getElementById('invoiceClientId'),
            document.getElementById('paymentInvoiceId')
        ].filter(el => el);

        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Client</option>' +
                clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            select.value = currentValue;
        });
    } catch (error) {
        console.error('Load clients error:', error);
    }
}

async function loadProjects() {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to load projects');

        const projects = await response.json();
        const selects = [
            document.getElementById('invoiceProjectId'),
            document.getElementById('expenseProjectId'),
            document.getElementById('budgetProjectId')
        ].filter(el => el);

        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Project</option>' +
                projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            select.value = currentValue;
        });
    } catch (error) {
        console.error('Load projects error:', error);
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
    }).format(amount || 0);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
}

// Logout
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        });
    }
});
