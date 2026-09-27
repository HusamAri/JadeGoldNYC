import test from 'node:test';
import assert from 'node:assert/strict';
import {weightPlan,WEIGHT_PLAN,estimateMetadata,artifactQuotedCost} from '../lib/artifact-2027/weight-plan';
import {catalog,SOURCE} from '../lib/artifact-2027/catalog';
test('five US 4–10 half-size rings keep original US 7 IDs; 80 unique variants total',()=>{
 const rows=weightPlan.products.flatMap(p=>p.variants.map(v=>({id:v.id,sku:v.sku})));assert.equal(rows.length,80);assert.equal(new Set(rows.map(v=>v.id)).size,80);assert.equal(new Set(rows.map(v=>v.sku)).size,80);
 for(const p of weightPlan.products){const d=catalog.find(d=>d.id===p.id)!;
  assert.equal(p.productId,d.productId);
  if(p.id.startsWith('R')){assert.deepEqual(p.variants.map(v=>v.size),Array.from({length:13},(_,i)=>4+i*.5));assert.equal(p.variants.find(v=>v.size===7)!.id,d.variantId);for(let i=1;i<13;i++)assert.ok(p.variants[i].weight_grams>p.variants[i-1].weight_grams);assert.equal(p.costCents,36500);}
  else {assert.equal(p.variants.length,1);assert.equal(p.variants[0].id,d.variantId);assert.equal(p.costCents,p.id.startsWith('N')?38000:p.id.startsWith('B')?37500:35000);}
 }
});
test('quoted total overrides gram pricing only with explicit Artifact provenance; estimates remain unverified',()=>{
 const p=weightPlan.products[0]; const old={sourcePackage:SOURCE,approval:{livePublicationAuthorized:false,priceReadyForEtsy:false},production:{weightVerified:false}};
 const m=estimateMetadata(old,p);assert.equal(artifactQuotedCost(m),36500);assert.equal(m.production.weightVerified,false);assert.equal(m.weightEstimatePlan.status,'estimated_not_measured');assert.equal(m.approval,old.approval);assert.equal(m.purchaseCostSnapshot.automaticSpotAdjustment,false);
 assert.equal(artifactQuotedCost({...m,sourcePackage:'other'}),null);assert.equal(artifactQuotedCost({}),null);assert.equal(artifactQuotedCost({...m,purchaseCostSnapshot:{version:WEIGHT_PLAN,currency:'USD',includesGoldAndLabor:true,amountCents:-1}}),null);
});
