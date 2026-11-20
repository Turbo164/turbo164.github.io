/* TURBO 164 Community feed. Requires the community tables and storage bucket
   created by turbo164-community-setup.sql. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const bucket='community-media';
 const maxVideoBytes=80*1024*1024;
 let currentMode='feed',posts=[],profiles={},hearts=new Set(),saved=new Set(),heartCounts={},commentCounts={},commentOpen=new Set();
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const communityUser=()=>typeof session!=='undefined'?session:null;
 const activeDb=()=>typeof db!=='undefined'?db:null;
 const fallbackName=id=>`Collector ${String(id||'').slice(0,6)}`;
 const displayAuthor=id=>profiles[id]||fallbackName(id);
 const dateLabel=value=>{try{return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))}catch{return ''}};
 const t=(en)=>window.T164I18N?.translate(en)||en;
 function message(text,error=false){const el=$('communityMessage');el.textContent=text||'';el.classList.toggle('error',!!error)}
 function showCommunity(mode='feed'){
  currentMode=mode;document.body.classList.add('community-view');$('communityPage').hidden=false;
  $('communityComposer').hidden=mode==='saved';$('communityPageTitle').textContent=mode==='saved'?t('Saved community posts'):t('Community');
  $('communityBack').hidden=mode==='saved';$('communitySavedBack').hidden=mode!=='saved';$('communityRefresh').hidden=mode==='saved';
  message('');loadPosts();
 }
 function hideCommunity(){document.body.classList.remove('community-view');$('communityPage').hidden=true;currentMode='feed'}
 window.openTurbo164Community=showCommunity;
 window.closeTurbo164Community=hideCommunity;
 window.communityAuthChanged=()=>{
  const isIn=!!communityUser();
  $('communitySavedBtn').hidden=!isIn;
  $('communityAccountLogin').hidden=isIn;
  if(document.body.classList.contains('community-view'))loadPosts();
 };
 window.communityRefresh=()=>{if(document.body.classList.contains('community-view'))loadPosts()};
 function requireLogin(action){if(communityUser())return true;openLoginDialog(`Log in to ${action} in the community.`);return false}
 function publicUrl(path){if(!path)return '';return activeDb().storage.from(bucket).getPublicUrl(path).data.publicUrl}
 function authorName(){const u=communityUser()?.user;if(!u)return '';const meta=u.user_metadata||{};return String(meta.full_name||meta.name||fallbackName(u.id)).slice(0,70)}
 async function ensureProfile(){
  const u=communityUser()?.user;if(!u)return;
  const {error}=await activeDb().from('community_profiles').upsert({user_id:u.id,display_name:authorName()},{onConflict:'user_id',ignoreDuplicates:true});
  if(error)throw error;
 }
 async function loadPosts(){
  const area=$('communityFeed');if(!area)return;
  if(!activeDb()){area.innerHTML=`<div class="notice">${esc(t('Community cloud service is not configured.'))}</div>`;return}
  area.innerHTML=`<div class="notice">${esc(t('Loading community posts…'))}</div>`;
  const u=communityUser()?.user;
  let rows=[];
  if(currentMode==='saved'){
   if(!u){area.innerHTML=`<div class="notice">${esc(t('Log in to view your saved community posts.'))}</div>`;return}
   const {data:saves,error}=await activeDb().from('community_saved_posts').select('post_id').eq('user_id',u.id).order('created_at',{ascending:false}).limit(100);
   if(error){area.innerHTML=`<div class="notice">${esc(error.message)}</div>`;return}
   const ids=(saves||[]).map(x=>x.post_id);
   if(!ids.length){area.innerHTML=`<div class="notice">${esc(t('You have no saved community posts yet.'))}</div>`;return}
   const {data,error:postsError}=await activeDb().from('community_posts').select('*').in('id',ids);
   if(postsError){area.innerHTML=`<div class="notice">${esc(postsError.message)}</div>`;return}
   const order=new Map(ids.map((id,i)=>[id,i]));rows=(posts||[]).sort((a,b)=>(order.get(a.id)??999)-(order.get(b.id)??999));
  }else{
   const {data,error}=await activeDb().from('community_posts').select('*').order('created_at',{ascending:false}).limit(60);
   if(error){area.innerHTML=`<div class="notice">${esc(t('Community setup is incomplete. Run turbo164-community-setup.sql in Supabase.'))}<br><span class="muted">${esc(error.message)}</span></div>`;return}
   rows=data||[];
  }
  posts=rows;
  if(!rows.length){area.innerHTML=`<div class="notice">${esc(currentMode==='saved'?t('You have no saved community posts yet.'):t('No posts yet. Be the first to share something with the community.'))}</div>`;return}
  const ids=rows.map(p=>p.id),users=[...new Set(rows.map(p=>p.author_id))];
  const [profileResult,heartResult,commentResult,saveResult]=await Promise.all([
   activeDb().from('community_profiles').select('user_id,display_name').in('user_id',users),
   activeDb().from('community_post_hearts').select('post_id,user_id').in('post_id',ids),
   activeDb().from('community_comments').select('post_id').in('post_id',ids).limit(1000),
   communityUser()?activeDb().from('community_saved_posts').select('post_id').eq('user_id',communityUser().user.id).in('post_id',ids):Promise.resolve({data:[]})
  ]);
  profiles={};(profileResult.data||[]).forEach(p=>profiles[p.user_id]=p.display_name);
  heartCounts={};hearts=new Set();(heartResult.data||[]).forEach(h=>{heartCounts[h.post_id]=(heartCounts[h.post_id]||0)+1;if(communityUser()?.user.id===h.user_id)hearts.add(h.post_id)});
  commentCounts={};(commentResult.data||[]).forEach(c=>commentCounts[c.post_id]=(commentCounts[c.post_id]||0)+1);
  saved=new Set((saveResult.data||[]).map(x=>x.post_id));
  renderPosts();
 }
 function renderPosts(){
  const area=$('communityFeed'),u=communityUser()?.user;
  area.innerHTML=posts.map(post=>{
   const own=u?.id===post.author_id,url=post.media_path?publicUrl(post.media_path):'';
   const media=post.post_type==='photo'&&url?`<img class="community-media" loading="lazy" src="${esc(url)}" alt="${esc(t('Photo shared by'))} ${esc(displayAuthor(post.author_id))}">`:post.post_type==='video'&&url?`<video class="community-media" controls playsinline preload="metadata" src="${esc(url)}">${esc(t('Your browser does not support embedded video.'))}</video>`:'';
   const ownerControls=own?`<div class="community-owner-controls"><label class="community-allow-save"><input type="checkbox" data-post-save-permission="${esc(post.id)}" ${post.allow_saves?'checked':''}> ${esc(t('Allow others to save this post'))}</label><button type="button" class="community-delete" data-delete-post="${esc(post.id)}">${esc(t('Delete post'))}</button></div>`:'';
   const hearted=hearts.has(post.id),isSaved=saved.has(post.id),canSave=post.allow_saves||isSaved;
   const open=commentOpen.has(post.id);
   return `<article class="community-post" data-post-id="${esc(post.id)}"><div class="community-post-head"><div><strong>${esc(displayAuthor(post.author_id))}</strong><time>${esc(dateLabel(post.created_at))}</time></div>${ownerControls}</div>${post.body?`<p class="community-post-body">${esc(post.body).replace(/\n/g,'<br>')}</p>`:''}${media}<div class="community-actions"><button type="button" class="community-heart ${hearted?'hearted':''}" data-heart-post="${esc(post.id)}" aria-pressed="${hearted}">♥ <span>${heartCounts[post.id]||0}</span> ${esc(t('Love'))}</button>${canSave?`<button type="button" class="community-save ${isSaved?'is-saved':''}" data-save-post="${esc(post.id)}">${isSaved?'✓ '+esc(t('Saved')):'＋ '+esc(t('Save post'))}</button>`:`<span class="community-save-disabled">${esc(t('Saving disabled by author'))}</span>`}<button type="button" class="community-comments-toggle" data-toggle-comments="${esc(post.id)}">▢ ${esc(t('Comments'))} (${commentCounts[post.id]||0})</button></div><div class="community-comments" data-comments-for="${esc(post.id)}" ${open?'':'hidden'}>${open?`<div class="comment-list">${esc(t('Loading comments…'))}</div><form class="community-comment-form" data-comment-form="${esc(post.id)}"><input name="comment" maxlength="2000" placeholder="${esc(t('Write a comment…'))}" required><button type="submit">${esc(t('Post'))}</button></form>`:''}</div></article>`;
  }).join('');
  area.querySelectorAll('[data-heart-post]').forEach(b=>b.onclick=()=>toggleHeart(b.dataset.heartPost));
  area.querySelectorAll('[data-save-post]').forEach(b=>b.onclick=()=>toggleSave(b.dataset.savePost));
  area.querySelectorAll('[data-toggle-comments]').forEach(b=>b.onclick=()=>toggleComments(b.dataset.toggleComments));
  area.querySelectorAll('[data-post-save-permission]').forEach(el=>el.onchange=()=>setSavePermission(el.dataset.postSavePermission,el.checked));
  area.querySelectorAll('[data-delete-post]').forEach(b=>b.onclick=()=>deletePost(b.dataset.deletePost));
  area.querySelectorAll('[data-comment-form]').forEach(form=>form.onsubmit=event=>submitComment(event,form.dataset.commentForm));
  commentOpen.forEach(id=>{const post=area.querySelector(`[data-comments-for="${CSS.escape(id)}"]`);if(post)loadComments(id,post.querySelector('.comment-list'))});
 }
 async function toggleHeart(id){
  if(!requireLogin('react'))return;const u=communityUser().user;message('');
  if(hearts.has(id)){const {error}=await activeDb().from('community_post_hearts').delete().eq('post_id',id).eq('user_id',u.id);if(error){message(error.message,true);return}}
  else{const {error}=await activeDb().from('community_post_hearts').insert({post_id:id,user_id:u.id});if(error){message(error.message,true);return}}
  await loadPosts();
 }
 async function toggleSave(id){
  if(!requireLogin('save posts'))return;const post=posts.find(p=>p.id===id);if(!post)return;
  if(saved.has(id)){const {error}=await activeDb().from('community_saved_posts').delete().eq('post_id',id).eq('user_id',communityUser().user.id);if(error){message(error.message,true);return}}
  else{if(!post.allow_saves){message(t('The owner has disabled saving for this post.'),true);return}const {error}=await activeDb().from('community_saved_posts').insert({post_id:id,user_id:communityUser().user.id});if(error){message(error.message,true);return}}
  await loadPosts();
 }
 async function setSavePermission(id,allowed){
  const {error}=await activeDb().from('community_posts').update({allow_saves:allowed}).eq('id',id).eq('author_id',communityUser().user.id);
  if(error){message(error.message,true);await loadPosts();return}message(allowed?t('Other people can now save this post.'):t('Other people can no longer save this post.'));await loadPosts();
 }
 async function deletePost(id){
  if(!confirm(t('Delete this post and its comments, hearts and saves? This cannot be undone.')))return;
  const post=posts.find(p=>p.id===id);const {error}=await activeDb().from('community_posts').delete().eq('id',id).eq('author_id',communityUser().user.id);
  if(error){message(error.message,true);return}
  if(post?.media_path)await activeDb().storage.from(bucket).remove([post.media_path]);
  commentOpen.delete(id);message(t('Post deleted.'));await loadPosts();
 }
 async function toggleComments(id){
  if(commentOpen.has(id))commentOpen.delete(id);else commentOpen.add(id);renderPosts();
 }
 async function loadComments(id,target){
  if(!target)return;
  const {data,error}=await activeDb().from('community_comments').select('id,author_id,body,created_at').eq('post_id',id).order('created_at',{ascending:true}).limit(100);
  if(error){target.innerHTML=`<p class="muted">${esc(error.message)}</p>`;return}
  const ids=[...new Set((data||[]).map(c=>c.author_id))];let names={};
  if(ids.length){const {data:ps}=await activeDb().from('community_profiles').select('user_id,display_name').in('user_id',ids);(ps||[]).forEach(p=>names[p.user_id]=p.display_name)}
  const me=communityUser()?.user?.id;
  target.innerHTML=(data||[]).map(c=>`<div class="community-comment"><div><strong>${esc(names[c.author_id]||fallbackName(c.author_id))}</strong><time>${esc(dateLabel(c.created_at))}</time>${me===c.author_id?`<button type="button" class="comment-delete" data-delete-comment="${esc(c.id)}" data-comment-post="${esc(id)}">${esc(t('Delete'))}</button>`:''}</div><p>${esc(c.body).replace(/\n/g,'<br>')}</p></div>`).join('')||`<p class="muted">${esc(t('No comments yet.'))}</p>`;
  target.parentElement.querySelectorAll('[data-delete-comment]').forEach(b=>b.onclick=()=>deleteComment(b.dataset.deleteComment,b.dataset.commentPost));
 }
 async function submitComment(event,id){
  event.preventDefault();if(!requireLogin('comment'))return;
  const form=event.currentTarget,body=String(new FormData(form).get('comment')||'').trim();if(!body)return;
  const button=form.querySelector('button');button.disabled=true;
  const {error}=await activeDb().from('community_comments').insert({post_id:id,author_id:communityUser().user.id,body});
  if(error){button.disabled=false;message(error.message,true);return}
  await loadPosts();commentOpen.add(id);renderPosts();
 }
 async function deleteComment(commentId,postId){
  const {error}=await activeDb().from('community_comments').delete().eq('id',commentId).eq('author_id',communityUser().user.id);
  if(error){message(error.message,true);return}await loadPosts();commentOpen.add(postId);renderPosts();
 }
 async function publishPost(event){
  event.preventDefault();if(!requireLogin('post'))return;
  const form=$('communityComposerForm'),u=communityUser().user;
  const type=$('communityPostType').value,body=$('communityPostText').value.trim(),file=$('communityMediaFile').files?.[0]||null;
  if(type==='text'&&!body){message(t('Write something before posting.'),true);return}
  if(type!=='text'&&!file){message(t('Choose a photo or video for this post.'),true);return}
  if(type==='photo'&&file&&!file.type.startsWith('image/')){message(t('Choose an image file.'),true);return}
  if(type==='video'&&file&&(!file.type.startsWith('video/')||file.size>maxVideoBytes)){message(t('Choose an MP4, MOV, or WebM video under 80 MB.'),true);return}
  const submit=$('communityPublish');submit.disabled=true;message(t('Publishing post…'));
  let mediaPath=null;
  try{
   await ensureProfile();
   if(file){
    let blob=file,contentType=file.type||'application/octet-stream',ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
    if(type==='photo'){const prepared=await prepareModelPhoto(file);blob=prepared.blob;contentType='image/jpeg';ext='jpg';URL.revokeObjectURL(prepared.preview)}
    mediaPath=`${u.id}/${crypto.randomUUID()}.${ext}`;
    const {error:uploadError}=await activeDb().storage.from(bucket).upload(mediaPath,blob,{contentType,upsert:false});if(uploadError)throw uploadError;
   }
   const {error}=await activeDb().from('community_posts').insert({author_id:u.id,post_type:type,body:body||'',media_path:mediaPath,allow_saves:$('communityAllowSaves').checked});
   if(error)throw error;
   form.reset();syncComposerType();message(t('Post published.'));currentMode='feed';await loadPosts();
  }catch(error){if(mediaPath)await activeDb().storage.from(bucket).remove([mediaPath]);message(`${t('Could not publish post:')} ${error.message||error}`,true)}
  finally{submit.disabled=false}
 }
 function syncComposerType(){
  const type=$('communityPostType').value,input=$('communityMediaFile'),label=$('communityMediaLabel');
  input.value='';input.accept=type==='photo'?'image/*':type==='video'?'video/mp4,video/quicktime,video/webm':'';
  $('communityMediaPicker').hidden=type==='text';label.textContent=type==='photo'?t('Choose photo'):type==='video'?t('Choose video'):'';
  $('communitySelectedFile').textContent='';$('communityPostText').placeholder=type==='text'?t('Share something with the community…'):t('Add a caption (optional)…');
 }
 async function init(){
  $('communityTopBtn').onclick=()=>showCommunity('feed');$('communityBack').onclick=hideCommunity;$('communitySavedBack').onclick=hideCommunity;
  $('communitySavedBtn').onclick=()=>{ $('accountMenu').hidden=true;$('accountBtn').setAttribute('aria-expanded','false');showCommunity('saved')};
  $('communityAccountLogin').onclick=()=>{ $('accountMenu').hidden=true;openLoginDialog('Log in to save posts, react, comment, and publish.')};
  $('communityRefresh').onclick=loadPosts;$('communityComposerForm').onsubmit=publishPost;$('communityPostType').onchange=syncComposerType;
  $('communityMediaPicker').onclick=()=>$('communityMediaFile').click();
  $('communityMediaFile').onchange=()=>{const f=$('communityMediaFile').files?.[0];$('communitySelectedFile').textContent=f?`${f.name} · ${(f.size/1024/1024).toFixed(1)} MB`:''};
  window.addEventListener('turbo164:languagechange',()=>{const label=$('communityPageTitle');if(label&&document.body.classList.contains('community-view'))label.textContent=currentMode==='saved'?t('Saved community posts'):t('Community');syncComposerType()});
  window.communityAuthChanged();syncComposerType();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
