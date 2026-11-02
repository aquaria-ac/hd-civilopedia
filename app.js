'use strict';

const D=window.PEDIA, $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const iconWords={TECHBOOSTED:'尤里卡',CIVICBOOSTED:'鼓舞',GREATPERSON:'伟人点',FAVOR:'外交支持',GREATWORK_PRODUCT:'产品',GREATWORK_WRITING:'著作巨作',GREATWORK_RELIC:'遗物',GREATWORK_MUSIC:'音乐巨作',GLORY_NORMAL_AGE:'时代得分',DISTRICT_WONDER:'奇观',STAT_GRIEVANCE:'不满',TRADINGPOST:'贸易站',RANGED:'远程战斗力',BOMBARD:'轰炸战斗力',FOOD:'食物',PRODUCTION:'生产力',GOLD:'金币',SCIENCE:'科技',CULTURE:'文化',FAITH:'信仰',HOUSING:'住房',AMENITIES:'宜居度',TOURISM:'旅游业绩',CITIZEN:'公民',STRENGTH:'战斗力',MOVEMENT:'移动力',RANGE:'射程',POWER:'电力',INFLUENCEPERTURN:'影响力',GREATSCIENTIST:'大科学家',GREATENGINEER:'大工程师',GREATMERCHANT:'大商人',GREATPROPHET:'大预言家',GREATGENERAL:'大将军',GREATADMIRAL:'海军统帅',GREATWRITER:'大作家',GREATARTIST:'大艺术家',GREATMUSICIAN:'大音乐家',TRADEROUTE:'贸易路线',ENVOY:'使者',RESOURCE_IRON:'铁',RESOURCE_HORSES:'马',RESOURCE_NITER:'硝石',RESOURCE_COAL:'煤',RESOURCE_OIL:'石油',RESOURCE_ALUMINUM:'铝',RESOURCE_URANIUM:'铀',GOVERNOR:'总督',GOVERNORPROMOTION:'总督头衔',CAPITAL:'首都',DISTRICT:'区域',LOYALTY:'忠诚度',DIPLOMATIC_FAVOR:'外交支持'};

Object.assign(iconWords,window.PEDIA_ICON_LABELS||{});

const byId=new Map(D.pages.map(p=>[p.id,p])), byKey=new Map(D.pages.map(p=>[p.key,p])), sectionMap=new Map(D.sections.map(s=>[s.id,s]));

function readable(s){return String(s??'').replace(/\[NEWLINE\]/gi,'\n').replace(/\[ICON_([^\]]+)\]/gi,(_,rawKey,offset,full)=>{const k=rawKey.trim().toUpperCase();if(/BULLET/.test(k))return '• ';const label=String(iconWords[k.toUpperCase()]||byKey.get(k)?.name||byKey.get(k.toUpperCase())?.name||D.icons?.[k.toUpperCase()]||'').replace(/\[ICON_[^\]]+\]/gi,'').trim();if(!label)return '〔'+k+'〕';const next=full.slice(offset+_.length).replace(/^(?:\s|\[(?:COLOR[^\]]*|ENDCOLOR)\])*/gi,'');return next.startsWith(label)?'':' '+label+' ';}).replace(/\[(?:COLOR[^\]]*|ENDCOLOR|BOLD|ENDBOLD|ITALIC|ENDITALIC|LINK[^\]]*|ENDLINK)\]/gi,'').replace(/\{([^{}]*?)\}/g,'〔$1〕');}

function rich(s){const parts=String(s??'').split(/(\[ICON_[^\]]+\])/gi);return parts.map(part=>{const m=part.match(/^\[ICON_([^\]]+)\]$/i);return m?icon(m[1]):esc(readable(part)).replace(/\n/g,'<br>');}).join('');}

function icon(key){const k=key.trim().toUpperCase();if(k.includes('BULLET'))return '<span class="bullet">•</span>';const label=k==='BOLT'?'':k==='POWERRIGHT'?'→':String(iconWords[k]||byKey.get(k)?.name||D.icons?.[k]||key).replace(/\[ICON_[^\]]+\]/gi,'').trim();const spec=window.PEDIA_ICONS?.[k];return spec?`<img class="game-icon" src="icons/${spec}" alt="${esc(readable(label))}"${k==='BOLT'?' aria-hidden="true"':k==='POWERRIGHT'?'':` title="${esc(readable(label))}"`}>`:`<span class="icon-fallback" title="${esc(key)}">${esc(readable(label))}</span>`;}

function unlockPanel(p){if(!p.unlocks)return '';const groups=Map.groupBy?Map.groupBy(p.unlocks,x=>x.kind):p.unlocks.reduce((m,x)=>(m.has(x.kind)||m.set(x.kind,[]),m.get(x.kind).push(x),m),new Map());return `<h2>解锁内容与奖励 <small class="count">${p.unlocks.length}</small></h2>${p.unlocks.length?[...groups].map(([kind,items])=>`<h3 class="unlock-kind">${esc(kind)}</h3><ul class="unlock-list">${items.map(u=>`<li>${u.id?`<a href="${route({entry:u.id})}">${rich(u.text)} ↗</a>`:rich(u.text)}</li>`).join('')}</ul>`).join(''):'<p>数据库没有记录额外解锁项目。</p>'}`;}

function entityIcon(p){const spec=window.PEDIA_ENTITY_ICONS?.[p.key];if(!spec)return '';const label=title(p.name)+(spec.fallback?'（类别图标，未取得独立图标）':'图标');return `<img class="entity-icon" src="${esc(spec.src)}" alt="" title="${esc(label)}" loading="lazy">`;}


// Resource memberships use real entry links; list cards keep a single link.
function resourceListsPanel(p,compact=false){
 return (p.resourceLists||[]).map(group=>`<section class="resource-members ${compact?'compact':''}"><${compact?'b':'h3'}>${rich(group.title)} <small class="count">${group.items.length}</small></${compact?'b':'h3'}><div class="resource-chips">${group.items.map(item=>{const target=byId.get(item.id),label=rich(item.name||target?.name||'');return compact?`<span class="resource-chip">${label}</span>`:`<a class="resource-chip" href="${route({entry:item.id})}">${label}<span aria-hidden="true"> ↗</span></a>`;}).join('')}</div></section>`).join('');
}
// Belief list groups already come from BeliefClassType; share that label.
function beliefTypePanel(p){
 if(p.section!=='RELIGIONS'||p.source!=='Beliefs'||!p.raw?.BeliefClassType||!p.group)return '';
 return `<div class="belief-type"><span>信条类型：</span><b>${esc(title(p.group))}</b></div>`;
}
function entryPanels(p){return p.section==='CORPORATIONS'?economyPanel(p)+resourceListsPanel(p):resourceListsPanel(p)+economyPanel(p);}
function additionalLinks(p){const rendered=new Set([...(p.resourceLists||[]).flatMap(g=>g.items.map(i=>i.id)),...(p.economyEffects||[]).map(e=>e.id),...p.chapters.flatMap(c=>chapterEffects(c).flatMap(e=>[e.entityId,...e.prerequisites.map(p=>p.id)]))]);return p.links.filter(l=>!rendered.has(l.id));}
function economyPanel(p){
 if(!p.economyEffects?.length)return '';
 return `<section class="economy-effects"><h2>行业与公司加成</h2>${p.economyEffects.map(effect=>`<section class="economy-effect"><h3>${effect.id&&effect.id!==p.id?`<a href="${route({entry:effect.id})}">${rich(effect.name)} ↗</a>`:rich(effect.name)}</h3><div class="economy-table-wrap"><table class="economy-table"><thead><tr><th scope="col">阶段</th><th scope="col">本城加成</th><th scope="col">辐射加成</th><th scope="col">全国加成</th></tr></thead><tbody>${effect.stages.map(stage=>`<tr><th scope="row">${esc(stage.name)}</th>${['city','regional','empire'].map(scope=>`<td>${stage[scope]?.length?stage[scope].map(line=>`<p>${rich(line)}</p>`).join(''):'<span class="no-effect">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${effect.inheritsIndustry?'<p class="economy-note">升级为公司后保留已选行业效果；“公司新增”与行业效果分别生效。</p>':''}</section>`).join('')}${(p.economyNotes||[]).map(line=>`<p class="economy-note">${rich(line)}</p>`).join('')}</section>`;
}

// Both table rendering and indexing use the same effects, without source metadata.
function chapterEffects(chapter){return [...(chapter.effects||[]),...(chapter.effectTables||[]).flatMap(group=>group.effects)];}
function combatEffectsPanel(chapter,compact=false){
 const groups=chapter.effectTables||(chapter.effects?.length?[{title:'',effects:chapter.effects}]:[]);
 return groups.map(group=>`${group.title?`<h${compact?4:3} class="combat-effects-heading">${esc(group.title)}</h${compact?4:3}>`:''}<div class="combat-effects-table-wrap"><table class="combat-effects-table"><colgroup><col class="effect-source"><col class="effect-rules"><col class="effect-unlocks"></colgroup><thead><tr><th scope="col">来源</th><th scope="col">效果与条件</th><th scope="col">前提</th></tr></thead><tbody>${group.effects.map(effect=>{
  const target=byId.get(effect.entityId);
  const name=target?`<a href="${link(target)}">${entityIcon(target)}${rich(effect.name)} ↗</a>`:rich(effect.name);
  const unlocks=effect.prerequisites.map(item=>item.id&&byId.has(item.id)?`<a href="${route({entry:item.id})}">${rich(item.name)} ↗</a>`:rich(item.name));
  return `<tr><th scope="row"><small>${esc(effect.category)}</small><div>${name}</div></th><td>${[...effect.text,...effect.mechanics].map(line=>`<div>${rich(line)}</div>`).join('')}${effect.notes.map(line=>`<div class="effect-text-difference"><b>原文差异：</b>${rich(line)}</div>`).join('')}</td><td>${unlocks.length?unlocks.join('<br>'):'—'}</td></tr>`;
 }).join('')}</tbody></table></div>`).join('');
}

function chapterPanel(p,compact=false){
 const level=compact?3:2;
 return p.chapters.filter(c=>!isBoostChapter(c)).map((c,i)=>`<section${p.editorial&&!compact?` id="mechanics-chapter-${i}" class="mechanics-chapter"`:''}><h${level}>${esc(title(c.title))}</h${level}>${c.body.map(b=>`<p>${rich(b)}</p>`).join('')}${combatEffectsPanel(c,compact)}${c.formula?`<div class="mechanics-formula">${rich(c.formula)}</div>`:''}${c.table?`<div class="mechanics-table-wrap"><table class="mechanics-table"><thead><tr>${c.table.headers.map(h=>`<th scope="col">${rich(h)}</th>`).join('')}</tr></thead><tbody>${c.table.rows.map(row=>`<tr${c.table.emphasizedRows?.includes(row[0])?' class="emphasized-row"':''}>${row.map((cell,j)=>`<${j?'td':'th'}${j?'':' scope="row"'}>${rich(cell)}</${j?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table>${c.table.caption?`<p class="mechanics-caption">${rich(c.table.caption)}</p>`:''}</div>`:''}${c.note?`<p class="note">${rich(c.note)}</p>`:''}${!p.editorial&&c.citations?.length?`<p class="mechanics-citations">依据：${c.citations.map(id=>{const ref=(p.references||[]).find(r=>r.id===id);return ref?referenceLabel(ref):'';}).filter(Boolean).join('；')}</p>`:''}</section>`).join('');
}
function mechanicsContents(p){return p.editorial?`<nav class="article-toc" aria-label="本文目录"><b>本文目录</b><div>${p.chapters.map((c,i)=>`<button type="button" data-scroll-target="mechanics-chapter-${i}">${esc(title(c.title))}</button>`).join('')}</div></nav>`:'';}
function referenceLabel(ref){return /^https:\/\//.test(ref.url||'')?`<a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.label)} ↗</a>`:esc(ref.label);}
function referencesPanel(p,compact=false){
 // Editorial references and citations remain in data for maintenance only.
 if(p.editorial||!p.references?.length)return '';
 return `<section class="mechanics-references"${p.editorial&&!compact?' id="mechanics-sources"':''}><h2>资料与核对范围</h2>${p.references.map(ref=>`<p>${/^https:\/\//.test(ref.url||'')?`<a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.label)} ↗</a>`:`<b>${esc(ref.label)}</b>`}${ref.detail?`<br><small>${rich(ref.detail)}</small>`:''}</p>`).join('')}</section>`;
}

function variantsPanel(p){return p.variants?`<h2>各资源产品项目 <small class="count">${p.variants.length}</small></h2><label class="variant-search">筛选资源或产品 <input type="search" id="variantSearch" placeholder="例如：蜂蜜、葡萄、啤酒"></label><div id="variants">${p.variants.map(v=>`<details class="variant" data-search="${esc(readable(v.name+' '+v.description).toLowerCase())}"><summary>${rich(v.name)}</summary><p>${rich(v.description)}</p><div class="variant-stats">${v.stats.map(([k,val])=>`<p>${rich(k)}：<b>${rich(val)}</b></p>`).join('')}</div>${v.chapters.map(c=>`<h3>${rich(c.title)}</h3>${c.body.map(b=>`<p>${rich(b)}</p>`).join('')}`).join('')}</details>`).join('')}</div>`:'';}



function title(s){return s?.startsWith('LOC_')?'未翻译条目':readable(s);}
function pageGroups(p){return [...new Set(p.groups?.length?p.groups:p.group?[p.group]:[])];}
function inGroup(p,group){return !group||pageGroups(p).includes(group);}
function displayedGroup(p){return state.group&&inGroup(p,state.group)?state.group:p.group;}

const symbols={"CONCEPTS":"⌂","CIVILIZATIONS":"◇","CITYSTATES":"♜","DISTRICTS":"▥","BUILDINGS":"▤","WONDERS":"♙","PROJECTS":"⚔","UNITS":"✧","UNITPROMOTIONS":"✦","GREATPEOPLE":"⌘","CORPORATIONS":"❧","TECHNOLOGIES":"⚑","CIVICS":"☼","GOVERNMENTS":"△","RELIGIONS":"◈","FEATURES":"⌑","RESOURCES":"♧","IMPROVEMENTS":"◷","GOVERNORS":"◉","MOMENTS":"▧","MECHANICS":"⚙"};

const listedPages=D.pages.filter(p=>p.listed!==false);
const counts=Object.fromEntries(D.sections.map(s=>[s.id,listedPages.filter(p=>p.section===s.id).length]));

function isHistoryChapter(c){return readable(c.title).trim()==='历史背景';}
function isBoostChapter(c){return ['尤里卡条件','鼓舞条件'].includes(c.title);}
function boostPanel(p){return p.chapters.filter(isBoostChapter).map(c=>`<h2>${esc(c.title)}</h2>${c.body.map(b=>`<p>${rich(b)}</p>`).join('')}`).join('');}
function searchableText(p){
 const history=new Set(p.chapters.filter(isHistoryChapter).flatMap(c=>c.body).map(b=>readable(b).trim()).filter(Boolean));
 const include=text=>!history.has(readable(text).trim());
 const chapters=[...p.chapters,...(p.preview||[])].filter(c=>!isHistoryChapter(c));
 return readable([p.name,p.key,...[momentScoreText(p)].filter(Boolean),...[p.description].filter(include),...chapters.flatMap(c=>[c.title,...c.body.filter(include),c.formula||'',...(c.table?[...c.table.headers,...c.table.rows.flat()]:[]),c.note||'',...chapterEffects(c).flatMap(e=>[e.name,e.category,...e.text,...e.mechanics,...e.notes,...e.prerequisites.map(p=>p.name)])]),...(p.unlocks||[]).map(u=>u.text),...(p.variants||[]).flatMap(v=>[v.name,...[v.description].filter(include)]),...(p.resourceLists||[]).flatMap(g=>[g.title,...g.items.map(i=>i.name||byId.get(i.id)?.name||'')]),...(p.economyEffects||[]).flatMap(e=>[e.name,...e.stages.flatMap(s=>[s.name,...s.city,...s.regional,...s.empire])]),...(p.economyNotes||[])].join(' ')).toLowerCase();
}
const titleIndex=new Map(D.pages.map(p=>[p.id,readable(p.name).toLowerCase().trim()]));
const searchIndex=new Map(D.pages.map(p=>[p.id,searchableText(p)]));
function compareSearch(a,b,terms,q){
 const rank=p=>{const name=titleIndex.get(p.id);return !q?0:name===q?4:name.includes(q)?3:terms.every(t=>name.includes(t))?2:0;};
 const hits=p=>terms.filter(t=>titleIndex.get(p.id).includes(t)).length;
 return rank(b)-rank(a)||hits(b)-hits(a)||a.sort-b.sort||title(a.name).localeCompare(title(b.name),'zh-CN');
}

let state={section:'',q:'',group:'',page:1},timer;

function route(params){return '#'+new URLSearchParams(params).toString();}

let savedLists={};try{savedLists=JSON.parse(sessionStorage.getItem('pedia-list-state')||'{}');}catch{}
function listRoute(section){return savedLists[section]||route({section});}
function rememberList(){const params={...state.section?{section:state.section}:{},...state.q?{q:state.q}:{},...state.group?{group:state.group}:{},...state.page>1?{page:state.page}:{},...$('#titleOnly').checked?{titleOnly:'1'}:{}};const url=route(params);history.replaceState(null,'',url);savedLists[state.section]=url;try{sessionStorage.setItem('pedia-list-state',JSON.stringify(savedLists));}catch{}}
function link(p){return route({entry:p.id});}

function navigation(active=''){ $('#categories').innerHTML=`<a href="#" class="${!active?'active':''}"><span class="nav-icon">⌂</span>百科首页</a>`+D.sections.map((s,i)=>`<a href="${listRoute(s.id)}" class="${active===s.id?'active':''}"><span class="nav-icon">${symbols[s.id]||'◇'}</span>${esc(title(s.name))}<small>${counts[s.id]}</small></a>`).join('');}

function guide(p,i){const desc=['认识设计理念与新增内容','产出、区域与伟人体系','收获、劫掠与发展成本','人口、住房与城市经营','时代进程与得分机制'][i];return `<a class="guide" href="${link(p)}"><span class="number">0${i+1} / HARMONY</span><span class="arrow">↗</span><b>${esc(title(p.name))}</b><p>${desc}</p></a>`;}

function home(){navigation();document.body.classList.remove('detail');$('#content').innerHTML=`<div class="section-title"><h2>先读懂和而不同</h2><span>特色规则 · 从这里开始</span></div><div class="guide-grid">${D.pages.filter(p=>p.hd).sort((a,b)=>a.sort-b.sort).map(guide).join('')}</div><div class="section-title"><h2>探索百科</h2><span>${D.sections.length} 个分类 / ${listedPages.length.toLocaleString()} 个条目</span></div><div class="category-grid">${D.sections.map((s,i)=>`<a class="category-tile" href="${listRoute(s.id)}"><span class="tile-icon">${symbols[s.id]||'◇'}</span><span><b>${esc(title(s.name))}</b><small>${counts[s.id]} 个条目</small></span><em>↗</em></a>`).join('')}</div><p class="note">当前版本包含本机已加载的和而不同及配套模组。规则与数值随模组组合变化。</p>`;}

function basePreview(p){return p.preview?.length?`<div class="ability-preview">${p.preview.map(c=>`<div><b>${rich(c.title)}</b>${c.body.map(b=>`<p>${rich(b)}</p>`).join('')}</div>`).join('')}</div>`:`<p>${rich(p.description||p.chapters[0]?.body[0]||'查看基础数据与关联条目')}</p>`;}

function momentScoreText(p){return Number.isInteger(p.eraScore)?`时代得分 ${p.eraScore}分`:'';}
function momentScorePreview(p){return Number.isInteger(p.eraScore)?`<div class="moment-score">${icon('GLORY_NORMAL_AGE')}<span>时代得分</span><b>${p.eraScore}</b></div>`:'';}
function preview(p){return momentScorePreview(p)+basePreview(p)+resourceListsPanel(p,true)+(p.regionalPreview?.length?`<div class="ability-preview regional-preview"><b>辐射产出</b>${p.regionalPreview.map(b=>`<p>${rich(b)}</p>`).join('')}</div>`:'');}

function results(){navigation(state.section);document.body.classList.add('detail');const q=state.q.trim().toLowerCase(),terms=q.split(/\s+/).filter(Boolean);let base=listedPages.filter(p=>(!state.section||p.section===state.section)&&terms.every(t=>($('#titleOnly').checked?titleIndex.get(p.id):searchIndex.get(p.id)).includes(t)));const groups=(!q&&sectionMap.get(state.section)?.groups)||[...new Set([...base].sort((a,b)=>a.sort-b.sort).flatMap(pageGroups).filter(Boolean))];if(!q&&state.group&&!groups.includes(state.group))state.group='';if(state.group)base=base.filter(p=>inGroup(p,state.group));base.sort((a,b)=>compareSearch(a,b,terms,q));const size=30,total=Math.max(1,Math.ceil(base.length/size));state.page=Math.max(1,Math.min(total,state.page));rememberList();const selected=base.slice((state.page-1)*size,state.page*size);$('#content').innerHTML=`<div class="section-title"><h2>${esc(q?'搜索结果':title(sectionMap.get(state.section)?.name||'全部条目'))}</h2><span role="status">${base.length} 个条目</span></div>${groups.length?`<div class="group-tabs" role="tablist" aria-label="细分分类">${['',...groups].map(g=>`<button type="button" role="tab" id="group-${groups.indexOf(g)+1}" aria-controls="group-results" aria-selected="${g===state.group}" tabindex="${g===state.group?0:-1}" data-group="${esc(g)}">${g?esc(title(g)):'全部'}</button>`).join('')}</div>`:''}${!q&&sectionMap.get(state.section)?.introduction?`<p class="section-introduction">${esc(sectionMap.get(state.section).introduction)}</p>`:''}<div class="results-grid" id="group-results" role="tabpanel" aria-label="条目列表">${selected.map(p=>`<a class="result" href="${link(p)}"><small>${esc(title(sectionMap.get(p.section)?.name))} ${displayedGroup(p)?' / '+esc(title(displayedGroup(p))):''}</small><h3 class="entity-title">${entityIcon(p)}<span>${rich(p.name)}</span></h3>${preview(p)}</a>`).join('')}</div>${!base.length?'<div class="empty"><h2>没有找到匹配条目</h2><p>试试更短的关键词，或取消「只搜索名称」。</p><a href="#">回到百科首页 →</a></div>':''}${base.length>size?`<div class="pager"><button id="prev" ${state.page===1?'disabled':''}>← 上一页</button><span>${state.page} / ${total}</span><button id="next" ${state.page===total?'disabled':''}>下一页 →</button></div>`:''}`;document.querySelectorAll('.group-tabs [role="tab"]').forEach((tab,i,tabs)=>{function activate(next){state.group=next.dataset.group;state.page=1;results();document.querySelectorAll('.group-tabs [role="tab"]')[Array.from(tabs).indexOf(next)]?.focus();}tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();activate(tabs[n]);});});$('#prev')?.addEventListener('click',()=>{state.page--;results();window.scrollTo(0,0);});$('#next')?.addEventListener('click',()=>{state.page++;results();window.scrollTo(0,0);});}

function article(id){const p=byId.get(D.aliases?.[id]||id);document.body.classList.add('detail');if(!p){$('#content').innerHTML='<div class="empty"><h2>条目不存在</h2><a href="#">返回首页</a></div>';return;}navigation(p.section);document.title=title(p.name)+' · 和而不同百科';const description=!p.editorial&&p.description&&!p.description.startsWith('LOC_')?p.description:'';$('#content').innerHTML=`<div class="breadcrumb"><a href="#">百科首页</a><span>/</span><a href="${listRoute(p.section)}">${esc(title(sectionMap.get(p.section)?.name))}</a><span>/</span><span>${esc(title(p.name))}</span></div><div class="article-heading"><div class="eyebrow">${esc(title(p.group)||'CIVILOPEDIA')}</div><h1 class="entity-title">${entityIcon(p)}<span>${rich(p.name)}</span></h1><small>${esc(p.key)}</small></div><div class="article-layout${p.editorial?' no-stat-panel':''}"><div class="article-body">${beliefTypePanel(p)}${description?`<h2>规则说明</h2><p>${rich(description)}</p>`:''}${mechanicsContents(p)}${entryPanels(p)}${boostPanel(p)}${unlockPanel(p)}${variantsPanel(p)}${chapterPanel(p)}${referencesPanel(p)}${!description&&!p.chapters.length?'<p class="note">此条目没有独立文字说明，请查阅基础数据与关联条目。部分信息由游戏运行时生成。</p>':''}${additionalLinks(p).length?`<h2>关联条目</h2><div class="related">${additionalLinks(p).map(l=>`<a href="${link(byId.get(l.id))}"><small>${esc(l.label)}</small>${esc(title(byId.get(l.id).name))} ↗</a>`).join('')}</div>`:''}${!p.editorial?`<details><summary>查看数据来源与原始字段</summary><p>来源：${esc(p.source)} · 本机游戏数据库快照</p><pre>${esc(JSON.stringify(p.raw,null,2))}</pre></details>`:''}</div>${p.editorial?'':`<div class="stat-panel"><h3>${p.stats.length?'基础数据':'阅读提示'}</h3>${p.stats.map(([k,v])=>`<div class="stat"><span>${rich(k)}</span><b>${rich(v)}</b></div>`).join('')}${!p.editorial?`<p>${p.stats.length?'这里展示数据库基础值。实际造价与效果受游戏速度、文明能力、政策和当前地图影响。':'本文保留游戏百科的章节顺序。可用顶部搜索框继续查找相关规则。'}</p><p>${p.reviewed?'核对日期<br>'+esc(p.reviewed):'快照日期<br>2026 年 10 月 15 日'}</p>`:''}</div>`}</div>`;$('#variantSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim();document.querySelectorAll('.variant').forEach(v=>v.hidden=!v.dataset.search.includes(q));});}

function render(){const params=new URLSearchParams(location.hash.slice(1));state={section:params.get('section')||'',q:params.get('q')||'',group:params.get('group')||'',page:Math.max(1,parseInt(params.get('page'),10)||1)};$('#titleOnly').checked=params.get('titleOnly')==='1';$('#search').value=state.q;document.title='和而不同 · 文明百科';if(params.has('entry'))article(params.get('entry'));else if(state.section||state.q)results();else home();}

$('#search').addEventListener('input',e=>{clearTimeout(timer);timer=setTimeout(()=>{state.q=e.target.value;state.section='';state.group='';state.page=1;history.replaceState(null,'',route({...state.section?{section:state.section}:{},...state.q?{q:state.q}:{}}));if(!state.section&&!state.q)home();else results();},120);});

$('#titleOnly').addEventListener('change',()=>{state.page=1;if(state.q||state.section)results();});window.addEventListener('hashchange',()=>{clearTimeout(timer);render();window.scrollTo(0,0);});document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus();}});$('#total').textContent=`${listedPages.length.toLocaleString()} 条知识 · 标题优先，不搜索历史背景`;render();



// A single interactive preview panel; delegated events survive route changes.

const pop=document.createElement('section');pop.id='entryPreview';pop.hidden=true;pop.setAttribute('role','dialog');pop.setAttribute('aria-label','关联条目详情');document.body.append(pop);

let hoverOpen,hoverClose,hoverAnchor,hoverPoint;
// Prefer the pointer's right side while keeping the entire source link unobscured.
function previewPlacement(r,point,vw,vh,height){
 const margin=12,gap=14,full=Math.min(560,vw-2*margin),minimum=Math.min(320,full);
 const x=point?.x??r.right,y=point?.y??(r.top+r.bottom)/2;
 const right=Math.max(r.right,x)+gap,left=Math.min(r.left,x)-gap;
 let width=full,top,leftPos,maxHeight=Math.min(vh*.76,780),side;
 if(vw-margin-right>=minimum){side='right';leftPos=right;width=Math.min(full,vw-margin-right);}
 else if(left-margin>=minimum){side='left';width=Math.min(full,left-margin);leftPos=left-width;}
 else {
  const below=Math.max(0,vh-margin-r.bottom-gap),above=Math.max(0,r.top-gap-margin);
  side=below>=Math.min(height,maxHeight)||below>=above?'below':'above';
  maxHeight=Math.min(maxHeight,side==='below'?below:above);
  leftPos=Math.max(margin,Math.min(x+gap,vw-width-margin));
  top=side==='below'?r.bottom+gap:r.top-gap-Math.min(height,maxHeight);
 }
 if(top===undefined)top=Math.max(margin,Math.min(y-20,vh-Math.min(height,maxHeight)-margin));
 return {side,width,left:leftPos,top:Math.max(margin,top),maxHeight};
}
function positionPreview(a,point){
 const r=a.getBoundingClientRect();pop.style.width=Math.min(560,innerWidth-24)+'px';pop.style.maxHeight='';
 let pos=previewPlacement(r,point,innerWidth,innerHeight,pop.offsetHeight);
 pop.style.width=pos.width+'px';pop.style.maxHeight=pos.maxHeight+'px';
 if(pos.side==='above')pos.top=Math.max(12,r.top-14-pop.offsetHeight);
 else if(pos.side==='right'||pos.side==='left')pos.top=Math.max(12,Math.min((point?.y??(r.top+r.bottom)/2)-20,innerHeight-pop.offsetHeight-12));
 pop.style.left=pos.left+'px';pop.style.top=pos.top+'px';
}


function closePreview(){clearTimeout(hoverOpen);clearTimeout(hoverClose);pop.hidden=true;hoverAnchor=null;}

function showPreview(a,point){clearTimeout(hoverOpen);const params=new URLSearchParams(a.hash.slice(1)),id=params.get('entry'),p=byId.get(D.aliases?.[id]||id);if(!p)return;hoverAnchor=a;clearTimeout(hoverClose);pop.innerHTML=`<div class="preview-head"><span>${esc(title(sectionMap.get(p.section)?.name))}</span><button aria-label="关闭悬浮详情" class="preview-close">×</button></div><h2 class="entity-title">${entityIcon(p)}<span>${rich(p.name)}</span></h2><a class="preview-open" href="${link(p)}">打开完整条目 ↗</a><div class="preview-scroll">${beliefTypePanel(p)}${!p.editorial&&p.description?`<p>${rich(p.description)}</p>`:''}${!p.editorial&&p.stats.length?`<dl>${p.stats.map(([k,v])=>`<div><dt>${rich(k)}</dt><dd>${rich(v)}</dd></div>`).join('')}</dl>`:''}${entryPanels(p)}${boostPanel(p)}${unlockPanel(p)}${chapterPanel(p,true)}${referencesPanel(p,true)}${additionalLinks(p).length?`<h3>关联条目</h3><div class="related">${additionalLinks(p).map(l=>`<a href="${link(byId.get(l.id))}">${esc(l.label)} · ${rich(byId.get(l.id).name)} ↗</a>`).join('')}</div>`:''}</div>`;pop.hidden=false;positionPreview(a,point);pop.querySelector('.preview-close').addEventListener('click',closePreview);}

function previewTarget(e){const a=e.target.closest('a[href*="entry="]');return a&&new URLSearchParams(location.hash.slice(1)).has('entry')&&a.closest('.article-body')&&!pop.contains(a)?a:null;}

document.addEventListener('mouseover',e=>{const a=previewTarget(e);if(!a||a===hoverAnchor)return;clearTimeout(hoverOpen);clearTimeout(hoverClose);hoverPoint={anchor:a,x:e.clientX,y:e.clientY};hoverOpen=setTimeout(()=>showPreview(a,hoverPoint?.anchor===a?hoverPoint:null),700);});

document.addEventListener('mouseout',e=>{const a=previewTarget(e);if(a&&!a.contains(e.relatedTarget)){clearTimeout(hoverOpen);hoverClose=setTimeout(closePreview,280);}});

pop.addEventListener('mouseenter',()=>clearTimeout(hoverClose));pop.addEventListener('mouseleave',()=>{hoverClose=setTimeout(closePreview,280);});

document.addEventListener('focusin',e=>{const a=previewTarget(e);if(a)showPreview(a);});document.addEventListener('keydown',e=>{if(e.key==='Escape')closePreview();});document.addEventListener('pointerdown',e=>{if(!pop.contains(e.target)&&!e.target.closest('a[href*="entry="]'))closePreview();});window.addEventListener('hashchange',closePreview);window.addEventListener('resize',closePreview);


document.addEventListener('mousemove',e=>{const a=previewTarget(e);if(a)hoverPoint={anchor:a,x:e.clientX,y:e.clientY};});

// In-page reading navigation must not replace the encyclopedia's hash route.
document.addEventListener('click',e=>{const button=e.target.closest('.article-toc [data-scroll-target]');if(button)document.getElementById(button.dataset.scrollTarget)?.scrollIntoView({behavior:'smooth',block:'start'});});
