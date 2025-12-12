/**
* Main Application Logic - CORRECTED VERSION
* Fixed element ID mismatch and HTML structure compatibility
*/

class AppManager {
constructor() {
this.API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzqqt_N8SEW8isUMgbWoSgz_g1SBVjaSo_vvuJCWb00UE3NXuw3Ga0A9D838ty3nN8Z/exec';
this.currentUser = null;
this.currentData = [];
this.currentFilters = {};
this.currentPage = 1;
this.itemsPerPage = 10;
this.init();
}

init() {
console.log('AppManager: Initializing...');
this.setupEventListeners();
console.log('AppManager: Initialization complete');
}

setupEventListeners() {
console.log('AppManager: Setting up event listeners...');

// CORRECTED: Use proper selectors that match HTML structure
const dataForm = document.getElementById('data-form');

// Add data form submit handler
if (dataForm) {
dataForm.addEventListener('submit', (e) => this.handleDataSubmit(e));
console.log('AppManager: Data form event listener added');
} else {
console.warn('AppManager: Data form not found');
}

// Setup filter event listeners
const filterElements = ['filter-status', 'filter-location', 'filter-date-from', 'filter-date-to'];
filterElements.forEach(id => {
const element = document.getElementById(id);
if (element) {
element.addEventListener('change', () => this.applyFilters());
}
console.log(`AppManager: Filter element ${id} setup`);
});

// Setup modal close handlers using event delegation
document.addEventListener('click', (e) => {
if (e.target.classList.contains('close') || e.target.closest('.close')) {
const modal = e.target.closest('.modal');
if (modal) {
this.closeModal(modal.id);
}
}
});

console.log('AppManager: Event listeners setup complete');
}

initializeWithUser(user) {
console.log('AppManager: Initializing with user:', user);
this.currentUser = user;
this.updateUserInterface();
this.loadDashboard();
}

updateUserInterface() {
console.log('AppManager: Updating user interface...');
const userName = document.getElementById('user-name');

if (userName && this.currentUser) {
userName.textContent = this.currentUser.full_name || this.currentUser.username || 'User';
console.log('AppManager: User name updated:', userName.textContent);
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
if (window.authManager) {
window.authManager.showAlert(response.message || 'Failed to load data', 'error');
}
}
} catch (error) {
console.error('AppManager: Dashboard load error:', error);
if (window.authManager) {
window.authManager.showAlert('Failed to load dashboard: ' + error.message, 'error');
}
} finally {
this.showLoading(false);
}
}

updateDashboard() {
console.log('AppManager: Updating dashboard stats...');

// CORRECTED: Use elements that actually exist in HTML
const totalDevices = document.getElementById('total-devices');
const activeDevices = document.getElementById('active-devices');
const warningDevices = document.getElementById('warning-devices');
const averageUsage = document.getElementById('average-usage');

const stats = this.calculateStats();

if (totalDevices) totalDevices.textContent = stats.totalDevices;
if (activeDevices) activeDevices.textContent = stats.activeDevices;
if (warningDevices) warningDevices.textContent = stats.warningDevices;
if (averageUsage) averageUsage.textContent = stats.averageUsage + '%';

console.log('AppManager: Dashboard stats updated:', stats);
}

calculateStats() {
const data = this.currentData;

// Calculate stats based on available data
const totalDevices = data.length;
const activeDevices = data.filter(item => 
item.status && item.status.toLowerCase() === 'active'
).length;
const warningDevices = data.filter(item => 
item.status && (item.status.toLowerCase() === 'maintenance' || item.status.toLowerCase() === 'inactive')
).length;

// Calculate average usage (mock calculation)
const averageUsage = totalDevices > 0 ? Math.round((activeDevices / totalDevices) * 100) : 0;

return {
totalDevices,
activeDevices,
warningDevices,
averageUsage
};
}

updateDataTable() {
console.log('AppManager: Updating data table...');
const tbody = document.querySelector('#data-table tbody');
if (!tbody) {
console.error('AppManager: Data table body not found');
return;
}

tbody.innerHTML = '';

if (this.currentData.length === 0) {
console.log('AppManager: No data to display');
const emptyRow = document.createElement('tr');
emptyRow.innerHTML = `
<td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">
<i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
Belum ada data. Klik "Tambah Data Baru" untuk mulai.
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
<td>${this.escapeHtml(item.id || '')}</td>
<td>${this.escapeHtml(item.device_name || item.nama_perangkat || '')}</td>
<td>${this.escapeHtml(item.location || item.lokasi || '')}</td>
<td><span class="status-badge status-${(item.status || '').toLowerCase()}">${this.escapeHtml(item.status || '')}</span></td>
<td>${item.power_consumption || item.konsumsi_daya || 0} W</td>
<td>${this.formatDate(item.last_updated || item.terakhir_diperbarui)}</td>
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

const totalPages = Math.ceil(this.currentData.length / this.itemsPerPage);
const currentPage = this.currentPage;

// Update pagination info elements
const pageStart = document.getElementById('page-start');
const pageEnd = document.getElementById('page-end');
const totalRecords = document.getElementById('total-records');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');

if (pageStart) pageStart.textContent = Math.min((currentPage - 1) * this.itemsPerPage + 1, this.currentData.length);
if (pageEnd) pageEnd.textContent = Math.min(currentPage * this.itemsPerPage, this.currentData.length);
if (totalRecords) totalRecords.textContent = this.currentData.length;
if (currentPageSpan) currentPageSpan.textContent = currentPage;
if (totalPagesSpan) totalPagesSpan.textContent = totalPages;

console.log(`AppManager: Pagination updated - Page ${currentPage} of ${totalPages}`);
}

goToPage(page) {
const totalPages = Math.ceil(this.currentData.length / this.itemsPerPage);
if (page >= 1 && page <= totalPages) {
this.currentPage = page;
this.updateDataTable();
this.updatePagination();
console.log('AppManager: Navigated to page', page);
}
}

populateFilters() {
console.log('AppManager: Populating filters...');

// Populate status filter
const statusFilter = document.getElementById('filter-status');
if (statusFilter) {
const statuses = [...new Set(this.currentData.map(item => item.status).filter(Boolean))];
statusFilter.innerHTML = '<option value="">Semua Status</option>';
statuses.forEach(status => {
const option = document.createElement('option');
option.value = status;
option.textContent = status;
statusFilter.appendChild(option);
});
}

// Populate location filter
const locationFilter = document.getElementById('filter-location');
if (locationFilter) {
const locations = [...new Set(this.currentData.map(item => item.location || item.lokasi).filter(Boolean))];
locationFilter.innerHTML = '<option value="">Semua Lokasi</option>';
locations.forEach(location => {
const option = document.createElement('option');
option.value = location;
option.textContent = location;
locationFilter.appendChild(option);
});
}
}

applyFilters() {
console.log('AppManager: Applying filters...');
this.currentFilters = {
status: document.getElementById('filter-status').value,
location: document.getElementById('filter-location').value,
dateFrom: document.getElementById('filter-date-from').value,
dateTo: document.getElementById('filter-date-to').value
};

console.log('AppManager: Current filters:', this.currentFilters);

// Reset to first page when filters change
this.currentPage = 1;
this.loadDashboard();
}

clearFilters() {
console.log('AppManager: Clearing filters...');

// Clear all filter inputs
const filters = ['filter-status', 'filter-location', 'filter-date-from', 'filter-date-to'];
filters.forEach(filterId => {
const element = document.getElementById(filterId);
if (element) {
element.value = '';
}
});

this.currentFilters = {};
this.currentPage = 1;
this.loadDashboard();
}

showAddDataModal() {
console.log('AppManager: Showing add data modal');
document.getElementById('modal-title').textContent = 'Tambah Data Baru';
document.getElementById('data-form').reset();
document.getElementById('edit-id').value = '';
this.showModal('data-modal');
}

editData(id) {
console.log('AppManager: Editing data with ID:', id);
const item = this.currentData.find(data => data.id == id);
if (!item) {
console.error('AppManager: Item not found for edit:', id);
if (window.authManager) {
window.authManager.showAlert('Data tidak ditemukan', 'error');
}
return;
}

console.log('AppManager: Editing item:', item);
document.getElementById('modal-title').textContent = 'Edit Data';
document.getElementById('edit-id').value = item.id;

// Populate form fields - CORRECTED to match HTML structure
document.getElementById('device-name').value = item.device_name || item.nama_perangkat || '';
document.getElementById('device-location').value = item.location || item.lokasi || '';
document.getElementById('device-status').value = item.status || '';
document.getElementById('power-consumption').value = item.power_consumption || item.konsumsi_daya || '';

this.showModal('data-modal');
}

async deleteData(id) {
if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) {
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
if (window.authManager) {
window.authManager.showAlert('Data berhasil dihapus', 'success');
}
this.loadDashboard();
} else {
if (window.authManager) {
window.authManager.showAlert(response.message || 'Gagal menghapus data', 'error');
}
}
} catch (error) {
console.error('AppManager: Delete error:', error);
if (window.authManager) {
window.authManager.showAlert('Gagal menghapus data: ' + error.message, 'error');
}
} finally {
this.showLoading(false);
}
}

async handleDataSubmit(event) {
if (event && event.preventDefault) {
event.preventDefault();
}

const formData = new FormData(document.getElementById('data-form'));
const data = Object.fromEntries(formData.entries());

console.log('AppManager: Form data submitted:', data);

// Validate required fields
const requiredFields = ['deviceName', 'location', 'status', 'powerConsumption'];
for (let field of requiredFields) {
if (!data[field] || data[field].trim() === '') {
if (window.authManager) {
window.authManager.showAlert(`Field '${field}' wajib diisi`, 'error');
}
return;
}
}

// FIXED: Always use correct action names
const action = data.editId ? 'updateData' : 'addData';
if (data.editId) {
delete data.editId;
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
const message = data.editId ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan';
if (window.authManager) {
window.authManager.showAlert(message, 'success');
}
this.closeModal('data-modal');
this.loadDashboard();
} else {
if (window.authManager) {
window.authManager.showAlert(response.message || 'Gagal menyimpan data', 'error');
}
}
} catch (error) {
console.error('AppManager: Save error:', error);
if (window.authManager) {
window.authManager.showAlert('Gagal menyimpan data: ' + error.message, 'error');
}
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

escapeHtml(text) {
if (!text) return '';
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
console.log('AppManager: DOM loaded, initializing AppManager');
window.appManager = new AppManager();
console.log('AppManager: AppManager instance created:', window.appManager);
});
