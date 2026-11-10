'use strict';

const PaymentValidation = (() => {
function luhnValid(number) {
  let sum=0, double=false;
  for(let i=number.length-1;i>=0;i--) {
    let digit=Number(number[i]);
    if(double) { digit*=2; if(digit>9) digit-=9; }
    sum+=digit; double=!double;
  }
  return sum%10===0 && !/^0+$/.test(number);
}

function validateCardField(name, value, now=new Date()) {
  const digits=value.replace(/\D/g,'');
  if(name==='number') {
    if(!digits) return 'Введите номер карты';
    if(digits.length<16||digits.length>19) return 'Введите корректный номер карты';
    if(!luhnValid(digits)) return 'Карты с таким номером не существует';
  }
  if(name==='expiry') {
    if(!digits) return 'Введите срок действия';
    if(digits.length!==4) return 'Введите корректный срок действия';
    const month=Number(digits.slice(0,2)), year=2000+Number(digits.slice(2));
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
    if(month<1||month>12) return 'Введите корректный срок действия';
    if(year<Number(parts.year)||(year===Number(parts.year)&&month<Number(parts.month))) return 'Срок действия карты истёк';
  }
  if(name==='cvc') {
    if(!digits) return 'Введите CVC/CVV';
    if(digits.length!==3) return 'Введите корректный CVC/CVV';
  }
  return '';
}

return { luhnValid, validateCardField };
})();
if(typeof module!=='undefined') module.exports=PaymentValidation;
