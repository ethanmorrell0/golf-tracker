// Rebuilds stations.js from the uk-railway-stations dataset (ODbL).
// Usage: node train-finder/tools/build-stations.mjs
import { writeFileSync } from 'node:fs';

const SOURCE = 'https://raw.githubusercontent.com/davwheat/uk-railway-stations/main/stations.json';
const data = await (await fetch(SOURCE)).json();
const rows = data
  .filter((s) => s.crsCode && typeof s.lat === 'number')
  .map((s) => [s.stationName, s.crsCode, +s.lat.toFixed(5), +s.long.toFixed(5)])
  .sort((a, b) => a[0].localeCompare(b[0]));

writeFileSync(new URL('../stations.js', import.meta.url),
  '// UK National Rail stations: [name, CRS code, lat, lng].\n' +
  '// Source: github.com/davwheat/uk-railway-stations , Open Database License (ODbL).\n' +
  '// Regenerate with: node train-finder/tools/build-stations.mjs\n' +
  `var STATIONS = ${JSON.stringify(rows)};\n` +
  "if (typeof module !== 'undefined') module.exports = STATIONS;\n");
console.log(`Wrote ${rows.length} stations`);
