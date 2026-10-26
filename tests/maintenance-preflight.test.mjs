import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePreflight} from '../scripts/maintenance-preflight.mjs';
const good=()=>({root:process.cwd(),gitRoot:process.cwd(),owner:{activeRunnerId:'active'},runner:{id:'active',machineFingerprint:'local'},machineFingerprint:'local',publishing:{enabled:true,repository:'https://github.com/example/site.git',branch:'main'},remote:'https://github.com/example/site.git',branch:'main',ahead:0,behind:0,dirty:false,nodeMajor:24,freeBytes:2147483648,missingFiles:[]});
test('Maintenance handoff rejects unregistered and copied runner identities',()=>{
  assert.deepEqual(validatePreflight(good()),[]);
  for(const runner of [null,{id:'previous',machineFingerprint:'local'},{id:'active',machineFingerprint:'different'}])assert.ok(validatePreflight({...good(),runner}).some(x=>x.includes('designated')));
});
test('Maintenance cannot publish from a wrong, disabled or outdated checkout',()=>{
  for(const change of [{remote:'https://github.com/other/site.git'},{branch:'other'},{publishing:{...good().publishing,enabled:false}},{behind:1},{ahead:2}])assert.ok(validatePreflight({...good(),...change},{publishing:true}).length);
  assert.deepEqual(validatePreflight({...good(),ahead:1,dirty:true},{publishing:true}),[]);
  assert.ok(validatePreflight({...good(),ahead:1}).length);
  assert.ok(validatePreflight({...good(),dirty:true}).length);
  assert.deepEqual(validatePreflight({...good(),publishing:{...good().publishing,enabled:false}}),[]);
});
test('Maintenance fails before work with missing art, old Node or insufficient disk',()=>{
  for(const change of [{missingFiles:['reference.png']},{nodeMajor:22},{freeBytes:0},{freeBytes:NaN}])assert.ok(validatePreflight({...good(),...change}).length);
});
