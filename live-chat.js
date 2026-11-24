/* Turbo164 shared live chat. Requires live-chat-setup.sql to be run once in Supabase. */
(() => {
  'use strict';
  const TABLE = 'community_live_chat_messages';
  const prefMuted = 'turbo164-live-chat-muted-v1';
  const prefMinimized = 'turbo164-live-chat-minimized-v1';
  const labels = {
    en: {title:'Turbo164 Community Chat',online:'One shared room',empty:'Say hello to the community.',guest:'Log in to send a message.',placeholder:'Write a message…',send:'Send',mute:'Mute message sounds',unmute:'Unmute message sounds',minimize:'Minimize chat',open:'Open community chat',setup:'Chat is getting set up. Please check back soon.',offline:'Chat is temporarily unavailable. Please try again.',login:'Log in to join the chat.',limit:'Please wait a moment before sending another message.',error:'Could not send your message. Please try again.'},
    th: {title:'แชตชุมชน Turbo164',online:'ห้องแชตรวม',empty:'ทักทายชุมชนได้เลย',guest:'เข้าสู่ระบบเพื่อส่งข้อความ',placeholder:'เขียนข้อความ…',send:'ส่ง',mute:'ปิดเสียงข้อความ',unmute:'เปิดเสียงข้อความ',minimize:'ย่อหน้าต่างแชต',open:'เปิดแชตชุมชน',setup:'กำลังตั้งค่าแชต โปรดลองใหม่ภายหลัง',offline:'แชตไม่พร้อมใช้งานชั่วคราว โปรดลองใหม่',login:'เข้าสู่ระบบเพื่อร่วมแชต',limit:'โปรดรอสักครู่ก่อนส่งข้อความถัดไป',error:'ส่งข้อความไม่สำเร็จ โปรดลองอีกครั้ง'}
  };
  const lang = () => window.T164I18N?.language === 'th' ? 'th' : 'en';
  const t = key => (labels[lang()] || labels.en)[key] || key;
  let muted = true, minimized = true, unread = 0, currentUser = null, channel = null, isReady = false, historyLoading = false, buffered = [], setupMissing = false;
  const seen = new Set();
  const profiles = Object.create(null);
  const dbRef = () => typeof db !== 'undefined' ? db : null;
  const safeGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeSet = (key,value) => { try { localStorage.setItem(key,value); } catch {} };
  muted = safeGet(prefMuted) !== '0';
  minimized = safeGet(prefMinimized) !== '0';
  const style = document.createElement('style');
  style.textContent = [
    '#t164-chat-launcher{position:fixed;z-index:1200;right:18px;bottom:calc(82px + env(safe-area-inset-bottom));width:58px;height:58px;border-radius:50%;padding:0;background:#d5a65a;color:#16120b;font-size:23px;font-weight:900;box-shadow:0 8px 28px #0008;border:2px solid #f1d49a}',
    '#t164-chat-badge{position:absolute;right:-3px;top:-5px;min-width:21px;height:21px;padding:0 5px;border-radius:999px;background:#e34e4e;color:#fff;font-size:11px;line-height:21px;text-align:center}',
    '#t164-chat-panel{position:fixed;z-index:1201;right:14px;bottom:calc(88px + env(safe-area-inset-bottom));width:min(370px,calc(100vw - 24px));height:min(540px,calc(100dvh - 112px));min-height:300px;background:#101925;border:1px solid #43536b;border-radius:18px;box-shadow:0 18px 55px #000b;display:flex;flex-direction:column;overflow:hidden;color:#f1f5fc}',
    '#t164-chat-panel[hidden],#t164-chat-launcher[hidden]{display:none!important}',
    '.t164-chat-head{display:flex;align-items:center;gap:9px;padding:12px 13px;background:#1b2737;border-bottom:1px solid #334258}',
    '.t164-chat-heading{flex:1;min-width:0}.t164-chat-heading strong{display:block;font-size:14px}.t164-chat-heading small{display:block;color:#a9b7c9;font-size:11px;margin-top:2px}',
    '.t164-chat-icon{width:34px;height:34px;border-radius:11px;background:#d5a65a;color:#17120b;display:grid;place-items:center;font-weight:900}',
    '.t164-chat-head button{padding:7px 9px;min-width:35px;font-size:14px;background:#28374b;border-radius:9px}',
    '#t164-chat-status{padding:7px 12px;color:#e2bc77;background:#151f2d;font-size:11px;min-height:28px}',
    '#t164-chat-messages{flex:1;overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;overscroll-behavior:contain}',
    '.t164-chat-empty{margin:auto;color:#9ba9bd;text-align:center;font-size:13px;padding:12px}',
    '.t164-chat-message{max-width:92%;align-self:flex-start;background:#202d3e;border:1px solid #334258;border-radius:12px 12px 12px 4px;padding:8px 10px;overflow-wrap:anywhere}',
    '.t164-chat-message.mine{align-self:flex-end;background:#3b3222;border-color:#725d38;border-radius:12px 12px 4px 12px}',
    '.t164-chat-meta{display:flex;gap:8px;align-items:center;color:#e2bc77;font-size:11px;font-weight:700;margin-bottom:4px}',
    '.t164-chat-time{color:#8f9caf;font-size:10px;font-weight:400}',
    '.t164-chat-body{font-size:13px;line-height:1.45;white-space:pre-wrap}',
    '.t164-chat-form{display:flex;gap:7px;padding:10px;border-top:1px solid #334258;background:#151f2d}',
    '.t164-chat-form input{flex:1;min-width:0;background:#0d1724;border:1px solid #46556c;border-radius:10px;padding:10px;color:#f1f5fc;font-size:13px}',
    '.t164-chat-form button{background:#d5a65a;color:#17120b;font-weight:800;padding:9px 12px;border-radius:10px}',
    '.t164-chat-form button:disabled,.t164-chat-form input:disabled{opacity:.55}',
    '@media(max-width:520px){#t164-chat-launcher{right:14px;bottom:calc(76px + env(safe-area-inset-bottom))}#t164-chat-panel{right:8px;bottom:calc(76px + env(safe-area-inset-bottom));width:calc(100vw - 16px);height:min(64dvh,560px);min-height:290px}}'
  ].join('');
  document.head.appendChild(style);
  const launcher = document.createElement('button');
  launcher.id = 't164-chat-launcher';
  launcher.type = 'button';
  launcher.setAttribute('aria-label',t('open'));
  launcher.innerHTML = '<span aria-hidden="true">💬</span><span id="t164-chat-badge" hidden></span>';
  const panel = document.createElement('section');
  panel.id = 't164-chat-panel';
  panel.setAttribute('aria-label',t('title'));
  panel.hidden = true;
  panel.innerHTML = '<div class="t164-chat-head"><div class="t164-chat-icon" aria-hidden="true">T</div><div class="t164-chat-heading"><strong id="t164-chat-title"></strong><small id="t164-chat-subtitle"></small></div><button type="button" id="t164-chat-mute"></button><button type="button" id="t164-chat-minimize"></button></div><div id="t164-chat-status" role="status" aria-live="polite"></div><div id="t164-chat-messages" aria-live="polite"></div><form id="t164-chat-form" class="t164-chat-form"><input id="t164-chat-input" maxlength="500" autocomplete="off"><button id="t164-chat-send" type="submit"></button></form>';
  document.body.append(launcher,panel);
  const $ = id => document.getElementById(id);
  function updateLabels(){
    $('t164-chat-title').textContent = t('title');
    $('t164-chat-subtitle').textContent = t('online');
    $('t164-chat-input').placeholder = t('placeholder');
    $('t164-chat-send').textContent = t('send');
    $('t164-chat-mute').textContent = muted ? '🔇' : '🔊';
    $('t164-chat-mute').title = muted ? t('unmute') : t('mute');
    $('t164-chat-mute').setAttribute('aria-label',$('t164-chat-mute').title);
    $('t164-chat-minimize').textContent = '—';
    $('t164-chat-minimize').title = t('minimize');
    $('t164-chat-minimize').setAttribute('aria-label',t('minimize'));
    launcher.setAttribute('aria-label',t('open'));
    panel.setAttribute('aria-label',t('title'));
    $('t164-chat-input').disabled = !currentUser;
    $('t164-chat-send').disabled = !currentUser;
    if(!currentUser){ $('t164-chat-input').placeholder = t('guest'); }
  }
  function setStatus(key){ $('t164-chat-status').textContent = key ? t(key) : ''; }
  function setMinimized(value){
    minimized = !!value;
    safeSet(prefMinimized,minimized ? '1' : '0');
    panel.hidden = minimized;
    launcher.hidden = !minimized;
    if(!minimized){ unread=0; updateBadge(); requestAnimationFrame(()=>{ $('t164-chat-messages').scrollTop=$('t164-chat-messages').scrollHeight; $('t164-chat-input').focus({preventScroll:true}); }); }
  }
  function updateBadge(){
    const badge=$('t164-chat-badge');
    badge.textContent=unread>99?'99+':String(unread);
    badge.hidden=unread<1;
  }
  function beep(){
    if(muted)return;
    try{
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      if(!AudioContext)return;
      const ctx=new AudioContext(), oscillator=ctx.createOscillator(), gain=ctx.createGain();
      oscillator.type='sine';oscillator.frequency.value=740;gain.gain.setValueAtTime(.035,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);oscillator.connect(gain);gain.connect(ctx.destination);
      oscillator.start();oscillator.stop(ctx.currentTime+.12);oscillator.onended=()=>ctx.close();
    }catch{}
  }
  function nameFor(id){return profiles[id]||('Collector '+String(id||'').slice(0,6));}
  function appendMessage(row,notify){
    const key=String(row.id);
    if(seen.has(key))return;
    seen.add(key);
    const mine=!!currentUser&&row.author_id===currentUser.id;
    const article=document.createElement('article');article.className='t164-chat-message'+(mine?' mine':'');
    const meta=document.createElement('div');meta.className='t164-chat-meta';
    const author=document.createElement('span');author.textContent=nameFor(row.author_id);
    const time=document.createElement('time');time.className='t164-chat-time';
    try{time.textContent=new Date(row.created_at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});}catch{time.textContent='';}
    meta.append(author,time);
    const body=document.createElement('div');body.className='t164-chat-body';body.textContent=row.body;
    article.append(meta,body);$('t164-chat-messages').appendChild(article);
    const empty=$('t164-chat-empty');if(empty)empty.remove();
    if(notify&&!mine){
      if(minimized){unread++;updateBadge();beep();}
      else requestAnimationFrame(()=>{const box=$('t164-chat-messages');box.scrollTop=box.scrollHeight;});
    }
  }
  function showEmpty(){
    if(!$('t164-chat-messages').children.length){const empty=document.createElement('div');empty.id='t164-chat-empty';empty.className='t164-chat-empty';empty.textContent=t('empty');$('t164-chat-messages').appendChild(empty);}
  }
  async function loadHistory(){
    const d=dbRef();if(!d)return;
    historyLoading=true;buffered=[];
    const {data,error}=await d.from(TABLE).select('id,author_id,body,created_at').order('created_at',{ascending:false}).limit(50);
    if(error){
      setupMissing=String(error.code||'').startsWith('PGRST')||String(error.message||'').includes('does not exist');
      setStatus(setupMissing?'setup':'offline');
      historyLoading=false;
      return;
    }
    const rows=(data||[]).reverse();
    const ids=[...new Set(rows.map(x=>x.author_id).filter(Boolean))];
    if(ids.length){
      const {data:people}=await d.from('community_profiles').select('user_id,display_name').in('user_id',ids);
      for(const p of people||[])profiles[p.user_id]=p.display_name||'';
    }
    $('t164-chat-messages').replaceChildren();
    for(const row of rows)appendMessage(row,false);
    historyLoading=false;
    buffered.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    for(const row of buffered)appendMessage(row,true);
    buffered=[];
    showEmpty();
    requestAnimationFrame(()=>{const box=$('t164-chat-messages');box.scrollTop=box.scrollHeight;});
    if(!setupMissing)setStatus('');
  }
  async function onIncoming(row){
    if(historyLoading){buffered.push(row);return;}
    if(row.author_id&&!profiles[row.author_id]){
      const d=dbRef();
      if(d){const {data}=await d.from('community_profiles').select('user_id,display_name').eq('user_id',row.author_id).maybeSingle();if(data)profiles[row.author_id]=data.display_name||'';}
    }
    appendMessage(row,true);
    const box=$('t164-chat-messages');
    while(box.children.length>100)box.firstElementChild.remove();
  }
  async function connect(){
    const d=dbRef();
    if(!d){setStatus('offline');return;}
    try{
      const {data}=await d.auth.getSession();currentUser=data.session?.user||null;updateLabels();
      if(channel)return;
      channel=d.channel('turbo164-live-chat-main').on('postgres_changes',{event:'INSERT',schema:'public',table:TABLE},payload=>onIncoming(payload.new));
      channel.subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){if(!setupMissing)setStatus('offline');}});
      await loadHistory();isReady=true;updateLabels();
    }catch{setStatus('offline');}
  }
  async function sendMessage(event){
    event.preventDefault();
    const input=$('t164-chat-input'),body=input.value.trim(),d=dbRef();
    if(!body||!d)return;
    if(!currentUser){if(typeof openLoginDialog==='function')openLoginDialog(t('login'));else setStatus('login');return;}
    const send=$('t164-chat-send');send.disabled=true;
    const {data,error}=await d.from(TABLE).insert({author_id:currentUser.id,body}).select('id,author_id,body,created_at').single();
    send.disabled=false;
    if(error){const text=String(error.message||'');setStatus(text.includes('wait a moment')? 'limit' : (setupMissing?'setup':'error'));return;}
    input.value='';
    if(data){appendMessage(data,false);requestAnimationFrame(()=>{const box=$('t164-chat-messages');box.scrollTop=box.scrollHeight;});}
  }
  launcher.addEventListener('click',()=>{setMinimized(false);connect();});
  $('t164-chat-minimize').addEventListener('click',()=>setMinimized(true));
  $('t164-chat-mute').addEventListener('click',()=>{muted=!muted;safeSet(prefMuted,muted?'1':'0');updateLabels();});
  $('t164-chat-form').addEventListener('submit',sendMessage);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)setMinimized(true);});
  window.addEventListener('turbo164:languagechange',updateLabels);
  if(dbRef()){
    dbRef().auth.onAuthStateChange((_event,newSession)=>{currentUser=newSession?.user||null;updateLabels();});
  }
  updateLabels();
  setMinimized(minimized);
})();