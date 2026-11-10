'use strict';

const drinkModifiers = [
  { id:'syrup', title:'Сиропы', hint:'Немного сладости', optional:true, items:[
    {id:'vanilla',name:'Ванильный',price:40,image:'syrup-vanilla'},
    {id:'caramel',name:'Карамельный',price:40,image:'syrup-caramel'},
    {id:'hazelnut',name:'Ореховый',price:40,image:'syrup-hazelnut'}
  ]},
  { id:'milk', title:'Молоко', hint:'Как вы любите', optional:false, items:[
    {id:'classic',name:'Классическое',price:0,image:'milk-classic'},
    {id:'oat',name:'Овсяное',price:60,image:'milk-oat'},
    {id:'coconut',name:'Кокосовое',price:60,image:'milk-coconut'}
  ]},
  { id:'topping', title:'Посыпки', hint:'Маленький штрих', optional:true, items:[
    {id:'cookie',name:'Крошка печенья',price:30,image:'topping-cookie'},
    {id:'chocolate',name:'Шоколадная',price:30,image:'topping-chocolate'}
  ]},
  { id:'foam', title:'Пенки', hint:'Ещё нежнее', optional:true, items:[
    {id:'cream',name:'Сливочная',price:70,image:'foam-cream'},
    {id:'berry',name:'Малиновая',price:70,image:'foam-berry'}
  ]}
];

// Illustrative base-recipe values for this design prototype, not a nutrition database.
const productRecipes = {
  cappuccino:{nutrition:[52,2.8,2.6,4.3],ingredients:'Эспрессо, молоко 3,2%.',allergens:'Молоко и лактоза.',note:'Бразильская арабика, двойной эспрессо и нежная молочная пенка.'},
  'iced-latte':{nutrition:[76,2.1,2.4,11.5],ingredients:'Эспрессо, молоко, карамельный сироп, морская соль, лёд.',allergens:'Молоко и лактоза.',note:'Солёная карамель, прохладное молоко и насыщенный эспрессо.'},
  matcha:{nutrition:[64,1.1,2.0,10.4],ingredients:'Матча, овсяное молоко, клубничное пюре, лёд.',allergens:'Овёс. Состав зависит от выбранного молока.',note:'Японская матча, спелая клубника и мягкое овсяное молоко.'},
  croissant:{nutrition:[406,8.2,21.0,45.2],ingredients:'Пшеничная мука, сливочное масло, молоко, сахар, дрожжи, яйцо, соль.',allergens:'Глютен, молоко, яйцо.',note:'Золотистая корочка, воздушные слои и настоящее сливочное масло.'},
  sandwich:{nutrition:[312,12.5,20.0,20.5],ingredients:'Сливочный круассан, лосось, авокадо, сливочный сыр, руккола.',allergens:'Глютен, молоко, яйцо, рыба.',note:'Нежный лосось, авокадо и крем-чиз в хрустящем круассане.'},
  'morning-combo':{nutrition:[138,4.1,7.1,14.4],ingredients:'Капучино 250 мл на классическом молоке и сливочный круассан 80 г.',allergens:'Молоко, глютен, яйцо.',note:'Ваш любимый утренний дуэт по приятной цене.'}
};
let productSelection = null;
let productOpener = null;
let productClosing = false;

function isDrink(p){return ['coffee','tea'].includes(p.category);}
function modifierPrice(group,item){return group.id==='milk'&&productSelection.id==='matcha'&&item.id==='oat'?0:item.price;}
function selectedModifier(group){return group.items.find(item=>item.id===productSelection[group.id]);}
function configuredPrice(){
  const p=product(productSelection.id);
  if(!isDrink(p))return p.price;
  return p.price+productSelection.size*60+drinkModifiers.reduce((sum,group)=>{
    const choice=selectedModifier(group);return sum+(choice?modifierPrice(group,choice):0);
  },0);
}
function configuredUnit(){const p=product(productSelection.id);return isDrink(p)?`${parseInt(p.unit)+productSelection.size*100} мл`:p.unit;}
function configuredModifierLabels(){return drinkModifiers.filter(g=>g.optional).flatMap(g=>{const item=selectedModifier(g);return item?[`${g.title}: ${item.name.toLowerCase()}`]:[];});}
function modifierCard(group,item){
  const selected=productSelection[group.id]===item.id;
  const price=modifierPrice(group,item);
  return `<button class="pd-modifier-card${selected?' is-selected':''}" data-modifier-group="${group.id}" data-modifier-id="${item.id}" aria-pressed="${selected}" aria-label="${item.name}, ${price?`плюс ${price} рублей`:'без доплаты'}"><span class="pd-modifier-image"><img src="assets/modifiers/${item.image}.webp" alt="" loading="lazy" width="180" height="180"></span><span class="pd-modifier-name">${item.name}</span><span class="pd-modifier-bottom"><span>${price?`+${money(price)}`:'Без доплаты'}</span><span class="pd-choice-mark">${icon(selected?'check':'plus')}</span></span></button>`;
}
function modifierSection(group){return `<section class="pd-modifier-section" aria-labelledby="pd-${group.id}-title"><div class="pd-section-heading"><div><h2 id="pd-${group.id}-title">${group.title}</h2><span>${group.hint}</span></div>${group.optional?`<button class="pd-reset" data-reset-modifier="${group.id}" ${productSelection[group.id]?'':'hidden'} aria-label="Убрать ${group.title.toLowerCase()}">Убрать</button>`:'<span class="pd-required">Выберите одно</span>'}</div><div class="pd-modifier-row" role="group" aria-label="${group.title}${group.optional?', можно выбрать одну добавку':''}">${group.items.map(item=>modifierCard(group,item)).join('')}</div></section>`;}
function temperatureSection(p){const choices=p.cold?[['ice','Со льдом','snowflake'],['less-ice','Меньше льда','droplets']]:[['warm','Тёплый','coffee'],['hot','Горячий','flame']];return `<section class="pd-temperature"><div class="pd-section-heading"><div><h2>${p.cold?'Лёд':'Температура'}</h2><span>${p.cold?'Освежим ваш день':'Идеальная для вас'}</span></div></div><div class="pd-temperature-options" role="group" aria-label="${p.cold?'Количество льда':'Температура напитка'}">${choices.map(([id,name,ico])=>`<button class="pd-temperature-option${productSelection.temperature===id?' is-selected':''}" data-temperature="${id}" aria-pressed="${productSelection.temperature===id}">${icon(ico)}<span>${name}</span><span class="pd-temperature-check">${icon('check')}</span></button>`).join('')}</div></section>`;}
function nutritionSection(p){const recipe=productRecipes[p.id];const unit=isDrink(p)?'100 мл':'100 г';return `<section class="pd-nutrition" aria-label="Пищевая ценность"><div class="pd-nutrition-heading"><h2>Пищевая ценность</h2><span>на ${unit}</span></div><dl class="pd-nutrition-values">${recipe.nutrition.map((value,i)=>`<div><dd>${i?value.toFixed(1).replace('.',',')+' г':value}</dd><dt>${['ккал','белки','жиры','углеводы'][i]}</dt></div>`).join('')}</dl><p>Базовый рецепт, без добавок</p></section><details class="pd-more"><summary>Подробнее ${isDrink(p)?'о напитке':'о продукте'} ${icon('chevron-down')}</summary><div class="pd-more-content"><p>${p.description}</p><h3>Состав</h3><p>${recipe.ingredients}</p><h3>Аллергены</h3><p>${recipe.allergens} Выбранные добавки могут содержать молоко, орехи или глютен.</p><p class="pd-recipe-note">КБЖУ и состав — примеры для прототипа. Для готового меню нужны данные по фактической рецептуре.</p></div></details>`;}

function openProductDetail(id){
  const p=product(id);if(!p)return;
  productOpener=document.activeElement;
  closeSheet(false);
  productSelection={id,size:0,milk:id==='matcha'?'oat':'classic',syrup:null,topping:null,foam:null,temperature:p.cold?'ice':'hot'};
  state.detail=id;
  const drink=isDrink(p),view=$('#product-view');
  view.innerHTML=`<header class="pd-topbar"><button class="pd-back" data-pd-action="back" aria-label="Вернуться к меню">${icon('arrow-left')}</button><h1 id="product-view-title" tabindex="-1">${p.name}</h1>${favoriteButton(p)}</header><div class="pd-scroll" id="pd-scroll" tabindex="0" aria-label="Описание и настройки товара"><section class="pd-hero"><div class="pd-product-image"><img src="${p.asset||'assets/'+p.image+'.webp'}" alt="${p.name}" width="350" height="350"><span class="pd-hero-badge">${icon(drink?'coffee':'croissant')}${drink?'Готовим для вас':'Свежая выпечка'}</span></div><p class="pd-product-note">${p.meta}</p>${drink?`<div class="pd-size-selector" role="group" aria-label="Размер напитка">${['S','M','L'].map((size,i)=>`<button class="pd-size${i===0?' is-selected':''}" data-pd-size="${i}" aria-pressed="${i===0}" aria-label="Размер ${size}, ${parseInt(p.unit)+i*100} миллилитров"><strong>${size}</strong><span>${parseInt(p.unit)+i*100} мл</span></button>`).join('')}</div>`:`<div class="pd-food-description"><p>${p.description}</p><span>${p.unit}</span></div>`}</section><div class="pd-body">${drink?drinkModifiers.map(modifierSection).join('')+temperatureSection(p):''}${nutritionSection(p)}<div class="pd-bottom-note"><span aria-hidden="true">✳</span>Маленькая радость — по вашему вкусу</div></div></div><footer class="pd-footer"><div class="pd-order-caption"><span id="pd-selection-summary"></span><span id="pd-earned-points"></span></div><button class="pd-add-to-cart" data-pd-action="add"><span>${icon('plus')}В корзину</span><strong id="pd-total-price"></strong></button><div class="pd-home-indicator" aria-hidden="true"><span></span></div><span class="pd-sr-only" id="pd-live-price" aria-live="polite" aria-atomic="true"></span></footer>`;
  view.hidden=false;
  $('.screen').classList.add('product-opened');
  $$('.screen > *').forEach(el=>{el.inert=!['product-view','toast'].includes(el.id);});
  view.inert=false;
  icons();updateProductPrice();
  requestAnimationFrame(()=>$('#product-view-title').focus({preventScroll:true}));
  try{history.replaceState(null,'',`${location.pathname}${location.search}#product=${id}`);}catch{}
}
function closeProductDetail(restore=true){
  const view=$('#product-view');if(!view||view.hidden)return;
  view.hidden=true;
  $('.screen').classList.remove('product-opened');
  $$('.screen > *').forEach(el=>el.inert=false);
  if(restore)(productOpener?.isConnected&&!productOpener.closest('[hidden]')?productOpener:$('.tab.active'))?.focus({preventScroll:true});
  try{history.replaceState(null,'',location.pathname+location.search+(state.tab==='cart'?'#cart':''));}catch{}
}
function updateProductPrice(){
  const price=configuredPrice(),p=product(productSelection.id);
  $('#pd-total-price').textContent=money(price);
  $('#pd-earned-points').textContent=`Вернём ${Math.floor(price*.05)} баллов`;
  $('#pd-selection-summary').textContent=isDrink(p)?`${['S','M','L'][productSelection.size]} · ${configuredUnit()}`:configuredUnit();
  $('#pd-live-price').textContent=`Итого ${price} рублей`;
  $('.pd-add-to-cart').setAttribute('aria-label',`Добавить в корзину: ${p.name}, ${configuredUnit()}, ${price} рублей`);
}
function chooseModifier(groupId,itemId){
  const group=drinkModifiers.find(g=>g.id===groupId);if(!group||!group.items.some(i=>i.id===itemId))return;
  productSelection[groupId]=group.optional&&productSelection[groupId]===itemId?null:itemId;
  updateModifierGroup(group);
}
function updateModifierGroup(group){
  $$(`[data-modifier-group="${group.id}"]`).forEach(button=>{const selected=button.dataset.modifierId===productSelection[group.id];button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));$('.pd-choice-mark',button).innerHTML=icon(selected?'check':'plus');});
  const reset=$(`[data-reset-modifier="${group.id}"]`);if(reset)reset.hidden=!productSelection[group.id];
  icons();updateProductPrice();
}
function addConfiguredProduct(){
  if(!productSelection||productClosing)return;
  productClosing=true;
  const p=product(productSelection.id),drink=isDrink(p);
  const milk=drink?selectedModifier(drinkModifiers.find(g=>g.id==='milk')).name:'';
  const temperature=drink?({hot:'Горячий',warm:'Тёплый',ice:'Со льдом','less-ice':'Меньше льда'}[productSelection.temperature]):'';
  addToCart(p.id,{unit:configuredUnit(),milk,price:configuredPrice(),modifiers:drink?configuredModifierLabels():[],temperature});
  closeProductDetail();toast('Добавили вашу маленькую радость в корзину');
  productClosing=false;
}

document.addEventListener('click',(event)=>{
  const button=event.target.closest('#product-view button');if(!button)return;
  if(button.dataset.pdAction==='back'){closeProductDetail();return;}
  if(button.dataset.pdAction==='add'){addConfiguredProduct();return;}
  if(button.dataset.pdSize!==undefined){productSelection.size=Number(button.dataset.pdSize);$$('[data-pd-size]').forEach(el=>{const selected=el===button;el.classList.toggle('is-selected',selected);el.setAttribute('aria-pressed',String(selected));});updateProductPrice();return;}
  if(button.dataset.modifierGroup){chooseModifier(button.dataset.modifierGroup,button.dataset.modifierId);return;}
  if(button.dataset.resetModifier){const group=drinkModifiers.find(g=>g.id===button.dataset.resetModifier);if(group?.optional){productSelection[group.id]=null;updateModifierGroup(group);$(`[data-modifier-group="${group.id}"]`).focus({preventScroll:true});}return;}
  if(button.dataset.temperature){productSelection.temperature=button.dataset.temperature;$$('[data-temperature]').forEach(el=>{const selected=el===button;el.classList.toggle('is-selected',selected);el.setAttribute('aria-pressed',String(selected));});}
});
document.addEventListener('keydown',(event)=>{
  const view=$('#product-view');if(!view||view.hidden||!$('#bottom-sheet').hidden)return;
  if(event.key==='Escape'){event.preventDefault();closeProductDetail();return;}
  if(event.key==='Tab'){
    const focusable=$$('button:not([disabled]),summary,[tabindex="0"]',view).filter(el=>el.getClientRects().length&&!el.closest('[hidden]'));
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
});
function syncProductLink(){
  const linkedProduct=new URLSearchParams(location.hash.slice(1)).get('product');
  if(linkedProduct&&product(linkedProduct)){
    if($('#product-view').hidden||productSelection?.id!==linkedProduct)openProductDetail(linkedProduct);
  }else if(!$('#product-view').hidden)closeProductDetail();
}
window.addEventListener('hashchange',syncProductLink);
syncProductLink();
