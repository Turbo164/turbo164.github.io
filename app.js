const $=id=>document.getElementById(id);const C=window.ARBOX_CONFIG||{};
const cloudReady=!!(C.supabaseUrl&&C.supabaseAnonKey&&window.supabase);
const db=cloudReady?window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
let catalog=[],state={},session=null,filter='All',catalogView='Diecast',selectedDiecastBrand='All',selectedDiecastMake='All',diecastMenuLevel='root',diecastMenuBrand='All',catalogPage=1,radar=[],customModels=[],communityModels=[];
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
const allowedBrands=['ARBOX','PGM','Tarmac Works','INNO64','BBR'];
const editionTypes=['Regular','Chase','Event Exclusive','Limited Edition'];
function maker(m){return m.manufacturer||(m.brand==='Porsche'||m.brand==='Land Rover'?'ARBOX':m.brand)}
function eligible(m){
 const brand=maker(m);
 return allowedBrands.includes(brand)||!!(brand&&itemOverrides[String(m.id)]?.manufacturer===brand);
}
function adminBrandSuggestions(current){
 const brands=[current,...allowedBrands,...availableDiecastBrands()].filter(Boolean);
 const unique=new Map();
 for(const brand of brands){const key=brand.trim().toLowerCase();if(key&&!unique.has(key))unique.set(key,brand.trim());}
 return [...unique.values()].sort((a,b)=>a.localeCompare(b));
}
function edition(m){return m.editionType||(m.variant==='Chase'?'Chase':'Regular')}
function displayLabel(m){return m.name}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function actual(m){return state[m.id]||(m.community?'Not tracking':'Missing')}
const dioramaSource='https://www.flim164.com/products';
let dioramaProducts=null,dioramaLoading=false,dioramaUnavailable=false;
function isPartnerSection(){return catalogView==='Diorama'||catalogView==='Accessory'}
function partnerUrl(value,path){
 try{
  const url=new URL(value);
  return url.origin==='https://www.flim164.com'&&path.test(url.pathname)?url.href:'';
 }catch{return ''}
}
async function loadDioramaCatalogue(){
 dioramaLoading=true;
 for(const url of ['https://raw.githubusercontent.com/Turbo164/turbo164.github.io/main/diorama-catalog.json','diorama-catalog.json']){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout?.(6000)});
   if(!response.ok)continue;
   const data=await response.json();
   const items=data.products?.filter(item=>typeof item?.name==='string'&&item.name.trim()&&partnerUrl(item.url,/^\/products\/[a-z0-9-]+$/));
   if(!items?.length)continue;
   dioramaProducts=items;
   break;
  }catch{/* Try the bundled snapshot when the live GitHub copy is unavailable. */}
 }
 dioramaUnavailable=!dioramaProducts;
 dioramaLoading=false;
 if(isPartnerSection())render();
}
function renderPartnerCatalogue(query){
 if(!dioramaProducts&&!dioramaLoading&&!dioramaUnavailable)void loadDioramaCatalogue();
 const accessoryView=catalogView==='Accessory';
 const items=(dioramaProducts||[]).filter(item=>(item.category==='Decorative Accessories')===accessoryView&&
  [item.name,item.category,item.scale,item.dimensions,'FILM CUSTOM MODEL FLIM164'].join(' ').toLowerCase().includes(query.trim()));
 $('count').textContent=dioramaProducts?`${items.length} ${items.length===1?"item":"items"}`:'';
 const status=dioramaUnavailable?'The partner catalog is temporarily unavailable.':dioramaLoading?'Loading partner catalog…':items.length?'':accessoryView?'No matching accessories.':'No matching dioramas.';
 $('models').innerHTML=`<div class="notice diorama-partner"><strong>FILM CUSTOM MODEL</strong> <span class="muted">Turbo164 partner</span> <a class="source-link" href="${dioramaSource}" target="_blank" rel="noopener noreferrer">Browse all on FLIM164 ↗</a>
 ${status?`<p role="status">${esc(status)}</p>`:''}</div>`+items.map(item=>{
  const href=partnerUrl(item.url,/^\/products\/[a-z0-9-]+$/);
  const image=partnerUrl(item.image,/^\/media\/products\/[A-Za-z0-9._/-]+$/);
  const soldOut=item.soldOut===true;
  const price=typeof item.price==='string'&&/^\$\s*\d[\d,]*(?:\.\d{2})?$/.test(item.price)?item.price:'';
  return `<article class="model${soldOut?' diorama-sold-out':''}">
   <div class="photo">${soldOut?`<span class="diorama-sold-out-label">Sold out</span>`:''}${image?`<a class="photo-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="${esc(image)}" alt="${esc(item.name)}" onerror="this.parentElement.hidden=true;this.parentElement.nextElementSibling.hidden=false"></a>`:''}<span class="photo-pending" ${image?'hidden':''}>Photo unavailable</span></div>
   <div class="info"><div class="name">${esc(item.name)}</div><div class="sub"><span class="pill">${esc(item.category)}</span></div>
   ${price?`<p class="diorama-price">${esc(price)}</p>`:''}
   ${item.dimensions?`<p class="muted">${esc(item.dimensions)}</p>`:''}<a class="source-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer">View on FLIM164 ↗</a></div>
  </article>`;
 }).join('');
}


const garageStatuses=['Owned','Ordered','Wishlist'];
let garageStatus='Owned',garageOwner=null;
function renderMiniGarage(models){
 const dialog=$('miniGarageDialog');
 if(!dialog.open)return;
 if(session?.user.id!==garageOwner){
  $('miniGarageItems').replaceChildren();
  dialog.close();
  return;
 }
 const groups=Object.fromEntries(garageStatuses.map(status=>[status,[]]));
 for(const model of models){
  const status=actual(model);
  if(garageStatuses.includes(status))groups[status].push(model);
 }
 for(const button of $('miniGarageFilters').querySelectorAll('[data-garage-status]')){
  const status=button.dataset.garageStatus;
  button.setAttribute('aria-pressed',String(status===garageStatus));
  button.querySelector('small').textContent=groups[status].length;
 }
 const rows=groups[garageStatus];
 $('miniGarageEmpty').hidden=rows.length>0;
 $('miniGarageItems').innerHTML=rows.map(model=>{
  const details=[maker(model),model.number?'#'+model.number:'',edition(model)].filter(Boolean).join(' · ');
  return `<li><strong>${esc(displayLabel(model))}</strong><span class="muted">${esc(details)}</span></li>`;
 }).join('');
}
function openMiniGarage(status='Owned'){
 if(!session){
  openLoginDialog('Log in to open your mini garage.',{savedList:true});
  return;
 }
 garageOwner=session.user.id;
 garageStatus=status;
 $('miniGarageDialog').showModal();
 renderMiniGarage(allModels());
}

const realpaintAlbum='https://www.facebook.com/media/set/?set=a.1664794533944179&type=3';
const realpaintPhotoIds=[4,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439,440,441,442,443,444,445,446,447,448,449,450,451,452,453,454,455,456,457,458,459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513,514,515,516,517,518,519,520,521,522,523,524,525,526,527,528,529,530,531,532,533,534,535,536,537,538,539,540,541,542,543,544,545,546,547,548,549,550,551,552,553,554,555,556,557,558,559,560,561,562,563,564,565,566,567,568,569,570,571,572,573,574,575,576,577,578,579,580,581,582,583,584,585,586,587,588,589,590,591,592,593,594,595,596,597,598,599,600,601,602,603,604,605,606,607,608,609,610,611,612,613,614,615,616,617,618,619,620,621,622,623,624,625,626,627,628,629,630,631,632,633,634,635,636,637,638,639,640,641,642,643,644,645,646,647,648,649,650,651,652,653,654,655,656,657,658,659,660,661,662,663,664,665,666,667,668,669,670,671,672,673,674,675,676,677,678,679,680,681,682,683,684,685,686,687,688,689,690,691,692,693,694,695,696,697,698,699,700,701,702,703,704,705,706,707,708,709,710,711,712,713,714,715,716,717,718,719,720,721,722,723,724,725,726,727,728,729,730,731,732,733,734,735,736,737,738,739,740,741,742,743,744,745,746,747,748,749,750,751,752,753,754,755,756,757,758,759,760,761,762,763,764,765,766,767,768,769,770,771,772,773,774,775,776,777,778,779,780,781,782,783,784,785,786,787,788,789,790,791,792,793,794,795,796,797,798,799,800,801,802,803,804,805,806,807,808,809,810,811,812,813,814,815,816,817,818,819,820,821,822,823,824,825,826,827,828,829,830,831,832,833,834,835,836,837,838,839,840,841,842,843,844,845,846,847,849,850,851,852,853,854,855,856,857,858,859,860,861,862,863,864,865,866,867,868,869,870,871,872,873,874,875,876,877,878,879,880,881,882,883,884,885,886,887,888,889,890,891,893,894,895,896,897,898,899,900,901,902,903,904,905,906,907,908,909,910,911,912,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,930,931,932,933,934,935,936,937,938,939,940,941,942,943,944,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,962,963,964,965,966,967,968,969,970,971,972,973,974,975,976,977,978,979,980,981,982,983,984,985,986,987,988,989,990,991,992,993,994,995,996,997,998,999,1000,1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023,1024,1025,1026,1027,1028,1030,1031,1032,1033,1034,1035,1036,1037,1038,1039,1040,1041,1042,1043,1044,1047,1048,1049];
const realpaintPageSize=27;
let realpaintPage=0;
function renderRealpaintCatalogue(){
 const pages=Math.ceil(realpaintPhotoIds.length/realpaintPageSize);
 const start=realpaintPage*realpaintPageSize;
 const photos=realpaintPhotoIds.slice(start,start+realpaintPageSize);
 $('count').textContent=`${realpaintPhotoIds.length} photos`;
 const area=$('models');
 area.innerHTML=`<div class="notice diorama-partner"><strong>Realpaint Studio</strong> <span class="muted">Turbo164 partner</span>
  <a class="source-link" href="${esc(realpaintAlbum)}" target="_blank" rel="noopener noreferrer">Browse the Facebook album ↗</a>
 </div>`+photos.map((id,index)=>`<article class="model">
  <a class="realpaint-album-photo" href="realpaint/${id}.jpg" target="_blank" rel="noopener" aria-label="Open Realpaint Studio album photo ${start+index+1}">
   <img src="realpaint/${id}.jpg" loading="lazy" alt="Realpaint Studio album photo ${start+index+1}">
  </a>
 </article>`).join('');
 const nav=$('catalogPagination');
 const first=start+1,last=Math.min(realpaintPhotoIds.length,start+photos.length);
 const page=realpaintPage+1,totalPages=pages;
 const rangeStart=Math.max(1,Math.min(page-2,totalPages-4)),rangeEnd=Math.min(totalPages,rangeStart+4);
 const pageButtons=Array.from({length:rangeEnd-rangeStart+1},(_,i)=>rangeStart+i).map(number=>`<button type="button" class="catalog-page-number" data-realpaint-page-number="${number}" ${number===page?'aria-current="page"':''} aria-label="Page ${number}">${number}</button>`).join('');
 nav.hidden=realpaintPhotoIds.length<=realpaintPageSize;
 nav.innerHTML=`<span class="catalog-page-summary">Showing ${first}–${last} of ${realpaintPhotoIds.length} photos · Page ${page} of ${totalPages}</span><div class="catalog-page-controls"><button type="button" class="outline" data-realpaint-page-number="${Math.max(1,page-1)}" ${page===1?'disabled':''}>‹ Previous</button>${pageButtons}<button type="button" class="outline" data-realpaint-page-number="${Math.min(totalPages,page+1)}" ${page===totalPages?'disabled':''}>Next ›</button></div>`;
 nav.querySelectorAll('[data-realpaint-page-number]').forEach(button=>button.onclick=()=>{
  const next=Number(button.dataset.realpaintPageNumber);if(!Number.isInteger(next)||next===page)return;
  realpaintPage=next-1;renderRealpaintCatalogue();
  nav.querySelector(`[data-realpaint-page-number="${next}"]`)?.focus();
 });
}

function renderCatalogPagination(total){
 const nav=$('catalogPagination');if(!nav)return;
 const pageSize=27,totalPages=Math.max(1,Math.ceil(total/pageSize));
 catalogPage=Math.min(Math.max(1,catalogPage),totalPages);
 if(catalogView!=='Diecast'||total<=pageSize){nav.hidden=true;nav.replaceChildren();return}
 nav.hidden=false;
 const first=(catalogPage-1)*pageSize+1,last=Math.min(total,catalogPage*pageSize);
 const start=Math.max(1,Math.min(catalogPage-2,totalPages-4)),end=Math.min(totalPages,start+4);
 const numbers=Array.from({length:end-start+1},(_,i)=>start+i).map(page=>`<button type="button" class="catalog-page-number" data-catalog-page="${page}" ${page===catalogPage?'aria-current="page"':''} aria-label="Page ${page}">${page}</button>`).join('');
 nav.innerHTML=`<span class="catalog-page-summary">Showing ${first}–${last} of ${total} cars · Page ${catalogPage} of ${totalPages}</span><div class="catalog-page-controls"><button type="button" class="outline" data-catalog-page="${Math.max(1,catalogPage-1)}" ${catalogPage===1?'disabled':''}>‹ Previous</button>${numbers}<button type="button" class="outline" data-catalog-page="${Math.min(totalPages,catalogPage+1)}" ${catalogPage===totalPages?'disabled':''}>Next ›</button></div>`;
 nav.querySelectorAll('[data-catalog-page]').forEach(button=>button.addEventListener('click',()=>{
  const next=Number(button.dataset.catalogPage);if(!Number.isInteger(next)||next===catalogPage)return;
  catalogPage=next;render();$('catalogTitle').scrollIntoView({behavior:'smooth',block:'start'});
 }));
}
function render(){
 $('search').hidden=catalogView==='Figure';
 $('catalogPagination').hidden=catalogView!=='Diecast';
 const q=$('search').value.toLowerCase();
 const all=allModels();
 renderMiniGarage(all);
 const items=catalogView==='Diecast'?all.filter(m=>(selectedDiecastBrand==='All'||maker(m)===selectedDiecastBrand)&&(selectedDiecastMake==='All'||String(m.brand||'').trim().toLowerCase()===selectedDiecastMake.toLowerCase())&&(filter==='All'||(filter==='Chase'&&edition(m)==='Chase')||(filter==='Event'&&edition(m)==='Event Exclusive')||(filter==='Limited'&&edition(m)==='Limited Edition')||(filter==='Upcoming'&&['TBA','Preorder','Announced','Upcoming'].includes(m.release)))&&(`${m.number} ${displayLabel(m)} ${m.name} ${m.brand} ${maker(m)} ${edition(m)}`.toLowerCase().includes(q))):[];
 // Don't misrepresent public catalogue items as a guest's private collection.
 $('owned').textContent=session?all.filter(m=>actual(m)==='Owned').length:'—';
 $('ordered').textContent=session?all.filter(m=>actual(m)==='Ordered').length:'—';
 $('missing').textContent=session?all.filter(m=>actual(m)==='Missing').length:'—';
 $('catalogTitle').textContent=catalogView==='Diecast'?(selectedDiecastBrand==='All'?(filter==='All'?'Diecast catalogue':`${filter} diecast catalogue`):selectedDiecastMake==='All'?`${selectedDiecastBrand} catalogue`:`${selectedDiecastBrand} · ${selectedDiecastMake} catalogue`):`${catalogView} catalogue`;
 $('count').textContent=catalogView==='Diecast'?`${items.length} models`:'0 items';
 const totalCatalogPages=Math.max(1,Math.ceil(items.length/27));catalogPage=Math.min(catalogPage,totalCatalogPages);const pageItems=items.slice((catalogPage-1)*27,catalogPage*27);
 $('diecastMenuButton').classList.toggle('active',catalogView==='Diecast');
 document.querySelectorAll('[data-category]').forEach(button=>button.classList.toggle('active',button.dataset.category===catalogView));
 if(catalogView==='Figure'){renderRealpaintCatalogue();return}
 if(isPartnerSection()){renderPartnerCatalogue(q);return}
 $('models').innerHTML=pageItems.map(m=>{
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
 renderCatalogPagination(items.length);
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
 $('adminItemManufacturer').value=maker(model)||'';
 $('adminItemManufacturerOptions').replaceChildren(...adminBrandSuggestions(maker(model)).map(brand=>new Option(brand,brand)));
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
 const manufacturer=text('adminItemManufacturer');
 if(!manufacturer||manufacturer.length>120){$('adminItemMessage').textContent='Enter a brand name of 1 to 120 characters.';return}
 if(!name||!vehicleMake){$('adminItemMessage').textContent='Vehicle make and model title are required.';return}
 const safeUrl=value=>{if(!value)return '';const safe=safeSourceUrl(value);return safe||false};
 const source=safeUrl(text('adminItemSource'));
 const image=safeUrl(text('adminItemImageUrl'));
 if(source===false||image===false){$('adminItemMessage').textContent='Image and source must be valid http or https URLs.';return}
 let imagePath=itemOverrides[id]?.image_path||null,uploadedPath=null;
 $('adminItemSave').disabled=true;$('adminItemMessage').textContent='Saving shared card details…';
 if(editingAdminPhoto&&!$('adminItemClearImage').checked){imagePath=`${session.user.id}/admin-card-edits/${crypto.randomUUID()}.jpg`;const upload=await db.storage.from(MODEL_BUCKET).upload(imagePath,editingAdminPhoto,{contentType:'image/jpeg',upsert:false});if(upload.error){$('adminItemSave').disabled=false;$('adminItemMessage').textContent='Could not upload replacement photo: '+upload.error.message;return}uploadedPath=imagePath}
 if($('adminItemClearImage').checked){imagePath=null}
 const row={model_id:id,manufacturer,vehicle_make:vehicleMake,name,product_code:text('adminItemCode'),edition_type:text('adminItemEdition'),release:text('adminItemRelease'),release_year:text('adminItemYear'),community_badge:text('adminItemBadge'),source_url:source,image_url:$('adminItemClearImage').checked?'':image,image_path:imagePath,hide_image:$('adminItemHideImage').checked,updated_by:session.user.id};
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
 if(typeof window.communityAuthChanged==='function')window.communityAuthChanged();
}
async function refreshAll({quiet=false}={}){
 if(refreshInProgress)return;
 refreshInProgress=true;
 try{
  await sync();
  await loadPublishedModels();
  await loadPhotoContributions();
  await loadMyModelSubmissions();
  if(photoAdmin)await loadModelAdminQueue();
  if(!quiet)authUI(session?'Your garage has been refreshed.':'Public catalogue refreshed. Log in to save a personal list.');
 }catch(e){
  authUI('Refresh failed: '+e.message);
 }finally{refreshInProgress=false}
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
  if(shouldRefresh){if(document.body.classList.contains('community-view'))window.communityRefresh?.();else refreshAll()}
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
 const brands=availableDiecastBrands();
 const makes=diecastMenuBrand==='All'?[]:availableCarManufacturers(diecastMenuBrand);
 menu.dataset.level=diecastMenuLevel;
 menu.innerHTML=`
  <section class="diecast-menu-panel diecast-menu-panel-root" aria-label="Diecast filters">
   <button type="button" data-open-brand-list>All brands <span aria-hidden="true">›</span></button>
   <div class="diecast-menu-separator"></div><div class="diecast-menu-note">Filter diecast releases</div>
   <button type="button" data-diecast-filter="Chase">Chase</button><button type="button" data-diecast-filter="Event">Event</button><button type="button" data-diecast-filter="Limited">Limited</button><button type="button" data-diecast-filter="Upcoming">Upcoming</button>
  </section>
  <section class="diecast-menu-panel diecast-menu-panel-brands" aria-label="Diecast brands">
   <div class="diecast-menu-heading"><button type="button" class="diecast-menu-back diecast-menu-mobile-back" data-menu-back="root">‹ Back</button><strong>All brands</strong></div>
   <button type="button" data-select-all-diecast>All diecast models</button><div class="diecast-menu-separator"></div>
   ${brands.map(brand=>`<button type="button" data-select-diecast-brand="${esc(brand)}">${esc(brand)} <span aria-hidden="true">›</span></button>`).join('')||'<div class="diecast-menu-note">No diecast brands are listed yet.</div>'}
  </section>
  <section class="diecast-menu-panel diecast-menu-panel-makes" aria-label="Car manufacturers">
   <div class="diecast-menu-heading"><button type="button" class="diecast-menu-back diecast-menu-mobile-back" data-menu-back="brands">‹ All brands</button><strong>${esc(diecastMenuBrand==='All'?'Choose brand':diecastMenuBrand)}</strong></div>
   ${diecastMenuBrand==='All'?'<div class="diecast-menu-note">Choose a brand to see its catalog manufacturers.</div>':`<button type="button" data-select-brand-all="${esc(diecastMenuBrand)}">All ${esc(diecastMenuBrand)} models</button><div class="diecast-menu-separator"></div><div class="diecast-menu-note">Car manufacturer</div>${makes.map(make=>`<button type="button" data-select-car-make="${esc(make)}">${esc(make)}</button>`).join('')||'<div class="diecast-menu-note">No car manufacturers are listed in this catalog.</div>'}`}
  </section>`;
 bindDiecastMenuActions(menu);
}
function bindDiecastMenuActions(menu){menu.querySelectorAll('button').forEach(button=>{button.onclick=event=>{event.stopPropagation();handleDiecastMenuButton(button)}})}
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
 filter=catalogView==='Diecast'&&['Chase','Event','Limited','Upcoming'].includes(releaseFilter)?releaseFilter:'All';catalogPage=1;$('search').value='';
 updateCatalogUrl();closeDiecastMenu();render();$('catalogTitle').scrollIntoView({behavior:'smooth',block:'start'});
}
function handleDiecastMenuButton(button){
 if(!button)return;
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


function homeText(key){return window.T164I18N?.translate(key)||key}
function currentBangkokMonth(){
 const parts=new Intl.DateTimeFormat('en',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit'}).formatToParts(new Date());
 const year=parts.find(x=>x.type==='year')?.value,month=parts.find(x=>x.type==='month')?.value;
 return `${year}-${month}`;
}
function homePublicMedia(path){
 return path&&db?db.storage.from('community-media').getPublicUrl(path).data.publicUrl:'';
}
function renderMonthlySpotlight(targetId,post,author,likes,photoOnly=false){
 const target=$(targetId);if(!target)return;
 if(!post){target.textContent=homeText(photoOnly?'No photo posts yet this month.':'No posts yet this month.');return}
 const paths=Array.isArray(post.media_paths)?post.media_paths.filter(Boolean):[];
 const imagePath=paths[0]||(post.post_type==='photo'?post.media_path:null);
 const media=photoOnly||post.post_type==='photo'
  ?(imagePath?`<img src="${esc(homePublicMedia(imagePath))}" alt="${esc(homeText(photoOnly?'Photo of the month':'Most-liked community post'))}" loading="lazy">`:'')
  :post.post_type==='video'&&post.media_path?`<video src="${esc(homePublicMedia(post.media_path))}" controls playsinline preload="metadata"></video>`:'';
 const excerpt=String(post.body||'').trim().slice(0,190);
 target.innerHTML=`${media}${excerpt?`<p>${esc(excerpt)}${post.body.length>190?'…':''}</p>`:''}<div class="home-highlight-byline">${esc(author||'Turbo164 collector')} · ♥ ${Number(likes)||0} ${esc(homeText('likes'))}</div>`;
}
async function loadHomeHighlights(){
 const month=currentBangkokMonth(),[year,monthNumber]=month.split('-').map(Number),next=new Date(Date.UTC(year,monthNumber,1)),monthStart=`${month}-01`,monthEnd=`${next.getUTCFullYear()}-${String(next.getUTCMonth()+1).padStart(2,'0')}-01`;
 const locale={en:'en-US',th:'th-TH',ja:'ja-JP',zh:'zh-CN'}[window.T164I18N?.language||'en']||'en-US';
 $('homeHighlightMonth').textContent=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',timeZone:'Asia/Bangkok'}).format(new Date(`${monthStart}T12:00:00+07:00`));
 if(!db){$('homeTopPost').textContent=homeText('Community data is unavailable.');$('homePhotoOfMonth').textContent=homeText('Community data is unavailable.');$('homeUserCount').textContent='—';return}
 const startIso=new Date(`${monthStart}T00:00:00+07:00`).toISOString(),endIso=new Date(`${monthEnd}T00:00:00+07:00`).toISOString();
 const [postResult,userResult]=await Promise.all([
  db.from('community_posts').select('id,author_id,body,post_type,media_path,media_paths,created_at').gte('created_at',startIso).lt('created_at',endIso).order('created_at',{ascending:false}).limit(500),
  db.rpc('turbo164_public_user_count')
 ]);
 if(userResult.error){$('homeUserCount').textContent='—'}else{$('homeUserCount').textContent=Number(userResult.data??0).toLocaleString(locale)}
 if(postResult.error){$('homeTopPost').textContent=homeText('Could not load community highlights.');$('homePhotoOfMonth').textContent=homeText('Could not load community highlights.');return}
 const posts=postResult.data||[],ids=posts.map(p=>p.id),likes={};
 for(let offset=0;offset<ids.length;offset+=100){
  const batch=ids.slice(offset,offset+100);if(!batch.length)continue;
  const {data}=await db.from('community_post_hearts').select('post_id').in('post_id',batch);
  for(const heart of data||[])likes[heart.post_id]=(likes[heart.post_id]||0)+1;
 }
 const rank=(a,b)=>(likes[b.id]||0)-(likes[a.id]||0)||new Date(b.created_at)-new Date(a.created_at);
 const topPost=[...posts].sort(rank)[0]||null;
 const photoPost=posts.filter(post=>post.post_type==='photo'&&(post.media_path||(Array.isArray(post.media_paths)&&post.media_paths.length))).sort(rank)[0]||null;
 const authorIds=[...new Set([topPost?.author_id,photoPost?.author_id].filter(Boolean))];
 let authors={};
 if(authorIds.length){
  const {data}=await db.from('community_profiles').select('user_id,display_name').in('user_id',authorIds);
  for(const profile of data||[])authors[profile.user_id]=profile.display_name;
 }
 renderMonthlySpotlight('homeTopPost',topPost,authors[topPost?.author_id],likes[topPost?.id]||0);
 renderMonthlySpotlight('homePhotoOfMonth',photoPost,authors[photoPost?.author_id],likes[photoPost?.id]||0,true);
}

function formatHomeRelativeTime(value,locale){
 const seconds=Math.max(0,(Date.now()-new Date(value).getTime())/1000),formatter=new Intl.RelativeTimeFormat(locale,{numeric:'auto'});
 if(seconds<3600)return formatter.format(-Math.max(1,Math.floor(seconds/60)),'minute');
 if(seconds<86400)return formatter.format(-Math.floor(seconds/3600),'hour');
 return formatter.format(-Math.floor(seconds/86400),'day');
}
async function loadHomeNewJoiners(){
 const area=$('homeNewJoiners');if(!area||!db)return;
 const locale={en:'en-US',th:'th-TH',ja:'ja-JP',zh:'zh-CN'}[window.T164I18N?.language||'en']||'en-US';
 const {data,error}=await db.rpc('turbo164_recent_joiners');
 if(error){area.textContent=homeText('Could not load new joiners.');return}
 const rows=Array.isArray(data)?data:[];
 if(!rows.length){area.textContent=homeText('No one joined in the past 3 days.');return}
 area.innerHTML=rows.slice(0,25).map(row=>{
  const name=String(row.display_name||homeText('New collector')),initials=name.trim().split(/\s+/).slice(0,2).map(part=>part[0]||'').join('').toUpperCase();
  return `<div class="home-joiner-row"><span class="home-joiner-avatar" aria-hidden="true">${esc(initials||'T')}</span><span><span class="home-joiner-name">${esc(name)}</span><span class="home-joiner-time">${esc(homeText('Joined'))} ${esc(formatHomeRelativeTime(row.joined_at,locale))}</span></span></div>`;
 }).join('');
}
function startHomePresence(){
 const target=$('homeOnlineCount');if(!target||!db?.channel)return;
 const keyName='turbo164-home-presence-key-v1';let key;
 try{key=localStorage.getItem(keyName);if(!key){key='visitor-'+crypto.randomUUID();localStorage.setItem(keyName,key)}}catch{key='visitor-'+crypto.randomUUID()}
 const channel=db.channel('turbo164-home-online-v1',{config:{presence:{key}}});
 const update=()=>{target.textContent=Object.keys(channel.presenceState()||{}).length.toLocaleString()};
 channel.on('presence',{event:'sync'},update).on('presence',{event:'join'},update).on('presence',{event:'leave'},update)
  .subscribe(status=>{if(status==='SUBSCRIBED'){channel.track({online_at:new Date().toISOString()}).then(update).catch(()=>{target.textContent='—'})}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){target.textContent='—'}});
 window.addEventListener('pagehide',()=>{void channel.untrack();void db.removeChannel(channel)},{once:true});
}
async function start(){
 $('miniGarageOpen').onclick=()=>openMiniGarage();
 $('miniGarageClose').onclick=()=>$('miniGarageDialog').close();
 $('miniGarageFilters').onclick=event=>{
  const button=event.target.closest('[data-garage-status]');
  if(!button)return;
  garageStatus=button.dataset.garageStatus;
  renderMiniGarage(allModels());
 };
 const backToTop=$('backToTop');
 const updateBackToTop=()=>{backToTop.hidden=window.scrollY<480};
 backToTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
 window.addEventListener('scroll',updateBackToTop,{passive:true});
 updateBackToTop();
 catalog=(await (await fetch('catalog.json')).json()).filter(eligible);
 applyCatalogRouteFromUrl();
 render();
 $('search').oninput=()=>{catalogPage=1;render()};
 renderDiecastMenu();
 $('diecastMenuButton').onclick=()=>{
  if(catalogView!=='Diecast')navigateCatalog('Diecast');
  const menu=$('diecastMenu');const opening=menu.hidden;
  if(opening){diecastMenuLevel='root';diecastMenuBrand='All';renderDiecastMenu()}
  menu.hidden=!opening;$('diecastMenuButton').setAttribute('aria-expanded',String(opening));
 };
 document.querySelectorAll('[data-category]').forEach(button=>button.onclick=()=>navigateCatalog(button.dataset.category));
 window.addEventListener('popstate',()=>{applyCatalogRouteFromUrl();render();renderDiecastMenu()});
 document.addEventListener('click',event=>{if(!event.target.closest('.diecast-nav'))closeDiecastMenu()});
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
   if(typeof window.communityAuthChanged==='function')window.communityAuthChanged();
   if(s){closeLoginDialog();setTimeout(async()=>{await loadCloud();await loadPublishedModels();await loadPhotoContributions();await loadMyModelSubmissions()},0);}
   else {$('photoAdminPanel').hidden=true;$('modelAdminPanel').hidden=true;photoAdmin=false;if($('adminUtilities'))$('adminUtilities').hidden=true;loadPhotoContributions()}
  });
 }
 await refreshAll({quiet:true});
 void loadHomeHighlights();void loadHomeNewJoiners();startHomePresence();
 if(!session&&!localStorage.getItem(loginPromptKey)){openLoginDialog();}
}
start().catch(e=>{$('authArea').textContent='Could not load app: '+e.message});
