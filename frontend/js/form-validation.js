/**
 * Form Validation Utility
 * Provides reusable validation functions for all forms in the application
 */

// =====================================================
// VALIDATION RULES
// =====================================================

const ValidationRules = {
  required: (value) => ({
    valid: value !== '' && value !== null && value !== undefined,
    message: 'This field is required'
  }),

  email: (value) => ({
    valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value === '',
    message: 'Please enter a valid email address'
  }),

  minLength: (min) => (value) => ({
    valid: value.length >= min || value === '',
    message: `Minimum ${min} characters required`
  }),

  maxLength: (max) => (value) => ({
    valid: value.length <= max || value === '',
    message: `Maximum ${max} characters allowed`
  }),

  minValue: (min) => (value) => ({
    valid: parseFloat(value) >= min || value === '',
    message: `Must be at least ${min}`
  }),

  maxValue: (max) => (value) => ({
    valid: parseFloat(value) <= max || value === '',
    message: `Must be no more than ${max}`
  }),

  pattern: (pattern, patternName) => (value) => ({
    valid: pattern.test(value) || value === '',
    message: `Invalid ${patternName}`
  }),

  dateAfter: (minDate) => (value) => ({
    valid: new Date(value) >= new Date(minDate) || value === '',
    message: `Must be after ${new Date(minDate).toLocaleDateString()}`
  }),

  dateBefore: (maxDate) => (value) => ({
    valid: new Date(value) <= new Date(maxDate) || value === '',
    message: `Must be before ${new Date(maxDate).toLocaleDateString()}`
  }),

  match: (fieldId, fieldName) => (value) => {
    const otherField = document.getElementById(fieldId);
    return {
      valid: value === (otherField?.value || ''),
      message: `Must match ${fieldName}`
    };
  },

  url: (value) => ({
    valid: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(value) || value === '',
    message: 'Please enter a valid URL'
  }),

  phone: (value) => ({
    valid: /^[\d\s+()-]{10,}$/.test(value.replace(/\s/g, '')) || value === '',
    message: 'Please enter a valid phone number'
  }),

  currency: (value) => ({
    valid: !isNaN(parseFloat(value)) && isFinite(value) && parseFloat(value) >= 0 || value === '',
    message: 'Please enter a valid amount'
  }),

  username: (value) => ({
    valid: /^[a-zA-Z0-9_-]{3,20}$/.test(value) || value === '',
    message: 'Username must be 3-20 characters (letters, numbers, underscore, hyphen)'
  })
};

// =====================================================
// FORM FIELD MANAGEMENT
// =====================================================

function validateField(fieldId, rules = []) {
  const field = document.getElementById(fieldId);
  if (!field) {
    console.warn(`Field not found: ${fieldId}`);
    return { valid: true };
  }

  const value = field.value.trim();
  let errors = [];

  // Run all validation rules
  for (const rule of rules) {
    const result = rule(value);
    if (!result.valid) {
      errors.push(result.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function showFieldError(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  // Add error styling
  field.classList.add('error-field');

  // Find or create error message container
  let errorContainer = field.parentElement.querySelector('.field-error');
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.className = 'field-error';
    field.parentElement.appendChild(errorContainer);
  }

  errorContainer.textContent = errorMessage;
  errorContainer.style.display = 'block';
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.remove('error-field');
  const errorContainer = field.parentElement.querySelector('.field-error');
  if (errorContainer) {
    errorContainer.style.display = 'none';
    errorContainer.textContent = '';
  }
}

function clearAllErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.querySelectorAll('.error-field').forEach(field => {
    field.classList.remove('error-field');
  });

  form.querySelectorAll('.field-error').forEach(error => {
    error.style.display = 'none';
  });
}

// =====================================================
// REAL-TIME VALIDATION
// =====================================================

function setupFieldValidation(fieldId, rules = []) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.addEventListener('blur', () => {
    const validation = validateField(fieldId, rules);
    if (!validation.valid) {
      showFieldError(fieldId, validation.errors[0]);
    } else {
      clearFieldError(fieldId);
    }
  });

  field.addEventListener('input', () => {
    clearFieldError(fieldId);
  });
}

// =====================================================
// FORM VALIDATION
// =====================================================

function validateForm(formId, validationMap) {
  const form = document.getElementById(formId);
  if (!form) return { valid: false, errors: {} };

  clearAllErrors(formId);

  let isValid = true;
  let errors = {};

  for (const [fieldId, rules] of Object.entries(validationMap)) {
    const validation = validateField(fieldId, rules);
    if (!validation.valid) {
      isValid = false;
      errors[fieldId] = validation.errors[0];
      showFieldError(fieldId, validation.errors[0]);
    }
  }

  return {
    valid: isValid,
    errors: errors
  };
}

function getFormData(formId, fieldIds) {
  const form = document.getElementById(formId);
  if (!form) return {};

  const data = {};
  for (const fieldId of fieldIds) {
    const field = document.getElementById(fieldId);
    if (field) {
      data[fieldId] = field.value.trim();
    }
  }

  return data;
}

// =====================================================
// FORM RESET
// =====================================================

function resetForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.reset();
  clearAllErrors(formId);
}

// =====================================================
// SPECIFIC FORM VALIDATIONS
// =====================================================

// PROJECT FORM
const PROJECT_VALIDATION_RULES = {
  projectName: [
    ValidationRules.required,
    ValidationRules.minLength(3),
    ValidationRules.maxLength(100)
  ],
  projectStartDate: [
    ValidationRules.required
  ],
  projectDeadline: [
    ValidationRules.required
  ],
  projectBudget: [
    ValidationRules.currency
  ]
};

function validateProjectForm() {
  const validation = validateForm('projectForm', PROJECT_VALIDATION_RULES);

  // Additional validation: deadline must be after start date
  if (validation.valid) {
    const startDate = document.getElementById('projectStartDate').value;
    const deadline = document.getElementById('projectDeadline').value;

    if (startDate && deadline && new Date(deadline) <= new Date(startDate)) {
      validation.valid = false;
      validation.errors.projectDeadline = 'Deadline must be after start date';
      showFieldError('projectDeadline', 'Deadline must be after start date');
    }
  }

  return validation;
}

// INVOICE FORM
const INVOICE_VALIDATION_RULES = {
  invoiceClientId: [
    ValidationRules.required
  ],
  invoiceAmount: [
    ValidationRules.required,
    ValidationRules.minValue(0.01)
  ],
  invoiceIssueDate: [
    ValidationRules.required
  ],
  invoiceDueDate: [
    ValidationRules.required
  ]
};

function validateInvoiceForm() {
  const validation = validateForm('invoiceForm', INVOICE_VALIDATION_RULES);

  // Additional validation: due date must be after issue date
  if (validation.valid) {
    const issueDate = document.getElementById('invoiceIssueDate').value;
    const dueDate = document.getElementById('invoiceDueDate').value;

    if (issueDate && dueDate && new Date(dueDate) <= new Date(issueDate)) {
      validation.valid = false;
      validation.errors.invoiceDueDate = 'Due date must be after issue date';
      showFieldError('invoiceDueDate', 'Due date must be after issue date');
    }
  }

  return validation;
}

// PAYMENT FORM
const PAYMENT_VALIDATION_RULES = {
  paymentInvoiceId: [
    ValidationRules.required
  ],
  paymentAmount: [
    ValidationRules.required,
    ValidationRules.minValue(0.01)
  ],
  paymentMethod: [
    ValidationRules.required
  ],
  paymentDate: [
    ValidationRules.required
  ]
};

function validatePaymentForm() {
  return validateForm('paymentForm', PAYMENT_VALIDATION_RULES);
}

// EXPENSE FORM
const EXPENSE_VALIDATION_RULES = {
  expenseProjectId: [
    ValidationRules.required
  ],
  expenseCategory: [
    ValidationRules.required
  ],
  expenseAmount: [
    ValidationRules.required,
    ValidationRules.minValue(0.01)
  ],
  expenseDate: [
    ValidationRules.required
  ]
};

function validateExpenseForm() {
  return validateForm('expenseForm', EXPENSE_VALIDATION_RULES);
}

// BUDGET FORM
const BUDGET_VALIDATION_RULES = {
  budgetProjectId: [
    ValidationRules.required
  ],
  budgetAmount: [
    ValidationRules.required,
    ValidationRules.minValue(100)
  ]
};

function validateBudgetForm() {
  const validation = validateForm('budgetForm', BUDGET_VALIDATION_RULES);

  if (validation.valid) {
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    if (amount > 1000000) {
      validation.valid = false;
      validation.errors.budgetAmount = 'Budget cannot exceed $1,000,000';
      showFieldError('budgetAmount', 'Budget cannot exceed $1,000,000');
    }
  }

  return validation;
}

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  // Setup project form validation
  setupFieldValidation('projectName', PROJECT_VALIDATION_RULES.projectName);
  setupFieldValidation('projectStartDate', PROJECT_VALIDATION_RULES.projectStartDate);
  setupFieldValidation('projectDeadline', PROJECT_VALIDATION_RULES.projectDeadline);
  setupFieldValidation('projectBudget', PROJECT_VALIDATION_RULES.projectBudget);

  // Setup invoice form validation
  setupFieldValidation('invoiceClientId', INVOICE_VALIDATION_RULES.invoiceClientId);
  setupFieldValidation('invoiceAmount', INVOICE_VALIDATION_RULES.invoiceAmount);
  setupFieldValidation('invoiceIssueDate', INVOICE_VALIDATION_RULES.invoiceIssueDate);
  setupFieldValidation('invoiceDueDate', INVOICE_VALIDATION_RULES.invoiceDueDate);

  // Setup payment form validation
  setupFieldValidation('paymentInvoiceId', PAYMENT_VALIDATION_RULES.paymentInvoiceId);
  setupFieldValidation('paymentAmount', PAYMENT_VALIDATION_RULES.paymentAmount);
  setupFieldValidation('paymentMethod', PAYMENT_VALIDATION_RULES.paymentMethod);
  setupFieldValidation('paymentDate', PAYMENT_VALIDATION_RULES.paymentDate);

  // Setup expense form validation
  setupFieldValidation('expenseProjectId', EXPENSE_VALIDATION_RULES.expenseProjectId);
  setupFieldValidation('expenseCategory', EXPENSE_VALIDATION_RULES.expenseCategory);
  setupFieldValidation('expenseAmount', EXPENSE_VALIDATION_RULES.expenseAmount);
  setupFieldValidation('expenseDate', EXPENSE_VALIDATION_RULES.expenseDate);

  // Setup budget form validation
  setupFieldValidation('budgetProjectId', BUDGET_VALIDATION_RULES.budgetProjectId);
  setupFieldValidation('budgetAmount', BUDGET_VALIDATION_RULES.budgetAmount);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ValidationRules,
    validateField,
    validateForm,
    validateProjectForm,
    validateInvoiceForm,
    validatePaymentForm,
    validateExpenseForm,
    validateBudgetForm,
    setupFieldValidation,
    clearFieldError,
    showFieldError,
    resetForm
  };
}
