const test = require('node:test');
const assert = require('node:assert/strict');
const {summarize} = require('../traco-phase-progress.js');
const at = date => new Date(date + 'T12:00:00').getTime();
const record = (date, id, opts={}) => ({
  id, startedAt: at(date), finishedAt: at(date) + 120000, exercises: [
    {sets: [{done:true, weight:10, reps:10}]}
  ], ...opts
});

test('groups finished sessions into phase weeks without mutating history', () => {
  const history=[record('2026-09-01','a'),record('2026-09-08','b')];
  const original=JSON.stringify(history);
  const weeks=summarize({start:'2026-09-01',weeks:3},history,new Date('2026-09-15T12:00:00'));
  assert.deepEqual(weeks.map(w=>w.completed),[1,1,0]);
  assert.deepEqual(weeks.map(w=>w.volumeKg),[100,100,0]);
  assert.equal(JSON.stringify(history),original);
});

test('ignores pre-phase, future, unfinished and duplicate entries', () => {
  const history=[
    record('2026-08-31','old'),record('2026-09-01','same'),record('2026-09-01','same'),
    {...record('2026-09-02','draft'),finishedAt:null},record('2026-09-18','future')
  ];
  const weeks=summarize({start:'2026-09-01',weeks:3},history,new Date('2026-09-10T12:00:00'));
  assert.deepEqual(weeks.map(w=>w.completed),[1,0,0]);
});

test('reported sessions remain counted but never invent tonnage', () => {
  const weeks=summarize({start:'2026-09-01',weeks:1},
    [record('2026-09-02','manual',{excludeFromVolume:true})],
    new Date('2026-09-05T12:00:00'));
  assert.equal(weeks[0].completed,1);
  assert.equal(weeks[0].volumeKg,0);
  assert.equal(weeks[0].partial,true);
});

test('rejects invalid dates and absurdly long imported phases', () => {
  assert.deepEqual(summarize({start:'2026-02-30',weeks:8},[]),[]);
  assert.deepEqual(summarize({start:'2026-09-01',weeks:100},[]),[]);
});
