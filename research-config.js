'use strict';

// Shared by the browser and the baseline checks. No participant data is stored.
(function(root){
  const tasks=[
    {id:'1',name:'Оформление заказа',method:'sbp',scenario:'sbp',
      instruction:'Вы уже выбрали кофейню и напитки. Оформите и оплатите заказ, чтобы забрать его в 14:30–14:35.',
      check:'Заказ оплачен, в подтверждении и деталях указано 14:30–14:35.'},
    {id:'2',name:'Изменение состава',method:'saved-visa',scenario:'saved-visa',
      instruction:'Вы передумали брать шоколадный фраппе. Оставьте флэт уайт, добавьте чизкейк Нью-Йорк и оплатите заказ на 14:30–14:35.',
      check:'Фраппе удалён, флэт уайт и чизкейк в заказе. Без скидок итог 805 ₽.'},
    {id:'3',name:'Баллы и промокод',method:'saved-visa',scenario:'saved-visa',
      instruction:'У вас есть 76 баллов и промокод NEW100 на скидку 100 ₽. Оформите заказ с использованием обеих возможностей и оплатите его.',
      check:'765 − 100 − 76 = 589 ₽. Неверный код показывает ошибку, исправление и удаление кода работают.'},
    {id:'4',name:'Восстановление после ошибки',method:'saved-visa',scenario:'payment-error',
      instruction:'Оформите и оплатите выбранные напитки на 14:30–14:35. Действуйте так, как поступили бы обычно.',
      check:'Первая оплата отклонена. Корзина, время, баллы и промокод сохраняются. Повтор или смена способа завершают заказ.'}
  ];
  function taskById(id){return tasks.find(task=>task.id===String(id))||tasks[0];}
  function baseline(id){
    const task=taskById(id);
    return {taskId:task.id,scenario:task.scenario,method:task.method,bonus:76,redeem:false,
      promo:'',pickup:'research-1430',branch:0,hasLinked:true,hasVisa:true,
      cart:[{id:'flow-flat',price:380,unit:'350 мл',qty:1,milk:'Овсяное',modifiers:[]},
        {id:'flow-frappe',price:385,unit:'250 мл',qty:1,milk:'Классическое',modifiers:[]}]};
  }
  function schedule(){
    const slots=[];
    for(let minute=14*60+30;minute<=15*60+30;minute+=5){
      const clock=value=>`${Math.floor(value/60).toString().padStart(2,'0')}:${(value%60).toString().padStart(2,'0')}`;
      slots.push({key:minute===870?'research-1430':`research-${minute}`,label:`${clock(minute)}–${clock(minute+5)}`,day:'Сегодня'});
    }
    return {slots,nearestLabel:'Ближайшее',nearestHint:'14:30–14:35',day:'Сегодня',first:slots[0]};
  }
  const config={tasks,taskById,baseline,schedule};
  if(typeof module==='object'&&module.exports)module.exports=config;
  else root.ResearchConfig=config;
})(typeof globalThis==='object'?globalThis:this);
