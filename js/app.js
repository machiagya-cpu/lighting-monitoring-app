/**
* Main Application Logic
*/

class AppManager {
constructor() {
this.API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwIqRPDbjntE-Ox4DsGXtNa-JFrXeDmNeK6PsUIY-qBDb1BhYLiAqw7AOKu2QqGurzw/exec';
this.currentUser = null;
this.currentData = [];
this.currentFilters = {};
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

// Modal close
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

const response = await this.makeAPICall('POST', {
action: 'getData',
filters: this.currentFilters
});

if (response.status === 'success') {
this.currentData = response.data;
this.updateDashboard();
this.updateDataTable();
this.populateFilters();
} else {
window.authManager.showAlert(response.message || 'Failed to load data', 'error');
}
} catch (error) {
console.error('Dashboard load error:', error);
window.authManager.showAlert('Failed to load dashboard: ' + error.message, 'error');
} finally {
this.showLoading(false);
}
}

updateDashboard() {
const stats = this.calculateStats();

document.getElementById('total-fittings').textContent = stats.totalFittings;
document.getElementById('completed-installations').textContent = stats.completed;
document.getElementById('in-progress').textContent = stats.inProgress;
document.getElementById('total-wattage').textContent = stats.totalWattage;
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
const tbody = document.getElementById('data-table-body');
if (!tbody) return;

tbody.innerHTML = '';

this.currentData.forEach(item => {
const row = document.createElement('tr');
row.innerHTML = `
<td>${this.escapeHtml(item.floor || '')}</td>
<td>${this.escapeHtml(item.area || '')}</td>
<td>${this.escapeHtml(item.room || '')}</td>
<td>${this.escapeHtml(item.fitting_ref || '')}</td>
<td>${this.escapeHtml(item.type || '')}</td>
<td>${item.qty || 0}</td>
<td>${item.watt || 0}</td>
<td><span class="status-badge status-${(item.status || '').toLowerCase().replace(' ', '-')}">${item.status || ''}</span></td>
<td>${this.formatDate(item.order_date)}</td>
<td>${this.formatDate(item.completion_date)}</td>
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
}

populateFilters() {
const floorFilter = document.getElementById('floor-filter');
if (!floorFilter) return;

const floors = [...new Set(this.currentData.map(item => item.floor).filter(Boolean))];

// Clear existing options except "All"
floorFilter.innerHTML = '<option value="">Semua Lantai</option>';

floors.forEach(floor => {
const option = document.createElement('option');
option.value = floor;
option.textContent = floor;
floorFilter.appendChild(option);
});
}

applyFilters() {
this.currentFilters = {
floor: document.getElementById('floor-filter').value,
status: document.getElementById('status-filter').value,
search: document.getElementById('search-filter').value
};

this.loadDashboard();
}

clearFilters() {
document.getElementById('floor-filter').value = '';
document.getElementById('status-filter').value = '';
document.getElementById('search-filter').value = '';
this.currentFilters = {};
this.loadDashboard();
}

showAddDataModal() {
document.getElementById('modal-title').textContent = 'Tambah Data';
document.getElementById('data-form').reset();
document.getElementById('record-id').value = '';
this.showModal('data-modal');
}

editData(id) {
const item = this.currentData.find(data => data.id === id);
if (!item) return;

document.getElementById('modal-title').textContent = 'Edit Data';
document.getElementById('record-id').value = item.id;

// Populate form fields
document.getElementById('floor').value = item.floor || '';
document.getElementById('area').value = item.area || '';
document.getElementById('room').value = item.room || '';
document.getElementById('fitting_ref').value = item.fitting_ref || '';
document.getElementById('type').value = item.type || '';
document.getElementById('qty').value = item.qty || '';
document.getElementById('watt').value = item.watt || '';
document.getElementById('status').value = item.status || 'Pending';
document.getElementById('order_date').value = this.formatDateForInput(item.order_date);
document.getElementById('completion_date').value = this.formatDateForInput(item.completion_date);

this.showModal('data-modal');
}

async deleteData(id) {
if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) {
return;
}

try {
this.showLoading(true);

const response = await this.makeAPICall('POST', {
action: 'deleteData',
record_id: id
});

if (response.status === 'success') {
window.authManager.showAlert('Data berhasil dihapus', 'success');
this.loadDashboard();
} else {
window.authManager.showAlert(response.message || 'Failed to delete data', 'error');
}
} catch (error) {
console.error('Delete error:', error);
window.authManager.showAlert('Failed to delete data: ' + error.message, 'error');
} finally {
this.showLoading(false);
}
}

async handleDataSubmit(event) {
event.preventDefault();

const formData = new FormData(event.target);
const data = Object.fromEntries(formData.entries());

// Validate required fields
const requiredFields = ['floor', 'fitting_ref', 'qty', 'watt'];
for (let field of requiredFields) {
if (!data[field] || data[field].trim() === '') {
window.authManager.showAlert(`Field '${field}' harus diisi`, 'error');
return;
}
}

const action = data.record_id ? 'updateLightingData' : 'addLightingData';
if (data.record_id) {
delete data.record_id;
}

try {
this.showLoading(true);

const response = await this.makeAPICall('POST', {
action: action,
data: data
});

if (response.status === 'success') {
const message = data.record_id ? 'Data berhasil diupdate' : 'Data berhasil ditambahkan';
window.authManager.showAlert(message, 'success');
this.closeModal('data-modal');
this.loadDashboard();
} else {
window.authManager.showAlert(response.message || 'Failed to save data', 'error');
}
} catch (error) {
console.error('Save error:', error);
window.authManager.showAlert('Failed to save data: ' + error.message, 'error');
} finally {
this.showLoading(false);
}
}

async exportToPDF() {
try {
this.showLoading(true);

const response = await this.makeAPICall('POST', {
action: 'exportPDF',
filters: this.currentFilters
});

if (response.status === 'success') {
if (response.pdf_url) {
window.open(response.pdf_url, '_blank');
window.authManager.showAlert('PDF report generated successfully', 'success');
} else {
window.authManager.showAlert('PDF report generated', 'success');
}
} else {
window.authManager.showAlert(response.message || 'Failed to generate PDF', 'error');
}
} catch (error) {
console.error('PDF export error:', error);
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
const response = await fetch(this.API_ENDPOINT, options);

if (!response.ok) {
throw new Error(`HTTP error! status: ${response.status}`);
}

const result = await response.json();
return result;
} catch (error) {
console.error('API call error:', error);
throw new Error('Failed to connect to server: ' + error.message);
}
}

showModal(modalId) {
const modal = document.getElementById(modalId);
if (modal) {
modal.style.display = 'flex';
}
}

closeModal(modalId) {
const modal = document.getElementById(modalId);
if (modal) {
modal.style.display = 'none';
}
}

showLoading(show) {
const loadingOverlay = document.getElementById('loading-overlay');
if (loadingOverlay) {
loadingOverlay.style.display = show ? 'flex' : 'none';
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
});
