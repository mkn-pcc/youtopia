(function(root){
 'use strict';
 const M=root.YoutopiaModel||(typeof require==='function'?require('./model.js'):null);
 const cash=x=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(x);
 const amount=x=>Math.abs(x)>=1000?'$'+(Math.abs(x)/1000).toFixed(2)+'bn':'$'+Number(Math.abs(x).toFixed(2))+'m';
 const near=(a,b)=>Math.abs(a-b)<0.00001;
 const movement=(a,b)=>near(a,b)?'stays the same':b>a?'rises':'falls';
 function explain(beforeState,afterState,type){
  const b=M.economy(beforeState),a=M.economy(afterState),steps=[];
  if(type==='fiscal'){
   const purchases=a.ordinaryPurchases-b.ordinaryPurchases;
   const adjustment=afterState.rebate-beforeState.rebate;
   if(!near(purchases,0))steps.push('Government purchases '+(purchases>0?'rise':'fall')+' by '+amount(purchases)+'. '+(purchases>0?'The government places more orders for goods and services.':'Businesses receive fewer government orders for goods and services.'));
   if(!near(adjustment,0)){
    steps.push('Each household '+(adjustment>0?'keeps '+cash(adjustment)+' more after tax':'pays '+cash(-adjustment)+' more in tax')+'. Across 400,000 households, government revenue '+(adjustment>0?'falls':'rises')+' by '+amount(adjustment*0.4)+'.');
    steps.push('Households spend 80% of the change in their income in this model. Their spending '+(adjustment>0?'rises':'falls')+' by '+amount(adjustment*0.4*M.MPC)+'. The remaining 20% is retained.');
   }
  }
  if(type==='tax'){
   const i=afterState.raises.findIndex((v,i)=>!near(v,beforeState.raises[i]));
   if(i>=0){
    const c=M.payRise(b.incomes[i],a.incomes[i]-b.incomes[i]);
    steps.push('Household '+ 'ABCD'[i]+' income changes from '+cash(c.oldIncome)+' to '+cash(c.newIncome)+'. Its income tax changes by '+cash(c.extraTax)+', leaving a change of '+cash(c.extraRetained)+' after income tax.');
    steps.push('This profile represents 100,000 households. Their combined change in income after tax is '+amount(c.extraRetained*0.1)+', '+(c.extraRetained>=0?'more':'less')+' than before. They spend 80% of that change.');
    steps.push('Government income-tax revenue '+movement(b.incomeTaxReceipts,a.incomeTaxReceipts)+(near(b.incomeTaxReceipts,a.incomeTaxReceipts)?'.':' by '+amount(a.incomeTaxReceipts-b.incomeTaxReceipts)+'.')+' The tax rates themselves have not changed.');
   }else steps.push('This household already has the selected pay rise. Applying the same salary again does not add a second pay rise or change the country figures.');
  }
  if(type==='goods'){
   const g=a.goods;
   steps.push('The four households contribute '+g.contributions.join(', ')+' tokens: '+g.total+' in total. Each household receives '+Number(g.eachBenefit.toFixed(1))+' shared benefit points.');
   steps.push('Household A keeps '+(20-g.contributions[0])+' tokens and receives '+Number(g.eachBenefit.toFixed(1))+' shared benefit points. Its payoff is '+Number(g.payoffs[0].toFixed(1))+' points. '+(g.total>0&&g.contributions[0]===0?'It benefits even though it contributed nothing.':'The total group payoff is '+Number(g.groupPayoff.toFixed(1))+' points.'));
   steps.push('Project funding is '+amount(a.countryProject)+'. '+(afterState.goods.mode==='levy'?'The compulsory levy is government revenue, and the same amount is spent on the project.':'Contributions pay for the project directly; they are not government tax revenue.')+' Points are the game payoff, not cash paid back to households.');
   const change=a.countryProject-b.countryProject;
   if(!near(change,0))steps.push('Project purchases '+(change>0?'rise':'fall')+' by '+amount(change)+', while ordinary household spending '+(change>0?'falls':'rises')+' by '+amount(change*M.MPC)+'. Total demand therefore '+(change>0?'rises':'falls')+' by '+amount(change*(1-M.MPC))+'.');
  }
  const demandChange=a.demand-b.demand;
  let production;
  if(near(a.realOutput,b.realOutput)&&near(a.price,b.price))production=near(demandChange,0)?'Total demand has not changed, so production and the price index stay the same.':'The change in demand does not alter the displayed production or prices at this scale.';
  else if(a.realOutput>b.realOutput&&!near(a.realOutput,b.realOutput))production='Production rises by '+amount(a.realOutput-b.realOutput)+'. '+(a.price>b.price+0.00001?'Some spare capacity is used up. Demand also exceeds the production limit, so the price index rises.':'Businesses have spare capacity: they can make more goods and services without increasing the model price index.');
  else if(a.realOutput<b.realOutput&&!near(a.realOutput,b.realOutput))production='Production falls by '+amount(b.realOutput-a.realOutput)+'. '+(a.capacity<b.capacity?'The country can produce less because its available resources have fallen.':'Lower demand means businesses sell and produce less; fewer worker equivalents are supported.');
  else production='Production stays at its limit. '+(a.price>b.price?'Extra demand pushes up the price index instead of creating more real output.':'Lower demand eases price pressure, but is still high enough to keep production at capacity.');
  steps.push(production);
  const balanceChange=a.balance-b.balance;
  if(!near(balanceChange,0))steps.push('Budget balance '+(balanceChange>0?'increases':'decreases')+' by '+amount(balanceChange)+'. The balance is revenue minus spending; judge this alongside production, prices and household income.');
  else steps.push('The government budget balance is unchanged. '+(type==='goods'&&afterState.goods.mode==='levy'?'Levy revenue is matched by project spending.':'This decision has not changed the difference between government revenue and spending.'));
  const tradeoff=type==='goods'?'A shared benefit still needs resources and funding. Compare the benefit for everyone with the cost to contributors.':type==='tax'?'A higher salary increases this household’s income after tax, but those wages come from business earnings in the model. A pay rise is not automatically the same increase in national output.':afterState.rebate<beforeState.rebate?'Collecting more tax supports the budget, but leaves households with less money to spend. Whether that helps depends on demand and available capacity.':a.balance<b.balance?'More demand can support production when resources are available, but this decision leaves a larger deficit or a smaller surplus.':'The budget can improve while demand or production falls. A larger surplus alone does not prove that a policy improved people’s lives.';
  return {before:b,after:a,steps,production,tradeoff,demandChange,balanceChange};
 }
 function scenario(type,id,input){
  const s=M.cleanState(input);
  if(type==='fiscal'){
   if(id==='tax'||id==='rebate'){
    const more=id==='rebate',target=Math.max(-1000,Math.min(1000,s.rebate+(more?500:-500))),delta=target-s.rebate;
    if(near(delta,0))return{patch:{gChange:s.gChange,rebate:target},label:'Keep the current household tax setting (control limit reached)',question:'The tax control is already at this limit. What will applying the same setting do?',options:['Nothing changes: it replaces the same setting.','It adds another tax payment every time it is clicked.','It automatically changes government purchases.'],correct:0,reason:'A policy setting is not a new payment each time you press Apply. The current setting, household spending and country figures stay the same.'};
    return{patch:{gChange:s.gChange,rebate:target},label:more?'Leave each household '+cash(delta)+' more after income tax':'Collect '+cash(-delta)+' more income tax per household',question:more?'Government purchases stay the same. What happens when households keep more after tax?':'Government purchases stay the same. What does collecting more income tax do first?',options:more?['Households keep more income and spend part of it.','Every household spends all of the extra income immediately.','The rebate changes every Australian tax-band rate.']:['Households have less income to spend.','Every dollar of tax automatically becomes extra government spending.','The country can now produce an unlimited amount.'],correct:0,reason:more?'Compared with the current setting, each household has '+cash(delta)+' more available. Youtopia assumes they spend 80% and hold back 20%. Its Australian tax-band rates stay the same.':'Compared with the current setting, each household pays '+cash(-delta)+' more. With government purchases unchanged, household spending and total demand fall.'};
   }
   const target=s.gChange<=5000?s.gChange+1000:s.gChange-1000;
   const up=target>s.gChange;
   return{patch:{gChange:target,rebate:s.rebate},label:(up?'Buy an extra':'Buy')+' $1bn '+(up?'of goods and services':'less in goods and services'),question:up?'Government buys $1bn more. Which statement allows for the country’s production limit?':'Government buys $1bn less. What happens to demand?',options:up?['Demand rises; extra production depends on spare capacity.','Real production must always rise by $1bn.','The government automatically collects $1bn more tax.']:['Demand falls because businesses receive fewer orders.','Demand always rises after a spending cut.','Tax rates automatically rise.'],correct:0,reason:up?'Government orders add to demand. Businesses can produce more while resources are available. Once capacity is reached, extra demand raises the model price level.':'Fewer government orders reduce demand. The effect on production and prices depends on where demand sits relative to capacity.'};
  }
  if(type==='tax'){
   const target=Math.min(20000,s.raises[1]+1000),extra=target-s.raises[1],oldIncome=M.BASE_INCOMES[1]+s.raises[1],newIncome=M.BASE_INCOMES[1]+target;
   if(near(extra,0))return{patch:{household:1,raise:target},label:'Keep Household B’s current salary (control limit reached)',question:'The salary is already at this control’s limit. What does applying it again do?',options:['The salary and country figures stay the same.','It adds another $1,000 without changing the setting.','It taxes all earlier income at a new rate.'],correct:0,reason:'The same salary is the same income, not another pay rise. Choose a different setting in Explore to compare another income.'};
   const p=M.payRise(oldIncome,extra);
   return{patch:{household:1,raise:target},label:'Increase Household B’s annual income from '+cash(oldIncome)+' to '+cash(newIncome),question:'Income rises from '+cash(oldIncome)+' to '+cash(newIncome)+'. How much of the extra '+cash(extra)+' remains after income tax?',options:[cash(p.extraRetained)+' remains; '+cash(p.extraTax)+' is additional income tax.','$0 remains because all income moves into a higher band.',cash(extra*0.85)+' remains because all of the rise is taxed at 15%.'],correct:0,reason:'This additional income is in the 30% band. '+cash(extra)+' × 30% = '+cash(p.extraTax)+' tax. The household keeps '+cash(p.extraRetained)+'. Earlier income stays in its existing bands. This example excludes Medicare levy and offsets.'};
  }
  const free=id==='free',levy=id==='levy',contributions=free?[0,20,20,20]:[20,20,20,20];
  return{patch:{mode:levy?'levy':'voluntary',contributions},label:free?'A contributes nothing; B, C and D each contribute 20':levy?'Collect a compulsory 20-token levy from each household':'All four households voluntarily contribute 20 tokens',question:free?'Can Household A still receive the shared benefit?':levy?'Does compulsory funding make the project free to provide?':'If all four contribute 20 tokens, what shared benefit does each receive?',options:free?['Yes. Non-contributors can still benefit.','No. The shared warning service excludes A.','Only if A gets its tokens back.']:levy?['No. Households pay the levy and the government buys the project.','Yes. Government-provided goods use no scarce resources.','Yes. The payoff points pay for it.']:['32 shared benefit points: 80 × 0.4.','80 points each: all contributions belong to every household.','20 points each: contributions have no shared benefit.'],correct:0,reason:free?'The warning service is difficult to withhold from a household that has not paid. This makes free riding possible and can make voluntary funding difficult.':levy?'Tax funding changes who collects and spends the money. It does not remove the resources needed or the cost to households.':'The 80 contributed tokens create 0.4 × 80 = 32 benefit points per household. With no tokens kept, each household’s total payoff is 32 points.'};
 }
 const api={explain,scenario,cash,amount};root.YoutopiaTeachingModel=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
