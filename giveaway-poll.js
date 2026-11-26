/* Turbo164 monthly giveaway polls. Poll creation is admin-only; signed-in users can vote once and change their vote while open. */
(()=>{
 'use strict';
 const POLLS='community_giveaway_polls',OPTIONS='community_giveaway_poll_options',BUCKET='community-giveaway-polls';
 const rootId='t164-giveaway-poll';
 const copy={
  en:{title:'Monthly giveaway poll',noPoll:'There is no giveaway poll yet.',create:'Create a poll',question:'Poll question',choices:'Voting choices',choice:'Choice',addChoice:'Add choice',photo:'Giveaway car photo (optional)',selectPhoto:'Choose a car photo',publish:'Publish poll',vote:'Submit vote',changeVote:'You can change your vote while the poll is open.',closed:'Voting is closed.',login:'Log in to vote.',close:'Close poll',confirmClose:'Close this poll? Members will no longer be able to vote.',empty:'Add a question and at least two choices.',choiceError:'Add 2 to 8 choices, each with text.',photoError:'Choose an image under 12 MB.',loadError:'Could not load the poll. Please try again.',voteError:'Could not save your vote. Please try again.',createError:'Could not publish the poll. Please try again.',closeError:'Could not close the poll. Please try again.',pollPublished:'Poll published.',voteSaved:'Your vote has been saved.',pollClosed:'Poll closed.',total:'votes',loading:'Loading poll…'},
  th:{title:'โหวตของรางวัลประจำเดือน',noPoll:'ยังไม่มีแบบสำรวจของรางวัล',create:'สร้างแบบสำรวจ',question:'คำถาม',choices:'ตัวเลือกโหวต',choice:'ตัวเลือก',addChoice:'เพิ่มตัวเลือก',photo:'รูปรถของรางวัล (ไม่บังคับ)',selectPhoto:'เลือกรูปรถ',publish:'เผยแพร่แบบสำรวจ',vote:'ส่งคะแนนโหวต',changeVote:'เปลี่ยนคะแนนได้ขณะที่แบบสำรวจยังเปิดอยู่',closed:'ปิดรับโหวตแล้ว',login:'เข้าสู่ระบบเพื่อโหวต',close:'ปิดแบบสำรวจ',confirmClose:'ปิดแบบสำรวจนี้หรือไม่ สมาชิกจะโหวตไม่ได้อีก',empty:'เพิ่มคำถามและตัวเลือกอย่างน้อยสองข้อ',choiceError:'เพิ่มตัวเลือก 2 ถึง 8 ข้อ และกรอกข้อความให้ครบ',photoError:'เลือกรูปภาพขนาดไม่เกิน 12 MB',loadError:'โหลดแบบสำรวจไม่สำเร็จ โปรดลองอีกครั้ง',voteError:'บันทึกคะแนนไม่สำเร็จ โปรดลองอีกครั้ง',createError:'เผยแพร่แบบสำรวจไม่สำเร็จ โปรดลองอีกครั้ง',closeError:'ปิดแบบสำรวจไม่สำเร็จ โปรดลองอีกครั้ง',pollPublished:'เผยแพร่แบบสำรวจแล้ว',voteSaved:'บันทึกคะแนนของคุณแล้ว',pollClosed:'ปิดแบบสำรวจแล้ว',total:'คะแนน',loading:'กำลังโหลดแบบสำรวจ…'},
  ja:{title:'今月のプレゼント投票',noPoll:'現在、プレゼント投票はありません。',create:'投票を作成',question:'投票の質問',choices:'選択肢',choice:'選択肢',addChoice:'選択肢を追加',photo:'プレゼントの車の写真（任意）',selectPhoto:'車の写真を選択',publish:'投票を公開',vote:'投票する',changeVote:'投票中は選択を変更できます。',closed:'投票は終了しました。',login:'投票するにはログインしてください。',close:'投票を終了',confirmClose:'この投票を終了しますか？終了後は投票できません。',empty:'質問と2つ以上の選択肢を入力してください。',choiceError:'2〜8個の選択肢を入力してください。',photoError:'12 MB以下の画像を選択してください。',loadError:'投票を読み込めませんでした。もう一度お試しください。',voteError:'投票を保存できませんでした。',createError:'投票を公開できませんでした。',closeError:'投票を終了できませんでした。',pollPublished:'投票を公開しました。',voteSaved:'投票を保存しました。',pollClosed:'投票を終了しました。',total:'票',loading:'投票を読み込み中…'},
  zh:{title:'本月赠车投票',noPoll:'目前没有赠车投票。',create:'创建投票',question:'投票问题',choices:'投票选项',choice:'选项',addChoice:'添加选项',photo:'赠送车辆照片（可选）',selectPhoto:'选择车辆照片',publish:'发布投票',vote:'提交投票',changeVote:'投票开放期间可以更改选择。',closed:'投票已结束。',login:'登录后即可投票。',close:'结束投票',confirmClose:'结束此投票？结束后用户将无法继续投票。',empty:'请填写问题并至少添加两个选项。',choiceError:'请添加2至8个文字选项。',photoError:'请选择小于12 MB的图片。',loadError:'无法加载投票，请重试。',voteError:'无法保存投票，请重试。',createError:'无法发布投票，请重试。',closeError:'无法结束投票，请重试。',pollPublished:'投票已发布。',voteSaved:'已保存您的投票。',pollClosed:'投票已结束。',total:'票',loading:'正在加载投票…'}
 };
 const t=k=>(copy[window.T164I18N?.language]||copy.en)[k]||copy.en[k]||k;
 const getDb=()=>typeof db!=='undefined'?db:null;
 const user=()=>typeof session!=='undefined'?session?.user||null:null;
 let root=null,isAdmin=false,currentMode='feed',selectedOption=null,activePoll=null;
 const style=document.createElement('style');
 style.textContent='#t164-giveaway-poll{margin:14px 0;padding:16px;border:1px solid #9c763c;border-radius:16px;background:linear-gradient(135deg,#1a2635,#111a27);color:#f1f5fc}#t164-giveaway-poll h2,#t164-giveaway-poll h3{margin:0 0 10px}#t164-giveaway-poll .gp-question{font-size:1.15rem;margin:8px 0 14px}#t164-giveaway-poll .gp-photo{display:block;width:100%;max-height:420px;object-fit:contain;background:#0b111b;border-radius:12px;margin:10px 0}#t164-giveaway-poll .gp-option{display:flex;align-items:center;gap:9px;padding:10px;margin:8px 0;border:1px solid #39485e;border-radius:10px;background:#141f2d;cursor:pointer}#t164-giveaway-poll .gp-option input{accent-color:#d5a65a}#t164-giveaway-poll .gp-option-text{flex:1}#t164-giveaway-poll .gp-result{height:7px;border-radius:99px;background:#29374b;overflow:hidden;margin-top:6px}#t164-giveaway-poll .gp-result span{display:block;height:100%;background:#d5a65a}#t164-giveaway-poll .gp-count{font-size:12px;color:#b9c5d5}#t164-giveaway-poll .gp-admin{margin-top:14px;padding-top:12px;border-top:1px solid #39485e}#t164-giveaway-poll .gp-admin form{display:grid;gap:9px}#t164-giveaway-poll .gp-admin input[type=text],#t164-giveaway-poll .gp-admin textarea{width:100%;box-sizing:border-box}#t164-giveaway-poll .gp-choice-row{display:flex;gap:7px;align-items:center}#t164-giveaway-poll .gp-choice-row input{flex:1;min-width:0}#t164-giveaway-poll .gp-choice-remove{padding:5px 9px}#t164-giveaway-poll .gp-preview{max-width:100%;max-height:180px;object-fit:contain;border-radius:9px}#t164-giveaway-poll .gp-status{min-height:1.4em;color:#e2bc77}#t164-giveaway-poll .gp-closed{color:#e2bc77;font-weight:700}';
 document.head.appendChild(style);
 function getRoot(){
  if(root)return root;
  const composer=document.getElementById('communityComposer'),page=document.getElementById('communityPage');
  if(!composer||!page)return null;
  root=document.createElement('section');root.id=rootId;root.setAttribute('aria-labelledby','t164-gp-title');composer.before(root);return root;
 }
 function say(target,text,error){
  const status=target.querySelector('.gp-status');if(status){status.textContent=text||'';status.classList.toggle('error',!!error);}
 }
 function setLoading(){
  const target=getRoot();if(!target)return;
  target.innerHTML='<h2 id="t164-gp-title">'+t('title')+'</h2><p class="gp-status" role="status" aria-live="polite">'+t('loading')+'</p>';
 }
 function publicImage(path){
  const client=getDb();return path&&client?client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl:'';
 }
 function make(tag,cls,text){
  const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;
 }
 async function load(){
  const target=getRoot();if(!target||currentMode==='saved')return;
  const client=getDb();if(!client){target.innerHTML='<h2 id="t164-gp-title">'+t('title')+'</h2><p class="gp-status">'+t('loadError')+'</p>';return}
  setLoading();
  const me=user();
  isAdmin=false;
  if(me){const admin=await client.rpc('is_arbox_photo_admin');isAdmin=!admin.error&&admin.data===true}
  const {data:rows,error}=await client.from(POLLS).select('id,question,image_path,is_active,created_at').order('created_at',{ascending:false}).limit(20);
  if(error){target.innerHTML='<h2 id="t164-gp-title">'+t('title')+'</h2><p class="gp-status">'+t('loadError')+'</p>';return}
  activePoll=(rows||[]).find(row=>row.is_active)||(rows||[])[0]||null;
  selectedOption=null;
  target.replaceChildren();
  target.appendChild(make('h2','',t('title')));
  if(!activePoll){
   target.appendChild(make('p','gp-status',t('noPoll')));
   if(isAdmin)renderAdminForm(target);
   return;
  }
  const [optionResult,resultResult]=await Promise.all([
   client.from(OPTIONS).select('id,label,sort_order').eq('poll_id',activePoll.id).order('sort_order',{ascending:true}),
   client.rpc('community_giveaway_poll_results',{p_poll_id:activePoll.id})
  ]);
  if(optionResult.error||resultResult.error){target.appendChild(make('p','gp-status',t('loadError')));if(isAdmin)renderAdminForm(target);return}
  const options=optionResult.data||[],results=resultResult.data||[];
  const mine=results.find(row=>row.selected===true);
  selectedOption=mine?String(mine.option_id):null;
  renderPoll(target,activePoll,options,results);
  if(isAdmin)renderAdminForm(target);
 }
 function renderPoll(target,poll,options,results){
  const imageUrl=publicImage(poll.image_path);
  if(imageUrl){const image=make('img','gp-photo');image.src=imageUrl;image.alt=poll.question;image.loading='lazy';target.appendChild(image)}
  target.appendChild(make('h3','gp-question',poll.question));
  const total=results.reduce((sum,row)=>sum+(Number(row.vote_count)||0),0);
  const showResults=!poll.is_active||selectedOption!==null;
  const form=make('form','gp-vote-form');form.setAttribute('aria-label',t('title'));
  for(const option of options){
   const result=results.find(row=>String(row.option_id)===String(option.id));
   const count=Number(result?.vote_count)||0,percent=total?Math.round(count*100/total):0;
   const label=make('label','gp-option');
   const radio=document.createElement('input');radio.type='radio';radio.name='giveaway-option';radio.value=String(option.id);radio.checked=selectedOption===String(option.id);radio.disabled=!poll.is_active;
   radio.addEventListener('change',()=>{selectedOption=radio.value;const submit=form.querySelector('button[type=submit]');if(submit)submit.disabled=false});
   label.appendChild(radio);
   const text=make('span','gp-option-text',option.label);label.appendChild(text);
   if(showResults){const summary=make('span','gp-count',percent+'% · '+count+' '+t('total'));label.appendChild(summary);const bar=make('div','gp-result');const fill=document.createElement('span');fill.style.width=percent+'%';bar.appendChild(fill);label.appendChild(bar)}
   form.appendChild(label);
  }
  const submit=make('button','primary',t('vote'));submit.type='submit';submit.disabled=!poll.is_active||!options.length||selectedOption===null;form.appendChild(submit);
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   if(!poll.is_active)return;
   const me=user();if(!me){if(typeof openLoginDialog==='function')openLoginDialog(t('login'));else say(target,t('login'));return}
   const selected=form.querySelector('input[name="giveaway-option"]:checked');if(!selected)return;
   submit.disabled=true;say(target,t('loading'));
   const client=getDb(),{error}=await client.from('community_giveaway_poll_votes').upsert({poll_id:poll.id,option_id:Number(selected.value),user_id:me.id},{onConflict:'poll_id,user_id'});
   if(error){say(target,t('voteError'),true);submit.disabled=false;return}
   say(target,t('voteSaved'));await load();
  });
  target.appendChild(form);
  if(poll.is_active)target.appendChild(make('p','gp-count',t('changeVote')));
  else target.appendChild(make('p','gp-closed',t('closed')+' · '+total+' '+t('total')));
  const status=make('p','gp-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');target.appendChild(status);
  if(isAdmin&&poll.is_active){
   const close=make('button','outline','× '+t('close'));close.type='button';close.addEventListener('click',async()=>{
    if(!window.confirm(t('confirmClose')))return;
    close.disabled=true;const {error}=await getDb().from(POLLS).update({is_active:false}).eq('id',poll.id).eq('is_active',true);
    if(error){say(target,t('closeError'),true);close.disabled=false;return}
    await load();
   });
   target.appendChild(close);
  }
 }
 function renderAdminForm(target){
  const box=make('div','gp-admin'),heading=make('h3','',t('create'));box.appendChild(heading);
  const form=document.createElement('form');
  form.innerHTML='<label>'+t('question')+'<input type="text" name="question" maxlength="180" required></label><fieldset><legend>'+t('choices')+'</legend><div class="gp-choice-list"></div><button type="button" class="outline gp-add-choice">＋ '+t('addChoice')+'</button></fieldset><label>'+t('photo')+'<input type="file" name="photo" accept="image/jpeg,image/png,image/webp"></label><img class="gp-preview" hidden alt=""><p class="gp-status" role="status" aria-live="polite"></p><button type="submit" class="primary">'+t('publish')+'</button>';
  const list=form.querySelector('.gp-choice-list');
  function addChoice(value){
   if(list.children.length>=8)return;
   const row=make('div','gp-choice-row'),input=document.createElement('input');input.type='text';input.name='choice';input.maxLength=100;input.required=true;input.placeholder=t('choice')+' '+(list.children.length+1);input.value=value||'';
   const remove=make('button','outline gp-choice-remove','×');remove.type='button';remove.setAttribute('aria-label','Remove '+t('choice'));remove.addEventListener('click',()=>{if(list.children.length>2)row.remove()});
   row.append(input,remove);list.appendChild(row);
  }
  addChoice('');addChoice('');
  form.querySelector('.gp-add-choice').addEventListener('click',()=>addChoice(''));
  const file=form.querySelector('input[name="photo"]'),preview=form.querySelector('.gp-preview');
  file.addEventListener('change',()=>{const chosen=file.files?.[0];if(!chosen){preview.hidden=true;return}if(!chosen.type.startsWith('image/')||chosen.size>12*1024*1024){file.value='';preview.hidden=true;say(box,t('photoError'),true);return}preview.src=URL.createObjectURL(chosen);preview.hidden=false});
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   if(!isAdmin||!user())return;
   const question=form.elements.question.value.trim(),choices=[...form.querySelectorAll('input[name="choice"]')].map(input=>input.value.trim()),photo=file.files?.[0]||null;
   if(!question){say(box,t('empty'),true);return}
   if(choices.length<2||choices.length>8||choices.some(value=>!value)){say(box,t('choiceError'),true);return}
   if(photo&&(!photo.type.startsWith('image/')||photo.size>12*1024*1024)){say(box,t('photoError'),true);return}
   const button=form.querySelector('button[type=submit]');button.disabled=true;say(box,t('loading'));
   const client=getDb(),me=user();let photoPath=null,pollId=null;
   try{
    if(photo){
     const ext=photo.type==='image/png'?'png':photo.type==='image/webp'?'webp':'jpg';
     photoPath=me.id+'/'+crypto.randomUUID()+'.'+ext;
     const uploaded=await client.storage.from(BUCKET).upload(photoPath,photo,{upsert:false,contentType:photo.type,cacheControl:'3600'});
     if(uploaded.error)throw uploaded.error;
    }
    const created=await client.from(POLLS).insert({question,image_path:photoPath,created_by:me.id,is_active:false}).select('id').single();
    if(created.error)throw created.error;
    pollId=created.data.id;
    const options=await client.from(OPTIONS).insert(choices.map((label,index)=>({poll_id:pollId,label,sort_order:index})));
    if(options.error)throw options.error;
    const closed=await client.from(POLLS).update({is_active:false}).eq('is_active',true);
    if(closed.error)throw closed.error;
    const opened=await client.from(POLLS).update({is_active:true}).eq('id',pollId);
    if(opened.error)throw opened.error;
    await load();
   }catch{
    if(pollId)await client.from(POLLS).delete().eq('id',pollId);
    if(photoPath)await client.storage.from(BUCKET).remove([photoPath]);
    say(box,t('createError'),true);button.disabled=false;
   }
  });
  box.appendChild(form);target.appendChild(box);
 }
 async function show(mode){
  currentMode=mode||'feed';
  const target=getRoot();if(!target)return;
  target.hidden=currentMode==='saved';
  if(currentMode==='feed')await load();
 }
 function authChanged(){
  if(currentMode==='feed'&&document.body.classList.contains('community-view'))load();
  else if(!user()){isAdmin=false}
 }
 function init(){
  getRoot();
  if(document.body.classList.contains('community-view'))show('feed');
  window.addEventListener('turbo164:languagechange',()=>{if(currentMode==='feed'&&document.body.classList.contains('community-view'))load()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.T164GiveawayPoll={show,authChanged};
})();