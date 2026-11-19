'use strict';

const researchParams=new URLSearchParams(location.search);
const researchModerator=false;
let researchTask=ResearchConfig.taskById(researchParams.get('task'));
document.body.classList.add('research-participant','single-checkout');

const liveCartSchedule=cartSchedule;
cartSchedule=function(){return happyMode?ResearchConfig.schedule():liveCartSchedule();};
const liveSelectedPickupText=selectedPickupText;
selectedPickupText=function(){
  if(!happyMode)return liveSelectedPickupText();
  const schedule=cartSchedule();
  return schedule.slots.find(slot=>slot.key===cartOptions.pickup)?.label||schedule.nearestHint;
};

function researchLink(){
  const url=new URL(location.href);url.search='';url.hash='happy-flow';return url.href;
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
  paymentMethodNames['new-card']='Новой картой';
  pendingPaymentMethod=null;cardDraft=null;cartSubmitting=false;
  branches[0].name='На Петроградской';branches[0].address='Санкт-Петербург, проспект Медиков, 5';
  $('.status-bar>span').textContent='14:25';
  clearTimeout(toastTimer);$('#toast').classList.remove('visible');$('#toast').textContent='';
  refreshBasket();$('#app-scroll').scrollTop=0;
  history.replaceState(null,'',researchLink(researchTask.id,researchModerator));
  updateScenarioDescription();

}

// Keep the cart controls and recommendations from the mockup.
const fullResearchCart=cartPage;
cartPage=function(){
  const view=document.createElement('template');view.innerHTML=fullResearchCart();
  const branch=view.content.querySelector('.flow-branch');
  if(branch){
    const info=document.createElement('div');info.className='flow-branch';
    info.innerHTML=branch.innerHTML;branch.replaceWith(info);
  }
  for(const label of view.content.querySelectorAll('.flow-summary dt')){
    if(label.textContent==='Списание баллов')label.textContent='Списание баллов (10%)';
    if(label.textContent==='Начислим')label.textContent='Начислим (15%)';
  }
  return view.innerHTML;
};

const fullCartCalculation=calculateCart;
calculateCart=function(){
  if(!happyMode)return fullCartCalculation();
  const subtotal=cartSubtotal();
  const promo=cartOptions.promo==='NEW100'&&subtotal>=400?100:0;
  const availablePoints=Math.min(state.bonus,Math.floor(Math.max(0,subtotal-promo)*.1));
  const points=state.redeem?availablePoints:0;
  const total=Math.max(0,subtotal-promo-points);
  return {subtotal,promo,availablePoints,points,total,earned:Math.floor(total*.15),quantity:state.cart.reduce((n,item)=>n+item.qty,0)};
};

// Only the two requested payment options are offered, including after saving a card.
const fullPaymentMethods=openBasketPayment;
openBasketPayment=function(){
  paymentDemo.hasLinked=false;paymentDemo.hasVisa=false;
  fullPaymentMethods();
};

document.addEventListener('DOMContentLoaded',()=>{
  startResearchTask('1');
  for(const tab of document.querySelectorAll('.tab:not([data-tab="cart"])')){
    tab.disabled=true;tab.tabIndex=-1;
  }
});
