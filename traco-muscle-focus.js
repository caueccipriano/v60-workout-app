/*
 * Read-only focus of the planned workout. This is educational UI, not a
 * recovery prescription and not a measurement of individual muscle effort.
 * Existing history, progression and session storage remain unchanged.
 */
(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TracoMuscleFocus = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';
  const groups = Object.freeze({
    seg: ['peito', 'ombros', 'tríceps'],
    ter: ['quadríceps', 'posterior', 'glúteos', 'panturrilhas'],
    qua: ['costas', 'bíceps', 'abdômen'],
    qui: ['peito', 'ombros', 'braços'],
    sex: ['posterior', 'costas', 'ombros']
  });

  function forWorkout(workoutId) {
    // Return a copy so downstream UI cannot mutate the plan.
    return Array.isArray(groups[workoutId]) ? [...groups[workoutId]] : [];
  }

  function recentSessions(history, workoutId, now = new Date(), windowDays = 14) {
    const end = now instanceof Date ? now.getTime() : new Date(now).getTime();
    if (!Number.isFinite(end) || !Number.isInteger(windowDays) || windowDays < 1 || windowDays > 90) return 0;
    if (!groups[workoutId] || !Array.isArray(history)) return 0;
    const start = end - windowDays * 86400000;
    const seen = new Set();
    let count = 0;
    for (const session of history) {
      const startedAt = Number(session?.startedAt);
      const finishedAt = Number(session?.finishedAt);
      if (!session || session.workoutId !== workoutId || !Number.isFinite(startedAt) ||
          !Number.isFinite(finishedAt) || startedAt < start || startedAt > end ||
          finishedAt < startedAt || finishedAt > end) continue;
      if (session.id != null) {
        const key = String(session.id);
        if (seen.has(key)) continue;
        seen.add(key);
      }
      count++;
    }
    return count;
  }

  return {forWorkout, recentSessions};
});
