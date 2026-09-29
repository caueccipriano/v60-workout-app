/*
 * Phase progress summary — local-only read model.
 * No changes to workouts, loads, recovery advice, or persisted records.
 * Also exports to CommonJS for deterministic Node tests.
 */
(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TracoPhaseProgress = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';
  const DAY_MS = 86400000;
  function utcDayFromDate(date) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }
  function utcDayFromKey(key) {
    const match = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(String(key || ''));
    if (!match) return null;
    const day = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Date(day).toISOString().slice(0, 10) === key ? day : null;
  }
  function summarize(phase, history, now = new Date()) {
    const start = utcDayFromKey(phase && phase.start);
    const length = Number(phase && phase.weeks);
    const limit = Number.isInteger(length) && length > 0 && length <= 12 ? length : 0;
    const reference = now instanceof Date ? now : new Date(now);
    if (start === null || !limit || !Number.isFinite(reference.getTime())) return [];
    const today = utcDayFromDate(reference);
    const weeks = Array.from({length: limit}, (_, index) => ({
      week: index + 1,
      completed: 0,
      volumeKg: 0,
      partial: false,
      status: today < start + index * 7 * DAY_MS
        ? 'future'
        : today >= start + (index + 1) * 7 * DAY_MS ? 'past' : 'current'
    }));
    const seen = new Set();
    for (const entry of Array.isArray(history) ? history : []) {
      const stamp = Number(entry && entry.startedAt);
      if (!entry || !entry.finishedAt || !Number.isFinite(stamp) || stamp <= 0) continue;
      // Imported backups can contain duplicate IDs. Count each session once.
      if (entry.id != null) {
        const id = String(entry.id);
        if (seen.has(id)) continue;
        seen.add(id);
      }
      const local = new Date(stamp);
      if (!Number.isFinite(local.getTime())) continue;
      const sessionDay = utcDayFromDate(local);
      const index = Math.floor((sessionDay - start) / (7 * DAY_MS));
      if (index < 0 || index >= limit || sessionDay > today) continue;
      const week = weeks[index];
      week.completed++;
      if (entry.excludeFromVolume) {
        week.partial = true;
        continue;
      }
      for (const exercise of Array.isArray(entry.exercises) ? entry.exercises : []) {
        for (const set of Array.isArray(exercise.sets) ? exercise.sets : []) {
          if (!set.done || set.skipped) continue;
          const load = Number(set.weight);
          const reps = Number(set.reps);
          if (Number.isFinite(load) && load > 0 && Number.isFinite(reps) && reps > 0) {
            week.volumeKg += load * reps;
          } else {
            week.partial = true;
          }
        }
      }
    }
    return weeks;
  }
  return {summarize};
});
