const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {parseHTML}=require('linkedom');
const M=require('../model');
function app(saved){
 const {window}=parseHTML(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'));
 const storage=new Map(saved?[["youtopia-economic-control-room-v1",saved]]:[]);
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 window.YoutopiaModel=M;window.confirm=()=>true;
 const context={window,document:window.document,localStorage,Intl,console,setTimeout:()=>0,clearTimeout:()=>{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),context);
 const $=id=>window.document.getElementById(id);
 const click=id=>{assert.ok($(id),'Missing '+id);$(id).dispatchEvent(new window.Event('click',{bubbles:true}));};
 const input=(id,value,event='input')=>{$(id).value=String(value);$(id).dispatchEvent(new window.Event(event,{bubbles:true}));};
 return {window,$,click,input,storage,state:()=>window.YoutopiaApp.getState(),economy:()=>window.YoutopiaApp.getEconomy(),open:type=>window.YoutopiaApp.openActivity(type)};
}
test('hub, fiscal preview, apply and undo operate through actual DOM events',()=>{
 const a=app();assert.equal(a.$('output-value').textContent,'$40.50bn');a.open('fiscal');a.input('fiscal-spending',1000);assert.match(a.$('fiscal-preview').textContent,/41.50/);a.click('apply-fiscal');assert.equal(a.state().gChange,1000);assert.equal(a.$('balance-value').textContent,'Deficit');assert.equal(a.$('output-value').textContent,'$41.50bn');a.click('undo-button');assert.equal(a.state().gChange,0);
});
test('tax challenge reveals exact bands, applies cohort choice and persists on reload',()=>{
 const a=app();a.open('tax');assert.equal(a.$('tax-household').value,'1');a.input('tax-prediction',300);a.click('reveal-tax');assert.equal(a.$('tax-extra').textContent,'$300');assert.equal(a.$('tax-kept').textContent,'$700');assert.match(a.$('tax-feedback').textContent,/Correct/);a.click('apply-tax');assert.equal(a.state().raises[1],1000);assert.equal(a.economy().incomeTaxReceipts,3213);
 const b=app(a.storage.get('youtopia-economic-control-room-v1'));assert.equal(b.state().raises[1],1000);assert.equal(b.$('income-value').textContent,'$48,468');
});
test('solo public-goods results connect to country benefits and project funding',()=>{
 const a=app();a.open('goods');assert.match(a.$('goods-outcomes').textContent,/104/);a.click('apply-goods');assert.deepEqual(a.state().goods.contributions,[10,20,10,0]);assert.equal(a.$('benefit-value').textContent,'64 points');assert.equal(a.economy().countryProject,400);
});
test('pass-and-play hides prior contributions until all four players finish',()=>{
 const a=app();a.open('goods');a.click('goods-pass');
 for(const amount of [0,20,20,20]){a.click('pass-ready');a.input('pass-amount',amount);a.click('pass-lock');}
 assert.match(a.$('goods-outcomes').textContent,/116/);assert.match(a.$('goods-outcomes').textContent,/44/);a.click('apply-goods');assert.deepEqual(a.state().goods.contributions,[0,20,20,20]);assert.equal(a.economy().countryProject,600);
});
test('round progression retains policies, shows supply shock and opens final review',()=>{
 const a=app();a.open('fiscal');a.input('fiscal-spending',1000);a.click('apply-fiscal');a.click('next-round');assert.equal(a.state().round,1);assert.equal(a.state().gChange,1000);assert.ok(a.economy().price>1);a.click('next-round');assert.equal(a.state().round,2);assert.equal(a.economy().capacity,38475);a.click('next-round');assert.match(a.$('activity-title').textContent,/review/);assert.match(a.$('activity-content').textContent,/Supply disruption/);a.click('review-return');a.click('restart-button');assert.equal(a.state().round,0);assert.equal(a.state().history.length,0);
});
test('map and live metric nodes remain valid after each activity',()=>{
 const a=app();for(const type of ['fiscal','tax','goods']){a.open(type);assert.ok(a.$('activity-content').querySelector('.activity-art img'));a.click('close-activity');}assert.equal(a.$('country-map').querySelectorAll('[data-map-activity]').length,3);assert.match(a.$('country-map').innerHTML,/COASTAL PROJECT/);assert.equal(a.$('capacity-track').getAttribute('aria-valuenow'),'94.7');
});
