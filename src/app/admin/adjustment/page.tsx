import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdjustmentForm } from "./adjustment-form";

export const dynamic = "force-dynamic";
function quantity(rows:{quantity:unknown}[]|null){return Number(rows?.[0]?.quantity??0);}
const errors:Record<string,string>={validation:"Informe produto, contagem e motivo.",permission:"Somente ADMIN pode ajustar estoque.",product:"Produto indisponível.",database:"Não foi possível registrar o ajuste."};

export default async function AdjustmentPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}){
 const params=await searchParams; const supabase=await createClient();
 const {data:claimsData,error:claimsError}=await supabase.auth.getClaims(); const userId=claimsData?.claims?.sub;
 if(claimsError||!userId) redirect("/login");
 const {data:profile,error:profileError}=await supabase.from("profiles").select("role, active").eq("id",userId).single();
 if(profileError||!profile?.active||profile.role!=="ADMIN") redirect("/");
 const {data:products,error}=await supabase.from("products").select("id, internal_code, name, unit, inventory(quantity)").eq("active",true).order("name");
 if(error) throw new Error("Não foi possível carregar produtos para ajuste.");
 const options=(products??[]).map(p=>({id:p.id,internalCode:p.internal_code,name:p.name,unit:p.unit,currentQuantity:quantity(p.inventory)}));
 return <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
  <header><Link className="text-sm font-semibold underline" href="/">← Dashboard</Link><p className="mt-6 text-sm font-semibold uppercase tracking-wide">M6 · Administração</p><h1 className="mt-1 text-3xl font-bold">Ajuste de estoque</h1><p className="mt-2 text-sm text-neutral-600">Informe a contagem física real. O sistema deriva a diferença e preserva o histórico.</p></header>
  {params.error?<p className="mt-5 rounded-md border p-3" role="alert">{errors[params.error]??errors.database}</p>:null}
  {params.success==="registered"?<p className="mt-5 rounded-md border p-3" role="status">Ajuste registrado.</p>:null}
  {!options.length?<p className="mt-6 rounded-md border p-4">Nenhum produto ativo disponível.</p>:<AdjustmentForm products={options} initialOperationId={randomUUID()}/>} 
 </main>;
}