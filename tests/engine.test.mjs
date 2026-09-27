import test from 'node:test';
import assert from 'node:assert/strict';
import { RhythmEngine, accuracy, freshStats } from '../src/engine.js';
import { readFileSync } from 'node:fs';
globalThis.Image = class {};
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};

function fixture(notes) {
  const e = new RhythmEngine();
  e.setTrack({ duration:10, charts:{medium:notes}, beats:[] });
  e.state='playing'; e.ctx={currentTime:1,state:'running'}; e.startedAt=0;
  return e;
}
test('precise matching hits score and increase combo; a judged note cannot be hit twice',()=>{
  const e=fixture([{time:1,type:'don'}]); e.hit('don','f'); e.hit('don','f');
  assert.equal(e.stats.score,1000);assert.equal(e.stats.perfect,1);assert.equal(e.stats.combo,1);
});
test('a rim hit cannot satisfy a center note and resets combo',()=>{
  const e=fixture([{time:1,type:'don'}]); e.stats.combo=4;e.hit('ka','d');
  assert.equal(e.stats.score,0);assert.equal(e.stats.miss,1);assert.equal(e.stats.combo,0);
});
test('good window, timing offset and two-handed large-note bonus',()=>{
  const e=fixture([{time:1,type:'don',big:true}]);e.offset=80;e.ctx.currentTime=1.1;
  e.hit('don','f');e.ctx.currentTime=1.115;e.hit('don','j');assert.equal(e.stats.score,2000);
  const g=fixture([{time:.925,type:'ka'}]);g.hit('ka','d');assert.equal(g.stats.good,1);assert.equal(g.stats.score,500);
});
test('drumroll accepts repeated keys without inflating normal-note accuracy',()=>{
  const e=fixture([{time:.8,end:1.4,type:'roll'}]);e.hit('don','f');e.hit('ka','k');
  assert.equal(e.stats.score,200);assert.equal(e.stats.roll,2);assert.equal(e.stats.perfect,0);
});
test('paused game ignores scoring and preserves negative count-in position',async()=>{
  const e=fixture([{time:1,type:'don'}]); e.ctx.currentTime=4; e.startedAt=6;
  e.pause();assert.equal(e.position,-2);e.hit('don','f');assert.equal(e.stats.score,0);
  let scheduled;e.buffer={};e.ctx.createBufferSource=()=>({connect(){},start(...args){scheduled=args;}});
  await e.play();assert.deepEqual(scheduled,[6,0]);assert.equal(e.time(),-2);
});
test('misses are judged once; results occur at audio end',()=>{
  const e=fixture([{time:.5,type:'don'}]);e.animate(10);e.animate(20);assert.equal(e.stats.miss,1);
  let finished=false;e.onEnd=()=>{finished=true;};e.ctx.currentTime=10.4;e.animate(30);
  assert.equal(finished,true);assert.equal(e.state,'results');
});
test('accuracy includes misses and restart clears the run',()=>{
  assert.equal(accuracy({...freshStats(),perfect:2,good:2,miss:1}),60);
  const e=fixture([{time:1,type:'don'}]);e.hit('don','f');e.restart();assert.deepEqual(e.stats,freshStats());assert.equal(e.state,'ready');
});
test('soul penalties scale with chart length and close notes select the nearest target',()=>{
  const e=fixture([{time:.87,type:'ka'},{time:1.02,type:'don'}]);e.hit('don','f');
  assert.equal(e.stats.perfect,1);assert.equal(e.notes[0].judged,false);
  e.stats.soul=80;e.miss();assert.equal(e.stats.soul,0);
});
test('actual imported song has valid ordered charts of increasing difficulty',()=>{
  const chart=JSON.parse(readFileSync(new URL('../public/charts/default.json',import.meta.url)));
  assert.ok(chart.bpm>=60 && chart.bpm<=200);assert.ok(chart.duration>200);
  assert.ok(chart.charts.easy.length<chart.charts.medium.length);assert.ok(chart.charts.medium.length<chart.charts.hard.length);
  for(const notes of Object.values(chart.charts)) notes.forEach((n,i)=>{assert.ok(n.time>=0 && n.time<chart.duration);assert.ok(!i || n.time>notes[i-1].time);assert.ok(['don','ka','roll'].includes(n.type));if(n.end)assert.ok(n.end>n.time);});
});
