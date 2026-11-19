'use strict';

// Source: Figma section 6589:13649. All images are original local assets.
const flowAssets={
  "6589:18083": {
    "imgProductImage": "assets/happy-flow/41fbf3fa-f30a-49c3-8da1-f325d9768889.png",
    "imgProductImage1": "assets/happy-flow/df93e501-1068-40f2-89f9-dfbd6737e2e4.png",
    "imgProductImage2": "assets/happy-flow/7d677dfd-a1d5-4c78-a3bc-d10e6260a48e.png",
    "imgProductImage3": "assets/happy-flow/a5eb5cc6-6b5c-4358-9084-620d956ddf87.png",
    "imgProductImage4": "assets/happy-flow/4827dbe1-2516-43fa-b017-1f102ce670f3.png",
    "imgOutlineHeart": "assets/happy-flow/4a753da7-0be5-4752-9e13-b9f8bb3737ea.svg"
  },
  "6589:18133": {
    "imgOutlineChevronRight": "assets/happy-flow/cce5a7e8-3b22-4155-990a-1a4cdfda0374.svg",
    "imgLogoBankSber": "assets/happy-flow/172b698a-d38c-401d-9915-c8a5c1ca299a.svg",
    "imgLogoBankTbank": "assets/happy-flow/d01de54d-9c4e-442b-ba0d-4c8aa3794ed8.svg",
    "imgLogoBankVtb": "assets/happy-flow/18ee6639-4803-42da-858c-dc7f8898724b.svg",
    "imgLogoBankRaiffeisen": "assets/happy-flow/7a2eb1d7-861a-41f4-bc00-8097d780fc40.svg",
    "imgLogoBankGazprombank": "assets/happy-flow/b4fc66e5-bea3-4cc9-9d98-d08231220cfb.svg",
    "imgLogoBankPsbank": "assets/happy-flow/a33aa7d9-d5f0-42ef-bb1c-5e22bd0aa2ed.svg",
    "imgLogoBankSovcombank": "assets/happy-flow/e259c2b7-3215-4791-8feb-814aba97d3b2.svg",
    "imgLogoBankRshb": "assets/happy-flow/b45383b7-856e-4237-91ff-a177ff2501b4.svg",
    "imgLogoBankMkb": "assets/happy-flow/891fe42a-c62c-4ec0-a5d8-a3320da1d933.png",
    "imgPath": "assets/happy-flow/a035662e-75f2-4db5-9c68-8d2f85e6da5e.svg",
    "imgLogoBankUnicreditbank": "assets/happy-flow/4aa6c1de-c189-4e5f-b627-5056c43c3837.svg"
  },
  "6589:18288": {
    "imgGroup2085661263": "assets/happy-flow/dc22bb79-943b-4a50-a6ae-b1ea61b02982.svg"
  },
  "6589:18334": {
    "imgIcon": "assets/happy-flow/76ae9a0b-a828-402c-9aa0-116ccfdb2362.svg"
  },
  "6589:18382": {
    "imgGroup20856612601": "assets/happy-flow/e614cdb7-20a2-4ef4-8cb9-91463b025904.png"
  },
  "6589:18390": {
    "imgBankSuccess": "assets/happy-flow/4f8db4ee-f79c-46e2-b7f0-21e9e4bb36b5.png"
  },
  "6589:18047": {
    "imgImg87051": "assets/happy-flow/4db0a2fc-4dd7-4d35-b0ec-b9ab07ce89ff.png"
  },
  "6589:18078": {
    "imgBankLoading": "assets/happy-flow/50dbadbc-b77f-4643-8b83-55c8cc9700ee.png"
  },
  "6589:18080": {
    "imgBankProcessing": "assets/happy-flow/faf6a6ad-1414-4765-88ad-cf05f94104e7.png"
  }
};
const figmaAsset=(name)=>'assets/figma-research/'+name;
const flowImage=(path,alt='',cls='')=>`<img src="${path}" alt="${alt}" class="${cls}">`;
let happyMode=false, happyPayment=null;
const originalCartPage=cartPage;
const originalCloseSheet=closeSheet;
closeSheet=function(restore=true){happyPayment=null;$('#bottom-sheet').classList.remove('flow-sheet','flow-bank','flow-result');$('.screen').classList.remove('flow-overlay');originalCloseSheet(restore);};
const flowBanks=[
 ['sber','Сбербанк','imgLogoBankSber'],['tbank','Т-Банк','imgLogoBankTbank'],['vtb','Банк ВТБ','imgLogoBankVtb'],
 ['alfa','АЛЬФА-БАНК','alfa'],['raiffeisen','Райффайзен Банк','imgLogoBankRaiffeisen'],
 ['gazprom','Газпромбанк','imgLogoBankGazprombank'],['psb','Банк ПСБ','imgLogoBankPsbank'],
 ['sovcom','Совкомбанк','imgLogoBankSovcombank'],['rshb','РСХБ','imgLogoBankRshb'],
 ['mkb','МОСКОВСКИЙ КРЕДИТНЫЙ БАНК','imgLogoBankMkb'],['unicredit','ЮниКредит Банк','imgLogoBankUnicreditbank']
];
function flowHome(){return '<div class="flow-home" aria-hidden="true"><span></span></div>';}
function flowChevron(){return flowImage(flowAssets['6589:18133'].imgOutlineChevronRight);}
function showFlowSheet(title,content,stage){
 sheet(title,content);
 const el=$('#bottom-sheet');el.classList.add('flow-sheet');el.classList.toggle('flow-bank',stage.startsWith('bank-'));
 $('.screen').classList.add('flow-overlay');el.dataset.stage=stage;
 const close=el.querySelector('.close-button'); if(close) close.innerHTML=flowImage(figmaAsset('close.svg')); 
 if(stage==='pending'||stage==='success')el.classList.add('flow-result');else el.classList.remove('flow-result');
}
function startSbpPayment(){
 happyPayment={stage:'banks',amount:calculateCart().total,key:sbpCartKey(),bank:null,digits:0};
 renderHappyPayment();
};
function flowLater(session,stage,next,ms){setTimeout(()=>{if(happyPayment===session&&session.stage===stage&&!$('#bottom-sheet').hidden){session.stage=next;renderHappyPayment();}},ms);}
function renderHappyPayment(){
 const s=happyPayment;if(!s)return;
 const a=flowAssets['6589:18133'];
 if(s.stage==='banks'){
  showFlowSheet('Выберите банк',`<div class="flow-bank-search">${flowImage('assets/happy-flow/sbp-logo.png','СБП','flow-logo')}<label>${flowImage(a.imgOutlineSearch)}<input id="flow-search" placeholder="Введите название банка" aria-label="Поиск банка" autocomplete="off"></label></div><div class="flow-bank-list">${flowBanks.map(([id,name,key])=>`<button data-flow="choose-bank" data-bank="${id}">${key==='imgLogoBankMkb'?`<span class="flow-mkb">${flowImage(a[key])}${flowImage(a.imgPath)}</span>`:flowImage(key==='alfa'?'assets/happy-flow/alfa.svg':a[key],'','flow-bank-logo')}<span>${name}</span>${flowChevron()}</button>`).join('')}<p id="flow-no-banks" hidden>Банк не найден</p></div>${flowHome()}`,'banks');
  return;
 }
 if(s.stage.startsWith('bank-')){
  const source={'bank-pin':flowAssets['6589:18047'].imgImg87051,'bank-loading':flowAssets['6589:18078'].imgBankLoading,'bank-payment':flowAssets['6589:18382'].imgGroup20856612601,'bank-processing':flowAssets['6589:18080'].imgBankProcessing,'bank-success':flowAssets['6589:18390'].imgBankSuccess}[s.stage];
  let controls='';
  if(s.stage==='bank-pin')controls=`<div class="flow-pin-mask" aria-label="Демонстрационный вход: нажмите любые пять цифр">${Array.from({length:5},(_,i)=>`<i class="${i<s.digits?'filled':''}"></i>`).join('')}</div><div class="flow-keypad">${['1','2','3','4','5','6','7','8','9','','0','⌫'].map(n=>n?`<button data-flow="${n==='⌫'?'erase':'digit'}" aria-label="${n==='⌫'?'Стереть цифру':'Демо-вход: '+n}"></button>`:'<span></span>').join('')}</div><button class="flow-hit flow-pin-cancel" data-flow="cancel" aria-label="Вернуться в корзину"></button>`;
  if(s.stage==='bank-payment')controls=`<span class="flow-bank-amount">${money(s.amount)}</span><button class="flow-hit flow-bank-pay" data-flow="confirm">Оплатить ${money(s.amount)}</button><button class="flow-hit flow-bank-cancel" data-flow="cancel" aria-label="Отменить оплату"></button>`;
  if(s.stage==='bank-success')controls=`<span class="flow-bank-amount flow-bank-paid">${money(s.amount)}</span><button class="flow-hit flow-bank-pay" data-flow="return">Обратно к заказу</button><button class="flow-hit flow-bank-cancel" data-flow="return" aria-label="Вернуться на главный"></button>`;
  showFlowSheet('Оплата в банке',`<div class="flow-bank-canvas">${flowImage(source,'Экран демонстрации банковского приложения','flow-bank-source')}${controls}</div>`,s.stage);
  resizeFlowBank();
  if(s.stage==='bank-loading')flowLater(s,'bank-loading','bank-payment',1300);
  if(s.stage==='bank-processing')flowLater(s,'bank-processing',s.outcome&&s.outcome!=='success'?'bank-return':'bank-success',1500);
  return;
 }
 if(s.stage==='pending'){renderPaymentPending(s);return;}
 if(s.stage==='success'){
  showFlowSheet('Заказ оформлен',`<div class="flow-result-content"><div class="flow-success-icon">${flowImage(flowAssets['6589:18334'].imgIcon)}</div><h3>Заказ оформлен!</h3><p>Будет готов к выдаче ${s.pickup.startsWith('через')?'':'в '}${safe(s.pickup)}</p></div><div class="flow-result-footer"><button class="primary-button" data-flow="details" data-number="${s.order.number}">Детали заказа</button>${flowHome()}</div>`,'success');
 }
}
function resizeFlowBank(){
 const c=$('.flow-bank-canvas');if(!c)return;
 const el=$('#bottom-sheet');
 const mobile=window.matchMedia('(max-width: 680px)').matches;
 const scaleY=el.clientHeight/(mobile?724:812);
 c.style.top=mobile?`${-54*scaleY}px`:'0px';
 c.style.transform=`scale(${el.clientWidth/375},${scaleY})`;
}
window.addEventListener('resize',resizeFlowBank);
document.addEventListener('input',e=>{
 if(e.target.id!=='flow-search')return;
 const query=e.target.value.trim().toLocaleLowerCase('ru');
 let count=0;$$('.flow-bank-list button').forEach(b=>{b.hidden=!b.textContent.toLocaleLowerCase('ru').includes(query);if(!b.hidden)count++;});
 $('#flow-no-banks').hidden=count>0;
});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-flow]');if(!b)return;
 const s=happyPayment;if(!s)return;
 switch(b.dataset.flow){
 case 'choose-bank':
  if(s.stage!=='banks')return;
  s.bank=b.dataset.bank;s.stage='bank-pin';s.digits=0;renderHappyPayment();break;
 case 'digit':
  if(s.stage!=='bank-pin')return;
  s.digits++;if(s.digits===5)s.stage='bank-loading';renderHappyPayment();break;
 case 'erase':if(s.stage==='bank-pin'){s.digits=Math.max(0,s.digits-1);renderHappyPayment();}break;
 case 'confirm':if(s.stage==='bank-payment'){s.stage='bank-processing';renderHappyPayment();}break;
 case 'return':if(s.stage==='bank-success'){s.stage='pending';renderHappyPayment();}break;
 case 'cancel':closeSheet();break;
 case 'details':if(s.stage==='success'){const number=s.order.number;closeSheet(false);openActiveOrder(number);}break;
 }
});
const flowCartAssets=flowAssets['6589:18083'];
for(const name of ['imgProductImage','imgProductImage1','imgProductImage2','imgProductImage3','imgProductImage4']) flowCartAssets[name]=figmaAsset('6589-18083-'+name+'.png');
flowCartAssets.imgOutlineMinus='assets/happy-flow/52a50b31-b6af-4e59-9030-6ef46256cea2.svg';
flowCartAssets.imgOutlinePlus='assets/happy-flow/8a7886c2-4192-4d11-9281-af181d30178b.svg';
flowCartAssets.imgOutlineQr='assets/happy-flow/8a0958c1-7d04-457d-a856-44b29900b7d8.svg';
flowAssets['6589:18133'].imgOutlineSearch='assets/happy-flow/2f369552-2a99-43fc-9447-eeb4c303d1bd.svg';
const flowProducts=[
 {id:'flow-flat',name:'Флэт Уайт',unit:'350 мл',price:380,asset:flowCartAssets.imgProductImage,milk:true},
 {id:'flow-frappe',name:'Шоколадный фраппе',unit:'250 мл',price:385,asset:flowCartAssets.imgProductImage1,cold:true},
 {id:'flow-cheesecake',name:'Чизкейк Нью-Йорк',unit:'120 г',price:425,asset:flowCartAssets.imgProductImage2},
 {id:'flow-croissant',name:'Миндальный круассан',unit:'80 г',price:310,asset:flowCartAssets.imgProductImage3},
 {id:'flow-carrot',name:'Морковный торт',unit:'120 г',price:395,asset:flowCartAssets.imgProductImage4}
];
function flowRecommendation(p){return `<article class="flow-product"><div class="flow-product-photo">${flowImage(p.asset,p.name)}<button data-action="favorite" data-id="${p.id}" class="flow-favorite" aria-label="В избранное: ${p.name}">${flowImage(flowCartAssets.imgOutlineHeart)}</button></div><p>${p.name}</p><button data-flow-add="${p.id}">${p.price} ₽ ${flowImage(flowCartAssets.imgOutlinePlus)}</button></article>`;}
cartPage=function(){
 if(!happyMode)return originalCartPage();
 if(!state.cart.length)return `<div class="basket-empty"><img src="${figmaAsset('6589-16488-imgImage4.png')}" alt=""><h1>Здесь пока пусто</h1><p>Добавьте товары для оформления заказа</p><button class="primary-button" data-action="menu">В каталог</button></div>`;
 const a=calculateCart();
 const chosenPickup=cartSchedule().slots.find(slot=>slot.key===cartOptions.pickup&&slot.key!=='research-1430');
 return `<div class="flow-cart-items">${state.cart.map((item,i)=>`<article class="flow-cart-item">${flowImage(product(item.id).asset||'assets/'+product(item.id).image+'.webp',product(item.id).name)}<div><div class="flow-item-name"><h2>${product(item.id).name}</h2><span>${item.unit}</span></div>${item.milk==='Овсяное'?'<p>+ Овсяное молоко</p>':''}<div class="flow-item-controls"><strong>${money(item.price*item.qty)}</strong><div class="basket-quantity"><button data-basket-action="minus" data-index="${i}" aria-label="Уменьшить количество">${flowImage(flowCartAssets.imgOutlineMinus)}</button><span>${item.qty}</span><button data-basket-action="plus" data-index="${i}" aria-label="Увеличить количество">${flowImage(flowCartAssets.imgOutlinePlus)}</button></div></div></div></article>`).join('')}</div><section class="flow-nutrition"><dl>${['274 ккал','13,5 г','14,4 г','21,2 г'].map((v,i)=>`<div><dt>${['энергия','белки','жиры','углеводы'][i]}</dt><dd>${v}</dd></div>`).join('')}</dl></section><section class="flow-cart-section"><h2>Вместе вкуснее</h2><div class="flow-products">${flowProducts.slice(2).filter(p=>!state.cart.some(item=>item.id===p.id)).map(flowRecommendation).join('')}</div></section><button class="flow-branch" data-action="locations"><span><strong>На Петроградской</strong><small>Санкт-Петербург, проспект Медиков, 5</small><small>Открыто до 22:00</small></span>${flowChevron()}</button><section class="flow-cart-section"><h2>Время получения</h2><div class="flow-time-row"><button data-basket-action="time-soon" class="${cartOptions.pickup?'':'selected'}"><strong>Ближайшее</strong><small>через 5 минут</small></button><button data-flow-time class="${cartOptions.pickup==='research-1430'?'selected':''}"><strong>14:30–14:35</strong><small>сегодня</small></button><button data-basket-action="time-custom" class="${chosenPickup?'selected':''}"><strong>${chosenPickup?chosenPickup.label:'Выбрать другое время'}</strong><small>${chosenPickup?chosenPickup.day.toLowerCase():''}</small></button></div></section><section class="flow-cart-section"><h2>Баллы</h2><div class="basket-points"><button data-basket-action="points-off" class="${state.redeem?'':'selected'}">Не списывать</button><button data-basket-action="points-on" class="${state.redeem?'selected':''}">Списать ${a.availablePoints} баллов</button></div></section><section class="flow-cart-section"><h2>Способ оплаты</h2>${flowPaymentMarkup()}</section>${flowPromoMarkup(a)}<section class="flow-summary"><dl><div><dt>Стоимость</dt><dd>${money(a.subtotal)}</dd></div><div><dt>Списание баллов</dt><dd>−${a.points} баллов</dd></div>${a.promo?`<div><dt>Промокод</dt><dd>−${money(a.promo)}</dd></div>`:''}<div class="flow-total"><dt>Итого</dt><dd>${money(a.total)}</dd></div><div><dt>Начислим</dt><dd>${a.earned} баллов</dd></div></dl></section>`;
};
document.addEventListener('click',e=>{
 const add=e.target.closest('[data-flow-add]');
 if(add){const p=product(add.dataset.flowAdd);const existing=state.cart.find(item=>item.id===p.id&&item.unit===p.unit);if(existing)existing.qty++;else state.cart.push({id:p.id,unit:p.unit,price:p.price,qty:1,milk:'Классическое',modifiers:[]});refreshBasket();}
 if(e.target.closest('[data-flow-time]')){cartOptions.pickup='research-1430';refreshBasket();}
});
function openHappyFlow(){
 closeSheet(false);happyMode=true;document.body.classList.add('happy-mode');
 flowProducts.forEach(p=>{if(!product(p.id)){products.push({...p,image:p.id,category:p.milk||p.cold?'coffee':'bakery',description:p.name,meta:''});productRecipes[p.id]={...productRecipes.cappuccino};}});
 state.cart=flowProducts.slice(0,2).map((p,i)=>({id:p.id,price:p.price,unit:p.unit,qty:1,milk:i?'Классическое':'Овсяное',modifiers:[]}));
 state.branch=0;state.branchSelected=true;state.bonus=76;state.redeem=true;cartOptions.promo='';cartOptions.pickup='research-1430';cartOptions.payment='sbp';
 navigate('cart');
 $('#basket-clear').innerHTML=flowImage(figmaAsset('trash.svg'));
 for(const [tab,name] of Object.entries({home:'home.svg',menu:'catalog.svg',cart:'cart.svg',favorites:'6589-18083-imgOutlineHeart1.svg'})) document.querySelector('[data-tab="'+tab+'"]>span').innerHTML=flowImage(figmaAsset(name));
 history.replaceState(null,'',location.pathname+location.search+'#happy-flow');
}

// Reuse the existing pickup-time action with the list presentation from Figma.
const originalOpenBasketTime=openBasketTime;
openBasketTime=function(){
 if(!happyMode){originalOpenBasketTime();return;}
 const schedule=cartSchedule();
 showPaymentSheet('Выберите время получения',`<form id="flow-pickup-form"><div class="flow-pickup-list"><p>${schedule.day}</p><label><span>Ближайшее (через 5 минут)</span><input type="radio" name="pickup" value="" ${cartOptions.pickup?'':'checked'}></label>${schedule.slots.map(slot=>`<label><span>${slot.label}</span><input type="radio" name="pickup" value="${slot.key}" ${slot.key===cartOptions.pickup?'checked':''}></label>`).join('')}</div><div class="payment-methods-footer"><button class="primary-button" type="submit" ${!cartOptions.pickup||schedule.slots.some(slot=>slot.key===cartOptions.pickup)?'':'disabled'}>Выбрать</button></div></form>${flowHome()}`,'pickup','payment-pickup-sheet');
};
document.addEventListener('submit',event=>{
 if(event.target.id!=='flow-pickup-form')return;
 event.preventDefault();
 const selected=event.target.querySelector('input[name=pickup]:checked');
 if(!selected)return;
 cartOptions.pickup=selected.value||null;
 closeSheet();refreshBasket();
});
document.addEventListener('DOMContentLoaded',()=>{if(!location.hash||location.hash==='#happy-flow')openHappyFlow();});
window.addEventListener('hashchange',()=>{if(!location.hash||location.hash==='#happy-flow')openHappyFlow();});


// Existing clear-cart confirmation, styled as the alert in the Figma scenario.
document.addEventListener('click',event=>{
 if(!happyMode||!event.target.closest('[data-basket-action="clear"]'))return;
 event.preventDefault();event.stopImmediatePropagation();
 sheet('Удалить все товары из корзины?',`<div class="figma-alert-actions"><button class="secondary-button" data-action="close-sheet">Отменить</button><button class="primary-button" data-basket-action="confirm-clear">Удалить</button></div>`);
 const el=$('#bottom-sheet');el.classList.remove('flow-sheet','flow-result','payment-pickup-sheet');el.classList.add('figma-alert');
},true);

document.addEventListener('change',event=>{
 if(event.target.matches('#flow-pickup-form input')) $('#flow-pickup-form button[type=submit]').disabled=false;
});
