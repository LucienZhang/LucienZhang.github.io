// Geometry checks for the final ribbon logo; the two intentional cuts are corners.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const svg=readFileSync(new URL('../docs/.vuepress/public/logo.svg',import.meta.url),'utf8');
const tokens=svg.match(/\bd="([^"]+)"/)[1].match(/[MLCZ]|-?\d+(?:\.\d+)?/g);
assert.equal(tokens.shift(),'M');let p=[+tokens.shift(),+tokens.shift()];const start=p,items=[];
while(tokens[0]!=='Z') {const command=tokens.shift();assert.ok(['L','C'].includes(command));const points=Array.from({length:command==='C'?3:1},()=>[+tokens.shift(),+tokens.shift()]);items.push({command,points:[p,...points]});p=points.at(-1);}
assert.deepEqual(tokens,['Z']);assert.deepEqual(p,start);
const curves=items.filter(s=>s.command==='C').map(s=>s.points);
assert.equal(curves.length,16);assert.equal(items.filter(s=>s.command==='L').length,2);
const key=p=>JSON.stringify(p),all=new Set(curves.flatMap(p=>[key(p),key([...p].reverse())]));
for(const c of curves)assert.ok(all.has(key(c.map(([x,y])=>[-x,-y]))),'Central symmetry');
// The eight inner/outer quadrant arcs share exact reflected control points.
for(const index of [1,2,5,6,9,10,13,14])for(const [sx,sy] of [[-1,1],[1,-1]])assert.ok(all.has(key(curves[index].map(([x,y])=>[sx*x,sy*y]))),'Lobe arc reflection');
const derivative=(c,end)=>{const [a,b,d,e]=c;return end?e.map((v,i)=>3*(v-d[i])):b.map((v,i)=>3*(v-a[i]));};
const curvature=(c,end)=>{const [a,b,d,e]=c,v=derivative(c,end);const w=end?e.map((x,i)=>6*(x-2*d[i]+b[i])):d.map((x,i)=>6*(x-2*b[i]+a[i]));return(v[0]*w[1]-v[1]*w[0])/Math.hypot(...v)**3;};
let count=0,maxAngle=0,maxCurvatureJump=0;
for(let i=0;i<items.length;i++){const a=items[i],b=items[(i+1)%items.length];if(a.command!=='C'||b.command!=='C')continue;assert.deepEqual(a.points.at(-1),b.points[0]);const v=derivative(a.points,true),w=derivative(b.points,false);const cross=v[0]*w[1]-v[1]*w[0];const dot=v[0]*w[0]+v[1]*w[1];const angle=Math.abs(Math.atan2(cross,dot)),jump=Math.abs(curvature(a.points,true)-curvature(b.points,false));assert.ok(angle<1e-6);assert.ok(jump<1e-8);maxAngle=Math.max(maxAngle,angle);maxCurvatureJump=Math.max(maxCurvatureJump,jump);count++;}
assert.equal(count,14);
const cuts=items.filter(s=>s.command==='L').map(s=>s.points);
assert.deepEqual(cuts[0].map(([x,y])=>[-x,-y]),cuts[1]);
console.log(JSON.stringify({curves:16,cuts:2,smoothJoins:count,maxTangentAngleRadians:maxAngle,maxCurvatureJump,centralSymmetry:true,innerOuterArcReflections:true},null,2));
