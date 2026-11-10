'use strict';
const cafeDetails=[
  {metro:'Петроградская',walk:'3 минуты',load:'Средняя загрузка',wait:'Кофе будет готов через 7–10 минут',entrance:'Вход с Каменноостровского проспекта. Большие окна, оранжевая вывеска — вы нас узнаете.',seats:'Есть места внутри',x:52,y:48},
  {metro:'Горьковская',walk:'15 минут',load:'Сейчас спокойно',wait:'Кофе будет готов через 5–7 минут',entrance:'Вход с Кронверкского проспекта, со стороны сквера. Можно присесть у окна или взять кофе с собой.',seats:'Столики у окна',x:76,y:73},
  {metro:'Чкаловская',walk:'20 минут',load:'Средняя загрузка',wait:'Кофе будет готов через 7–10 минут',entrance:'Вход с Большой Зелениной улицы. Заходите за кофе и тёплым круассаном по пути.',seats:'Есть места внутри',x:20,y:64}
];
const cafePhotos=[{src:'assets/cafe-interior.webp',label:'Внутри',alt:'Уютный интерьер кофейни в тёплых тонах'},{src:'assets/cappuccino.webp',label:'Наш кофе',alt:'Капучино с рисунком на молочной пенке'},{src:'assets/croissant.webp',label:'Из печи',alt:'Сливочный круассан'}];
let cafePreview=0,cafeOpener=null,cafeReturnHash='',cafePanel='detail',cafeRoute=false;
let cafeGeoState='idle',cafeGeoDistances=null,cafeGeoShared=false;
function cafeDistanceLabel(index){
  if(!cafeGeoDistances)return 'Расстояние не определено';
  const meters=cafeGeoDistances[index];
  return (meters<1000?`${meters} м`:`${(meters/1000).toLocaleString('ru-RU',{maximumFractionDigits:1})} км`)+' по прямой';
}
function cafeGeoMarkup(){
  const messages={near:['Выбрали ближайшую кофейню',`${branches[cafePreview].name} · ${cafeDistanceLabel(cafePreview)}. Можно выбрать другую.`],far:['Пока нас нет рядом','В радиусе 5 км нет наших кофеен. Выберите точку вручную, если планируете быть поблизости.'],denied:['Выберите кофейню вручную','Все наши кофейни доступны на карте и в списке.']};
  const message=messages[cafeGeoState];
  return `${message?`<div class="cafe-geo-notice" role="status"><strong>${message[0]}</strong><p>${message[1]}</p>${cafeGeoState==='far'?'<button class="text-link" data-cafe-action="list">Выбрать кофейню вручную</button>':''}</div>`:''}${cafeGeoShared?`<div class="cafe-demo-controls"><span>Сценарий прототипа</span><div><button data-cafe-action="demo-near" aria-pressed="${cafeGeoState==='near'}">Есть поблизости</button><button data-cafe-action="demo-far" aria-pressed="${cafeGeoState==='far'}">Нет поблизости</button></div></div>`:''}`;
}
function cafePermissionMarkup(){
  if(cafeGeoState!=='permission')return '';
  return `<div class="cafe-permission-backdrop"><section class="cafe-permission" role="dialog" aria-modal="true" aria-labelledby="cafe-permission-title" aria-describedby="cafe-permission-description"><div class="cafe-permission-icon">${icon('map-pin')}</div><h2 id="cafe-permission-title">Найдём кофе рядом?</h2><p id="cafe-permission-description">Поделитесь местоположением — выберем ближайшую кофейню, чтобы за любимым кофе не пришлось далеко идти.</p><button class="primary-button" data-cafe-action="geo-share">Поделиться местоположением</button><button class="cafe-permission-later" data-cafe-action="geo-skip">Выбрать вручную</button></section></div>`;
}
function requestCafeLocation(){
  cafeGeoState='permission';cafeGeoShared=false;cafeGeoDistances=null;renderCafeMap();
}
function simulateCafeLocation(near){
  cafeGeoState=near?'near':'far';cafeGeoShared=true;cafeGeoDistances=near?[250,1200,1600]:[12400,13600,14500];
  if(near){cafePreview=0;cafePanel='detail';state.branchSelected=true;state.branch=0;}
  else{cafePanel='list';state.branchSelected=false;}
  cartOptions.pickup=null;persist();updateHeader();refreshBasket();renderCafeMap();
  $('#cafe-title').focus({preventScroll:true});
}
function openCafeMap(index=state.branch){
  const view=$('#cafe-view');
  const opening=view.hidden;
  if(view.hidden){cafeOpener=document.activeElement;cafeReturnHash=location.hash;}
  closeSheet(false);closeProductDetail(false);
  cafePreview=branches[index]?index:state.branch;cafePanel=state.branchSelected?'detail':'list';cafeRoute=false;
  view.hidden=false;$('.screen').classList.add('cafe-opened');
  $$('.screen > *').forEach(node=>node.inert=!['cafe-view','toast'].includes(node.id));
  renderCafeMap();
  $('#cafe-title').focus({preventScroll:true});
  if(opening)requestCafeLocation();
}
function cafeStatus(b){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
  const [open,close]=b.hours.split('–');
  return parts>=open&&parts<close?`Открыто до ${close}`:`Откроется в ${open}`;
}
function cafeMapMarkup(){return `<div class="cafe-map" aria-label="Схематичная карта кофеен Петроградской стороны"><div class="cafe-map-art"></div><svg class="cafe-route-line" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" ${cafeRoute?'':'hidden'}><path d="M140 207 L166 195 L177 172 L${cafeDetails[cafePreview].x*4} ${cafeDetails[cafePreview].y*3}"/></svg><div class="cafe-map-top"><button class="cafe-map-button" id="cafe-close" data-cafe-action="close" aria-label="Вернуться">${icon('arrow-left')}</button><span class="cafe-map-title">Кофе рядом</span><div><button class="cafe-map-button" data-cafe-action="list" aria-label="Кофейни списком">${icon('list')}</button><button class="cafe-map-button" data-cafe-action="search" aria-label="Найти кофейню">${icon('search')}</button></div></div>${branches.map((b,i)=>`<button class="cafe-map-pin${i===cafePreview?' selected':''}" style="left:${cafeDetails[i].x}%;top:${cafeDetails[i].y}%" data-cafe-action="pin" data-index="${i}" aria-label="${safe(b.name)}${i===cafePreview?', выбрана на карте':''}" aria-pressed="${i===cafePreview}"><img src="assets/monogram-s.svg" alt=""><span>${i===cafePreview?b.name:'Крошка'}</span></button>`).join('')}<span class="cafe-user-dot" aria-label="Пример вашего расположения"></span><button class="cafe-map-button cafe-locate" data-cafe-action="locate" aria-label="Показать моё расположение на схеме">${icon('navigation')}</button><span class="cafe-map-caption">${cafeRoute?'Пример пути пешком':'Схема района · демо'}</span></div>`;}
function cafeDetailMarkup(){const b=branches[cafePreview],d=cafeDetails[cafePreview];return `<div class="cafe-detail-scroll"><div class="cafe-gallery" aria-label="Фотографии кофейни">${cafePhotos.map((p,i)=>`<button data-cafe-action="photo" data-photo="${i}" aria-label="Увеличить фото: ${p.label}"><img src="${p.src}" alt="${p.alt}"><span>${p.label}</span></button>`).join('')}</div><div class="cafe-title-row"><div><p class="cafe-eyebrow">ВАША МАЛЕНЬКАЯ ОСТАНОВКА</p><h1 id="cafe-title" tabindex="-1">${b.name}</h1></div><button class="cafe-route-button${cafeRoute?' selected':''}" data-cafe-action="route" aria-label="${cafeRoute?'Скрыть':'Показать'} пример маршрута" aria-pressed="${cafeRoute}">${icon('route')}</button></div><p class="cafe-address">Санкт-Петербург, ${b.address}</p><div class="cafe-transport"><span><i class="cafe-metro">м</i>${d.metro}</span><span>${icon('navigation')}${cafeDistanceLabel(cafePreview)}</span></div><div class="cafe-info-row"><span class="cafe-hours">${icon('clock-3')}${cafeStatus(b)}</span><span>${icon('armchair')}${d.seats}</span></div><div class="cafe-load"><span class="cafe-load-bars" aria-hidden="true"><i></i><i class="${cafePreview===1?'quiet':''}"></i><i class="quiet"></i></span><div><strong>${d.load}</strong><span>${d.wait}</span></div></div><div class="cafe-entry"><span>${icon('door-open')}</span><div><h2>Легко найти. Приятно остаться.</h2><p>${d.entrance}</p></div></div><p class="cafe-daily">Ежедневно, ${b.hours}${cafeRoute?` · ${d.walk} пешком по схеме`:''}</p></div><footer class="cafe-footer"><button class="primary-button" data-cafe-action="confirm">Заберу здесь ${icon('arrow-right')}</button><div class="cafe-home-indicator"></div></footer>`;}
function cafeListResults(query=''){const q=query.trim().toLocaleLowerCase('ru');const items=branches.map((b,i)=>({b,i})).sort((a,b)=>cafeGeoDistances?cafeGeoDistances[a.i]-cafeGeoDistances[b.i]:a.i-b.i).filter(({b,i})=>`${b.name} ${b.address} ${cafeDetails[i].metro}`.toLocaleLowerCase('ru').includes(q));return items.length?items.map(({b,i})=>`<button class="cafe-list-item${cafePreview===i?' selected':''}" data-cafe-action="pin" data-index="${i}"><img src="assets/monogram-s.svg" alt=""><span><strong>${b.name}</strong><small>${b.address}</small><small>${b.hours} · ${cafeDistanceLabel(i)}</small></span>${icon(cafePreview===i?'check':'chevron-right')}</button>`).join(''):'<p class="cafe-no-results">Такую кофейню не нашли.<br>Попробуйте название улицы или метро.</p>';}
function renderCafeMap(){
  const view=$('#cafe-view');
  const content=cafePanel==='detail'?cafeDetailMarkup():`<div class="cafe-list"><div class="cafe-list-heading"><h1 id="cafe-title" tabindex="-1">Наши кофейни</h1><button class="icon-button" data-cafe-action="detail" aria-label="К выбранной кофейне">${icon('x')}</button></div><label class="cafe-search">${icon('search')}<input id="cafe-search" placeholder="Улица, метро или кофейня" aria-label="Поиск кофейни" autocomplete="off"></label><div id="cafe-list-results">${cafeListResults()}</div><p class="cafe-list-note">Маленькая радость где-то рядом</p></div>`;
  view.innerHTML=`${cafeMapMarkup()}<section class="cafe-panel"><div class="cafe-handle" aria-hidden="true"></div>${cafeGeoMarkup()}${content}</section><div class="cafe-photo-view" hidden></div>${cafePermissionMarkup()}`;
  $$('.cafe-map,.cafe-panel',$('#cafe-view')).forEach(node=>node.inert=cafeGeoState==='permission');
  icons();if(cafeGeoState==='permission')$('[data-cafe-action="geo-share"]').focus({preventScroll:true});
  try{history.replaceState(null,'',location.pathname+location.search+'#cafe='+cafePreview);}catch{}
}
function closeCafeMap(restore=true){
  const view=$('#cafe-view');if(view.hidden)return;
  view.hidden=true;$('.screen').classList.remove('cafe-opened');$$('.screen > *').forEach(node=>node.inert=false);
  const hash=cafeReturnHash.startsWith('#cafe=')?'':cafeReturnHash;
  try{history.replaceState(null,'',location.pathname+location.search+(state.tab==='cart'?'#cart':hash));}catch{}
  if(restore)(cafeOpener?.isConnected?cafeOpener:$('.tab.active'))?.focus({preventScroll:true});
}
function showCafePhoto(index){const p=cafePhotos[index];if(!p)return;const box=$('.cafe-photo-view');box.innerHTML=`<button class="cafe-map-button" data-cafe-action="close-photo" aria-label="Закрыть фотографию">${icon('x')}</button><img src="${p.src}" alt="${p.alt}"><p>${p.label} <span>· образ кофейни</span></p>`;box.hidden=false;$('.cafe-map').inert=true;$('.cafe-panel').inert=true;icons();$('[data-cafe-action="close-photo"]').focus();}
function closeCafePhoto(){const box=$('.cafe-photo-view');if(!box||box.hidden)return;box.hidden=true;$('.cafe-map').inert=false;$('.cafe-panel').inert=false;$('[data-cafe-action="photo"]')?.focus();}
document.addEventListener('click',event=>{const button=event.target.closest('[data-cafe-action]');if(!button)return;
  switch(button.dataset.cafeAction){
  case 'geo-share':cafeGeoShared=true;cafeGeoState='idle';renderCafeMap();$('[data-cafe-action="demo-near"]').focus();break;
  case 'geo-skip':cafeGeoShared=false;cafeGeoState='denied';cafePanel='list';renderCafeMap();$('#cafe-title').focus();break;
  case 'demo-near':simulateCafeLocation(true);break;
  case 'demo-far':simulateCafeLocation(false);break;
  case 'close':closeCafeMap();break;
  case 'pin':cafePreview=Number(button.dataset.index);cafePanel='detail';cafeRoute=false;renderCafeMap();$('[data-cafe-action="confirm"]').focus({preventScroll:true});break;
  case 'list':case 'search':cafePanel='list';renderCafeMap();$('#cafe-search').focus({preventScroll:true});break;
  case 'detail':cafePanel='detail';renderCafeMap();$('[data-cafe-action="list"]').focus({preventScroll:true});break;
  case 'route':cafeRoute=!cafeRoute;{const scroll=$('.cafe-detail-scroll').scrollTop;renderCafeMap();$('.cafe-detail-scroll').scrollTop=scroll;$('[data-cafe-action="route"]').focus({preventScroll:true});}break;
  case 'locate':requestCafeLocation();break;
  case 'photo':showCafePhoto(Number(button.dataset.photo));break;
  case 'close-photo':closeCafePhoto();break;
  case 'confirm':state.branchSelected=true;state.branch=cafePreview;cartOptions.pickup=null;persist();updateHeader();refreshBasket();icons();closeCafeMap();toast(`Заберёте ${branches[state.branch].name.toLowerCase()}`);break;
}});
document.addEventListener('input',event=>{if(event.target.id==='cafe-search'){$('#cafe-list-results').innerHTML=cafeListResults(event.target.value);icons();}});
document.addEventListener('keydown',event=>{if($('#cafe-view').hidden)return;if(event.key==='Escape'){event.preventDefault();if(cafeGeoState==='permission'){cafeGeoState='denied';cafePanel='list';renderCafeMap();$('#cafe-title').focus();return;}if(!$('.cafe-photo-view').hidden)closeCafePhoto();else if(cafePanel==='list'){cafePanel='detail';renderCafeMap();$('#cafe-close').focus();}else closeCafeMap();}if(event.key==='Tab'){const items=$$('button,input,a[href]',$('#cafe-view')).filter(el=>!el.disabled&&!el.closest('[hidden],[inert]'));const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
function syncCafeLink(){const match=location.hash.match(/^#cafe=(\d)$/);if(match&&branches[Number(match[1])])openCafeMap(Number(match[1]));else if(!$('#cafe-view').hidden){const hash=location.hash;closeCafeMap(false);history.replaceState(null,'',location.pathname+location.search+hash);}}
window.addEventListener('hashchange',syncCafeLink);
document.addEventListener('DOMContentLoaded',syncCafeLink);
