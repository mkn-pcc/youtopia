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
 for(const name of ['visual-learning.js','app.js','teaching.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context);
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
test('guided marginal-tax lesson keeps the $300/$700 example and calculates later rises from current income',()=>{
 const a=boot();a.open('tax');assert.match(a.$('lesson-content').textContent,/earlier income/);a.click('lesson-predict');a.select();a.click('lesson-run');
 assert.equal(a.state().raises[1],1000);near(a.economy().balance,30);near(a.economy().realOutput,40556);assert.match(a.$('lesson-content').textContent,/tax rates themselves have not changed/);a.click('lesson-finish');
 a.open('tax');a.click('lesson-predict');assert.match(a.$('lesson-content').textContent,/\$46,000 to \$47,000/);a.select();a.click('lesson-run');near(a.economy().balance,60);assert.equal(a.state().raises[1],2000);
 const fixed=a.state(),again=M.applyDecision(fixed,'tax',{household:1,raise:2000},'same salary');assert.match(T.explain(fixed,again,'tax').steps[0],/does not add a second pay rise/);
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
test('interactive everyday comparisons do not alter the country, and teach distinct demand and supply changes',()=>{
 const a=boot();a.open('fiscal');const before=JSON.stringify(a.state());
 const picture=()=>a.window.document.querySelector('.connection-stage');
 assert.match(picture().textContent,/6 made; 0 orders unfilled; 4 spare places/);
 a.click(a.window.document.querySelector('[data-orders="14"]'));assert.match(picture().textContent,/10 made; 4 orders unfilled/);
 a.click(a.window.document.querySelector('[data-capacity="7"]'));assert.match(picture().textContent,/7 made; 7 orders unfilled/);
 a.click(a.window.document.querySelector('[data-demo="wallet"]'));assert.match(picture().textContent,/spend \$8 more/);
 a.click(a.window.document.querySelector('[data-wallet="less"]'));assert.match(picture().textContent,/spends \$8 less/);
 a.click(a.window.document.querySelector('[data-visual-next]'));assert.match(picture().textContent,/\$40.50bn to \$41.50bn/);
 a.click(a.window.document.querySelector('[data-visual-next]'));assert.match(picture().textContent,/imports, changing interest rates, saving and delays/);
 assert.equal(JSON.stringify(a.state()),before);
});
test('visual tax and public-goods examples reveal mechanisms before any country decision',()=>{
 const a=boot();a.open('tax');a.click(a.window.document.querySelector('[data-show-tax]'));
 assert.equal(a.window.document.querySelectorAll('.money-spent').length,3);assert.equal(a.window.document.querySelectorAll('.money-kept').length,7);assert.match(a.$('lesson-content').textContent,/Its income tax stays \$4,020/);assert.equal(a.state().raises[1],0);
 a.click(a.window.document.querySelector('[data-visual-step="2"]'));assert.match(a.$('lesson-content').textContent,/Under-18 tax rules may differ/);a.click('lesson-close');
 a.open('goods');a.click(a.window.document.querySelector('[data-warning="no"]'));assert.match(a.$('lesson-content').textContent,/shared service receives no funding/);assert.equal(a.economy().countryProject,0);
 a.click(a.window.document.querySelector('[data-visual-step="2"]'));assert.match(a.$('lesson-content').textContent,/Bureau of Meteorology/);assert.match(a.$('lesson-content').textContent,/not the Bureau’s funding system/);
});
test('later guided tax decisions and control limits describe their actual changes',()=>{
 let s=M.initialState();s.rebate=-800;
 let c=T.scenario('fiscal','tax',s),after=M.applyDecision(s,'fiscal',c.patch,c.label);assert.equal(after.rebate,-1000);assert.match(c.label,/\$200 more/);near(T.explain(s,after,'fiscal').demandChange,-64);
 c=T.scenario('fiscal','tax',after);assert.match(c.reason,/stay the same/);assert.equal(c.patch.rebate,-1000);
 s.rebate=1000;c=T.scenario('fiscal','rebate',s);assert.match(c.options[0],/Nothing changes/);
 s.raises[1]=10000;c=T.scenario('tax','rise',s);assert.match(c.question,/\$55,000 to \$56,000/);assert.equal(c.patch.raise,11000);
 s.raises[1]=20000;c=T.scenario('tax','rise',s);assert.match(c.options[0],/stay the same/);assert.equal(c.patch.raise,20000);
});
test('Australia reference is accessible without replacing an unfinished lesson',()=>{
 const a=boot();a.open('fiscal');a.click('lesson-predict');const before=JSON.stringify(a.state());
 a.click('australia-reference');assert.match(a.$('help-content').textContent,/teaching assumptions/);assert.match(a.$('help-content').textContent,/GST, company taxes, welfare payments and debt interest/);
 a.click('help-close');assert.ok(a.$('lesson-run').disabled);assert.equal(JSON.stringify(a.state()),before);
});
test('large accumulated surpluses display net financial assets rather than negative debt',()=>{
 const s=M.initialState();s.gChange=-2500;s.rebate=-1000;s.raises=[20000,20000,20000,20000];const saved=M.nextRound(M.nextRound(s));assert.ok(M.economy(saved).projectedDebt<0);
 const a=boot([['youtopia-economic-control-room-v1',JSON.stringify({state:saved})]]);assert.match(a.$('debt-label').textContent,/Net financial assets/);assert.doesNotMatch(a.$('debt-value').textContent,/-/);
});
