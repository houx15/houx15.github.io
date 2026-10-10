import fs from 'node:fs';
const portfolio=JSON.parse(fs.readFileSync(new URL('./portfolio.json',import.meta.url),'utf8'));
// Radii encode two named categories only; they are not proficiency scores.
const radii={strength:100,less:52};
function point(index,radius){const angle=(index*360/portfolio.domains.length-90)*Math.PI/180;return {x:150+Math.cos(angle)*radius,y:140+Math.sin(angle)*radius};}
const points=values=>values.map((radius,index)=>{const p=point(index,radius);return `${p.x},${p.y}`;}).join(' ');
export default {
 rings:Object.entries(radii).map(([band,radius])=>({band,points:points(portfolio.domains.map(()=>radius))})),
 axes:portfolio.domains.map((label,index)=>({label,band:portfolio.abilityBands[index],end:point(index,100),labelPoint:point(index,120)})),
 initialPoints:points(portfolio.abilityBands.map(band=>radii[band]))
};
