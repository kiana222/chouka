export const ROSTER = [
  {id:'chatgpt',name:'ChatGPT',weapon:'Codex',title:'万象织序',line:'让每一种可能，都有回应。',color:'#abd7c9',symbol:'✧',tags:'白银龙裔 · 万象之章'},
  {id:'claude',name:'Claude',weapon:'Claude Code',title:'烬页寻知',line:'在字句之间，寻找更远的答案。',color:'#ddb19a',symbol:'✺',tags:'赤铜学者 · 沉思之章'},
  {id:'gemini',name:'Gemini',weapon:'Antigravity',title:'双曜巡星',line:'越过引力的边界，与星辰相遇。',color:'#b5a5e5',symbol:'✦',tags:'双曜旅者 · 群星之章'},
  {id:'deepseek',name:'DeepSeek',weapon:'DeepSeek Harness',title:'深蓝回响',line:'向未知深处，投下一束思考。',color:'#86b8da',symbol:'◈',tags:'深海观测者 · 潮汐之章'},
  {id:'grok',name:'Grok',weapon:'Grok Build',title:'绯夜破晓',line:'以锋芒，划开既定的夜色。',color:'#d9a2af',symbol:'✣',tags:'绯夜行者 · 破晓之章'},
  {id:'kimi',name:'Kimi',weapon:'Kimi Code CLI',title:'月下长笛',line:'把未说完的故事，交给月光。',color:'#aeb6dd',symbol:'☽',tags:'月弦乐师 · 长夜之章'},
  {id:'qwen',name:'Qwen',weapon:'Qwen Code',title:'千问流云',line:'一扇清风，万千解答。',color:'#aaaee3',symbol:'❖',tags:'流云问道者 · 千问之章'},
  {id:'minimax',name:'MiniMax',weapon:'MiniMax Code',title:'映梦巡游',line:'每一次想象，都值得被看见。',color:'#e2b2b0',symbol:'⌁',tags:'映梦创作者 · 光影之章'},
];
export const FILLERS = [
  {id:'bronze-key',name:'旧式密钥',rarity:3,cell:0,description:'一把通往旧日终端的钥匙。'},
  {id:'blank-scroll',name:'空白卷轴',rarity:3,cell:1,description:'尚未写下的想法，拥有无限可能。'},
  {id:'sand-clock',name:'微光沙漏',rarity:3,cell:2,description:'为漫长的思索，留下一点时间。'},
  {id:'memory-prism',name:'记忆棱镜',rarity:4,cell:3,description:'储存旅途中闪过的灵感。'},
  {id:'index-compass',name:'索引罗盘',rarity:4,cell:4,description:'指针总会朝向尚未探索的方向。'},
  {id:'debug-cube',name:'解构魔方',rarity:4,cell:5,description:'转动之间，让纷乱重归秩序。'},
];
export const ASSET = (ai,kind,suffix='') => `./assets/${ai}-${kind}${suffix}.png`;
export const ITEMS = Object.fromEntries([
  ...ROSTER.flatMap(ai=>['character','weapon'].map(kind=>({id:`${ai.id}-${kind}`,name:kind==='character'?ai.name:ai.weapon,rarity:5,ai:ai.id,kind,description:ai.line}))),
  ...FILLERS,
].map(item=>[item.id,item]));
export const POOL_NAMES = {character:'角色祈愿',weapon:'专武祈愿'};
