import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("M6 documents one-time first ADMIN bootstrap without application secrets",async()=>{
 const doc=await read("docs/operations/FIRST-ADMIN-BOOTSTRAP.md");
 assert.match(doc,/primeiro ADMIN/i);
 assert.match(doc,/\/register/);
 assert.match(doc,/role\s*=\s*'ADMIN'/i);
 assert.match(doc,/active\s*=\s*true/i);
 assert.match(doc,/propriet[aá]rio|owner/i);
 assert.match(doc,/uma vez|one-time|únic/i);
 assert.match(doc,/\/admin\/users/);
 assert.doesNotMatch(doc,/service[_ -]?role\s*key|sk_[A-Za-z0-9]/i);
});