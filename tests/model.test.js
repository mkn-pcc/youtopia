const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../model.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);
test('2026–27 resident band calculations and $1,000 pay rise',()=>{
 for(const [income,tax] of [[0,0],[18200,0],[30000,1770],[45000,4020],[46000,4320],[60000,8520],[90000,17520],[135000,31020],[190000,51370],[200000,55870]])near(M.incomeTax(income),tax);
 const p=M.payRise(45000,1000);near(p.extraTax,300);near(p.extraRetained,700);
 for(const x of [18200,45000,135000,190000])assert.ok(M.payRise(x,1).extraRetained>0);
});
test('country baseline and financing identity',()=>{
 const e=M.economy(M.initialState());
 near(e.realOutput,40500);near(e.priceIndex,100);near(e.balance,0);near(e.averageRetained,48292.5);near(e.projectedDebt,12000);
 near(e.nominalOutput,e.payroll+e.remainingFirmEarnings);
 near(e.nominalOutput,e.householdSpending+e.fixedOther+e.governmentSpending+e.privateProject);
});
test('pay-rise cohort affects exact receipts, retained income and assumed spending',()=>{
 const s=M.applyDecision(M.initialState(),'tax',{household:1,raise:1000},'pay rise'),e=M.economy(s);
 near(e.incomeTaxReceipts,3213);near(e.averageRetained,48467.5);near(e.householdSpending,15509.6);near(e.balance,30);near(e.realOutput,40556);
 near(e.remainingFirmEarnings,17956);
});
test('CORE public-goods examples preserve points/currency distinction',()=>{
 let g=M.publicGoods([0,0,0,0]);assert.deepEqual(g.payoffs,[20,20,20,20]);near(g.groupPayoff,80);
 g=M.publicGoods([20,20,20,20]);assert.deepEqual(g.payoffs,[32,32,32,32]);near(g.groupPayoff,128);
 g=M.publicGoods([0,20,20,20]);assert.deepEqual(g.payoffs,[44,24,24,24]);near(g.groupPayoff,116);
});
test('matched voluntary and levy contributions purchase the project once',()=>{
 const v=M.applyDecision(M.initialState(),'goods',{mode:'voluntary',contributions:[10,10,10,10]},'voluntary');
 const l=M.applyDecision(M.initialState(),'goods',{mode:'levy',contributions:[10,10,10,10]},'levy');
 const a=M.economy(v),b=M.economy(l);
 near(a.realOutput,40580);near(a.realOutput,b.realOutput);near(a.countryProject,400);near(a.balance,0);near(b.balance,0);
 near(b.governmentRevenue,a.governmentRevenue+400);near(b.governmentSpending,a.governmentSpending+400);near(a.privateProject,400);near(b.privateProject,0);
 near(a.goods.sharedBenefit,64);
});
test('fiscal spending and tax rebate have different direct demand effects',()=>{
 const spend=M.economy(M.applyDecision(M.initialState(),'fiscal',{gChange:1000,rebate:0},'spend'));
 near(spend.realOutput,41500);near(spend.balance,-1000);
 const rebate=M.economy(M.applyDecision(M.initialState(),'fiscal',{gChange:0,rebate:1000},'rebate'));
 near(rebate.realOutput,40820);near(rebate.balance,-400);
});
test('demand boom and supply disruption show capacity/price limits',()=>{
 let s=M.nextRound(M.initialState()),e=M.economy(s);near(e.realOutput,42750);near(e.priceIndex,100);
 s=M.applyDecision(s,'fiscal',{gChange:1000,rebate:0},'spend');e=M.economy(s);near(e.realOutput,42750);assert.ok(e.price>1);
 const previous=e.price;s=M.nextRound(s);e=M.economy(s);near(e.capacity,38475);near(e.realOutput,38475);assert.ok(e.price>previous);
});
test('policy edits do not repeatedly accrue public debt',()=>{
 let s=M.applyDecision(M.initialState(),'fiscal',{gChange:1000,rebate:0},'a');near(M.economy(s).projectedDebt,13000);
 s=M.applyDecision(s,'fiscal',{gChange:2000,rebate:0},'b');near(M.economy(s).projectedDebt,14000);
 s=M.nextRound(s);near(M.economy(s).projectedDebt,16000);
});
test('valid policy combinations preserve constraints and national spending identity',()=>{
 for(const round of [0,1,2])for(const gChange of [-2500,0,6000])for(const rebate of [0,1000])for(const mode of ['voluntary','levy']) {
  const s=M.initialState();Object.assign(s,{round,gChange,rebate});s.goods={mode,contributions:[20,10,5,0]};s.raises=[20000,1000,5000,0];
  const e=M.economy(s);assert.ok(e.price>=1&&e.realOutput<=e.capacity&&e.realOutput>0&&e.remainingFirmEarnings>0);
  near(e.nominalOutput,e.demand);near(e.balance,e.governmentRevenue-e.governmentSpending);
  near(e.nominalOutput,e.householdSpending+e.fixedOther+e.governmentSpending+e.privateProject);
 }
});
