/**
 * learningAgent.js — WrapMind Real-time Learning Agent
 *
 * Records every estimate outcome (approved/declined/converted) to localStorage,
 * then derives smart defaults and insights from accumulated data.
 *
 * Pure utility module — no React, no context. Direct localStorage access.
 * Called by EstimateContext when estimate status changes to a terminal state.
 */

const STORAGE_KEY = 'wm-learning-v1';
const MAX_RECORDS = 500; // Rolling window — older records pruned

// ─── Data shape ──────────────────────────────────────────────────────────────
// {
//   records: [{
//     id, ts, vehicleType, vehicleLabel, package, material, total,
//     laborHours, sqFt, outcome, daysSinceCreated
//   }]
// }

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function inferVehicleType(label = '') {
  const l = label.toLowerCase();
  if (l.includes('truck') || l.includes('f-1') || l.includes('f1') || l.includes('sierra') || l.includes('ram') || l.includes('tundra') || l.includes('tacoma')) return 'truck';
  if (l.includes('van') || l.includes('transit') || l.includes('sprinter') || l.includes('caravan')) return 'van';
  if (l.includes('suv') || l.includes('tahoe') || l.includes('suburban') || l.includes('navigator') || l.includes('expedition') || l.includes('pathfinder') || l.includes('4runner') || l.includes('highlander') || l.includes('explorer')) return 'suv';
  if (l.includes('porsche') || l.includes('ferrari') || l.includes('lambo') || l.includes('mclaren') || l.includes('corvette') || l.includes('mustang') || l.includes('camaro') || l.includes('bmw m3') || l.includes('bmw m4')) return 'performance';
  return 'sedan';
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mode(arr) {
  if (!arr.length) return null;
  const freq = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record an estimate outcome when status changes to a terminal state.
 * @param {object} estimate — full estimate object from context
 * @param {string} outcome — 'approved' | 'declined' | 'converted'
 */
export function recordEstimateOutcome(estimate, outcome) {
  try {
    const data = load();
    const records = Array.isArray(data.records) ? data.records : [];

    const daysSinceCreated = estimate.createdAt
      ? Math.floor((Date.now() - new Date(estimate.createdAt)) / 86400000)
      : null;

    const record = {
      id:              estimate.id || `r-${Date.now()}`,
      ts:              Date.now(),
      vehicleType:     inferVehicleType(estimate.vehicleLabel),
      vehicleLabel:    estimate.vehicleLabel || '',
      package:         estimate.package || estimate.packageName || '',
      material:        estimate.material || '',
      materialColor:   estimate.materialColor || '',
      total:           typeof estimate.total === 'number' ? estimate.total : 0,
      laborHours:      typeof estimate.laborHours === 'number' ? estimate.laborHours : null,
      sqFt:            typeof estimate.sqFt === 'number' ? estimate.sqFt : null,
      outcome,
      daysSinceCreated,
    };

    // Rolling window: keep only most recent MAX_RECORDS
    const updated = [record, ...records].slice(0, MAX_RECORDS);
    save({ ...data, records: updated });
  } catch (e) {
    // Learning failures must never affect main app behavior
    console.warn('[WrapMind Learn] recordEstimateOutcome failed:', e.message);
  }
}

/**
 * Get smart defaults for a new estimate based on historical data.
 * @param {string} vehicleType — 'sedan' | 'suv' | 'truck' | 'van' | 'performance'
 * @param {string} packageName — service package name
 * @returns {{ suggestedPrice: number|null, suggestedLaborHours: number|null, commonMaterial: string|null, sampleSize: number }}
 */
export function getSmartDefaults(vehicleType, packageName) {
  try {
    const data = load();
    const records = (data.records || []).filter(r =>
      r.outcome !== 'declined' &&
      (!vehicleType || r.vehicleType === vehicleType) &&
      (!packageName || r.package === packageName)
    );

    if (!records.length) return { suggestedPrice: null, suggestedLaborHours: null, commonMaterial: null, sampleSize: 0 };

    const prices      = records.map(r => r.total).filter(v => v > 0);
    const laborHours  = records.map(r => r.laborHours).filter(v => v != null && v > 0);
    const materials   = records.map(r => r.material).filter(Boolean);

    return {
      suggestedPrice:      prices.length      ? Math.round(median(prices))     : null,
      suggestedLaborHours: laborHours.length  ? Math.round(median(laborHours)) : null,
      commonMaterial:      materials.length   ? mode(materials)                : null,
      sampleSize:          records.length,
    };
  } catch (e) {
    console.warn('[WrapMind Learn] getSmartDefaults failed:', e.message);
    return { suggestedPrice: null, suggestedLaborHours: null, commonMaterial: null, sampleSize: 0 };
  }
}

/**
 * Get human-readable insights from accumulated learning data.
 * @returns {string[]} Array of insight strings (empty array if no data yet)
 */
export function getLearningInsights() {
  try {
    const data = load();
    const records = data.records || [];
    if (records.length < 3) return [];

    const insights = [];

    // Overall stats
    const total     = records.length;
    const approved  = records.filter(r => r.outcome === 'approved' || r.outcome === 'converted').length;
    const approvalRate = Math.round((approved / total) * 100);
    insights.push(`${approvalRate}% approval rate across ${total} estimate${total > 1 ? 's' : ''}`);

    // By vehicle type
    const byType = {};
    records.forEach(r => {
      if (!byType[r.vehicleType]) byType[r.vehicleType] = { prices: [], count: 0, approved: 0 };
      byType[r.vehicleType].count++;
      if (r.total > 0) byType[r.vehicleType].prices.push(r.total);
      if (r.outcome !== 'declined') byType[r.vehicleType].approved++;
    });
    Object.entries(byType)
      .filter(([, v]) => v.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .forEach(([type, v]) => {
        const avg = v.prices.length ? Math.round(median(v.prices)) : null;
        const rate = Math.round((v.approved / v.count) * 100);
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        if (avg) insights.push(`${label}s avg $${avg.toLocaleString()} (${rate}% approval, ${v.count} jobs)`);
      });

    // By package
    const byPkg = {};
    records.forEach(r => {
      if (!r.package) return;
      if (!byPkg[r.package]) byPkg[r.package] = { prices: [], count: 0 };
      byPkg[r.package].count++;
      if (r.total > 0) byPkg[r.package].prices.push(r.total);
    });
    const topPkg = Object.entries(byPkg).sort((a, b) => b[1].count - a[1].count)[0];
    if (topPkg && topPkg[1].count >= 2) {
      const avg = Math.round(median(topPkg[1].prices));
      insights.push(`"${topPkg[0]}" is your most common service — avg $${avg.toLocaleString()}`);
    }

    // Response time insight
    const times = records.filter(r => r.daysSinceCreated != null).map(r => r.daysSinceCreated);
    if (times.length >= 3) {
      const avgDays = Math.round(median(times));
      insights.push(`Estimates typically close in ${avgDays} day${avgDays !== 1 ? 's' : ''}`);
    }

    // Top material
    const allMats = records.map(r => r.material).filter(Boolean);
    const topMat  = mode(allMats);
    if (topMat) {
      const matCount = allMats.filter(m => m === topMat).length;
      insights.push(`Most used material: ${topMat} (${matCount} job${matCount > 1 ? 's' : ''})`);
    }

    return insights;
  } catch (e) {
    console.warn('[WrapMind Learn] getLearningInsights failed:', e.message);
    return [];
  }
}

/**
 * Get raw learning stats for display in a dashboard widget.
 */
export function getLearningStats() {
  try {
    const data = load();
    const records = data.records || [];
    const total     = records.length;
    const approved  = records.filter(r => r.outcome !== 'declined').length;
    const converted = records.filter(r => r.outcome === 'converted').length;
    const prices    = records.map(r => r.total).filter(v => v > 0);
    return {
      totalRecords:  total,
      approvedCount: approved,
      convertedCount: converted,
      declinedCount:  total - approved,
      avgJobValue:   prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      insights:      getLearningInsights(),
    };
  } catch {
    return { totalRecords: 0, approvedCount: 0, convertedCount: 0, declinedCount: 0, avgJobValue: 0, insights: [] };
  }
}

/**
 * Clear all learning data (for testing/reset).
 */
export function clearLearningData() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
