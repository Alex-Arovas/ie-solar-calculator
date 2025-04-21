import React, { useState } from 'react';

export default function SolarCalculator() {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [devices, setDevices] = useState(1);
  const [days, setDays] = useState(1);
  const [mode, setMode] = useState('battery-solar');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSunHours = async () => {
    setLoading(true);
    try {
      const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=SI_EF_TILTED_SURFACE&community=RE&longitude=${lon}&latitude=${lat}&format=JSON`;
      const res = await fetch(url);
      const data = await res.json();
      const monthly = data.properties.parameter.SI_EF_TILTED_SURFACE;
      const values = Object.values(monthly);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return avg;
    } catch (err) {
      alert('Failed to fetch solar data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculate = async () => {
    const avgSunHours = await fetchSunHours();
    if (!avgSunHours) return;

    const powerW = 10; // per device
    const totalWh = powerW * 24 * days * devices;

    const batteryWh = totalWh; // Battery-only or backup size
    const batteryAh = batteryWh / 12; // assuming 12V battery

    let panelW = 0;
    if (mode === 'battery-solar') {
      panelW = totalWh / (avgSunHours * days * 0.7); // 0.7 factor for losses
    }

    setResult({ batteryWh, batteryAh, panelW, avgSunHours });
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 text-center">
      <h1 className="text-2xl font-bold">🔆 Solar Calculator</h1>

      <div className="grid grid-cols-2 gap-2">
        <input type="number" placeholder="Latitude" value={lat} onChange={e => setLat(e.target.value)} className="p-2 border rounded" />
        <input type="number" placeholder="Longitude" value={lon} onChange={e => setLon(e.target.value)} className="p-2 border rounded" />
        <input type="number" placeholder="# Devices" value={devices} onChange={e => setDevices(e.target.value)} className="p-2 border rounded" />
        <input type="number" placeholder="# Days" value={days} onChange={e => setDays(e.target.value)} className="p-2 border rounded" />
      </div>

      <select value={mode} onChange={e => setMode(e.target.value)} className="p-2 border rounded w-full">
        <option value="battery-only">🔋 Battery Only</option>
        <option value="battery-solar">🔋 Battery + Solar Panel</option>
      </select>

      <button onClick={calculate} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        {loading ? 'Calculating...' : 'Calculate'}
      </button>

      {result && (
        <div className="mt-4 text-left">
          <p><strong>Average Sun Hours:</strong> {result.avgSunHours} hrs/day</p>
          <p><strong>Total Battery Required:</strong> {result.batteryWh.toFixed(1)} Wh ({result.batteryAh.toFixed(1)} Ah @12V)</p>
          {mode === 'battery-solar' && (
            <p><strong>Solar Panel Needed:</strong> {result.panelW.toFixed(1)} W</p>
          )}
        </div>
      )}
    </div>
  );
}
