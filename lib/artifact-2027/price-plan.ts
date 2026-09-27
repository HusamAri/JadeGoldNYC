import { weightPlan } from './weight-plan';
export const PRICE_PLAN = 'artifact-2027-approved-retail-v1';
export const pricePlan = weightPlan.products.map(p=>({...p,priceCents:p.costCents*2}));
