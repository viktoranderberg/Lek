// ── Supabase & state ──────────────────────────────────────────────────────────
let supabaseClient;
let adminSession = null;
let CONFIG       = {};

let USERS        = [];
let bookings     = [];
let currentView  = 'calendar';
let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let editingId    = null;
let pendingMil   = null;

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_ORIGIN = 'Stjärntorget 1, Solna';
const MONTH_NAMES    = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];

// ── Mappar Supabase-rad → bokningsobjekt ──────────────────────────────────────
function mapRow(row) {
  return {
    id:        row.id,
    user:      row.user_name,
    start:     row.start_date,
    end:       row.end_date,
    startTime: row.start_time,
    endTime:   row.end_time,
    notes:     row.notes || '',
    dest:      row.dest  || ''
  };
}

// ── Hjälpfunktioner ───────────────────────────────────────────────────────────
function uid()     { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function pad(n)    { return String(n).padStart(2,'0'); }
function toDateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function parseDStr(s) { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function fmtSv(s) {
  if (!s) return '';
  const d = parseDStr(s);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
}
function today() { return toDateStr(new Date()); }
function overlaps(s1,e1,s2,e2) { return s1 <= e2 && e1 >= s2; }

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function showToast(msg, type = 'info', duration = 4000, undoCallback = null) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const msgEl = document.createElement('span');
  msgEl.className = 'toast-msg'; msgEl.textContent = msg;
  toast.appendChild(msgEl);
  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return; dismissed = true;
    toast.style.opacity = '0'; toast.style.transition = 'opacity .2s';
    setTimeout(() => toast.remove(), 220);
  };
  if (undoCallback) {
    const btn = document.createElement('button');
    btn.className = 'toast-undo'; btn.textContent = 'Ångra';
    btn.onclick = () => { undoCallback(); dismiss(); };
    toast.appendChild(btn);
  }
  container.appendChild(toast);
  setTimeout(dismiss, duration);
}

function bookingsOnDate(dateStr, filter) {
  return bookings.filter(b =>
    b.start <= dateStr && b.end >= dateStr && (!filter || b.user === filter)
  );
}

// ── User dropdowns ────────────────────────────────────────────────────────────
function refreshUserDropdowns() {
  ['filterUser','fUser'].forEach(id => {
    const sel = document.getElementById(id);
    const cur = sel.value;
    sel.innerHTML = id === 'filterUser'
      ? '<option value="">Alla användare</option>'
      : '';
    USERS.forEach(u => {
      const o = document.createElement('option');
      o.value = u; o.textContent = u;
      sel.appendChild(o);
    });
    if (cur) sel.value = cur;
  });
}

// ── Supabase data-funktioner ──────────────────────────────────────────────────
async function reloadBookings() {
  const { data, error } = await supabaseClient.from('bookings').select('*');
  if (error) { console.error('Fel vid laddning av bokningar:', error); return; }
  bookings = (data || []).map(mapRow);
  render();
}

async function reloadUsers() {
  const { data, error } = await supabaseClient.from('users').select('name').order('id');
  if (error) { console.error('Fel vid laddning av användare:', error); return; }
  USERS = (data || []).map(r => r.name);
}

// ── Init ──────────────────────────────────────────────────────────────────────
(async function init() {
  document.getElementById('headerSub').textContent = 'Bil: Tjänstebil  |  Bokningssystem';

  // Hämta konfiguration från Express-backend
  try {
    const cfg = await fetch('/api/config').then(r => r.json());
    CONFIG = cfg;
    supabaseClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  } catch (e) {
    showToast('Kunde inte ladda konfigurationen.', 'danger', 8000);
    return;
  }

  // Kontrollera befintlig admin-session
  const { data: { session } } = await supabaseClient.auth.getSession();
  adminSession = session;
  if (session) renderAdminPanel();

  // Lyssna på auth-ändringar
  supabaseClient.auth.onAuthStateChange((event, session) => {
    adminSession = session;
    if (event === 'SIGNED_IN') {
      document.getElementById('adminOverlay').classList.add('hidden');
      renderAdminPanel();
      showToast('Inloggad som admin.', 'success');
    }
    if (event === 'SIGNED_OUT') {
      document.getElementById('adminPanelContainer').style.display = 'none';
    }
  });

  // Ladda användare och bokningar
  await reloadUsers();
  refreshUserDropdowns();
  await reloadBookings();

  // Realtidslyssnare för bokningar
  supabaseClient.channel('bookings-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, async () => {
      await reloadBookings();
    })
    .subscribe();

  // Realtidslyssnare för användare
  supabaseClient.channel('users-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
      await reloadUsers();
      refreshUserDropdowns();
      if (isAdmin()) renderAdminPanel();
      renderSummary();
    })
    .subscribe();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!document.getElementById('overlay').classList.contains('hidden')) closeModal();
      document.getElementById('adminOverlay').classList.add('hidden');
    }
  });
})();

// ── View switching ────────────────────────────────────────────────────────────
function setView(v) {
  currentView = v;
  document.getElementById('calView').style.display  = v === 'calendar' ? '' : 'none';
  document.getElementById('listView').style.display = v === 'list'     ? '' : 'none';
  document.getElementById('btnCalendar').classList.toggle('active', v === 'calendar');
  document.getElementById('btnList').classList.toggle('active', v === 'list');
  render();
}

function render() {
  renderSummary();
  if (currentView === 'calendar') renderCalendar();
  else renderList();
}

// ── Summary ───────────────────────────────────────────────────────────────────
function renderSummary() {
  const t      = today();
  const active = bookings.filter(b => b.start <= t && b.end >= t).length;

  document.getElementById('summary').innerHTML = `
    <div class="summary-item"><div class="val">${bookings.length}</div><div class="lbl">Bokningar totalt</div></div>
    <div class="summary-item"><div class="val">${active}</div><div class="lbl">Aktiva idag</div></div>
    <div class="summary-item"><div class="val">${USERS.length}</div><div class="lbl">Användare</div></div>
  `;
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth <  0) { currentMonth = 11; currentYear--; }
  renderCalendar();
}

function changeYear(delta) { currentYear += delta; renderCalendar(); }

function goToday() {
  const now = new Date();
  currentYear = now.getFullYear(); currentMonth = now.getMonth();
  renderCalendar();
}

function exportCsv() {
  const filter = document.getElementById('filterUser').value;
  const rows = (filter ? bookings.filter(b => b.user === filter) : bookings)
    .sort((a,b) => a.start.localeCompare(b.start));
  const header = ['Användare','Startdatum','Starttid','Slutdatum','Sluttid','Destination','Anteckningar'];
  const esc = v => `"${String(v||'').replace(/"/g,'""')}"`;
  const csv = [header.join(','),
    ...rows.map(b => [b.user,b.start,b.startTime,b.end,b.endTime,b.dest,b.notes].map(esc).join(','))
  ].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `bokningar${filter ? '-'+filter : ''}.csv`;
  a.click();
}

function renderCalendar() {
  const filter = document.getElementById('filterUser').value;
  document.getElementById('calTitle').textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
  const grid  = document.getElementById('calGrid');
  grid.innerHTML = '';

  ['Mån','Tis','Ons','Tor','Fre','Lör','Sön'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-name'; el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay  = new Date(currentYear, currentMonth, 1);
  const startPad  = (firstDay.getDay() + 6) % 7;
  const daysInMon = new Date(currentYear, currentMonth + 1, 0).getDate();
  const tod       = today();

  for (let i = 0; i < startPad; i++) {
    const el = document.createElement('div');
    el.className = 'cal-cell empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMon; d++) {
    const ds    = `${currentYear}-${pad(currentMonth+1)}-${pad(d)}`;
    const bList = bookingsOnDate(ds, filter);
    const cell  = document.createElement('div');
    const isPast= ds < tod;

    cell.className = 'cal-cell' + (ds === tod ? ' today' : '') + (isPast ? ' past' : '');
    cell.innerHTML  = `<div class="day-num">${d}</div>`;

    bList.forEach(b => {
      const chip = document.createElement('div');
      chip.className = 'booking-chip' + (bList.length > 1 ? ' multi' : '');
      chip.textContent = b.user.split(' ').map(w=>w[0]).join('') + (b.dest ? ' \uD83D\uDCCD' : '');
      chip.title = b.user + (b.dest ? ` \u2014 ${b.dest}` : '');
      chip.onclick = e => { e.stopPropagation(); openEdit(b.id); };
      cell.appendChild(chip);
    });

    if (!isPast) cell.onclick = () => openNewBookingDate(ds);
    grid.appendChild(cell);
  }
}

// ── List view ─────────────────────────────────────────────────────────────────
function renderList() {
  const filter = document.getElementById('filterUser').value;
  const q      = (document.getElementById('searchInput')?.value || '').toLowerCase();
  let list = [...bookings]
    .filter(b => !filter || b.user === filter)
    .sort((a,b) => a.start.localeCompare(b.start));
  if (q) {
    list = list.filter(b =>
      (b.dest  || '').toLowerCase().includes(q) ||
      (b.notes || '').toLowerCase().includes(q) ||
      (b.user  || '').toLowerCase().includes(q)
    );
  }
  const el = document.getElementById('bookingList');

  if (!list.length) {
    el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem 0">Inga bokningar hittades.</p>';
    return;
  }

  el.innerHTML = list.map(b => {
    const destTag = b.dest
      ? `<span class="tag tag-purple">\uD83D\uDCCD ${escHtml(b.dest)}</span>`
      : '';
    return `
      <div class="booking-card">
        <div class="meta">
          <strong>${escHtml(b.user)}</strong>
          <span class="sub">
            <span class="tag tag-blue">${fmtSv(b.start)} ${escHtml(b.startTime||'')} &rarr; ${fmtSv(b.end)} ${escHtml(b.endTime||'')}</span>
            ${destTag}
          </span>
          ${b.notes ? `<div class="note-text">\uD83D\uDCDD ${escHtml(b.notes)}</div>` : ''}
        </div>
        <div>
          <button class="btn btn-sm" style="border:1px solid var(--border)" onclick="openEdit('${escHtml(b.id)}')">Redigera</button>
        </div>
      </div>`;
  }).join('');
}

// ── Modal open/close ──────────────────────────────────────────────────────────
function showOverlay() { document.getElementById('overlay').classList.remove('hidden'); }
function closeModal()  { document.getElementById('overlay').classList.add('hidden'); }
function handleOverlayClick(e) { if (e.target === document.getElementById('overlay')) closeModal(); }

function resetForm() {
  document.getElementById('fUser').selectedIndex    = 0;
  document.getElementById('fStart').value           = '';
  document.getElementById('fEnd').value             = '';
  document.getElementById('fStartTime').value       = '08:00';
  document.getElementById('fEndTime').value         = '17:00';
  document.getElementById('fNotes').value           = '';
  document.getElementById('fDest').value            = '';
  document.getElementById('fOrigin').value          = '';
  document.getElementById('altOrigin').checked      = false;
  document.getElementById('fRoundTrip').checked     = true;
  document.getElementById('originField').style.display = 'none';
  document.getElementById('dateError').style.display   = 'none';
  clearRouteResult();
  pendingMil = null;
}

function openNewBooking() {
  editingId = null;
  document.getElementById('modalTitle').textContent     = 'Ny bokning';
  document.getElementById('btnDelete').style.display    = 'none';
  resetForm();
  document.getElementById('fStart').value = today();
  document.getElementById('fEnd').value   = today();
  showOverlay();
}

function openNewBookingDate(dateStr) {
  openNewBooking();
  document.getElementById('fStart').value = dateStr;
  document.getElementById('fEnd').value   = dateStr;
}

function openEdit(id) {
  const b = bookings.find(x => x.id === id);
  if (!b) return;
  editingId = id;
  resetForm();
  document.getElementById('modalTitle').textContent  = 'Redigera bokning';
  document.getElementById('btnDelete').style.display = '';
  document.getElementById('fUser').value             = b.user;
  document.getElementById('fStart').value            = b.start;
  document.getElementById('fEnd').value              = b.end;
  document.getElementById('fStartTime').value        = b.startTime || '08:00';
  document.getElementById('fEndTime').value          = b.endTime   || '17:00';
  document.getElementById('fNotes').value            = b.notes     || '';
  document.getElementById('fDest').value             = b.dest      || '';
  showOverlay();
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateDates() {
  const s   = document.getElementById('fStart').value;
  const e   = document.getElementById('fEnd').value;
  const err = document.getElementById('dateError');
  if (s && e && e < s) { err.style.display = ''; return false; }
  err.style.display = 'none';
  return true;
}

// ── Save / delete ─────────────────────────────────────────────────────────────
async function saveBooking() {
  if (!validateDates()) return;

  const start = document.getElementById('fStart').value;
  const end   = document.getElementById('fEnd').value;
  if (!start || !end) { showToast('Ange start- och slutdatum.', 'danger', 4000); return; }

  const startTime = document.getElementById('fStartTime').value;
  const endTime   = document.getElementById('fEndTime').value;
  if (start === end && startTime && endTime && endTime <= startTime) {
    showToast('Sluttiden måste vara efter starttiden när bokningen sker samma dag.', 'danger', 4000);
    return;
  }

  const newStart = `${start} ${startTime || '00:00'}`;
  const newEnd   = `${end} ${endTime || '23:59'}`;
  const conflict = bookings.find(b => {
    if (b.id === editingId) return false;
    const bStart = `${b.start} ${b.startTime || '00:00'}`;
    const bEnd   = `${b.end} ${b.endTime || '23:59'}`;
    return bStart <= newEnd && bEnd >= newStart;
  });
  if (conflict) {
    showToast(`Konflikt! ${escHtml(conflict.user)} har bokat bilen ${conflict.start} \u2013 ${conflict.end}.`, 'danger', 5000);
    return;
  }

  const row = {
    id:         editingId || uid(),
    user_name:  document.getElementById('fUser').value,
    start_date: start,
    end_date:   end,
    start_time: startTime,
    end_time:   endTime,
    notes:      document.getElementById('fNotes').value.trim(),
    dest:       document.getElementById('fDest').value.trim()
  };

  const saveBtn = document.getElementById('overlay').querySelector('.btn-primary:last-child');
  saveBtn.disabled = true;
  let error;
  try {
    if (editingId) {
      ({ error } = await supabaseClient.from('bookings').update(row).eq('id', editingId));
    } else {
      ({ error } = await supabaseClient.from('bookings').insert(row));
    }
  } finally {
    saveBtn.disabled = false;
  }

  if (error) { showToast('Fel vid sparande: ' + error.message, 'danger'); return; }
  closeModal();
  // realtidskanal triggar reloadBookings() automatiskt
}

async function deleteBooking() {
  if (!editingId) return;
  const removed = bookings.find(b => b.id === editingId);
  if (!removed) return;

  const deleteBtn = document.getElementById('btnDelete');
  deleteBtn.disabled = true;
  const { error } = await supabaseClient.from('bookings').delete().eq('id', editingId);
  if (error) { deleteBtn.disabled = false; showToast('Fel vid borttagning: ' + error.message, 'danger'); return; }

  closeModal();
  showToast(`Bokning för ${escHtml(removed.user)} borttagen.`, 'danger', 5000, async () => {
    // Ångra: återskapa bokningen
    await supabaseClient.from('bookings').insert({
      id:         removed.id,
      user_name:  removed.user,
      start_date: removed.start,
      end_date:   removed.end,
      start_time: removed.startTime,
      end_time:   removed.endTime,
      notes:      removed.notes,
      dest:       removed.dest
    });
    showToast('Bokning återställd.', 'success', 3000);
  });
  // realtidskanal triggar reloadBookings()
}

// ── Address / route ───────────────────────────────────────────────────────────
function toggleAltOrigin() {
  const checked = document.getElementById('altOrigin').checked;
  document.getElementById('originField').style.display = checked ? '' : 'none';
  clearRouteResult();
}

function clearRouteResult() {
  document.getElementById('calcResult').classList.remove('visible');
  document.getElementById('addrStatus').textContent = '';
  document.getElementById('addrStatus').className   = 'addr-status';
  pendingMil = null;
}

function setStatus(msg, isError) {
  const el = document.getElementById('addrStatus');
  el.textContent = msg;
  el.className   = 'addr-status' + (isError ? ' error' : '');
}

async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=se`;
  const res  = await fetch(url, { headers: { 'Accept-Language': 'sv' } });
  const data = await res.json();
  if (!data.length) throw new Error(`Hittade inte: "${address}"`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

async function routeDistance(fromLat, fromLon, toLat, toLon) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;
  const res  = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok') throw new Error('Kunde inte beräkna rutt.');
  return data.routes[0].distance;
}

async function calcRoute() {
  const dest = document.getElementById('fDest').value.trim();
  if (!dest) { setStatus('Ange en destination.', true); return; }

  const useAlt = document.getElementById('altOrigin').checked;
  const origin = useAlt
    ? document.getElementById('fOrigin').value.trim()
    : DEFAULT_ORIGIN;

  if (!origin) { setStatus('Ange utgångspunkt.', true); return; }

  const btn = document.getElementById('btnCalcRoute');
  btn.disabled = true; btn.textContent = 'Beräknar\u2026';
  setStatus('Söker adresser\u2026');
  clearRouteResult();

  try {
    const [from, to] = await Promise.all([geocode(origin), geocode(dest)]);
    setStatus('Beräknar körväg\u2026');
    const meters    = await routeDistance(from.lat, from.lon, to.lat, to.lon);
    const roundTrip = document.getElementById('fRoundTrip').checked;
    const km        = meters / 1000 * (roundTrip ? 2 : 1);
    const mil       = km / 10;
    pendingMil      = mil;

    document.getElementById('calcResultText').innerHTML =
      `<strong>${mil.toFixed(1)} mil</strong> (${km.toFixed(1)} km${roundTrip ? ', tur &amp; retur' : ''}) &nbsp; ${origin} &rarr; ${dest}`;
    document.getElementById('calcResult').classList.add('visible');
    setStatus('');
  } catch (e) {
    setStatus(e.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Beräkna avstånd';
  }
}

function applyMil() {
  if (pendingMil == null) return;
  const notesEl = document.getElementById('fNotes');
  const line     = `Körsträcka: ${pendingMil.toFixed(1)} mil (${(pendingMil*10).toFixed(1)} km)`;
  if (!notesEl.value.includes(line)) {
    notesEl.value = (notesEl.value ? notesEl.value + '\n' : '') + line;
  }
}

// ── Admin auth (Supabase Auth) ────────────────────────────────────────────────
function isAdmin() { return !!adminSession; }

function openAdminPanel() {
  if (isAdmin()) {
    renderAdminPanel();
  } else {
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminLoginError').style.display = 'none';
    document.getElementById('adminOverlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('adminPassword').focus(), 50);
  }
}

async function adminLogin() {
  const pw  = document.getElementById('adminPassword').value;
  const err = document.getElementById('adminLoginError');
  err.style.display = 'none';

  const { error } = await supabaseClient.auth.signInWithPassword({
    email:    CONFIG.adminEmail,
    password: pw
  });

  if (error) { err.style.display = ''; return; }
  // onAuthStateChange hanterar panel + toast automatiskt
}

async function adminLogout() {
  await supabaseClient.auth.signOut();
  showToast('Utloggad.', 'info');
  // onAuthStateChange döljer panelen
}

// ── Användarhantering (direkt mot Supabase med RLS) ───────────────────────────
async function adminAddUser() {
  const input = document.getElementById('adminNewUser');
  const name  = input.value.trim();
  if (!name) return;

  const { error } = await supabaseClient.from('users').insert({ name });
  if (error) {
    showToast(error.code === '23505' ? 'Användaren finns redan.' : error.message, 'danger');
    return;
  }
  input.value = '';
  showToast(`${name} tillagd.`, 'success');
  // realtidskanal uppdaterar USERS + dropdowns + panel
}

async function adminRemoveUser(name) {
  const { error } = await supabaseClient.from('users').delete().eq('name', name);
  if (error) { showToast(error.message, 'danger'); return; }
  showToast(`${name} borttagen.`, 'danger');
  // realtidskanal uppdaterar USERS + dropdowns + panel
}

function renderAdminPanel() {
  const panel = document.getElementById('adminPanelContainer');
  panel.style.display = '';
  panel.innerHTML = `
    <div class="admin-panel">
      <div class="admin-panel-header">
        <h4>Användarhantering</h4>
        <button class="btn btn-sm" style="border:1px solid var(--border)" onclick="adminLogout()">Logga ut</button>
      </div>
      ${USERS.map(u => `
        <div class="admin-user-row">
          <span>${escHtml(u)}</span>
          <button class="btn btn-sm btn-danger" onclick="adminRemoveUser('${escHtml(u)}')">Ta bort</button>
        </div>`).join('')}
      <div class="admin-add-row">
        <input id="adminNewUser" type="text" placeholder="Nytt användarnamn"
               onkeydown="if(event.key==='Enter')adminAddUser()" />
        <button class="btn btn-primary btn-sm" onclick="adminAddUser()">Lägg till</button>
      </div>
    </div>`;
}
