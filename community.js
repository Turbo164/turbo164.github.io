/* TURBO 164 Community feed. Requires the community tables and storage bucket
   created by turbo164-community-setup.sql. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const bucket='community-media';
 const maxVideoBytes=80*1024*1024;
 let currentMode='feed',posts=[],profiles={},hearts=new Set(),saved=new Set(),heartCounts={},commentCounts={},commentOpen=new Set(),reportPostId=null,warningReportId=null,adminCommunity=false;
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
  $('communityBack').hidden=mode==='saved';$('communitySavedBack').hidden=mode!=='saved';
  message('');loadPosts();loadCommunityWarnings();if(adminCommunity)loadAdminReports();
 }
 function hideCommunity(){document.body.classList.remove('community-view');$('communityPage').hidden=true;currentMode='feed'}
 window.openTurbo164Community=showCommunity;
 window.closeTurbo164Community=hideCommunity;
 window.communityAuthChanged=()=>{
  const isIn=!!communityUser();
  $('communitySavedBtn').hidden=!isIn;
  $('communityAccountLogin').hidden=isIn;
  if(document.body.classList.contains('community-view'))loadPosts();
  loadCommunityWarnings();checkCommunityAdmin();
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
 async function loadCommunityWarnings(){
  const area=$('communityWarnings'),u=communityUser()?.user;
  if(!area)return;
  if(!u||!activeDb()){area.hidden=true;area.replaceChildren();return}
  const {data,error}=await activeDb().from('community_post_warnings').select('id,warning_text,created_at').eq('user_id',u.id).is('acknowledged_at',null).order('created_at',{ascending:false}).limit(10);
  if(error||!data?.length){area.hidden=true;area.replaceChildren();return}
  area.hidden=false;area.innerHTML=data.map(w=>`<article class="community-warning-card"><strong>${esc(t('Community notice'))}</strong><p>${esc(w.warning_text)}</p><button type="button" class="outline" data-dismiss-warning="${esc(w.id)}">${esc(t('Dismiss notice'))}</button></article>`).join('');
  area.querySelectorAll('[data-dismiss-warning]').forEach(b=>b.onclick=()=>dismissWarning(b.dataset.dismissWarning));
 }
 async function dismissWarning(id){
  const u=communityUser()?.user;if(!u)return;
  const {error}=await activeDb().from('community_post_warnings').update({acknowledged_at:new Date().toISOString()}).eq('id',id).eq('user_id',u.id);
  if(error){message(error.message,true);return}loadCommunityWarnings();
 }
 async function checkCommunityAdmin(){
  const panel=$('communityAdminPanel');if(!panel)return;
  if(!communityUser()||!activeDb()){adminCommunity=false;panel.hidden=true;return}
  const {data,error}=await activeDb().rpc('is_arbox_photo_admin');
  adminCommunity=!error&&data===true;panel.hidden=!adminCommunity;
  if(adminCommunity&&document.body.classList.contains('community-view'))loadAdminReports();
 }
 async function loadAdminReports(){
  if(!adminCommunity)return;
  const area=$('communityReports'),status=$('communityAdminMessage');status.textContent=t('Loading reports…');
  const {data,error}=await activeDb().rpc('community_admin_list_reports');
  if(error){status.textContent=`${t('Report queue unavailable:')} ${error.message}`;area.replaceChildren();return}
  status.textContent=data?.length?t('Pending community reports'):t('No pending community reports.');
  area.innerHTML=(data||[]).map(r=>`<article class="community-report-card" data-report-card="${esc(r.report_id)}"><h3>${esc(r.post_owner_name||t('Post owner unavailable'))}</h3><div class="community-report-meta">${esc(r.post_type||t('Post unavailable'))} · ${esc(dateLabel(r.created_at))}</div><p><strong>${esc(t('Reported content:'))}</strong> ${esc(r.post_body||t('No text content.'))}</p><p><strong>${esc(t('Report reason:'))}</strong> ${esc(r.report_reason)}</p><div class="community-report-actions">${r.post_id?`<button type="button" class="outline" data-community-review="warn" data-report-id="${esc(r.report_id)}">${esc(t('Warn owner'))}</button><button type="button" class="community-delete" data-community-review="remove" data-report-id="${esc(r.report_id)}">${esc(t('Remove post'))}</button>`:`<span class="muted">${esc(t('Post unavailable'))}</span>`}<button type="button" class="outline" data-community-review="reject" data-report-id="${esc(r.report_id)}">${esc(t('Reject report'))}</button></div></article>`).join('');
  area.querySelectorAll('[data-community-review]').forEach(b=>b.onclick=()=>handleAdminReview(b.dataset.reportId,b.dataset.communityReview));
 }
 async function handleAdminReview(id,action){
  if(!adminCommunity)return;
  if(action==='warn'){warningReportId=id;$('communityWarningText').value='';$('communityWarningDialog').showModal();return}
  if(action==='remove'&&!confirm(t('Remove this reported post? This also deletes its comments, hearts, and saves.')))return;
  const {data,error}=await activeDb().rpc('community_admin_review_report',{p_report_id:id,p_action:action,p_warning:null});
  if(error){$('communityAdminMessage').textContent=error.message;return}
  if(action==='remove'&&Array.isArray(data)&&data.length)await activeDb().storage.from(bucket).remove(data);
  $('communityAdminMessage').textContent=t(action==='remove'?'Post removed.':'Report rejected; the post remains unchanged.');
  await loadAdminReports();
 }
 async function sendAdminWarning(event){
  event.preventDefault();if(!adminCommunity||!warningReportId)return;
  const warning=$('communityWarningText').value.trim();if(!warning)return;
  const submit=$('communityWarningSubmit');submit.disabled=true;
  const {error}=await activeDb().rpc('community_admin_review_report',{p_report_id:warningReportId,p_action:'warn',p_warning:warning});
  submit.disabled=false;if(error){$('communityAdminMessage').textContent=error.message;return}
  $('communityWarningDialog').close();warningReportId=null;$('communityAdminMessage').textContent=t('Warning sent to the post owner.');await loadAdminReports();
 }
 function openReportDialog(postId){
  if(!requireLogin('report posts'))return;
  reportPostId=postId;$('communityReportReason').value='';$('communityReportDialog').showModal();
 }
 async function submitReport(event){
  event.preventDefault();if(!requireLogin('report posts')||!reportPostId)return;
  const reason=$('communityReportReason').value.trim();if(reason.length<5){message(t('Please explain why you are reporting this post.'),true);return}
  const submit=$('communityReportSubmit');submit.disabled=true;
  const {error}=await activeDb().from('community_post_reports').insert({post_id:reportPostId,reporter_id:communityUser().user.id,reason});
  submit.disabled=false;if(error){message(error.code==='23505'?t('You already reported this post.'):error.message,true);return}
  $('communityReportDialog').close();reportPostId=null;message(t('Report sent to the admin for review.'));
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
   const photoPaths=(Array.isArray(post.media_paths)?post.media_paths.filter(Boolean):[]);if(!photoPaths.length&&post.post_type==='photo'&&post.media_path)photoPaths.push(post.media_path);
   const photos=post.post_type==='photo'?photoPaths.slice(0,6).map(path=>`<img class="community-media" loading="lazy" src="${esc(publicUrl(path))}" alt="${esc(t('Photo shared by'))} ${esc(displayAuthor(post.author_id))}">`).join(''):'';
   const media=photos?`<div class="community-photo-gallery ${photoPaths.length===1?'single':''}">${photos}</div>`:post.post_type==='video'&&url?`<video class="community-media" controls playsinline preload="metadata" src="${esc(url)}">${esc(t('Your browser does not support embedded video.'))}</video>`:'';
   const ownerControls=own?`<div class="community-owner-controls"><label class="community-allow-save"><input type="checkbox" data-post-save-permission="${esc(post.id)}" ${post.allow_saves?'checked':''}> ${esc(t('Allow others to save this post'))}</label></div>`:'';
   const menuAction=own?`<button type="button" data-delete-post="${esc(post.id)}">${esc(t('Delete post'))}</button>`:`<button type="button" data-report-post="${esc(post.id)}">${esc(t('Report post'))}</button>`;
   const hearted=hearts.has(post.id),isSaved=saved.has(post.id),canSave=post.allow_saves||isSaved;
   const open=commentOpen.has(post.id);
   return `<article class="community-post" data-post-id="${esc(post.id)}"><div class="community-post-top"><div class="community-post-menu"><button type="button" class="community-post-menu-trigger" data-post-menu aria-label="${esc(t('Post options'))}" aria-expanded="false">⋮</button><div class="community-post-menu-panel" hidden>${menuAction}</div></div></div><div class="community-post-head"><div><strong>${esc(displayAuthor(post.author_id))}</strong><time>${esc(dateLabel(post.created_at))}</time></div>${ownerControls}</div>${post.body?`<p class="community-post-body">${esc(post.body).replace(/\n/g,'<br>')}</p>`:''}${media}<div class="community-actions"><button type="button" class="community-heart ${hearted?'hearted':''}" data-heart-post="${esc(post.id)}" aria-pressed="${hearted}">♥ <span>${heartCounts[post.id]||0}</span> ${esc(t('Love'))}</button>${canSave?`<button type="button" class="community-save ${isSaved?'is-saved':''}" data-save-post="${esc(post.id)}">${isSaved?'✓ '+esc(t('Saved')):'＋ '+esc(t('Save post'))}</button>`:`<span class="community-save-disabled">${esc(t('Saving disabled by author'))}</span>`}<button type="button" class="community-comments-toggle" data-toggle-comments="${esc(post.id)}">▢ ${esc(t('Comments'))} (${commentCounts[post.id]||0})</button></div><div class="community-comments" data-comments-for="${esc(post.id)}" ${open?'':'hidden'}>${open?`<div class="comment-list">${esc(t('Loading comments…'))}</div><form class="community-comment-form" data-comment-form="${esc(post.id)}"><input name="comment" maxlength="2000" placeholder="${esc(t('Write a comment…'))}" required><button type="submit">${esc(t('Post'))}</button></form>`:''}</div></article>`;
  }).join('');
  area.querySelectorAll('[data-heart-post]').forEach(b=>b.onclick=()=>toggleHeart(b.dataset.heartPost));
  area.querySelectorAll('[data-save-post]').forEach(b=>b.onclick=()=>toggleSave(b.dataset.savePost));
  area.querySelectorAll('[data-post-menu]').forEach(b=>b.onclick=event=>{event.stopPropagation();const panel=b.nextElementSibling,opening=panel.hidden;area.querySelectorAll('.community-post-menu-panel').forEach(x=>x.hidden=true);area.querySelectorAll('[data-post-menu]').forEach(x=>x.setAttribute('aria-expanded','false'));panel.hidden=!opening;b.setAttribute('aria-expanded',String(opening))});
  area.querySelectorAll('[data-report-post]').forEach(b=>b.onclick=()=>{b.closest('.community-post-menu-panel').hidden=true;openReportDialog(b.dataset.reportPost)});
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
  const mediaPaths=Array.isArray(post?.media_paths)&&post.media_paths.length?post.media_paths:(post?.media_path?[post.media_path]:[]);
  if(mediaPaths.length)await activeDb().storage.from(bucket).remove(mediaPaths);
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
  const type=$('communityPostType').value,body=$('communityPostText').value.trim(),files=[...($('communityMediaFile').files||[])];
  if(type==='text'&&!body){message(t('Write something before posting.'),true);return}
  if(type!=='text'&&!files.length){message(t('Choose a photo or video for this post.'),true);return}
  if(type==='photo'&&files.length>6){message(t('Choose up to 6 photos for one post.'),true);return}
  if(type==='photo'&&files.some(file=>!file.type.startsWith('image/'))){message(t('Choose image files only.'),true);return}
  if(type==='video'&&(files.length!==1||!files[0].type.startsWith('video/')||files[0].size>maxVideoBytes)){message(t('Choose one MP4, MOV, or WebM video under 80 MB.'),true);return}
  const submit=$('communityPublish');submit.disabled=true;message(t('Publishing post…'));
  let mediaPaths=[];
  try{
   await ensureProfile();
   for(const file of files){
    let blob=file,contentType=file.type||'application/octet-stream',ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
    if(type==='photo'){const prepared=await prepareModelPhoto(file);blob=prepared.blob;contentType='image/jpeg';ext='jpg';URL.revokeObjectURL(prepared.preview)}
    const path=`${u.id}/${crypto.randomUUID()}.${ext}`;
    const {error:uploadError}=await activeDb().storage.from(bucket).upload(path,blob,{contentType,upsert:false});if(uploadError)throw uploadError;
    mediaPaths.push(path);
   }
   const {error}=await activeDb().from('community_posts').insert({author_id:u.id,post_type:type,body:body||'',media_path:mediaPaths[0]||null,media_paths:mediaPaths,allow_saves:$('communityAllowSaves').checked});
   if(error)throw error;
   form.reset();syncComposerType();message(t('Post published.'));currentMode='feed';await loadPosts();
  }catch(error){if(mediaPaths.length)await activeDb().storage.from(bucket).remove(mediaPaths);message(`${t('Could not publish post:')} ${error.message||error}`,true)}
  finally{submit.disabled=false}
 }
 function syncComposerType(reset=true){
  const type=$('communityPostType').value,input=$('communityMediaFile'),label=$('communityMediaLabel');
  if(reset){input.value='';$('communitySelectedFile').textContent='';$('communityPhotoPreviews').replaceChildren()}
  input.multiple=type==='photo';input.accept=type==='photo'?'image/*':type==='video'?'video/mp4,video/quicktime,video/webm':'';
  $('communityMediaPicker').hidden=type==='text';label.textContent=type==='photo'?t('Choose photos (up to 6)'):type==='video'?t('Choose video'):'';
  $('communityPostText').placeholder=type==='text'?t('Share something with the community…'):t('Add a caption (optional)…');
 }
 function previewCommunityPhotos(){
  const input=$('communityMediaFile'),files=[...(input.files||[])],preview=$('communityPhotoPreviews'),selected=$('communitySelectedFile');preview.querySelectorAll('img').forEach(image=>URL.revokeObjectURL(image.src));preview.replaceChildren();
  if(files.length>6){selected.textContent=t('Choose up to 6 photos for one post.');input.value='';return}
  selected.textContent=files.length?`${files.length} ${t('photos selected')}`:'';
  if($('communityPostType').value!=='photo')return;
  files.forEach(file=>{const image=document.createElement('img');image.alt=file.name;image.src=URL.createObjectURL(file);preview.append(image)});
 }
 async function init(){
  $('communityTopBtn').onclick=()=>showCommunity('feed');$('communityBack').onclick=hideCommunity;$('communitySavedBack').onclick=hideCommunity;
  $('communitySavedBtn').onclick=()=>{ $('accountMenu').hidden=true;$('accountBtn').setAttribute('aria-expanded','false');showCommunity('saved')};
  $('communityAccountLogin').onclick=()=>{ $('accountMenu').hidden=true;openLoginDialog('Log in to save posts, react, comment, and publish.')};
  $('communityComposerForm').onsubmit=publishPost;$('communityPostType').onchange=()=>syncComposerType();
  $('communityMediaPicker').onclick=()=>$('communityMediaFile').click();
  $('communityMediaFile').onchange=previewCommunityPhotos;
  $('communityReportForm').onsubmit=submitReport;$('communityReportCancel').onclick=()=>{$('communityReportDialog').close();reportPostId=null};
  $('communityWarningForm').onsubmit=sendAdminWarning;$('communityWarningCancel').onclick=()=>{$('communityWarningDialog').close();warningReportId=null};
  document.addEventListener('click',event=>{if(!event.target.closest('.community-post-menu'))document.querySelectorAll('.community-post-menu-panel').forEach(panel=>panel.hidden=true)});
  window.addEventListener('turbo164:languagechange',()=>{const label=$('communityPageTitle');if(label&&document.body.classList.contains('community-view'))label.textContent=currentMode==='saved'?t('Saved community posts'):t('Community');syncComposerType(false);loadCommunityWarnings()});
  window.communityAuthChanged();syncComposerType();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
