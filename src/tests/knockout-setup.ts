import fs from 'fs';
import path from 'path';

const knockoutPath = path.resolve(
  process.cwd(),
  'public/vendor/knockout-latest.js',
);
const knockoutCode = fs.readFileSync(knockoutPath, 'utf8');

if (!window.ko) window.eval(knockoutCode);
