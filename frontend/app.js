const API = 'https://bfhl-backend-hlax.onrender.com/bfhl';

const EXAMPLE = [
  'A->B', 'A->C', 'B->D', 'C->E', 'E->F',
  'X->Y', 'Y->Z', 'Z->X',
  'P->Q', 'Q->R',
  'G->H', 'G->H', 'G->I',
  'hello', '1->2', 'A->'
].join('\n');

const get = id => document.getElementById(id);

const textarea   = get('edge-input');
const gutter     = get('gutter');
const counter    = get('entry-counter');
const submitBtn  = get('submit-btn');
const btnText    = get('btn-text');
const btnLoader  = get('btn-loader');
const btnArrow   = get('btn-arrow');
const errorStrip = get('error-strip');
const errorTxt   = get('error-txt');
const toastEl    = get('toast-el');
const placeholder= get('results-placeholder');
const resultsBody= get('results-body');
const jsonDump   = get('json-dump');

let lastResult = null;

get('issue-date').textContent = new Date().toLocaleDateString('en-GB', {
  day: '2-digit', month: 'long', year: 'numeric'
});

function parseEntries(raw) {
  return raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
}

function syncGutter() {
  const count = textarea.value.split('\n').length;
  gutter.textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
  const n = parseEntries(textarea.value).length;
  counter.textContent = n === 0 ? '—' : `${n} entries`;
}

textarea.addEventListener('input', syncGutter);
textarea.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const s = textarea.selectionStart;
  textarea.value = textarea.value.slice(0, s) + '  ' + textarea.value.slice(textarea.selectionEnd);
  textarea.selectionStart = textarea.selectionEnd = s + 2;
  syncGutter();
});

get('example-btn').addEventListener('click', () => {
  textarea.value = EXAMPLE;
  syncGutter();
  textarea.focus();
});

get('clear-btn').addEventListener('click', () => {
  textarea.value = '';
  syncGutter();
  hideError();
  placeholder.classList.remove('hidden');
  resultsBody.classList.add('hidden');
});

get('error-x').addEventListener('click', hideError);

get('copy-btn').addEventListener('click', () => {
  if (!lastResult) return;
  navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2))
    .then(() => toast('✓ Copied to clipboard'))
    .catch(() => toast('Copy failed'));
});

function showError(msg) {
  errorTxt.textContent = msg;
  errorStrip.classList.remove('hidden');
}
function hideError() {
  errorStrip.classList.add('hidden');
}
function toast(msg, ms = 2200) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  setTimeout(() => toastEl.classList.add('hidden'), ms);
}

function setLoading(on) {
  submitBtn.disabled = on;
  btnText.textContent = on ? 'Analyzing' : 'Analyze';
  btnLoader.classList.toggle('hidden', !on);
  btnArrow.classList.toggle('hidden', on);
}

submitBtn.addEventListener('click', async () => {
  hideError();
  const raw = textarea.value.trim();
  if (!raw) { showError('No input — enter some edges first.'); return; }
  const data = parseEntries(raw);
  if (!data.length) { showError('Nothing parseable found.'); return; }

  setLoading(true);
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b.error || `HTTP ${res.status}`);
    }
    lastResult = await res.json();
    render(lastResult);
  } catch (err) {
    showError(`${err.message} — make sure the backend is running (npm start in /backend)`);
  } finally {
    setLoading(false);
  }
});

function render(d) {
  const s = d.summary || {};
  get('s-trees').textContent = s.total_trees  ?? '—';
  get('s-cycles').textContent= s.total_cycles ?? '—';
  get('s-root').textContent  = s.largest_tree_root ?? '—';
  get('s-inv').textContent   = (d.invalid_entries || []).length;
  get('s-dup').textContent   = (d.duplicate_edges || []).length;

  fillTags('inv-tags', 'ec-inv-count', d.invalid_entries || [], 'e-red');
  fillTags('dup-tags', 'ec-dup-count', d.duplicate_edges || [], 'e-amber');

  const list = get('hier-list');
  list.innerHTML = '';
  (d.hierarchies || []).forEach((h, i) => list.appendChild(buildHCard(h, i)));
  get('hier-total').textContent = (d.hierarchies || []).length;

  jsonDump.textContent = JSON.stringify(d, null, 2);

  placeholder.classList.add('hidden');
  resultsBody.classList.remove('hidden');

  resultsBody.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function fillTags(listId, countId, items, cls) {
  const el = get(listId);
  el.innerHTML = '';
  get(countId).textContent = items.length;
  if (!items.length) {
    el.innerHTML = '<span class="etag-empty">none</span>';
    return;
  }
  items.forEach((item, i) => {
    const t = document.createElement('span');
    t.className = `etag ${cls}`;
    t.textContent = item;
    t.style.animationDelay = `${i * 25}ms`;
    el.appendChild(t);
  });
}

function buildHCard(h, idx) {
  const isCycle = !!h.has_cycle;
  const card = document.createElement('div');
  card.className = `hcard ${isCycle ? 'hcard-cycle' : 'hcard-tree'}`;
  card.style.animationDelay = `${idx * 40}ms`;

  const head = document.createElement('div');
  head.className = 'hcard-head';

  const rootNum = document.createElement('div');
  rootNum.className = 'hcard-root-num';
  rootNum.textContent = h.root;

  const meta = document.createElement('div');
  meta.className = 'hcard-meta';
  meta.innerHTML = `<span>Root node</span><span>Component ${idx + 1} — ${isCycle ? 'cyclic group' : 'tree'}</span>`;

  const chip = document.createElement('span');
  chip.className = 'hcard-chip';
  chip.textContent = isCycle ? '⟳ CYCLE' : '⬡ TREE';

  head.appendChild(rootNum);
  head.appendChild(meta);
  head.appendChild(chip);
  card.appendChild(head);

  if (!isCycle) {
    const depthRow = document.createElement('div');
    depthRow.className = 'hcard-depth';
    const dlbl = document.createElement('span');
    dlbl.className = 'depth-label';
    dlbl.textContent = 'DEPTH';
    const track = document.createElement('div');
    track.className = 'depth-track';
    const fill = document.createElement('div');
    fill.className = 'depth-fill';
    track.appendChild(fill);
    const dval = document.createElement('span');
    dval.className = 'depth-val';
    dval.textContent = h.depth ?? '—';
    depthRow.appendChild(dlbl);
    depthRow.appendChild(track);
    depthRow.appendChild(dval);
    card.appendChild(depthRow);

    requestAnimationFrame(() => {
      setTimeout(() => {
        fill.style.width = Math.min(100, ((h.depth || 1) / 10) * 100) + '%';
      }, 60 + idx * 40);
    });

    const wrap = document.createElement('div');
    wrap.className = 'hcard-tree-wrap';
    const pre = document.createElement('pre');
    pre.className = 'ascii-tree';
    pre.textContent = toAscii(h.tree, h.root);
    wrap.appendChild(pre);
    card.appendChild(wrap);
  } else {
    const body = document.createElement('div');
    body.className = 'hcard-cycle-body';
    body.innerHTML = `
      <div class="cycle-glyph">∞</div>
      <div class="cycle-desc">
        <p>Circular dependency detected</p>
        <small>All nodes appear as children — no valid root can be determined.<br>
        Lex-smallest node (${h.root}) designated as representative.</small>
      </div>`;
    card.appendChild(body);
  }

  return card;
}

function toAscii(treeObj, root) {
  const lines = [];
  function walk(obj, prefix, isLast) {
    const keys = Object.keys(obj);
    keys.forEach((k, i) => {
      const last = i === keys.length - 1;
      lines.push(prefix + (isLast ? '    ' : '│   ') + (last ? '└── ' : '├── ') + k);
      walk(obj[k], prefix + (isLast ? '    ' : '│   '), last);
    });
  }
  lines.push(root);
  if (treeObj[root]) walk(treeObj[root], '', true);
  return lines.join('\n');
}

syncGutter();
