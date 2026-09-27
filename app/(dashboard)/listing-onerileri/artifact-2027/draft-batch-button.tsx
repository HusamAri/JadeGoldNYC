"use client";
import {useState,useTransition} from 'react';
import {Button} from '@/components/ui/button';
import {pricePlan} from '@/lib/artifact-2027/price-plan';
import {sendArtifactDraft} from './draft-actions';
export function DraftBatchButton(){
 const[pending,start]=useTransition();const[lines,setLines]=useState<string[]>([]);const[reports,setReports]=useState<unknown[]>([]);
 return <div className="space-y-3 rounded-xl border p-4"><p>20 model Etsy’ye yalnız taslak olarak aktarılır. Her seçenekte Etsy’nin zorunlu tuttuğu 1 adet taslak değeri kullanılır; paneldeki fiziksel stok 0 kalır. Her kayıt fiyat, SKU, beden ve tek görsel kontrolünden geçer.</p><Button disabled={pending} onClick={()=>start(async()=>{setLines([]);setReports([]);for(const p of pricePlan){setLines(prev=>[...prev,`${p.id} kontrol ediliyor…`]);const r=await sendArtifactDraft(p.id);setLines(prev=>[...prev,r.message]);if(!r.ok)break;setReports(prev=>[...prev,r.report]);}})}>{pending?'Etsy taslakları hazırlanıyor…':'20 modeli Etsy’ye taslak gönder ve doğrula'}</Button><div role="status">{lines.map((l,i)=><p key={i}>{l}</p>)}</div><details><summary>Etsy doğrulama raporu</summary><pre>{JSON.stringify(reports,null,2)}</pre></details></div>;
}
