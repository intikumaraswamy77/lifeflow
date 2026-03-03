const express = require('express');
const { auth, checkUserType } = require('../middleware/auth');

// Node 18+ has global fetch. If older Node is used, install node-fetch.

const router = express.Router();

// Simple haversine distance in meters
function haversine(a, b) {
  const R = 6371000; // meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const la1 = toRad(lat1);
  const la2 = toRad(lat2);
  const sinDlat = Math.sin(dLat / 2);
  const sinDlon = Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(sinDlat * sinDlat + Math.cos(la1) * Math.cos(la2) * sinDlon * sinDlon));
  return R * c;
}

// Greedy nearest-neighbor ordering for waypoints
function nearestNeighbor(start, points) {
  const remaining = points.slice();
  const order = [];
  let current = start;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    order.push(remaining[bestIdx]);
    current = remaining[bestIdx];
    remaining.splice(bestIdx, 1);
  }
  return order;
}

// POST /api/routes/geocode { address, limit }
router.post('/geocode', auth, checkUserType(['bloodbank']), async (req, res) => {
  try {
    const { address, limit = 1 } = req.body || {};
    if (!address || !address.trim()) return res.status(400).json({ success: false, message: 'Address is required' });

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('q', address);
    url.searchParams.set('limit', String(limit));

    const resp = await fetch(url, {
      headers: { 'User-Agent': 'LifeFlow/1.0 (blood-bank-dashboard)' }
    });
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(502).json({ success: false, message: `Geocoding failed: ${text}` });
    }
    const data = await resp.json();
    const results = (Array.isArray(data) ? data : []).map((r) => ({
      displayName: r.display_name,
      coordinates: [Number(r.lon), Number(r.lat)],
    }));
    return res.json({ success: true, results });
  } catch (err) {
    console.error('Geocode error:', err);
    return res.status(500).json({ success: false, message: 'Server geocode error' });
  }
});

// POST /api/routes/optimize { startLocation, endLocation, waypoints }
router.post('/optimize', auth, checkUserType(['bloodbank']), async (req, res) => {
  try {
    const { startLocation, endLocation, waypoints, profile = 'driving-car' } = req.body || {};
    if (!startLocation || !endLocation || !Array.isArray(waypoints) || waypoints.length === 0) {
      return res.status(400).json({ success: false, message: 'startLocation, endLocation, and waypoints are required' });
    }

    // Order waypoints greedily
    const ordered = nearestNeighbor(startLocation, waypoints);

    // Build full path: start -> ...ordered -> end
    const path = [startLocation, ...ordered, endLocation];

    // Compute distance and simple instructions
    let distance = 0;
    const instructions = [];
    for (let i = 0; i < path.length - 1; i++) {
      const seg = haversine(path[i], path[i + 1]);
      distance += seg;
      instructions.push({
        instruction: `Proceed to waypoint ${i + 1}`,
        distance: seg,
        duration: seg / (40_000 / 3600), // assume 40 km/h average -> m/s
      });
    }
    // Total duration with same average speed
    const duration = distance / (40_000 / 3600);

    return res.json({
      success: true,
      route: {
        profile,
        distance,
        duration,
        instructions,
        geometry: path,
      },
    });
  } catch (err) {
    console.error('Optimize route error:', err);
    return res.status(500).json({ success: false, message: 'Server optimize error' });
  }
});

module.exports = router;
