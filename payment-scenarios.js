'use strict';

// Local payment simulator. Saved methods represent tokens; card details never leave the form.
// SBP binding: https://www.cbr.ru/PSystem/sfp
// Payment outcomes: https://yookassa.ru/developers/payment-acceptance/after-the-payment/declined-payments
const paymentScenarios = [
  { id:'sbp', name:'СБП · новый счёт', method:'sbp', outcome:'success', note:'Корзина → выбор банка → банк → возврат → успешный заказ.' },
  { id:'linked-sbp', name:'1. Привязанный счёт СБП', method:'linked-sbp', outcome:'success', note:'Счёт уже привязан к магазину с согласия пользователя. Повторная оплата проходит без перехода в банк.' },
  { id:'saved-visa', name:'2. Привязанная Visa', method:'saved-visa', outcome:'success', note:'Выбрана сохранённая Visa •• 4242. Оплата без повторного ввода реквизитов.' },
  { id:'new-card', name:'3. Новая карта и ошибки полей', method:'new-card', outcome:'success', note:'Отправьте пустую форму или введите неверные реквизиты. Тестовую карту можно подставить кнопкой ниже.' },
  { id:'promo', name:'4. Промокод', method:'linked-sbp', outcome:'success', note:'NEW100 — скидка 100 ₽ от 400 ₽. Любой другой код показывает ошибку. Откройте «Промокод» в корзине.' },
  { id:'payment-error', name:'5. Ошибка оплаты', method:'saved-visa', outcome:'error', note:'Первая попытка завершится ошибкой. Корзина и баллы сохранятся. Повторная попытка — успешная.' },
  { id:'insufficient', name:'6. Недостаточно средств', method:'saved-visa', outcome:'insufficient', note:'Банк отклонит первую оплату: недостаточно средств. Можно сменить способ оплаты или повторить попытку.' },
  { id:'interrupted', name:'7. Возврат из банка без оплаты', method:'sbp', outcome:'interrupted', note:'На экране банка нажмите «Вернуться в приложение». Сначала проверяется статус платежа, затем показывается незавершённая оплата.' },
  { id:'cancel-pending', name:'8. Прерывание ожидания банка', method:'linked-sbp', outcome:'success', holdPending:true, note:'Оплатите заказ, затем нажмите крестик на экране ожидания. В диалоге можно продолжить ожидание или прервать оплату.' }
];
const paymentDemo = { scenario:'sbp', method:'sbp', failureUsed:false, hasLinked:false, hasVisa:false };
const paymentMethodNames = { sbp:'Новый счёт СБП', 'linked-sbp':'Сбербанк · СБП', 'saved-visa':'Картой •••• 5505', 'new-card':'Новая карта' };
let cardDraft = null;
let pendingPaymentMethod = null;
const renderBasePayment = renderHappyPayment;
const closeBasePaymentSheet = closeSheet;

closeSheet = function(restore=true) {
  if(restore && happyPayment && ['pending','confirm-cancel'].includes(happyPayment.stage)) {
    openPaymentAbortDialog();
    return;
  }
  $('#payment-abort-confirm')?.remove();
  cardDraft = null;
  $('#bottom-sheet').classList.remove('payment-form-sheet','payment-result-sheet','payment-methods-sheet','payment-promo-sheet','payment-pickup-sheet','figma-alert');
  closeBasePaymentSheet(restore);
};

function paymentIcon(method) {
  if(method==='linked-sbp') return flowImage(flowAssets['6589:18133'].imgLogoBankSber,'','payment-bank-mark');
  if(method==='saved-visa') return flowImage(figmaAsset('6608-21119-imgLogoVisa.svg'),'','payment-visa-logo');
  return flowImage(figmaAsset(method==='sbp'?'sbp.svg':'card.svg'));
}

function flowPaymentMarkup() {
  const method = paymentDemo.method;
  return `<button class="flow-payment" data-basket-action="payment"><span class="flow-payment-icon">${paymentIcon(method)}</span><span>${paymentMethodNames[method]}</span>${method==='sbp'?'<small>самый быстрый</small>':''}${flowChevron()}</button>`;
}

function flowPromoMarkup(amount) {
  return `<button class="flow-promo${amount.promo?' promo-applied':''}" data-basket-action="promo"><span class="figma-promo-icon">${flowImage(figmaAsset('promo.svg'))}</span><span>Промокод<small>${amount.promo?`${safe(cartOptions.promo)} · скидка ${money(amount.promo)}`:'Введите промокод'}</small></span>${flowChevron()}</button>`;
}

function showPaymentSheet(title, content, stage, extraClass='') {
  const el = $('#bottom-sheet');
  el.classList.remove('payment-form-sheet','payment-result-sheet','payment-methods-sheet','payment-promo-sheet','payment-pickup-sheet','figma-alert');
  showFlowSheet(title, content, stage);
  if(extraClass) el.classList.add(extraClass);
}

openBasketPayment = function() {
  const methods = [...(paymentDemo.hasLinked?['linked-sbp']:[]), 'sbp', ...(paymentDemo.hasVisa?['saved-visa']:[]), 'new-card'];
  pendingPaymentMethod=paymentDemo.method;
  showPaymentSheet('Способ оплаты', `<div class="payment-method-list">${methods.map(method=>`<button data-payment-method="${method}" aria-pressed="${paymentDemo.method===method}"><span class="payment-method-icon">${method==='sbp'?flowImage(figmaAsset('6608-21119-imgGroup2085661267.svg')):method==='new-card'?flowImage(figmaAsset('6608-21119-imgGroup2085661268.svg')):paymentIcon(method)}</span><span><strong>${method==='new-card'?'Новой картой':paymentMethodNames[method]}</strong></span></button>`).join('')}</div><div class="payment-methods-footer"><button class="primary-button" data-payment-action="apply-method">Применить</button></div>${flowHome()}`, 'methods', 'payment-methods-sheet');
};

function selectPaymentMethod(method) {
  if(!paymentMethodNames[method]) return;
  paymentDemo.method = method;
  cartOptions.payment = method==='sbp'||method==='linked-sbp'?'sbp':'card';
  closeSheet();
  refreshBasket();
}

checkoutBasket = function() {
  if(!state.cart.length || cartSubmitting || happyPayment) return;
  if(!state.branchSelected) { openLocations(); return; }
  if(cartOptions.payment==='pickup') { completeBasketOrder(); return; }
  startPrototypePayment();
};

function startPrototypePayment() {
  if(!state.cart.length) return;
  const scenario = paymentScenarios.find(item=>item.id===paymentDemo.scenario);
  const method = paymentDemo.method;
  happyPayment = {
    method, stage:method==='sbp'?'banks':method==='new-card'?'card-form':'pending',
    amount:calculateCart().total, key:sbpCartKey(), bank:null, digits:0,
    outcome:paymentDemo.failureUsed?'success':scenario.outcome,
    pendingStarted:false, committed:false, holdPending:!!scenario.holdPending
  };
  renderHappyPayment();
}
startSbpPayment = startPrototypePayment;

function paymentSessionIsActive(session) {
  return happyPayment===session && !$('#bottom-sheet').hidden;
}

function paymentResultMarkup(title, description, kind) {
  return `<div class="payment-result-body"><div class="payment-result-symbol ${kind}">${flowImage(figmaAsset('6608-25940-imgIcon.svg'))}</div><h3>${title}</h3><p>${description}</p></div><div class="payment-result-actions"><button class="primary-button" data-payment-action="retry">Попробовать еще раз</button><button class="secondary-button" data-payment-action="change-method">Выбрать другой способ оплаты</button><button class="payment-text-button" data-payment-action="back-cart">Вернуться в корзину</button></div>${flowHome()}`;
}

renderHappyPayment = function() {
  const s = happyPayment;
  if(!s) return;
  if(s.stage==='card-form') { renderNewCardForm(); return; }
  if(s.stage==='bank-return') { s.stage='pending'; renderPaymentPending(s); return; }
  if(['error','insufficient','interrupted'].includes(s.stage)) {
    const copy = {
      error:['Произошла ошибка при оплате заказа','Платёж не прошёл. Попробуйте ещё раз или выберите другой способ оплаты.'],
      insufficient:['Недостаточно средств','Пополните баланс и попробуйте снова или выберите другой способ оплаты.'],
      interrupted:['Оплата не была завершена','Попробуйте ещё раз или выберите другой способ оплаты.']
    }[s.stage];
    showPaymentSheet('Оплата',paymentResultMarkup(copy[0],copy[1],s.stage),s.stage,'payment-result-sheet');
    return;
  }
  renderBasePayment();
  if(s.stage==='bank-payment' && s.outcome==='interrupted') {
    $('.flow-bank-cancel').dataset.paymentAction='interrupt-bank';
    $('.flow-bank-cancel').removeAttribute('data-flow');
    $('.flow-bank-cancel').setAttribute('aria-label','Вернуться в приложение');
    $('.flow-bank-cancel').textContent='Вернуться в приложение';
    $('.flow-bank-cancel').classList.add('payment-bank-return');
  }
};

function renderPaymentPending(s) {
  const bankReturn = s.method==='sbp'||s.holdPending||paymentDemo.scenario==='cancel-pending';
  const title = s.outcome==='interrupted'?'Проверяем статус оплаты':bankReturn?'Ожидаем информацию от банка':'Оплачиваем заказ';
  const description = s.outcome==='interrupted'?'Уточняем, завершился ли платёж':bankReturn?'Это может занять некоторое время':paymentMethodNames[s.method]||'Это может занять некоторое время';
  showPaymentSheet('Оплата',`<div class="flow-result-content" role="status"><div class="flow-spinner">${flowImage(flowAssets['6589:18288'].imgGroup2085661263)}</div><h3>${title}</h3><p>${description}</p></div>${flowHome()}`,'pending');
  if(s.pendingStarted || s.holdPending) return;
  s.pendingStarted = true;
  setTimeout(()=>{
    if(!paymentSessionIsActive(s) || s.stage!=='pending' || s.committed) return;
    if(sbpCartKey()!==s.key) { s.stage='error'; renderHappyPayment(); return; }
    if(s.outcome!=='success') {
      paymentDemo.failureUsed = true;
      s.stage = s.outcome;
      renderHappyPayment();
      return;
    }
    s.committed = true;
    s.pickup = selectedPickupText();
    s.order = completeBasketOrder({showConfirmation:false,pickupOverride:s.pickup});
    if(!s.order) { s.committed=false; s.stage='error'; renderHappyPayment(); return; }
    s.order.payment = paymentMethodNames[s.method]||'СБП';
    if(s.method==='new-card' && s.saveCard && s.cardLastFour) {
      paymentMethodNames['saved-visa']=`${s.cardBrand} •• ${s.cardLastFour}`;
      paymentDemo.hasVisa=true;
      paymentDemo.method='saved-visa';
      cartOptions.payment='card';
    }
    s.stage = 'success';
    renderHappyPayment();
  },1500);
}

function openPaymentAbortDialog() {
  const s=happyPayment;
  if(!s || !['pending','confirm-cancel'].includes(s.stage) || $('#payment-abort-confirm')) return;
  s.stage='confirm-cancel';
  const sheet=$('#bottom-sheet');
  [...sheet.children].forEach(child=>child.inert=true);
  const overlay=document.createElement('div');
  overlay.id='payment-abort-confirm';
  overlay.className='payment-abort-backdrop';
  overlay.innerHTML=`<section class="payment-abort-dialog" role="alertdialog" aria-modal="true" aria-labelledby="payment-abort-title" aria-describedby="payment-abort-description"><h3 id="payment-abort-title">Прервать оплату?</h3><p id="payment-abort-description">Мы ещё ожидаем информацию от банка. Вы можете продолжить ожидание или прервать оплату.</p><button class="primary-button" data-payment-action="keep-waiting">Не прерывать</button><button class="payment-abort-button" data-payment-action="confirm-abort">Прервать</button></section>`;
  $('.screen').append(overlay);
  $('[data-payment-action="keep-waiting"]',overlay).focus();
}

function resumePaymentWaiting() {
  const s=happyPayment;
  if(!s || s.stage!=='confirm-cancel') return;
  $('#payment-abort-confirm')?.remove();
  s.stage='pending';
  s.holdPending=false;
  s.pendingStarted=false;
  renderPaymentPending(s);
}

function confirmPaymentAbort() {
  const s=happyPayment;
  if(!s || s.stage!=='confirm-cancel') return;
  $('#payment-abort-confirm')?.remove();
  s.stage='canceling';
  showPaymentSheet('Оплата',`<div class="flow-result-content" role="status"><div class="flow-spinner">${flowImage(flowAssets['6589:18288'].imgGroup2085661263)}</div><h3>Прерываем оплату</h3><p>Дождитесь подтверждения отмены</p></div>${flowHome()}`,'pending');
  setTimeout(()=>{
    if(!paymentSessionIsActive(s)||s.stage!=='canceling') return;
    closeSheet(false);
    refreshBasket();
    toast('Оплата прервана. Корзина сохранена');
    $('[data-basket-action="pay"]')?.focus({preventScroll:true});
  },700);
}

// The confirmation traps focus; Escape dismisses it and resumes waiting.
document.addEventListener('keydown',event=>{
  const overlay=$('#payment-abort-confirm');
  if(!overlay) return;
  if(event.key==='Escape') {
    event.preventDefault();event.stopImmediatePropagation();resumePaymentWaiting();
  }
  if(event.key==='Tab') {
    const buttons=[...overlay.querySelectorAll('button')];
    const first=buttons[0],last=buttons.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    event.stopImmediatePropagation();
  }
},true);

const {validateCardField}=PaymentValidation;

function renderNewCardForm() {
  cardDraft={number:'',expiry:'',cvc:'',touched:new Set()};
  const field=(name,label,placeholder,max)=>`<div class="payment-field" data-field="${name}"><label for="payment-${name}">${label}</label><input id="payment-${name}" name="${name}" inputmode="numeric" type="${name==='cvc'?'password':'text'}" placeholder="${placeholder}" maxlength="${max}" autocomplete="off" aria-describedby="payment-${name}-error">${name==='number'?`<span class="payment-card-icon">${flowImage(figmaAsset('card.svg'))}</span>`:''}<p id="payment-${name}-error" class="payment-field-error" aria-live="polite"></p></div>`;
  showPaymentSheet('Оплата картой',`<p class="payment-form-subtitle">К оплате ${money(happyPayment.amount)}</p><form id="new-card-form" novalidate><div class="payment-form-fields">${field('number','Номер карты','0000 0000 0000 0000',23)}<div class="payment-field-row">${field('expiry','Срок действия','ММ/ГГ',5)}${field('cvc','CVC/CVV','000',3)}</div><label class="payment-save-card" for="payment-save-card"><span>Сохранить карту для будущих заказов<small>Это безопасно</small></span><input id="payment-save-card" name="save-card" type="checkbox" role="switch"><span class="payment-save-toggle" aria-hidden="true"></span></label></div><div class="payment-form-footer"><button class="primary-button" type="submit">Оплатить ${money(happyPayment.amount)}</button></div></form>${flowHome()}`,'card-form','payment-form-sheet');
  const back=$('#bottom-sheet .close-button');
  back.innerHTML=flowImage(figmaAsset('close.svg'));
  back.setAttribute('aria-label','Вернуться в корзину');
  icons();
}

function setCardFieldError(name) {
  if(!cardDraft) return '';
  const input=$(`#payment-${name}`);
  if(!input || !['number','expiry','cvc'].includes(name)) return '';
  const message=validateCardField(name,input.value);
  input.setAttribute('aria-invalid',String(!!message));
  $(`#payment-${name}-error`).textContent=message;
  return message;
}

function formatCardInput(input) {
  if(!['number','expiry','cvc'].includes(input.name)) return;
  const digits=input.value.replace(/\D/g,'');
  if(input.name==='number') input.value=digits.slice(0,19).replace(/(.{4})/g,'$1 ').trim();
  if(input.name==='expiry') input.value=digits.slice(0,4).replace(/^(\d{2})(\d)/,'$1/$2');
  if(input.name==='cvc') input.value=digits.slice(0,3);
  cardDraft[input.name]=input.value;
  if(cardDraft.touched.has(input.name)) setCardFieldError(input.name);
}

openBasketPromo = function() {
  showPaymentSheet('Промокод',`<form id="scenario-promo-form" novalidate><div class="payment-field"><label for="scenario-promo-input">Введите промокод</label><input id="scenario-promo-input" placeholder="Введите промокод" value="${safe(cartOptions.promo)}" autocomplete="off" autocapitalize="characters" maxlength="30" aria-describedby="scenario-promo-error"><p id="scenario-promo-error" class="payment-field-error" aria-live="polite"></p></div><p class="payment-promo-feedback" id="scenario-promo-success" role="status">${cartOptions.promo?'Промокод применён. Скидка 100 ₽':''}</p><button class="primary-button" type="submit" ${cartOptions.promo?'':'disabled'}>Применить</button>${cartOptions.promo?'<button type="button" class="payment-text-button" data-payment-action="remove-promo">Удалить промокод</button>':''}</form>${flowHome()}`,'promo','payment-promo-sheet');
};

function mountScenarioControl() {
  const control=document.createElement('aside');
  control.className='scenario-control';
  control.setAttribute('aria-label','Управление сценариями прототипа');
  control.innerHTML=`<button id="scenario-toggle" aria-expanded="false" aria-controls="scenario-panel">${icon('sliders-horizontal')}<span>Сценарии</span>${icon('chevron-down')}</button><div id="scenario-panel" hidden><label for="scenario-select">Сценарий прототипа</label><select id="scenario-select">${paymentScenarios.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select><p id="scenario-description"></p><button id="scenario-restart" class="scenario-secondary">Начать заново</button><button id="scenario-card-demo" class="scenario-secondary" hidden>Заполнить тестовой картой</button><small>Оплата имитируется локально</small></div>`;
  document.body.append(control);
  updateScenarioDescription();
  icons();
}

function updateScenarioDescription() {
  const scenario=paymentScenarios.find(s=>s.id===paymentDemo.scenario);
  $('#scenario-description').textContent=scenario.note;
  $('#scenario-select').value=scenario.id;
  $('#scenario-card-demo').hidden=scenario.id!=='new-card';
}

function applyPaymentScenario(id) {
  const scenario=paymentScenarios.find(s=>s.id===id);
  if(!scenario) return;
  closeSheet(false);
  openHappyFlow();
  paymentDemo.scenario=id;
  paymentDemo.method=scenario.method;
  paymentDemo.failureUsed=false;
  paymentDemo.hasLinked=scenario.method==='linked-sbp';
  paymentDemo.hasVisa=scenario.method==='saved-visa';
  paymentMethodNames['saved-visa']='Картой •••• 5505';
  cartOptions.payment=scenario.method==='sbp'||scenario.method==='linked-sbp'?'sbp':'card';
  refreshBasket();
  updateScenarioDescription();
  $('#scenario-panel').hidden=true;
  $('#scenario-toggle').setAttribute('aria-expanded','false');
}

document.addEventListener('DOMContentLoaded',mountScenarioControl);
document.addEventListener('change',event=>{
  if(event.target.id==='scenario-select') applyPaymentScenario(event.target.value);
});
document.addEventListener('input',event=>{
  if(event.target.matches('#new-card-form input')&&cardDraft) formatCardInput(event.target);
  if(event.target.id==='scenario-promo-input') {
    event.target.removeAttribute('aria-invalid');
    $('#scenario-promo-form button[type=submit]').disabled=!event.target.value.trim();
    $('#scenario-promo-error').textContent='';
    $('#scenario-promo-success').textContent='';
  }
});
document.addEventListener('focusout',event=>{
  if(event.target.matches('#new-card-form input')&&cardDraft) {
    cardDraft.touched.add(event.target.name);
    setCardFieldError(event.target.name);
  }
});
document.addEventListener('submit',event=>{
  if(event.target.id==='new-card-form') {
    event.preventDefault();
    if(!happyPayment||happyPayment.stage!=='card-form'||!cardDraft) return;
    let firstError;
    for(const name of ['number','expiry','cvc']) {
      cardDraft.touched.add(name);
      if(setCardFieldError(name)&&!firstError) firstError=$(`#payment-${name}`);
    }
    if(firstError) { firstError.focus(); return; }
    happyPayment.saveCard=$('#payment-save-card').checked;
    if(happyPayment.saveCard) {
      const number=$('#payment-number').value.replace(/\D/g,'');
      happyPayment.cardLastFour=number.slice(-4);
      happyPayment.cardBrand=number.startsWith('4')?'Visa':'Карта';
    }
    cardDraft=null;
    happyPayment.stage='pending';
    renderHappyPayment();
  }
  if(event.target.id==='scenario-promo-form') {
    event.preventDefault();
    const input=$('#scenario-promo-input'), code=input.value.trim().toUpperCase();
    const error=!code?'Введите промокод':code!=='NEW100'?'Такого промокода нет':cartSubtotal()<400?'Промокод действует при заказе от 400 ₽':'';
    $('#scenario-promo-error').textContent=error;
    input.setAttribute('aria-invalid',String(!!error));
    if(error) { input.focus(); return; }
    cartOptions.promo=code;
    refreshBasket();
    openBasketPromo();
    $('#scenario-promo-success').textContent='Промокод применён. Скидка 100 ₽';
  }
});

document.addEventListener('click',event=>{
  const method=event.target.closest('[data-payment-method]');
  if(method) { pendingPaymentMethod=method.dataset.paymentMethod; for(const option of $$('.payment-method-list [data-payment-method]')) option.setAttribute('aria-pressed',String(option===method)); }
  if(event.target.closest('#scenario-toggle')) {
    const panel=$('#scenario-panel');panel.hidden=!panel.hidden;
    $('#scenario-toggle').setAttribute('aria-expanded',String(!panel.hidden));
  }
  if(event.target.closest('#scenario-restart')) applyPaymentScenario(paymentDemo.scenario);
  if(event.target.closest('#scenario-card-demo')) {
    if(happyPayment?.stage!=='card-form') checkoutBasket();
    if(cardDraft) {
      for(const [name,value] of Object.entries({number:'4111 1111 1111 1111',expiry:'12/30',cvc:'123'})) {
        const input=$(`#payment-${name}`);input.value=value;formatCardInput(input);
      }
      $('#scenario-panel').hidden=true;$('#scenario-toggle').setAttribute('aria-expanded','false');
    }
  }
  if(!event.target.closest('.scenario-control')) {
    $('#scenario-panel').hidden=true;$('#scenario-toggle').setAttribute('aria-expanded','false');
  }
  const action=event.target.closest('[data-payment-action]')?.dataset.paymentAction;
  if(action==='apply-method'&&pendingPaymentMethod) selectPaymentMethod(pendingPaymentMethod);
  if(action==='keep-waiting') resumePaymentWaiting();
  if(action==='confirm-abort') confirmPaymentAbort();
  if(action==='retry') { closeSheet(false); startPrototypePayment(); }
  if(action==='change-method') { closeSheet(false); openBasketPayment(); }
  if(action==='back-cart') closeSheet();
  if(action==='interrupt-bank'&&happyPayment?.stage==='bank-payment') {
    happyPayment.stage='pending';renderHappyPayment();
  }
  if(action==='remove-promo') { cartOptions.promo='';refreshBasket();openBasketPromo(); }
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!$('#scenario-panel').hidden) {
    $('#scenario-panel').hidden=true;$('#scenario-toggle').setAttribute('aria-expanded','false');$('#scenario-toggle').focus();
  }
});
