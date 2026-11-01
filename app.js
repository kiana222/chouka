import {ROSTER,FILLERS,ITEMS,ASSET,POOL_NAMES} from './data.mjs';
import {STORAGE_KEY,initialState,restoreState,drawBatch,progressPending,finishPending} from './core.mjs';
const $=id=>document.getElementById(id),rarityColor={3:'#88bdf0',4:'#ba9cde',5:'#dec48a'};
let state=initialState(),mode='home',batch=[],revealIndex=0,revealReady=false,clock=0,frame=0,serial=0,initialOwned={},toastTimer,persistLocked=false;
try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)state=restoreState(JSON.parse(raw));}catch{persistLocked=true;setTimeout(()=>toast('旧存档无法读取。请在设置中确认清空后再开始，原存档尚未改动。',12000),400);}
function toast(message,duration=4000){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,duration);}
function commit(next){
  if(persistLocked){toast('请先在设置中处理无法读取的存档。');return false;}
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));state=next;return true;}
  catch{toast('浏览器未能保存本次操作。请检查存储空间或隐私模式后重试。',6500);return false;}
}
const sound={ctx:null,gain:null,init(){try{if(!this.ctx){this.ctx=new AudioContext();this.gain=this.ctx.createGain();this.gain.connect(this.ctx.destination);}this.gain.gain.value=state.muted?0:.65;this.ctx.resume().catch(()=>{});}catch{}},mute(){if(this.gain)this.gain.gain.setTargetAtTime(state.muted?0:.65,this.ctx.currentTime,.025);},play(kind,rarity=3){
  if(state.muted)return;this.init();if(!this.ctx)return;const c=this.ctx,now=c.currentTime;
  const notes=kind==='reveal'?(rarity===5?[392,493.88,587.33,783.99]:rarity===4?[329.63,440,659.25]:[293.66,440]):kind==='open'?[174.61,261.63,349.23]:kind==='meteor'?[523.25,783.99]:[440];
  notes.forEach((hz,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(hz,now);if(kind==='meteor')o.frequency.exponentialRampToValueAtTime(hz*.56,now+1.6);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.045,now+.04+i*.04);g.gain.exponentialRampToValueAtTime(.0001,now+(kind==='open'?1.8:kind==='meteor'?2.2:1.1)+i*.08);o.connect(g).connect(this.gain);o.start(now+i*.045);o.stop(now+2.7);});
}};
function sprite(el,cell){el.style.backgroundPosition=`${cell%3*50}% ${Math.floor(cell/3)*100}%`;}
function itemArt(item,cls='item-art'){
  if(item.rarity===5){const img=document.createElement('img');img.src=ASSET(item.ai,item.kind);img.alt=item.name;img.className=cls;img.loading='lazy';return img;}
  const el=document.createElement('div');el.className='filler-sprite';el.setAttribute('role','img');el.setAttribute('aria-label',item.name);sprite(el,item.cell);return el;
}
function updateHome(){
  const ai=ROSTER.find(a=>a.id===state.featured),p=state.pools[state.pool],weapon=state.pool==='weapon';
  document.documentElement.style.setProperty('--accent',ai.color);
  document.querySelectorAll('[data-pool]').forEach(b=>{b.classList.toggle('active',b.dataset.pool===state.pool);b.setAttribute('aria-pressed',String(b.dataset.pool===state.pool));});
  document.querySelectorAll('.ai-choice').forEach(b=>{b.classList.toggle('active',b.dataset.ai===ai.id);b.setAttribute('aria-pressed',String(b.dataset.ai===ai.id));});
  $('pool-caption').textContent=weapon?'专属武器祈愿':'角色活动祈愿';$('banner-title').textContent=weapon?'星铸之约':ai.title;$('banner-quote').textContent=weapon?'以专属之器，开启新的可能。':ai.line;
  $('featured-name').textContent=weapon?ai.weapon:ai.name;$('character-tags').textContent=weapon?'星铸奇器 · 专属之章':ai.tags;
  $('hero-art').classList.toggle('weapon',weapon);$('hero-art').src=ASSET(ai.id,state.pool);$('hero-art').alt=`${weapon?ai.weapon:ai.name} ${weapon?'独立专武':'角色立绘'}`;
  $('hero-number').textContent=String(ROSTER.indexOf(ai)+1).padStart(2,'0')+' / 08';$('hero-caption').textContent=weapon?'FORGED FROM A THOUSAND POSSIBILITIES':'A NEW POSSIBILITY AWAITS';
  $('pity-number').replaceChildren(document.createTextNode(String(20-p.five)+' '));const small=document.createElement('small');small.textContent='抽以内';$('pity-number').append(small);
  $('pity-dots').replaceChildren(...Array.from({length:20},(_,i)=>{const x=document.createElement('span');x.classList.toggle('filled',i<p.five);return x;}));
  $('guarantee-label').textContent=p.guaranteed?'下一次五星 · 必为当前主推':'五星主推命中率 50%';
  const owned=Object.keys(state.owned).filter(id=>ITEMS[id]?.rarity===5&&state.owned[id]>0).length;
  $('collection-counter').innerHTML=`${owned} <small>/ 16</small>`;
  $('sound-button').textContent=state.muted?'♩':'♫';$('sound-button').setAttribute('aria-label',state.muted?'开启音效':'关闭音效');$('sound-button').title=state.muted?'开启音效':'关闭音效';
  $('single-button').disabled=!!state.pending;$('ten-button').disabled=!!state.pending;
  const preload=new Image();preload.src=ASSET(ai.id,state.pool,'-wish');
}
for(const ai of ROSTER){const button=document.createElement('button');button.className='ai-choice';button.dataset.ai=ai.id;button.setAttribute('aria-label',`主推 ${ai.name}`);button.title=ai.name;const symbol=document.createElement('span');symbol.className='choice-icon';symbol.textContent=ai.symbol;const name=document.createElement('span');name.className='choice-name';name.textContent=ai.name;button.append(symbol,name);button.addEventListener('click',()=>{if(mode!=='home')return;if(commit({...state,featured:ai.id}))updateHome();});$('ai-selector').append(button);}
document.querySelectorAll('[data-pool]').forEach(b=>b.addEventListener('click',()=>{if(mode!=='home')return;if(commit({...state,pool:b.dataset.pool}))updateHome();}));
function toggleSound(){if(commit({...state,muted:!state.muted})){sound.init();sound.mute();updateHome();}}
$('sound-button').addEventListener('click',toggleSound);
$('fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('app').requestFullscreen();}catch{toast('当前浏览器暂不支持全屏。');}});
$('hero-art').addEventListener('error',()=>toast('立绘暂未载入，请检查网络后重试。'));
const iframe=$('wish-animation');
function sceneMessage(data){iframe.contentWindow?.postMessage(data,location.origin);}
function beginWish(count){
  if(mode!=='home')return;
  initialOwned={...state.owned};let drawn;
  try{drawn=drawBatch(state,state.pool,state.featured,count);}catch(error){toast(error.message);return;}
  if(!commit(drawn.state))return;
  batch=drawn.entries;revealIndex=0;mode='animation';serial++;$('experience').hidden=false;$('reveal-stage').hidden=true;$('overview').hidden=true;iframe.hidden=false;$('skip-button').hidden=false;updateHome();sound.play('open');
  const high=Math.max(...batch.map(e=>ITEMS[e.itemId].rarity));sceneMessage({type:'wish:configure',rarity:high,count});
  const token=serial;clock=performance.now();let meteorPlayed=false;
  function tick(now){if(mode!=='animation'||token!==serial)return;const t=(now-clock)/1000;sceneMessage({type:'wish:seek',time:Math.min(t,7)});if(t>=2.1&&!meteorPlayed){meteorPlayed=true;sound.play('meteor',high);}if(t>=7){showReveal(0);return;}frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);
}
function clearStageAnimations(){document.querySelectorAll('#reveal-stage *').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));}
function showReveal(index){
  cancelAnimationFrame(frame);serial++;const token=serial;
  if(!state.pending)return;
  if(index>=batch.length){showOverview();return;}
  if(!commit(progressPending(state,index)))return;
  revealIndex=index;mode='reveal';revealReady=false;iframe.hidden=true;$('skip-button').hidden=true;$('overview').hidden=true;$('reveal-stage').hidden=false;clearStageAnimations();
  const item=ITEMS[batch[index].itemId],stage=$('reveal-stage'),wish=$('reveal-wish-image'),sil=$('reveal-silhouette');
  stage.style.setProperty('--rarity',rarityColor[item.rarity]);stage.classList.toggle('filler',item.rarity!==5);$('filler-reveal').hidden=item.rarity===5;
  wish.hidden=true;sil.hidden=true;$('reveal-count').textContent=`${index+1} / ${batch.length}`;$('overview-link').hidden=batch.length===1;
  const priorInBatch=batch.slice(0,index).some(e=>e.itemId===item.id);$('new-tag').hidden=!!initialOwned[item.id]||priorInBatch;
  if(item.rarity===5){
    sil.src=ASSET(item.ai,item.kind);sil.hidden=false;sil.animate([{opacity:0,transform:'scale(.93)'},{opacity:.95,transform:'scale(1)'}],{duration:380,fill:'both'});
    wish.src=ASSET(item.ai,item.kind,'-wish');wish.alt=`${item.name} 五星祈愿结果`;
    const ready=()=>{if(serial!==token||mode!=='reveal')return;setTimeout(()=>{if(serial!==token||mode!=='reveal')return;wish.hidden=false;wish.animate([{opacity:0,transform:'scale(1.025)'},{opacity:1,transform:'scale(1)'}],{duration:520,fill:'both',easing:'cubic-bezier(.2,.65,.2,1)'});sil.hidden=true;revealReady=true;sound.play('reveal',5);},260);};
    if(wish.complete&&wish.naturalWidth)ready();else{wish.onload=ready;wish.onerror=()=>{if(token!==serial)return;toast('结果图未载入，可继续查看其他结果。');revealReady=true;};}
  }else{
    $('filler-name').textContent=item.name;$('filler-stars').textContent='★'.repeat(item.rarity);$('filler-description').textContent=item.description;sprite($('filler-reveal-sprite'),item.cell);
    $('filler-reveal').animate([{opacity:0,transform:'translateY(14px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:450,fill:'both',easing:'ease-out'});sound.play('reveal',item.rarity);revealReady=true;
  }
}
function resultCard(entry,seen){
  const item=ITEMS[entry.itemId],button=document.createElement('button');button.className=`result-card rarity-${item.rarity} ${item.kind||''}`;button.setAttribute('aria-label',`${item.name}，${item.rarity}星，查看详情`);button.append(itemArt(item,'card-portrait'));
  const bottom=document.createElement('div');bottom.className='card-bottom';const name=document.createElement('strong');name.textContent=item.name;const stars=document.createElement('span');stars.textContent='★'.repeat(item.rarity);bottom.append(name,stars);button.append(bottom);
  if(!seen.has(item.id)&&!initialOwned[item.id]){const tag=document.createElement('span');tag.className='card-new';tag.textContent='NEW';button.append(tag);}seen.add(item.id);
  button.addEventListener('click',()=>showReveal(batch.indexOf(entry)));return button;
}
function showOverview(){
  cancelAnimationFrame(frame);serial++;mode='overview';iframe.hidden=true;$('reveal-stage').hidden=true;$('skip-button').hidden=true;$('overview').hidden=false;
  const seen=new Set();$('result-cards').replaceChildren(...batch.map(e=>resultCard(e,seen)));
  $('result-cards').querySelectorAll('.result-card').forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,delay:i*45,fill:'both',easing:'ease-out'}));
}
function closeResults(){if(!commit(finishPending(state)))return;serial++;mode='home';batch=[];$('experience').hidden=true;updateHome();$('single-button').focus({preventScroll:true});}
$('single-button').addEventListener('click',()=>beginWish(1));$('ten-button').addEventListener('click',()=>beginWish(10));$('skip-button').addEventListener('click',()=>{if(mode==='animation')showReveal(0);});
$('continue-button').addEventListener('click',()=>{if(mode!=='reveal'||!revealReady)return;if(batch.length===1)closeResults();else if(revealIndex+1<batch.length)showReveal(revealIndex+1);else showOverview();});
$('overview-link').addEventListener('click',()=>{if(mode==='reveal')showOverview();});$('close-result').addEventListener('click',closeResults);
iframe.addEventListener('load',()=>{if(mode==='animation'){sceneMessage({type:'wish:configure',rarity:Math.max(...batch.map(e=>ITEMS[e.itemId].rarity)),count:batch.length});}});
function panel(title,kicker='ASTRAL ARCHIVE'){if(mode!=='home')return false;$('panel-title').textContent=title;$('panel-kicker').textContent=kicker;$('panel-content').replaceChildren();$('panel-dialog').showModal();return true;}
document.querySelector('.close-panel').addEventListener('click',()=>$('panel-dialog').close());
$('panel-dialog').addEventListener('click',e=>{if(e.target===$('panel-dialog')){const b=$('panel-dialog').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)$('panel-dialog').close();}});
$('rules-button').addEventListener('click',()=>{if(!panel('祈愿说明','A LITTLE GUIDE TO THE STARS'))return;$('panel-content').innerHTML=`<p>这是 AI 星愿的原创娱乐规则。所有祈愿免费且次数不限。</p><div class="rule-grid"><div class="rule-tile"><strong>5%</strong><span>五星基础概率</span></div><div class="rule-tile"><strong>15%</strong><span>四星基础概率</span></div><div class="rule-tile"><strong>80%</strong><span>三星基础概率</span></div></div><h3>星光总会到来</h3><p>最多 20 抽必出五星。连续 9 抽未获得四星或五星时，下一抽必为四星或五星。五星保底优先，并重置四星计数。触发四星保底时，五星概率仍为 5%，其余为四星；保底会使长期实际概率高于基础概率。</p><h3>与你选择的主推相遇</h3><p>出五星时，50% 为当前主推；未命中时在其他七位中等概率抽取，下一个五星必为当时选中的主推。角色池和武器池独立累计。切换同类池主推会继承保底和必出状态。</p><h3>每一份相遇都会留下</h3><p>重复获得会增加图鉴数量。记录保存在当前浏览器，刷新不会重抽或丢失已生成的结果。换设备或清理浏览器数据后，记录不会同步。</p><p>角色设定参考 ZipZipPipe 的 AI 拟人化系列，画面与幻想专武由 AI 生成重绘。本站为非官方同人模拟体验。<a href="./LICENSES.md" target="_blank" rel="noopener">素材署名</a></p>`;});
let historyFilter='all',historyPage=0;
function renderHistory(){
  const content=$('panel-content');content.replaceChildren();const tabs=document.createElement('div');tabs.className='panel-tabs';for(const [id,name]of [['all','全部'],['character','角色池'],['weapon','专武池']]){const b=document.createElement('button');b.textContent=name;b.classList.toggle('active',id===historyFilter);b.addEventListener('click',()=>{historyFilter=id;historyPage=0;renderHistory();});tabs.append(b);}content.append(tabs);
  const entries=state.history.filter(e=>historyFilter==='all'||e.pool===historyFilter).slice().reverse();
  if(!entries.length){const p=document.createElement('p');p.className='empty-message';p.textContent='星海尚未留下足迹，开始你的第一次祈愿吧。';content.append(p);return;}
  const pageCount=Math.ceil(entries.length/10);historyPage=Math.min(historyPage,pageCount-1);const table=document.createElement('table');table.className='record-table';table.innerHTML='<thead><tr><th>获得物品</th><th>品质</th><th>祈愿</th><th>时间</th></tr></thead>';const body=document.createElement('tbody');
  for(const e of entries.slice(historyPage*10,historyPage*10+10)){const item=ITEMS[e.itemId];if(!item)continue;const tr=document.createElement('tr');for(const value of [item.name,'★'.repeat(item.rarity),POOL_NAMES[e.pool],new Date(e.at).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})]){const td=document.createElement('td');td.textContent=value;tr.append(td);}tr.firstChild.className=`rarity-${item.rarity}`;body.append(tr);}table.append(body);content.append(table);
  const paging=document.createElement('div');paging.className='record-pages';const prev=document.createElement('button'),next=document.createElement('button'),label=document.createElement('span');prev.textContent='上一页';next.textContent='下一页';label.textContent=`${historyPage+1} / ${pageCount} · 共 ${entries.length} 条`;prev.disabled=historyPage===0;next.disabled=historyPage===pageCount-1;prev.onclick=()=>{historyPage--;renderHistory();};next.onclick=()=>{historyPage++;renderHistory();};paging.append(prev,label,next);content.append(paging);
}
$('history-button').addEventListener('click',()=>{if(panel('祈愿记录')){historyFilter='all';historyPage=0;renderHistory();}});
function renderCollection(kind='character'){
  const content=$('panel-content');content.replaceChildren();const tabs=document.createElement('div');tabs.className='panel-tabs';for(const [id,label]of [['character','角色'],['weapon','专武'],['filler','星海馈赠']]){const b=document.createElement('button');b.textContent=label;b.classList.toggle('active',kind===id);b.onclick=()=>renderCollection(id);tabs.append(b);}content.append(tabs);
  const grid=document.createElement('div');grid.className='collection-grid';const items=kind==='filler'?FILLERS:ROSTER.map(a=>ITEMS[`${a.id}-${kind}`]);
  for(const item of items){const owned=state.owned[item.id]||0,b=document.createElement('button');b.className=`collection-item ${item.kind||''} ${owned?'':'locked'}`;b.append(itemArt(item));const name=document.createElement('strong');name.textContent=item.name;const count=document.createElement('small');count.textContent=owned?`已获得 × ${owned}`:'尚未邂逅';b.append(name,count);b.onclick=()=>toast(owned?`${item.name} · 已获得 ${owned} 次`:item.description);grid.append(b);}content.append(grid);
}
$('collection-button').addEventListener('click',()=>{if(panel('星海图鉴','ENCOUNTERS IN THE STARS'))renderCollection();});
function settings(){if(!panel('星愿设置','A MOMENT OF QUIET'))return;$('panel-content').innerHTML=`<div class="settings-row"><div><strong>祈愿音效</strong><small>开门、流星与揭晓的声音</small></div><button id="settings-sound">${state.muted?'开启音效':'关闭音效'}</button></div><div class="settings-row"><div><strong>本机记录</strong><small>已记录 ${state.history.length} 次祈愿 · 仅保存在此浏览器</small></div><button class="danger" id="reset-button">清空记录</button></div><p>清空将同时重置图鉴、历史、保底与主推保证状态。</p><div id="reset-confirm" class="confirm-clear" hidden><p>确认清空所有本机祈愿数据？此操作无法撤销。</p><button id="confirm-reset">确认清空</button><button id="cancel-reset">保留记录</button></div><p><a href="./LICENSES.md" target="_blank" rel="noopener">素材与署名</a></p>`;$('settings-sound').onclick=()=>{toggleSound();$('settings-sound').textContent=state.muted?'开启音效':'关闭音效';};$('reset-button').onclick=()=>$('reset-confirm').hidden=false;$('cancel-reset').onclick=()=>$('reset-confirm').hidden=true;$('confirm-reset').onclick=()=>{const next=initialState();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));state=next;persistLocked=false;sound.mute();$('panel-dialog').close();updateHome();toast('本机记录已清空。');}catch{toast('无法清空浏览器存档，请检查存储权限。');}};}
$('settings-button').addEventListener('click',settings);
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||e.repeat)return;if($('panel-dialog').open)return;if(e.key==='Escape'){if(mode==='animation')showReveal(0);else if(mode==='reveal')showOverview();else if(mode==='overview')closeResults();return;}if(mode==='home'){if(e.key==='1')beginWish(1);if(e.key==='0')beginWish(10);}else if(e.key==='Enter'||e.code==='Space'){e.preventDefault();if(mode==='overview')closeResults();else if(mode==='reveal')$('continue-button').click();}});
updateHome();
if(state.pending){batch=state.pending.entries;initialOwned={...state.owned};for(const e of batch)initialOwned[e.itemId]=(initialOwned[e.itemId]||1)-1;mode='reveal';$('experience').hidden=false;showReveal(state.pending.index);toast('已恢复上次尚未查看完的祈愿结果。');}
