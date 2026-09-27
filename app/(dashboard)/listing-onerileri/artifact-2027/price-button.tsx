"use client";
import {useState,useTransition} from 'react';
import {Button} from '@/components/ui/button';
import {applyArtifactPrices} from './price-actions';
export function PriceButton(){const[pending,start]=useTransition();const[message,setMessage]=useState('');return <div><Button disabled={pending} onClick={()=>start(async()=>{const r=await applyArtifactPrices();setMessage(r.message);})}>{pending?'Fiyatlar kaydediliyor…':'Onaylı satış fiyatlarını 80 varyanta uygula'}</Button><p role="status">{message}</p></div>;}
