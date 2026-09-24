'use strict';
// Teaching examples, not automatic AU measurements or exhaustive FACS combinations.
const expressionGuides={
  happy:{regions:['cheeks','mouth'],movements:'Observá la elevación de las comisuras y las mejillas. Compará una sonrisa posada con otra espontánea, sin inferir sinceridad solo por el rostro.',units:['AU6: elevación de las mejillas.','AU12: elevación de las comisuras.']},
  sad:{regions:['brows','mouth'],movements:'Observá la parte interna de las cejas y las comisuras de los labios.',units:['AU1: elevación de la parte interna de las cejas.','AU4: descenso y aproximación de las cejas.','AU15: descenso de las comisuras.']},
  angry:{regions:['brows','eyes','mouth'],movements:'Observá el acercamiento de las cejas, la tensión de los párpados y los labios.',units:['AU4: descenso y aproximación de las cejas.','AU7: tensión de los párpados.','AU23: tensión de los labios.']},
  fearful:{regions:['brows','eyes','mouth'],movements:'Compará con sorpresa: observá la tensión de las cejas y el estiramiento horizontal de los labios.',units:['AU1 y AU2: elevación de las partes interna y externa de las cejas.','AU4: descenso y aproximación de las cejas.','AU5: elevación del párpado superior.','AU20: estiramiento horizontal de los labios.']},
  disgusted:{regions:['nose','mouth'],movements:'Observá si se arruga la nariz o se eleva el labio superior. Son ejemplos de movimientos, no condiciones obligatorias.',units:['AU9: arrugamiento de la nariz.','AU10: elevación del labio superior.']},
  surprised:{regions:['brows','eyes','mouth'],movements:'Observá las cejas elevadas, los ojos abiertos y la mandíbula descendida. Compará con miedo.',units:['AU1 y AU2: elevación de las partes interna y externa de las cejas.','AU5: elevación del párpado superior.','AU26: descenso de la mandíbula.']}
};
for(const [key,label] of emotions){$('intention').add(new Option(label,key));$('prediction').add(new Option(label,key));}
$('prediction').add(new Option('Sin expresión clara','unclear'));
function updateGuide(){
  const key=$('intention').value,guide=expressionGuides[key];
  const label=emotions.find(([k])=>k===key)[1];
  $('challenge').textContent=`Representá ${label.toLowerCase()}. Observá primero; después compará con el modelo.`;
  $('guide-title').textContent=label+': qué observar';$('guide-movements').textContent=guide.movements;
  $('guide-units').replaceChildren(...guide.units.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  document.querySelectorAll('[data-region]').forEach(el=>el.classList.toggle('highlight',guide.regions.includes(el.dataset.region)));
}
let round='explore';
function roundUI(){
  $('blind').textContent=round==='hidden'?'Cancelar predicción':'Ocultar para predecir';
  $('blind').setAttribute('aria-pressed',String(round==='hidden'));
  $('prediction-field').hidden=round!=='hidden';$('reveal').hidden=round!=='hidden';$('finish-round').hidden=round!=='revealed';
  $('intention').disabled=round==='revealed';renderReading();
}
function beginRound(){round='hidden';concealed=true;$('prediction').value='';$('comparison').textContent='Elegí una predicción antes de revelar. La cámara debe detectar un rostro.';setPaused(false);roundUI();}
function endRound(){round='explore';concealed=false;$('comparison').textContent='';roundUI();}
$('blind').addEventListener('click',()=>{if(round==='hidden')endRound();else beginRound();});
$('reveal').addEventListener('click',()=>{
  if(!lastResult||!running)return;
  if(!$('prediction').value){$('comparison').textContent='Elegí primero la predicción del grupo.';$('prediction').focus();return;}
  setPaused(true);round='revealed';concealed=false;roundUI();
  $('comparison').textContent=`Intención: ${$('intention').selectedOptions[0].text}. Grupo: ${$('prediction').selectedOptions[0].text}. Modelo: ${reading.label}. ¿Qué movimientos apoyan cada lectura?`;
});
$('finish-round').addEventListener('click',()=>{endRound();setPaused(false);});
$('intention').addEventListener('change',()=>{updateGuide();if(round==='hidden'){$('prediction').value='';}});
let firstChallenge=true;
$('next').addEventListener('click',()=>{if(!firstChallenge)$('intention').selectedIndex=($('intention').selectedIndex+1)%emotions.length;firstChallenge=false;updateGuide();beginRound();});
$('projector').addEventListener('click',()=>{const enabled=document.body.classList.toggle('projector');$('projector').setAttribute('aria-pressed',String(enabled));$('projector').textContent=enabled?'Salir de proyector':'Modo proyector';window.scrollTo(0,0);});

const annotationCanvas=$('annotations'),pen=annotationCanvas.getContext('2d');
let marks=[],cursor={x:.5,y:.5},keyboardCursor=false;
function drawMarks(){
  pen.clearRect(0,0,annotationCanvas.width,annotationCanvas.height);
  const scale=annotationCanvas.width/800;
  pen.font=`600 ${18*scale}px "Segoe UI", sans-serif`;pen.lineWidth=3*scale;
  for(const mark of marks){const x=mark.x*annotationCanvas.width,y=mark.y*annotationCanvas.height;pen.strokeStyle='#ffd18b';pen.beginPath();pen.arc(x,y,16*scale,0,Math.PI*2);pen.stroke();const w=pen.measureText(mark.label).width+16*scale;const tx=Math.max(0,Math.min(x+22*scale,annotationCanvas.width-w));const ty=Math.max(25*scale,Math.min(y,annotationCanvas.height-8*scale));pen.fillStyle='#101e34';pen.fillRect(tx,ty-22*scale,w,30*scale);pen.fillStyle='#ffd18b';pen.fillText(mark.label,tx+8*scale,ty);}
  if(keyboardCursor){const x=cursor.x*annotationCanvas.width,y=cursor.y*annotationCanvas.height;pen.strokeStyle='#fff';pen.beginPath();pen.moveTo(x-10,y);pen.lineTo(x+10,y);pen.moveTo(x,y-10);pen.lineTo(x,y+10);pen.stroke();}
  $('undo-mark').disabled=$('clear-marks').disabled=!marks.length;
}
function addMark(x,y){if(paused){marks.push({x,y,label:$('annotation-label').value});drawMarks();}}
annotationCanvas.addEventListener('pointerdown',event=>{
  if(!paused)return;
  const rect=annotationCanvas.getBoundingClientRect(),ratio=Math.min(rect.width/canvas.width,rect.height/canvas.height);
  const width=canvas.width*ratio,height=canvas.height*ratio;
  const x=(event.clientX-rect.left-(rect.width-width)/2)/width,y=(event.clientY-rect.top-(rect.height-height)/2)/height;
  if(x<0||x>1||y<0||y>1)return;keyboardCursor=false;addMark(x,y);
});
annotationCanvas.addEventListener('keydown',event=>{if(!paused)return;const delta={ArrowLeft:[-.02,0],ArrowRight:[.02,0],ArrowUp:[0,-.02],ArrowDown:[0,.02]}[event.key];if(delta){event.preventDefault();keyboardCursor=true;cursor.x=Math.max(.02,Math.min(.98,cursor.x+delta[0]));cursor.y=Math.max(.02,Math.min(.98,cursor.y+delta[1]));drawMarks();}else if(event.key==='Enter'||event.key===' '){event.preventDefault();addMark(cursor.x,cursor.y);}});
annotationCanvas.addEventListener('blur',()=>{keyboardCursor=false;drawMarks();});
$('undo-mark').addEventListener('click',()=>{marks.pop();drawMarks();});$('clear-marks').addEventListener('click',()=>{marks=[];drawMarks();});
$('mirror').addEventListener('change',()=>{marks=marks.map(mark=>({...mark,x:1-mark.x}));drawMarks();});
document.addEventListener('camera-state',()=>{
  annotationCanvas.hidden=$('annotation-tools').hidden=!paused;
  marks=[];keyboardCursor=false;annotationCanvas.width=canvas.width;annotationCanvas.height=canvas.height;drawMarks();
  if(!running){endRound();}else if(!paused&&round==='revealed'){endRound();}
});
updateGuide();roundUI();
