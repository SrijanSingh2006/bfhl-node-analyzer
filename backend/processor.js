const VALID_RE = /^([A-Z])->([A-Z])$/;

function isValid(edge) {
  const m = edge.match(VALID_RE);
  return m && m[1] !== m[2];
}

function separateDuplicates(edges) {
  const seen = new Set();
  const dupeSet = new Set();
  const clean = [];
  for (const e of edges) {
    if (seen.has(e)) {
      dupeSet.add(e);
    } else {
      seen.add(e);
      clean.push(e);
    }
  }
  return { clean, dupes: [...dupeSet] };
}

function makeGraph(edges) {
  const children = new Map();
  const firstParent = new Map();
  const nodes = new Set();

  for (const e of edges) {
    const [, p, c] = e.match(VALID_RE);
    nodes.add(p);
    nodes.add(c);
    if (!children.has(p)) children.set(p, []);
    if (!firstParent.has(c)) {
      firstParent.set(c, p);
      children.get(p).push(c);
    }
  }

  const rep = new Map();
  const find = n => {
    if (!rep.has(n)) rep.set(n, n);
    if (rep.get(n) !== n) rep.set(n, find(rep.get(n)));
    return rep.get(n);
  };
  const merge = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) rep.set(ra, rb);
  };

  for (const e of edges) {
    const [, p, c] = e.match(VALID_RE);
    merge(p, c);
  }

  const clusters = new Map();
  for (const n of nodes) {
    const key = find(n);
    if (!clusters.has(key)) clusters.set(key, new Set());
    clusters.get(key).add(n);
  }

  return { children, firstParent, clusters, nodes };
}

function detectCycle(cluster, children) {
  const state = new Map();
  for (const n of cluster) state.set(n, 0);

  const dfs = u => {
    state.set(u, 1);
    for (const v of (children.get(u) || [])) {
      if (!state.has(v)) continue;
      if (state.get(v) === 1) return true;
      if (state.get(v) === 0 && dfs(v)) return true;
    }
    state.set(u, 2);
    return false;
  };

  for (const n of cluster) {
    if (state.get(n) === 0 && dfs(n)) return true;
  }
  return false;
}

function nestTree(root, children, cluster) {
  const visited = new Set();
  const walk = node => {
    visited.add(node);
    const obj = {};
    const kids = (children.get(node) || []).filter(c => cluster.has(c) && !visited.has(c));
    for (const k of kids) obj[k] = walk(k);
    return obj;
  };
  return { [root]: walk(root) };
}

function treeDepth(node, children, cluster, cache = new Map()) {
  if (cache.has(node)) return cache.get(node);
  const kids = (children.get(node) || []).filter(c => cluster.has(c));
  const d = kids.length === 0 ? 1 : 1 + Math.max(...kids.map(k => treeDepth(k, children, cluster, cache)));
  cache.set(node, d);
  return d;
}

function orderIndex(edges) {
  const idx = new Map();
  let i = 0;
  for (const e of edges) {
    const [, p, c] = e.match(VALID_RE);
    if (!idx.has(p)) idx.set(p, i++);
    if (!idx.has(c)) idx.set(c, i++);
  }
  return idx;
}

function processData(data) {
  const badEntries = [];
  const goodEdges = [];

  for (const raw of data) {
    const entry = (typeof raw === 'string' ? raw : String(raw)).trim();
    if (!entry || !isValid(entry)) {
      badEntries.push(entry || raw);
    } else {
      goodEdges.push(entry);
    }
  }

  const { clean, dupes } = separateDuplicates(goodEdges);
  const { children, firstParent, clusters } = makeGraph(clean);

  const firstSeen = orderIndex(clean);
  const groups = [];

  for (const [, cluster] of clusters) {
    const hasCycle = detectCycle(cluster, children);

    const roots = [...cluster].filter(n => {
      const p = firstParent.get(n);
      return p === undefined || !cluster.has(p);
    });

    const root = (roots.length === 0 || hasCycle)
      ? [...cluster].sort()[0]
      : roots.sort()[0];

    const entry = hasCycle
      ? { root, tree: {}, has_cycle: true }
      : { root, tree: nestTree(root, children, cluster), depth: treeDepth(root, children, cluster) };

    const order = firstSeen.has(root) ? firstSeen.get(root) : Infinity;
    groups.push({ entry, order });
  }

  groups.sort((a, b) => a.order - b.order);
  const hierarchies = groups.map(g => g.entry);

  const nonCyclic = hierarchies.filter(h => !h.has_cycle);
  const cyclic = hierarchies.filter(h => h.has_cycle);

  let largest_tree_root = null;
  let maxD = -1;
  for (const h of nonCyclic) {
    if (h.depth > maxD || (h.depth === maxD && h.root < largest_tree_root)) {
      maxD = h.depth;
      largest_tree_root = h.root;
    }
  }

  return {
    user_id: 'srijansingh_10112006',
    email_id: 'ss8566@srmist.edu.in',
    college_roll_number: 'RA2311003010626',
    hierarchies,
    invalid_entries: badEntries,
    duplicate_edges: dupes,
    summary: {
      total_trees: nonCyclic.length,
      total_cycles: cyclic.length,
      largest_tree_root
    }
  };
}

module.exports = { processData };
