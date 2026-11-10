'use strict';

// Shared by the browser and the baseline checks. No participant data is stored.
(function(root){
  const tasks=[{id:'1',name:'Оформление заказа',method:'sbp',scenario:'sbp',
    instruction:'Оформите и оплатите выбранные напитки, чтобы забрать заказ в 14:30–14:35.',
    check:'Два напитка, 765 ₽, успешная оплата и получение в 14:30–14:35.'}];
  function taskById(id){return tasks.find(task=>task.id===String(id))||tasks[0];}
  function baseline(id){
    const task=taskById(id);
    return {taskId:task.id,scenario:task.scenario,method:task.method,bonus:0,redeem:false,
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
