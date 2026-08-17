import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("M6 moves privileged RPC implementations to private and exposes invoker wrappers",async()=>{
 const sql=await read("supabase/migrations/0007_rpc_security_hardening.sql");
 assert.match(sql,/register_stock_movement[\s\S]*set schema private/i);
 assert.match(sql,/admin_update_profile[\s\S]*set schema private/i);
 assert.match(sql,/create (?:or replace )?function public\.register_stock_movement[\s\S]*security invoker/i);
 assert.match(sql,/create (?:or replace )?function public\.admin_update_profile[\s\S]*security invoker/i);
 assert.match(sql,/private\.register_stock_movement/);
 assert.match(sql,/private\.admin_update_profile/);
 assert.doesNotMatch(sql,/public\.admin_update_profile[\s\S]*security definer/i);
});