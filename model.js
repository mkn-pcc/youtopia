(function(root) {
  'use strict';
  const GROUP_SIZE = 100000;
  const BASE_INCOMES = [30000,45000,60000,90000];
  const BASE_G = 3183;
  const BASE_OTHER = 21863.4;
  const CAPACITY = 42750;
  const MPC = 0.8;
  const BRACKETS = [
    {lo:0,hi:18200,rate:0},
    {lo:18200,hi:45000,rate:0.15},
    {lo:45000,hi:135000,rate:0.30},
    {lo:135000,hi:190000,rate:0.37},
    {lo:190000,hi:Infinity,rate:0.45}
  ];
  const ROUND_NAMES = ['Spare capacity','Demand boom','Supply disruption'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const finite = (x,fallback=0) => Number.isFinite(Number(x)) ? Number(x) : fallback;
  const clamp = (x,lo,hi) => Math.max(lo,Math.min(hi,finite(x)));
  function taxSlices(income) {
    const y=Math.max(0,finite(income));
    return BRACKETS.map(b=>({lo:b.lo,hi:b.hi,rate:b.rate,amount:Math.max(0,Math.min(y,b.hi)-b.lo),tax:Math.max(0,Math.min(y,b.hi)-b.lo)*b.rate}));
  }
  function incomeTax(income) {return taxSlices(income).reduce((a,b)=>a+b.tax,0);}
  function payRise(income,extra) {
    const oldIncome=Math.max(0,finite(income)),newIncome=Math.max(0,oldIncome+finite(extra));
    const oldTax=incomeTax(oldIncome),newTax=incomeTax(newIncome);
    return {oldIncome,newIncome,oldTax,newTax,extraTax:newTax-oldTax,extraRetained:(newIncome-oldIncome)-(newTax-oldTax),oldRetained:oldIncome-oldTax,newRetained:newIncome-newTax,slices:taxSlices(newIncome)};
  }
  function publicGoods(contributions) {
    const c=Array.from({length:4},(_,i)=>clamp(contributions?.[i],0,20));
    const total=c.reduce((a,b)=>a+b,0),eachBenefit=0.4*total;
    const payoffs=c.map(v=>20-v+eachBenefit);
    return {contributions:c,total,eachBenefit,payoffs,groupPayoff:payoffs.reduce((a,b)=>a+b,0),sharedBenefit:1.6*total,fundingPercent:total/80*100};
  }
  function initialState() {
    return {version:1,round:0,gChange:0,rebate:0,raises:[0,0,0,0],goods:{mode:'voluntary',contributions:[0,0,0,0]},closed:[],completed:{fiscal:false,tax:false,goods:false},history:[],lastPrice:1};
  }
  function cleanState(raw) {
    const d=initialState();
    if(!raw||raw.version!==1)return d;
    d.round=Math.round(clamp(raw.round,0,2));
    d.gChange=clamp(raw.gChange,-2500,6000);
    d.rebate=clamp(raw.rebate,0,1000);
    d.raises=BASE_INCOMES.map((_,i)=>clamp(raw.raises?.[i],0,20000));
    d.goods.mode=raw.goods?.mode==='levy'?'levy':'voluntary';
    d.goods.contributions=publicGoods(raw.goods?.contributions).contributions;
    d.closed=Array.isArray(raw.closed)?raw.closed.slice(0,d.round).filter(x=>x&&Number.isFinite(x.balance)).map(x=>({round:x.round,balance:x.balance,realOutput:x.realOutput,price:x.price})):[];
    d.completed={fiscal:!!raw.completed?.fiscal,tax:!!raw.completed?.tax,goods:!!raw.completed?.goods};
    d.history=Array.isArray(raw.history)?raw.history.slice(-15).filter(x=>x&&typeof x.label==='string').map(x=>({label:x.label.slice(0,160),round:finite(x.round),realOutput:finite(x.realOutput),balance:finite(x.balance),price:finite(x.price)})):[];
    d.lastPrice=Math.max(1,finite(raw.lastPrice,1));
    return d;
  }
  function economy(input) {
    const s=cleanState(input);
    const incomes=BASE_INCOMES.map((base,i)=>base+s.raises[i]);
    const taxAmounts=incomes.map(incomeTax);
    const goods=publicGoods(s.goods.contributions);
    const countryProject=goods.total*100*GROUP_SIZE/1e6;
    const incomeTaxReceipts=taxAmounts.reduce((a,b)=>a+b,0)*GROUP_SIZE/1e6;
    const rebates=s.rebate*4*GROUP_SIZE/1e6;
    const netIncomeTax=incomeTaxReceipts-rebates;
    const projectLevy=s.goods.mode==='levy'?countryProject:0;
    const governmentProject=s.goods.mode==='levy'?countryProject:0;
    const privateProject=s.goods.mode==='voluntary'?countryProject:0;
    const retained=incomes.map((v,i)=>v-taxAmounts[i]+s.rebate-goods.contributions[i]*100);
    const householdSpending=retained.reduce((a,b)=>a+b,0)*GROUP_SIZE/1e6*MPC;
    const ordinaryPurchases=BASE_G+s.gChange;
    const governmentSpending=ordinaryPurchases+governmentProject;
    const governmentRevenue=netIncomeTax+projectLevy;
    const balance=governmentRevenue-governmentSpending;
    const fixedOther=BASE_OTHER+(s.round>=1?2250:0);
    const capacity=CAPACITY*(s.round===2?0.9:1);
    const demand=householdSpending+fixedOther+governmentSpending+privateProject;
    const realOutput=Math.min(capacity,demand);
    const price=Math.max(1,demand/capacity);
    const nominalOutput=realOutput*price;
    const payroll=incomes.reduce((a,b)=>a+b,0)*GROUP_SIZE/1e6;
    const remainingFirmEarnings=nominalOutput-payroll;
    const closedBalances=s.closed.reduce((a,b)=>a+b.balance,0);
    const projectedDebt=12000-closedBalances-balance;
    return {incomes,taxAmounts,goods,countryProject,incomeTaxReceipts,rebates,netIncomeTax,projectLevy,governmentProject,privateProject,retained,householdSpending,ordinaryPurchases,governmentSpending,governmentRevenue,balance,fixedOther,capacity,demand,realOutput,price,nominalOutput,payroll,remainingFirmEarnings,projectedDebt,priceIndex:price*100,priceChange:(price/s.lastPrice-1)*100,capacityUse:realOutput/capacity*100,jobsSupported:Math.round(realOutput*1e6/100000),averageRetained:retained.reduce((a,b)=>a+b,0)/4,population:800000,households:400000};
  }
  function applyDecision(input,module,patch,label) {
    const old=cleanState(input),before=economy(old),next=clone(old);
    if(module==='fiscal') {next.gChange=clamp(patch.gChange,-2500,6000);next.rebate=clamp(patch.rebate,0,1000);}
    else if(module==='tax') {const i=Math.round(clamp(patch.household,0,3));next.raises[i]=clamp(patch.raise,0,20000);}
    else if(module==='goods') {next.goods={mode:patch.mode==='levy'?'levy':'voluntary',contributions:publicGoods(patch.contributions).contributions};}
    else throw new Error('Unknown activity');
    next.lastPrice=before.price;
    next.completed[module]=true;
    const after=economy(next);
    next.history.push({label:String(label).slice(0,160),round:next.round,realOutput:after.realOutput,balance:after.balance,price:after.price});
    next.history=next.history.slice(-15);
    return next;
  }
  function nextRound(input) {
    const next=cleanState(input),before=economy(next);
    if(next.round>=2)return next;
    next.closed.push({round:next.round,balance:before.balance,realOutput:before.realOutput,price:before.price});
    next.round+=1;next.lastPrice=before.price;
    const after=economy(next);
    next.history.push({label:ROUND_NAMES[next.round],round:next.round,realOutput:after.realOutput,balance:after.balance,price:after.price});
    return next;
  }
  const api={GROUP_SIZE,BASE_INCOMES,BASE_G,BASE_OTHER,CAPACITY,MPC,BRACKETS,ROUND_NAMES,incomeTax,taxSlices,payRise,publicGoods,initialState,cleanState,economy,applyDecision,nextRound,clone};
  root.YoutopiaModel=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
