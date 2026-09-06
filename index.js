// save as server.js
// npm install express ws axios fca-mafiya

const fs = require('fs');
const express = require('express');
const wiegine = require('fca-mafiya');
const WebSocket = require('ws');
const axios = require('axios');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 21129;

// --- Task Management System ---
let tasks = [];
let taskCounter = 0;

function generateTaskKey() {
    let result;
    do {
        result = Math.floor(10000 + Math.random() * 90000);
    } while (findTask(result));
    return result;
}

function findTask(id) {
    return tasks.find(t => t.id === id);
}

function createNewTask(threadID, delay, prefix, messages, cookieContent, cookieIndex, isToken = false) {
    const taskId = generateTaskKey();
    const newTask = {
        id: taskId,
        status: 'Starting',
        threadID: threadID,
        delay: delay,
        prefix: prefix,
        messages: messages,
        currentIndex: 0,
        loopCount: 0,
        api: null,
        cookieContent: cookieContent,
        cookieIndex: cookieIndex,
        isToken: isToken,
        startTime: Date.now(),
        messagesSent: 0,
        errors: 0
    };
    tasks.push(newTask);
    return newTask;
}
// --- End Task Management System ---

let wss;

async function checkCookie(cookie) {
    try {
        const response = await axios.get('https://graph.facebook.com/me', {
            headers: { 'Cookie': cookie },
            timeout: 10000
        });
        if (response.data && response.data.id) {
            return { valid: true, uid: response.data.id, name: response.data.name };
        }
        return { valid: false, error: 'Invalid response' };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

async function checkToken(token) {
    try {
        const response = await axios.get(`https://graph.facebook.com/me?access_token=${token}`, {
            timeout: 10000
        });
        if (response.data && response.data.id) {
            return { valid: true, uid: response.data.id, name: response.data.name };
        }
        return { valid: false, error: 'Invalid token' };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

function getTaskStats() {
    const stats = {
        total: tasks.length,
        running: tasks.filter(t => t.status === 'Running').length,
        stopped: tasks.filter(t => t.status === 'Stopped').length,
        failed: tasks.filter(t => t.status === 'Login Failed' || t.status === 'Error').length,
        totalMessagesSent: tasks.reduce((sum, t) => sum + (t.messagesSent || 0), 0),
        tasks: tasks.map(t => ({
            id: t.id,
            status: t.status,
            messagesSent: t.messagesSent || 0,
            errors: t.errors || 0,
            uptime: Math.floor((Date.now() - (t.startTime || Date.now())) / 1000),
            isToken: t.isToken || false,
            cookieIndex: t.cookieIndex + 1
        }))
    };
    return stats;
}

// ============ 🎨 MODERN STYLISH HTML PANEL - WALEED KHAN 🎨 ============
const htmlControlPanel = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>⚡ WALEED KHAN - Cookie/Token Bomber ⚡</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family:'Poppins',sans-serif; }
  :root{
    --bg-1:#0a0014;
    --bg-2:#1a0030;
    --red:#ff003c;
    --red-glow:#ff003c;
    --pink:#ff2e7e;
    --gold:#ffb800;
    --cyan:#00f0ff;
    --text:#f5f5f7;
    --muted:#a0a0b5;
    --card:rgba(255,255,255,0.04);
    --border:rgba(255,255,255,0.08);
    --success:#00ff88;
    --danger:#ff3860;
  }
  html,body{ height:100%; }
  body{
    background: radial-gradient(ellipse at top, var(--bg-2) 0%, var(--bg-1) 60%, #000 100%);
    color:var(--text);
    min-height:100vh;
    overflow-x:hidden;
    position:relative;
  }

  /* Animated Grid Background */
  body::before{
    content:"";
    position:fixed; inset:0;
    background-image:
      linear-gradient(rgba(255,0,60,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,0,60,0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    z-index:-2;
    animation: gridMove 20s linear infinite;
  }
  @keyframes gridMove{
    0%{ background-position:0 0; }
    100%{ background-position:50px 50px; }
  }

  /* Falling Particles */
  .particles{ position:fixed; inset:0; z-index:-1; overflow:hidden; pointer-events:none; }
  .particle{
    position:absolute;
    width:8px; height:8px;
    background: linear-gradient(135deg, var(--red), var(--pink));
    border-radius:50%;
    box-shadow: 0 0 10px var(--red-glow), 0 0 20px var(--red-glow);
    animation: fall linear infinite;
    opacity:0.7;
  }
  @keyframes fall{
    0%{ transform: translateY(-100vh) rotate(0deg); opacity:0; }
    10%{ opacity:0.9; }
    90%{ opacity:0.9; }
    100%{ transform: translateY(110vh) rotate(720deg); opacity:0; }
  }

  /* Header */
  header{
    padding: 30px 20px 20px;
    text-align:center;
    position:relative;
  }
  .logo{
    font-family:'Orbitron',sans-serif;
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight:900;
    letter-spacing: 4px;
    background: linear-gradient(90deg, var(--red), var(--pink), var(--gold), var(--red));
    background-size: 300% 100%;
    -webkit-background-clip: text;
    background-clip:text;
    -webkit-text-fill-color: transparent;
    animation: shine 4s linear infinite;
    text-shadow: 0 0 40px rgba(255,0,60,0.3);
    filter: drop-shadow(0 0 20px rgba(255,0,60,0.4));
  }
  @keyframes shine{
    0%{ background-position: 0% 50%; }
    100%{ background-position: 300% 50%; }
  }
  .tagline{
    margin-top:8px;
    color:var(--muted);
    font-size:0.9rem;
    letter-spacing:3px;
    text-transform:uppercase;
  }
  .tagline span{ color:var(--gold); font-weight:600; }
  .pulse-dot{
    display:inline-block;
    width:10px; height:10px;
    background:var(--success);
    border-radius:50%;
    margin-right:8px;
    box-shadow:0 0 10px var(--success);
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse{
    0%,100%{ transform:scale(1); opacity:1; }
    50%{ transform:scale(1.4); opacity:0.6; }
  }

  /* Main Container */
  .container{
    max-width:1400px;
    margin: 0 auto;
    padding: 20px;
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap:20px;
  }
  @media (max-width: 900px){
    .container{ grid-template-columns: 1fr; }
  }

  /* Cards */
  .card{
    background: var(--card);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px;
    position:relative;
    overflow:hidden;
    transition: all 0.3s ease;
  }
  .card::before{
    content:"";
    position:absolute;
    top:0; left:0; right:0;
    height:2px;
    background: linear-gradient(90deg, transparent, var(--red), var(--pink), transparent);
  }
  .card:hover{
    border-color: rgba(255,0,60,0.3);
    box-shadow: 0 10px 40px rgba(255,0,60,0.15);
    transform: translateY(-2px);
  }

  .card-title{
    font-family:'Orbitron',sans-serif;
    font-size:1.1rem;
    font-weight:700;
    margin-bottom:18px;
    display:flex;
    align-items:center;
    gap:10px;
    color:var(--text);
    letter-spacing:1px;
  }
  .card-title .icon{
    width:36px; height:36px;
    display:flex; align-items:center; justify-content:center;
    background: linear-gradient(135deg, var(--red), var(--pink));
    border-radius:10px;
    font-size:1.1rem;
    box-shadow: 0 0 20px rgba(255,0,60,0.4);
  }

  /* Stats Grid */
  .stats-grid{
    display:grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap:12px;
  }
  .stat-box{
    background: linear-gradient(135deg, rgba(255,0,60,0.08), rgba(255,46,126,0.04));
    border:1px solid rgba(255,0,60,0.2);
    border-radius:14px;
    padding:16px 12px;
    text-align:center;
    transition: all 0.3s;
  }
  .stat-box:hover{ transform:scale(1.05); border-color:var(--red); }
  .stat-value{
    font-family:'Orbitron',sans-serif;
    font-size:1.8rem;
    font-weight:900;
    background: linear-gradient(135deg, var(--gold), var(--red));
    -webkit-background-clip:text;
    background-clip:text;
    -webkit-text-fill-color:transparent;
  }
  .stat-label{
    font-size:0.75rem;
    color:var(--muted);
    text-transform:uppercase;
    letter-spacing:1.5px;
    margin-top:4px;
  }

  /* Form Elements */
  .form-group{ margin-bottom:16px; }
  label{
    display:block;
    font-size:0.8rem;
    color:var(--muted);
    text-transform:uppercase;
    letter-spacing:1.5px;
    margin-bottom:8px;
    font-weight:500;
  }
  input[type="text"], input[type="number"], textarea, select{
    width:100%;
    background: rgba(0,0,0,0.4);
    border:1px solid var(--border);
    color:var(--text);
    padding:12px 16px;
    border-radius:12px;
    font-size:0.95rem;
    transition: all 0.3s;
    font-family:'Poppins',sans-serif;
  }
  input:focus, textarea:focus, select:focus{
    outline:none;
    border-color:var(--red);
    box-shadow: 0 0 0 3px rgba(255,0,60,0.15);
    background: rgba(0,0,0,0.6);
  }
  textarea{ resize:vertical; min-height:100px; }

  /* Toggle Switches */
  .toggle-group{
    display:flex;
    gap:10px;
    background: rgba(0,0,0,0.3);
    padding:5px;
    border-radius:12px;
    border:1px solid var(--border);
  }
  .toggle-btn{
    flex:1;
    padding:10px;
    text-align:center;
    border-radius:8px;
    cursor:pointer;
    font-size:0.85rem;
    font-weight:600;
    letter-spacing:1px;
    transition: all 0.3s;
    color:var(--muted);
    user-select:none;
  }
  .toggle-btn.active{
    background: linear-gradient(135deg, var(--red), var(--pink));
    color:white;
    box-shadow: 0 0 20px rgba(255,0,60,0.4);
  }

  /* File Input */
  .file-input{
    position:relative;
    display:block;
    padding:14px;
    text-align:center;
    background: rgba(0,0,0,0.3);
    border:2px dashed var(--border);
    border-radius:12px;
    cursor:pointer;
    transition: all 0.3s;
    color:var(--muted);
    font-size:0.9rem;
  }
  .file-input:hover{
    border-color:var(--red);
    color:var(--text);
    background: rgba(255,0,60,0.05);
  }
  .file-input input{ display:none; }
  .file-input.has-file{
    border-color:var(--success);
    color:var(--success);
    background: rgba(0,255,136,0.05);
  }

  /* Buttons */
  .btn{
    width:100%;
    padding:14px;
    border:none;
    border-radius:12px;
    font-size:0.95rem;
    font-weight:700;
    letter-spacing:2px;
    text-transform:uppercase;
    cursor:pointer;
    transition: all 0.3s;
    font-family:'Orbitron',sans-serif;
    position:relative;
    overflow:hidden;
  }
  .btn-primary{
    background: linear-gradient(135deg, var(--red), var(--pink));
    color:white;
    box-shadow: 0 5px 25px rgba(255,0,60,0.4);
  }
  .btn-primary:hover{
    transform: translateY(-2px);
    box-shadow: 0 8px 35px rgba(255,0,60,0.6);
  }
  .btn-primary:active{ transform:translateY(0); }
  .btn-secondary{
    background: rgba(255,255,255,0.05);
    color:var(--text);
    border:1px solid var(--border);
  }
  .btn-secondary:hover{
    background: rgba(255,255,255,0.1);
    border-color:var(--red);
  }
  .btn-gold{
    background: linear-gradient(135deg, var(--gold), #ff8800);
    color:#000;
    box-shadow: 0 5px 25px rgba(255,184,0,0.3);
  }
  .btn-gold:hover{ transform:translateY(-2px); box-shadow: 0 8px 35px rgba(255,184,0,0.5); }
  .btn-danger{
    background: linear-gradient(135deg, #ff0040, #8b0000);
    color:white;
  }
  .btn-group{ display:flex; gap:10px; margin-top:10px; }
  .btn-group .btn{ flex:1; }

  /* Log Console */
  .console{
    background: #000;
    border:1px solid var(--border);
    border-radius:12px;
    padding:14px;
    height:280px;
    overflow-y:auto;
    font-family: 'Courier New', monospace;
    font-size:0.85rem;
    line-height:1.6;
  }
  .console::-webkit-scrollbar{ width:6px; }
  .console::-webkit-scrollbar-track{ background:transparent; }
  .console::-webkit-scrollbar-thumb{ background:var(--red); border-radius:3px; }
  .log-entry{ padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.03); }
  .log-success{ color: var(--success); }
  .log-error{ color: var(--danger); }
  .log-info{ color: var(--cyan); }
  .log-warn{ color: var(--gold); }
  .log-time{ color:var(--muted); margin-right:8px; font-size:0.75rem; }

  /* Task List */
  .task-list{
    max-height:300px;
    overflow-y:auto;
    padding-right:5px;
  }
  .task-list::-webkit-scrollbar{ width:6px; }
  .task-list::-webkit-scrollbar-thumb{ background:var(--red); border-radius:3px; }
  .task-item{
    background: rgba(0,0,0,0.3);
    border:1px solid var(--border);
    border-radius:10px;
    padding:12px 14px;
    margin-bottom:8px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    transition: all 0.3s;
  }
  .task-item:hover{ border-color:var(--red); }
  .task-info{ flex:1; }
  .task-id{
    font-family:'Orbitron',sans-serif;
    font-weight:700;
    color:var(--gold);
    font-size:0.9rem;
  }
  .task-meta{
    font-size:0.75rem;
    color:var(--muted);
    margin-top:4px;
  }
  .status-badge{
    padding:4px 10px;
    border-radius:20px;
    font-size:0.7rem;
    font-weight:700;
    letter-spacing:1px;
    text-transform:uppercase;
  }
  .status-Running{ background:rgba(0,255,136,0.15); color:var(--success); border:1px solid var(--success); }
  .status-Stopped{ background:rgba(160,160,181,0.15); color:var(--muted); border:1px solid var(--muted); }
  .status-Failed{ background:rgba(255,56,96,0.15); color:var(--danger); border:1px solid var(--danger); }
  .status-Starting, .status-Logging{ background:rgba(255,184,0,0.15); color:var(--gold); border:1px solid var(--gold); }

  /* Footer */
  footer{
    text-align:center;
    padding:30px 20px;
    color:var(--muted);
    font-size:0.8rem;
    letter-spacing:2px;
  }
  footer .brand{
    color:var(--red);
    font-family:'Orbitron',sans-serif;
    font-weight:700;
  }

  /* Connection Status */
  .conn-status{
    position:fixed;
    top:15px; right:15px;
    padding:6px 14px;
    border-radius:20px;
    font-size:0.75rem;
    font-weight:600;
    letter-spacing:1px;
    z-index:100;
    backdrop-filter:blur(10px);
  }
  .conn-online{ background:rgba(0,255,136,0.15); color:var(--success); border:1px solid var(--success); }
  .conn-offline{ background:rgba(255,56,96,0.15); color:var(--danger); border:1px solid var(--danger); }

  /* Animations */
  @keyframes fadeIn{
    from{ opacity:0; transform:translateY(10px); }
    to{ opacity:1; transform:translateY(0); }
  }
  .card{ animation: fadeIn 0.6s ease backwards; }
  .card:nth-child(1){ animation-delay:0.1s; }
  .card:nth-child(2){ animation-delay:0.2s; }
  .card:nth-child(3){ animation-delay:0.3s; }
  .card:nth-child(4){ animation-delay:0.4s; }
</style>
</head>
<body>

<div class="particles" id="particles"></div>

<div class="conn-status conn-offline" id="connStatus">● OFFLINE</div>

<header>
  <h1 class="logo">⚡ WALEED KHAN ⚡</h1>
  <div class="tagline"><span class="pulse-dot"></span>Cookie / Token <span>BOMBER SYSTEM</span> • v2.0</div>
</header>

<div class="container">

  <!-- Stats Card -->
  <div class="card" style="grid-column: span 2;">
    <div class="card-title"><div class="icon">📊</div> LIVE MONITOR</div>
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-value" id="statTotal">0</div><div class="stat-label">Total Tasks</div></div>
      <div class="stat-box"><div class="stat-value" id="statRunning">0</div><div class="stat-label">Running</div></div>
      <div class="stat-box"><div class="stat-value" id="statStopped">0</div><div class="stat-label">Stopped</div></div>
      <div class="stat-box"><div class="stat-value" id="statFailed">0</div><div class="stat-label">Failed</div></div>
      <div class="stat-box"><div class="stat-value" id="statMsgs">0</div><div class="stat-label">Msgs Sent</div></div>
    </div>
  </div>

  <!-- Config Card -->
  <div class="card">
    <div class="card-title"><div class="icon">⚙️</div> CONFIGURATION</div>

    <div class="form-group">
      <label>🔐 Auth Mode</label>
      <div class="toggle-group">
        <div class="toggle-btn active" data-mode="cookie" onclick="setAuthMode('cookie')">🍪 COOKIE</div>
        <div class="toggle-btn" data-mode="token" onclick="setAuthMode('token')">🔑 TOKEN</div>
      </div>
    </div>

    <div class="form-group">
      <label>📥 Input Source</label>
      <div class="toggle-group">
        <div class="toggle-btn active" data-source="single" onclick="setSource('single')">📝 SINGLE PASTE</div>
        <div class="toggle-btn" data-source="file" onclick="setSource('file')">📁 FROM FILE</div>
      </div>
    </div>

    <div class="form-group" id="singleInput">
      <label id="authLabel">🍪 Paste Cookie</label>
      <textarea id="authInput" placeholder="Paste your cookie here..."></textarea>
    </div>

    <div class="form-group" id="fileInput" style="display:none;">
      <label id="fileLabel">📁 Upload Cookie File</label>
      <label class="file-input" id="fileInputLabel">
        <input type="file" id="authFile" accept=".txt" />
        <span id="fileText">📂 Click to select .txt file</span>
      </label>
    </div>

    <div class="form-group">
      <label>🎯 Target Thread ID</label>
      <input type="text" id="threadID" placeholder="e.g. 1000123456789" />
    </div>

    <div class="form-group">
      <label>💬 Prefix / Name (optional)</label>
      <input type="text" id="prefix" placeholder="e.g. WALEED KHAN" />
    </div>

    <div class="form-group">
      <label>⏱️ Delay (seconds)</label>
      <input type="number" id="delay" value="2" min="0" />
    </div>

    <div class="form-group">
      <label>📄 Messages File (.txt)</label>
      <label class="file-input" id="msgFileLabel">
        <input type="file" id="msgFile" accept=".txt" />
        <span id="msgFileText">📂 Select messages file</span>
      </label>
    </div>

    <div class="btn-group">
      <button class="btn btn-gold" onclick="checkAuth()">🔍 CHECK</button>
      <button class="btn btn-secondary" onclick="refreshStats()">🔄 REFRESH</button>
    </div>
    <div style="margin-top:12px;">
      <button class="btn btn-primary" onclick="startBombing()">🚀 START BOMBING</button>
    </div>
  </div>

  <!-- Tasks Card -->
  <div class="card">
    <div class="card-title"><div class="icon">🎯</div> ACTIVE TASKS</div>
    <div class="task-list" id="taskList">
      <div style="text-align:center; color:var(--muted); padding:30px;">No active tasks yet...</div>
    </div>
    <div style="margin-top:16px;">
      <label>🛑 Stop Task by ID</label>
      <div style="display:flex; gap:10px;">
        <input type="text" id="stopId" placeholder="Task ID" style="flex:1;" />
        <button class="btn btn-danger" style="width:auto; padding:14px 20px;" onclick="stopTask()">⛔ STOP</button>
      </div>
    </div>
  </div>

  <!-- Console Card -->
  <div class="card" style="grid-column: span 2;">
    <div class="card-title"><div class="icon">💻</div> LIVE CONSOLE</div>
    <div class="console" id="console"></div>
  </div>

</div>

<footer>
  CRAFTED WITH <span style="color:var(--red);">❤</span> BY <span class="brand">WALEED KHAN</span> • © 2026
</footer>

<script>
  // ============ Falling Particles ============
  const particlesContainer = document.getElementById('particles');
  for(let i=0; i<30; i++){
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random()*100 + '%';
    p.style.animationDuration = (8 + Math.random()*12) + 's';
    p.style.animationDelay = Math.random()*10 + 's';
    p.style.width = p.style.height = (4 + Math.random()*8) + 'px';
    particlesContainer.appendChild(p);
  }

  // ============ State ============
  let authMode = 'cookie';
  let sourceMode = 'single';
  let authFileContent = '';
  let msgFileContent = '';
  let ws;

  // ============ WebSocket ============
  function connectWS(){
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(proto + '://' + location.host);

    ws.onopen = () => {
      const cs = document.getElementById('connStatus');
      cs.className = 'conn-status conn-online';
      cs.textContent = '● ONLINE';
      log('🟢 Connected to WALEED KHAN server', 'success');
    };
    ws.onclose = () => {
      const cs = document.getElementById('connStatus');
      cs.className = 'conn-status conn-offline';
      cs.textContent = '● OFFLINE';
      log('🔴 Disconnected. Reconnecting...', 'error');
      setTimeout(connectWS, 2000);
    };
    ws.onerror = () => log('⚠️ WebSocket error', 'warn');
    ws.onmessage = (e) => {
      try{
        const data = JSON.parse(e.data);
        handleMsg(data);
      }catch(err){}
    };
  }

  function handleMsg(data){
    if(data.type === 'tasks_update'){
      if(data.globalMessage){
        const type = data.globalMessage.includes('❌') ? 'error'
                   : data.globalMessage.includes('✅') ? 'success'
                   : data.globalMessage.includes('✨') ? 'success'
                   : data.globalMessage.includes('⚠️') ? 'warn' : 'info';
        log(data.globalMessage, type);
      }
      if(data.stats) updateStats(data.stats);
    } else if(data.type === 'stats_update'){
      if(data.stats) updateStats(data.stats);
    } else if(data.type === 'check_result'){
      if(data.valid){
        log('✅ Valid! UID: ' + data.uid + ' | Name: ' + data.name, 'success');
      } else {
        log('❌ Invalid: ' + data.error, 'error');
      }
    }
  }

  function updateStats(stats){
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statRunning').textContent = stats.running;
    document.getElementById('statStopped').textContent = stats.stopped;
    document.getElementById('statFailed').textContent = stats.failed;
    document.getElementById('statMsgs').textContent = stats.totalMessagesSent;

    const list = document.getElementById('taskList');
    if(!stats.tasks || stats.tasks.length === 0){
      list.innerHTML = '<div style="text-align:center; color:var(--muted); padding:30px;">No active tasks yet...</div>';
      return;
    }
    list.innerHTML = stats.tasks.map(t => {
      const statusClass = t.status.includes('Failed') || t.status.includes('Error') ? 'Failed'
                        : t.status === 'Running' ? 'Running'
                        : t.status === 'Stopped' ? 'Stopped' : 'Starting';
      const typeIcon = t.isToken ? '🔑' : '🍪';
      return \`<div class="task-item">
        <div class="task-info">
          <div class="task-id">\${typeIcon} #\${t.id}</div>
          <div class="task-meta">📨 \${t.messagesSent} sent • ⚠️ \${t.errors} errors • ⏱️ \${t.uptime}s • Acc #\${t.cookieIndex}</div>
        </div>
        <div class="status-badge status-\${statusClass}">\${t.status}</div>
      </div>\`;
    }).join('');
  }

  function log(msg, type='info'){
    const c = document.getElementById('console');
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = 'log-entry log-' + type;
    div.innerHTML = '<span class="log-time">[' + time + ']</span>' + msg;
    c.appendChild(div);
    c.scrollTop = c.scrollHeight;
  }

  // ============ Toggles ============
  function setAuthMode(mode){
    authMode = mode;
    document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    const label = document.getElementById('authLabel');
    const fileLabel = document.getElementById('fileLabel');
    if(mode === 'cookie'){
      label.textContent = '🍪 Paste Cookie';
      fileLabel.textContent = '📁 Upload Cookie File';
      document.getElementById('authInput').placeholder = 'Paste your cookie here...';
    } else {
      label.textContent = '🔑 Paste Token';
      fileLabel.textContent = '📁 Upload Token File';
      document.getElementById('authInput').placeholder = 'Paste your access token here...';
    }
  }
  function setSource(src){
    sourceMode = src;
    document.querySelectorAll('[data-source]').forEach(b => b.classList.toggle('active', b.dataset.source === src));
    document.getElementById('singleInput').style.display = src === 'single' ? 'block' : 'none';
    document.getElementById('fileInput').style.display = src === 'file' ? 'block' : 'none';
  }

  // ============ File Handlers ============
  document.getElementById('authFile').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = ev => {
      authFileContent = ev.target.result;
      document.getElementById('fileText').textContent = '✅ ' + f.name + ' loaded';
      document.getElementById('fileInputLabel').classList.add('has-file');
    };
    r.readAsText(f);
  });
  document.getElementById('msgFile').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = ev => {
      msgFileContent = ev.target.result;
      document.getElementById('msgFileText').textContent = '✅ ' + f.name + ' loaded';
      document.getElementById('msgFileLabel').classList.add('has-file');
    };
    r.readAsText(f);
  });

  // ============ Actions ============
  function checkAuth(){
    let auth = '';
    if(sourceMode === 'single'){
      auth = document.getElementById('authInput').value.trim();
    } else {
      auth = authFileContent.split('\\n').map(l => l.trim()).filter(l => l.length > 5)[0] || '';
    }
    if(!auth){ log('❌ No auth provided', 'error'); return; }
    ws.send(JSON.stringify({ type:'check_auth', mode: authMode, auth }));
    log('🔍 Checking ' + authMode + '...', 'info');
  }

  function startBombing(){
    const threadID = document.getElementById('threadID').value.trim();
    const prefix = document.getElementById('prefix').value.trim();
    const delay = parseInt(document.getElementById('delay').value) || 2;

    if(!threadID){ log('❌ Target Thread ID required', 'error'); return; }
    if(!msgFileContent){ log('❌ Messages file required', 'error'); return; }

    let authContent = '';
    if(sourceMode === 'single'){
      authContent = document.getElementById('authInput').value.trim();
      if(!authContent){ log('❌ Auth required', 'error'); return; }
    } else {
      authContent = authFileContent;
      if(!authContent){ log('❌ Auth file required', 'error'); return; }
    }

    ws.send(JSON.stringify({
      type:'start_new_task',
      authContent, messageContent: msgFileContent,
      threadID, delay, prefix,
      isFileMode: sourceMode === 'file',
      authMode
    }));
    log('🚀 Launching bombing operation...', 'success');
  }

  function stopTask(){
    const id = document.getElementById('stopId').value.trim();
    if(!id){ log('❌ Enter Task ID', 'error'); return; }
    ws.send(JSON.stringify({ type:'stop_task', id }));
    log('🛑 Stopping task #' + id + '...', 'warn');
  }

  function refreshStats(){
    ws.send(JSON.stringify({ type:'get_stats' }));
    log('🔄 Refreshing stats...', 'info');
  }

  // Init
  connectWS();
  log('⚡ WALEED KHAN BOMBER SYSTEM initialized', 'success');
  log('🔥 Ready to launch...', 'info');
</script>

</body>
</html>`;
// ============ END HTML PANEL ============

app.get('/', (req, res) => {
    res.send(htmlControlPanel);
});

const server = app.listen(PORT, () => {
    console.log(`🔥 WALEED KHAN SERVER running at http://localhost:${PORT}`);
    console.log(`📊 Monitor System Active`);
    console.log(`🍪 Cookie & 🔑 Token Support Enabled`);
});

wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'start_new_task') {
                startSending(data.authContent, data.messageContent, data.threadID, data.delay, data.prefix, data.isFileMode, data.authMode);
            } else if (data.type === 'stop_task') {
                stopTask(parseInt(data.id));
            } else if (data.type === 'get_stats') {
                ws.send(JSON.stringify({ type: 'stats_update', stats: getTaskStats() }));
            } else if (data.type === 'check_auth') {
                let result;
                if (data.mode === 'cookie') result = await checkCookie(data.auth);
                else result = await checkToken(data.auth);
                ws.send(JSON.stringify({ type: 'check_result', ...result }));
            }
        } catch (err) {
            console.error('WebSocket error:', err);
        }
    });
});

async function startSending(authContent, messageContent, threadID, delay, prefix, isFileMode, authMode) {
    let authArray = [];
    if (isFileMode) {
        authArray = authContent.split('\n').map(line => line.trim()).filter(line => line.length > 5);
        if (authArray.length === 0) {
            broadcastTasksUpdate('❌ Auth file is empty or invalid', null);
            return;
        }
    } else {
        authArray.push(authContent);
    }
    const messages = messageContent.split('\n').map(line => line.replace(/\r/g, '').trim()).filter(line => line.length > 0);
    if (messages.length === 0) {
        broadcastTasksUpdate('❌ Message list is empty', null);
        return;
    }
    broadcastTasksUpdate(`🚀 Starting ${authArray.length} task(s) in ${authMode.toUpperCase()} mode...`, null);
    for (let i = 0; i < authArray.length; i++) {
        const auth = authArray[i];
        let checkResult;
        if (authMode === 'cookie') checkResult = await checkCookie(auth);
        else checkResult = await checkToken(auth);
        if (!checkResult.valid) {
            broadcastTasksUpdate(`❌ Auth #${i+1} is INVALID: ${checkResult.error}`, null);
            continue;
        }
        broadcastTasksUpdate(`✅ Auth #${i+1} valid! UID: ${checkResult.uid}`, null);
        const task = createNewTask(threadID, delay, prefix, messages, auth, i, authMode === 'token');
        task.status = 'Logging In...';
        if (authMode === 'token') {
            try {
                const { api } = await wiegine.login({ appState: null, accessToken: auth }, {});
                if (api) {
                    task.api = api;
                    task.status = 'Running';
                    broadcastTasksUpdate(`✨ Task started! ID: ${task.id} (Token #${i+1})`, getTaskStats());
                    sendNextMessage(task.id);
                } else {
                    task.status = 'Login Failed';
                    broadcastTasksUpdate(`❌ Login failed for Task ${task.id}`, getTaskStats());
                }
            } catch (err) {
                task.status = 'Login Failed';
                broadcastTasksUpdate(`❌ Login error for Task ${task.id}: ${err.message}`, getTaskStats());
            }
        } else {
            wiegine.login(auth, {}, (err, api) => {
                if (err || !api) {
                    task.status = 'Login Failed';
                    broadcastTasksUpdate(`❌ Login failed for Task ${task.id}`, getTaskStats());
                    return;
                }
                task.api = api;
                task.status = 'Running';
                broadcastTasksUpdate(`✨ Task started! ID: ${task.id} (Cookie #${i+1})`, getTaskStats());
                sendNextMessage(task.id);
            });
        }
    }
}

function sendNextMessage(taskId) {
    const task = findTask(taskId);
    if (!task || task.status !== 'Running' || !task.api) {
        if (task && task.status === 'Running') task.status = 'Stopped';
        return;
    }
    if (task.currentIndex >= task.messages.length) {
        task.loopCount = (task.loopCount || 0) + 1;
        task.currentIndex = 0;
    }
    const raw = task.messages[task.currentIndex];
    const message = task.prefix ? `${task.prefix} ${raw}` : raw;
    task.api.sendMessage(message, task.threadID, (err) => {
        if (err) {
            task.errors = (task.errors || 0) + 1;
        } else {
            task.messagesSent = (task.messagesSent || 0) + 1;
        }
        task.currentIndex++;
        setTimeout(() => {
            try { sendNextMessage(taskId); } catch (e) { stopTask(taskId, 'Critical Error'); }
        }, task.delay * 1000);
    });
}

function stopTask(taskId, reason = 'User Stopped') {
    const task = findTask(taskId);
    if (!task || task.status === 'Stopped') {
        broadcastTasksUpdate(`⚠️ Task ${taskId} not found or already stopped`, getTaskStats());
        return false;
    }
    if (task.api) {
        try { if (typeof task.api.logout === 'function') task.api.logout(); } catch(e) {}
        task.api = null;
    }
    task.status = 'Stopped';
    broadcastTasksUpdate(`⏸️ Task ${taskId} stopped. Sent: ${task.messagesSent || 0} messages`, getTaskStats());
    return true;
}

function broadcastTasksUpdate(globalMessage, stats) {
    broadcast({ type: 'tasks_update', globalMessage, stats: stats || getTaskStats() });
}

function broadcast(message) {
    if (!wss) return;
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try { client.send(JSON.stringify(message)); } catch(e) {}
        }
    });
}

setInterval(() => {
    if (wss && wss.clients.size > 0) {
        broadcast({ type: 'stats_update', stats: getTaskStats() });
    }
}, 5000);
