const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {parseHTML}=require('linkedom');
const M=require('../model');
const T=require('../teaching-model');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);
function boot(saved){
 const {window}=parseHTML(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'));
 const storage=new Map(saved||[]);
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 window.YoutopiaModel=M;window.YoutopiaTeachingModel=T;window.confirm=()=>true;
 const context={window,document:window.document,localStorage,Intl,console,setTimeout:()=>0,clearTimeout:()=>{},Math};
 for(const name of ['app.js','teaching.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context);
 const $=id=>window.document.getElementById(id);
 const click=target=>{const el=typeof target==='string'?$(target):target;assert.ok(el,'Missing '+target);el.dispatchEvent(new window.Event('click',{bubbles:true}));};
 return {window,$,click,storage,select:()=>click(window.document.querySelector('[data-prediction="0"]')),state:()=>window.YoutopiaApp.getState(),economy:()=>window.YoutopiaApp.getEconomy(),open:t=>window.YoutopiaApp.openActivity(t)};
}
test('guided predictions do not apply decisions; feedback, result and reveal form a complete lesson',()=>{
 const a=boot();assert.equal(a.window.YoutopiaTeaching.getPreferences().mode,'guided');
 a.open('fiscal');assert.match(a.$('lesson-content').textContent,/Fiscal policy/);assert.equal(a.state().history.length,0);
 a.click('lesson-predict');assert.ok(a.$('lesson-run').disabled);a.click(a.window.document.querySelector('[data-prediction="1"]'));assert.match(a.$('prediction-feedback').textContent,/Reconsider/);assert.equal(a.state().gChange,0);
 a.select();a.click('lesson-run');assert.equal(a.state().gChange,1000);near(a.economy().realOutput,41500);near(a.economy().balance,-1000);assert.match(a.$('lesson-content').textContent,/Government purchases rise by \$1.00bn/);assert.match(a.$('lesson-content').textContent,/spare capacity/);assert.ok(a.$('explain-answer').hidden);
 assert.ok(a.$('lesson-discussion').hidden);assert.match(a.$('effect-text').textContent,/Government purchases/);a.click('effect-next');assert.match(a.$('effect-text').textContent,/Production/);a.click('effect-next');a.click('effect-next');assert.equal(a.$('lesson-discussion').hidden,false);
 a.click('explain-reveal');assert.equal(a.$('explain-answer').hidden,false);a.click('lesson-finish');assert.equal(a.window.YoutopiaTeaching.getPreferences().done.length,1);
 const b=boot(a.storage);assert.equal(b.state().gChange,1000);assert.equal(b.window.YoutopiaTeaching.getPreferences().done[0],'fiscal');
});
test('extra household tax survives storage and gives the correct revenue, spending and output effects',()=>{
 const a=boot();a.open('fiscal');a.click('lesson-predict');a.click(a.window.document.querySelector('[data-scenario="tax"]'));a.select();a.click('lesson-run');
 assert.equal(a.state().rebate,-500);near(a.economy().balance,200);near(a.economy().realOutput,40340);near(a.economy().averageRetained,47792.5);
 assert.match(a.$('lesson-content').textContent,/revenue rises by \$200m/);assert.match(a.$('lesson-content').textContent,/spending falls by \$160m/);
 const b=boot(a.storage);assert.equal(b.state().rebate,-500);near(b.economy().balance,200);
});
test('the same spending increase explains extra production with spare capacity and price pressure at capacity',()=>{
 const before=M.initialState(),after=M.applyDecision(before,'fiscal',{gChange:1000,rebate:0},'spend');const spare=T.explain(before,after,'fiscal');
 assert.match(spare.production,/Production rises/);near(spare.after.priceIndex,100);
 const boom=M.nextRound(before),boomAfter=M.applyDecision(boom,'fiscal',{gChange:1000,rebate:0},'spend');const full=T.explain(boom,boomAfter,'fiscal');
 assert.match(full.production,/Production stays at its limit/);assert.match(full.production,/price index/);near(full.after.realOutput,full.before.realOutput);assert.ok(full.after.priceIndex>full.before.priceIndex);
});
test('guided marginal-tax lesson keeps the original $300/$700 example and explains an unchanged repeat',()=>{
 const a=boot();a.open('tax');assert.match(a.$('lesson-content').textContent,/earlier income/);a.click('lesson-predict');a.select();a.click('lesson-run');
 assert.equal(a.state().raises[1],1000);near(a.economy().balance,30);near(a.economy().realOutput,40556);assert.match(a.$('lesson-content').textContent,/tax rates themselves have not changed/);a.click('lesson-finish');
 a.open('tax');a.click('lesson-predict');a.select();a.click('lesson-run');near(a.economy().balance,30);assert.match(a.$('lesson-content').textContent,/does not add a second pay rise/);
});
test('guided free-rider and compulsory-levy lessons preserve payoffs and separate points from project money',()=>{
 const a=boot();a.open('goods');a.click('lesson-predict');a.click(a.window.document.querySelector('[data-scenario="free"]'));a.select();a.click('lesson-run');
 assert.deepEqual(a.state().goods.contributions,[0,20,20,20]);near(a.economy().goods.payoffs[0],44);near(a.economy().countryProject,600);assert.match(a.$('lesson-content').textContent,/not cash paid back/);a.click('lesson-finish');
 a.open('goods');a.click('lesson-predict');a.click(a.window.document.querySelector('[data-scenario="levy"]'));a.select();a.click('lesson-run');assert.equal(a.state().goods.mode,'levy');near(a.economy().countryProject,800);near(a.economy().balance,0);assert.match(a.$('lesson-content').textContent,/Levy revenue is matched by project spending/);
});
test('exploration, contextual help, preview explanations, undo and restart operate with teaching enabled',()=>{
 const a=boot();a.click('mode-explore');a.open('fiscal');assert.ok(a.$('fiscal-spending'));assert.ok(a.window.document.querySelector('.live-explanation'));
 a.click(a.window.document.querySelector('[data-term="capacity"]'));assert.match(a.$('help-content').textContent,/resources/);assert.equal(a.state().history.length,0);a.click('help-close');
 a.$('fiscal-spending').value='1000';a.$('fiscal-spending').dispatchEvent(new a.window.Event('input',{bubbles:true}));assert.match(a.window.document.querySelector('.live-explanation').textContent,/orders/);a.click('apply-fiscal');a.click('lesson-finish');a.click('undo-button');assert.equal(a.state().gChange,0);
 a.click('next-round');assert.match(a.$('lesson-content').textContent,/Your earlier policies remain in place/);assert.equal(a.state().round,1);a.click('round-continue');a.click('restart-button');assert.equal(a.state().round,0);assert.equal(a.window.YoutopiaTeaching.getPreferences().done.length,0);
});
test('negative tax adjustments preserve the national accounting identity across rounds and funding methods',()=>{
 for(const round of [0,1,2])for(const rebate of [-1000,-500,0,500,1000])for(const mode of ['voluntary','levy']){
  const s=M.initialState();Object.assign(s,{round,rebate,gChange:1000});s.goods={mode,contributions:[20,10,5,0]};const e=M.economy(s);
  near(e.nominalOutput,e.householdSpending+e.fixedOther+e.governmentSpending+e.privateProject);near(e.balance,e.governmentRevenue-e.governmentSpending);assert.ok(e.price>=1&&e.realOutput<=e.capacity);
 }
});
