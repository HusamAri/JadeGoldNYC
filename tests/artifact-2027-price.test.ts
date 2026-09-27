import test from 'node:test';
import assert from 'node:assert/strict';
import {pricePlan} from '../lib/artifact-2027/price-plan';
import {catalog} from '../lib/artifact-2027/catalog';
import {resolveListingProtocol} from '../lib/etsy/listing-protocol';
test('approved 20 retail prices cover all 80 variants and correct non-personalized categories',()=>{assert.equal(pricePlan.length,20);assert.equal(pricePlan.reduce((n,p)=>n+p.variants.length,0),80);for(const p of pricePlan){assert.equal(p.priceCents,({R:73000,N:76000,B:75000,E:70000})[p.id[0] as 'R']);const d=catalog.find(d=>d.id===p.id)!;const spec=resolveListingProtocol({product_type:d.productType,listing_metadata:{listingProtocol:d.listingProtocol,offersPersonalization:false}});assert.ok(spec);assert.equal(spec.personalization,null);if(p.id.startsWith('E'))assert.equal(spec.id,'stud_earrings');}});
