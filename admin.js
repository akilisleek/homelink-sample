const DATA = window.HOMELINK_DATA;
const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const inquiries = () => JSON.parse(localStorage.getItem('homelink_inquiries') || '[]');
const serviceRequests = () => JSON.parse(localStorage.getItem('homelink_service_requests') || '[]');
const supplierRequests = () => JSON.parse(localStorage.getItem('homelink_supplier_requests') || '[]');

function initAdminTabs() {
  qsa('[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      qsa('[data-tab]').forEach(item => item.classList.remove('active'));
      qsa('[data-panel]').forEach(panel => panel.classList.remove('active'));
      button.classList.add('active');
      qs(`[data-panel="${button.dataset.tab}"]`).classList.add('active');
    });
  });
}

function formatKes(amount) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
}

function renderStats() {
  const all = DATA.properties;
  const rent = all.filter(p => p.transaction === 'Rent').length;
  const sale = all.filter(p => p.transaction === 'Sale').length;
  const inq = inquiries().length;
  const countries = new Set(all.map(p => p.country)).size;
  const stats = [
    ['Listings', all.length],
    ['Rentals', rent],
    ['Sales', sale],
    ['Countries', countries],
    ['Inquiries', inq],
    ['Service requests', serviceRequests().length + 6],
    ['Supplier leads', supplierRequests().length],
    ['Featured', all.filter(p => p.featured).length],
    ['Avg. rent', formatKes(Math.round(all.filter(p => p.transaction === 'Rent').reduce((sum, p) => sum + p.price, 0) / rent))],
    ['Admin users', 4]
  ];
  qs('#statGrid').innerHTML = stats.map(([label, value]) => `
    <article class="stat"><strong>${value}</strong><span class="muted">${label}</span></article>
  `).join('');
}

function renderListingsTable() {
  qs('#listingsTable').innerHTML = DATA.properties.map(property => `
    <tr>
      <td><strong>${property.title}</strong><br><span class="small">${property.location}</span></td>
      <td>${property.type}</td>
      <td>${property.transaction}</td>
      <td>${property.bedrooms || '—'}</td>
      <td>${formatKes(property.price)}${property.period === 'month' ? '/mo' : ''}</td>
      <td><span class="status-pill">${property.status}</span></td>
      <td><a class="btn ghost small-btn" href="property.html?id=${property.id}">Open</a></td>
    </tr>
  `).join('');
}

function renderInquiries() {
  const data = inquiries();
  const container = qs('#inquiriesTable');
  if (!data.length) {
    container.innerHTML = `<tr><td colspan="6"><div class="empty">No customer inquiries yet. Submit a viewing request from any property page to test the workflow.</div></td></tr>`;
    return;
  }
  container.innerHTML = data.map(item => `
    <tr>
      <td><strong>${item.name}</strong><br><span class="small">${item.email}</span></td>
      <td>${item.phone || '—'}</td>
      <td>${item.propertyTitle}</td>
      <td>${item.message || 'Viewing request'}</td>
      <td>${new Date(item.createdAt).toLocaleString()}</td>
      <td><span class="status-pill">${item.status}</span></td>
    </tr>
  `).join('');
}

function renderServiceRequests() {
  const sample = [
    { id: 'REQ-1001', service: 'Airport pickup + temporary stay', location: 'Westlands, Nairobi', clientType: 'Corporate client', status: 'In review' },
    { id: 'REQ-1002', service: 'School search support', location: 'Runda, Nairobi', clientType: 'Family relocation', status: 'Pending' },
    { id: 'REQ-1003', service: 'Utility and internet setup', location: 'Nyali, Mombasa', clientType: 'Move-in support', status: 'Assigned' },
    { id: 'REQ-1004', service: 'Cross-border due diligence', location: 'Kigali, Rwanda', clientType: 'Diaspora buyer', status: 'New' },
    { id: 'REQ-1005', service: 'Moving and storage coordination', location: 'Lavington, Nairobi', clientType: 'Professional relocation', status: 'Scheduled' },
    { id: 'REQ-1006', service: 'Corporate housing shortlist', location: 'Kampala, Uganda', clientType: 'HR / employer', status: 'New' }
  ];
  const rows = [...serviceRequests(), ...sample];
  qs('#serviceTable').innerHTML = rows.map(row => `
    <tr><td>${row.id}</td><td>${row.service}</td><td>${row.location}</td><td>${row.clientType}</td><td><span class="status-pill">${row.status}</span></td></tr>
  `).join('');
}

function initAddListingConcept() {
  const form = qs('#listingConceptForm');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    qs('#listingConceptResult').innerHTML = `
      <div class="empty" style="margin-top:14px;text-align:left">
        <h3>Listing captured for review</h3>
        <p>This prototype shows the admin journey. In production, this form would create a database record, trigger verification, upload media, and notify the listing manager.</p>
      </div>`;
    form.reset();
  });
}


function renderSupplierRequests() {
  const container = qs('#supplierRequestsTable');
  if (!container) return;
  const rows = supplierRequests();
  if (!rows.length) {
    container.innerHTML = `<tr><td colspan="6"><div class="empty">No supplier requests yet. Open the homepage List Your Property journey and submit one to test the flow.</div></td></tr>`;
    return;
  }
  container.innerHTML = rows.map(row => `
    <tr>
      <td>${row.id}</td>
      <td>${row.supplierType}</td>
      <td>${row.title}</td>
      <td>${row.location}</td>
      <td>${row.price}</td>
      <td><span class="status-pill">${row.status}</span></td>
    </tr>
  `).join('');
}

function initAdmin() {
  initAdminTabs();
  renderStats();
  renderListingsTable();
  renderInquiries();
  renderServiceRequests();
  renderSupplierRequests();
  initAddListingConcept();
  qsa('[data-year]').forEach(node => node.textContent = new Date().getFullYear());
}

document.addEventListener('DOMContentLoaded', initAdmin);
