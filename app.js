'use strict';
const KEY = 'buildwise-v1';
const seed = () => ({
  version: 1,
  sample: true,
  site: { name: 'Riverside community centre', location: 'Pune, Maharashtra' },
  materials: [
    {
      id: 'm1',
      name: 'Cement',
      unit: 'bags',
      received: 240,
      used: 174,
      wasted: 6,
      rate: 390,
      min: 40,
    },
    {
      id: 'm2',
      name: 'Clay bricks',
      unit: 'pieces',
      received: 8000,
      used: 6100,
      wasted: 220,
      rate: 9,
      min: 2000,
    },
    {
      id: 'm3',
      name: 'Steel reinforcement',
      unit: 'kg',
      received: 1800,
      used: 1250,
      wasted: 35,
      rate: 62,
      min: 300,
    },
    {
      id: 'm4',
      name: 'Sand',
      unit: 'm³',
      received: 32,
      used: 20,
      wasted: 1.5,
      rate: 1800,
      min: 8,
    },
  ],
  waste: [
    {
      id: 'w1',
      date: '2026-10-13',
      material: 'Clay bricks',
      kg: 220,
      route: 'Reuse',
      cause: 'Breakage during handling',
      note: 'Set aside for a supervised reuse assessment.',
    },
    {
      id: 'w2',
      date: '2026-10-14',
      material: 'Steel reinforcement',
      kg: 35,
      route: 'Recycle',
      cause: 'Cutting offcuts',
      note: 'Segregated for a collection enquiry.',
    },
    {
      id: 'w3',
      date: '2026-10-14',
      material: 'Concrete',
      kg: 180,
      route: 'Recycle',
      cause: 'Excess batch',
      note: 'Recycling feasibility to be checked.',
    },
    {
      id: 'w4',
      date: '2026-10-15',
      material: 'Mixed debris',
      kg: 65,
      route: 'Disposal',
      cause: 'Contamination',
      note: 'Awaiting an appropriate disposal arrangement.',
    },
  ],
  listings: [
    {
      id: 'l1',
      name: 'Surplus clay bricks',
      quantity: '120 pieces',
      purpose: 'Potential garden edging after a condition check.',
      contact: 'Site coordinator — details to be added',
      status: 'Available',
    },
    {
      id: 'l2',
      name: 'Timber offcuts',
      quantity: '15 pieces',
      purpose:
        'Potential craft materials after checking for nails, coatings and damage.',
      contact: 'Site coordinator — details to be added',
      status: 'Available',
    },
  ],
  checks: [false, false, false, false, false, false],
});
const $ = selector => document.querySelector(selector);
const esc = value =>
  String(value ?? '').replace(
    /[&<>"']/g,
    c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]
  );
const n = value =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
const money = value => '₹' + n(value);
const uid = () => crypto.randomUUID();
const available = m => m.received - m.used - m.wasted;
let state = seed();
let persistent = true;
function validData(x) {
  const str = (v, k) => typeof v[k] === 'string' && v[k].length < 2000;
  const ids = rows => new Set(rows.map(r => r.id)).size === rows.length;
  return (
    x?.version === 1 &&
    typeof x.sample === 'boolean' &&
    x.site &&
    str(x.site, 'name') &&
    str(x.site, 'location') &&
    Array.isArray(x.materials) &&
    Array.isArray(x.waste) &&
    Array.isArray(x.listings) &&
    Array.isArray(x.checks) &&
    x.checks.length === 6 &&
    x.checks.every(v => typeof v === 'boolean') &&
    ids(x.materials) &&
    ids(x.waste) &&
    ids(x.listings) &&
    x.materials.every(
      m =>
        ['id', 'name', 'unit'].every(k => str(m, k)) &&
        ['received', 'used', 'wasted', 'rate', 'min'].every(
          k => typeof m[k] === 'number' && Number.isFinite(m[k]) && m[k] >= 0
        ) &&
        m.used + m.wasted <= m.received
    ) &&
    x.waste.every(
      w =>
        ['id', 'date', 'material', 'cause', 'note'].every(k => str(w, k)) &&
        /^\d{4}-\d{2}-\d{2}$/.test(w.date) &&
        typeof w.kg === 'number' &&
        Number.isFinite(w.kg) &&
        w.kg > 0 &&
        ['Reuse', 'Recycle', 'Disposal'].includes(w.route)
    ) &&
    x.listings.every(
      l =>
        ['id', 'name', 'quantity', 'purpose', 'contact'].every(k =>
          str(l, k)
        ) && ['Available', 'Handed over'].includes(l.status)
    )
  );
}
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    if (!validData(saved)) throw Error('Invalid saved data');
    state = saved;
  }
} catch {
  persistent = false;
}
function summary() {
  const total = state.waste.reduce((s, w) => s + w.kg, 0);
  const reuse = state.waste
    .filter(w => w.route === 'Reuse')
    .reduce((s, w) => s + w.kg, 0);
  const recycle = state.waste
    .filter(w => w.route === 'Recycle')
    .reduce((s, w) => s + w.kg, 0);
  return {
    total,
    reuse,
    recycle,
    disposal: total - reuse - recycle,
    rate: total ? ((reuse + recycle) / total) * 100 : 0,
    loss: state.materials.reduce((s, m) => s + m.wasted * m.rate, 0),
    low: state.materials.filter(m => available(m) <= m.min).length,
  };
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    persistent = true;
  } catch {
    persistent = false;
  }
  $('#storage-warning').hidden = persistent;
  return persistent;
}
let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500);
}
const pages = {
  overview: [
    'Site overview',
    'A clearer picture of your materials, waste, and impact.',
  ],
  materials: [
    'Material inventory',
    'Track what arrives, what is used, and what remains.',
  ],
  waste: [
    'Waste management',
    'Record waste by weight. Find opportunities to recover it.',
  ],
  community: [
    'Community impact',
    'Turn site observations into practical community action.',
  ],
  project: [
    'About the project',
    'A simple tool for more responsible construction.',
  ],
};
const currentView = () =>
  Object.hasOwn(pages, location.hash.slice(1))
    ? location.hash.slice(1)
    : 'overview';
function render() {
  const view = currentView();
  $('#page-title').textContent = pages[view][0];
  $('#page-subtitle').textContent = pages[view][1];
  $('#breadcrumb').textContent =
    view === 'overview' ? 'Overview' : pages[view][0];
  $('#site-label').textContent = state.site.name;
  $('#site-location').textContent = state.site.location;
  $('#mode-label').textContent = state.sample
    ? '● Sample project'
    : '● Your project';
  $('#storage-warning').hidden = persistent;
  document
    .querySelectorAll('[data-view]')
    .forEach(a => a.classList.toggle('active', a.dataset.view === view));
  $('#view').innerHTML = { overview, materials, waste, community, project }[
    view
  ]();
}
function stat(label, value, unit, foot, icon) {
  return (
    '<article class="stat"><div class="stat-top">' +
    label +
    '<span class="stat-icon">' +
    icon +
    '</span></div><div class="stat-value">' +
    value +
    ' <small>' +
    unit +
    '</small></div><div class="stat-foot">' +
    foot +
    '</div></article>'
  );
}
function stats() {
  const s = summary();
  return (
    '<div class="stats">' +
    stat(
      'Materials tracked',
      n(state.materials.length),
      'types',
      s.low + ' low-stock materials',
      '▤'
    ) +
    stat(
      'Waste recorded',
      n(s.total),
      'kg',
      'From separate waste log entries',
      '♲'
    ) +
    stat(
      'Recovery share',
      n(s.rate) + '%',
      '',
      n(s.reuse + s.recycle) + ' kg for reuse / recycling',
      '↗'
    ) +
    stat(
      'Estimated material loss',
      money(s.loss),
      '',
      'Wasted quantity × unit cost',
      '₹'
    ) +
    '</div>'
  );
}
const art =
  '<svg class="hero-art" viewBox="0 0 400 270" role="img" aria-label="Construction site illustration with tower crane and building">' +
  '<circle cx="235" cy="163" r="133" fill="#214e3e"/><circle cx="235" cy="163" r="106" fill="#275642"/>' +
  '<path d="M16 255L185 163 386 251 217 320Z" fill="#32634b"/><path d="M84 209l84-45 110 48-82 48z" fill="#d4c7a3"/>' +
  '<path d="M84 209v17l112 49v-15z" fill="#acaa8b"/><path d="M196 260l82-48v17l-82 46" fill="#91a08b"/>' +
  '<path d="M119 205v-89l67-37 78 33v91l-69 39z" fill="#a6b399"/><path d="M119 116l76 33 69-37-78-33z" fill="#d4d6b6"/>' +
  '<path d="M195 149v93l69-39v-91z" fill="#7e9780"/><path d="M128 128l56 25v20l-56-24zm0 39l56 24v22l-56-25z" fill="#315c48"/>' +
  '<path d="M204 155l50-27v21l-50 28zm0 41l50-28v22l-50 29z" fill="#2f5947"/>' +
  '<path d="M146 136v21m20-12v22m-20 8v21m20-13v22m55-59v23m17-33v24m-17 30v23m17-33v24" stroke="#c1c9a6" stroke-width="4"/>' +
  '<path d="M119 114v-16l67-36 78 33v17l-78-33z" fill="#b4c2a4"/><path d="M186 62v18l78 32V95z" fill="#8d9f85"/>' +
  '<path d="M290 228V30h11v198" fill="#dfb36c"/><path d="M290 30l11 20-11 20 11 20-11 20 11 20-11 20 11 20-11 20 11 20-11 18" fill="none" stroke="#7a764f" stroke-width="1.5"/>' +
  '<path d="M193 38h169v10H193z" fill="#e4ba78"/><path d="M199 38l21-14 22 14 21-14 21 14 12-20 14 20 20-14 21 14" fill="none" stroke="#d8aa65" stroke-width="2"/>' +
  '<path d="M296 18V3M212 48v41" stroke="#d5b97c" stroke-width="2"/><path d="M206 90q6 13 12 0" fill="none" stroke="#edc98e" stroke-width="3"/>' +
  '<path d="M327 45v16h24V45" fill="#9da583"/><path d="M34 224l24-14 26 12-24 14z" fill="#d6b98b"/><path d="M34 224v14l26 13v-15z" fill="#bb9160"/>' +
  '<path d="M60 236l24-14v14l-24 15" fill="#9d8059"/><path d="M310 241v-25h19v25" fill="#b6c18f"/><path d="M306 216h27l-4-7h-18z" fill="#d3d9ad"/>' +
  '<path d="M344 246l6-19h5l6 19z" fill="#d3a565"/><path d="M347 236h11" stroke="#eae3c1" stroke-width="3"/></svg>';
function materialRows(rows, short = false) {
  return rows
    .map(
      m =>
        '<tr><td class="material-name"><span>▧</span>' +
        esc(m.name) +
        '</td>' +
        (short
          ? ''
          : '<td>' +
            n(m.received) +
            ' ' +
            esc(m.unit) +
            '</td><td>' +
            n(m.used) +
            '</td><td>' +
            n(m.wasted) +
            '</td>') +
        '<td>' +
        n(available(m)) +
        ' ' +
        (short ? esc(m.unit) : '') +
        '</td><td><span class="pill ' +
        (available(m) <= m.min ? 'orange' : '') +
        '">' +
        (available(m) <= m.min ? 'Low stock' : 'In stock') +
        '</span></td>' +
        (short
          ? ''
          : '<td>' +
            money(m.rate) +
            '</td><td><button class="text-button" data-edit-material="' +
            esc(m.id) +
            '">Update</button></td>') +
        '</tr>'
    )
    .join('');
}
function recovery() {
  const s = summary(),
    percent = x => (s.total ? (x / s.total) * 100 : 0);
  const fill = s.total
    ? 'conic-gradient(#6e8a54 0 ' +
      percent(s.reuse) +
      '%,#bdd391 ' +
      percent(s.reuse) +
      '% ' +
      percent(s.reuse + s.recycle) +
      '%,#e7b77a ' +
      percent(s.reuse + s.recycle) +
      '% 100%)'
    : '#eef1e7';
  return (
    '<div class="donut-layout"><div class="donut" style="background:' +
    fill +
    '"><div class="donut-hole">' +
    n(s.rate) +
    '%<small>recovery share</small></div></div>' +
    '<div class="legend">' +
    [
      ['Reuse', s.reuse, '#6e8a54'],
      ['Recycle', s.recycle, '#bdd391'],
      ['Disposal', s.disposal, '#e7b77a'],
    ]
      .map(
        ([a, b, c]) =>
          '<div><i style="background:' +
          c +
          '"></i><span>' +
          a +
          '</span><strong>' +
          n(b) +
          ' kg</strong></div>'
      )
      .join('') +
    '</div></div>' +
    '<div class="tip"><strong>Make recovery the first step.</strong><br>Keep waste streams separate to make reuse and recycling easier.</div>'
  );
}
function overview() {
  return (
    '<section class="hero"><div class="hero-copy"><span class="hero-label">A MORE RESPONSIBLE WAY TO BUILD</span>' +
    '<h2>Better material decisions.<br><em>Less left behind.</em></h2><p>Track resources, understand wastage, and turn everyday site actions into community impact.</p>' +
    '<button class="button light" data-action="log-waste">＋ Log waste entry</button></div>' +
    art +
    '</section>' +
    stats() +
    '<div class="grid-two"><section class="card"><div class="card-header"><div><h2>Material snapshot</h2><p>Know what is available before ordering more.</p></div>' +
    '<a class="text-button" href="#materials">View all ↗</a></div><div class="table-scroll"><table><thead><tr><th>Material</th><th>Available</th><th>Status</th></tr></thead><tbody>' +
    materialRows(state.materials.slice(0, 4), true) +
    '</tbody></table></div>' +
    (!state.materials.length
      ? '<div class="empty">Add your first material to start tracking.</div>'
      : '') +
    '<p class="balance-note">Available = received − used − wasted, in each material’s own unit.</p></section>' +
    '<section class="card"><div class="card-header"><div><h2>Where the waste goes</h2><p>Weight-based recovery breakdown</p></div><span class="badge">ALL ENTRIES</span></div>' +
    '<div class="card-body">' +
    recovery() +
    '</div></section></div>' +
    '<div class="grid-two"><section class="card"><div class="card-header"><h2>A little action goes a long way</h2></div><div class="action-grid">' +
    '<button class="quick-action" data-action="add-material"><strong>▤ &nbsp; Add a material</strong><small>Keep your stock up to date ↗</small></button>' +
    '<button class="quick-action" data-action="log-waste"><strong>♲ &nbsp; Record wastage</strong><small>Track and recover more ↗</small></button>' +
    '<a class="quick-action" href="#community"><strong>♧ &nbsp; Give materials a purpose</strong><small>Explore community reuse ↗</small></a></div></section>' +
    '<section class="card"><div class="card-header"><h2>Recent waste records</h2><a href="#waste" class="text-button">View log ↗</a></div><div class="card-body activity">' +
    (state.waste
      .slice(-2)
      .reverse()
      .map(
        w =>
          '<div class="activity-row"><span>♲</span><div>' +
          esc(w.material) +
          ' · ' +
          n(w.kg) +
          ' kg for ' +
          esc(w.route.toLowerCase()) +
          '<small>' +
          esc(w.date) +
          ' · ' +
          esc(w.cause) +
          '</small></div></div>'
      )
      .join('') || '<p class="form-note">No waste entries yet.</p>') +
    '</div></section></div>'
  );
}
function materials() {
  return (
    stats() +
    '<section class="card"><div class="section-intro"><div><h2>Material inventory</h2><p>Enter cumulative totals. Each material keeps its own unit.<br>' +
    'Inventory and waste logs are separate; update both when measuring material loss.</p></div><button class="button" data-action="add-material">＋ Add material</button></div>' +
    '<div class="toolbar"><input class="search" id="material-search" aria-label="Search materials" placeholder="Search materials…">' +
    '<select id="stock-filter" aria-label="Filter by stock status"><option value="all">All stock</option><option value="low">Low stock</option><option value="healthy">In stock</option></select>' +
    '<button class="button secondary" data-action="export-materials">↓ CSV</button></div><div class="table-scroll"><table><thead><tr><th>Material</th><th>Received</th><th>Used</th><th>Wasted</th><th>Available</th><th>Status</th><th>Cost / unit</th><th>Action</th></tr></thead>' +
    '<tbody id="material-rows">' +
    materialRows(state.materials) +
    '</tbody></table><div id="material-empty" class="empty" ' +
    (state.materials.length ? 'hidden' : '') +
    '>No materials found. Add a material to begin.</div></div>' +
    '<p class="balance-note">Low stock means the available quantity is at or below your threshold. Costs are your estimates.</p></section>'
  );
}
function wasteRows(rows) {
  return [...rows]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      w =>
        '<tr><td>' +
        esc(w.date) +
        '</td><td class="material-name">' +
        esc(w.material) +
        '</td><td>' +
        n(w.kg) +
        ' kg</td>' +
        '<td><span class="pill ' +
        (w.route === 'Disposal' ? 'orange' : '') +
        '">' +
        esc(w.route) +
        '</span></td><td style="white-space:normal;min-width:170px;max-width:340px">' +
        esc(w.cause) +
        (w.note
          ? '<small style="display:block;color:#8b9680;margin-top:5px;line-height:1.6">' +
            esc(w.note) +
            '</small>'
          : '') +
        '</td><td><button class="text-button" data-delete-waste="' +
        esc(w.id) +
        '">Remove</button></td></tr>'
    )
    .join('');
}
function waste() {
  return (
    stats() +
    '<div class="grid-two"><section class="card"><div class="card-header"><div><h2>Recovery breakdown</h2><p>All waste entries use kilograms for comparison.</p></div></div>' +
    '<div class="card-body">' +
    recovery() +
    '</div></section><section class="card prose"><h2>Measure. Separate. Recover.</h2>' +
    '<p>Weigh the material and record its cause. Keep reusable items, recyclable materials, and disposal waste separate.</p><p>A logged route is a plan or observation. It does not verify collection, donation, or recycling.</p>' +
    '<button class="button" data-action="log-waste">＋ Log waste entry</button></section></div>' +
    '<section class="card"><div class="section-intro"><div><h2>Waste register</h2><p>Find patterns in what is wasted and why.</p></div><button class="button secondary" data-action="export-waste">↓ Export CSV</button></div>' +
    '<div class="toolbar"><input class="search" id="waste-search" aria-label="Search waste register" placeholder="Search material or cause…">' +
    '<select id="route-filter" aria-label="Filter waste route"><option value="all">All routes</option><option>Reuse</option><option>Recycle</option><option>Disposal</option></select></div>' +
    '<div class="table-scroll"><table><thead><tr><th>Date</th><th>Material</th><th>Weight</th><th>Route</th><th>Cause / notes</th><th>Action</th></tr></thead><tbody id="waste-rows">' +
    wasteRows(state.waste) +
    '</tbody></table><div id="waste-empty" class="empty" ' +
    (state.waste.length ? 'hidden' : '') +
    '>No waste records found.</div></div></section>'
  );
}
const checks = [
  ['Observe the site', 'Record handling, storage and segregation practices.'],
  [
    'Talk to the site supervisor',
    'Ask about material loss and get permission for the activity.',
  ],
  [
    'Identify reusable surplus',
    'Assess quality with the supervisor before suggesting a use.',
  ],
  [
    'Contact a community organisation',
    'Discuss a suitable need and agree on a responsible handover.',
  ],
  [
    'Run an awareness activity',
    'Share practical ways to reduce waste and keep the site clean.',
  ],
  [
    'Document the actual outcome',
    'Record observations and photos with permission, and verify results.',
  ],
];
function community() {
  const completed = state.checks.filter(Boolean).length;
  return (
    '<div class="notice">Local reuse board · Listings stay in this browser. No collection requests, messages or donations are sent from this prototype.</div>' +
    '<div class="info-grid">' +
    [
      [
        '↺',
        'Reduce at the source',
        'Plan purchases and protect materials during transport and storage. Check existing stock before ordering.',
      ],
      [
        '♧',
        'Explore local reuse',
        'Discuss usable surplus with community groups. Have the supervisor check condition and suitability first.',
      ],
      [
        '◉',
        'Make learning visible',
        'Document observations from real site visits. Replace sample entries with verified findings.',
      ],
    ]
      .map(
        ([a, b, c]) =>
          '<article class="info-card"><span>' +
          a +
          '</span><h3>' +
          b +
          '</h3><p>' +
          c +
          '</p></article>'
      )
      .join('') +
    '</div>' +
    '<div class="grid-two" style="margin-top:20px"><section class="card"><div class="card-header"><div><h2>Community reuse board</h2><p>Potential uses for suitable surplus</p></div>' +
    '<button class="button secondary" data-action="add-listing">＋ Add listing</button></div><div class="card-body recovery-list">' +
    (state.listings
      .map(
        l =>
          '<article class="recovery-item"><span class="pill ' +
          (l.status === 'Available' ? '' : 'orange') +
          '">' +
          esc(l.status) +
          '</span>' +
          '<h3>' +
          esc(l.name) +
          ' · ' +
          esc(l.quantity) +
          '</h3><p>' +
          esc(l.purpose) +
          '</p><p>Contact: ' +
          esc(l.contact) +
          '</p>' +
          '<button class="text-button" data-toggle-listing="' +
          esc(l.id) +
          '">' +
          (l.status === 'Available'
            ? 'Mark as handed over'
            : 'Mark as available') +
          '</button>' +
          '<button class="text-button" data-delete-listing="' +
          esc(l.id) +
          '">Remove</button></article>'
      )
      .join('') || '<div class="empty">No reuse opportunities yet.</div>') +
    '</div></section>' +
    '<section class="card"><div class="card-header"><div><h2>Fieldwork checklist</h2><p>' +
    completed +
    ' of 6 activities completed by your group</p>' +
    '<div class="progress"><span style="width:' +
    (completed / 6) * 100 +
    '%"></span></div></div><span class="badge">YOUR PROGRESS</span></div>' +
    '<div class="card-body">' +
    checks
      .map(
        ([a, b], i) =>
          '<label class="check-item"><input type="checkbox" data-check="' +
          i +
          '" ' +
          (state.checks[i] ? 'checked' : '') +
          '><span>' +
          a +
          '<small>' +
          b +
          '</small></span></label>'
      )
      .join('') +
    '</div></section></div>'
  );
}
function project() {
  return (
    '<div class="grid-two"><section class="card prose"><p class="eyebrow">COMMUNITY ENGAGEMENT & FIELD PROJECT</p>' +
    '<h2>Construction Site Material & Wastage Management</h2><p>Construction sites can lose useful material through poor handling, over-ordering, unsuitable storage and a lack of segregation. BuildWise helps a student group record observations and discuss improvements with the community.</p>' +
    '<h3>Objectives</h3><ul><li>Track received, used, wasted and available materials.</li><li>Record waste by weight and identify common causes.</li><li>Explore suitable reuse and recycling with site supervisors.</li><li>Connect field observations with community activities.</li></ul>' +
    '<h3>How to use this website</h3><ol><li>Use Manage data to start an empty project, or explore the sample.</li><li>Edit the site details and add observed material quantities and costs.</li>' +
    '<li>Log weighed waste separately, including its cause and planned route.</li><li>Add reuse opportunities and complete the fieldwork checklist.</li><li>Export a report (use Save as PDF in the print dialog) and keep a JSON backup.</li></ol></section>' +
    '<div class="stack"><section class="card prose"><h2>How the numbers work</h2><p><strong>Available stock</strong> = received − used − wasted, in the material’s own unit.</p>' +
    '<p><strong>Recovery share</strong> = (reuse weight + recycling weight) ÷ total waste weight × 100.</p><p><strong>Estimated material loss</strong> = sum of wasted quantity × entered unit cost.</p>' +
    '<p>Different inventory units are never added together. Inventory and waste entries are independent; the app does not convert or synchronise them.</p></section>' +
    '<section class="card prose"><h2>An honest academic prototype</h2><p>' +
    (state.sample
      ? 'This project contains fictional sample records.'
      : 'This project contains your locally entered records.') +
    ' These figures are not verified fieldwork findings.</p><p>Data stays in this browser on this device. There is no shared database, account system, verified collector directory or automated messaging.</p>' +
    '<p>The project relates to SDG 11 (Sustainable Cities and Communities) and SDG 12 (Responsible Consumption and Production). Actual outcomes depend on your fieldwork.</p></section></div></div>'
  );
}
function openModal(title, html, submit) {
  $('#modal-title').textContent = title;
  $('#modal-form').innerHTML =
    html +
    '<p class="form-error" id="form-error" role="alert"></p><div class="form-actions"><button type="button" class="button secondary" id="cancel-modal">Cancel</button><button class="button" type="submit">Save</button></div>';
  $('#modal-form').onsubmit = e => {
    e.preventDefault();
    try {
      submit(new FormData(e.target));
    } catch (error) {
      $('#form-error').textContent = error.message;
    }
  };
  $('#cancel-modal').onclick = () => $('#modal').close();
  $('#modal').showModal();
}
function field(label, name, value = '', type = 'text', extra = '') {
  return (
    '<label class="field-label">' +
    label +
    '<input name="' +
    name +
    '" type="' +
    type +
    '" value="' +
    esc(value) +
    '" ' +
    extra +
    '></label>'
  );
}
function numberValue(f, key) {
  const value = Number(f.get(key));
  if (!Number.isFinite(value) || value < 0)
    throw Error('Enter valid non-negative quantities and costs.');
  return value;
}
const textValue = (f, key) => String(f.get(key) || '').trim();
function finish(message) {
  const ok = save();
  $('#modal').close();
  render();
  toast(
    ok ? message : 'Changes are temporary. Export a backup before leaving.'
  );
}
function materialForm(id) {
  const m = state.materials.find(x => x.id === id);
  openModal(
    m ? 'Update material' : 'Add material',
    '<p class="form-note">Enter cumulative totals. Used + wasted cannot exceed received.</p>' +
      field(
        'Material name',
        'name',
        m?.name,
        'text',
        'required maxlength="70"'
      ) +
      '<div class="form-grid"><label class="field-label">Unit<select name="unit">' +
      ['bags', 'pieces', 'kg', 'm³', 'litres', 'tonnes', 'm²']
        .map(
          u =>
            '<option ' +
            (u === m?.unit ? 'selected' : '') +
            '>' +
            u +
            '</option>'
        )
        .join('') +
      '</select></label>' +
      field(
        'Cost per unit (₹)',
        'rate',
        m?.rate ?? 0,
        'number',
        'min="0" step="0.01" required'
      ) +
      field(
        'Received quantity',
        'received',
        m?.received ?? 0,
        'number',
        'min="0" step="any" required'
      ) +
      field(
        'Used quantity',
        'used',
        m?.used ?? 0,
        'number',
        'min="0" step="any" required'
      ) +
      field(
        'Wasted quantity',
        'wasted',
        m?.wasted ?? 0,
        'number',
        'min="0" step="any" required'
      ) +
      field(
        'Low-stock threshold',
        'min',
        m?.min ?? 0,
        'number',
        'min="0" step="any" required'
      ) +
      '</div>',
    f => {
      const entry = {
        id: m?.id ?? uid(),
        name: textValue(f, 'name'),
        unit: textValue(f, 'unit'),
        received: numberValue(f, 'received'),
        used: numberValue(f, 'used'),
        wasted: numberValue(f, 'wasted'),
        rate: numberValue(f, 'rate'),
        min: numberValue(f, 'min'),
      };
      if (!entry.name) throw Error('Enter a material name.');
      if (entry.used + entry.wasted > entry.received)
        throw Error('Used + wasted must not exceed received quantity.');
      if (m && m.unit !== entry.unit)
        throw Error(
          'Keep the original unit. Add another material to use a different unit.'
        );
      if (m)
        state.materials[state.materials.findIndex(x => x.id === id)] = entry;
      else state.materials.push(entry);
      finish('Material inventory saved.');
    }
  );
}
function localDate() {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}
function wasteForm() {
  openModal(
    'Log waste entry',
    '<p class="form-note">Weigh waste in kilograms. This does not change inventory quantities.</p><div class="form-grid">' +
      field('Observation date', 'date', localDate(), 'date', 'required') +
      field(
        'Weight (kg)',
        'kg',
        '',
        'number',
        'min="0.01" step="any" required'
      ) +
      '</div>' +
      field(
        'Material',
        'material',
        '',
        'text',
        'required maxlength="70" list="material-options"'
      ) +
      '<datalist id="material-options">' +
      state.materials
        .map(m => '<option value="' + esc(m.name) + '"></option>')
        .join('') +
      '</datalist>' +
      '<label class="field-label">Planned / observed route<select name="route"><option>Reuse</option><option>Recycle</option><option>Disposal</option></select></label>' +
      field(
        'Cause of wastage',
        'cause',
        '',
        'text',
        'required maxlength="120"'
      ) +
      '<label class="field-label">Observation / next action<textarea name="note" rows="3" maxlength="500"></textarea></label>',
    f => {
      const w = {
        id: uid(),
        date: textValue(f, 'date'),
        material: textValue(f, 'material'),
        kg: numberValue(f, 'kg'),
        route: textValue(f, 'route'),
        cause: textValue(f, 'cause'),
        note: textValue(f, 'note'),
      };
      if (!w.material || !w.cause || !w.date)
        throw Error('Complete the required fields.');
      if (w.kg <= 0) throw Error('Weight must be greater than zero.');
      state.waste.push(w);
      finish('Waste entry recorded.');
    }
  );
}
function listingForm() {
  openModal(
    'Add reuse opportunity',
    field('Material name', 'name', '', 'text', 'required maxlength="70"') +
      field(
        'Quantity with unit',
        'quantity',
        '',
        'text',
        'required maxlength="60" placeholder="e.g. 30 pieces"'
      ) +
      '<label class="field-label">Potential community use<textarea name="purpose" rows="3" required maxlength="500"></textarea></label>' +
      field(
        'Contact / coordination details',
        'contact',
        '',
        'text',
        'required maxlength="160"'
      ) +
      '<p class="form-note">Use details you have permission to record. This listing does not contact anyone or arrange pickup.</p>',
    f => {
      const l = {
        id: uid(),
        name: textValue(f, 'name'),
        quantity: textValue(f, 'quantity'),
        purpose: textValue(f, 'purpose'),
        contact: textValue(f, 'contact'),
        status: 'Available',
      };
      if (!l.name || !l.quantity || !l.purpose || !l.contact)
        throw Error('Complete all fields.');
      state.listings.push(l);
      finish('Reuse opportunity saved.');
    }
  );
}
function confirmAction(title, description, action) {
  openModal(title, '<p class="form-note">' + description + '</p>', () => {
    action();
    finish('Project updated.');
  });
  $('#modal-form button[type="submit"]').textContent = 'Confirm';
}
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csv(rows) {
  return rows
    .map(row =>
      row
        .map(value => {
          const text = String(value ?? '');
          return (
            '"' +
            (/^[=+@\-\t\r]/.test(text) ? "'" : '') +
            text.replace(/"/g, '""') +
            '"'
          );
        })
        .join(',')
    )
    .join('\r\n');
}
function manageData() {
  openModal(
    'Manage project data',
    '<p class="form-note">' +
      (state.sample
        ? 'The current records are fictional sample data.'
        : 'The current records were entered in this browser.') +
      ' Download a backup before replacing your work.</p><div class="stack">' +
      '<button type="button" class="button secondary" data-action="backup">↓ Download JSON backup</button>' +
      '<label class="field-label">Restore a BuildWise backup<input id="import-file" type="file" accept="application/json,.json"></label>' +
      '<button type="button" class="button secondary" data-action="empty-project">Start an empty project</button>' +
      '<button type="button" class="button secondary" data-action="sample-project">Reload sample project</button></div>',
    () => $('#modal').close()
  );
  $('#modal-form button[type="submit"]').textContent = 'Done';
}
function report() {
  $('.print-only')?.remove();
  const node = document.createElement('section');
  node.className = 'print-only';
  node.innerHTML =
    '<p>BUILDWISE · COMMUNITY ENGAGEMENT & FIELD PROJECT</p><h1>Construction Site Material & Wastage Management</h1>' +
    '<p><strong>' +
    esc(state.site.name) +
    '</strong> · ' +
    esc(state.site.location) +
    '<br>Generated: ' +
    esc(new Date().toLocaleDateString('en-IN')) +
    '<br>' +
    (state.sample
      ? 'DEMONSTRATION DATA — fictional sample project.'
      : 'User-entered records — verify against field observations.') +
    '</p>' +
    stats() +
    '<h2>Material inventory</h2><table><thead><tr><th>Material / unit</th><th>Received</th><th>Used</th><th>Wasted</th><th>Available</th><th>Loss estimate</th></tr></thead><tbody>' +
    state.materials
      .map(
        m =>
          '<tr><td>' +
          esc(m.name) +
          ' (' +
          esc(m.unit) +
          ')</td><td>' +
          n(m.received) +
          '</td><td>' +
          n(m.used) +
          '</td><td>' +
          n(m.wasted) +
          '</td><td>' +
          n(available(m)) +
          '</td><td>' +
          money(m.wasted * m.rate) +
          '</td></tr>'
      )
      .join('') +
    '</tbody></table><h2>Waste register</h2><table><thead><tr><th>Date</th><th>Material</th><th>kg</th><th>Route</th><th>Cause / notes</th></tr></thead><tbody>' +
    state.waste
      .map(
        w =>
          '<tr><td>' +
          esc(w.date) +
          '</td><td>' +
          esc(w.material) +
          '</td><td>' +
          n(w.kg) +
          '</td><td>' +
          esc(w.route) +
          '</td><td>' +
          esc(w.cause) +
          '. ' +
          esc(w.note) +
          '</td></tr>'
      )
      .join('') +
    '</tbody></table><h2>Community activities</h2><p>' +
    state.checks.filter(Boolean).length +
    ' of 6 activities marked complete.</p><ul>' +
    checks
      .map(
        ([a], i) =>
          '<li>' + (state.checks[i] ? 'Completed: ' : 'Pending: ') + a + '</li>'
      )
      .join('') +
    '</ul><h2>Reuse opportunities</h2><ul>' +
    (state.listings
      .map(
        l =>
          '<li>' +
          esc(l.name) +
          ' — ' +
          esc(l.quantity) +
          ' — ' +
          esc(l.status) +
          '. ' +
          esc(l.purpose) +
          '</li>'
      )
      .join('') || '<li>No listings recorded.</li>') +
    '</ul><p>Recovery share = (reuse + recycling weight) / total waste weight × 100. Inventory and waste log quantities are independent. Costs are entered estimates. Planned routes and listings do not verify completed recycling or donations.</p>';
  $('#main').append(node);
  window.print();
}
document.addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'add-material') materialForm();
  if (action === 'log-waste') wasteForm();
  if (action === 'add-listing') listingForm();
  if (action === 'export-materials')
    download(
      'BuildWise_Materials.csv',
      '\uFEFF' +
        csv([
          [
            'Material',
            'Unit',
            'Received',
            'Used',
            'Wasted',
            'Available',
            'Unit cost INR',
            'Estimated loss INR',
          ],
          ...state.materials.map(m => [
            m.name,
            m.unit,
            m.received,
            m.used,
            m.wasted,
            available(m),
            m.rate,
            m.wasted * m.rate,
          ]),
        ]),
      'text/csv;charset=utf-8'
    );
  if (action === 'export-waste')
    download(
      'BuildWise_Waste_Log.csv',
      '\uFEFF' +
        csv([
          ['Date', 'Material', 'Weight kg', 'Route', 'Cause', 'Notes'],
          ...state.waste.map(w => [
            w.date,
            w.material,
            w.kg,
            w.route,
            w.cause,
            w.note,
          ]),
        ]),
      'text/csv;charset=utf-8'
    );
  if (action === 'backup')
    download(
      'BuildWise_Backup.json',
      JSON.stringify(state, null, 2),
      'application/json'
    );
  if (action === 'empty-project') {
    $('#modal').close();
    confirmAction(
      'Start an empty project?',
      'This replaces current records in this browser. Download a backup first if you want to keep them.',
      () => {
        state = {
          ...seed(),
          sample: false,
          site: {
            name: 'My construction site',
            location: 'Location to be added',
          },
          materials: [],
          waste: [],
          listings: [],
          checks: Array(6).fill(false),
        };
      }
    );
  }
  if (action === 'sample-project') {
    $('#modal').close();
    confirmAction(
      'Reload sample project?',
      'This replaces current records with fictional sample data. Download a backup first if needed.',
      () => {
        state = seed();
      }
    );
  }
  const edit = e.target.closest('[data-edit-material]');
  if (edit) materialForm(edit.dataset.editMaterial);
  const dw = e.target.closest('[data-delete-waste]');
  if (dw)
    confirmAction(
      'Remove waste entry?',
      'Remove this entry from the waste log?',
      () => {
        state.waste = state.waste.filter(w => w.id !== dw.dataset.deleteWaste);
      }
    );
  const tl = e.target.closest('[data-toggle-listing]');
  if (tl) {
    const item = state.listings.find(l => l.id === tl.dataset.toggleListing);
    confirmAction(
      item.status === 'Available'
        ? 'Confirm actual handover?'
        : 'Make listing available?',
      item.status === 'Available'
        ? 'Mark as handed over only after an actual agreed handover. This only updates the local record.'
        : 'This changes the listing status in this browser.',
      () => {
        item.status = item.status === 'Available' ? 'Handed over' : 'Available';
      }
    );
  }
  const dl = e.target.closest('[data-delete-listing]');
  if (dl)
    confirmAction(
      'Remove reuse listing?',
      'Remove this reuse opportunity?',
      () => {
        state.listings = state.listings.filter(
          l => l.id !== dl.dataset.deleteListing
        );
      }
    );
});
function filterMaterials() {
  const query = $('#material-search').value.trim().toLowerCase();
  const filter = $('#stock-filter').value;
  const rows = state.materials.filter(
    m =>
      m.name.toLowerCase().includes(query) &&
      (filter === 'all' ||
        (filter === 'low' ? available(m) <= m.min : available(m) > m.min))
  );
  $('#material-rows').innerHTML = materialRows(rows);
  $('#material-empty').hidden = !!rows.length;
}
function filterWaste() {
  const query = $('#waste-search').value.trim().toLowerCase();
  const filter = $('#route-filter').value;
  const rows = state.waste.filter(
    w =>
      (w.material + ' ' + w.cause + ' ' + w.note)
        .toLowerCase()
        .includes(query) &&
      (filter === 'all' || w.route === filter)
  );
  $('#waste-rows').innerHTML = wasteRows(rows);
  $('#waste-empty').hidden = !!rows.length;
}
document.addEventListener('input', e => {
  if (e.target.id === 'material-search') filterMaterials();
  if (e.target.id === 'waste-search') filterWaste();
});
document.addEventListener('change', async e => {
  if (e.target.id === 'stock-filter') filterMaterials();
  if (e.target.id === 'route-filter') filterWaste();
  if (e.target.matches('[data-check]')) {
    state.checks[Number(e.target.dataset.check)] = e.target.checked;
    save();
    render();
  }
  if (e.target.id === 'import-file') {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2000000)
        throw Error('Backup is too large (maximum 2 MB).');
      const data = JSON.parse(await file.text());
      if (!validData(data))
        throw Error('This is not a valid BuildWise backup.');
      $('#modal').close();
      confirmAction(
        'Restore this backup?',
        'This replaces all current project records in this browser.',
        () => {
          state = data;
        }
      );
    } catch (error) {
      $('#form-error').textContent = error.message;
    }
  }
});
$('#edit-site').onclick = () =>
  openModal(
    'Edit project site',
    field(
      'Site name',
      'name',
      state.site.name,
      'text',
      'required maxlength="100"'
    ) +
      field(
        'City / location',
        'location',
        state.site.location,
        'text',
        'required maxlength="100"'
      ),
    f => {
      const name = textValue(f, 'name'),
        location = textValue(f, 'location');
      if (!name || !location) throw Error('Enter a site name and location.');
      state.site = { name, location };
      finish('Site details updated.');
    }
  );
$('#close-modal').onclick = () => $('#modal').close();
$('#data-settings').onclick = manageData;
$('#report-button').onclick = report;
$('#today').textContent = new Date().toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
window.addEventListener('hashchange', render);
render();
