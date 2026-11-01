import {ROSTER,FILLERS} from './data.mjs';
export const STORAGE_KEY = 'aiWish.v1';
const freshPool = () => ({five:0,four:0,guaranteed:false,draws:0});
export const initialState = () => ({version:1,pool:'character',featured:'chatgpt',muted:false,pools:{character:freshPool(),weapon:freshPool()},history:[],owned:{},nextSeq:1,pending:null});
export function restoreState(value){
  if(!value || value.version!==1 || !['character','weapon'].includes(value.pool) || !ROSTER.some(a=>a.id===value.featured)) throw new Error('存档格式无法识别');
  if(!Array.isArray(value.history) || !value.owned || !Number.isSafeInteger(value.nextSeq) || value.nextSeq<1) throw new Error('存档数据不完整');
  for(const key of ['character','weapon']){
    const p=value.pools?.[key];
    if(!p || !Number.isInteger(p.five) || p.five<0 || p.five>19 || !Number.isInteger(p.four) || p.four<0 || p.four>9 || typeof p.guaranteed!=='boolean') throw new Error('保底数据不完整');
  }
  if(value.pending && (!Array.isArray(value.pending.entries) || !value.pending.entries.length || !Number.isInteger(value.pending.index) || value.pending.index<0 || value.pending.index>=value.pending.entries.length)) throw new Error('未完成祈愿数据不完整');
  return value;
}
export function drawBatch(state,pool,featured,count,rng=Math.random,at=Date.now()){
  if(state.pending) throw new Error('请先查看本次祈愿结果');
  if(!['character','weapon'].includes(pool) || !ROSTER.some(a=>a.id===featured) || ![1,10].includes(count)) throw new Error('祈愿参数无效');
  const next=structuredClone(state), p=next.pools[pool], entries=[];
  for(let i=0;i<count;i++){
    p.five++;p.four++;p.draws++;
    const roll=rng();
    let rarity=p.five>=20 || roll<.05?5:p.four>=10 || roll<.20?4:3;
    let itemId;
    if(rarity===5){
      const hit=p.guaranteed || rng()<.5;
      const candidates=ROSTER.filter(a=>a.id!==featured);
      const ai=hit?featured:candidates[Math.min(6,Math.floor(rng()*7))].id;
      itemId=`${ai}-${pool}`;p.guaranteed=!hit;p.five=0;p.four=0;
    }else{
      const candidates=FILLERS.filter(a=>a.rarity===rarity);
      itemId=candidates[Math.min(candidates.length-1,Math.floor(rng()*candidates.length))].id;
      if(rarity===4)p.four=0;
    }
    const entry={seq:next.nextSeq++,itemId,pool,at};
    next.history.push(entry);next.owned[itemId]=(next.owned[itemId]||0)+1;entries.push(entry);
  }
  next.pending={entries,index:0};
  return {state:next,entries};
}
export function progressPending(state,index){
  const next=structuredClone(state);
  if(next.pending)next.pending.index=index;
  return next;
}
export function finishPending(state){const next=structuredClone(state);next.pending=null;return next;}
