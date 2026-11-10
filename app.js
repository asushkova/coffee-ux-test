'use strict';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const money = (amount) => `${amount.toLocaleString('ru-RU')} ₽`;
const safe = (text) => String(text).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const products = [
  { id:'cappuccino', name:'Капучино', meta:'Нежный и сбалансированный', unit:'250 мл', price:290, image:'cappuccino', category:'coffee', tag:'ВАШ ЛЮБИМЫЙ', description:'Двойной эспрессо на зерне из Бразилии и молочная пенка. Во вкусе — шоколад, орехи и немного карамели.', milk:true },
  { id:'croissant', name:'Круассан сливочный', meta:'Тот самый, хрустящий', unit:'80 г', price:240, image:'croissant', category:'bakery', tag:'ИЗ ПЕЧИ', description:'Золотистая корочка, воздушные слои и настоящее сливочное масло. Выпекаем небольшими партиями каждое утро.' },
  { id:'sandwich', name:'Круассан с лососем', meta:'Лосось, авокадо, крем-чиз', unit:'180 г', price:420, image:'sandwich', category:'breakfast', tag:'СОВЕТ БАРИСТА', description:'Хрустящий круассан с нежным лососем, спелым авокадо, сливочным сыром и свежей рукколой.' },
  { id:'iced-latte', name:'Айс-латте карамель', meta:'Карамель и щепотка соли', unit:'350 мл', price:340, image:'iced-latte', category:'coffee', tag:'НОВИНКА', description:'Эспрессо, прохладное молоко и карамель с морской солью. Добавляем лёд — и ваш маленький перерыв готов.', milk:true, cold:true },
  { id:'matcha', name:'Матча-клубника', meta:'Ваша новая зелёная привычка', unit:'350 мл', price:390, image:'matcha', category:'tea', tag:'НОВИНКА', description:'Японская матча, клубничное пюре и овсяное молоко. Ягодная сладость и мягкий чайный вкус в одном стакане.', cold:true },
  { id:'morning-combo', name:'Кофе + круассан', meta:'Капучино 250 мл и круассан', unit:'250 мл + 80 г', price:390, image:'croissant', category:'breakfast', tag:'ДО 12:00', description:'Капучино на классическом молоке и свежий сливочный круассан. Маленький утренний ритуал за 390 ₽ вместо 530 ₽.' }
];
const branches = [
  {name:'На Петроградской', address:'Каменноостровский пр., 42', hours:'08:00–22:00', closes:'22:00', distance:'250 м'},
  {name:'На Горьковской', address:'Кронверкский пр., 23', hours:'08:00–23:00', closes:'23:00', distance:'1,2 км'},
  {name:'На Чкаловской', address:'Большая Зеленина ул., 8', hours:'09:00–21:00', closes:'21:00', distance:'1,6 км'}
];
const product = (id) => products.find((p) => p.id === id);
const storageKey = 'kroshka-prototype-v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { saved = {}; }
const state = { tab:'home', filter:'all', search:'', favorites:new Set(Array.isArray(saved.favorites) ? saved.favorites.filter(id => product(id)) : []), branchSelected:saved.branchSelected === true, branch:Number.isInteger(saved.branch) && branches[saved.branch] ? saved.branch : 0, name:typeof saved.name === 'string' ? saved.name.slice(0,30) : 'Александра', cart:[], orders:[], notificationsRead:!!saved.notificationsRead, notificationOffers:saved.notificationOffers !== false, bonus:1250, redeem:false, detail:null, detailSize:null, detailMilk:'Классическое' };
let previousFocus = null;
let toastTimer;
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({favorites:[...state.favorites],branch:state.branch,branchSelected:state.branchSelected,name:state.name,notificationsRead:state.notificationsRead,notificationOffers:state.notificationOffers}));}catch{}}
function icons(){window.lucide?.createIcons({attrs:{'stroke-width':1.7}});}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2700);}
function favoriteButton(p){const yes=state.favorites.has(p.id);return `<button class="favorite-button ${yes?'saved':''}" data-action="favorite" data-id="${p.id}" aria-label="${yes?'Убрать из избранного':'В избранное'}: ${p.name}" aria-pressed="${yes}">${icon('heart')}</button>`;}
function addButton(p){const qty=state.cart.filter(c=>c.id===p.id).reduce((a,c)=>a+c.qty,0);return `<button class="add-button ${qty?'added':''}" data-action="quick-add" data-id="${p.id}" aria-label="Добавить: ${p.name}">${qty?`<span class="product-count">${qty}</span>`:icon('plus')}</button>`;}
function repeatCard(id){const p=product(id);return `<article class="repeat-card"><button class="product-open" data-action="product" data-id="${p.id}" aria-label="Подробнее: ${p.name}"><img class="product-photo" src="${p.asset||'assets/'+p.image+'.webp'}" alt="${p.name}" draggable="false"><span class="product-title">${p.name}</span><span class="product-meta">${p.unit}</span></button><div class="price-row"><span class="product-price">${money(p.price)}</span>${addButton(p)}</div></article>`;}
function catalogCard(p){return `<article class="catalog-card"><div class="catalog-image"><button class="product-open" data-action="product" data-id="${p.id}" aria-label="Подробнее: ${p.name}"><img src="${p.asset||'assets/'+p.image+'.webp'}" alt="${p.name}" loading="lazy" draggable="false"></button>${favoriteButton(p)}<span class="product-tag">${p.tag}</span></div><button class="product-open" data-action="product" data-id="${p.id}"><span class="product-title">${p.name}</span><span class="product-meta">${p.unit}</span></button><div class="price-row"><span class="product-price">${money(p.price)}</span>${addButton(p)}</div></article>`;}
function heading(title,label,action){return `<div class="section-heading"><h2>${title}</h2><button class="text-link" data-action="${action}">${label}${icon('chevron-right')}</button></div>`;}
function activeOrderCard(){
  const order=state.orders.find(order=>order.status!=='received'&&order.status!=='cancelled');
  if(!order)return '';
  const ready=order.status==='ready',step=ready?2:order.status==='accepted'?0:1;
  const title=['Заказ принят','Готовим вашу радость','Можно забирать!'][step];
  return `<section class="active-order${ready?' is-ready':''}" aria-label="Текущий заказ № ${order.number}">
    <div class="active-order-top"><span>Заказ <strong>№ ${order.number}</strong></span><span class="active-order-badge"><span class="active-order-dot" aria-hidden="true"></span>${['Принят','Готовим','Готов'][step]}</span></div>
    <div class="active-order-main"><div><h2>${title}</h2><p class="active-order-caption">${ready?'Ваша маленькая радость уже ждёт':`Забрать ${safe(order.pickup)}`}</p></div><span class="active-order-symbol" aria-hidden="true">${icon(ready?'check-check':'coffee')}</span></div>
    <ol class="active-order-steps" aria-label="Этапы заказа">${['Принят','Готовим','Готов'].map((label,i)=>`<li class="${i<=step?'reached':''}" ${i===step?'aria-current="step"':''}><span></span>${label}</li>`).join('')}</ol>
    <button class="active-order-details" data-action="active-order" data-number="${order.number}"><span>${icon('map-pin')}<span>${safe(order.branch)}</span></span>${icon('chevron-right')}</button>
  </section>`;
}
function openActiveOrder(number){
  const order=state.orders.find(order=>order.number===number);if(!order)return;
  sheet(`Заказ № ${order.number}`,`<p class="sheet-description">${order.status==='ready'?'Готов · можно забирать':order.status==='accepted'?'Принят · скоро начнём готовить':'Готовим ваш заказ'}<br>${safe(order.branch)}<br>Получение: ${safe(order.pickup)}</p><div class="bonus-card-details">${order.items.map(item=>`<p><strong>${safe(product(item.id).name)} × ${item.qty}</strong></p>`).join('')}</div><div class="basket-confirm-details"><span>${money(order.total)}</span><span>${order.paid?'Оплачен':'Оплата при получении'}</span></div><button class="secondary-button" data-action="orders">Все заказы ${icon('arrow-right')}</button>`);
}
function homePage(){return `<div class="content-inset">${activeOrderCard()}<div class="welcome-row"><p>Ваш день. Ваш любимый кофе.</p><span class="little-brand">крошка<span>✳</span></span></div><button class="loyalty-card" data-action="loyalty" aria-label="Бонусная карта: уровень Друг, ${state.bonus} баллов"><span class="loyalty-flower" aria-hidden="true">✳</span><span class="loyalty-top"><span class="level-badge">${icon('sparkles')}Уровень «Друг»</span><span class="loyalty-caption">Возвращаем 5%</span></span><span class="balance-row"><span><span class="balance">${state.bonus.toLocaleString('ru-RU')}<span>баллов</span></span><span class="loyalty-copy">На маленькие радости</span></span><span class="qr-button">${icon('qr-code')}</span></span><span class="level-progress"><span></span></span><span class="level-progress-label"><span>Ещё 750 баллов до «Лучшего друга»</span><strong>8% ${'↗'}</strong></span></button></div>
  <section class="section">${heading('Повторим любимое?','История','orders')}<div class="horizontal-scroll" aria-label="Ранее заказанные товары">${repeatCard('cappuccino')}${repeatCard('croissant')}${repeatCard('iced-latte')}</div></section>
  <section class="section">${heading('Приятный повод','Все акции','offers')}<div class="horizontal-scroll offers-scroll" aria-label="Акции"><button class="offer-card" data-action="offer" data-offer="breakfast"><span class="offer-label">МАЛЕНЬКИЙ УТРЕННИЙ РИТУАЛ</span><span class="offer-title">Вместе<br>вкуснее</span><span class="offer-copy">Любимый кофе и круассан.<br>Каждый день до 12:00.</span><span class="offer-price">За 390 ₽ ${icon('arrow-up-right')}</span><img class="offer-image" src="assets/croissant.webp" alt="Сливочный круассан"><span class="offer-badge">−140 ₽</span></button><button class="offer-card offer-friend" data-action="offer" data-offer="friend"><span class="offer-label">ДЕЛИТЬСЯ — ПРИЯТНО</span><span class="offer-title">Кофе лучше<br>с друзьями</span><span class="offer-copy">Пригласите друга.<br>Дарим по 200 баллов вам обоим.</span><span class="offer-price">Позвать друга ${icon('arrow-up-right')}</span><span class="offer-decoration" aria-hidden="true">✳</span></button></div><div class="pagination-dots" aria-hidden="true"><span class="active"></span><span></span></div></section>
  <section class="section">${heading('Стоит попробовать','В меню','menu')}<div class="product-grid">${catalogCard(product('sandwich'))}${catalogCard(product('iced-latte'))}</div></section>
  <section class="new-section">${heading('Новенькое <span aria-hidden="true">✳</span>','Всё новое','new')}<div class="horizontal-scroll" aria-label="Новинки меню">${repeatCard('matcha')}${repeatCard('iced-latte')}${repeatCard('sandwich')}</div></section>
  <div class="closing-note"><span class="closing-flower" aria-hidden="true">✳</span>Большое счастье — в маленьких радостях</div>`;}
function filteredProducts(){return products.filter(p=>(state.filter==='all'||(state.filter==='new'?['matcha','iced-latte'].includes(p.id):p.category===state.filter))&&p.name.toLowerCase().includes(state.search.toLowerCase()));}
function menuPage(){const list=filteredProducts();return `<h1 class="page-title">Что вам приготовить?</h1><label class="menu-search">${icon('search')}<input type="search" id="menu-search" value="${safe(state.search)}" placeholder="Найти любимое" aria-label="Поиск по меню"></label><div class="filter-row" aria-label="Категории меню">${[['all','Всё меню'],['coffee','Кофе'],['bakery','Выпечка'],['breakfast','Завтраки'],['tea','Не кофе'],['new','Новинки']].map(([id,name])=>`<button class="filter-chip ${state.filter===id?'active':''}" data-filter="${id}" aria-pressed="${state.filter===id}">${name}</button>`).join('')}</div><div class="product-grid" id="menu-results">${list.map(catalogCard).join('')}</div><div id="search-empty" ${list.length?'hidden':''} class="empty-state"><h3>Пока не нашли</h3><p>Попробуйте «кофе», «латте» или «круассан».</p></div>`;}
function favoritePage(){const list=products.filter(p=>state.favorites.has(p.id));return `<h1 class="page-title">Ваше любимое</h1><p class="page-caption">Всё, к чему хочется возвращаться.</p>${list.length?`<div class="product-grid">${list.map(catalogCard).join('')}</div>`:`<div class="empty-state"><div class="empty-symbol">${icon('heart')}</div><h3>Здесь будет ваша любовь</h3><p>Нажмите на сердечко у напитка или блюда,<br>чтобы сохранить его здесь.</p><button class="primary-button" data-action="menu">Найти любимое ${icon('arrow-right')}</button></div>`}`;}
function ordersPage(){return `<h1 class="page-title">Ваши заказы</h1><p class="page-caption">Хорошее всегда хочется повторить.</p>${state.orders.map(o=>`<article class="order-card"><div class="order-top"><span>Заказ № ${o.number}</span><span class="order-status">${o.paid?'Оплачен · готовим':'Готовим · демо'}</span></div><p>Сегодня · ${safe(o.branch)}</p><div class="order-thumbnails">${o.items.map(c=>`<img src="${product(c.id).asset||'assets/'+product(c.id).image+'.webp'}" alt="${product(c.id).name}">`).join('')}</div><p>${o.items.map(c=>`${safe(product(c.id).name)} × ${c.qty}`).join(', ')}</p><div class="order-bottom"><span>${money(o.total)}</span><button class="secondary-button repeat-order" data-action="repeat-order" data-number="${o.number}">${icon('rotate-ccw')}Повторить</button></div></article>`).join('')}<article class="order-card"><div class="order-top"><span>Заказ № 1042</span><span class="order-status">Получен</span></div><p>2 октября, 09:24 · На Петроградской</p><div class="order-thumbnails"><img src="assets/cappuccino.webp" alt="Капучино"><img src="assets/croissant.webp" alt="Круассан"></div><p>Капучино 250 мл · Круассан сливочный</p><div class="order-bottom"><span>530 ₽</span><button class="secondary-button repeat-order" data-action="repeat-order" data-number="1042">${icon('rotate-ccw')}Повторить</button></div></article>`;}
function renderPage(){const scroll=$('#app-scroll');$('#page-content').innerHTML=({home:homePage,menu:menuPage,cart:cartPage,favorites:favoritePage,orders:ordersPage}[state.tab])();$$('[data-tab]').forEach(b=>{const active=b.dataset.tab===state.tab;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});updateHeader();updateCart();icons();const offers=$('.offers-scroll');if(offers)offers.addEventListener('scroll',()=>{$$('.pagination-dots span').forEach((d,i)=>d.classList.toggle('active',i===(offers.scrollLeft>100?1:0)));},{passive:true});}
function navigate(tab){if(typeof closeProductDetail==='function')closeProductDetail(false);closeSheet(false);state.tab=tab;try{history.replaceState(null,'',location.pathname+location.search+(tab==='cart'?'#cart':''));}catch{}if(tab==='menu'){state.search='';state.filter='all';}renderPage();$('#app-scroll').scrollTop=0;}
function updateHeader(){const branch=branches[state.branch];$('.location-title').innerHTML=`${state.branchSelected?branch.name:'Выберите кофейню'} ${icon('chevron-down')}`;$('.location-status').innerHTML=state.branchSelected?`<span></span>Открыто до ${branch.closes}`:'Где заберёте заказ';$('.location-button').setAttribute('aria-label',state.branchSelected?`Выбрать кофейню. Сейчас ${branch.name.toLowerCase()}`:'Выберите кофейню. Где заберёте заказ');$('.notification-dot').hidden=state.notificationsRead;$('.notification-button').setAttribute('aria-label',state.notificationsRead?'Уведомления':'Уведомления: 2 новых');}
function sheet(title,content){const el=$('#bottom-sheet');if(el.hidden)previousFocus=document.activeElement;el.innerHTML=`<div class="sheet-handle" aria-hidden="true"></div><div class="sheet-header"><h2 id="sheet-title">${title}</h2><button class="close-button" data-action="close-sheet" aria-label="Закрыть">${icon('x')}</button></div>${content}`;el.hidden=false;$('#sheet-backdrop').hidden=false;$$('.screen > *').forEach(node=>{if(!['bottom-sheet','sheet-backdrop','toast'].includes(node.id))node.inert=true;});el.scrollTop=0;icons();requestAnimationFrame(()=>$('.close-button',el)?.focus({preventScroll:true}));}
function closeSheet(restore=true){if($('#bottom-sheet').hidden)return;$('#bottom-sheet').hidden=true;$('#sheet-backdrop').hidden=true;$$('.screen > *').forEach(n=>n.inert=false);if(restore){const target=previousFocus?.isConnected?previousFocus:$('.tab.active');target?.focus({preventScroll:true});}}
function openLocations(){openCafeMap();}
function openNotifications(){state.notificationsRead=true;persist();updateHeader();sheet('Маленькие хорошие новости',`<div class="notification-item"><span class="notification-icon">${icon('gift')}</span><div><strong>Баллы на ваши маленькие радости</strong><p>У вас ${state.bonus.toLocaleString('ru-RU')} баллов. Можно оплатить ими до 30% следующего заказа.</p><small>Сегодня, 09:00</small></div></div><div class="notification-item"><span class="notification-icon">${icon('sparkles')}</span><div><strong>Знакомьтесь: матча-клубника</strong><p>Нежная, ягодная, совсем не похожая на кофе. Уже ждёт вас в меню.</p><small>Вчера, 14:30</small><button class="text-link" data-action="product" data-id="matcha">Хочу попробовать ${icon('arrow-right')}</button></div></div>`);}
function openProfile(){sheet('Профиль',`<div class="profile-avatar">${icon('user-round')}</div><h3 class="profile-name">${safe(state.name)}</h3><p class="profile-phone">Рады вам каждый день</p><button class="settings-row" data-action="loyalty"><span>${icon('sparkles')}Мои баллы</span><span>${state.bonus.toLocaleString('ru-RU')} ${icon('chevron-right')}</span></button><button class="settings-row" data-action="edit-profile"><span>${icon('user-round')}Личные данные</span>${icon('chevron-right')}</button><button class="settings-row" data-action="orders"><span>${icon('receipt-text')}История заказов</span>${icon('chevron-right')}</button><button class="settings-row" data-action="notification-settings"><span>${icon('bell')}Уведомления</span>${icon('chevron-right')}</button><p class="demo-note">Демонстрационный профиль. Изменения сохраняются только в этом браузере.</p>`);}
function openLoyalty(){sheet('Ваши маленькие радости',`<div class="bonus-big">${state.bonus.toLocaleString('ru-RU')} <span>баллов</span></div><p class="sheet-description" style="text-align:center">Уровень «Друг» · возвращаем 5% с заказа</p><div class="bonus-card-details"><p><strong>1 балл = 1 рубль</strong><br>Оплачивайте баллами до 30% заказа.</p><p>Ещё <strong>750 баллов</strong> до уровня «Лучший друг» и возврата 8%.</p></div><span class="option-label">Ваш кофейный ритуал</span><div class="stamp-row">${[1,2,3,4,5,6].map(n=>`<span class="stamp ${n>4?'empty':''}">${icon(n===6?'gift':'coffee')}</span>`).join('')}</div><p class="sheet-description">4 из 6 чашек. Ещё две — и капучино в подарок.</p><button class="primary-button" data-action="member-card">Показать карту ${icon('scan-line')}</button>`);}
function openMemberCard(){sheet('Ваша карта',`<div class="empty-symbol">${icon('scan-line')}</div><p class="sheet-description" style="text-align:center">Номер участника программы лояльности</p><div class="success-number">0281 5429</div><p class="sheet-description" style="text-align:center">${safe(state.name)} · уровень «Друг»</p><div class="bonus-card-details"><p>Карта показана для демонстрации. В готовом приложении здесь будет код для начисления и списания баллов на кассе.</p></div><button class="secondary-button" data-action="loyalty">К моим баллам</button>`);}
function openProduct(id){openProductDetail(id);}
function addToCart(id,options={}){
  const p=product(id);if(!p)return;
  const drink=['coffee','tea'].includes(p.category);
  const unit=options.unit||p.unit;
  const milk=drink?(options.milk||(id==='matcha'?'Овсяное':'Классическое')):'';
  const temperature=drink?(options.temperature||(p.cold?'Со льдом':'Горячий')):'';
  const modifiers=Array.isArray(options.modifiers)?options.modifiers.map(String):[];
  const key=JSON.stringify([id,unit,milk,temperature,modifiers]);
  const found=state.cart.find(c=>c.key===key);
  if(found)found.qty++;else state.cart.push({id,key,unit,milk,temperature,modifiers,price:options.price??p.price,qty:1});
  updateCart();
}
function cartSubtotal(){return state.cart.reduce((total,c)=>total+c.price*c.qty,0);}
function discount(){return calculateCart().points;}
function updateCart(){const qty=state.cart.reduce((total,c)=>total+c.qty,0);$('#mini-cart').hidden=qty===0;$('#mini-cart-count').textContent=qty;$('#mini-cart-total').textContent=money(cartSubtotal());$$('.add-button').forEach(btn=>{const count=state.cart.filter(c=>c.id===btn.dataset.id).reduce((total,c)=>total+c.qty,0);btn.classList.toggle('added',count>0);btn.innerHTML=count?`<span class="product-count">${count}</span>`:icon('plus');});icons();refreshBasket();}
function openCart(){navigate('cart');}
function checkout(){checkoutBasket();}
function openOffer(type){if(type==='friend'){sheet('Кофе объединяет',`<div class="offer-detail" style="background:#e4e9db"><span class="offer-label">ПРИЯТНО ВАМ ОБОИМ</span><h3>По 200 баллов.<br>За новую дружбу.</h3><p>Пригласите друга в «Крошку». После его первого заказа начислим по 200 баллов каждому.</p></div><p class="option-label">Ваш код приглашения</p><div class="success-number" style="font-size:25px">KROSHKA200</div><button class="primary-button" data-action="copy-code">Скопировать код ${icon('copy')}</button><p class="demo-note">Пример акции для прототипа. Код не действует в реальных кофейнях.</p>`);}else{sheet('Утро начинается с приятного',`<div class="offer-detail"><span class="offer-label">КАЖДЫЙ ДЕНЬ ДО 12:00</span><h3>Кофе + круассан.<br>Всего 390 ₽.</h3><img src="assets/croissant.webp" alt="Сливочный круассан"><p>Капучино 250 мл на классическом молоке и свежий сливочный круассан. Скидка 140 ₽ уже в цене.</p></div><button class="primary-button" data-action="add-combo">Добавить комбо <span>390 ₽</span></button>`);}}
function openOffers(){sheet('Приятные поводы',`<button class="location-item" data-action="offer" data-offer="breakfast"><span class="location-pin">${icon('coffee')}</span><span><strong>Кофе + круассан за 390 ₽</strong><small>Каждый день до 12:00 · экономия 140 ₽</small></span>${icon('chevron-right')}</button><button class="location-item" data-action="offer" data-offer="friend"><span class="location-pin">${icon('gift')}</span><span><strong>200 баллов за друга</strong><small>Вам обоим после его первого заказа</small></span>${icon('chevron-right')}</button>`);}
function toggleFavorite(id){if(!product(id))return;const yes=!state.favorites.has(id);if(yes)state.favorites.add(id);else state.favorites.delete(id);persist();$$(`.favorite-button[data-id="${id}"]`).forEach(b=>{b.classList.toggle('saved',yes);b.setAttribute('aria-pressed',String(yes));b.setAttribute('aria-label',`${yes?'Убрать из избранного':'В избранное'}: ${product(id).name}`);});if(state.tab==='favorites')renderPage();toast(yes?'Сохранили в любимое':'Убрали из любимого');}

document.addEventListener('click',async(event)=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.tab){navigate(button.dataset.tab);return;}
  if(button.dataset.filter){state.filter=button.dataset.filter;renderPage();return;}
  const {action,id}=button.dataset;
  switch(action){
    case 'close-sheet':closeSheet();break;
    case 'locations':openLocations();break;
    case 'select-location':state.branchSelected=true;state.branch=Number(button.dataset.index);cartOptions.pickup=null;persist();updateHeader();refreshBasket();icons();closeSheet();toast(`Ваша кофейня — ${branches[state.branch].name.toLowerCase()}`);break;
    case 'notifications':openNotifications();break;
    case 'profile':openProfile();break;
    case 'loyalty':openLoyalty();break;
    case 'member-card':openMemberCard();break;
    case 'favorite':toggleFavorite(id);break;
    case 'product':openProduct(id);break;
    case 'quick-add':addToCart(id);toast(`${product(id).name} — в вашем заказе`);break;
    case 'add-detail':addConfiguredProduct();break;
    case 'menu':navigate('menu');break;
    case 'active-order':openActiveOrder(Number(button.dataset.number));break;
    case 'order-home':navigate('home');break;
    case 'orders':navigate('orders');break;
    case 'new':navigate('menu');state.filter='new';renderPage();break;
    case 'cart':openCart();break;
    case 'cart-minus':case 'cart-plus':{const item=state.cart.find(c=>c.key===button.dataset.key);if(!item)break;item.qty+=action==='cart-plus'?1:-1;state.cart=state.cart.filter(c=>c.qty>0);updateCart();openCart();break;}
    case 'checkout':checkout();break;
    case 'offer':openOffer(button.dataset.offer);break;
    case 'offers':openOffers();break;
    case 'add-combo':addToCart('morning-combo');closeSheet();toast('Кофе и круассан уже в вашем заказе');break;
    case 'copy-code':try{await navigator.clipboard.writeText('KROSHKA200');toast('Код KROSHKA200 скопирован');}catch{toast('Ваш код: KROSHKA200. Можно скопировать его вручную.');}break;
    case 'repeat-order':{const order=state.orders.find(o=>String(o.number)===button.dataset.number);if(order){order.items.forEach(c=>{for(let n=0;n<c.qty;n++)addToCart(c.id,c);});}else{addToCart('cappuccino');addToCart('croissant');}openCart();break;}
    case 'edit-profile':sheet('Как к вам обращаться?',`<form id="profile-form"><label class="profile-field">Ваше имя<input id="profile-name" name="name" value="${safe(state.name)}" required maxlength="30" autocomplete="given-name"></label><button class="primary-button" type="submit">Сохранить</button></form>`);break;
    case 'notification-settings':sheet('Уведомления',`<label class="notification-settings"><span>Акции и новые маленькие радости</span><input id="offers-notifications" type="checkbox" ${state.notificationOffers?'checked':''}></label><p class="demo-note">Настройка сохраняется в этом браузере. Настоящие push-уведомления в прототипе не отправляются.</p>`);break;
  }
});
document.addEventListener('input',(event)=>{if(event.target.id==='menu-search'){state.search=event.target.value;const list=filteredProducts();$('#menu-results').innerHTML=list.map(catalogCard).join('');$('#search-empty').hidden=list.length>0;icons();}});
document.addEventListener('change',(event)=>{if(event.target.id==='redeem-bonus'){state.redeem=event.target.checked;$('#cart-total').textContent=money(cartSubtotal()-discount());}if(event.target.id==='offers-notifications'){state.notificationOffers=event.target.checked;persist();toast('Настройка сохранена');}});
document.addEventListener('submit',(event)=>{if(event.target.id==='profile-form'){event.preventDefault();const name=$('#profile-name').value.trim();if(!name){$('#profile-name').setCustomValidity('Введите имя');$('#profile-name').reportValidity();return;}state.name=name;persist();openProfile();toast('Имя сохранено');}});
document.addEventListener('input',(event)=>{if(event.target.id==='profile-name')event.target.setCustomValidity('');});
$('#sheet-backdrop').addEventListener('click',()=>closeSheet());
document.addEventListener('keydown',(event)=>{if($('#bottom-sheet').hidden)return;if(event.key==='Escape'){event.preventDefault();closeSheet();}if(event.key==='Tab'){const focusable=$$('button:not([disabled]),input:not([disabled]),a[href],select,textarea',$('#bottom-sheet')).filter(e=>e.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
renderPage();

// Choose a pickup cafe before an order action; browsing stays available.
document.addEventListener('click',event=>{
  if(state.branchSelected)return;
  const button=event.target.closest('button');if(!button)return;
  if(['quick-add','add-combo','repeat-order','checkout'].includes(button.dataset.action)||button.dataset.pdAction==='add'||['pay','demo'].includes(button.dataset.basketAction)){
    event.preventDefault();event.stopImmediatePropagation();
    closeSheet(false);openLocations();toast('Выберите кофейню, чтобы добавить товары в заказ');
  }
},true);
