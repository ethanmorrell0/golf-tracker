# Pickup Station Finder

One person drives, the others come by train, and you all end up at the same place. This finds the
station on the driver's way where train fares, the driver's detour and everyone's time add up cheapest.

Built for trips like: driver from Leeds, friend from London, golf near Leicester. Leicester itself is
out of the way, so which station near the M1 should the friend get a train to?

## Using it

Open `index.html` in a browser (no build step, no server needed).

1. Enter where everyone ends up, where the driver starts, and each train traveller's station.
   A place that isn't a station (a golf club) can be entered as `lat, lng` copied from Google Maps.
2. The app shortlists stations within the driver's detour limit, ranked by an estimated trip cost.
3. Tap **Check fares** to open National Rail with the journey filled in, and type the real fare
   (and journey time) back in. Real figures replace estimates and re-rank the list.
4. **Rule out** stations that don't work (no direct trains, nowhere to stop).

Trip cost = train fares + fuel for the extra miles + the driver's extra time + everyone's train time,
with the £ values adjustable under *How costs are weighed*.

## Where the numbers come from

| Figure | Source now | Proper source later |
|---|---|---|
| Station locations | uk-railway-stations dataset (ODbL), bundled | — |
| Driver detour | Straight-line distance × road factor | A routing API (OSRM, Google, Mapbox) |
| Train time | Distance-based estimate | Timetable data (Network Rail / Rail Data Marketplace) |
| Fare | Distance-based estimate, then the real fare you type in | RDG fares feed via Rail Data Marketplace, or a licensed retail API |

Trainline, TrainPal and train company sites don't offer public price APIs, and their terms forbid
scraping. They all sell the same industry fares anyway; retailers differ mainly on booking fees and
split ticketing. The realistic route to automatic prices is the official fares data on the
[Rail Data Marketplace](https://raildata.org.uk/) (free account) for walk-up fares, and a retail
partner API for live Advance fares.

## Tests

```
node --test train-finder/test/*.test.js
```
