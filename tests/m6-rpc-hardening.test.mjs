import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("M6 moves privileged RPC implementations to private and exposes invoker wrappers",async()=>{
 const sql=await read("supabase/migrations/0007_rpc_security_hardening.sql");
 assert.match(sql,/register_stock_movement[\s\S]*set schema private/i);
 assert.match(sql,/admin_update_profile[\s\S]*set schema private/i);
 assert.match(sql,/create (?:or replace )?function public\.register_stock_movement[\s\S]*?language sql[\s\S]*?security invoker/i);
 assert.match(sql,/create (?:or replace )?function public\.admin_update_profile[\s\S]*?language sql[\s\S]*?security invoker/i);
 assert.match(sql,/from private\.register_stock_movement/);
 assert.match(sql,/from private\.admin_update_profile/);
 const publicAdminBlock=sql.match(/create function public\.admin_update_profile[\s\S]*?\$\$;/i)?.[0]??"";
 const publicStockBlock=sql.match(/create function public\.register_stock_movement[\s\S]*?\$\$;/i)?.[0]??"";
 assert.match(publicAdminBlock,/security invoker/i);
 assert.doesNotMatch(publicAdminBlock,/security definer/i);
 assert.match(publicStockBlock,/security invoker/i);
 assert.doesNotMatch(publicStockBlock,/security definer/i);
});