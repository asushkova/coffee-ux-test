'use strict';

const researchParams=new URLSearchParams(location.search);
const researchModerator=researchParams.get('moderator')==='1';
let researchTask=ResearchConfig.taskById(researchParams.get('task'));
document.body.classList.add(researchModerator?'research-moderator':'research-participant');

const liveCartSchedule=cartSchedule;
cartSchedule=function(){return happyMode?ResearchConfig.schedule():liveCartSchedule();};
const liveSelectedPickupText=selectedPickupText;
selectedPickupText=function(){
  if(!happyMode)return liveSelectedPickupText();
  return cartSchedule().slots.find(slot=>slot.key===cartOptions.pickup)?.label||'14:30–14:35';
};

function researchLink(id,moderator=false){
  const url=new URL(location.href);
  url.search='';url.searchParams.set('task',id);
  if(moderator)url.searchParams.set('moderator','1');
  url.hash='happy-flow';
  return url.href;
}

function startResearchTask(id){
  researchTask=ResearchConfig.taskById(id);
  const initial=ResearchConfig.baseline(researchTask.id);
  closeSheet(false);closeProductDetail(false);closeCafeMap(false);
  openHappyFlow();
  state.cart=initial.cart;
  state.orders=[];state.favorites=new Set();state.bonus=initial.bonus;state.redeem=initial.redeem;
  state.branch=initial.branch;state.branchSelected=true;state.search='';state.filter='all';
  cartOptions.promo=initial.promo;cartOptions.pickup=initial.pickup;
  cartOptions.payment=initial.method==='sbp'||initial.method==='linked-sbp'?'sbp':'card';
  paymentDemo.scenario=initial.scenario;paymentDemo.method=initial.method;
  paymentDemo.failureUsed=false;paymentDemo.hasLinked=initial.hasLinked;paymentDemo.hasVisa=initial.hasVisa;
  paymentMethodNames['saved-visa']='Картой •••• 5505';
  pendingPaymentMethod=null;cardDraft=null;cartSubmitting=false;
  branches[0].name='На Петроградской';branches[0].address='Санкт-Петербург, проспект Медиков, 5';
  $('.status-bar>span').textContent='14:25';
  clearTimeout(toastTimer);$('#toast').classList.remove('visible');$('#toast').textContent='';
  refreshBasket();$('#app-scroll').scrollTop=0;
  history.replaceState(null,'',researchLink(researchTask.id,researchModerator));
  updateScenarioDescription();
  if(researchModerator)updateResearchPanel();
}

function updateResearchPanel(){
  const panel=$('#research-panel');if(!panel)return;
  $('#research-task-select').value=researchTask.id;
  $('#research-instruction').textContent=researchTask.instruction;
  $('#research-check').textContent=researchTask.check;
  $('#research-participant-link').href=researchLink(researchTask.id);
}

function mountResearchPanel(){
  if(!researchModerator)return;
  const panel=document.createElement('aside');panel.id='research-panel';
  panel.setAttribute('aria-label','Панель модератора');
  panel.innerHTML=`<h2>Панель модератора</h2><label for="research-task-select">Задание</label><select id="research-task-select">${ResearchConfig.tasks.map(task=>`<option value="${task.id}">${task.id}. ${task.name}</option>`).join('')}</select><h3>Текст для участника</h3><p id="research-instruction"></p><details><summary>Проверка сценария</summary><p id="research-check"></p></details><button id="research-reset" type="button">Начать задание заново</button><a id="research-participant-link" target="_blank" rel="noopener">Открыть режим респондента</a><small>Сброс очищает корзину, историю и результаты предыдущего прохождения. Оплата имитируется. При показе экрана участнику откройте отдельную ссылку без панели модератора.</small>`;
  document.body.append(panel);updateResearchPanel();
  $('#research-task-select').addEventListener('change',event=>startResearchTask(event.target.value));
  $('#research-reset').addEventListener('click',()=>startResearchTask(researchTask.id));
}

document.addEventListener('DOMContentLoaded',()=>{
  mountResearchPanel();startResearchTask(researchTask.id);
});
