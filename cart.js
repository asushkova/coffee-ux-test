'use strict';

const cartOptions={promo:'',payment:'sbp',pickup:null};
const cartPayments=[
  {id:'sbp',name:'СБП',description:'Система быстрых платежей',icon:'qr-code'},
  {id:'card',name:'Картой онлайн',description:'Банковская карта',icon:'credit-card'},
  {id:'pickup',name:'При получении',description:'Картой или наличными в кофейне',icon:'wallet'}
];
let cartSubmitting=false;

function calculateCart(){
  const subtotal=cartSubtotal();
  const promo=cartOptions.promo==='NEW100'&&subtotal>=400?100:0;
  const availablePoints=Math.min(state.bonus,Math.floor(Math.max(0,subtotal-promo)*.3));
  const points=state.redeem?availablePoints:0;
  const total=Math.max(0,subtotal-promo-points);
  return {subtotal,promo,availablePoints,points,total,earned:Math.floor(total*.05),quantity:state.cart.reduce((n,item)=>n+item.qty,0)};
}
function cartNutrition(){
  const totals=[0,0,0,0];
  state.cart.forEach(item=>{
    let nutrients;
    if(item.id==='morning-combo')nutrients=productRecipes.cappuccino.nutrition.map((n,i)=>n*2.5+productRecipes.croissant.nutrition[i]*.8);
    else nutrients=productRecipes[item.id].nutrition.map(n=>n*parseInt(item.unit)/100);
    nutrients.forEach((value,index)=>totals[index]+=value*item.qty);
  });
  return `<section class="basket-nutrition" aria-label="Пищевая ценность на весь заказ. Пример расчёта по базовым рецептам, без добавок."><dl>${totals.map((n,i)=>`<div><dt>${['энергия','белки','жиры','углеводы'][i]}</dt><dd>${i?n.toFixed(1).replace('.',',')+' г':Math.round(n)+' ккал'}</dd></div>`).join('')}</dl></section>`;
}
function basketItem(item,index){
  const p=product(item.id);
  const description=[item.milk&&item.milk!=='Классическое'?`${item.milk} молоко`:null,...(item.modifiers||[]),item.temperature==='Тёплый'?'Тёплый':null,item.temperature==='Меньше льда'?'Меньше льда':null].filter(Boolean);
  const saved=state.favorites.has(item.id);
  return `<div class="basket-swipe" data-index="${index}"><div class="basket-swipe-actions"><button class="basket-swipe-delete" data-basket-action="delete" data-index="${index}" aria-label="Удалить: ${p.name}">${icon('trash-2')}<span>Удалить</span></button><button class="basket-swipe-favorite${saved?' saved':''}" data-basket-action="favorite" data-index="${index}" aria-pressed="${saved}" aria-label="${saved?'Убрать из избранного':'В избранное'}: ${p.name}">${icon('heart')}<span>Избранное</span></button></div><article class="basket-item"><img src="${p.asset||'assets/'+p.image+'.webp'}" alt="${p.name}" width="80" height="80" draggable="false"><div class="basket-item-content"><div class="basket-item-heading"><h2>${p.name}</h2><span>${safe(item.unit)}</span></div>${description.length?`<p class="basket-item-options">${description.map(option=>'+ '+safe(option)).join('<br>')}</p>`:''}<div class="basket-item-bottom"><strong>${money(item.price*item.qty)}</strong><div class="basket-quantity" role="group" aria-label="Количество: ${p.name}"><button data-basket-action="minus" data-index="${index}" aria-label="${item.qty===1?'Удалить':'Уменьшить количество'}: ${p.name}">${icon('minus')}</button><span aria-label="${item.qty} шт.">${item.qty}</span><button data-basket-action="plus" data-index="${index}" aria-label="Увеличить количество: ${p.name}">${icon('plus')}</button></div></div></div></article></div>`;
}
function basketRecommendations(){
  const candidates=['croissant','sandwich','iced-latte','matcha','cappuccino'].filter(id=>!state.cart.some(item=>item.id===id)).slice(0,3);
  if(!candidates.length)return '';
  return `<section class="basket-section basket-recommendations"><div class="basket-section-title"><h2>Вместе вкуснее</h2><span>К вашей маленькой радости</span></div><div class="horizontal-scroll">${candidates.map(repeatCard).join('')}</div></section>`;
}
function basketBranch(){
  if(!state.branchSelected)return `<button class="basket-branch" data-action="locations"><span class="basket-branch-copy"><strong>Выберите кофейню</strong><span>Где заберёте заказ</span></span>${icon('chevron-right')}</button>`;
  const b=branches[state.branch],hours=b.hours.split('–');
  return `<button class="basket-branch" data-action="locations" aria-label="Выбрать кофейню. ${safe(b.name)}, ${safe(b.address)}"><span class="basket-branch-copy"><strong>${safe(b.name)}</strong><span>${safe(b.address)}</span><span>С ${hours[0]} до ${hours[1]}</span></span>${icon('chevron-right')}</button>`;
}
function formatClock(minutes){return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;}
function cartSchedule(){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
  const now=Number(parts.hour)*60+Number(parts.minute);
  const [opening,closing]=branches[state.branch].hours.split('–').map(time=>{const[h,m]=time.split(':').map(Number);return h*60+m;});
  let first=Math.max(opening,Math.ceil((now+10)/15)*15),offset=0;
  if(first>closing-15){first=opening;offset=1;}
  const date=new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day)+offset)).toISOString().slice(0,10);
  const day=offset?'Завтра':'Сегодня';
  const slots=[];for(let minute=first;minute<=closing-15;minute+=15)slots.push({key:`${date}T${formatClock(minute)}`,label:`${formatClock(minute)}–${formatClock(minute+5)}`,day});
  const nearestLabel=offset||now<opening?'К открытию':'Ближайшее';
  const nearestHint=offset?`завтра, ${formatClock(opening)}`:now<opening?`сегодня, ${formatClock(opening)}`:'через 7–10 мин';
  return {slots,nearestLabel,nearestHint,day,first:slots[0]};
}
function selectedPickupText(){const schedule=cartSchedule();const chosen=schedule.slots.find(slot=>slot.key===cartOptions.pickup);return chosen?`${chosen.day.toLowerCase()}, ${chosen.label}`:schedule.nearestHint;}
function basketPickup(){
  const schedule=cartSchedule();
  if(cartOptions.pickup&&!schedule.slots.some(slot=>slot.key===cartOptions.pickup))cartOptions.pickup=null;
  const second=schedule.slots[1]||schedule.slots[0];
  const custom=cartOptions.pickup&&cartOptions.pickup!==second?.key;
  const chosen=schedule.slots.find(slot=>slot.key===cartOptions.pickup);
  return `<section class="basket-section"><div class="basket-section-title"><h2>Время получения</h2></div><div class="basket-time-row" role="group" aria-label="Время получения заказа"><button class="basket-time${!cartOptions.pickup?' selected':''}" data-basket-action="time-soon" aria-pressed="${!cartOptions.pickup}"><strong>${schedule.nearestLabel}</strong><span>${schedule.nearestHint}</span></button>${second?`<button class="basket-time${cartOptions.pickup===second.key?' selected':''}" data-basket-action="time-slot" data-slot="${second.key}" aria-pressed="${cartOptions.pickup===second.key}"><strong>${second.label}</strong><span>${second.day.toLowerCase()}</span></button>`:''}<button class="basket-time basket-time-custom${custom?' selected':''}" data-basket-action="time-custom" aria-pressed="${!!custom}"><strong>${custom?chosen.label:'Другое время'}</strong><span>${custom?chosen.day.toLowerCase():'Выбрать'} ${icon('chevron-right')}</span></button></div></section>`;
}
function basketPoints(){const amount=calculateCart();return `<section class="basket-section"><div class="basket-section-title"><h2>Баллы</h2><span class="basket-balance">${icon('sparkles')}${state.bonus.toLocaleString('ru-RU')} на балансе</span></div><div class="basket-points" role="group" aria-label="Использование баллов"><button data-basket-action="points-off" class="${state.redeem?'':'selected'}" aria-pressed="${!state.redeem}">Не списывать</button><button data-basket-action="points-on" class="${state.redeem?'selected':''}" aria-pressed="${state.redeem}" ${amount.availablePoints?'':'disabled'}>Списать ${amount.availablePoints} баллов</button></div><p class="basket-points-note">Можно оплатить до 30% после скидок</p></section>`;}
function basketPayment(){const payment=cartPayments.find(p=>p.id===cartOptions.payment);return `<section class="basket-section"><div class="basket-section-title"><h2>Способ оплаты</h2></div><button class="basket-setting" data-basket-action="payment"><span class="basket-setting-icon">${icon(payment.icon)}</span><span><strong>${payment.name}</strong><small>${payment.description}</small></span>${payment.id==='sbp'?'<span class="basket-payment-tag">Быстро</span>':''}${icon('chevron-right')}</button></section>`;}
function basketPromo(){const amount=calculateCart();return `<button class="basket-setting basket-promo" data-basket-action="promo"><span class="basket-setting-icon">${icon('ticket-percent')}</span><span><strong>Промокод</strong><small>${cartOptions.promo?safe(cartOptions.promo)+(amount.promo?' · −100 ₽':' · действует от 400 ₽'):'Есть код на маленькую радость?'}</small></span>${cartOptions.promo&&amount.promo?icon('circle-check'):icon('chevron-right')}</button>`;}
function basketSummary(){const a=calculateCart();return `<section class="basket-summary" aria-label="Расчёт стоимости"><dl><div><dt>Стоимость</dt><dd>${money(a.subtotal)}</dd></div><div><dt>Списание баллов</dt><dd class="${a.points?'basket-saving':''}">${a.points?'−'+money(a.points):'0 ₽'}</dd></div><div><dt>Промокод${cartOptions.promo?' '+safe(cartOptions.promo):''}</dt><dd class="${a.promo?'basket-saving':''}">${a.promo?'−'+money(a.promo):'0 ₽'}</dd></div><div class="basket-total"><dt>Итого</dt><dd id="basket-total">${money(a.total)}</dd></div><div class="basket-earned"><dt>${icon('sparkles')}Начислим</dt><dd>${a.earned} баллов</dd></div></dl></section>`;}
function cartPage(){
  if(!state.cart.length)return `<div class="basket-empty"><span class="basket-empty-icon">${icon('shopping-bag')}</span><h1>Здесь будет вкусно</h1><p>Добавьте любимый кофе и что-нибудь<br>к нему — для хорошего дня.</p><button class="primary-button" data-action="menu">Выбрать в меню ${icon('arrow-right')}</button><button class="text-link" data-basket-action="demo">Посмотреть пример заказа</button></div>`;
  return `<div class="basket-items">${state.cart.map(basketItem).join('')}</div>${cartNutrition()}${basketRecommendations()}${basketBranch()}${basketPickup()}${basketPoints()}${basketPayment()}${basketPromo()}${basketSummary()}<p class="basket-final-note">${icon('heart')}Приготовим с заботой о вас</p>`;
}
function updateCartChrome(){
  const onCart=state.tab==='cart',amount=calculateCart();
  $('.screen').classList.toggle('basket-opened',onCart);
  $('.app-header').hidden=onCart;
  $('#basket-header').hidden=!onCart;
  $('#basket-clear').disabled=!amount.quantity;
  $('#mini-cart').hidden=onCart||!amount.quantity;
  const badge=$('#basket-tab-count');badge.hidden=!amount.quantity;badge.textContent=amount.quantity>99?'99+':amount.quantity;
  $('[data-tab="cart"]').setAttribute('aria-label',amount.quantity?`Корзина, товаров: ${amount.quantity}`:'Корзина');
  $('#basket-checkout-bar').hidden=!onCart||!amount.quantity;
  $('#basket-pay-label').textContent=`${cartOptions.payment==='pickup'?'Оформить':'Оплатить'} ${money(amount.total)}`;
}
function refreshBasket(focusSelector){
  if(state.tab==='cart'){
    const scroll=$('#app-scroll'),position=scroll.scrollTop;
    const rows=$$('.horizontal-scroll,.basket-time-row').map(el=>el.scrollLeft);
    $('#page-content').innerHTML=cartPage();icons();scroll.scrollTop=position;
    $$('.horizontal-scroll,.basket-time-row').forEach((el,i)=>el.scrollLeft=rows[i]||0);
    if(focusSelector)$(focusSelector)?.focus({preventScroll:true});
  }
  updateCartChrome();
}
function openBasketTime(){
  const schedule=cartSchedule();
  sheet('Когда приготовить?',`<p class="sheet-description">${branches[state.branch].name} · ${branches[state.branch].hours}</p><form id="basket-time-form"><label class="basket-form-label" for="basket-time-select">${schedule.day}, время получения</label><select class="basket-form-input" id="basket-time-select" name="time">${schedule.slots.map(slot=>`<option value="${slot.key}" ${slot.key===cartOptions.pickup?'selected':''}>${slot.label}</option>`).join('')}</select><button class="primary-button basket-form-submit" type="submit">Выбрать время</button></form>`);
}
function openBasketPayment(){sheet('Способ оплаты',`${cartPayments.map(p=>`<button class="basket-payment-option${p.id===cartOptions.payment?' selected':''}" data-basket-action="set-payment" data-payment="${p.id}"><span class="basket-setting-icon">${icon(p.icon)}</span><span><strong>${p.name}</strong><small>${p.description}</small></span>${icon(p.id===cartOptions.payment?'circle-check':'circle')}</button>`).join('')}<p class="demo-note">Выбор для прототипа. Данные карты не запрашиваются, настоящая оплата не проводится.</p>`);}
function openBasketPromo(){sheet('Маленькая приятная скидка',`<p class="sheet-description">Введите промокод — проверим его и пересчитаем заказ.</p><form id="basket-promo-form"><label class="basket-form-label" for="basket-promo-input">Промокод</label><input class="basket-form-input" id="basket-promo-input" name="promo" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="30" value="${safe(cartOptions.promo)}" placeholder="Например, NEW100" aria-describedby="basket-promo-error"><p id="basket-promo-error" class="basket-form-error" role="alert"></p><button type="submit" class="primary-button">Применить</button></form>${cartOptions.promo?'<button class="secondary-button basket-form-submit" data-basket-action="remove-promo">Убрать промокод</button>':''}<p class="demo-note">Для демонстрации: NEW100 даёт скидку 100 ₽ при заказе от 400 ₽.</p>`);}
function changeBasketQuantity(index,delta){
  const item=state.cart[index];if(!item)return;
  item.qty+=delta;state.cart=state.cart.filter(c=>c.qty>0);
  if(!state.cart.length){state.redeem=false;cartOptions.promo='';}
  updateCart();
  const remaining=Math.min(index,state.cart.length-1);
  if(remaining>=0)$(`[data-basket-action="${delta>0?'plus':'minus'}"][data-index="${remaining}"]`)?.focus({preventScroll:true});
  else $('#basket-header-title').focus({preventScroll:true});
}
function demoBasket(){
  if(!state.cart.length){addToCart('cappuccino',{milk:'Кокосовое',price:350});addToCart('croissant');}
  navigate('cart');
}
function checkoutBasket(){
  if(!state.cart.length||cartSubmitting)return;
  if(!state.branchSelected){openLocations();return;}
  if(cartOptions.payment==='sbp'){startSbpPayment();return;}
  completeBasketOrder();
}
function completeBasketOrder({showConfirmation=true,pickupOverride}={}){
  if(!state.cart.length||cartSubmitting)return;
  cartSubmitting=true;
  const amount=calculateCart(),pickup=pickupOverride||selectedPickupText(),payment=cartPayments.find(p=>p.id===cartOptions.payment);
  const number=1043+state.orders.length;
  state.orders.unshift({number,status:'preparing',items:state.cart.map(item=>({...item,modifiers:[...(item.modifiers||[])]})),total:amount.total,branch:branches[state.branch].name,pickup,payment:payment.name,paid:payment.id!=='pickup',pointsSpent:amount.points,pointsEarned:amount.earned,promo:cartOptions.promo});
  state.bonus=state.bonus-amount.points+amount.earned;
  state.cart=[];state.redeem=false;cartOptions.promo='';cartOptions.pickup=null;
  renderPage();
  if(!showConfirmation){cartSubmitting=false;return state.orders[0];}
  sheet('Ваша маленькая радость',`<div class="success-flower" aria-hidden="true">✳</div><h3 class="success-title">${payment.id==='sbp'?'Оплата прошла':'Заказ оформлен'}</h3><div class="success-number">№ ${number}</div><p class="sheet-description" style="text-align:center">${branches[state.branch].name}<br>Получение: ${safe(pickup)}</p><div class="basket-confirm-details"><span>${money(amount.total)}</span><span>${payment.name}</span></div><p class="sheet-description" style="text-align:center">Начислили ${amount.earned} баллов</p><button class="primary-button" data-action="order-home">Следить за заказом ${icon('arrow-right')}</button><p class="demo-note">Демонстрационный заказ. Деньги не списаны, заказ не отправлен в кофейню.</p>`);
  cartSubmitting=false;
}

function sbpCartKey(){return JSON.stringify([state.cart,state.branch,state.redeem,state.bonus,cartOptions]);}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-basket-action]');if(!button)return;
  switch(button.dataset.basketAction){
    case 'back':navigate('home');break;
    case 'plus':changeBasketQuantity(Number(button.dataset.index),1);break;
    case 'minus':changeBasketQuantity(Number(button.dataset.index),-1);break;
    case 'delete':removeBasketItem(Number(button.dataset.index));break;
    case 'favorite':{
      const item=state.cart[Number(button.dataset.index)];if(!item)break;
      toggleFavorite(item.id);
      const saved=state.favorites.has(item.id);
      document.querySelectorAll('.basket-swipe-favorite').forEach(control=>{
        if(state.cart[Number(control.dataset.index)]?.id!==item.id)return;
        control.classList.toggle('saved',saved);control.setAttribute('aria-pressed',String(saved));
        control.setAttribute('aria-label',`${saved?'Убрать из избранного':'В избранное'}: ${product(item.id).name}`);
      });
      break;
    }
    case 'clear':sheet('Очистить корзину?',`<p class="sheet-description">Уберём все товары. Вы сможете снова выбрать любимое в меню.</p><button class="primary-button" data-basket-action="confirm-clear">Очистить</button><button class="secondary-button basket-form-submit" data-action="close-sheet">Оставить товары</button>`);break;
    case 'confirm-clear':state.cart=[];state.redeem=false;cartOptions.promo='';cartOptions.pickup=null;closeSheet(false);updateCart();$('#basket-header-title').focus({preventScroll:true});break;
    case 'points-off':state.redeem=false;refreshBasket('[data-basket-action="points-off"]');break;
    case 'points-on':state.redeem=true;refreshBasket('[data-basket-action="points-on"]');break;
    case 'payment':openBasketPayment();break;
    case 'set-payment':cartOptions.payment=button.dataset.payment;refreshBasket();closeSheet();break;
    case 'promo':openBasketPromo();break;
    case 'remove-promo':cartOptions.promo='';refreshBasket();closeSheet();toast('Промокод убран');break;
    case 'time-soon':cartOptions.pickup=null;refreshBasket('[data-basket-action="time-soon"]');break;
    case 'time-slot':cartOptions.pickup=button.dataset.slot;refreshBasket('[data-basket-action="time-slot"]');break;
    case 'time-custom':openBasketTime();break;
    case 'pay':checkoutBasket();break;
    case 'demo':demoBasket();break;
  }
});
document.addEventListener('submit',event=>{
  if(event.target.id==='basket-promo-form'){
    event.preventDefault();const input=$('#basket-promo-input'),code=input.value.trim().toUpperCase(),error=$('#basket-promo-error');
    if(code!=='NEW100'){error.textContent=code?'Такого промокода нет. Проверьте написание.':'Введите промокод.';input.setAttribute('aria-invalid','true');input.focus();return;}
    if(cartSubtotal()<400){error.textContent='Этот промокод действует при заказе от 400 ₽.';input.setAttribute('aria-invalid','true');input.focus();return;}
    cartOptions.promo=code;refreshBasket();closeSheet();toast('Применили скидку 100 ₽');
  }
  if(event.target.id==='basket-time-form'){
    event.preventDefault();const value=$('#basket-time-select').value;
    if(!cartSchedule().slots.some(slot=>slot.key===value)){openBasketTime();return;}
    cartOptions.pickup=value;refreshBasket();closeSheet();
  }
});
document.addEventListener('input',event=>{if(event.target.id==='basket-promo-input'){event.target.removeAttribute('aria-invalid');$('#basket-promo-error').textContent='';}});
function syncCartLink(){
  if(location.hash==='#cart-demo'){demoBasket();return;}
  if(location.hash==='#cart'&&state.tab!=='cart')navigate('cart');
}
window.addEventListener('hashchange',syncCartLink);
// Defer initial rendering until the main script and product details have initialized.
function initializeCart(){updateCartChrome();syncCartLink();}

document.addEventListener('DOMContentLoaded',initializeCart);

// Keep vertical scrolling native; capture the pointer only after a horizontal drag.
let basketSwipe=null;
let basketSwipeClickUntil=0;
function closeBasketSwipe(row){
  row.classList.remove('swipe-open','swipe-delete-open','swipe-dragging');
  row.dataset.swipeOffset='0';
  row.querySelector('.basket-item').style.transform='';
}
function removeBasketItem(index){
  const item=state.cart[index];if(!item)return;
  const name=product(item.id).name;
  changeBasketQuantity(index,-item.qty);
  toast(`${name} — удалено из корзины`);
}
document.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0)return;
  const row=event.target.closest('.basket-swipe');
  document.querySelectorAll('.basket-swipe.swipe-open').forEach(open=>{if(open!==row)closeBasketSwipe(open);});
  if(!row||event.target.closest('button'))return;
  basketSwipe={row,id:event.pointerId,x:event.clientX,y:event.clientY,offset:Number(row.dataset.swipeOffset||0),dragging:false};
});
document.addEventListener('pointermove',event=>{
  const swipe=basketSwipe;if(!swipe||event.pointerId!==swipe.id)return;
  const dx=event.clientX-swipe.x,dy=event.clientY-swipe.y;
  if(!swipe.dragging){
    if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
    if(Math.abs(dy)>=Math.abs(dx)){basketSwipe=null;return;}
    swipe.dragging=true;swipe.row.classList.add('swipe-dragging');
    swipe.row.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
  swipe.distance=Math.max(-swipe.row.clientWidth,Math.min(0,swipe.offset+dx));
  swipe.row.querySelector('.basket-item').style.transform=`translateX(${swipe.distance}px)`;
},{passive:false});
function finishBasketSwipe(event){
  const swipe=basketSwipe;if(!swipe||event.pointerId!==swipe.id)return;
  basketSwipe=null;
  if(!swipe.dragging)return;
  basketSwipeClickUntil=Date.now()+350;
  if(swipe.row.hasPointerCapture(event.pointerId))swipe.row.releasePointerCapture(event.pointerId);
  swipe.row.classList.remove('swipe-dragging');
  if(event.type==='pointerup'&&-swipe.distance>=Math.max(230,swipe.row.clientWidth*.8)){
    removeBasketItem(Number(swipe.row.dataset.index));return;
  }
  const distance=event.type==='pointerup'?-swipe.distance:0;
  const offset=distance>108?-144:distance>30?-72:0;
  swipe.row.dataset.swipeOffset=String(offset);
  swipe.row.classList.toggle('swipe-open',offset!==0);
  swipe.row.classList.toggle('swipe-delete-open',offset===-144);
  swipe.row.querySelector('.basket-item').style.transform='';
}
document.addEventListener('pointerup',finishBasketSwipe);
document.addEventListener('pointercancel',finishBasketSwipe);
document.addEventListener('lostpointercapture',finishBasketSwipe);
document.addEventListener('dragstart',event=>{if(event.target.closest('.basket-swipe'))event.preventDefault();});
document.addEventListener('click',event=>{
  if(Date.now()<basketSwipeClickUntil){event.preventDefault();event.stopImmediatePropagation();}
},true);
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')document.querySelectorAll('.basket-swipe.swipe-open').forEach(closeBasketSwipe);
});
