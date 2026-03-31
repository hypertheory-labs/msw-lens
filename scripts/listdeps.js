#!/usr/bin/env node

const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

function collectDeps(deps, section) {
  if (!deps) return [];
  return Object.entries(deps).map(([name, range]) => {
    const prefix = range.match(/^[\^~]/)?.[0] ?? '';
    const specified = range;
    const resolved = lock.packages?.['node_modules/' + name]?.version ?? '???';
    const inSync = specified === prefix + resolved;
    return { name, section, specified, resolved, prefix, inSync };
  });
}

const rows = [
  ...collectDeps(pkg.dependencies, 'dependencies'),
  ...collectDeps(pkg.devDependencies, 'devDependencies'),
];

// --- Terminal table ---

const col = {
  name: Math.max(4, ...rows.map((r) => r.name.length)),
  section: Math.max(7, ...rows.map((r) => r.section.length)),
  specified: Math.max(9, ...rows.map((r) => r.specified.length)),
  resolved: Math.max(8, ...rows.map((r) => r.resolved.length)),
};

const divider = `+-${'-'.repeat(col.name)}-+-${'-'.repeat(col.section)}-+-${'-'.repeat(col.specified)}-+-${'-'.repeat(col.resolved)}-+------+`;

function pad(s, n) {
  return s.padEnd(n);
}

console.log(divider);
console.log(
  `| ${pad('Name', col.name)} | ${pad('Section', col.section)} | ${pad('Specified', col.specified)} | ${pad('Resolved', col.resolved)} | Sync |`,
);
console.log(divider);

for (const r of rows) {
  const sync = r.inSync ? ' ok ' : ' !! ';
  console.log(
    `| ${pad(r.name, col.name)} | ${pad(r.section, col.section)} | ${pad(r.specified, col.specified)} | ${pad(r.resolved, col.resolved)} | ${sync} |`,
  );
}

console.log(divider);

const outOfSync = rows.filter((r) => !r.inSync);
console.log(`\n${rows.length} packages — ${outOfSync.length} out of sync`);

// --- HTML report ---

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dependency Report — ${pkg.name}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; background: #f9fafb; color: #111; }
    h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
    p.meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; }
    table { border-collapse: collapse; width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    th { background: #1e293b; color: white; text-align: left; padding: 0.6rem 1rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 0.5rem 1rem; font-size: 0.875rem; border-bottom: 1px solid #f1f5f9; font-family: monospace; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fafc; }
    .section { color: #6b7280; font-family: system-ui, sans-serif; font-size: 0.8rem; }
    .ok { color: #16a34a; font-weight: 600; }
    .mismatch { color: #dc2626; font-weight: 600; }
    .summary { margin-top: 1rem; font-size: 0.875rem; color: #374151; }
    .summary strong { color: #dc2626; }
  </style>
</head>
<body>
  <h1>Dependency Report — ${pkg.name}</h1>
  <p class="meta">Generated ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr>
        <th>Package</th>
        <th>Section</th>
        <th>Specified (package.json)</th>
        <th>Resolved (package-lock.json)</th>
        <th>Sync</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (r) => `
      <tr>
        <td>${r.name}</td>
        <td class="section">${r.section}</td>
        <td>${r.specified}</td>
        <td>${r.prefix}${r.resolved}</td>
        <td class="${r.inSync ? 'ok' : 'mismatch'}">${r.inSync ? '✓' : '✗ mismatch'}</td>
      </tr>`,
        )
        .join('')}
    </tbody>
  </table>
  <p class="summary">
    ${rows.length} packages —
    ${outOfSync.length === 0 ? 'all in sync' : `<strong>${outOfSync.length} out of sync</strong>`}
  </p>
</body>
</html>`;

fs.writeFileSync('deps-report.html', html);
console.log('HTML report written to deps-report.html');
