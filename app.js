const DATA = window.HOMELINK_DATA;
const state = {
  currency: localStorage.getItem('homelink_currency') || 'KES',
  favorites: JSON.parse(localStorage.getItem('homelink_favorites') || '[]')
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[char] || char));
const serviceFlow = { step: 0, serviceIndex: 0, data: {} };
const supplierFlow = { step: 0, data: { supplierType: 'Owner' } };

function formatMoney(amount, property) {
  const selected = state.currency;
  const rate = DATA.exchangeRates[selected] || 1;
  const value = amount * rate;
  const maximumFractionDigits = selected === 'KES' ? 0 : 0;
  const formatted = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: selected,
    maximumFractionDigits
  }).format(value);
  return property?.period === 'month' ? `${formatted}/month` : formatted;
}

function initSharedUI() {
  const menuBtn = qs('[data-menu]');
  if (menuBtn) menuBtn.addEventListener('click', () => document.body.classList.toggle('menu-open'));
  qsa('[data-currency]').forEach(select => {
    select.value = state.currency;
    select.addEventListener('change', event => {
      state.currency = event.target.value;
      localStorage.setItem('homelink_currency', state.currency);
      qsa('[data-currency]').forEach(other => other.value = state.currency);
      renderCurrentPage();
    });
  });
  qsa('[data-year]').forEach(node => node.textContent = new Date().getFullYear());
}

function propertyCard(property) {
  const isFav = state.favorites.includes(property.id);
  return `
    <article class="property-card">
      <a class="card-image" href="property.html?id=${property.id}" aria-label="View ${property.title}">
        <img src="${property.image}" alt="${property.title}" loading="lazy">
        <div class="badge-row">
          <span class="badge gold">${property.transaction}</span>
          <span class="badge">${property.status}</span>
        </div>
      </a>
      <button class="favorite" data-favorite="${property.id}" aria-label="Save ${property.title}">${isFav ? '♥' : '♡'}</button>
      <div class="card-body">
        <p class="eyebrow">${property.location}</p>
        <h3><a href="property.html?id=${property.id}">${property.title}</a></h3>
        <div class="card-meta">
          <span>${property.type}</span>
          <span>${property.bedrooms ? property.bedrooms + ' beds' : 'No beds'}</span>
          <span>${property.bathrooms ? property.bathrooms + ' baths' : 'No baths'}</span>
          <span>${property.area} m²</span>
        </div>
        <p class="price">${formatMoney(property.price, property)}</p>
      </div>
      <div class="card-footer">
        <a class="btn ghost small-btn" href="property.html?id=${property.id}">View details</a>
        <button class="btn small-btn" data-inquire="${property.id}">Request viewing</button>
      </div>
    </article>
  `;
}

function attachCardActions() {
  qsa('[data-favorite]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.favorite;
      state.favorites = state.favorites.includes(id)
        ? state.favorites.filter(item => item !== id)
        : [...state.favorites, id];
      localStorage.setItem('homelink_favorites', JSON.stringify(state.favorites));
      renderCurrentPage();
    });
  });
  qsa('[data-inquire]').forEach(button => {
    button.addEventListener('click', () => openInquiry(button.dataset.inquire));
  });
}

function buildLocationOptions() {
  const locations = [...new Set(DATA.properties.map(p => p.city))].sort();
  qsa('[data-location-options]').forEach(select => {
    const current = select.value;
    select.innerHTML = '<option value="">Any location</option>' + locations.map(location => `<option value="${location}">${location}</option>`).join('');
    select.value = current;
  });
}

function readFilters() {
  return {
    location: qs('#location')?.value || '',
    transaction: qs('#transaction')?.value || '',
    type: qs('#type')?.value || '',
    bedrooms: qs('#bedrooms')?.value || '',
    minPrice: Number(qs('#minPrice')?.value || 0),
    maxPrice: Number(qs('#maxPrice')?.value || 0),
    sort: qs('#sort')?.value || 'featured'
  };
}

function applyFilters(properties, filters) {
  let result = [...properties];
  if (filters.location) result = result.filter(p => p.city === filters.location || p.country === filters.location);
  if (filters.transaction) result = result.filter(p => p.transaction === filters.transaction);
  if (filters.type) result = result.filter(p => p.type === filters.type);
  if (filters.bedrooms) {
    const minBeds = Number(filters.bedrooms);
    result = result.filter(p => p.bedrooms >= minBeds);
  }
  if (filters.minPrice) result = result.filter(p => p.price >= filters.minPrice);
  if (filters.maxPrice) result = result.filter(p => p.price <= filters.maxPrice);
  switch (filters.sort) {
    case 'price-low': result.sort((a, b) => a.price - b.price); break;
    case 'price-high': result.sort((a, b) => b.price - a.price); break;
    case 'beds': result.sort((a, b) => b.bedrooms - a.bedrooms); break;
    default: result.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
  return result;
}

function filterChips(filters) {
  const entries = [];
  if (filters.location) entries.push(filters.location);
  if (filters.transaction) entries.push(filters.transaction);
  if (filters.type) entries.push(filters.type);
  if (filters.bedrooms) entries.push(`${filters.bedrooms}+ bedrooms`);
  if (filters.minPrice) entries.push(`From KES ${filters.minPrice.toLocaleString()}`);
  if (filters.maxPrice) entries.push(`Up to KES ${filters.maxPrice.toLocaleString()}`);
  return entries.length ? entries.map(item => `<span class="chip">${item}</span>`).join('') : '<span class="chip">Showing verified regional listings</span>';
}

function renderHome() {
  const featured = DATA.properties.filter(property => property.featured).slice(0, 3);
  const featuredContainer = qs('#featuredProperties');
  if (featuredContainer) {
    featuredContainer.innerHTML = featured.map(propertyCard).join('');
    attachCardActions();
  }
  const services = qs('#servicesGrid');
  if (services) {
    services.innerHTML = DATA.services.map((service, index) => `
      <article class="service-card service-card-clickable">
        <div class="service-icon">0${index + 1}</div>
        <h3>${service.title}</h3>
        <p class="muted">${service.description}</p>
        <button class="btn ghost small-btn block" type="button" data-open-service="${index}">Start service journey</button>
      </article>
    `).join('');
    attachServiceLaunchers();
  }
}

function initHomeSearch() {
  const form = qs('#homeSearch');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const params = new URLSearchParams(new FormData(form));
    window.location.href = `properties.html?${params.toString()}`;
  });
}

function loadQueryFilters() {
  const params = new URLSearchParams(window.location.search);
  ['location', 'transaction', 'type', 'bedrooms', 'minPrice', 'maxPrice'].forEach(key => {
    const el = qs(`#${key}`);
    if (el && params.has(key)) el.value = params.get(key);
  });
}

function renderProperties() {
  const grid = qs('#propertiesGrid');
  if (!grid) return;
  const filters = readFilters();
  const result = applyFilters(DATA.properties, filters);
  qs('#resultCount').textContent = `${result.length} listing${result.length === 1 ? '' : 's'} found`;
  qs('#activeChips').innerHTML = filterChips(filters);
  grid.innerHTML = result.length ? result.map(propertyCard).join('') : `
    <div class="empty" style="grid-column:1/-1">
      <h3>No matching properties yet</h3>
      <p>Try removing one filter or requesting a custom property search from the relocation desk.</p>
    </div>`;
  attachCardActions();
}

function initFilters() {
  const form = qs('#propertyFilters');
  if (!form) return;
  loadQueryFilters();
  qsa('input, select', form).forEach(input => input.addEventListener('change', renderProperties));
  form.addEventListener('submit', event => {
    event.preventDefault();
    renderProperties();
  });
  const reset = qs('#resetFilters');
  if (reset) reset.addEventListener('click', () => {
    form.reset();
    history.replaceState(null, '', 'properties.html');
    renderProperties();
  });
  renderProperties();
}

function renderPropertyDetail() {
  const detail = qs('#propertyDetail');
  if (!detail) return;
  const id = new URLSearchParams(window.location.search).get('id') || DATA.properties[0].id;
  const property = DATA.properties.find(item => item.id === id) || DATA.properties[0];
  document.title = `${property.title} | HomelinkGlobal`;
  detail.innerHTML = `
    <div class="container detail-layout">
      <main>
        <div class="gallery">
          ${property.gallery.map(image => `<img src="${image}" alt="${property.title}" loading="lazy">`).join('')}
        </div>
        <section class="section" style="padding-bottom:0">
          <p class="eyebrow">${property.location}</p>
          <h1 style="font-size:clamp(2rem,4vw,3.6rem)">${property.title}</h1>
          <div class="detail-stats">
            <div><strong>${property.type}</strong><span class="small">Property type</span></div>
            <div><strong>${property.bedrooms || '—'}</strong><span class="small">Bedrooms</span></div>
            <div><strong>${property.bathrooms || '—'}</strong><span class="small">Bathrooms</span></div>
            <div><strong>${property.area}</strong><span class="small">Square metres</span></div>
          </div>
          <h2 style="font-size:1.6rem">Overview</h2>
          <p class="muted" style="margin-top:12px">${property.description}</p>
          <h2 style="font-size:1.6rem;margin-top:30px">Amenities and features</h2>
          <div class="amenities">${property.amenities.map(item => `<span class="amenity">${item}</span>`).join('')}</div>
        </section>
      </main>
      <aside class="detail-card">
        <span class="badge gold">${property.transaction}</span>
        <h2 style="margin-top:14px;font-size:1.8rem">${formatMoney(property.price, property)}</h2>
        <p class="muted" style="margin:12px 0 20px">Managed by ${property.agent}. All inquiries are captured for admin review.</p>
        <button class="btn block" data-inquire="${property.id}">Request viewing</button>
        <a class="btn ghost block" style="margin-top:10px" href="properties.html">Back to listings</a>
        <div style="margin-top:22px;border-top:1px solid var(--border);padding-top:18px">
          <h3>Agent contact</h3>
          <p class="muted">${property.agentPhone}</p>
          <p class="small" style="margin-top:10px">For the prototype, inquiries are stored locally in the browser and displayed in the admin dashboard.</p>
        </div>
      </aside>
    </div>
  `;
  attachCardActions();
  const related = qs('#relatedProperties');
  if (related) {
    related.innerHTML = DATA.properties.filter(item => item.id !== property.id && item.city === property.city).slice(0, 3).map(propertyCard).join('') ||
      DATA.properties.filter(item => item.id !== property.id).slice(0, 3).map(propertyCard).join('');
    attachCardActions();
  }
}

function openInquiry(id) {
  const property = DATA.properties.find(item => item.id === id);
  const modal = qs('#inquiryModal');
  if (!modal || !property) return;
  qs('#inquiryPropertyId').value = property.id;
  qs('#inquiryTitle').textContent = `Request viewing: ${property.title}`;
  modal.classList.add('open');
}

function closeInquiry() {
  const modal = qs('#inquiryModal');
  if (modal) modal.classList.remove('open');
}

function initInquiryModal() {
  const modal = qs('#inquiryModal');
  if (!modal) return;
  qsa('[data-close-modal]').forEach(button => button.addEventListener('click', closeInquiry));
  modal.addEventListener('click', event => { if (event.target === modal) closeInquiry(); });
  const form = qs('#inquiryForm');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const property = DATA.properties.find(item => item.id === data.propertyId);
    const inquiry = {
      id: `INQ-${Date.now()}`,
      propertyId: data.propertyId,
      propertyTitle: property?.title || 'General inquiry',
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      createdAt: new Date().toISOString(),
      status: 'New'
    };
    const existing = JSON.parse(localStorage.getItem('homelink_inquiries') || '[]');
    existing.unshift(inquiry);
    localStorage.setItem('homelink_inquiries', JSON.stringify(existing));
    form.reset();
    closeInquiry();
    showToast('Inquiry submitted. View it in the admin dashboard.');
  });
}

function showToast(message) {
  const toast = qs('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3400);
}


function attachServiceLaunchers() {
  qsa('[data-open-service]').forEach(button => {
    button.addEventListener('click', () => openServiceJourney(Number(button.dataset.openService || 0)));
  });
  qsa('[data-open-supplier]').forEach(button => {
    button.addEventListener('click', () => openSupplierJourney(Number(button.dataset.supplierStep || 0)));
  });
}

function setWizardProgress(modalId, step) {
  const modal = qs(modalId);
  if (!modal) return;
  qsa('.wizard-progress span', modal).forEach((item, index) => {
    item.classList.toggle('active', index === step);
    item.classList.toggle('done', index < step);
  });
}

function openServiceJourney(serviceIndex = 0) {
  const modal = qs('#serviceJourneyModal');
  if (!modal) return;
  serviceFlow.step = 0;
  serviceFlow.serviceIndex = Math.max(0, Math.min(DATA.services.length - 1, serviceIndex));
  serviceFlow.data = { service: DATA.services[serviceFlow.serviceIndex].title };
  modal.classList.add('open');
  renderServiceJourney();
}

function closeServiceJourney() {
  const modal = qs('#serviceJourneyModal');
  if (modal) modal.classList.remove('open');
}

function serviceFormData() {
  const form = qs('#serviceJourneyForm');
  if (!form) return {};
  return Object.fromEntries(new FormData(form));
}

function renderServiceJourney() {
  const service = DATA.services[serviceFlow.serviceIndex];
  const title = qs('#serviceJourneyTitle');
  const body = qs('#serviceJourneyBody');
  const prev = qs('[data-service-prev]');
  const next = qs('[data-service-next]');
  if (!service || !body) return;
  if (title) title.textContent = service.title;
  setWizardProgress('#serviceJourneyModal', serviceFlow.step);
  prev.style.visibility = serviceFlow.step === 0 ? 'hidden' : 'visible';
  next.textContent = serviceFlow.step === 3 ? 'Submit request' : 'Continue';
  if (serviceFlow.step === 0) {
    body.innerHTML = `
      <div class="flow-summary">
        <h3>${service.title}</h3>
        <p class="muted">${service.description}</p>
        <div class="mini-steps">
          <span>1. Select service</span><span>2. Add client details</span><span>3. Review support scope</span><span>4. Reach payment-ready stage</span>
        </div>
        <p class="small">No payment will be collected. This prototype only demonstrates the journey until the payment stage.</p>
      </div>`;
  } else if (serviceFlow.step === 1) {
    body.innerHTML = `
      <form id="serviceJourneyForm" class="form-grid">
        <div class="field"><label>Client type</label><select name="clientType"><option>Individual / family</option><option>Corporate HR team</option><option>Agent support request</option><option>Developer / project team</option></select></div>
        <div class="field"><label>Service location</label><input name="location" required placeholder="e.g. Westlands, Nairobi" value="${escapeHTML(serviceFlow.data.location || '')}"></div>
        <div class="field"><label>Preferred service date</label><input name="date" type="date" value="${escapeHTML(serviceFlow.data.date || '')}"></div>
        <div class="field"><label>Service notes</label><textarea name="notes" rows="4" placeholder="Tell us what the client needs">${escapeHTML(serviceFlow.data.notes || '')}</textarea></div>
      </form>`;
  } else if (serviceFlow.step === 2) {
    body.innerHTML = `
      <div class="flow-summary">
        <h3>Review request</h3>
        <div class="review-list">
          <p><strong>Service:</strong> ${escapeHTML(serviceFlow.data.service)}</p>
          <p><strong>Client type:</strong> ${escapeHTML(serviceFlow.data.clientType || 'Individual / family')}</p>
          <p><strong>Location:</strong> ${escapeHTML(serviceFlow.data.location || 'Not specified')}</p>
          <p><strong>Preferred date:</strong> ${escapeHTML(serviceFlow.data.date || 'Flexible')}</p>
          <p><strong>Notes:</strong> ${escapeHTML(serviceFlow.data.notes || 'No extra notes')}</p>
        </div>
        <p class="small">In production, HomelinkGlobal can assign this request to an internal relocation coordinator or an approved service provider.</p>
      </div>`;
  } else {
    body.innerHTML = `
      <div class="payment-placeholder">
        <h3>Payment-ready stage only</h3>
        <p class="muted">The customer has reached the point where payment or deposit options can appear, but this prototype intentionally stops here.</p>
        <div class="payment-options">
          <span>M-Pesa future</span><span>Paystack future</span><span>Stripe future</span><span>Invoice / pay later</span>
        </div>
        <p class="small">For evaluation, clicking Submit request records the service request in the admin concept dashboard. No payment is processed.</p>
      </div>`;
  }
}

function initServiceJourneyModal() {
  attachServiceLaunchers();
  const modal = qs('#serviceJourneyModal');
  if (!modal) return;
  qsa('[data-close-service-modal]').forEach(button => button.addEventListener('click', closeServiceJourney));
  modal.addEventListener('click', event => { if (event.target === modal) closeServiceJourney(); });
  qs('[data-service-prev]').addEventListener('click', () => {
    if (serviceFlow.step > 0) serviceFlow.step -= 1;
    renderServiceJourney();
  });
  qs('[data-service-next]').addEventListener('click', () => {
    if (serviceFlow.step === 1) serviceFlow.data = { ...serviceFlow.data, ...serviceFormData() };
    if (serviceFlow.step < 3) {
      serviceFlow.step += 1;
      renderServiceJourney();
      return;
    }
    const requests = JSON.parse(localStorage.getItem('homelink_service_requests') || '[]');
    requests.unshift({
      id: `SRV-${Date.now()}`,
      service: serviceFlow.data.service,
      location: serviceFlow.data.location || 'Not specified',
      clientType: serviceFlow.data.clientType || 'Individual / family',
      notes: serviceFlow.data.notes || '',
      status: 'Payment pending / prototype',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('homelink_service_requests', JSON.stringify(requests));
    closeServiceJourney();
    showToast('Service request captured. Payment step shown but not processed.');
  });
}

function openSupplierJourney(step = 0) {
  const modal = qs('#supplierJourneyModal');
  if (!modal) return;
  supplierFlow.step = Math.max(0, Math.min(3, step));
  supplierFlow.data = { supplierType: supplierFlow.data.supplierType || 'Owner' };
  modal.classList.add('open');
  renderSupplierJourney();
}

function closeSupplierJourney() {
  const modal = qs('#supplierJourneyModal');
  if (modal) modal.classList.remove('open');
}

function supplierFormData() {
  const form = qs('#supplierJourneyForm');
  if (!form) return {};
  return Object.fromEntries(new FormData(form));
}

function renderSupplierJourney() {
  const body = qs('#supplierJourneyBody');
  const prev = qs('[data-supplier-prev]');
  const next = qs('[data-supplier-next]');
  if (!body) return;
  setWizardProgress('#supplierJourneyModal', supplierFlow.step);
  prev.style.visibility = supplierFlow.step === 0 ? 'hidden' : 'visible';
  next.textContent = supplierFlow.step === 3 ? 'Submit for review' : 'Continue';
  if (supplierFlow.step === 0) {
    body.innerHTML = `
      <form id="supplierJourneyForm" class="form-grid">
        <p class="muted">Choose the type of supplier joining HomelinkGlobal.</p>
        <div class="choice-grid">
          ${['Owner','Agent','Developer','Service Provider'].map(type => `
            <label class="choice-card"><input type="radio" name="supplierType" value="${type}" ${supplierFlow.data.supplierType === type ? 'checked' : ''}><span>${type}</span></label>
          `).join('')}
        </div>
      </form>`;
  } else if (supplierFlow.step === 1) {
    body.innerHTML = `
      <form id="supplierJourneyForm" class="form-grid">
        <div class="field"><label>Listing / service title</label><input name="title" required placeholder="e.g. Kilimani furnished apartment" value="${escapeHTML(supplierFlow.data.title || '')}"></div>
        <div class="field"><label>Location</label><input name="location" required placeholder="e.g. Kilimani, Nairobi" value="${escapeHTML(supplierFlow.data.location || '')}"></div>
        <div class="field"><label>Price or service estimate</label><input name="price" placeholder="e.g. KES 120,000 per month" value="${escapeHTML(supplierFlow.data.price || '')}"></div>
        <div class="field"><label>Short description</label><textarea name="description" rows="4" placeholder="Describe property, units, or service coverage">${escapeHTML(supplierFlow.data.description || '')}</textarea></div>
      </form>`;
  } else if (supplierFlow.step === 2) {
    body.innerHTML = `
      <div class="flow-summary">
        <h3>Verification checklist</h3>
        <div class="checklist-grid">
          <span>✓ Ownership or agent authority</span><span>✓ Quality property photos/media</span><span>✓ Correct location and map pin</span><span>✓ Amenities, price, availability</span><span>✓ Supplier contact verification</span><span>✓ Admin approval before publishing</span>
        </div>
        <p class="small">This step shows the operational control HomelinkGlobal needs before publishing listings publicly.</p>
      </div>`;
  } else {
    body.innerHTML = `
      <div class="payment-placeholder">
        <h3>Supplier payment-ready stage</h3>
        <p class="muted">After verification, HomelinkGlobal can later activate listing fees, featured-listing fees, commissions, subscriptions, or invoice-based plans.</p>
        <div class="review-list">
          <p><strong>Supplier type:</strong> ${escapeHTML(supplierFlow.data.supplierType || 'Owner')}</p>
          <p><strong>Title:</strong> ${escapeHTML(supplierFlow.data.title || 'Not added')}</p>
          <p><strong>Location:</strong> ${escapeHTML(supplierFlow.data.location || 'Not added')}</p>
          <p><strong>Price/estimate:</strong> ${escapeHTML(supplierFlow.data.price || 'Not added')}</p>
        </div>
        <div class="payment-options"><span>Listing fee future</span><span>Subscription future</span><span>Commission future</span><span>Invoice / approval first</span></div>
        <p class="small">No payment is collected in this prototype. Submit for review records the supplier request for the admin concept.</p>
      </div>`;
  }
}

function initSupplierJourneyModal() {
  attachServiceLaunchers();
  const modal = qs('#supplierJourneyModal');
  if (!modal) return;
  qsa('[data-close-supplier-modal]').forEach(button => button.addEventListener('click', closeSupplierJourney));
  modal.addEventListener('click', event => { if (event.target === modal) closeSupplierJourney(); });
  qs('[data-supplier-prev]').addEventListener('click', () => {
    if (supplierFlow.step > 0) supplierFlow.step -= 1;
    renderSupplierJourney();
  });
  qs('[data-supplier-next]').addEventListener('click', () => {
    if (supplierFlow.step === 0 || supplierFlow.step === 1) supplierFlow.data = { ...supplierFlow.data, ...supplierFormData() };
    if (supplierFlow.step < 3) {
      supplierFlow.step += 1;
      renderSupplierJourney();
      return;
    }
    const requests = JSON.parse(localStorage.getItem('homelink_supplier_requests') || '[]');
    requests.unshift({
      id: `SUP-${Date.now()}`,
      supplierType: supplierFlow.data.supplierType || 'Owner',
      title: supplierFlow.data.title || 'Supplier listing request',
      location: supplierFlow.data.location || 'Not specified',
      price: supplierFlow.data.price || 'Not specified',
      status: 'Submitted for verification',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('homelink_supplier_requests', JSON.stringify(requests));
    closeSupplierJourney();
    showToast('Supplier request submitted for admin verification.');
  });
}

function renderCurrentPage() {
  renderHome();
  renderProperties();
  renderPropertyDetail();
}

function init() {
  initSharedUI();
  buildLocationOptions();
  initHomeSearch();
  initFilters();
  initInquiryModal();
  initServiceJourneyModal();
  initSupplierJourneyModal();
  renderCurrentPage();
}

document.addEventListener('DOMContentLoaded', init);
