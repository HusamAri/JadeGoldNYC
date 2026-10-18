#!/usr/bin/env python3
"""User-revised delivery: four new images plus one existing catalog hero per listing.

Prepares reviewable SQL only; database application is a separate authorized step.
Already-generated surplus files remain preserved and are not counted in this plan.
"""
import argparse
import concurrent.futures
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NATIVE = Path('/workspace/jade-xmas26-native')
SOURCE = ROOT / 'docs/jade/xmas26'


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


legacy = module('legacy_import', 'jade-xmas26-import.py')
approval = module('asset_approval', 'jade-xmas26-approve.py')


def read(path):
    return json.loads(path.read_text())


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def state():
    plan_path = NATIVE / 'revised/plan.json'
    plan = read(plan_path if plan_path.exists() else SOURCE / 'import/revised-plan.json')
    assert plan['new_images_per_listing'] == 4 and plan['hero_images_per_listing'] == 1
    assert set(plan['products']) == set(legacy.IDS)
    assert all(len(slots) == 4 and len(set(slots)) == 4 for slots in plan['products'].values())
    generated = { (r['product_code'], r['position']): r
                  for f in (NATIVE / 'manifests').glob('*.json') for r in read(f)['images'] }
    approved, _ = approval.assemble(NATIVE, Path('/workspace/jade-xmas26-output/verified-assets.json'), NATIVE / 'qa/reviews.json')
    passed = {(r['product_code'], r['position']): r for r in approved['images']}
    ready = [code for code in legacy.IDS if all((code, p) in passed for p in plan['products'][code])]
    return plan, generated, passed, ready


def jobs(limit, products):
    plan, generated, _, _ = state()
    original_jobs = {(j['product_code'], j['position']): j for j in read(NATIVE / 'native-jobs.json')['jobs']}
    result = []
    for code in legacy.IDS:
        if products and code not in products:
            continue
        for position in plan['products'][code]:
            if (code, position) in generated:
                continue
            j = dict(original_jobs[(code, position)])
            j['prompt'] = ('SHOT PRIORITY: ' + j['purpose'] + '\nA single distinct photograph. '
                           'Preserve exact visible product geometry and realistic small jewelry scale. '
                           'For earrings worn on an ear show only one earring, at the actual small scale; '
                           'product-only earring photographs show a complete pair.\n' + j['prompt'])
            prompt_file = NATIVE / f'revised/prompts/{code}/{position:02}.txt'
            prompt_file.parent.mkdir(parents=True, exist_ok=True)
            prompt_file.write_text(j['prompt'])
            j['prompt_file'] = str(prompt_file)
            result.append(j)
            if len(result) == limit:
                return result
    return result


def make_sql(payload):
    raw = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    delimiter = '$jade_four_' + hashlib.sha256(raw.encode()).hexdigest()[:16] + '$'
    return f"""-- User revision:4new generated images +1existing catalog hero per selected listing.
-- Surplus generated files remain preserved; only this batch's controlled gallery rows are replaced.
begin;
set local lock_timeout='10s';
select pg_advisory_xact_lock(hashtext('{legacy.BATCH}'));
create temporary table jade_four_payload(data jsonb) on commit drop;
insert into jade_four_payload values({delimiter}{raw}{delimiter}::jsonb);
do $jade_four$
declare b jsonb; p jsonb; i jsonb; actual integer;
begin
 select data into b from jade_four_payload;
 for p in select value from jsonb_array_elements(b->'products') loop
  if not exists(select 1 from public.products x where x.id=(p->>'id')::uuid
    and x.org_id='{legacy.ORG_ID}' and x.listing_metadata->>'import_batch'='{legacy.BATCH}')
  then raise exception 'Missing or unrelated product %',p->>'code'; end if;
  if exists(select 1 from public.listing_images x where x.product_id=(p->>'id')::uuid
    and (x.org_id<>'{legacy.ORG_ID}' or not (p->'allowed_image_ids' ? x.id::text)))
  then raise exception 'Owner-added gallery rows require preservation for %',p->>'code'; end if;
  for i in select value from jsonb_array_elements(p->'images') loop
   if exists(select 1 from public.listing_images x where x.id=(i->>'id')::uuid
     and (x.product_id<>(p->>'id')::uuid or x.org_id<>'{legacy.ORG_ID}' or x.url<>i->>'url'))
   then raise exception 'Gallery ID or URL collision for %',p->>'code'; end if;
  end loop;
 end loop;
 for p in select value from jsonb_array_elements(b->'products') loop
  update public.products x set listing_metadata=x.listing_metadata || jsonb_build_object(
    'canceled_15_image_plan',jsonb_build_object('metadata',x.listing_metadata->'images',
      'gallery',(select coalesce(jsonb_agg(to_jsonb(z)),'[]'::jsonb) from public.listing_images z where z.product_id=x.id)))
  where x.id=(p->>'id')::uuid and x.org_id='{legacy.ORG_ID}'
    and not (x.listing_metadata ? 'canceled_15_image_plan') and x.num_images>5;
  delete from public.listing_images x where x.product_id=(p->>'id')::uuid
    and x.org_id='{legacy.ORG_ID}' and p->'allowed_image_ids' ? x.id::text
    and not exists(select 1 from jsonb_array_elements(p->'images') v
      where v->>'id'=x.id::text and v->>'url'=x.url and (v->>'position')::integer=x.position);
  insert into public.listing_images(id,org_id,product_id,url,storage_path,source,alt,position)
   select (v->>'id')::uuid,'{legacy.ORG_ID}'::uuid,(p->>'id')::uuid,v->>'url',
     v->>'storage_path',v->>'source',v->>'alt',(v->>'position')::integer
   from jsonb_array_elements(p->'images') v on conflict(id) do nothing;
  update public.products x set image_url=p->>'hero_url',num_images=5,
    listing_metadata=x.listing_metadata || jsonb_build_object(
      'generation_status','complete','expected_image_count',5,'verified_image_count',5,
      'expected_generated_image_count',4,'verified_generated_image_count',4,
      'existing_hero_count',1,'cover_gallery_position',0,'delivery_revision','four-new-plus-existing-hero',
      'images',p->'image_metadata','canceled_remaining_15_image_plan',true)
  where x.id=(p->>'id')::uuid and x.org_id='{legacy.ORG_ID}';
  select count(*) into actual from public.listing_images x where x.product_id=(p->>'id')::uuid;
  if actual<>5 then raise exception 'Expected5images for %, found%',p->>'code',actual; end if;
  select count(*) into actual from public.product_variants x where x.product_id=(p->>'id')::uuid;
  if actual<>3 then raise exception 'Expected3karat variants for %, found%',p->>'code',actual; end if;
 end loop;
end $jade_four$;
commit;
"""


def prepare(products, output):
    plan, _, passed, ready = state()
    selected = [c for c in legacy.IDS if not products or c in products]
    if not set(selected) <= set(ready):
        raise ValueError('Four approved and uploaded current images required for: ' + ','.join(set(selected)-set(ready)))
    copy_sha = hashlib.sha256((SOURCE / 'listing-copy-2026-10-18.json').read_bytes()).hexdigest()
    assets = [passed[(c, p)] for c in selected for p in plan['products'][c]]
    output.mkdir(parents=True, exist_ok=True)
    manifest = {'batch_id':legacy.BATCH,'copy_sha256':copy_sha,'selected_products':selected,'images':assets}
    write(output / 'approved-assets.json', manifest)
    # Same original, resize, QA and actual public-byte checks as the original import.
    legacy.verify_assets(output/'approved-assets.json', NATIVE, copy_sha, selected, plan['products'])
    heroes = []
    for c in selected:
        hero = SOURCE / f'images/heroes/{c}.jpg'
        from PIL import Image
        with Image.open(hero) as image:
            width,height=image.size
            # Existing catalog heroes retain their original native resolution
            # (2000x1611 or2400x1792); the4new files are exactly2048x1536.
            assert width>=2000 and height>=1500
            image.verify()
        heroes.append({'product_code':c,'position':0,'public_url':f'https://raw.githubusercontent.com/HusamAri/JadeGoldNYC/{legacy.SOURCE_COMMIT}/docs/jade/xmas26/images/heroes/{c}.jpg',
                       'sha256':hashlib.sha256(hero.read_bytes()).hexdigest(),'width':width,'height':height})
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(legacy.verify_remote, heroes))
    payload={'batch_id':legacy.BATCH,'revision':plan['revision'],'products':[]}
    for c,hero in zip(selected,heroes):
        pid=legacy.stable_id('product',c);hid=legacy.stable_id('hero',c)
        images=[{'id':hid,'url':hero['public_url'],'source':'url','storage_path':None,'alt':f'{c} original catalog hero reference','position':0}]
        metadata=[{**hero,'kind':'existing_catalog_hero','counted_as_new_generated_image':False}]
        for position,source_position in enumerate(plan['products'][c],1):
            a=passed[(c,source_position)]
            images.append({'id':legacy.stable_id('image',f'{c}/{source_position}'),'url':a['public_url'],'storage_path':a['storage_path'],'source':'upload','alt':a['alt'],'position':position})
            metadata.append({k:a.get(k) for k in ('sha256','original_sha256','native_width','native_height','width','height','provider','model','generation_id','qa_status','qa_note','qa_reviewer','qa_reviewed_at_utc','upscaled','resize_method','resize_authorization')})
            metadata[-1].update(position=position,source_position=source_position,kind='new_generated_image')
        payload['products'].append({'id':pid,'code':c,'hero_url':hero['public_url'],'images':images,'image_metadata':metadata,
          'allowed_image_ids':[legacy.stable_id('image',f'{c}/{p}') for p in range(1,16)]+[hid]})
    write(output/'verified-import.json',payload)
    (output/'import.sql').write_text(make_sql(payload))
    print(json.dumps({'prepared_products':selected,'new_generated':len(assets),'existing_heroes':len(heroes),'gallery_images':5*len(selected),'output':str(output)}))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['status','jobs','prepare'])
    parser.add_argument('--product',choices=legacy.IDS,action='append')
    parser.add_argument('--limit',type=int,default=4)
    parser.add_argument('--output-dir',type=Path)
    args=parser.parse_args()
    if args.command=='jobs': print(json.dumps(jobs(args.limit,args.product),ensure_ascii=False))
    elif args.command=='prepare':
        if not args.output_dir:parser.error('prepare requires --output-dir')
        prepare(args.product,args.output_dir)
    else:
        plan,generated,passed,ready=state()
        selected={(c,p) for c,slots in plan['products'].items() for p in slots}
        print(json.dumps({'revision':plan['revision'],'required_new_images':160,'required_existing_heroes':40,
          'generated_in_revised_scope':len(selected & set(generated)),'approved_in_revised_scope':len(selected & set(passed)),
          'ready_products':ready,'ready_gallery_images':len(ready)*5}))


if __name__=='__main__':main()
