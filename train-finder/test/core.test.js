const test = require('node:test');
const assert = require('node:assert');
const core = require('../core.js');
const STATIONS = require('../stations.js').map(([name, crs, lat, lng]) => ({ name, crs, lat, lng }));

const find = (name) => core.parsePlace(name, STATIONS);
const trip = {
  driver: find('Leeds'),
  destination: find('Leicester'),
  travellers: [{ name: 'Friend', origin: find('London St Pancras International') }],
};

test('parses station names, CRS codes and coordinates', () => {
  assert.strictEqual(find('loughborough').crs, 'LBO');
  assert.strictEqual(find('LBO').name, 'Loughborough');
  const p = find('52.6369, -1.1398');
  assert.strictEqual(p.crs, 'LEI');
  assert.strictEqual(find('Nowhere Parkway'), null);
});

test('detour is zero at the destination and grows off-route', () => {
  const lei = find('Leicester');
  assert.ok(core.detour(trip.driver, lei, trip.destination).minutes < 0.01);
  const lbo = core.detour(trip.driver, find('Loughborough'), trip.destination);
  const norwich = core.detour(trip.driver, find('Norwich'), trip.destination);
  assert.ok(lbo.minutes < 15, `Loughborough detour ${lbo.minutes}`);
  assert.ok(norwich.minutes > 60);
});

test('shortlist for Leeds driver, London traveller, Leicester trip includes M1 stations', () => {
  const ranked = core.rankStations(STATIONS, trip);
  const crs = ranked.map((r) => r.station.crs);
  assert.ok(crs.includes('LEI'));
  assert.ok(crs.includes('LBO'));
  assert.ok(ranked.every((r) => r.detourMinutes <= core.DEFAULTS.maxDetourMinutes));
  for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i - 1].total <= ranked[i].total);
});

test('a real cheap fare moves a station to the top', () => {
  const known = { [core.legKey('STP', 'LBO')]: { fare: 4.5, minutes: 75 } };
  const ranked = core.rankStations(STATIONS, trip, known);
  assert.strictEqual(ranked[0].station.crs, 'LBO');
  assert.ok(ranked[0].legs[0].fareIsReal);
  assert.ok(ranked[0].allFaresReal);
});

test('hidden stations are left out', () => {
  const ranked = core.rankStations(STATIONS, trip, {}, ['LEI']);
  assert.ok(!ranked.some((r) => r.station.crs === 'LEI'));
});

test('National Rail link carries stations and time', () => {
  const url = core.nationalRailUrl('STP', 'LBO', new Date(2026, 9, 31, 8, 40));
  assert.match(url, /origin=STP/);
  assert.match(url, /destination=LBO/);
  assert.match(url, /leavingDate=311026/);
  assert.match(url, /leavingHour=08&leavingMin=30/);
});
