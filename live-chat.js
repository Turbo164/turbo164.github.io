/* Turbo164 shared live chat: media, reactions, and admin moderation. */
(() => {
  'use strict';
  const TABLE='community_live_chat_messages', REACTIONS='community_live_chat_reactions', SETTINGS='community_live_chat_settings', BLOCKS='community_live_chat_blocks', BUCKET='community-live-chat';
  const mutedKey='turbo164-live-chat-muted-v1', minimizedKey='turbo164-live-chat-minimized-v1';
  const labels={
    en:{title:'Turbo164 Community Chat',online:'One shared room',empty:'Say hello to the community.',guest:'Log in to send a message.',placeholder:'Write a message…',send:'Send',mute:'Mute message sounds',unmute:'Unmute message sounds',minimize:'Minimize chat',open:'Open community chat',setup:'Chat is getting set up. Please check back soon.',offline:'Chat is temporarily unavailable. Please try again.',login:'Log in to join the chat.',limit:'Please wait a moment before sending another message.',error:'Could not send your message. Please try again.',pauseChat:'Pause chat',resumeChat:'Resume chat',pauseReactions:'Pause reactions',resumeReactions:'Resume reactions',chatPaused:'Chat is paused by an admin.',reactionsPaused:'Reactions are paused.',blocked:'Your account is blocked from this chat.',admin:'Chat admin',blockedUsers:'Blocked users',unblock:'Unblock',block:'Block',confirmBlock:'Block this user from Turbo164 chat?',file:'Attach photo or video',fileTooBig:'Choose a file smaller than 50 MB.',fileType:'Choose an image or a supported video.',uploading:'Uploading…',choose:'Choose a photo or video',removeFile:'Remove attachment',reportError:'Could not update chat settings.',noBlocked:'No blocked users.',loginReact:'Log in to react.',reactError:'Could not save your reaction.',textOrMedia:'Add a message or attach a photo/video.',imageAlt:'Shared photo',videoAlt:'Shared video',deleteMessage:'Delete',confirmDelete:'Delete this message from the chat?',deleteError:'Could not delete your message. Please try again.'},
    th:{title:'แชตชุมชน Turbo164',online:'ห้องแชตรวม',empty:'ทักทายชุมชนได้เลย',guest:'เข้าสู่ระบบเพื่อส่งข้อความ',placeholder:'เขียนข้อความ…',send:'ส่ง',mute:'ปิดเสียงข้อความ',unmute:'เปิดเสียงข้อความ',minimize:'ย่อหน้าต่างแชต',open:'เปิดแชตชุมชน',setup:'กำลังตั้งค่าแชต โปรดลองใหม่ภายหลัง',offline:'แชตไม่พร้อมใช้งานชั่วคราว โปรดลองใหม่',login:'เข้าสู่ระบบเพื่อร่วมแชต',limit:'โปรดรอสักครู่ก่อนส่งข้อความถัดไป',error:'ส่งข้อความไม่สำเร็จ โปรดลองอีกครั้ง',pauseChat:'หยุดแชต',resumeChat:'เปิดแชตอีกครั้ง',pauseReactions:'หยุดรีแอ็กชัน',resumeReactions:'เปิดรีแอ็กชันอีกครั้ง',chatPaused:'ผู้ดูแลหยุดแชตชั่วคราว',reactionsPaused:'รีแอ็กชันถูกหยุดชั่วคราว',blocked:'บัญชีของคุณถูกบล็อกจากแชตนี้',admin:'ผู้ดูแลแชต',blockedUsers:'ผู้ใช้ที่ถูกบล็อก',unblock:'ปลดบล็อก',block:'บล็อก',confirmBlock:'บล็อกผู้ใช้นี้จากแชต Turbo164 หรือไม่?',file:'แนบรูปภาพหรือวิดีโอ',fileTooBig:'เลือกไฟล์ที่มีขนาดต่ำกว่า 50 MB',fileType:'เลือกภาพหรือวิดีโอที่รองรับ',uploading:'กำลังอัปโหลด…',choose:'เลือกรูปภาพหรือวิดีโอ',removeFile:'นำไฟล์แนบออก',reportError:'อัปเดตการตั้งค่าแชตไม่สำเร็จ',noBlocked:'ไม่มีผู้ใช้ที่ถูกบล็อก',loginReact:'เข้าสู่ระบบเพื่อรีแอ็กชัน',reactError:'บันทึกรีแอ็กชันไม่สำเร็จ',textOrMedia:'เขียนข้อความหรือแนบรูปภาพ/วิดีโอ',imageAlt:'รูปภาพที่แชร์',videoAlt:'วิดีโอที่แชร์',deleteMessage:'ลบ',confirmDelete:'ลบข้อความนี้ออกจากแชตหรือไม่?',deleteError:'ลบข้อความไม่สำเร็จ โปรดลองอีกครั้ง'}
  };
  const lang=()=>window.T164I18N?.language==='th'?'th':'en', t=k=>(labels[lang()]||labels.en)[k]||k;
  const allowedMimes=['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'];
  const emojiList=['👍','❤️','😂','😮','🔥'];
  let muted=true,minimized=true,unread=0,currentUser=null,channel=null,historyLoading=false,buffered=[],setupMissing=false,chatPaused=false,reactionsPaused=false,isAdmin=false,blockedSelf=false,settingsReady=false,selectedFile=null;
  const seen=new Set(),profiles=Object.create(null),blockedUsers=new Map(),reactionState=new Map();
  const dbRef=()=>typeof db!=='undefined'?db:null;
  const getPref=k=>{try{return localStorage.getItem(k)}catch{return null}}, setPref=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
  muted=getPref(mutedKey)!=='0'; minimized=getPref(minimizedKey)!=='0';
  const style=document.createElement('style');
  style.textContent=[
    '#t164-chat-launcher{position:fixed;z-index:1200;right:18px;bottom:calc(82px + env(safe-area-inset-bottom));width:58px;height:58px;border-radius:50%;padding:0;background:#d5a65a;color:#16120b;font-size:23px;font-weight:900;box-shadow:0 8px 28px #0008;border:2px solid #f1d49a}',
    '#t164-chat-badge{position:absolute;right:-3px;top:-5px;min-width:21px;height:21px;padding:0 5px;border-radius:999px;background:#e34e4e;color:white;font-size:11px;line-height:21px;text-align:center}',
    '#t164-chat-panel{position:fixed;z-index:1201;right:14px;bottom:calc(88px + env(safe-area-inset-bottom));width:min(390px,calc(100vw - 24px));height:min(600px,calc(100dvh - 112px));min-height:320px;background:#101925;border:1px solid #43536b;border-radius:18px;box-shadow:0 18px 55px #000b;display:flex;flex-direction:column;overflow:hidden;color:#f1f5fc}',
    '#t164-chat-panel[hidden],#t164-chat-launcher[hidden]{display:none!important}',
    '.t164-chat-head{display:flex;align-items:center;gap:7px;padding:10px;background:#1b2737;border-bottom:1px solid #334258}',
    '.t164-chat-heading{flex:1;min-width:0}.t164-chat-heading strong{display:block;font-size:13px}.t164-chat-heading small{display:block;color:#a9b7c9;font-size:10px;margin-top:2px}',
    '.t164-chat-icon{width:32px;height:32px;border-radius:10px;background:#d5a65a;color:#17120b;display:grid;place-items:center;font-weight:900}',
    '.t164-chat-head button,.t164-admin-controls button{padding:7px 8px;min-width:32px;font-size:12px;background:#28374b;border-radius:9px;color:#fff}',
    '#t164-chat-status{padding:6px 11px;color:#e2bc77;background:#151f2d;font-size:11px;min-height:26px}',
    '#t164-chat-admin-controls{padding:9px;background:#121c29;border-bottom:1px solid #334258;max-height:170px;overflow:auto}',
    '.t164-admin-controls{display:flex;gap:6px;flex-wrap:wrap}.t164-admin-controls button.active{background:#8a3737}',
    '#t164-chat-blocked-list{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px;font-size:11px;color:#b9c5d5}',
    '.t164-blocked-chip{display:inline-flex;gap:5px;align-items:center;background:#263246;border-radius:999px;padding:4px 7px}.t164-blocked-chip button{padding:3px 6px;background:#3a4a61;font-size:10px}',
    '#t164-chat-messages{flex:1;overflow:auto;padding:10px 11px;display:flex;flex-direction:column;gap:8px;overscroll-behavior:contain}',
    '.t164-chat-empty{margin:auto;color:#9ba9bd;text-align:center;font-size:13px;padding:12px}',
    '.t164-chat-message{max-width:96%;align-self:flex-start;background:#202d3e;border:1px solid #334258;border-radius:12px 12px 12px 4px;padding:8px 9px;overflow-wrap:anywhere}',
    '.t164-chat-message.mine{align-self:flex-end;background:#3b3222;border-color:#725d38;border-radius:12px 12px 4px 12px}',
    '.t164-chat-meta{display:flex;gap:7px;align-items:center;color:#e2bc77;font-size:11px;font-weight:700;margin-bottom:4px}',
    '.t164-chat-delete{margin-left:auto;padding:3px 6px;border-radius:7px;background:#28374b;color:#d6e2f2;font-size:10px;font-weight:600}',
    '.t164-chat-time{color:#8f9caf;font-size:10px;font-weight:400}',
    '.t164-chat-body{font-size:13px;line-height:1.45;white-space:pre-wrap}',
    '.t164-chat-media{display:block;max-width:min(260px,68vw);max-height:240px;width:auto;height:auto;object-fit:contain;border-radius:9px;margin:5px 0;background:#0b0f17}.t164-chat-media-video{width:min(270px,70vw)}',
    '.t164-chat-reactions{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}.t164-chat-reactions button{padding:3px 6px;border:1px solid #43536b;border-radius:999px;background:#172232;color:#fff;font-size:11px}.t164-chat-reactions button[aria-pressed=true]{border-color:#e2bc77;background:#51432c}.t164-chat-reactions button:disabled{opacity:.55}',
    '.t164-chat-block-user{margin-top:5px;padding:3px 6px;border-radius:7px;background:#34445a;color:#d6e2f2;font-size:10px}',
    '.t164-chat-form{display:flex;gap:6px;padding:8px;border-top:1px solid #334258;background:#151f2d;align-items:center}',
    '.t164-chat-form input[type=text]{flex:1;min-width:0;background:#0d1724;border:1px solid #46556c;border-radius:10px;padding:9px;color:#f1f5fc;font-size:13px}',
    '.t164-chat-form button{background:#d5a65a;color:#17120b;font-weight:800;padding:8px 10px;border-radius:10px;font-size:13px}',
    '.t164-chat-form button:disabled,.t164-chat-form input:disabled{opacity:.55}.t164-chat-file{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;clip:rect(0,0,0,0)}',
    '#t164-chat-selected{padding:4px 11px;color:#b9c5d5;background:#151f2d;font-size:11px}',
    '@media(max-width:520px){#t164-chat-launcher{right:14px;bottom:calc(76px + env(safe-area-inset-bottom))}#t164-chat-panel{right:8px;bottom:calc(76px + env(safe-area-inset-bottom));width:calc(100vw - 16px);height:min(68dvh,610px);min-height:300px}}'
  ].join('');
  document.head.appendChild(style);
  const launcher=document.createElement('button');launcher.id='t164-chat-launcher';launcher.type='button';launcher.setAttribute('aria-label',t('open'));launcher.innerHTML='<span aria-hidden="true">💬</span><span id="t164-chat-badge" hidden></span>';
  const panel=document.createElement('section');panel.id='t164-chat-panel';panel.setAttribute('aria-label',t('title'));panel.hidden=true;
  panel.innerHTML='<div class="t164-chat-head"><div class="t164-chat-icon" aria-hidden="true">T</div><div class="t164-chat-heading"><strong id="t164-chat-title"></strong><small id="t164-chat-subtitle"></small></div><button type="button" id="t164-chat-admin" hidden>⚙</button><button type="button" id="t164-chat-mute"></button><button type="button" id="t164-chat-minimize">—</button></div><div id="t164-chat-status" role="status" aria-live="polite"></div><div id="t164-chat-admin-controls" hidden><div class="t164-admin-controls"><button type="button" id="t164-chat-pause"></button><button type="button" id="t164-react-pause"></button></div><div id="t164-chat-blocked-list"></div></div><div id="t164-chat-messages" aria-live="polite"></div><div id="t164-chat-selected" hidden></div><form id="t164-chat-form" class="t164-chat-form"><button type="button" id="t164-chat-attach">📎</button><input class="t164-chat-file" id="t164-chat-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"><input id="t164-chat-input" type="text" maxlength="500" autocomplete="off"><button id="t164-chat-send" type="submit"></button></form>';
  document.body.append(launcher,panel);
  const $=id=>document.getElementById(id), setStatus=text=>$('t164-chat-status').textContent=text||'';
  function statusMessage(){
    if(setupMissing)return t('setup');
    if(blockedSelf)return t('blocked');
    if(chatPaused)return t('chatPaused');
    if(reactionsPaused)return t('reactionsPaused');
    return '';
  }
  function updateLabels(){
    $('t164-chat-title').textContent=t('title');$('t164-chat-subtitle').textContent=t('online');
    $('t164-chat-input').placeholder=currentUser?t('placeholder'):t('guest');
    $('t164-chat-send').textContent=t('send');$('t164-chat-attach').title=t('file');$('t164-chat-attach').setAttribute('aria-label',t('file'));
    $('t164-chat-mute').textContent=muted?'🔇':'🔊';$('t164-chat-mute').title=muted?t('unmute'):t('mute');$('t164-chat-mute').setAttribute('aria-label',$('t164-chat-mute').title);
    $('t164-chat-minimize').title=t('minimize');$('t164-chat-minimize').setAttribute('aria-label',t('minimize'));
    $('t164-chat-pause').textContent=chatPaused?t('resumeChat'):t('pauseChat');$('t164-chat-pause').classList.toggle('active',chatPaused);
    $('t164-react-pause').textContent=reactionsPaused?t('resumeReactions'):t('pauseReactions');$('t164-react-pause').classList.toggle('active',reactionsPaused);
    $('t164-chat-admin').hidden=!isAdmin;$('t164-chat-admin').title=t('admin');$('t164-chat-admin').setAttribute('aria-label',t('admin'));
    launcher.setAttribute('aria-label',t('open'));panel.setAttribute('aria-label',t('title'));
    const disabled=!currentUser||chatPaused||blockedSelf;
    $('t164-chat-input').disabled=disabled;$('t164-chat-send').disabled=disabled;$('t164-chat-attach').disabled=disabled;
    if(!selectedFile)$('t164-chat-file').disabled=disabled;
    const msg=statusMessage();if(msg)setStatus(msg);
    renderAllReactionBars();
    renderBlockedList();
  }
  function setMinimized(value){
    minimized=!!value;setPref(minimizedKey,minimized?'1':'0');panel.hidden=minimized;launcher.hidden=!minimized;
    if(!minimized){unread=0;updateBadge();requestAnimationFrame(()=>{$('t164-chat-messages').scrollTop=$('t164-chat-messages').scrollHeight;$('t164-chat-input').focus({preventScroll:true});});}
  }
  function updateBadge(){const badge=$('t164-chat-badge');badge.textContent=unread>99?'99+':String(unread);badge.hidden=unread<1;}
  function beep(){
    if(muted)return;
    try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC(),o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=740;g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.12);o.onended=()=>ctx.close();}catch{}
  }
  function nameFor(id){return profiles[id]||('Collector '+String(id||'').slice(0,6));}
  function reactionData(id){if(!reactionState.has(String(id)))reactionState.set(String(id),{counts:Object.create(null),own:new Set()});return reactionState.get(String(id));}
  async function loadReactions(ids){
    if(!ids.length)return;
    const d=dbRef(),{data,error}=await d.from(REACTIONS).select('message_id,user_id,reaction').in('message_id',ids);
    if(error)return;
    for(const row of data||[]){const state=reactionData(row.message_id);state.counts[row.reaction]=(state.counts[row.reaction]||0)+1;if(currentUser&&row.user_id===currentUser.id)state.own.add(row.reaction);}
    for(const id of ids)renderReactionBar(id);
  }
  function renderReactionBar(messageId){
    const bar=document.getElementById('t164-chat-reactions-'+messageId);if(!bar)return;
    const state=reactionData(messageId);bar.replaceChildren();
    for(const emoji of emojiList){
      const button=document.createElement('button');button.type='button';button.textContent=emoji+(state.counts[emoji]?' '+state.counts[emoji]:'');
      button.setAttribute('aria-pressed',String(state.own.has(emoji)));
      button.disabled=!currentUser||reactionsPaused||blockedSelf;
      button.title=!currentUser?t('loginReact'):reactionsPaused?t('reactionsPaused'):emoji;
      button.addEventListener('click',()=>toggleReaction(messageId,emoji));bar.appendChild(button);
    }
  }
  function renderAllReactionBars(){document.querySelectorAll('.t164-chat-reactions').forEach(bar=>renderReactionBar(bar.dataset.messageId));}
  async function toggleReaction(messageId,emoji){
    const d=dbRef();if(!currentUser){if(typeof openLoginDialog==='function')openLoginDialog(t('loginReact'));return;}
    if(reactionsPaused||blockedSelf)return;
    const state=reactionData(messageId);
    let result;
    if(state.own.has(emoji))result=await d.from(REACTIONS).delete().eq('message_id',messageId).eq('user_id',currentUser.id).eq('reaction',emoji);
    else result=await d.from(REACTIONS).insert({message_id:messageId,user_id:currentUser.id,reaction:emoji});
    if(result.error){setStatus(t('reactError'));return;}
    const {data}=await d.from(REACTIONS).select('message_id,user_id,reaction').eq('message_id',messageId);
    if(data){const next={counts:Object.create(null),own:new Set()};for(const row of data){next.counts[row.reaction]=(next.counts[row.reaction]||0)+1;if(row.user_id===currentUser.id)next.own.add(row.reaction);}reactionState.set(String(messageId),next);renderReactionBar(messageId);}
  }
  function addMedia(article,row){
    if(!row.media_path)return;
    const d=dbRef();if(!d)return;
    const url=d.storage.from(BUCKET).getPublicUrl(row.media_path).data.publicUrl;
    if(row.media_type==='video'){
      const video=document.createElement('video');video.className='t164-chat-media t164-chat-media-video';video.controls=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-label',t('videoAlt'));
      const source=document.createElement('source');source.src=url;video.appendChild(source);article.appendChild(video);
    }else{
      const img=document.createElement('img');img.className='t164-chat-media';img.src=url;img.alt=t('imageAlt');img.loading='lazy';article.appendChild(img);
    }
  }
  async function setBlocked(userId,block){
    if(!isAdmin||!userId||userId===currentUser?.id)return;
    const d=dbRef();
    if(block&&!window.confirm(t('confirmBlock')))return;
    const result=block?await d.from(BLOCKS).insert({blocked_user_id:userId,blocked_by:currentUser.id}):await d.from(BLOCKS).delete().eq('blocked_user_id',userId);
    if(result.error){setStatus(t('reportError'));return;}
    await refreshBlocks();
    const existing=document.querySelectorAll('[data-chat-author="'+CSS.escape(userId)+'"]');
    existing.forEach(el=>{const button=el.querySelector('.t164-chat-block-user');if(button){button.textContent=blockedUsers.has(userId)?t('unblock'):t('block');button.onclick=()=>setBlocked(userId,!blockedUsers.has(userId));}});
    updateLabels();
  }
  function appendMessage(row,notify){
    const key=String(row.id);if(seen.has(key))return;seen.add(key);
    const mine=!!currentUser&&row.author_id===currentUser.id;
    const article=document.createElement('article');article.className='t164-chat-message'+(mine?' mine':'');article.id='t164-chat-message-'+key;article.dataset.messageId=key;article.dataset.chatAuthor=row.author_id||'';
    const meta=document.createElement('div');meta.className='t164-chat-meta';
    const author=document.createElement('span');author.textContent=nameFor(row.author_id);
    const time=document.createElement('time');time.className='t164-chat-time';try{time.textContent=new Date(row.created_at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});}catch{}
    meta.append(author,time);
    if(mine){const remove=document.createElement('button');remove.type='button';remove.className='t164-chat-delete';remove.textContent=t('deleteMessage');remove.setAttribute('aria-label',t('deleteMessage'));remove.addEventListener('click',()=>deleteOwnMessage(row,remove));meta.appendChild(remove);}
    article.appendChild(meta);
    if(row.body){const body=document.createElement('div');body.className='t164-chat-body';body.textContent=row.body;article.appendChild(body);}
    addMedia(article,row);
    const reactions=document.createElement('div');reactions.className='t164-chat-reactions';reactions.id='t164-chat-reactions-'+row.id;reactions.dataset.messageId=String(row.id);article.appendChild(reactions);
    if(isAdmin&&!mine){
      const action=document.createElement('button');action.type='button';action.className='t164-chat-block-user';action.textContent=blockedUsers.has(row.author_id)?t('unblock'):t('block');action.onclick=()=>setBlocked(row.author_id,!blockedUsers.has(row.author_id));article.appendChild(action);
    }
    $('t164-chat-messages').appendChild(article);renderReactionBar(row.id);
    const empty=$('t164-chat-empty');if(empty)empty.remove();
    if(notify&&!mine){if(minimized){unread++;updateBadge();beep();}else requestAnimationFrame(()=>{$('t164-chat-messages').scrollTop=$('t164-chat-messages').scrollHeight;});}
  }
  function removeMessage(messageId){
    if(messageId==null)return;
    const key=String(messageId);seen.delete(key);reactionState.delete(key);
    document.getElementById('t164-chat-message-'+key)?.remove();showEmpty();
  }
  async function deleteOwnMessage(row,button){
    if(!currentUser||row.author_id!==currentUser.id)return;
    if(!window.confirm(t('confirmDelete')))return;
    button.disabled=true;
    const d=dbRef(),{data,error}=await d.from(TABLE).delete().eq('id',row.id).eq('author_id',currentUser.id).select('id').maybeSingle();
    if(error||!data){setStatus(t('deleteError'));button.disabled=false;return;}
    removeMessage(row.id);
    if(row.media_path){const {error:mediaError}=await d.storage.from(BUCKET).remove([row.media_path]);if(mediaError)setStatus(t('deleteError'));}
  }
  function showEmpty(){if(!$('t164-chat-messages').children.length){const empty=document.createElement('div');empty.id='t164-chat-empty';empty.className='t164-chat-empty';empty.textContent=t('empty');$('t164-chat-messages').appendChild(empty);}}
  async function loadHistory(){
    const d=dbRef();if(!d)return;
    historyLoading=true;buffered=[];
    const {data,error}=await d.from(TABLE).select('id,author_id,body,media_path,media_type,created_at').order('created_at',{ascending:false}).limit(50);
    if(error){setupMissing=String(error.code||'').startsWith('PGRST')||String(error.message||'').includes('does not exist');setStatus(setupMissing?'setup':'offline');historyLoading=false;return;}
    const rows=(data||[]).reverse(),ids=[...new Set(rows.map(x=>x.author_id).filter(Boolean))];
    if(ids.length){const {data:people}=await d.from('community_profiles').select('user_id,display_name').in('user_id',ids);for(const p of people||[])profiles[p.user_id]=p.display_name||'';}
    $('t164-chat-messages').replaceChildren();for(const row of rows)appendMessage(row,false);
    await loadReactions(rows.map(x=>x.id));
    historyLoading=false;buffered.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));for(const row of buffered)appendMessage(row,true);buffered=[];showEmpty();
    requestAnimationFrame(()=>{$('t164-chat-messages').scrollTop=$('t164-chat-messages').scrollHeight;});if(!setupMissing)setStatus(statusMessage());
  }
  async function onIncoming(row){
    if(historyLoading){buffered.push(row);return;}
    if(row.author_id&&!profiles[row.author_id]){const d=dbRef();if(d){const {data}=await d.from('community_profiles').select('user_id,display_name').eq('user_id',row.author_id).maybeSingle();if(data)profiles[row.author_id]=data.display_name||'';}}
    appendMessage(row,true);const box=$('t164-chat-messages');while(box.children.length>100)box.firstElementChild.remove();
  }
  async function refreshSettings(){
    const d=dbRef();if(!d)return;
    const {data,error}=await d.from(SETTINGS).select('chat_paused,reactions_paused').eq('id',true).maybeSingle();
    if(error){settingsReady=false;setupMissing=String(error.code||'').startsWith('PGRST');return;}
    settingsReady=true;chatPaused=!!data?.chat_paused;reactionsPaused=!!data?.reactions_paused;updateLabels();
  }
  async function refreshBlocks(){
    const d=dbRef();if(!d)return;
    const {data,error}=await d.from(BLOCKS).select('blocked_user_id,created_at');
    if(error)return;
    blockedUsers.clear();blockedSelf=false;
    for(const row of data||[]){blockedUsers.set(row.blocked_user_id,row.created_at);if(row.blocked_user_id===currentUser?.id)blockedSelf=true;}
    renderBlockedList();
    document.querySelectorAll('.t164-chat-message').forEach(el=>{const id=el.dataset.chatAuthor,btn=el.querySelector('.t164-chat-block-user');if(btn){btn.textContent=blockedUsers.has(id)?t('unblock'):t('block');}});
    updateLabels();
  }
  async function refreshAdmin(){
    const d=dbRef();if(!d||!currentUser){isAdmin=false;updateLabels();return;}
    const {data,error}=await d.rpc('is_arbox_photo_admin');isAdmin=!error&&data===true;updateLabels();
    await refreshBlocks();
  }
  async function updateSetting(field,value){
    if(!isAdmin||!currentUser)return;
    const {error}=await dbRef().from(SETTINGS).update({[field]:value,updated_by:currentUser.id}).eq('id',true);
    if(error){setStatus(t('reportError'));return;}
    if(field==='chat_paused')chatPaused=value;else reactionsPaused=value;
    updateLabels();
  }
  async function connect(){
    const d=dbRef();if(!d){setStatus(t('offline'));return;}
    try{
      const {data}=await d.auth.getSession();currentUser=data.session?.user||null;
      await refreshAdmin();await refreshSettings();await refreshBlocks();
      if(channel)return;
      channel=d.channel('turbo164-live-chat-main')
        .on('postgres_changes',{event:'INSERT',schema:'public',table:TABLE},payload=>onIncoming(payload.new))
        .on('postgres_changes',{event:'DELETE',schema:'public',table:TABLE},payload=>removeMessage(payload.old?.id))
        .on('postgres_changes',{event:'*',schema:'public',table:REACTIONS},payload=>handleReactionEvent(payload))
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:SETTINGS},()=>refreshSettings());
      channel.subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){if(!setupMissing)setStatus(t('offline'));}});
      await loadHistory();
    }catch{setStatus(t('offline'));}
  }
  function handleReactionEvent(payload){
    const row=payload.eventType==='DELETE'?payload.old:payload.new;if(!row?.message_id)return;
    const state=reactionData(row.message_id),emoji=row.reaction;
    if(!emoji)return;
    if(payload.eventType==='DELETE'){
      state.counts[emoji]=Math.max(0,(state.counts[emoji]||0)-1);if(!state.counts[emoji])delete state.counts[emoji];
      if(currentUser&&row.user_id===currentUser.id)state.own.delete(emoji);
    }else{
      state.counts[emoji]=(state.counts[emoji]||0)+1;if(currentUser&&row.user_id===currentUser.id)state.own.add(emoji);
    }
    renderReactionBar(row.message_id);
  }
  function fileExtension(file){
    const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov'};
    return extensions[file.type]||'bin';
  }
  async function sendMessage(event){
    event.preventDefault();
    const input=$('t164-chat-input'),body=input.value.trim(),d=dbRef(),file=selectedFile;
    if(!body&&!file){setStatus(t('textOrMedia'));return;}
    if(!currentUser){if(typeof openLoginDialog==='function')openLoginDialog(t('login'));return;}
    if(chatPaused||blockedSelf)return;
    let mediaPath=null,mediaType=null;
    const send=$('t164-chat-send');send.disabled=true;$('t164-chat-attach').disabled=true;
    if(file){
      if(file.size>50*1024*1024){setStatus(t('fileTooBig'));send.disabled=false;updateLabels();return;}
      if(!allowedMimes.includes(file.type)){setStatus(t('fileType'));send.disabled=false;updateLabels();return;}
      setStatus(t('uploading'));
      mediaType=file.type.startsWith('video/')?'video':'image';
      mediaPath=currentUser.id+'/'+crypto.randomUUID()+'.'+fileExtension(file);
      const {error:uploadError}=await d.storage.from(BUCKET).upload(mediaPath,file,{cacheControl:'3600',upsert:false,contentType:file.type});
      if(uploadError){setStatus(t('error'));send.disabled=false;updateLabels();return;}
    }
    const {data,error}=await d.from(TABLE).insert({author_id:currentUser.id,body,media_path:mediaPath,media_type:mediaType}).select('id,author_id,body,media_path,media_type,created_at').single();
    send.disabled=false;
    if(error){
      if(mediaPath)await d.storage.from(BUCKET).remove([mediaPath]);
      const text=String(error.message||'');setStatus(text.includes('wait a moment')?t('limit'):setupMissing?t('setup'):t('error'));updateLabels();return;
    }
    input.value='';selectedFile=null;$('t164-chat-file').value='';$('t164-chat-selected').hidden=true;$('t164-chat-selected').textContent='';
    setStatus(statusMessage());updateLabels();
    if(data){appendMessage(data,false);requestAnimationFrame(()=>{$('t164-chat-messages').scrollTop=$('t164-chat-messages').scrollHeight;});}
  }
  function renderBlockedList(){
    const list=$('t164-chat-blocked-list');if(!list)return;
    list.replaceChildren();list.hidden=!isAdmin;if(!isAdmin)return;
    const title=document.createElement('strong');title.textContent=t('blockedUsers')+': ';list.appendChild(title);
    if(!blockedUsers.size){const empty=document.createElement('span');empty.textContent=t('noBlocked');list.appendChild(empty);return;}
    for(const userId of blockedUsers.keys()){
      const chip=document.createElement('span');chip.className='t164-blocked-chip';
      const name=document.createElement('span');name.textContent=nameFor(userId);chip.appendChild(name);
      const button=document.createElement('button');button.type='button';button.textContent=t('unblock');button.onclick=()=>setBlocked(userId,false);chip.appendChild(button);list.appendChild(chip);
    }
  }
  async function onFilePicked(){
    const file=$('t164-chat-file').files?.[0];if(!file){selectedFile=null;$('t164-chat-selected').hidden=true;return;}
    if(file.size>50*1024*1024){setStatus(t('fileTooBig'));$('t164-chat-file').value='';selectedFile=null;return;}
    if(!allowedMimes.includes(file.type)){setStatus(t('fileType'));$('t164-chat-file').value='';selectedFile=null;return;}
    selectedFile=file;$('t164-chat-selected').hidden=false;$('t164-chat-selected').textContent=t('choose')+': '+file.name+'  ×';
    $('t164-chat-selected').title=t('removeFile');
    updateLabels();
  }
  launcher.addEventListener('click',()=>{setMinimized(false);connect();});
  $('t164-chat-minimize').addEventListener('click',()=>setMinimized(true));
  $('t164-chat-mute').addEventListener('click',()=>{muted=!muted;setPref(mutedKey,muted?'1':'0');updateLabels();});
  $('t164-chat-admin').addEventListener('click',()=>{$('t164-chat-admin-controls').hidden=!$('t164-chat-admin-controls').hidden;});
  $('t164-chat-pause').addEventListener('click',()=>updateSetting('chat_paused',!chatPaused));
  $('t164-react-pause').addEventListener('click',()=>updateSetting('reactions_paused',!reactionsPaused));
  $('t164-chat-attach').addEventListener('click',()=>{if(currentUser&&!chatPaused&&!blockedSelf)$('t164-chat-file').click();});
  $('t164-chat-file').addEventListener('change',onFilePicked);
  $('t164-chat-selected').addEventListener('click',()=>{selectedFile=null;$('t164-chat-file').value='';$('t164-chat-selected').hidden=true;$('t164-chat-selected').textContent='';updateLabels();});
  $('t164-chat-form').addEventListener('submit',sendMessage);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)setMinimized(true);});
  window.addEventListener('turbo164:languagechange',updateLabels);
  if(dbRef())dbRef().auth.onAuthStateChange((_event,newSession)=>{currentUser=newSession?.user||null;refreshAdmin();refreshSettings();refreshBlocks();updateLabels();});
  updateLabels();setMinimized(minimized);
})();