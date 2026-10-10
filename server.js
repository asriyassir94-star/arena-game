const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PAGE = String.raw`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Arena</title>
<style>
html,body{margin:0;height:100%;background:#111;overflow:hidden;touch-action:none}
canvas{width:100%;height:100%;display:block}
#hit{position:fixed;right:30px;bottom:40px;width:90px;height:90px;border-radius:50%;background:#e33;color:#fff;border:0;font-size:18px}
#joy{position:fixed;left:30px;bottom:40px;width:120px;height:120px;border-radius:50%;background:#ffffff22}
#st{position:absolute;left:40px;top:40px;width:40px;height:40px;border-radius:50%;background:#ffffff88}
</style></head><body>
<canvas id="c" width="800" height="500"></canvas>
<div id="joy"><div id="st"></div></div>
<button id="hit">DABZ</button>
<script src="/socket.io/socket.io.js"></script>
<script>
const socket=io(),ctx=document.getElementById('c').getContext('2d');
let P={},dir={dx:0,dy:0};
const nm=prompt('Smitek?')||'';if(nm)socket.emit('name',nm);
socket.on('state',p=>P=p);
const joy=document.getElementById('joy'),st=document.getElementById('st');
function jm(e){const t=e.touches[0],r=joy.getBoundingClientRect();
let x=t.clientX-(r.left+60),y=t.clientY-(r.top+60);const m=Math.hypot(x,y);
if(m>50){x=x/m*50;y=y/m*50}
st.style.left=40+x+'px';st.style.top=40+y+'px';dir={dx:x/50,dy:y/50}}
joy.addEventListener('touchstart',jm);
joy.addEventListener('touchmove',e=>{e.preventDefault();jm(e)},{passive:false});
joy.addEventListener('touchend',()=>{dir={dx:0,dy:0};st.style.left='40px';st.style.top='40px'});
const hit=document.getElementById('hit');
hit.addEventListener('touchstart',e=>{e.preventDefault();socket.emit('hit')});
hit.addEventListener('click',()=>socket.emit('hit'));
const K={};
onkeydown=e=>{K[e.key]=1;if(e.code==='Space')socket.emit('hit')};
onkeyup=e=>K[e.key]=0;
setInterval(()=>{let dx=dir.dx,dy=dir.dy;
if(K.ArrowLeft||K.a)dx=-1;if(K.ArrowRight||K.d)dx=1;
if(K.ArrowUp||K.w)dy=-1;if(K.ArrowDown||K.s)dy=1;
if(dx||dy)socket.emit('move',{dx,dy})},50);
function draw(){ctx.fillStyle='#222';ctx.fillRect(0,0,800,500);
for(const id in P){const p=P[id];
ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,20,0,7);ctx.fill();
if(id===socket.id){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke()}
ctx.fillStyle='#400';ctx.fillRect(p.x-25,p.y-32,50,6);
ctx.fillStyle='#4e4';ctx.fillRect(p.x-25,p.y-32,50*p.hp/100,6);
ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.textAlign='center';
ctx.fillText(p.name+' ('+p.score+')',p.x,p.y-38)}
requestAnimationFrame(draw)}
draw();
</script></body></html>`;

app.get('/', (req, res) => res.send(PAGE));

const W = 800, H = 500;
const players = {};
const rnd = (n) => Math.random() * n;

io.on('connection', (s) => {
  players[s.id] = {
    id: s.id, x: rnd(W), y: rnd(H), hp: 100, score: 0,
    color: 'hsl(' + Math.floor(rnd(360)) + ',80%,55%)',
    name: 'P' + s.id.slice(0, 3)
  };
  s.on('name', (n) => { if (players[s.id]) players[s.id].name = String(n).slice(0, 12); });
  s.on('move', (d) => {
    const p = players[s.id]; if (!p) return;
    const dx = Math.max(-1, Math.min(1, +d.dx || 0));
    const dy = Math.max(-1, Math.min(1, +d.dy || 0));
    p.x = Math.max(0, Math.min(W, p.x + dx * 6));
    p.y = Math.max(0, Math.min(H, p.y + dy * 6));
  });
  s.on('hit', () => {
    const p = players[s.id]; if (!p) return;
    for (const id in players) {
      if (id === s.id) continue;
      const q = players[id];
      if (Math.hypot(p.x - q.x, p.y - q.y) < 55) {
        q.hp -= 15;
        if (q.hp <= 0) { p.score++; q.hp = 100; q.x = rnd(W); q.y = rnd(H); }
      }
    }
  });
  s.on('disconnect', () => delete players[s.id]);
});

setInterval(() => io.emit('state', players), 50);
server.listen(process.env.PORT || 3000, () => console.log('Server ready'));
