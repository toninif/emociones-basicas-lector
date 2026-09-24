'use strict';
// Move the general notes to their own panel, preserving the existing content.
const notes=document.querySelector('#panel-guide > details:not(#expression-guide)');
const notesPanel=document.createElement('div');notesPanel.id='panel-notes';notesPanel.hidden=true;
notesPanel.setAttribute('role','tabpanel');notesPanel.setAttribute('aria-labelledby','tab-notes');
notesPanel.append(notes);document.querySelector('.secondary-panel').append(notesPanel);
const panelNames=['activity','guide','notes'];
function selectPanel(name,focus=false){
  for(const item of panelNames){const selected=item===name;const tab=$('tab-'+item);tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;$('panel-'+item).hidden=!selected;}
  if(name==='guide')$('expression-guide').open=true;
  if(name==='notes')notes.open=true;
  if(focus)$('tab-'+name).focus();
}
for(const name of panelNames){
  $('tab-'+name).addEventListener('click',()=>selectPanel(name));
  $('tab-'+name).addEventListener('keydown',event=>{
    const index=panelNames.indexOf(name);let next;
    if(event.key==='ArrowRight')next=(index+1)%3;
    if(event.key==='ArrowLeft')next=(index+2)%3;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=2;
    if(next!==undefined){event.preventDefault();selectPanel(panelNames[next],true);}
  });
}
$('projector').addEventListener('click',()=>{if(document.body.classList.contains('projector'))selectPanel('activity');});
