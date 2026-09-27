'use client';
import {useState,useTransition} from 'react';
import {Button} from '@/components/ui/button';
import {applyArtifactWeightPlan} from './weight-actions';
export function WeightButton(){const [pending,start]=useTransition();const [message,setMessage]=useState('');return <div><Button disabled={pending} onClick={()=>start(async()=>{setMessage('');const r=await applyArtifactWeightPlan();setMessage(r.message);})}>{pending?'Güncelleniyor…':'Ağırlık, maliyet ve US bedenlerini uygula'}</Button><p role="status">{message}</p></div>;}
