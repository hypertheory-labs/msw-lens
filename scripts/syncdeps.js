// This script updates the versions in package.json to match the resolved versions in package-lock.json.
// run it with `node syncdeps.js` after running `npm install` to ensure that the versions in package.json are in sync with the actual installed versions.

const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

function sync(deps) {
  if (!deps) return;
  for (const [name, range] of Object.entries(deps)) {
    const resolved = lock.packages?.['node_modules/' + name]?.version;
    if (resolved) {
      const prefix = range.match(/^[\^~]/)?.[0] ?? '';
      deps[name] = prefix + resolved;
    }
  }
}

sync(pkg.dependencies);
sync(pkg.devDependencies);
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Done');
