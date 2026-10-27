// Meeting-station logic. Pure functions, no DOM, so it runs in the browser and in Node tests.
//
// The problem: a driver and one or more train travellers are all heading to the same place.
// The driver picks the travellers up at a station on the way. Which station makes the trip
// cheapest overall, counting train fares, the driver's detour and everyone's time?
//
// Without a licensed fares/timetable feed, train times and fares here are estimates from
// distance. They're for shortlisting. Real prices the user enters always replace them.

(function (root) {
  const ROAD_FACTOR = 1.25;      // road miles per straight-line mile
  const DRIVE_MPH = 52;          // average speed over a mostly-motorway trip
  const RAIL_FACTOR = 1.15;      // rail miles per straight-line mile
  const RAIL_MPH = 90;           // average speed on a direct intercity train
  const RAIL_OVERHEAD_MIN = 5;   // stops, slow running in and out of stations
  const PICKUP_MILES = 3;        // leaving the main road to reach a station and getting back on

  const DEFAULTS = {
    maxDetourMinutes: 30,
    fuelPerMile: 0.18,          // £ per mile of extra driving
    driverTimePerHour: 10,      // £ an hour of the driver's detour is worth
    travellerTimePerHour: 10,   // £ an hour of each traveller's train time is worth
    limit: 12,
  };

  function haversineMiles(a, b) {
    const R = 3958.8;
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad;
    const dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function driveEstimate(a, b) {
    const miles = haversineMiles(a, b) * ROAD_FACTOR;
    return { miles, minutes: (miles / DRIVE_MPH) * 60 };
  }

  function trainEstimate(a, b) {
    const miles = haversineMiles(a, b) * RAIL_FACTOR;
    return {
      minutes: RAIL_OVERHEAD_MIN + (miles / RAIL_MPH) * 60,
      // Rough fit to UK fares: cheap Advance singles bottom out around £5,
      // longer trips run about 16p a mile.
      fare: 5 + miles * 0.16,
    };
  }

  // Extra miles and minutes the driver spends going via `stop` instead of straight there.
  function detour(from, stop, to) {
    const direct = driveEstimate(from, to);
    const leg1 = driveEstimate(from, stop);
    const leg2 = driveEstimate(stop, to);
    // A station at the destination itself costs nothing extra; anywhere else does.
    const pickup = haversineMiles(stop, to) < 1 ? 0 : PICKUP_MILES;
    const pickupMinutes = (pickup / 25) * 60;
    return {
      miles: Math.max(0, leg1.miles + leg2.miles - direct.miles) + pickup,
      minutes: Math.max(0, leg1.minutes + leg2.minutes - direct.minutes) + pickupMinutes,
    };
  }

  // stations: [{ name, crs, lat, lng }]
  // trip: { driver: {lat,lng}, destination: {lat,lng}, travellers: [{ name, origin: {lat,lng,crs} }] }
  // known: { [`${originCrs}-${stationCrs}`]: { fare?, minutes? } } real figures the user entered
  // hidden: set or array of CRS codes the user ruled out
  function rankStations(stations, trip, known = {}, hidden = [], options = {}) {
    const opts = { ...DEFAULTS, ...options };
    const hiddenSet = new Set(hidden);
    const results = [];

    for (const station of stations) {
      if (hiddenSet.has(station.crs)) continue;
      const d = detour(trip.driver, station, trip.destination);
      if (d.minutes > opts.maxDetourMinutes) continue;

      let fares = 0;
      let travelMinutes = 0;
      let allKnown = true;
      const legs = trip.travellers.map((t) => {
        const est = trainEstimate(t.origin, station);
        const real = known[legKey(t.origin.crs, station.crs)] || {};
        const fare = isNum(real.fare) ? real.fare : est.fare;
        const minutes = isNum(real.minutes) ? real.minutes : est.minutes;
        if (!isNum(real.fare)) allKnown = false;
        fares += fare;
        travelMinutes += minutes;
        return {
          traveller: t.name,
          fromCrs: t.origin.crs,
          fare, fareIsReal: isNum(real.fare),
          minutes, minutesIsReal: isNum(real.minutes),
        };
      });

      const driverCost = d.miles * opts.fuelPerMile + (d.minutes / 60) * opts.driverTimePerHour;
      const travellerTimeCost = (travelMinutes / 60) * opts.travellerTimePerHour;
      results.push({
        station,
        legs,
        detourMiles: d.miles,
        detourMinutes: d.minutes,
        fares,
        driverCost,
        travellerTimeCost,
        total: fares + driverCost + travellerTimeCost,
        allFaresReal: allKnown,
      });
    }

    results.sort((a, b) => a.total - b.total);
    return results.slice(0, opts.limit);
  }

  function legKey(fromCrs, toCrs) {
    return `${fromCrs}-${toCrs}`;
  }

  function isNum(x) {
    return typeof x === 'number' && Number.isFinite(x);
  }

  // Accepts a station name, a CRS code or "lat, lng" (as copied from Google Maps).
  function parsePlace(text, stations) {
    const s = String(text || '').trim();
    const coords = s.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (coords) {
      const lat = Number(coords[1]);
      const lng = Number(coords[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng, crs: nearestStation({ lat, lng }, stations).crs };
      }
      return null;
    }
    const lower = s.toLowerCase();
    return stations.find((st) => st.name.toLowerCase() === lower) ||
      stations.find((st) => st.crs.toLowerCase() === lower) ||
      null;
  }

  function nearestStation(point, stations) {
    let best = null;
    let bestMiles = Infinity;
    for (const st of stations) {
      const m = haversineMiles(point, st);
      if (m < bestMiles) { best = st; bestMiles = m; }
    }
    return best;
  }

  // National Rail's journey planner, prefilled. Every retailer (Trainline, TrainPal,
  // operator sites) sells the same industry fares, so this shows the base price.
  function nationalRailUrl(fromCrs, toCrs, when) {
    const p = new URLSearchParams({ type: 'single', origin: fromCrs, destination: toCrs, leavingType: 'departing', adults: '1', extraTime: '0' });
    if (when instanceof Date && !isNaN(when)) {
      const pad = (n) => String(n).padStart(2, '0');
      p.set('leavingDate', pad(when.getDate()) + pad(when.getMonth() + 1) + String(when.getFullYear()).slice(2));
      p.set('leavingHour', pad(when.getHours()));
      p.set('leavingMin', pad(Math.floor(when.getMinutes() / 15) * 15));
    }
    return `https://www.nationalrail.co.uk/journey-planner/?${p}#O`;
  }

  function drivingUrl(from, via, to) {
    const ll = (p) => `${p.lat},${p.lng}`;
    const p = new URLSearchParams({ api: '1', origin: ll(from), destination: ll(to), waypoints: ll(via), travelmode: 'driving' });
    return `https://www.google.com/maps/dir/?${p}`;
  }

  const api = { DEFAULTS, haversineMiles, driveEstimate, trainEstimate, detour, rankStations, legKey, parsePlace, nearestStation, nationalRailUrl, drivingUrl };
  if (typeof module !== 'undefined') module.exports = api;
  else root.MeetCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
