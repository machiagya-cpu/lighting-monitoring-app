/**
* Main Application Logic - COMPLETE FIX VERSION
*/

class AppManager {
constructor() {
this.API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx_oUdtIKJSA639p0pHq4oqIbaDyiBf_kajHpK-zWgRXvojQxj73jHPethx0yRDEZvr/exec';
this.currentUser = null;
this.currentData = [];
this.currentFilters = {};
this.currentPage = 1;
this.itemsPerPage = 10;
this.init();
}

init() {
this.setupEventListeners();
}

setupEventListeners() {
// Dashboard actions
const refreshBtn = document.getElementById('refresh-data-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');

if (refreshBtn) {
refreshBtn.addEventListener('click', () => this.loadDashboard());
}

if (exportPdfBtn) {
exportPdfBtn.addEventListener('click', () => this.exportToPDF());
}

// Data management
const addDataBtn = document.getElementById('add-data-btn');
const dataForm = document.getElementById('data-form');
const applyFiltersBtn = document.getElementById('apply-filters-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');

if (addDataBtn) {
addDataBtn.addEventListener('click', () => this.showAddDataModal());
}

if (dataForm) {
dataForm.addEventListener('submit', (e) => this.handleDataSubmit(e));
}

if (applyFiltersBtn) {
applyFiltersBtn.addEventListener('click', () => this.applyFilters());
}

if (clearFiltersBtn) {
clearFiltersBtn.addEventListener('click', () => this.clearFilters());
}

// Modal close - FIXED: Use proper event listeners instead of onclick
const closeButtons = document.querySelectorAll('.close');
closeButtons.forEach(btn => {
btn.addEventListener('click', (e) => {
const modal = e.target.closest('.modal');
if (modal) {
this.closeModal(modal.id);
}
});
});

// Click outside modal to close
document.addEventListener('click', (e) => {
if (e.target.classList.contains('modal')) {
this.closeModal(e.target.id);
}
});

// Pagination controls
this.setupPaginationControls();
}

setupPaginationControls() {
// Create pagination container if it doesn't exist
let paginationContainer = document.getElementById('pagination-container');
if (!paginationContainer) {
paginationContainer = document.createElement('div');
paginationContainer.id = 'pagination-container';
paginationContainer.className = 'pagination-container';

// Find table container and append pagination after it
const tableContainer = document.querySelector('.table-container');
if (tableContainer) {
tableContainer.parentNode.insertBefore(paginationContainer, tableContainer.nextSibling);
}
}
}

initializeWithUser(user) {
this.currentUser = user;
this.updateUserInterface();
this.loadDashboard();
}

updateUserInterface() {
const userName = document.getElementById('user-name');
const userRole = document.getElementById('user-role');

if (userName && this.currentUser) {
userName.textContent = this.currentUser.full_name || this.currentUser.username;
}

if (userRole && this.currentUser) {
userRole.textContent = this.currentUser.role;
userRole.className = `role-badge role-${this.currentUser.role.toLowerCase()}`;
}
}

async loadDashboard() {
try {
this.showLoading(true);

console.log('AppManager: Loading dashboard...');

const response = await this.makeAPICall('POST', {
action: 'getData',
filters: this.currentFilters
});

console.log('AppManager: Dashboard response:', response);

// FIXED: Check response structure properly
if (response.success === true) {
this.currentData = response.data || [];
console.log('AppManager: Data loaded successfully, count:', this.currentData.length);
this.updateDashboard();
this.updateDataTable();
this.populateFilters();
this.updatePagination();
console.log('AppManager: Dashboard updated successfully');
} else {
console.error('AppManager: Failed to load data:', response.message);
window.authManager.showAlert(response.message || 'Failed to load data', 'error');
}
} catch (error) {
console.error('AppManager: Dashboard load error:', error);
window.authManager.showAlert('Failed to load dashboard: ' + error.message, 'error');
} finally {
this.showLoading(false);
}
}

updateDashboard() {
console.log('AppManager: Updating dashboard...');
const stats = this.calculateStats();

document.getElementById('total-fittings').textContent = stats.totalFittings;
document.getElementById('completed-installations').textContent = stats.completed;
document.getElementById('in-progress').textContent = stats.inProgress;
document.getElementById('total-wattage').textContent = stats.totalWattage;

console.log('AppManager: Dashboard updated with stats:', stats);
}

calculateStats() {
const data = this.currentData;

const totalFittings = data.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
const completed = data.filter(item => item.status === 'Completed').length;
const inProgress = data.filter(item => item.status === 'In Progress').length;
const totalWattage = data.reduce((sum, item) => sum + ((parseInt(item.qty) || 0) * (parseInt(item.watt) || 0)), 0);

return {
totalFittings,
completed,
inProgress,
totalWattage
};
}

updateDataTable() {
console.log('AppManager: Updating data table...');
const tbody = document.getElementById('data-table-body');
if (!tbody) {
console.error('AppManager: Data table body not found');
return;
}

tbody.innerHTML = '';

if (this.currentData.length === 0) {
console.log('AppManager: No data to display');
const emptyRow = document.createElement('tr');
emptyRow.innerHTML = `
<td colspan="11" style="text-align: center; padding: 2rem; color: #6b7280;">
<i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
No data available. Click "Add New Data" to get started.
</td>
`;
tbody.appendChild(emptyRow);
return;
}

// Get paginated data
const startIndex = (this.currentPage - 1) * this.itemsPerPage;
const endIndex = startIndex + this.itemsPerPage;
const paginatedData = this.currentData.slice(startIndex, endIndex);

console.log(`AppManager: Showing page ${this.currentPage}, items ${startIndex}-${endIndex} of ${this.currentData.length}`);

paginatedData.forEach(item => {
const row = document.createElement('tr');
row.innerHTML = `
<td>${this.escapeHtml(item.floor || item.lantai || '')}</td>
<td>${this.escapeHtml(item.area || '')}</td>
<td>${this.escapeHtml(item.room || '')}</td>
<td>${this.escapeHtml(item.fitting_ref || item.ref_fitting || '')}</td>
<td>${this.escapeHtml(item.type || '')}</td>
<td>${item.qty || 0}</td>
<td>${item.watt || 0}</td>
<td><span class="status-badge status-${(item.status || '').toLowerCase().replace(' ', '-')}">${item.status || ''}</span></td>
<td>${this.formatDate(item.order_date || item.tgl_order)}</td>
<td>${this.formatDate(item.completion_date || item.tgl_selesai)}</td>
<td class="actions">
<button class="btn btn-sm btn-secondary" onclick="window.appManager.editData('${item.id}')" title="Edit">
<i class="fas fa-edit"></i>
</button>
<button class="btn btn-sm btn-danger" onclick="window.appManager.deleteData('${item.id}')" title="Delete">
<i class="fas fa-trash"></i>
</button>
</td>
`;
tbody.appendChild(row);
});

console.log('AppManager: Data table updated with', paginatedData.length, 'rows for page', this.currentPage);
}

updatePagination() {
console.log('AppManager: Updating pagination...');
const paginationContainer = document.getElementById('pagination-container');
if (!paginationContainer) return;

const totalPages = Math.ceil(this.currentData.length / this.itemsPerPage);
const currentPage = this.currentPage;

let paginationHTML = `
<div class="pagination-info">
Showing ${Math.min((currentPage - 1) * this.itemsPerPage + 1, this.currentData.length)} to ${Math.min(currentPage * this.itemsPerPage, this.currentData.length)} of ${this.currentData.length} entries
</div>
<div class="pagination-controls">
`;

if (currentPage > 1) {
paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="window.appManager.goToPage(${currentPage - 1})">Previous</button>`;
}

paginationHTML += `<span class="pagination-page">Page ${currentPage} of ${totalPages}</span>`;

if (currentPage < totalPages) {
paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="window.appManager.goToPage(${currentPage + 1})">Next</button>`;
}

paginationHTML += '</div>';

paginationContainer.innerHTML = paginationHTML;
}

goToPage(page) {
const totalPages = Math.ceil(this.currentData.length / this.itemsPerPage);
if (page >= 1 && page <= totalPages) {
this.currentPage = page;
this.updateDataTable();
this.updatePagination();
}
}

populateFilters() {
const floorFilter = document.getElementById('floor-filter');
if (!floorFilter) return;

const floors = [...new Set(this.currentData.map(item => item.floor || item.lantai).filter(Boolean))];

// Clear existing options except "All"
floorFilter.innerHTML = '<option value="">All Floors</option>';

floors.forEach(floor => {
const option = document.createElement('option');
option.value = floor;
option.textContent = floor;
floorFilter.appendChild(option);
});
}

applyFilters() {
console.log('AppManager: Applying filters...');
this.currentFilters = {
floor: document.getElementById('floor-filter').value,
status: document.getElementById('status-filter').value,
search: document.getElementById('search-filter').value
};

console.log('AppManager: Current filters:', this.currentFilters);

// Reset to first page when filters change
this.currentPage = 1;
this.loadDashboard();
}

clearFilters() {
console.log('AppManager: Clearing filters...');
document.getElementById('floor-filter').value = '';
document.getElementById('status-filter').value = '';
document.getElementById('search-filter').value = '';
this.currentFilters = {};
this.currentPage = 1;
this.loadDashboard();
}

showAddDataModal() {
console.log('AppManager: Showing add data modal');
document.getElementById('modal-title').textContent = 'Add New Data';
document.getElementById('data-form').reset();
document.getElementById('record-id').value = '';
this.showModal('data-modal');
}

editData(id) {
const item = this.currentData.find(data => data.id == id); // Use == for type coercion
if (!item) {
console.error('AppManager: Item not found for edit:', id);
window.authManager.showAlert('Item not found', 'error');
return;
}

console.log('AppManager: Editing item:', item);
document.getElementById('modal-title').textContent = 'Edit Data';
document.getElementById('record-id').value = item.id;

// Populate form fields
document.getElementById('floor').value = item.floor || item.lantai || '';
document.getElementById('area').value = item.area || '';
document.getElementById('room').value = item.room || '';
document.getElementById('fitting_ref').value = item.fitting_ref || item.ref_fitting || '';
document.getElementById('type').value = item.type || '';
document.getElementById('qty').value = item.qty || '';
document.getElementById('watt').value = item.watt || '';
document.getElementById('status').value = item.status || 'Pending';
document.getElementById('order_date').value = this.formatDateForInput(item.order_date || item.tgl_order);
document.getElementById('completion_date').value = this.formatDateForInput(item.completion_date || item.tgl_selesai);

this.showModal('data-modal');
}

async deleteData(id) {
if (!confirm('Are you sure you want to delete this data?')) {
return;
}

try {
this.showLoading(true);

console.log('AppManager: Deleting data with ID:', id);

const response = await this.makeAPICall('POST', {
action: 'deleteData',
record_id: id
});

console.log('AppManager: Delete response:', response);

if (response.success === true) {
window.authManager.showAlert('Data deleted successfully', 'success');
this.loadDashboard();
} else {
window.authManager.showAlert(response.message || 'Failed to delete data', 'error');
}
} catch (error) {
console.error('AppManager: Delete error:', error);
window.authManager.showAlert('Failed to delete data: ' + error.message, 'error');
} finally {
this.showLoading(false);
}
}

async handleDataSubmit(event) {
event.preventDefault();

const formData = new FormData(event.target);
const data = Object.fromEntries(formData.entries());

console.log('AppManager: Form data submitted:', data);

// Validate required fields
const requiredFields = ['floor', 'fitting_ref', 'qty', 'watt'];
for (let field of requiredFields) {
if (!data[field] || data[field].trim() === '') {
window.authManager.showAlert(`Field '${field}' is required`, 'error');
return;
}
}

// FIXED: Always use 'addData' action (not 'addLightingData')
const action = data.record_id ? 'updateData' : 'addData';
if (data.record_id) {
delete data.record_id;
}

try {
this.showLoading(true);

console.log('AppManager: Submitting data with action:', action);

const response = await this.makeAPICall('POST', {
action: action,
data: data
});

console.log('AppManager: Submit response:', response);

if (response.success === true) {
const message = data.record_id ? 'Data updated successfully' : 'Data added successfully';
window.authManager.showAlert(message, 'success');
this.closeModal('data-modal');
this.loadDashboard();
} else {
window.authManager.showAlert(response.message || 'Failed to save data', 'error');
}
} catch (error) {
console.error('AppManager: Save error:', error);
window.authManager.showAlert('Failed to save data: ' + error.message, 'error');
} finally {
this.showLoading(false);
}
}

async exportToPDF() {
try {
this.showLoading(true);

console.log('AppManager: Exporting PDF...');

const response = await this.makeAPICall('POST', {
action: 'exportPDF',
filters: this.currentFilters
});

console.log('AppManager: PDF export response:', response);

if (response.success === true) {
window.authManager.showAlert('PDF report generated successfully', 'success');
} else {
window.authManager.showAlert(response.message || 'Failed to generate PDF', 'error');
}
} catch (error) {
console.error('AppManager: PDF export error:', error);
window.authManager.showAlert('Failed to generate PDF: ' + error.message, 'error');
} finally {
this.showLoading(false);
}
}

async makeAPICall(method, data) {
const options = {
method: method,
headers: {
'Content-Type': 'text/plain',
},
};

if (data) {
options.body = JSON.stringify(data);
}

try {
console.log('AppManager: Making API call to:', this.API_ENDPOINT);
console.log('AppManager: Request data:', data);

const response = await fetch(this.API_ENDPOINT, options);

console.log('AppManager: Response status:', response.status);

if (!response.ok) {
throw new Error(`HTTP error! status: ${response.status}`);
}

const result = await response.json();
console.log('AppManager: API response:', result);
return result;
} catch (error) {
console.error('AppManager: API call error:', error);
throw new Error('Failed to connect to server: ' + error.message);
}
}

showModal(modalId) {
const modal = document.getElementById(modalId);
if (modal) {
modal.style.display = 'flex';
console.log('AppManager: Modal shown:', modalId);
} else {
console.error('AppManager: Modal not found:', modalId);
}
}

closeModal(modalId) {
const modal = document.getElementById(modalId);
if (modal) {
modal.style.display = 'none';
console.log('AppManager: Modal closed:', modalId);
} else {
console.error('AppManager: Modal not found for closing:', modalId);
}
}

showLoading(show) {
const loadingOverlay = document.getElementById('loading-overlay');
if (loadingOverlay) {
loadingOverlay.style.display = show ? 'flex' : 'none';
console.log('AppManager: Loading overlay:', show ? 'shown' : 'hidden');
} else {
console.error('AppManager: Loading overlay not found');
}
}

formatDate(dateString) {
if (!dateString) return '';
try {
const date = new Date(dateString);
return date.toLocaleDateString('id-ID');
} catch (error) {
return dateString;
}
}

formatDateForInput(dateString) {
if (!dateString) return '';
try {
const date = new Date(dateString);
return date.toISOString().split('T')[0];
} catch (error) {
return '';
}
}

escapeHtml(text) {
const map = {
'&': '&amp;',
'<': '&lt;',
'>': '&gt;',
'"': '&quot;',
"'": '&#039;'
};
return text.replace(/[&<>"']/g, (m) => map[m]);
}
}

// Initialize app manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
window.appManager = new AppManager();
console.log('AppManager: AppManager instance created:', window.appManager);
});
