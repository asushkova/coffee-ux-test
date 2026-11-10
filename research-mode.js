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
  return cartSchedule().slots.find(slot=>slot.key===cartOptions.pickup)?.label||'14:30–14:35';
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
  paymentMethodNames['saved-visa']='Картой •••• 5505';
  pendingPaymentMethod=null;cardDraft=null;cartSubmitting=false;
  branches[0].name='На Петроградской';branches[0].address='Санкт-Петербург, проспект Медиков, 5';
  $('.status-bar>span').textContent='14:25';
  clearTimeout(toastTimer);$('#toast').classList.remove('visible');$('#toast').textContent='';
  refreshBasket();$('#app-scroll').scrollTop=0;
  history.replaceState(null,'',researchLink(researchTask.id,researchModerator));
  updateScenarioDescription();

}

// Keep the existing checkout layout, with a fixed order and no discount controls.
const fullResearchCart=cartPage;
cartPage=function(){
  const view=document.createElement('template');view.innerHTML=fullResearchCart();
  view.content.querySelector('.flow-products')?.closest('.flow-cart-section')?.remove();
  view.content.querySelector('.basket-points')?.closest('.flow-cart-section')?.remove();
  view.content.querySelector('.flow-promo')?.remove();
  const branch=view.content.querySelector('.flow-branch');
  if(branch){
    const info=document.createElement('div');info.className='flow-branch';
    info.innerHTML=branch.querySelector('span').outerHTML;branch.replaceWith(info);
  }
  for(const quantity of view.content.querySelectorAll('.basket-quantity')){
    const label=document.createElement('span');label.className='checkout-quantity';
    label.textContent=quantity.querySelector('span')?.textContent+' шт.';quantity.replaceWith(label);
  }
  for(const row of view.content.querySelectorAll('.flow-summary dl>div')){
    if(['Списание баллов','Промокод','Начислим'].some(text=>row.querySelector('dt')?.textContent.startsWith(text)))row.remove();
  }
  return view.innerHTML;
};

// Choosing an existing payment method remains available; the case never injects a failure.
const fullPaymentMethods=openBasketPayment;
openBasketPayment=function(){
  fullPaymentMethods();
  document.querySelector('[data-payment-method="new-card"]')?.remove();
};

document.addEventListener('DOMContentLoaded',()=>{
  startResearchTask('1');
  $('#basket-clear').hidden=true;
  for(const tab of document.querySelectorAll('.tab:not([data-tab="cart"])')){
    tab.disabled=true;tab.tabIndex=-1;
  }
});

// Prevent the fixed case from opening order-editing flows through residual actions.
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.matches('[data-flow-add],[data-basket-action="plus"],[data-basket-action="minus"],[data-basket-action="clear"],[data-basket-action="points-on"],[data-basket-action="promo"],[data-action="locations"],[data-action="menu"]')){
    event.preventDefault();event.stopImmediatePropagation();
  }
},true);
