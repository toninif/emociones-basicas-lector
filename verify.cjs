// Browser smoke test. Run with the local server at localhost:8765.
const { spawn } = require('node:child_process');
const { mkdtempSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const profile = mkdtempSync(join(tmpdir(), 'rostro-browser-'));
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--no-first-run', '--remote-debugging-port=9335',
  '--remote-allow-origins=http://localhost:8765', '--use-fake-device-for-media-stream',
  '--use-fake-ui-for-media-stream', `--user-data-dir=${profile}`, 'about:blank'
], { windowsHide: true, stdio: 'ignore' });
let socket;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let targets;
  for (let i = 0; i < 50; i++) { try { targets = await (await fetch('http://localhost:9335/json')).json(); break; } catch { await sleep(200); } }
  assert(targets, 'Browser debugger ready');
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r,j) => { socket.onopen=r; socket.onerror=j; });
  let id=0; const pending=new Map();
  socket.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){const {resolve,reject}=pending.get(data.id);pending.delete(data.id);data.error?reject(Error(JSON.stringify(data.error))):resolve(data.result);}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://localhost:8765'});
  for(let i=0;i<60;i++){if(await evaluate('typeof loadModels === "function"'))break;await sleep(200);}
  assert.equal(await evaluate('document.querySelectorAll(".bar-row").length'),6);
  assert.equal(await evaluate('new Set([...document.querySelectorAll(".fill")].map(el=>getComputedStyle(el).backgroundColor)).size'),6,'Six distinct emotion colors');
  await evaluate('document.getElementById("tab-guide").click()');
  assert.equal(await evaluate('document.getElementById("panel-guide").hidden'),false);
  assert.equal(await evaluate('document.getElementById("expression-guide").open'),true);
  await evaluate('document.getElementById("tab-guide").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}))');
  assert.equal(await evaluate('document.getElementById("panel-notes").hidden'),false);
  await evaluate('document.getElementById("tab-activity").click()');
  await evaluate('loadModels().then(()=>true)');
  console.log('PASS: all three local model files loaded and parsed.');
  await evaluate('loadMediaPipe().then(()=>true)');
  assert.equal(await evaluate('!!mediaPipeLandmarker'),true,'Local MediaPipe model loads');
  await evaluate('document.getElementById("point-model").value="mediapipe";choosePointModel()');
  assert.match(await evaluate('document.getElementById("point-caption").textContent'),/478 puntos/);
  await evaluate('start().then(()=>true)');
  assert.equal(await evaluate('running'),true,'Fake camera starts');
  await sleep(1500);
  assert.equal(await evaluate('running'),true,'Real inference runs on fake video without errors');
  assert.equal(await evaluate('document.getElementById("point-model").value'),'mediapipe');
  assert.equal(await evaluate('document.getElementById("result").textContent'),'Sin rostro visible');
  await evaluate('document.getElementById("pause").click()');
  assert.equal(await evaluate('paused'),true);
  // Controlled scores/landmarks test UI state only, not recognition accuracy.
  await evaluate(`beginRound(); setPaused(true);
    window.fixture={landmarks:{positions:Array.from({length:68},(_,i)=>({x:220+(i%10)*15,y:160+Math.floor(i/10)*20}))},detection:{box:{x:180,y:120,width:260,height:300}},expressions:{happy:.91,sad:.01,angry:.01,fearful:.01,disgusted:.01,surprised:.01,neutral:.04}};
    display(window.fixture);`);
  assert.equal(await evaluate('document.getElementById("result").textContent'),'¿Qué ve el grupo?');
  assert.equal(await evaluate('document.getElementById("score-happy").textContent'),'—');
  assert.equal(await evaluate('document.getElementById("meter-happy").getAttribute("aria-valuenow")'),'0');
  await evaluate('document.getElementById("reveal").click()');
  assert.equal(await evaluate('concealed'),true,'Prediction required');
  await evaluate('document.getElementById("prediction").value="happy";document.getElementById("reveal").click()');
  assert.equal(await evaluate('document.getElementById("result").textContent'),'Alegría');
  assert.equal(await evaluate('paused'),true,'Reveal holds the frame');
  assert.match(await evaluate('document.getElementById("comparison").textContent'),/Grupo: Alegría/);
  await evaluate('addMark(.25,.5)');
  assert.equal(await evaluate('marks.length'),1);
  await evaluate('document.getElementById("mirror").click()');
  assert.equal(await evaluate('marks[0].x'),.75,'Annotations follow mirror');
  await evaluate('document.getElementById("undo-mark").click()');
  assert.equal(await evaluate('marks.length'),0);
  await evaluate('document.getElementById("annotations").dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}))');
  assert.equal(await evaluate('marks.length'),1,'Keyboard annotation works');
  await evaluate('window.fixture.detection.box.width=40;display(window.fixture)');
  assert.match(await evaluate('document.getElementById("framing").textContent'),/Acercate/);
  await evaluate('clearReading()');
  assert.equal(await evaluate('document.getElementById("reveal").disabled'),true,'No face cannot be revealed');
  console.log('PASS: hidden scores, required prediction, reveal snapshot, pointer data/mirror, keyboard annotation, framing and face loss.');
  await evaluate('document.getElementById("pause").click()');
  await sleep(500);
  assert.equal(await evaluate('paused'),false);
  assert.equal(await evaluate('marks.length'),0,'Resume clears old annotations');
  await evaluate('stop()');
  assert.equal(await evaluate('video.srcObject'),null);
  await evaluate('document.getElementById("next").click()');
  assert.match(await evaluate('document.getElementById("challenge").textContent'),/alegría/);
  console.log('PASS: camera start, inference without face, pause, resume, stop, challenge.');
  const screenshot=await send('Page.captureScreenshot',{format:'png'});
  writeFileSync(join(profile,'desktop.png'),Buffer.from(screenshot.data,'base64'));
  console.log('Desktop screenshot: '+join(profile,'desktop.png'));
  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await evaluate('document.getElementById("projector").click()');
  assert.equal(await evaluate('document.body.classList.contains("projector")'),true);
  assert(await evaluate('document.getElementById("stop").getBoundingClientRect().bottom < innerHeight'),'Projector camera controls visible');
  assert(await evaluate('document.getElementById("reveal").getBoundingClientRect().bottom < innerHeight'),'Projector reveal control visible');
  const projected=await send('Page.captureScreenshot',{format:'png'});
  writeFileSync(join(profile,'projector.png'),Buffer.from(projected.data,'base64'));
  console.log('Projector screenshot: '+join(profile,'projector.png'));
  await evaluate('document.getElementById("projector").click();document.getElementById("tab-guide").click()');
  for(const [key,label] of [['happy','Alegría'],['sad','Tristeza'],['angry','Enojo'],['fearful','Miedo'],['disgusted','Asco'],['surprised','Sorpresa']]){
    await evaluate(`document.getElementById('intention').value='${key}';updateGuide()`);
    assert.match(await evaluate('document.getElementById("guide-title").textContent'),new RegExp(label));
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'),'No mobile horizontal overflow');
  console.log('PASS: mobile layout fits viewport.');
  await send('Browser.close');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{if(socket)socket.close();browser.kill();});
