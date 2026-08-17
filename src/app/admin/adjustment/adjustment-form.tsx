"use client";
import { useMemo, useState } from "react";
import { registerAdjustmentAction } from "./actions";

type P={id:string;internalCode:string;name:string;unit:string;currentQuantity:number};
export function AdjustmentForm({products,initialOperationId}:{products:P[];initialOperationId:string}){
 const [operationId,setOperationId]=useState(initialOperationId);
 const [productId,setProductId]=useState(products[0]?.id??"");
 const [text,setText]=useState("");
 const [reason,setReason]=useState("");
 const product=useMemo(()=>products.find(p=>p.id===productId)??products[0],[productId,products]);
 const quantity=Number(text); const valid=Number.isFinite(quantity)&&quantity>=0&&reason.trim().length>0;
 const current=product?.currentQuantity??0; const difference=valid?quantity-current:0;
 function submit(e:React.FormEvent<HTMLFormElement>){
  if(!valid||!product||!operationId){e.preventDefault();return;}
  if(!window.confirm(`Confirmar ajuste? Saldo atual ${current}; contagem ${quantity}; diferença ${difference}.`)) e.preventDefault();
 }
 return <form action={registerAdjustmentAction} className="mt-6 space-y-5" onSubmit={submit}>
  <input type="hidden" name="operation_id" value={operationId}/>
  <label className="block text-sm font-semibold">Produto<select className="mt-1 w-full rounded-md border px-3 py-3 font-normal" name="product_id" value={productId} onChange={e=>{setProductId(e.target.value);setOperationId(crypto.randomUUID());}}>{products.map(p=><option key={p.id} value={p.id}>{p.internalCode} · {p.name}</option>)}</select></label>
  <label className="block text-sm font-semibold">Contagem física<input className="mt-1 w-full rounded-md border px-3 py-3" type="number" step="any" min="0" name="quantity" value={text} onChange={e=>setText(e.target.value)} required/></label>
  <label className="block text-sm font-semibold">Motivo<textarea className="mt-1 min-h-24 w-full rounded-md border px-3 py-3" name="reason" value={reason} onChange={e=>setReason(e.target.value)} required/></label>
  <div className="rounded-lg border p-4" aria-live="polite"><p>Saldo atual: <strong>{current} {product?.unit}</strong></p><p>Diferença: <strong>{valid?difference:"—"} {product?.unit}</strong></p></div>
  <button className="w-full rounded-md bg-black px-4 py-4 font-semibold text-white disabled:opacity-50" disabled={!valid||!product||!operationId}>Confirmar ajuste</button>
 </form>;
}