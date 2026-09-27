import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../src/analysis.worker.js',import.meta.url),'utf8');
function analyze(samples,sampleRate){let result;const ctx={self:{postMessage:r=>{result=r;}},Float32Array,Math,Array,Error};vm.runInNewContext(code,ctx);ctx.self.onmessage({data:{samples,sampleRate,title:'Test'}});return result;}
test('worker estimates a 120 BPM click track and creates usable difficulty levels',()=>{
  const sr=11025;const samples=new Float32Array(sr*12);
  for(let beat=.5;beat<11.5;beat+=.5){for(let i=0;i<500;i++)samples[Math.floor(beat*sr)+i]=Math.sin(2*Math.PI*150*i/sr)*Math.exp(-i/80);}
  const result=analyze(samples,sr);assert.ok(!result.error,result.error);assert.ok(Math.abs(result.bpm-120)<3);assert.ok(result.charts.easy.length<result.charts.medium.length);assert.ok(result.charts.medium.length>=19);
});
test('silent audio returns a helpful failure instead of invented notes',()=>{
  const result=analyze(new Float32Array(11025*10),11025);assert.match(result.error,/silent/);
});
