'use strict';
const $ = id => document.getElementById(id);
const emotions = [['happy','Alegría'],['sad','Tristeza'],['angry','Enojo'],['fearful','Miedo'],['disgusted','Asco'],['surprised','Sorpresa']];
const video = $('video'), canvas = $('overlay'), ctx = canvas.getContext('2d');
let stream = null, running = false, paused = false, generation = 0, loading = null, scores = null, lastResult = null;
let smoothPoints = null, concealed = false, reading = {label:'Esperando cámara',note:'Ubicate de frente, con buena luz.'};
let mediaPipeLandmarker=null,mediaPipeLoading=null,lastMesh=null;
const analysisFrame = document.createElement('canvas');
const frozen = $('frozen');
for (const [key,label] of emotions) {
  const row = document.createElement('div'); row.className = 'bar-row'; row.dataset.emotion=key;
  row.innerHTML = `<div class="bar-label"><span>${label}</span><output id="score-${key}">—</output></div><div class="track" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="meter-${key}"><div class="fill" id="fill-${key}"></div></div>`;
  $('bars').append(row);
}
function status(text, error=false) { $('status').textContent = text; $('status').classList.toggle('error',error); }
function clearReading(label='Sin rostro visible', note='Ubicate de frente, con buena luz.', preserveMesh=false) {
  scores=null;lastResult=null;smoothPoints=null;if(!preserveMesh)lastMesh=null;ctx.clearRect(0,0,canvas.width,canvas.height);reading={label,note};renderReading();if(preserveMesh)draw(null);
  $('framing').hidden=true;
}
function renderReading(){
  $('result').textContent=concealed?'¿Qué ve el grupo?':reading.label;
  $('result-note').textContent=concealed?'La clasificación está oculta hasta revelar.':reading.note;
  for(const [key] of emotions){const n=scores&&!concealed?Math.round(scores[key]*100):null;$('score-'+key).textContent=n===null?'—':n+' %';$('fill-'+key).style.width=(n||0)+'%';$('meter-'+key).setAttribute('aria-valuenow',String(n||0));}
  $('reveal').disabled=!running||!lastResult;
}
function draw(result) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!$('points').checked)return;
  if($('point-model').value==='mediapipe'){
    if(!lastMesh)return;
    ctx.fillStyle='#dbe5eb';
    for(const point of lastMesh){ctx.beginPath();ctx.arc(point.x*canvas.width,point.y*canvas.height,1.25,0,Math.PI*2);ctx.fill();}
    return;
  }
  if(!result)return;
  const pts=smoothPoints||result.landmarks.positions;
  const groups=[[0,16,'#95b5d9',false],[17,21,'#ffd18b',false],[22,26,'#ffd18b',false],[27,30,'#95b5d9',false],[31,35,'#95b5d9',false],[36,41,'#65ded4',true],[42,47,'#65ded4',true],[48,59,'#f5a9c8',true],[60,67,'#f5a9c8',true]];
  for(const [start,end,color,closed] of groups){ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.3;ctx.beginPath();for(let i=start;i<=end;i++){const p=pts[i];if(i===start)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}if(closed)ctx.closePath();ctx.stroke();for(let i=start;i<=end;i++){ctx.beginPath();ctx.arc(pts[i].x,pts[i].y,2.8,0,Math.PI*2);ctx.fill();}}
}
function display(result){
  const pts=result.landmarks.positions;
  const jump=smoothPoints?Math.hypot(pts[30].x-smoothPoints[30].x,pts[30].y-smoothPoints[30].y)/canvas.width:1;
  const alpha=jump>.035?1:.65;
  smoothPoints=pts.map((p,i)=>({x:smoothPoints?smoothPoints[i].x*(1-alpha)+p.x*alpha:p.x,y:smoothPoints?smoothPoints[i].y*(1-alpha)+p.y*alpha:p.y}));
  lastResult=result;draw(result);
  const raw=result.expressions;
  scores=Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,scores ? scores[key]*.65+value*.35 : value]));
  const ranked=emotions.map(([key,label])=>({label,value:scores[key]})).sort((a,b)=>b.value-a.value);
  const clear=ranked[0].value>=.5 && ranked[0].value-ranked[1].value>=.15 && ranked[0].value>scores.neutral;
  reading={label:clear?ranked[0].label:'Sin expresión clara',note:clear?'Clasificación de la expresión visible.':scores.neutral>=.5?'Predomina la categoría neutral.':'El modelo no distingue una categoría dominante.'};
  renderReading();
  const box=result.detection.box;
  const eyeMid=(pts[36].x+pts[45].x)/2,eyeWidth=Math.abs(pts[45].x-pts[36].x);
  const turned=Math.abs(pts[30].x-eyeMid)/Math.max(eyeWidth,1)>.25;
  const edge=box.x<canvas.width*.02||box.y<canvas.height*.02||box.x+box.width>canvas.width*.98||box.y+box.height>canvas.height*.98;
  const message=box.width/canvas.width<.18?'Acercate un poco a la cámara':edge?'Centrate y dejá visible todo el rostro':turned?'Probá mirar de frente a la cámara':'';
  $('framing').textContent=message;$('framing').hidden=!message;
}
async function loadModels(){
  if(location.protocol==='file:')throw new Error('La página se abrió como archivo. Abrí iniciar.cmd y entrá a http://localhost:8765; los modelos necesitan el servidor local.');
  if(!window.faceapi)throw new Error('No se encontró el motor local. Revisá la carpeta vendor.');
  if(!loading)loading=(async()=>{
    const models=[['rostro',faceapi.nets.tinyFaceDetector],['puntos faciales',faceapi.nets.faceLandmark68Net],['expresiones',faceapi.nets.faceExpressionNet]];
    for(const [name,net] of models){
      if(net.isLoaded)continue;
      try{await net.loadFromUri(new URL('models/',location.href).href);}
      catch(error){throw new Error(`No se pudo cargar el modelo de ${name}. Verificá que la carpeta models esté publicada junto a index.html y recargá la página. Detalle: ${error.message}`);}
    }
  })().catch(error=>{loading=null;throw error;});
  await loading;
}
async function loadMediaPipe(){
  if(mediaPipeLandmarker)return mediaPipeLandmarker;
  if(!mediaPipeLoading)mediaPipeLoading=(async()=>{
    const {FaceLandmarker,FilesetResolver}=await import('./vendor/mediapipe/vision_bundle.mjs');
    const wasmPath=new URL('vendor/mediapipe/wasm',location.href).href;
    const fileset=await FilesetResolver.forVisionTasks(wasmPath);
    return FaceLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetPath:new URL('models/face_landmarker.task',location.href).href,delegate:'CPU'},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:false});
  })().then(model=>{mediaPipeLandmarker=model;return model;}).catch(error=>{mediaPipeLoading=null;throw error;});
  return mediaPipeLoading;
}
async function choosePointModel(){
  const useMediaPipe=$('point-model').value==='mediapipe';
  $('point-caption').textContent=useMediaPipe?'La malla de MediaPipe ubica 478 puntos. Las seis barras siguen usando el clasificador actual. Los puntos no son unidades FACS.':'Los 68 puntos ubican rasgos del rostro. No son unidades de acción FACS.';
  if(useMediaPipe){
    $('point-model').disabled=true;status('Cargando MediaPipe desde los archivos locales…');
    try{await loadMediaPipe();status('MediaPipe listo. Las seis barras siguen usando el clasificador actual.');}
    catch(error){$('point-model').value='classic';$('point-caption').textContent='Los 68 puntos ubican rasgos del rostro. No son unidades de acción FACS.';status('MediaPipe no pudo cargarse; se mantienen los 68 puntos. '+error.message,true);}
    finally{$('point-model').disabled=false;}
  }
  draw(lastResult);
}
$('point-model').addEventListener('change',choosePointModel);
async function devices(){const current=$('camera').value;const all=await navigator.mediaDevices.enumerateDevices();$('camera').replaceChildren(new Option('Predeterminada',''));all.filter(x=>x.kind==='videoinput').forEach((d,i)=>$('camera').add(new Option(d.label||`Cámara ${i+1}`,d.deviceId)));$('camera').value=current;}
function stop(){generation++;running=false;paused=false;if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;frozen.hidden=true;$('placeholder').hidden=false;$('live').textContent='Cámara apagada';$('start').disabled=false;$('camera').disabled=false;$('pause').disabled=true;$('pause').textContent='Pausar';$('stop').disabled=true;clearReading('Esperando cámara');document.dispatchEvent(new Event('camera-state'));status('Procesamiento local. El video no se graba ni se envía.');}
async function loop(token){
  if(!running||token!==generation)return;
  if(!paused){try{analysisFrame.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);const result=await faceapi.detectSingleFace(analysisFrame,new faceapi.TinyFaceDetectorOptions({inputSize:320,scoreThreshold:.5})).withFaceLandmarks().withFaceExpressions();if(token!==generation||paused)return;
    if($('point-model').value==='mediapipe'&&mediaPipeLandmarker){const mesh=mediaPipeLandmarker.detectForVideo(analysisFrame,performance.now());lastMesh=mesh.faceLandmarks?.[0]||null;}else lastMesh=null;
    frozen.getContext('2d').drawImage(analysisFrame,0,0);if(result)display(result);else clearReading(lastMesh?'Sin clasificación disponible':'Sin rostro visible',lastMesh?'MediaPipe ubica el rostro, pero el clasificador no encontró una expresión.':'Ubicate de frente, con buena luz.',!!lastMesh);}catch(error){if(token!==generation)return;stop();status('No se pudo analizar el video. Probá activar nuevamente la cámara. '+error.message,true);return;}}
  if(running&&token===generation)setTimeout(()=>loop(token),100);
}
async function start(){
  $('start').disabled=true;$('camera').disabled=true;status('Cargando los modelos locales…');
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('La cámara requiere HTTPS o una página local en localhost. Abrí el sitio en Edge o Chrome.');
    await loadModels();status('Esperando permiso para usar la cámara…');
    const id=$('camera').value;stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{width:{ideal:960},height:{ideal:720},...(id?{deviceId:{exact:id}}:{facingMode:'user'})}});
    video.srcObject=stream;await video.play();canvas.width=video.videoWidth;canvas.height=video.videoHeight;$('stage').style.aspectRatio=`${canvas.width}/${canvas.height}`;
    analysisFrame.width=frozen.width=canvas.width;analysisFrame.height=frozen.height=canvas.height;
    running=true;paused=false;$('placeholder').hidden=true;$('live').textContent='En vivo';$('pause').disabled=false;$('stop').disabled=false;
    stream.getVideoTracks()[0].addEventListener('ended',()=>{if(running){stop();status('La cámara se desconectó. Reconectala y volvé a activarla.',true);}});
    await devices().catch(()=>{});status('Video local · Una persona a la vez · Sin grabación');loop(++generation);
  }catch(error){stop();const messages={NotAllowedError:'Permiso de cámara denegado. Habilitalo desde el icono junto a la dirección y volvé a intentar.',NotFoundError:'No se encontró una cámara. Conectá la webcam y volvé a intentar.',NotReadableError:'No se pudo abrir la cámara. Cerrá otras aplicaciones que puedan estar usándola.',OverconstrainedError:'La cámara seleccionada no está disponible. Elegí otra.'};status(messages[error.name]||'No se pudo iniciar: '+error.message,true);}
}
$('start').addEventListener('click',start);$('stop').addEventListener('click',stop);
function setPaused(value){if(!running||paused===value)return;paused=value;$('pause').textContent=paused?'Continuar':'Pausar';$('live').textContent=paused?'Imagen pausada':'En vivo';frozen.hidden=!paused;if(paused){video.pause();status('Imagen pausada para discutir. La cámara sigue encendida; usá Apagar para desconectarla.');}else{video.play().then(()=>{status('Video local · Una persona a la vez · Sin grabación');loop(++generation);}).catch(()=>{stop();status('No se pudo reanudar el video.',true);});}document.dispatchEvent(new Event('camera-state'));}
$('pause').addEventListener('click',()=>setPaused(!paused));
$('points').addEventListener('change',()=>draw(lastResult));
function mirror(){$('stage').classList.toggle('mirrored',$('mirror').checked);}mirror();$('mirror').addEventListener('change',mirror);
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{status('Usá F11 para mostrar la aplicación en pantalla completa.');}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa';});
window.addEventListener('pagehide',()=>{if(stream)stream.getTracks().forEach(t=>t.stop());});
if(navigator.mediaDevices){devices().catch(()=>{});navigator.mediaDevices.addEventListener('devicechange',()=>devices().catch(()=>{}));}
if(location.protocol==='file:'){
  status('Abriste index.html directamente. Para cargar los modelos, ejecutá iniciar.cmd y abrí la dirección local.',true);
  const link=document.createElement('a');link.href='http://localhost:8765';link.textContent='Abrir la herramienta en localhost';
  $('status').append(document.createTextNode(' '),link);
}
