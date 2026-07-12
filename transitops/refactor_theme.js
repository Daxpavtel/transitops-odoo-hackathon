const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'client', 'src');

const classMap = {
  // Backgrounds
  'bg-slate-900': 'bg-[var(--surface-topbar)]',
  'bg-slate-800': 'bg-[var(--surface-card)]',
  'bg-slate-50': 'bg-[var(--surface-panel)]',
  'bg-white': 'bg-[var(--surface-card)]',
  'bg-slate-100': 'bg-[var(--surface-base)]',
  
  // Text
  'text-white': 'text-[var(--content-primary)]',
  'text-slate-900': 'text-[var(--content-primary)]',
  'text-slate-800': 'text-[var(--content-primary)]',
  'text-slate-600': 'text-[var(--content-muted)]',
  'text-slate-500': 'text-[var(--content-muted)]',
  'text-slate-400': 'text-[var(--content-muted)]',
  'text-slate-100': 'text-[var(--content-primary)]',

  // Borders
  'border-slate-100': 'border-[var(--divider-subtle)]',
  'border-slate-200': 'border-[var(--divider-subtle)]',
  'border-slate-800': 'border-[var(--divider-subtle)]',
  
  // Modals & Overlays
  'bg-slate-900/60': 'bg-[var(--surface-topbar)]/60',
  'hover:bg-slate-800': 'hover:bg-[var(--surface-card)]',
  'hover:bg-slate-50/50': 'hover:bg-[var(--surface-panel)]',
  'hover:bg-slate-50': 'hover:bg-[var(--surface-panel)]',
  'disabled:bg-slate-100': 'disabled:bg-[var(--surface-base)]',
  'disabled:text-slate-500': 'disabled:text-[var(--content-muted)]'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk(directoryPath);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  Object.keys(classMap).forEach(oldClass => {
    const newClass = classMap[oldClass];
    const escapedClass = oldClass.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
    const regex = new RegExp(`([^a-zA-Z0-9_-])${escapedClass}([^a-zA-Z0-9_-])`, 'g');
    let matches = false;
    while(regex.test(content)) {
      content = content.replace(regex, `$1${newClass}$2`);
      matches = true;
    }
    if (matches) changed = true;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
console.log('Refactoring complete.');
