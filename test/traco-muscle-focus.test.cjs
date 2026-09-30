const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const focus = require('../traco-muscle-focus.js');

test('planned focus includes known groups but does not expose mutable map', () => {
  const chest = focus.forWorkout('seg');
  assert.deepEqual(chest, ['peito', 'ombros', 'tríceps']);
  chest.push('wrong');
  assert.deepEqual(focus.forWorkout('seg'), ['peito', 'ombros', 'tríceps']);
  assert.deepEqual(focus.forWorkout('unknown'), []);
});

test('counts unique finished sessions in last 14 days, never future or invalid drafts', () => {
  const now = new Date('2026-09-30T16:00:00Z');
  const start = Date.parse('2026-09-28T16:00:00Z');
  const valid = {id:'A', workoutId:'seg', startedAt:start, finishedAt:start+3600000};
  const history = [valid,{...valid},{id:'B',workoutId:'seg',startedAt:start},
    {id:'C',workoutId:'qua',startedAt:start,finishedAt:start+3600000},
    {id:'D',workoutId:'seg',startedAt:Date.parse('2026-09-01T15:00:00Z'),finishedAt:Date.parse('2026-09-01T16:00:00Z')},
    {id:'E',workoutId:'seg',startedAt:Date.parse('2026-10-01T15:00:00Z'),finishedAt:Date.parse('2026-10-01T16:00:00Z')}];
  assert.equal(focus.recentSessions(history, 'seg', now), 1);
  assert.equal(focus.recentSessions(history, 'qua', now), 1);
  assert.equal(focus.recentSessions(history, 'wrong', now), 0);
  assert.equal(focus.recentSessions(null, 'seg', now), 0);
  assert.equal(focus.recentSessions(history, 'seg', new Date('invalid')), 0);
});

test('home page wiring and offline precache remain version-aligned', () => {
  const root = path.join(__dirname,'..');
  const index = fs.readFileSync(path.join(root,'index.html'),'utf8');
  const sw = fs.readFileSync(path.join(root,'sw.js'),'utf8');
  const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
  const build = JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).build;
  const suffix = build.match(/-v(\d+)$/)?.[1];
  assert.ok(suffix);
  assert.ok(index.includes('traco-muscle-focus.js?v='+suffix));
  assert.ok(index.includes('traco-muscle-focus.css?v='+suffix));
  assert.ok(sw.includes("'./traco-muscle-focus.js'"));
  assert.ok(sw.includes("'./traco-muscle-focus.css'"));
  assert.ok(app.includes('TracoMuscleFocus'));
});
