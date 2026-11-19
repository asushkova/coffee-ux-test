'use strict';

// Shared by the browser and the baseline checks. No participant data is stored.
(function(root){
  const tasks=[{id:'1',name:'Оформление заказа',method:'sbp',scenario:'sbp',
    instruction:'Оформите и оплатите заказ, выбрав подходящее время получения.',
    check:'Корзина и способы оплаты соответствуют макету; баллы списываются до 10%, начисляются 15%.'}];
  function taskById(id){return tasks.find(task=>task.id===String(id))||tasks[0];}
  function baseline(id){
    const task=taskById(id);
    return {taskId:task.id,scenario:task.scenario,method:task.method,bonus:76,redeem:true,
      promo:'',pickup:null,branch:0,hasLinked:false,hasVisa:false,
      cart:[{id:'flow-flat',price:380,unit:'350 мл',qty:1,milk:'Овсяное',modifiers:[]},
        {id:'flow-frappe',price:385,unit:'250 мл',qty:1,milk:'Классическое',modifiers:[]}]};
  }
  function schedule(){
    const slots=[];
    for(let minute=14*60+30;minute<=15*60+30;minute+=5){
      const clock=value=>`${Math.floor(value/60).toString().padStart(2,'0')}:${(value%60).toString().padStart(2,'0')}`;
      slots.push({key:minute===870?'research-1430':`research-${minute}`,label:`${clock(minute)}–${clock(minute+5)}`,day:'Сегодня'});
    }
    return {slots,nearestLabel:'Ближайшее',nearestHint:'через 5 минут',day:'Сегодня',first:slots[0]};
  }
  const config={tasks,taskById,baseline,schedule};
  if(typeof module==='object'&&module.exports)module.exports=config;
  else root.ResearchConfig=config;
})(typeof globalThis==='object'?globalThis:this);
