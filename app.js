const $=id=>document.getElementById(id);const C=window.ARBOX_CONFIG||{};
const cloudReady=!!(C.supabaseUrl&&C.supabaseAnonKey&&window.supabase);
const db=cloudReady?window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
let catalog=[],state={},session=null,filter='All',catalogView='Diecast',selectedDiecastBrand='All',selectedDiecastMake='All',diecastMenuLevel='root',diecastMenuBrand='All',radar=[],customModels=[],communityModels=[];
const PHOTO_BUCKET='arbox-photo-contributions';
const MODEL_BUCKET='arbox-model-submissions';
let modelPhotos=[]; 
let photoOverrides={},photoPending=new Set(),photoAdmin=false,selectedPhotoModel=null,chosenPhotoBlob=null,previewObjectUrl=null,itemOverrides={};
let editingCatalogItemId=null,editingAdminPhoto=null,editingAdminPhotoPreview=null;

const guestKey='arbox-garage-guest-v2';
function getLocal(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
function userKey(){return session?'arbox-garage-user-'+session.user.id:guestKey}
// Guests may browse the catalogue, but cannot create a saved garage.
// Never copy browser-only guest selections into an authenticated account.
function saveLocal(){if(session)localStorage.setItem(userKey(),JSON.stringify(state))}
function switchState(){state=session?getLocal(userKey()):{};render()}
function applyItemOverrides(m){const o=itemOverrides[String(m.id)];if(!o)return m;const next={...m};if(o.manufacturer)next.manufacturer=o.manufacturer;if(o.vehicle_make){next.brand=o.vehicle_make;next.vehicleMake=o.vehicle_make}if(o.name)next.name=o.name;if(o.product_code!==null&&o.product_code!==undefined)next.number=o.product_code;if(o.edition_type){next.variant=o.edition_type;next.editionType=o.edition_type}if(o.release)next.release=o.release;if(o.release_year!==null&&o.release_year!==undefined)next.releaseYear=o.release_year;if(o.community_badge!==null&&o.community_badge!==undefined)next.communityBadge=o.community_badge;if(o.source_url!==null&&o.source_url!==undefined)next.photoSource=safeSourceUrl(o.source_url);if(o.resolved_image_url||o.image_url)next.adminImageUrl=safeSourceUrl(o.resolved_image_url||o.image_url);if(o.hide_image===true)next.adminHideImage=true;return next}
function allModels(){return [...catalog,...communityModels,...customModels].map(applyItemOverrides).filter(eligible)}
function sharedDiecastModels(){return [...catalog,...communityModels].map(applyItemOverrides).filter(eligible)}
function availableDiecastBrands(){return [...new Set(sharedDiecastModels().map(maker).filter(Boolean))].sort((a,b)=>a.localeCompare(b))}
function availableCarManufacturers(brand){return [...new Set(sharedDiecastModels().filter(m=>maker(m)===brand).map(m=>String(m.brand||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b))}

state={};
const statuses=['Owned','Ordered','Missing','Unconfirmed','Wishlist'];
const allowedBrands=['ARBOX','PGM','Tarmac Works','INNO64'];
const editionTypes=['Regular','Chase','Event Exclusive','Limited Edition'];
function maker(m){return m.manufacturer||(m.brand==='Porsche'||m.brand==='Land Rover'?'ARBOX':m.brand)}
function eligible(m){return allowedBrands.includes(maker(m))}
function edition(m){return m.editionType||(m.variant==='Chase'?'Chase':'Regular')}
function displayLabel(m){return m.name}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function actual(m){return state[m.id]||(m.community?'Not tracking':'Missing')}
function render(){
 const q=$('search').value.toLowerCase();
 const all=allModels();
 const items=catalogView==='Diecast'?all.filter(m=>(selectedDiecastBrand==='All'||maker(m)===selectedDiecastBrand)&&(selectedDiecastMake==='All'||String(m.brand||'').trim().toLowerCase()===selectedDiecastMake.toLowerCase())&&(filter==='All'||(filter==='Chase'&&edition(m)==='Chase')||(filter==='Event'&&edition(m)==='Event Exclusive')||(filter==='Limited'&&edition(m)==='Limited Edition')||(filter==='Upcoming'&&['TBA','Preorder','Announced','Upcoming'].includes(m.release)))&&(`${m.number} ${displayLabel(m)} ${m.name} ${m.brand} ${maker(m)} ${edition(m)}`.toLowerCase().includes(q))):[];
 // Don't misrepresent public catalogue items as a guest's private collection.
 $('owned').textContent=session?all.filter(m=>actual(m)==='Owned').length:'—';
 $('ordered').textContent=session?all.filter(m=>actual(m)==='Ordered').length:'—';
 $('missing').textContent=session?all.filter(m=>actual(m)==='Missing').length:'—';
 $('catalogTitle').textContent=catalogView==='Diecast'?(selectedDiecastBrand==='All'?(filter==='All'?'Diecast catalogue':`${filter} diecast catalogue`):selectedDiecastMake==='All'?`${selectedDiecastBrand} catalogue`:`${selectedDiecastBrand} · ${selectedDiecastMake} catalogue`):`${catalogView} catalogue`;
 $('count').textContent=catalogView==='Diecast'?`${items.length} models`:'0 items';
 $('diecastMenuButton').classList.toggle('active',catalogView==='Diecast');
 document.querySelectorAll('[data-category]').forEach(button=>button.classList.toggle('active',button.dataset.category===catalogView));
 $('models').innerHTML=items.map(m=>{
  const label=displayLabel(m);
  const approved=photoOverrides[m.id];
  const imageUrl=m.adminHideImage?null:(m.adminImageUrl||approved||m.photo);
  const isPending=photoPending.has(m.id);
  const photoButton=isPending?'<button class="photo-action" disabled>Photo awaiting review</button>':`<button class="photo-action" type="button" data-photo-model="${esc(m.id)}">${imageUrl?'📷 Suggest replacement photo':'📷 Contribute a photo'}</button>`;
  const photoMarkup=imageUrl?`<a class="photo-link" href="${esc(approved||m.photoSource||m.adminImageUrl||m.photo)}" target="_blank" rel="noopener noreferrer" aria-label="Photo or source for ${esc(label)}"><img loading="lazy" src="${esc(imageUrl)}" alt="${approved?'Approved collector photo':'Product listing photo'}: ${esc(label)}" onerror="this.hidden=true;this.parentElement.nextElementSibling.hidden=false"></a><span class="photo-pending" hidden>Photo unavailable${m.photoSource?`<a class="source-link" href="${esc(m.photoSource)}" target="_blank" rel="noopener noreferrer">View product listing ↗</a>`:''}</span>`:`<span class="photo-pending">Exact product photo pending${m.photoSource?`<a class="source-link" href="${esc(m.photoSource)}" target="_blank" rel="noopener noreferrer">View product listing ↗</a>`:''}</span>`;
  const tracking=!session
    ?`<select aria-label="Choose status for ${esc(label)} — login required to save" data-id="${esc(m.id)}"><option value="" selected disabled>＋ Choose status to save</option>${statuses.map(status=>`<option value="${status}">${status}</option>`).join('')}</select>`
    :m.community&&actual(m)==='Not tracking'
    ?`<button type="button" class="track-action" data-add-garage="${esc(m.id)}">＋ Add to my private garage</button>`
    :`<select aria-label="Collection status for ${esc(label)}" data-id="${esc(m.id)}">${(m.community?['Not tracking',...statuses]:statuses).map(status=>`<option value="${esc(status)}" ${actual(m)===status?'selected':''}>${esc(status)}</option>`).join('')}</select>`;
  const cardEdition=edition(m);
  const editionBadge=cardEdition==='Regular'?'':cardEdition==='Chase'?'<span class="variant">✦ CHASE</span>':cardEdition==='Event Exclusive'?'<span class="variant">EVENT</span>':cardEdition==='Limited Edition'?'<span class="variant">LIMITED</span>':`<span class="variant">${esc(cardEdition)}</span>`;
  const yearMarkup=m.releaseYear?`<span class="muted">${esc(m.releaseYear)}</span>`:'';
  const adminMenu=photoAdmin&&(m.community||catalog.some(item=>String(item.id)===String(m.id)))?`<div class="admin-menu-wrapper"><button type="button" class="admin-menu-trigger" data-admin-menu-toggle aria-label="Admin actions for ${esc(label)}" aria-expanded="false">⋮</button><div class="admin-menu-popover" hidden><button type="button" data-edit-catalog-item="${esc(m.id)}">Edit all card details</button></div></div>`:'';
  return `<article class="model"><div class="photo">${photoMarkup}<span class="number">${m.number?`#${esc(m.number)}`:'SKU pending'}</span>${editionBadge}</div><div class="info"><div class="model-card-heading"><div class="muted">${esc(maker(m))} · ${esc(m.brand)}${(m.communityBadge!==undefined?m.communityBadge:(m.community?'Community verified':''))?' · '+esc(m.communityBadge!==undefined?m.communityBadge:'Community verified'):''}</div>${adminMenu}</div><div class="name">${esc(label)}</div><div class="sub"><span class="pill ${esc(String(m.release).toLowerCase())}">${esc(m.release)}</span>${yearMarkup}</div>${photoButton}${tracking}</div></article>`;
 }).join('')||(catalogView==='Diecast'?'<p>No matching models.</p>':`<div class="notice category-empty"><strong>${esc(catalogView)} collection</strong><p>No listings yet in this category.</p><p>Items added here will appear in their own catalogue.</p></div>`);
 document.querySelectorAll('select[data-id]').forEach(sel=>sel.addEventListener('change',()=>saveStatus(sel.dataset.id,sel.value)));
 document.querySelectorAll('button[data-photo-model]').forEach(btn=>btn.addEventListener('click',()=>openPhotoDialog(btn.dataset.photoModel)));
 document.querySelectorAll('button[data-add-garage]').forEach(btn=>btn.addEventListener('click',()=>saveStatus(btn.dataset.addGarage,'Wishlist')));
 bindAdminMenus($('models'));
 $('models').querySelectorAll('button[data-edit-catalog-item]').forEach(btn=>btn.addEventListener('click',()=>{
  closeAdminMenus();openCatalogItemEditor(btn.dataset.editCatalogItem);
 }));
}
function closeAdminMenus(){
 document.querySelectorAll('.admin-menu-popover:not([hidden])').forEach(menu=>{menu.hidden=true;menu.parentElement?.querySelector('[data-admin-menu-toggle]')?.setAttribute('aria-expanded','false')});
}
function bindAdminMenus(root){
 root.querySelectorAll('[data-admin-menu-toggle]').forEach(button=>button.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();
  const menu=button.parentElement.querySelector('.admin-menu-popover');
  const open=menu.hidden;closeAdminMenus();menu.hidden=!open;button.setAttribute('aria-expanded',String(open));
 }));
}
async function loadCatalogItemOverrides(){
 itemOverrides={};
 if(!db)return;
 const {data,error}=await db.from('arbox_catalog_item_overrides').select('model_id,manufacturer,vehicle_make,name,product_code,edition_type,release,release_year,community_badge,source_url,image_url,image_path,hide_image');
 if(error){console.warn('Catalogue item overrides are unavailable. Apply the full item edit migration to enable shared edits.',error.message);return}
 const rows=data||[],withImage=rows.filter(row=>row.image_path),resolved={};
 for(let offset=0;offset<withImage.length;offset+=40){
  const batch=withImage.slice(offset,offset+40);
  const {data:signed}=await db.storage.from(MODEL_BUCKET).createSignedUrls(batch.map(row=>row.image_path),6*60*60);
  (signed||[]).forEach((item,i)=>{if(item?.signedUrl&&!item.error)resolved[String(batch[i].model_id)]=item.signedUrl});
 }
 for(const row of rows)if(row?.model_id)itemOverrides[String(row.model_id)]={...row,resolved_image_url:resolved[String(row.model_id)]||null};
}
function openCatalogItemEditor(id){
 if(!photoAdmin||!session||!db)return;
 const model=[...catalog,...communityModels].map(applyItemOverrides).find(item=>String(item.id)===String(id));
 if(!model)return;
 editingCatalogItemId=String(id);
 $('adminItemSummary').textContent=`Editing the shared card: ${maker(model)} · ${model.brand} · ${model.name}`;
 $('adminItemManufacturer').value=maker(model);
 $('adminItemVehicleMake').value=model.brand||'';
 $('adminItemName').value=model.name||'';
 $('adminItemCode').value=model.number||'';
 $('adminItemEdition').value=edition(model)||'Regular';
 const releaseOptions=['Unverified','Announced','Preorder','TBA','Released','Discontinued'];
 const currentRelease=String(model.release||'Unverified');
 $('adminItemRelease').innerHTML=[...new Set([...releaseOptions,currentRelease])].map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('');
 $('adminItemRelease').value=currentRelease;
 $('adminItemYear').value=model.releaseYear||'';
 $('adminItemBadge').value=model.communityBadge!==undefined?model.communityBadge:(model.community?'Community verified':'');
 $('adminItemImageUrl').value=itemOverrides[String(id)]?.image_url||'';
 $('adminItemHideImage').checked=itemOverrides[String(id)]?.hide_image===true;
 $('adminItemClearImage').checked=false;$('adminItemImageFile').value='';editingAdminPhoto=null;
 if(editingAdminPhotoPreview){URL.revokeObjectURL(editingAdminPhotoPreview);editingAdminPhotoPreview=null}
 const imagePreview=$('adminItemImagePreview'),existingImage=model.adminImageUrl||model.photo;imagePreview.hidden=!existingImage;if(existingImage)imagePreview.src=existingImage;
 $('adminItemSource').value=model.photoSource||'';$('adminItemMessage').textContent='';
 $('adminItemDialog').showModal();
 setTimeout(()=>$('adminItemName').focus(),30);
}
async function saveCatalogItemEdit(){
 if(!photoAdmin||!session||!db||!editingCatalogItemId)return;
 const id=editingCatalogItemId;
 const text=id=>$(id).value.trim();
 const name=text('adminItemName');
 const vehicleMake=text('adminItemVehicleMake');
 if(!name||!vehicleMake){$('adminItemMessage').textContent='Vehicle make and model title are required.';return}
 const safeUrl=value=>{if(!value)return '';const safe=safeSourceUrl(value);return safe||false};
 const source=safeUrl(text('adminItemSource'));
 const image=safeUrl(text('adminItemImageUrl'));
 if(source===false||image===false){$('adminItemMessage').textContent='Image and source must be valid http or https URLs.';return}
 let imagePath=itemOverrides[id]?.image_path||null,uploadedPath=null;
 $('adminItemSave').disabled=true;$('adminItemMessage').textContent='Saving shared card details…';
 if(editingAdminPhoto&&!$('adminItemClearImage').checked){imagePath=`${session.user.id}/admin-card-edits/${crypto.randomUUID()}.jpg`;const upload=await db.storage.from(MODEL_BUCKET).upload(imagePath,editingAdminPhoto,{contentType:'image/jpeg',upsert:false});if(upload.error){$('adminItemSave').disabled=false;$('adminItemMessage').textContent='Could not upload replacement photo: '+upload.error.message;return}uploadedPath=imagePath}
 if($('adminItemClearImage').checked){imagePath=null}
 const row={model_id:id,manufacturer:text('adminItemManufacturer'),vehicle_make:vehicleMake,name,product_code:text('adminItemCode'),edition_type:text('adminItemEdition'),release:text('adminItemRelease'),release_year:text('adminItemYear'),community_badge:text('adminItemBadge'),source_url:source,image_url:$('adminItemClearImage').checked?'':image,image_path:imagePath,hide_image:$('adminItemHideImage').checked,updated_by:session.user.id};
 const {error}=await db.from('arbox_catalog_item_overrides').upsert(row,{onConflict:'model_id'});
 $('adminItemSave').disabled=false;
 if(error){if(uploadedPath)await db.storage.from(MODEL_BUCKET).remove([uploadedPath]);$('adminItemMessage').textContent='Could not save item: '+error.message;return}
 $('adminItemDialog').close();editingCatalogItemId=null;
 await loadCatalogItemOverrides();render();authUI('Shared card details updated for all collectors.');
}
async function saveStatus(id,status){
 if(!session){
  // The selection was only a sign-in request: discard it, don't store it.
  render();
  openLoginDialog('Choose Google or email sign-in to create your saved list. Then select the model status again.',{savedList:true});
  return;
 }
 if(status==='Not tracking')delete state[id]; else state[id]=status;
 saveLocal();render();
 if(db&&session){
  const query=db.from('collection');
  const {error}=status==='Not tracking'
   ? await query.delete().eq('user_id',session.user.id).eq('model_id',id)
   : await query.upsert({user_id:session.user.id,model_id:id,status},{onConflict:'user_id,model_id'});
  if(error)alert('Saved locally, but cloud sync failed: '+error.message);
 }
}
const loginPromptKey='arbox-garage-login-prompt-v1';
let refreshInProgress=false;
function displayName(){
 if(!session)return 'Guest';
 const metadata=session.user.user_metadata||{};
 return String(metadata.full_name||metadata.name||session.user.email||'Collector');
}
function setLoginMessage(message){$('loginStatus').textContent=message||''}
function openLoginDialog(message='',{savedList=false}={}){
 $('accountMenu').hidden=true;$('accountBtn').setAttribute('aria-expanded','false');
 $('loginTitle').textContent=savedList?'Log in to create a saved list':'Welcome to TURBO 164';
 $('loginIntro').textContent=savedList
  ?'A free account lets you mark models Owned, Ordered, Missing or Wishlist and save your garage across devices.'
  :'One account, one private garage. Choose how you want to continue.';
 setLoginMessage(message);
 if(!$('loginDialog').open)$('loginDialog').showModal();
}
function closeLoginDialog(){if($('loginDialog').open)$('loginDialog').close()}
function authUI(message=''){
 const area=$('authArea'),button=$('accountBtn'),menu=$('accountMenu');
 menu.hidden=true;button.setAttribute('aria-expanded','false');
 if(!cloudReady){
  button.textContent='Guest · Log in';
  area.innerHTML='<b>Guest preview</b><div class="muted">Browse the catalogue. Log in to create a saved list; cloud sign-in must be configured first.</div>';
  return;
 }
 if(session){
  const label=displayName();
  button.textContent='👤 '+(label.length>17?label.slice(0,16)+'…':label);
  $('accountIdentity').textContent=session.user.email||label;
  $('accountSignOut').hidden=false;
  $('accountLogin').hidden=true;
  area.innerHTML=`<b>☁ Cloud sync enabled</b><div class="muted">Signed in: ${esc(session.user.email||label)}</div>${message?`<p class="muted">${esc(message)}</p>`:''}`;
 }else{
  button.textContent='👤 Log in';
  $('accountIdentity').textContent='Guest · browsing only';
  $('accountSignOut').hidden=true;
  $('accountLogin').hidden=false;
  $('accountLogin').textContent='Log in / Sign up';
  area.innerHTML=`<b>Guest mode</b><div class="muted">Browse all four brands freely. To create a saved list or change a model's status, log in with Google or email.</div>${message?`<p class="muted">${esc(message)}</p>`:''}`;
 }
}
async function oauthLogin(provider){
 if(!db){setLoginMessage('Cloud login is not configured yet.');return}
 setLoginMessage('Opening Google sign-in…');
 const options={redirectTo:location.origin+location.pathname};
 const {error}=await db.auth.signInWithOAuth({provider:'google',options});
 if(error)setLoginMessage('Sign-in could not start: '+error.message+'. Check the provider setup in Supabase.');
}
async function emailLinkLogin(){
 if(!db){setLoginMessage('Cloud login is not configured yet.');return}
 const email=$('loginEmail').value.trim();
 if(!email){setLoginMessage('Enter your email address.');return}
 $('loginEmailSend').disabled=true;
 try{
  const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
  setLoginMessage(error?'Could not send link: '+error.message:'Check your inbox and open the sign-in link on this device.');
 }finally{$('loginEmailSend').disabled=false}
}
async function signOutToGuest(){
 if(!db)return;
 $('accountMenu').hidden=true;
 const {error}=await db.auth.signOut({scope:'local'});
 if(error){authUI('Could not sign out: '+error.message);return}
 session=null;customModels=[];photoAdmin=false;photoPending=new Set();switchState();authUI('Signed out. You are now browsing as a guest.');
 if($('adminUtilities'))$('adminUtilities').hidden=true;
 $('photoAdminPanel').hidden=true;$('modelAdminPanel').hidden=true;
}
async function refreshAll({quiet=false}={}){
 if(refreshInProgress)return;
 refreshInProgress=true;
 const button=$('syncBtn');
 button.disabled=true;button.textContent='↻ Refreshing…';
 try{
  await sync();
  await loadPublishedModels();
  await loadPhotoContributions();
  await loadMyModelSubmissions();
  if(photoAdmin)await loadModelAdminQueue();
  if(!quiet)authUI(session?'Your garage has been refreshed.':'Public catalogue refreshed. Log in to save a personal list.');
 }catch(e){
  authUI('Refresh failed: '+e.message);
 }finally{refreshInProgress=false;button.disabled=false;button.textContent='↻ Refresh'}
}
function installPullToRefresh(){
 // A gentle top-of-page gesture; browser-native pull-to-refresh also remains usable.
 let initialY=0,armed=false,tracking=false;
 const hint=$('pullHint');
 document.addEventListener('touchstart',e=>{
  const target=e.target;
  tracking=!!(e.touches.length===1&&window.scrollY<6&&
   !target.closest('dialog,input,select,textarea,button,[contenteditable="true"]'));
  initialY=tracking?e.touches[0].clientY:0;
  armed=false;
 },{passive:true});
 document.addEventListener('touchmove',e=>{
  if(!tracking||e.touches.length!==1)return;
  const delta=e.touches[0].clientY-initialY;
  if(window.scrollY>6||delta<0){tracking=false;hint.hidden=true;return}
  armed=delta>95;
  hint.textContent=armed?'Release to refresh catalogue':'Pull down to refresh';
  hint.hidden=delta<28;
 },{passive:true});
 document.addEventListener('touchend',()=>{
  const shouldRefresh=tracking&&armed;
  tracking=false;armed=false;hint.hidden=true;
  if(shouldRefresh)refreshAll();
 },{passive:true});
 document.addEventListener('touchcancel',()=>{tracking=false;armed=false;hint.hidden=true},{passive:true});
}
async function loadCloud(){
 if(!db||!session)return;
 const [collections,extras]=await Promise.all([
   db.from('collection').select('model_id,status').eq('user_id',session.user.id),
   db.from('custom_models').select('id,brand,number,name,variant,release,photo,photo_source').eq('user_id',session.user.id)
 ]);
 if(collections.error){authUI(collections.error.message);return}
 if(extras.error){authUI('Collection loaded, but custom models are unavailable. Run the v2 SQL migration.');customModels=[]}
 else customModels=(extras.data||[]).filter(x=>allowedBrands.includes(x.brand)).map(x=>({id:x.id,manufacturer:x.brand,brand:x.brand,number:x.number,name:x.name,variant:x.variant,editionType:x.variant,release:x.release,photo:x.photo,photoSource:x.photo_source,custom:true}));
 state=getLocal(userKey());
 for(const row of collections.data||[])state[row.model_id]=row.status;
 saveLocal();render();authUI('Your private garage is loaded.');
}
async function sync(){if(!db){authUI();return}const {data}=await db.auth.getSession();session=data.session;customModels=[];switchState();authUI();if(session)await loadCloud();await loadRadar();}
function radarRender(){const el=$('feed');el.innerHTML=radar.length?radar.map(x=>`<div class="feeditem"><strong>${esc(x.title)}</strong><div class="muted">${esc(x.brand)} · ${esc(x.status||'TBA / review')} · ${esc((x.detected_at||'').slice(0,10))}</div><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">View source ↗</a></div>`).join(''):'<div class="notice">No release leads have been collected yet. Enable the scheduled checker in GitHub Actions, then refresh.</div>'}
async function loadRadar(){if(!db){radarRender();return}let {data,error}=await db.from('release_leads').select('title,brand,url,status,detected_at').order('detected_at',{ascending:false}).limit(40);if(error){$('feed').innerHTML='<div class="notice">Release feed unavailable: '+esc(error.message)+'</div>';return}radar=(data||[]).filter(x=>allowedBrands.some(b=>b.toLowerCase()===String(x.brand||'').toLowerCase()));radarRender()}
function csv(){const rows=[['Number','Diecast Brand','Vehicle Make','Model','Edition','Release','Collection'],...allModels().map(m=>[m.number,maker(m),m.vehicleMake||m.brand,m.name,edition(m),m.release,session?actual(m):'Sign in to track'])];const s=rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'text/csv'}));a.download='turbo164-collection.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function b64ToUint8(s){const p='='.repeat((4-s.length%4)%4);const raw=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0))}
async function enablePush(){const status=$('pushStatus');if(!db||!session){status.textContent='Sign in to cloud sync first.';return}if(!C.vapidPublicKey){status.textContent='Add your VAPID public key to config.js first.';return}if(!('serviceWorker'in navigator)||!('PushManager'in window)){status.textContent='Push is not available in this browser. Open the installed Home Screen app.';return}try{const perm=await Notification.requestPermission();if(perm!=='granted'){status.textContent='Notifications not allowed.';return}let reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToUint8(C.vapidPublicKey)});const {error}=await db.from('push_subscriptions').upsert({user_id:session.user.id,endpoint:sub.endpoint,subscription:sub.toJSON()},{onConflict:'user_id,endpoint'});if(error)throw error;status.textContent='Push subscription saved. Alerts will arrive when the scheduled checker finds a new lead.'}catch(e){status.textContent='Could not enable push: '+e.message}}
function photoMessage(message){$('photoMessage').textContent=message}
function clearPhotoPreview(){
 chosenPhotoBlob=null;
 if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=null}
 $('photoPreview').hidden=true;$('photoPreview').removeAttribute('src');
 $('photoCameraInput').value='';$('photoGalleryInput').value='';
}
function openPhotoDialog(modelId){
 if(!session||!db){openLoginDialog('Sign in to contribute model photographs. Guests can still browse and track models locally.');return}
 const model=allModels().find(x=>x.id===modelId);
 if(!model){return}
 if(photoPending.has(modelId)){return}
 selectedPhotoModel=model;
 clearPhotoPreview();photoMessage('');$('photoConsent').checked=false;$('photoNote').value='';
 $('photoModelDescription').textContent=`${maker(model)} · ${model.name} ${model.number?'(#'+model.number+')':''}`;
 $('photoDialog').showModal();
}
function closePhotoDialog(){$('photoDialog').close();selectedPhotoModel=null;clearPhotoPreview();}
function choosePhoto(file){
 if(!file)return;
 if(!file.type.startsWith('image/')){photoMessage('Select an image file.');return}
 if(file.size>25000000){photoMessage('That image is too large. Please select one under 25 MB.');return}
 photoMessage('Preparing your image…');
 const temp=URL.createObjectURL(file);const img=new Image();
 img.onload=()=>{
  try{
   const scale=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
   canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const ctx=canvas.getContext('2d',{alpha:false});
   if(!ctx)throw Error('Image conversion is not available.');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   canvas.toBlob(blob=>{
    URL.revokeObjectURL(temp);
    if(!blob){photoMessage('Could not prepare this image. Try JPG or PNG.');return}
    if(blob.size>5*1024*1024){photoMessage('Compressed photo is still too large (5 MB maximum).');return}
    clearPhotoPreview();chosenPhotoBlob=blob;
    previewObjectUrl=URL.createObjectURL(blob);
    $('photoPreview').src=previewObjectUrl;$('photoPreview').hidden=false;
    photoMessage('Photo ready. Please confirm permission before submitting.');
   },'image/jpeg',.82);
  }catch(e){URL.revokeObjectURL(temp);photoMessage(e.message)}
 };
 img.onerror=()=>{URL.revokeObjectURL(temp);photoMessage('Could not open this file. Use JPG, PNG, or a supported phone photo format.')};
 img.src=temp;
}
async function submitPhotoContribution(){
 const model=selectedPhotoModel;
 if(!model||!session||!db){photoMessage('Please sign in first.');return}
 if(!chosenPhotoBlob){photoMessage('Choose or take a photograph first.');return}
 if(!$('photoConsent').checked){photoMessage('Confirm you own the image or have permission to submit it.');return}
 const submit=$('photoSend');submit.disabled=true;
 let storagePath=null,createdId=null;
 try{
  photoMessage('Creating a private submission…');
  storagePath=`${session.user.id}/${crypto.randomUUID()}.jpg`;
  const note=$('photoNote').value.trim().slice(0,500);
  const {data:created,error:saveError}=await db.from('model_photo_contributions').insert({model_id:model.id,user_id:session.user.id,storage_path:storagePath,note}).select('id').single();
  if(saveError)throw saveError;
  createdId=created.id;
  photoMessage('Uploading your photograph securely…');
  const {error:uploadError}=await db.storage.from(PHOTO_BUCKET).upload(storagePath,chosenPhotoBlob,{contentType:'image/jpeg',upsert:false,cacheControl:'3600'});
  if(uploadError)throw uploadError;
  photoPending.add(model.id);render();closePhotoDialog();
  $('photoGeneralStatus').textContent='Photo submitted for review. It will not appear publicly until approved.';
 }catch(e){
  photoMessage('Submission failed: '+e.message);
  if(createdId){
   await db.from('model_photo_contributions').delete().eq('id',createdId).eq('status','pending');
   if(storagePath)await db.storage.from(PHOTO_BUCKET).remove([storagePath]);
  }
 }finally{submit.disabled=false}
}
async function loadPhotoContributions(){
 if(!db){return}
 const {data:published,error:publishedError}=await db.from('model_photo_contributions').select('model_id,storage_path').eq('status','approved');
 if(publishedError){$('photoGeneralStatus').textContent='Photo service not ready: '+publishedError.message;return}
 const rows=(published||[]).filter(x=>allModels().some(m=>m.id===x.model_id));
 const nextOverrides={};
 if(rows.length){
  const {data:signed,error:signError}=await db.storage.from(PHOTO_BUCKET).createSignedUrls(rows.map(x=>x.storage_path),6*60*60);
  if(signError){$('photoGeneralStatus').textContent='Some approved photos could not be loaded: '+signError.message}
  else (signed||[]).forEach((x,i)=>{if(x&&x.signedUrl&&!x.error)nextOverrides[rows[i].model_id]=x.signedUrl});
 }
 photoOverrides=nextOverrides;
 if(session){
  const {data:mine,error:mineError}=await db.from('model_photo_contributions').select('model_id').eq('user_id',session.user.id).eq('status','pending');
  if(!mineError)photoPending=new Set((mine||[]).map(x=>x.model_id));
 }else photoPending=new Set();
 await loadCatalogItemOverrides();
 render();
 if(session)await checkPhotoAdmin();
 else{$('photoAdminPanel').hidden=true;$('modelAdminPanel').hidden=true;photoAdmin=false;if($('adminUtilities'))$('adminUtilities').hidden=true}
}
async function checkPhotoAdmin(){
 const {data,error}=await db.rpc('is_arbox_photo_admin');
 photoAdmin=!error&&data===true;
 $('photoAdminPanel').hidden=!photoAdmin;
 $('modelAdminPanel').hidden=!photoAdmin;
 if($('adminUtilities'))$('adminUtilities').hidden=!photoAdmin;
 render();
 if(photoAdmin){await loadPhotoAdminQueue();await loadModelAdminQueue()}
}
async function loadPhotoAdminQueue(){
 if(!photoAdmin||!session)return;
 const area=$('photoAdminQueue');area.textContent='Loading pending photos…';
 const {data,error}=await db.from('model_photo_contributions').select('id,model_id,storage_path,note,submitted_at').eq('status','pending').order('submitted_at',{ascending:true}).limit(30);
 if(error){area.textContent='Review queue unavailable: '+error.message;return}
 if(!data?.length){area.innerHTML='<p class="muted">No pending photographs.</p>';return}
 const cards=await Promise.all(data.map(async rec=>{
  const model=allModels().find(m=>m.id===rec.model_id);
  const {data:link}=await db.storage.from(PHOTO_BUCKET).createSignedUrl(rec.storage_path,3600);
  return `<article class="photo-review"><strong>${esc(model?maker(model)+' · '+model.name:rec.model_id+' (not in current catalogue)')}</strong><p class="muted">${esc(rec.note||'No notes provided')}</p>${link?.signedUrl?`<img loading="lazy" src="${esc(link.signedUrl)}" alt="Submitted photograph awaiting approval">`:'<p>Photo preview unavailable</p>'}<div class="review-actions"><button type="button" data-review-id="${esc(rec.id)}" data-review-state="approved" class="primary">Approve photo</button><button type="button" data-review-id="${esc(rec.id)}" data-review-state="rejected">Reject</button></div></article>`;
 }));
 area.innerHTML=cards.join('');
 area.querySelectorAll('button[data-review-id]').forEach(button=>button.addEventListener('click',async()=>{
  const id=button.dataset.reviewId,status=button.dataset.reviewState;
  if(!confirm(status==='approved'?'Publish this photograph for all collectors?':'Reject this photo submission?'))return;
  button.disabled=true;
  const {error:updateError}=await db.rpc('review_arbox_photo',{p_id:id,p_status:status});
  if(updateError){$('photoAdminMessage').textContent='Could not review submission: '+updateError.message;button.disabled=false;return}
  $('photoAdminMessage').textContent='Photo '+status+'.';
  await loadPhotoContributions();
 }));
}

// Community model catalogue. Only records explicitly approved by an administrator
// are accessible here; private submissions never enter this result.
async function loadPublishedModels(){
 if(!db)return;
 const results=[];
 for(let offset=0;;offset+=500){
  const {data,error}=await db.from('arbox_published_models').select('id,manufacturer,vehicle_make,name,number,edition_type,release,release_year,source_url,photo_paths').order('published_at',{ascending:true}).range(offset,offset+499);
  if(error){$('modelGeneralStatus').textContent='Community catalogue unavailable: '+error.message;return}
  results.push(...(data||[]));if(!data||data.length<500)break;
 }
 const withPhoto=results.filter(x=>x.photo_paths?.length);
 const pictures={};
 for(let offset=0;offset<withPhoto.length;offset+=40){
  const batch=withPhoto.slice(offset,offset+40);
  const {data,error}=await db.storage.from(MODEL_BUCKET).createSignedUrls(batch.map(m=>m.photo_paths[0]),6*60*60);
  if(error){$('modelGeneralStatus').textContent='Some community photos could not be loaded: '+error.message;continue}
  (data||[]).forEach((item,i)=>{if(item?.signedUrl&&!item.error)pictures[batch[i].id]=item.signedUrl});
 }
 communityModels=results.filter(x=>allowedBrands.includes(x.manufacturer)).map(x=>({
  id:x.id,manufacturer:x.manufacturer,brand:x.vehicle_make,vehicleMake:x.vehicle_make,
  name:x.name,number:x.number,variant:x.edition_type,editionType:x.edition_type,
  release:x.release,releaseYear:x.release_year,photo:pictures[x.id]||null,
  photoSource:safeSourceUrl(x.source_url),community:true
 }));
 renderDiecastMenu();render();
}
function safeSourceUrl(value){
 try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:''}catch{return ''}
}
function modelStatus(message){$('modelSubmitStatus').textContent=message}
function resetModelPhotos(){
 modelPhotos.forEach(p=>URL.revokeObjectURL(p.preview));modelPhotos=[];
 $('modelPhotoCameraInput').value='';$('modelPhotoGalleryInput').value='';
 renderModelPhotos();
}
function renderModelPhotos(){
 const area=$('modelPhotoPreviews');
 area.innerHTML=modelPhotos.map((p,i)=>`<div class="model-photo-item"><img src="${esc(p.preview)}" alt="New model photo ${i+1}"><button type="button" data-remove-model-photo="${i}">Remove</button></div>`).join('');
 area.querySelectorAll('[data-remove-model-photo]').forEach(button=>button.addEventListener('click',()=>{
  const index=Number(button.dataset.removeModelPhoto);const [removed]=modelPhotos.splice(index,1);
  if(removed)URL.revokeObjectURL(removed.preview);renderModelPhotos();
 }));
}
async function prepareModelPhoto(file){
 if(!file.type.startsWith('image/'))throw Error('Only image files are supported.');
 if(file.size>25*1024*1024)throw Error('Each original photo must be under 25 MB.');
 const tmp=URL.createObjectURL(file);
 try{
  const photo=await new Promise((resolve,reject)=>{
   const img=new Image();img.onload=()=>resolve(img);
   img.onerror=()=>reject(Error('Unable to open this picture on your device.'));
   img.src=tmp;
  });
  const scale=Math.min(1,1600/Math.max(photo.naturalWidth,photo.naturalHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(photo.naturalWidth*scale));
  canvas.height=Math.max(1,Math.round(photo.naturalHeight*scale));
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw Error('Image conversion is not supported here.');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(photo,0,0,canvas.width,canvas.height);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Unable to convert image.')),'image/jpeg',.8));
  if(blob.size>5*1024*1024)throw Error('The compressed photo exceeds 5 MB.');
  return {blob,preview:URL.createObjectURL(blob)};
 }finally{URL.revokeObjectURL(tmp)}
}
async function addModelPhotos(files){
 const incoming=Array.from(files||[]);
 if(!incoming.length)return;
 if(modelPhotos.length+incoming.length>3){modelStatus('You can submit up to 3 pictures per model.');return}
 modelStatus('Preparing your photographs…');
 try{
  for(const file of incoming){modelPhotos.push(await prepareModelPhoto(file));renderModelPhotos()}
  modelStatus(`${modelPhotos.length} photograph(s) ready. Images are re-encoded to remove embedded metadata.`);
 }catch(e){modelStatus('Photo preparation failed: '+e.message)}
 $('modelPhotoCameraInput').value='';$('modelPhotoGalleryInput').value='';
}
async function submitMissingModel(){
 if(!db||!session){modelStatus('Sign in to submit a model for review.');openLoginDialog('Sign in to submit a missing model.');return}
 const brand=$('modelBrand').value,vehicle_make=$('modelMake').value.trim(),name=$('modelName').value.trim(),
  product_code=$('modelCode').value.trim(),edition_type=$('modelEdition').value,release=$('modelRelease').value,
  source_url=$('modelSource').value.trim(),note=$('modelNote').value.trim();
 const yearText=$('modelYear').value.trim();
 const release_year=yearText?Number(yearText):null;
 if(!allowedBrands.includes(brand)||!vehicle_make||name.length<3){modelStatus('Choose a supported brand and enter the vehicle manufacturer and full model name.');return}
 if(name.length>180||vehicle_make.length>90||product_code.length>90||note.length>1000){modelStatus('One or more text fields are too long.');return}
 if(yearText&&(!Number.isInteger(release_year)||release_year<1980||release_year>2100)){modelStatus('Enter a valid release year between 1980 and 2100, or leave it blank.');return}
 if(source_url&&!safeSourceUrl(source_url)){modelStatus('Source must be an http or https website link.');return}
 if(!source_url&&!modelPhotos.length){modelStatus('Attach at least one photograph or a source website link for verification.');return}
 if(modelPhotos.length&&!$('modelConsent').checked){modelStatus('Please confirm you have permission to share these photos.');return}
 const existing=allModels().filter(m=>maker(m)===brand&&
  m.name.trim().toLowerCase()===name.toLowerCase()&&edition(m)===edition_type);
 if(existing.length){
  modelStatus('This model and edition are already listed. Please use a distinct model / livery name for a genuinely different release.');
  return;
 }
 const submit=$('modelSubmitSend');submit.disabled=true;let id=null;
 const photo_paths=modelPhotos.map(()=>`${session.user.id}/${crypto.randomUUID()}.jpg`);
 const uploaded=[];
 try{
  modelStatus('Saving your private proposal…');
  const {data,error}=await db.from('arbox_model_submissions').insert({
   user_id:session.user.id,brand,vehicle_make,name,product_code,edition_type,release,release_year,
   source_url,note,photo_paths
  }).select('id').single();
  if(error)throw error;id=data.id;
  for(let i=0;i<photo_paths.length;i++){
   modelStatus(`Uploading photograph ${i+1} of ${photo_paths.length}…`);
   const {error:uploadError}=await db.storage.from(MODEL_BUCKET).upload(photo_paths[i],modelPhotos[i].blob,{contentType:'image/jpeg',upsert:false});
   if(uploadError)throw uploadError;
   uploaded.push(photo_paths[i]);
  }
  modelStatus('Submission received! It remains private until an administrator approves it.');
  ['modelMake','modelName','modelCode','modelYear','modelSource','modelNote'].forEach(id=>$(id).value='');
  $('modelBrand').value='ARBOX';$('modelEdition').value='Regular';$('modelRelease').value='Unverified';$('modelConsent').checked=false;
  resetModelPhotos();await loadMyModelSubmissions();
  if(photoAdmin)await loadModelAdminQueue();
 }catch(e){
  modelStatus('Submission failed: '+e.message);
  // A failed upload must not leave a pending model available for approval.
  if(id){
   const {error:removeError}=await db.from('arbox_model_submissions').delete().eq('id',id).eq('status','pending');
   if(!removeError&&uploaded.length)await db.storage.from(MODEL_BUCKET).remove(uploaded);
  }
 }finally{submit.disabled=false}
}
async function loadMyModelSubmissions(){
 const area=$('myModelSubmissions');
 if(!session||!db){area.innerHTML='<p class="muted">Sign in to see your proposals and their review statuses.</p>';return}
 const {data,error}=await db.from('arbox_model_submissions').select('id,name,brand,status,review_note,submitted_at').eq('user_id',session.user.id).order('submitted_at',{ascending:false}).limit(15);
 if(error){area.textContent='Unable to load your submissions: '+error.message;return}
 area.innerHTML=(data||[]).length?(data||[]).map(x=>`<div class="model-submission-row"><strong>${esc(x.brand)} · ${esc(x.name)}</strong><span class="submission-status ${esc(x.status)}">${esc(x.status)}${x.review_note?' · '+esc(x.review_note):''}</span></div>`).join(''):'<p class="muted">No models submitted yet.</p>';
}
async function loadModelAdminQueue(){
 if(!photoAdmin||!session)return;
 const area=$('modelAdminQueue');area.textContent='Loading model proposals…';
 const {data,error}=await db.from('arbox_model_submissions').select('id,brand,vehicle_make,name,product_code,edition_type,release,release_year,source_url,note,photo_paths,submitted_at').eq('status','pending').order('submitted_at',{ascending:true}).limit(30);
 if(error){area.textContent='Review queue unavailable: '+error.message;return}
 if(!data?.length){area.innerHTML='<p class="muted">No pending model submissions.</p>';return}
 const cards=await Promise.all(data.map(async rec=>{
  let photos=[];
  if(rec.photo_paths?.length){
   const {data:links}=await db.storage.from(MODEL_BUCKET).createSignedUrls(rec.photo_paths,3600);
   photos=(links||[]).filter(x=>x?.signedUrl&&!x.error).map(x=>x.signedUrl);
  }
  const duplicates=allModels().filter(m=>maker(m)===rec.brand&&(
   rec.product_code&&String(m.number||'').toLowerCase()===rec.product_code.toLowerCase()
   ||m.name.trim().toLowerCase()===rec.name.trim().toLowerCase()));
  const dupLabel=duplicates.length?`<p class="model-warning">⚠ Potential catalogue match: ${esc(duplicates.slice(0,3).map(m=>m.name).join('; '))}. Verify before approving.</p>`:'';
  const source=safeSourceUrl(rec.source_url);
  return `<article class="model-review"><div class="model-review-heading"><strong>${esc(rec.brand)} · ${esc(rec.name)}</strong><div class="admin-menu-wrapper"><button type="button" class="admin-menu-trigger" data-admin-menu-toggle aria-label="Admin actions for pending ${esc(rec.name)}" aria-expanded="false">⋮</button><div class="admin-menu-popover" hidden><button type="button" data-edit-submission-label="${esc(rec.id)}" data-current-label="${esc(rec.name)}">Edit label</button></div></div></div><p class="muted">Vehicle: ${esc(rec.vehicle_make)} · Code: ${esc(rec.product_code||'Not supplied')} · ${esc(rec.edition_type)} · ${esc(rec.release)}${rec.release_year?' · '+esc(rec.release_year):''}</p>${source?`<p><a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Submitted source ↗</a></p>`:''}<p class="muted">Notes: ${esc(rec.note||'None')}</p>${dupLabel}<div class="model-review-photos">${photos.map(src=>`<img loading="lazy" src="${esc(src)}" alt="Photo supporting new model submission">`).join('')}</div><div class="review-actions"><button type="button" class="primary" data-model-review="${esc(rec.id)}" data-model-review-status="approved">Approve &amp; publish</button><button type="button" data-model-review="${esc(rec.id)}" data-model-review-status="rejected">Reject</button></div></article>`;
 }));
 area.innerHTML=cards.join('');
 bindAdminMenus(area);
 area.querySelectorAll('[data-edit-submission-label]').forEach(button=>button.addEventListener('click',async()=>{
  closeAdminMenus();
  const label=prompt('Edit the submitted release label before review:',button.dataset.currentLabel||'');
  if(label===null)return;
  const next=label.trim();
  if(!next||next.length>180){$('modelAdminMessage').textContent='Enter a label from 1 to 180 characters.';return}
  button.disabled=true;
  const {error:updateError}=await db.rpc('admin_edit_arbox_model_submission_label',{p_id:button.dataset.editSubmissionLabel,p_label:next});
  if(updateError){$('modelAdminMessage').textContent='Could not edit submission label: '+updateError.message;button.disabled=false;return}
  $('modelAdminMessage').textContent='Submission label updated.';
  await loadModelAdminQueue();
 }));
 area.querySelectorAll('[data-model-review]').forEach(button=>button.addEventListener('click',async()=>{
  const id=button.dataset.modelReview,status=button.dataset.modelReviewStatus;
  let reviewNote='';
  if(status==='rejected'){const entered=prompt('Reason for rejection (visible to submitter):');if(entered===null)return;reviewNote=entered.trim().slice(0,500)}
  else if(!confirm('Have you verified this exact release, edition, code and image permission? Publish it for all collectors?'))return;
  button.disabled=true;
  const {error}=await db.rpc('review_arbox_model_submission',{p_id:id,p_status:status,p_review_note:reviewNote});
  if(error){$('modelAdminMessage').textContent='Review failed: '+error.message;button.disabled=false;return}
  $('modelAdminMessage').textContent=status==='approved'?'Model approved and added to the public catalogue.':'Model rejected.';
  await loadPublishedModels();await loadModelAdminQueue();await loadMyModelSubmissions();
 }));
}

function closeDiecastMenu(){$('diecastMenu').hidden=true;$('diecastMenuButton').setAttribute('aria-expanded','false')}
function renderDiecastMenu(){
 const menu=$('diecastMenu');
 if(diecastMenuLevel==='root'){
  menu.innerHTML=`<button type="button" data-open-brand-list>All brands ›</button><div class="diecast-menu-separator"></div><div class="diecast-menu-note">Filter diecast releases</div><button type="button" data-diecast-filter="Chase">Chase</button><button type="button" data-diecast-filter="Event">Event</button><button type="button" data-diecast-filter="Limited">Limited</button><button type="button" data-diecast-filter="Upcoming">Upcoming</button>`;
  return;
 }
 if(diecastMenuLevel==='brands'){
  const brands=availableDiecastBrands();
  menu.innerHTML=`<div class="diecast-menu-heading"><button type="button" class="diecast-menu-back" data-menu-back="root">‹ Back</button><strong>All brands</strong></div><button type="button" data-select-all-diecast>All diecast models</button><div class="diecast-menu-separator"></div>${brands.map(brand=>`<button type="button" data-select-diecast-brand="${esc(brand)}">${esc(brand)} ›</button>`).join('')||'<div class="diecast-menu-note">No diecast brands are listed yet.</div>'}`;
  return;
 }
 const makes=availableCarManufacturers(diecastMenuBrand);
 menu.innerHTML=`<div class="diecast-menu-heading"><button type="button" class="diecast-menu-back" data-menu-back="brands">‹ All brands</button><strong>${esc(diecastMenuBrand)}</strong></div><button type="button" data-select-brand-all="${esc(diecastMenuBrand)}">All ${esc(diecastMenuBrand)} models</button><div class="diecast-menu-separator"></div><div class="diecast-menu-note">Car manufacturer</div>${makes.map(make=>`<button type="button" data-select-car-make="${esc(make)}">${esc(make)}</button>`).join('')||'<div class="diecast-menu-note">No car manufacturers are listed in this catalog.</div>'}`;
}
function applyCatalogRouteFromUrl(){
 const url=new URL(location.href),section=url.searchParams.get('section'),brand=url.searchParams.get('brand'),make=url.searchParams.get('make'),releaseFilter=url.searchParams.get('filter');
 const sections=['Diecast','Diorama','Figure','Accessory','Other'];
 catalogView=sections.find(value=>value.toLowerCase()===String(section||'diecast').toLowerCase())||'Diecast';
 selectedDiecastBrand=catalogView==='Diecast'&&availableDiecastBrands().includes(brand)?brand:'All';
 selectedDiecastMake=selectedDiecastBrand!=='All'&&make?make:'All';
 filter=catalogView==='Diecast'&&['Chase','Event','Limited','Upcoming'].includes(releaseFilter)?releaseFilter:'All';
 diecastMenuLevel='root';diecastMenuBrand='All';closeDiecastMenu();
}
function updateCatalogUrl(){
 const url=new URL(location.href);url.searchParams.set('section',catalogView.toLowerCase());
 if(catalogView==='Diecast'&&selectedDiecastBrand!=='All')url.searchParams.set('brand',selectedDiecastBrand);else url.searchParams.delete('brand');
 if(catalogView==='Diecast'&&selectedDiecastMake!=='All')url.searchParams.set('make',selectedDiecastMake);else url.searchParams.delete('make');
 if(catalogView==='Diecast'&&filter!=='All')url.searchParams.set('filter',filter);else url.searchParams.delete('filter');
 history.pushState({catalogView,selectedDiecastBrand,selectedDiecastMake,filter},'',url);
}
function navigateCatalog(section,brand='All',make='All',releaseFilter='All'){
 catalogView=['Diecast','Diorama','Figure','Accessory','Other'].includes(section)?section:'Diecast';
 selectedDiecastBrand=catalogView==='Diecast'&&availableDiecastBrands().includes(brand)?brand:'All';
 selectedDiecastMake=selectedDiecastBrand!=='All'&&make!=='All'&&availableCarManufacturers(selectedDiecastBrand).includes(make)?make:'All';
 filter=catalogView==='Diecast'&&['Chase','Event','Limited','Upcoming'].includes(releaseFilter)?releaseFilter:'All';$('search').value='';
 updateCatalogUrl();closeDiecastMenu();render();$('catalogTitle').scrollIntoView({behavior:'smooth',block:'start'});
}
function handleDiecastMenuClick(event){
 const button=event.target.closest('button');if(!button)return;
 if(button.hasAttribute('data-open-brand-list')){diecastMenuLevel='brands';renderDiecastMenu();return}
 if(button.dataset.menuBack){diecastMenuLevel=button.dataset.menuBack;if(diecastMenuLevel==='root')diecastMenuBrand='All';renderDiecastMenu();return}
 if(button.hasAttribute('data-select-all-diecast')){navigateCatalog('Diecast');return}
 if(button.dataset.selectDiecastBrand){
  diecastMenuBrand=button.dataset.selectDiecastBrand;diecastMenuLevel='makes';
  navigateCatalog('Diecast',diecastMenuBrand);$('diecastMenu').hidden=false;$('diecastMenuButton').setAttribute('aria-expanded','true');renderDiecastMenu();return;
 }
 if(button.dataset.selectBrandAll){navigateCatalog('Diecast',button.dataset.selectBrandAll);return}
 if(button.dataset.selectCarMake){navigateCatalog('Diecast',diecastMenuBrand,button.dataset.selectCarMake);return}
 if(button.dataset.diecastFilter){navigateCatalog('Diecast','All','All',button.dataset.diecastFilter)}
}

async function start(){
 catalog=(await (await fetch('catalog.json')).json()).filter(eligible);
 applyCatalogRouteFromUrl();
 render();
 $('search').oninput=render;
 renderDiecastMenu();
 $('diecastMenu').addEventListener('click',handleDiecastMenuClick);
 $('diecastMenuButton').onclick=()=>{
  if(catalogView!=='Diecast')navigateCatalog('Diecast');
  const menu=$('diecastMenu');const opening=menu.hidden;
  if(opening){diecastMenuLevel='root';diecastMenuBrand='All';renderDiecastMenu()}
  menu.hidden=!opening;$('diecastMenuButton').setAttribute('aria-expanded',String(opening));
 };
 document.querySelectorAll('[data-category]').forEach(button=>button.onclick=()=>navigateCatalog(button.dataset.category));
 window.addEventListener('popstate',()=>{applyCatalogRouteFromUrl();render();renderDiecastMenu()});
 document.addEventListener('click',event=>{if(!event.target.closest('.diecast-nav'))closeDiecastMenu()});
 $('syncBtn').onclick=()=>refreshAll();
 $('accountMenuRefresh').onclick=()=>{$('accountMenu').hidden=true;refreshAll()};
 $('accountBtn').onclick=()=>{if(!session){openLoginDialog();return}const menu=$('accountMenu');menu.hidden=!menu.hidden;$('accountBtn').setAttribute('aria-expanded',String(!menu.hidden))};
 $('accountLogin').onclick=()=>openLoginDialog();
 $('accountSignOut').onclick=signOutToGuest;
 $('loginClose').onclick=closeLoginDialog;
 $('loginGuest').onclick=()=>{localStorage.setItem(loginPromptKey,'1');closeLoginDialog();authUI()};
 $('loginGoogle').onclick=()=>oauthLogin('google');
 $('loginEmailForm').onsubmit=e=>{e.preventDefault();emailLinkLogin()};
 $('loginDialog').addEventListener('close',()=>localStorage.setItem(loginPromptKey,'1'));
 document.addEventListener('click',e=>{
  if(!e.target.closest('.admin-menu-wrapper'))closeAdminMenus();
  if(!$('accountMenu').hidden&&!e.target.closest('.account-anchor')){$('accountMenu').hidden=true;$('accountBtn').setAttribute('aria-expanded','false')}
 });
 installPullToRefresh();
 $('refresh').onclick=loadRadar;
 $('export').onclick=csv;
 $('push').onclick=enablePush;
 $('photoCamera').onclick=()=>$('photoCameraInput').click();
 $('photoGallery').onclick=()=>$('photoGalleryInput').click();
 $('photoCameraInput').onchange=e=>choosePhoto(e.target.files?.[0]);
 $('photoGalleryInput').onchange=e=>choosePhoto(e.target.files?.[0]);
 $('photoClose').onclick=closePhotoDialog;
 $('photoSend').onclick=submitPhotoContribution;
 $('photoRefresh').onclick=loadPhotoAdminQueue;
 $('modelPhotoCamera').onclick=()=>$('modelPhotoCameraInput').click();
 $('modelPhotoGallery').onclick=()=>$('modelPhotoGalleryInput').click();
 $('modelPhotoCameraInput').onchange=e=>addModelPhotos(e.target.files);
 $('modelPhotoGalleryInput').onchange=e=>addModelPhotos(e.target.files);
 $('modelSubmitSend').onclick=submitMissingModel;
 $('modelAdminRefresh').onclick=loadModelAdminQueue;
 $('adminItemSave').onclick=saveCatalogItemEdit;
 $('adminItemCancel').onclick=()=>{$('adminItemDialog').close()};
 $('adminItemChooseImage').onclick=()=>$('adminItemImageFile').click();
 $('adminItemImageFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const prepared=await prepareModelPhoto(file);if(editingAdminPhotoPreview)URL.revokeObjectURL(editingAdminPhotoPreview);editingAdminPhoto=prepared.blob;editingAdminPhotoPreview=prepared.preview;$('adminItemImagePreview').src=prepared.preview;$('adminItemImagePreview').hidden=false;$('adminItemClearImage').checked=false;$('adminItemMessage').textContent='Replacement photo ready.'}catch(error){$('adminItemMessage').textContent='Could not prepare photo: '+error.message}};
 $('adminItemDialog').addEventListener('close',()=>{editingCatalogItemId=null;editingAdminPhoto=null;if(editingAdminPhotoPreview)URL.revokeObjectURL(editingAdminPhotoPreview);editingAdminPhotoPreview=null;$('adminItemMessage').textContent=''});

 $('photoDialog').addEventListener('close',()=>{selectedPhotoModel=null;clearPhotoPreview()});
 if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
 if(db){
  db.auth.onAuthStateChange((_event,s)=>{
   const old=session?.user?.id;session=s;
   if(old!==s?.user?.id){customModels=[];photoPending=new Set();switchState()}
   authUI();
   if(s){closeLoginDialog();setTimeout(async()=>{await loadCloud();await loadPublishedModels();await loadPhotoContributions();await loadMyModelSubmissions()},0);}
   else {$('photoAdminPanel').hidden=true;$('modelAdminPanel').hidden=true;photoAdmin=false;if($('adminUtilities'))$('adminUtilities').hidden=true;loadPhotoContributions()}
  });
 }
 await refreshAll({quiet:true});
 if(!session&&!localStorage.getItem(loginPromptKey)){openLoginDialog();}
}
start().catch(e=>{$('authArea').textContent='Could not load app: '+e.message});
