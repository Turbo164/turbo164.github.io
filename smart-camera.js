/* Turbo164 Smart Camera v2.3 — additive to existing classic app.js. No API secrets in browser. */
(() => {
  'use strict';
  const COMMON_BRANDS = [
    'ARBOX', 'PGM', 'Tarmac Works', 'INNO64', 'MotorHelix', 'POP RACE',
    'Street Weapon', 'MINI GT', 'Kaido House', 'Tomica', 'Hot Wheels',
    'Matchbox', 'Ignition Model', 'Model Model', 'Time Micro', 'LCD Models',
    'Era Car', 'Hobby Japan', 'Kyosho', 'GreenLight', 'Johnny Lightning',
    'Auto World', 'Para64', 'Sparky', 'BM Creations', 'CM Model', 'Tiny',
    'FuelMe', '404 Error', 'YM Model', 'DCT', 'MCE', 'Other'
  ];
  // The original app validates submission brands against this array. Extending
  // it here preserves existing brands and allows scanner-selected manufacturers.
  if (typeof allowedBrands !== 'undefined' && Array.isArray(allowedBrands)) {
    for (const brand of COMMON_BRANDS) if (brand !== 'Other' && !allowedBrands.includes(brand)) allowedBrands.push(brand);
  }
  const $sc = id => document.getElementById(id);
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s ?? '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const candidateKey = r => [r.releaseKey || r.referenceId || r.catalogId, norm(r.manufacturer), norm(r.vehicleMake), norm(r.name), norm(r.productCode), norm(r.generation), norm(r.packagingVariant), norm(r.edition)].join('|');
  const validUrl = x => { try { let u = new URL(x); return ['http:','https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  let references = [], selectedBrand = '', found = [], imageBlob = null, imageFile = null, imageUrl = null, aiResult = null, selected = null;
  let initialMatch = false;
  let busy = false;

  function addSubmitBrand(name) {
    const brand = String(name||'').trim().slice(0,90);
    if (!brand) return false;
    const sel = $sc('modelBrand');
    if (typeof allowedBrands !== 'undefined' && !allowedBrands.includes(brand)) allowedBrands.push(brand);
    if (sel && !Array.from(sel.options).some(opt => opt.value === brand)) sel.add(new Option(brand, brand));
    return true;
  }
  COMMON_BRANDS.filter(x=>x!=='Other').forEach(addSubmitBrand);

  function allCatalogRows() {
    if (typeof allModels !== 'function') return [];
    return allModels().map(m => ({
      releaseKey:'catalog:'+m.id, catalogId:m.id, manufacturer: typeof maker === 'function' ? maker(m) : (m.manufacturer||m.brand),
      manufacturerLabel: typeof maker === 'function' ? maker(m) : (m.manufacturer||m.brand),
      vehicleMake:m.vehicleMake||m.brand||'', name:m.name||'', generation:m.generation||'',
      imageUrl:safeImage((typeof photoOverrides !== 'undefined' && photoOverrides[m.id]) || m.photo),
      productCode:String(m.productCode||m.number||''), edition: typeof edition === 'function' ? edition(m) : (m.editionType||'Regular'),
      packagingVariant:m.packagingVariant||'Existing Turbo164 catalog entry', sourceUrl:validUrl(m.photoSource),
      scale:'1:64', origin:'catalog', verification:m.verification||'',
      displayCode:m.productCode || (m.number ? '#'+m.number : 'No SKU')
    }));
  }
  function safeImage(value) {
    if (!value || typeof value !== 'string') return '';
    try { return validUrl(new URL(value, document.baseURI).href); } catch { return ''; }
  }
  function candidateRows() { return references.map(r=>({...r,imageUrl:safeImage(r.imageUrl),sourceUrl:validUrl(r.sourceUrl),releaseKey:'reference:'+r.referenceId,origin:'reference',displayCode:r.productCode||'SKU unknown'})); }
  function searchableText(r) {
    return norm([r.manufacturer,r.manufacturerLabel,r.vehicleMake,r.name,r.generation,r.productCode,r.packagingVariant,r.edition,r.livery,r.raceNumber].join(' '));
  }
  function score(row, query) {
    const exact = norm(query);
    if (!exact) return 0;
    const hay = searchableText(row), tokens = [...new Set(exact.split(' ').filter(Boolean))];
    const covered = tokens.filter(t=>hay.split(' ').includes(t)).length;
    if (covered < Math.max(1,Math.ceil(tokens.length*.6))) return 0;
    let value = covered * 14 + (covered === tokens.length ? 22:0);
    if (row.productCode && norm(row.productCode) === exact) value += 110;
    if (row.name && norm(row.name) === exact) value += 45;
    return value;
  }
  function currentQuery() { return ($sc('scQuery')?.value || '').trim(); }
  function msg(value) { if ($sc('scMessage')) $sc('scMessage').textContent = value; }
  function knownBrands() {
    const names = new Map();
    [...COMMON_BRANDS.filter(x=>x!=='Other'), ...candidateRows().map(x=>x.manufacturer), ...allCatalogRows().map(x=>x.manufacturer)]
      .forEach(x => { if (x) names.set(norm(x),x); });
    return [...names.values()].sort((a,b)=>a.localeCompare(b));
  }
  function resetPhoto() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl=null;imageBlob=null;imageFile=null;
    $sc('scPhoto').hidden=true;
    for (const edge of cropEdges) $sc('scCrop'+edge).value = 0;
    updateCrop();
    $sc('scPreview').removeAttribute('src');
    $sc('scCameraInput').value='';$sc('scGalleryInput').value='';
  }
  async function setPhoto(file) {
    if (!file || busy) return;
    const revision = ++photoRevision;
    resetPhoto();
    clearResults();
    $sc('scAnalyze').disabled = false;
    if (!file.type.startsWith('image/')) { msg('Please select a photograph.');return; }
    if (file.size>25*1024*1024){msg('Original image must be under 25 MB.');return;}
    $sc('scAnalyze').disabled = true;
    msg('Preparing photo…');
    try {
      // Reuse the site's tested image-reencoding and metadata-stripping helper.
      const output = await prepareModelPhoto(file);
      if (revision !== photoRevision) { URL.revokeObjectURL(output.preview); return; }
      imageBlob=output.blob;
      imageFile=new File([output.blob], 'smart-scan.jpg', {type:'image/jpeg'});
      imageUrl=output.preview;
      $sc('scPreview').src=imageUrl;
      $sc('scPhoto').hidden=false;
      msg('Adjust the crop to frame your subject, then scan.');
    } catch(e){
      if (revision === photoRevision) msg('Unable to prepare image: '+e.message);
    } finally {
      if (revision === photoRevision) $sc('scAnalyze').disabled = false;
    }
  }
   // Tesseract.js runs OCR in the browser. The image is not sent to Turbo164 or OpenAI.
   // Library and language data may be downloaded on first use; this requires connectivity.
   const OCR_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
   function loadOCR() {
     if (window.Tesseract?.createWorker) return Promise.resolve();
     if (window.__t164OcrLoad) return window.__t164OcrLoad;
     window.__t164OcrLoad = new Promise((resolve,reject)=>{
       const script=document.createElement('script');
       script.src=OCR_CDN;script.crossOrigin='anonymous';
       script.onload=()=>window.Tesseract?.createWorker?resolve():reject(Error('OCR library unavailable'));
       script.onerror=()=>reject(Error('Could not download OCR library. Check your connection.'));
       document.head.append(script);
     }).catch(e=>{window.__t164OcrLoad=null;throw e;});
     return window.__t164OcrLoad;
   }
  const cropEdges = ['Left', 'Top', 'Right', 'Bottom'];
  let autoQuery = '', scanKind = '', photoRevision = 0;
  let referencesReady = Promise.resolve();

  function clearResults() {
    if (autoQuery && currentQuery() === autoQuery) $sc('scQuery').value = '';
    autoQuery = ''; scanKind = ''; aiResult = null;
    initialMatch = false; found = [];
    renderMatches();
  }

  function cropInsets() {
    return cropEdges.map(edge => Number($sc('scCrop' + edge).value) / 100);
  }

  function updateCrop() {
    const [left, top, right, bottom] = cropInsets();
    Object.assign($sc('scCropBox').style, {
      left: left * 100 + '%', top: top * 100 + '%',
      right: right * 100 + '%', bottom: bottom * 100 + '%'
    });
  }

  function cropImage(image, insets, maxSide, minSide = 0) {
    const [left, top, right, bottom] = insets;
    const width = image.naturalWidth * (1 - left - right);
    const height = image.naturalHeight * (1 - top - bottom);
    const scale = Math.min(maxSide / Math.max(width, height), Math.max(1, minSide / Math.min(width, height)));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d', {alpha:false});
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, image.naturalWidth * left, image.naturalHeight * top, width, height,
      0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function enhance(canvas) {
    const ctx = canvas.getContext('2d');
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const counts = new Uint32Array(256);
    const data = pixels.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(.299 * data[i] + .587 * data[i+1] + .114 * data[i+2]);
      data[i] = data[i+1] = data[i+2] = gray;
      counts[gray]++;
    }
    const tail = canvas.width * canvas.height * .025;
    let low = 0, high = 255, dark = counts[0], light = counts[255];
    while (low < 255 && dark < tail) dark += counts[++low];
    while (high > low && light < tail) light += counts[--high];
    if (high - low > 12) {
      const stretch = 255 / (high - low);
      for (let i = 0; i < data.length; i += 4) data[i] = data[i+1] = data[i+2] = (data[i] - low) * stretch;
    }
    ctx.putImageData(pixels, 0, 0);
  }

  const containsPhrase = (text, phrase) => !!phrase && (' ' + text + ' ').includes(' ' + phrase + ' ');
  const compactCode = value => norm(value).replace(/ /g, '');
  const commonMakes = ['Toyota','Nissan','Honda','Mazda','Mitsubishi','Subaru','Ford','Chevrolet','Ferrari','Lamborghini','BMW','Mercedes-Benz','Audi','Volkswagen','Porsche','Land Rover','Lexus','Datsun','McLaren','Bugatti','Dodge','Jeep','Lotus','Aston Martin'];
  const modelNoise = new Set('the and with car diecast model edition special limited exclusive regular series scale racing gift box premium collection collector made china warning'.split(' '));

  function packagingMatches(passes, corpus, brands) {
    const lines = [...new Set(passes.flatMap(pass => pass.split(/\r?\n/)).map(norm).filter(Boolean))];
    const knownBrand = brand => lines.some(line => containsPhrase(line, norm(brand)));
    const detectedBrands = brands.filter(knownBrand);
    const hasBrand = row => knownBrand(row.manufacturer) || knownBrand(row.manufacturerLabel);
    // Separators can disappear in OCR. Match whole codes, and require a maker for short codes.
    const rawCodes = new Set(passes.join('\n').match(/\b[a-z0-9]+(?:[-_/][a-z0-9]+)*\b/gi)?.map(compactCode) || []);
    const rows = corpus.flatMap(row => {
      const code = compactCode(row.productCode);
      const codeMatch = !!code && /\d/.test(code) &&
        ((code.length >= 4 && rawCodes.has(code)) || (hasBrand(row) && rawCodes.has(code)) ||
          (code.length >= 4 && lines.some(line => containsPhrase(line, norm(row.productCode)))));
      const name = norm(row.name);
      const fullName = name.length >= 5 && lines.some(line => containsPhrase(line, name));
      const identity = [...new Set(norm([row.vehicleMake, row.name, row.generation, row.livery].join(' '))
        .split(' ').filter(word => word.length >= 2 && !modelNoise.has(word)))];
      const covered = Math.max(0, ...passes.map(pass => {
        const words = new Set(norm(pass).split(' '));
        return identity.filter(word => words.has(word)).length;
      }));
      const modelMatch = covered >= 2 && covered >= Math.ceil(identity.length * .6);
      if (!codeMatch && !fullName && !modelMatch) return [];
      return [{...row, codeMatch, matchScore: (codeMatch ? 200 : 0) + (fullName ? 60 : 0) + covered * 8 + (hasBrand(row) ? 20 : 0)}];
    }).sort((a,b) => b.matchScore - a.matchScore);
    const strong = rows[0];
    const observedCode = passes.join('\n').match(/\b[A-Z0-9]{2,}(?:[-_/][A-Z0-9]{2,})+\b|\b[A-Z0-9]{6,}\b/gi)
      ?.find(code => /[a-z]/i.test(code) && /\d/.test(code) &&
        (detectedBrands.length || /[-_/]/.test(code)) && !/^\d+[-_/]?scale$/i.test(code));
    const observedNumber = detectedBrands.length && passes.join('\n').match(/(?:^|\n)\s*#?(\d{1,3})\s*(?=\n|$)|\b(?:no\.?\s*|#)(\d{1,3})\b/i);
    const makes = new Set([...commonMakes, ...corpus.map(row => row.vehicleMake)].map(norm).filter(Boolean));
    const vehicleLine = passes.flatMap(pass => pass.split(/\r?\n/))
      .map(line => line.trim())
      .find(line => /^[a-z0-9][a-z0-9 .#'/-]{4,47}$/i.test(line) &&
        [...makes].some(make => norm(line).startsWith(make + ' ')) &&
        norm(line).split(' ').some(word => /[a-z]{3,}|\d/.test(word) && !makes.has(word) && !modelNoise.has(word)));
    const hint = strong ? (strong.codeMatch ? strong.productCode : strong.name) :
      [detectedBrands[0], observedCode || vehicleLine || observedNumber?.[1] || observedNumber?.[2]].filter(Boolean).join(' ');
    return {rows, hint, observedCode, vehicleLine};
  }

  async function readPackaging(image) {
    const evidence = [];
    await loadOCR();
    const canvas = cropImage(image, cropInsets(), 1900, 950);
    let worker;
    try {
      worker = await window.Tesseract.createWorker('eng');
      for (const [index, mode] of ['11', '6', '11'].entries()) {
        msg('Reading packaging locally · pass ' + (index + 1) + ' of 3…');
        if (index === 1) enhance(canvas);
        if (index === 2) {
          const ctx = canvas.getContext('2d');
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < pixels.data.length; i += 4) {
            pixels.data[i] = pixels.data[i+1] = pixels.data[i+2] = 255 - pixels.data[i];
          }
          ctx.putImageData(pixels, 0, 0);
        }
        await worker.setParameters({tessedit_pageseg_mode:mode, user_defined_dpi:'300'});
        const result = await worker.recognize(canvas, {}, {text:true, blocks:false, hocr:false, tsv:false});
        evidence.push(String(result?.data?.text || '').trim().slice(0, 4000));
      }
    } finally {
      if (worker) await worker.terminate();
    }
    const {rows, hint, observedCode, vehicleLine} = packagingMatches(evidence, [...allCatalogRows(), ...candidateRows()], knownBrands());
    found = rows;
    if (hint && !currentQuery()) $sc('scQuery').value = autoQuery = String(hint).slice(0, 150);
    aiResult = {name:vehicleLine, productCode:observedCode, visibleText: [...new Set(evidence.filter(Boolean))].join('\n')};
    msg(rows.length ? 'Review the possible releases and confirm the manufacturer, edition and SKU.' :
      'No catalog release matched. Try cropping closer or enter a model or code for web search.');
  }

  // Compare spatial edge and color features. This is a small, local image index,
  // and returns resemblance to available photos rather than a predicted identity.
  function visualVector(source, mirror = false) {
    const side = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = side;
    const ctx = canvas.getContext('2d', {willReadFrequently:true});
    if (mirror) {
      ctx.translate(side, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, 0, 0, side, side);
    const {data} = ctx.getImageData(0, 0, side, side);
    const luminance = new Float32Array(side * side);
    for (let i = 0; i < luminance.length; i++) {
      const p = i * 4;
      luminance[i] = .299 * data[p] + .587 * data[p+1] + .114 * data[p+2];
    }
    const vector = new Float32Array(16 * 10);
    let edgeEnergy = 0;
    for (let y = 1; y < side - 1; y++) {
      for (let x = 1; x < side - 1; x++) {
        const i = y * side + x, p = i * 4;
        const cell = (Math.floor(y / 16) * 4 + Math.floor(x / 16)) * 10;
        const dx = luminance[i+1] - luminance[i-1], dy = luminance[i+side] - luminance[i-side];
        const magnitude = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) + Math.PI) % Math.PI;
        vector[cell + Math.floor(angle * 6 / Math.PI)] += magnitude;
        edgeEnergy += magnitude;
        const redGreen = data[p] - data[p+1], blueGreen = data[p+2] - data[p+1];
        vector[cell + (redGreen >= 0 ? 6 : 7)] += Math.abs(redGreen) * .22;
        vector[cell + (blueGreen >= 0 ? 8 : 9)] += Math.abs(blueGreen) * .22;
      }
    }
    if (edgeEnergy < 4000) return null;
    const length = Math.hypot(...vector);
    return vector.map(value => value / length);
  }

  function referencePhoto(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => {
        image.removeAttribute('src');
        reject(Error('Reference photo timed out'));
      }, 4500);
      image.crossOrigin = 'anonymous';
      image.referrerPolicy = 'no-referrer';
      image.onload = () => { clearTimeout(timer); resolve(image); };
      image.onerror = () => { clearTimeout(timer); reject(Error('Reference photo unavailable')); };
      image.src = url;
    });
  }

  // Insets for the specific stock photos, in left, top, right, bottom order.
  // Match the full URL so an approved replacement photo never inherits this crop.
  const stockPhotoCrops = new Map([
    ["https://aichanvault.com/cdn/shop/files/qCKF0wy.png?v=1786664486&width=1445", [0.01, 0.14, 0.29, 0.18]],
    ["https://www.tarmacworks.com/cdn/shop/files/T64R-076-BK_M01_1__jpg.jpg?v=1776073449&width=960", [0.25, 0.51, 0.21, 0.13]],
    ["https://www.tarmacworks.com/cdn/shop/files/T64-075-RE2_M01.jpg?v=1782453925&width=960", [0.3, 0.24, 0.23, 0.29]],
    ["https://www.tarmacworks.com/cdn/shop/files/T64-089-24CR11_M01.jpg?v=1782456959&width=960", [0.2, 0.33, 0.19, 0.23]],
    ["https://www.tarmacworks.com/cdn/shop/files/T64-062-26NUR80_M01.jpg?v=1780660615&width=4534", [0.16, 0.17, 0.18, 0.17]],
    ["https://www.tarmacworks.com/cdn/shop/files/T64G-048-GR_M02.jpg?v=1784514660&width=960", [0.2, 0.34, 0.19, 0.21]],
    ["https://www.tarmacworks.com/cdn/shop/files/T64G-061-MJ_M01.jpg?v=1770870207&width=5760", [0.36, 0.35, 0.21, 0.31]],
    ["https://www.tarmacworks.com/cdn/shop/files/T64-TL015-SC_M01.jpg?v=1784538151&width=960", [0.15, 0.4, 0.2, 0.29]]
  ]);

  async function findSimilarCars(image) {
    const crop = cropImage(image, cropInsets(), 320);
    const input = visualVector(crop);
    if (!input) {msg('Too little detail to compare. Crop closer around the car or try a clearer photo.');return;}
    const mirrored = visualVector(crop, true) || input;
    const similarity = (a,b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
    const corpus = [...candidateRows(), ...allCatalogRows()];
    const urls = [...new Set(corpus.map(row => row.imageUrl).filter(Boolean))].slice(0, 32);
    const scores = new Map();
    for (let i = 0; i < urls.length; i += 8) {
      msg('Comparing catalog photos locally · ' + i + ' of ' + urls.length + ' attempted…');
      await Promise.all(urls.slice(i, i+8).map(async url => {
        try {
          const photo = await referencePhoto(url);
          const descriptor = visualVector(cropImage(photo, stockPhotoCrops.get(url) || [0,0,0,0], 320));
          if (descriptor) scores.set(url, Math.max(similarity(input, descriptor), similarity(mirrored, descriptor)));
        } catch { /* Failed or cross-origin-blocked reference images are skipped. */ }
      }));
    }
    const bestScore = Math.max(0, ...scores.values());
    const cutoff = Math.max(.70, bestScore - .055);
    found = corpus.filter(row => scores.get(row.imageUrl) >= cutoff)
      .map(row => ({...row, matchScore:scores.get(row.imageUrl)}))
      .sort((a,b) => b.matchScore - a.matchScore).slice(0, 3);
    msg('Compared ' + scores.size + ' of ' + urls.length + ' reference photos across ' + corpus.length +
      ' releases. ' + (found.length ? 'Review the suggested lookalikes. Confirm the actual release before saving.' :
        'No useful suggestions. Try another angle or search by model name.'));
  }

  function setScanControls(disabled) {
    for (const id of ['scAnalyze', 'scMode', 'scCamera', 'scGallery', 'scFind', 'scClose', 'scQuery', 'scResetCrop', ...cropEdges.map(edge => 'scCrop' + edge)]) {
      $sc(id).disabled = disabled;
    }
  }

  async function scanPhoto() {
    if (busy) return;
    if (!imageBlob) {msg('Take or upload a photo first.');return;}
    clearResults();
    busy = true;
    setScanControls(true);
    selectedBrand = '';
    renderBrands();
    scanKind = $sc('scMode').value;
    try {
      msg(scanKind === 'car' ? 'Preparing visual comparison…' : 'Loading the free OCR reader…');
      const image = $sc('scPreview');
      await Promise.all([image.decode(), referencesReady]);
      if (scanKind === 'car') await findSimilarCars(image);
      else await readPackaging(image);
    } catch (error) {
      msg('Scan could not finish. Manual catalog search is available. ' + error.message);
    } finally {
      busy = false;
      setScanControls(false);
      initialMatch = true;
      renderMatches();
    }
  }

  function searchWeb(row) {
    const brand = selectedBrand === '__other__' ? $sc('scCustomBrand').value.trim() : selectedBrand;
    const terms = row ? [row.name, row.productCode].filter(Boolean).join(' ') : currentQuery();
    if (!terms) {msg('Enter a model name or product code before searching the web.'); $sc('scQuery').focus(); return;}
    const query = [row?.manufacturer || brand, terms, '1:64 diecast'].filter(Boolean).join(' ');
    window.open('https://www.google.com/search?q='+encodeURIComponent(query),'_blank','noopener,noreferrer');
    msg('Web search opened. Verify the manufacturer, SKU and source before submitting a new release.');
  }
  function renderBrands(){
    const q=norm($sc('scBrandSearch').value);
    const choices=knownBrands().filter(b=>!q||norm(b).includes(q));
    $sc('scBrands').innerHTML=`<button type="button" data-sc-brand="" class="${selectedBrand===''?'sc-selected':''}">All manufacturers</button>`+
      choices.map(b=>`<button type="button" data-sc-brand="${escapeHTML(b)}" class="${selectedBrand===b?'sc-selected':''}">${escapeHTML(b)}</button>`).join('')+
      `<button type="button" data-sc-brand="__other__" class="${selectedBrand==='__other__'?'sc-selected':''}">Other / Not listed +</button>`;
    $sc('scCustomBrandWrap').hidden=selectedBrand!=='__other__';
  }
  function matchesVehicleFamily(row, family) {
    const key = norm(family);
    return norm(row.vehicleFamily) === key || containsPhrase(norm(row.name), key);
  }

  function getVehicleFamily(row, corpus) {
    if (row.vehicleFamily) return row.vehicleFamily;
    const families = [...new Set(corpus.map(release => release.vehicleFamily).filter(Boolean))]
      .sort((a,b) => norm(b).length - norm(a).length);
    return families.find(family => matchesVehicleFamily(row, family));
  }

  function showRelatedReleases(row) {
    const corpus = [...allCatalogRows(), ...candidateRows()];
    const family = getVehicleFamily(row, corpus);
    $sc('scQuery').value = autoQuery = (family || row.name).slice(0, 150);
    selectedBrand = '';
    renderBrands();
    if (!family) { findMatches(); return; }
    scanKind = 'family';
    initialMatch = true;
    aiResult = null;
    found = corpus.filter(release => matchesVehicleFamily(release, family));
    renderMatches();
    msg('Showing ' + family + ' releases across manufacturers. Compare the finish and SKU before choosing.');
  }

  function findMatches() {
    scanKind = ''; aiResult = null;
    selected=null;initialMatch=true;
    const query=currentQuery();
    const corpus=[...allCatalogRows(),...candidateRows()];
    found=corpus.map(row=>({...row,matchScore:score(row,query)}))
      .filter(row=>row.matchScore>0)
      .sort((a,b)=>b.matchScore-a.matchScore||String(a.manufacturer).localeCompare(String(b.manufacturer)));
    renderMatches();
  }
  function showItem(row) {
    const code = escapeHTML(row.displayCode||row.productCode||'SKU pending');
    return `<article class="sc-item">
      <div class="sc-itemtop"><strong>${escapeHTML(row.manufacturerLabel||row.manufacturer)}</strong>
      <span class="sc-tag ${row.origin==='catalog'?'sc-listed':''}">${row.origin==='catalog'?'In Turbo164 catalog':'Research lead · not published'}</span></div>
      ${scanKind==='car' && row.imageUrl?`<img class="sc-reference" loading="lazy" referrerpolicy="no-referrer" src="${escapeHTML(row.imageUrl)}" alt="Reference photo for ${escapeHTML(row.name)}">`:''}
      <div class="sc-itemname">${escapeHTML(row.name)}</div>
      <div class="sc-itemmeta">${escapeHTML([row.generation,row.packagingVariant||'',row.edition||''].filter(Boolean).join(' · '))}</div>
      <div class="sc-itemmeta">Product code: <strong>${code}</strong> · ${escapeHTML(row.scale||'1:64')}</div>
      ${row.origin==='catalog'&&row.verification?`<div class="sc-itemmeta">${escapeHTML(row.verification)}</div>`:''}
      <div class="sc-itemactions"><button type="button" class="sc-primary" data-sc-select="${escapeHTML(row.releaseKey)}">${row.origin==='catalog'?'Choose this catalog model':'Review this exact release'}</button>
      ${scanKind==='car'?`<button type="button" class="sc-outline" data-sc-related="${escapeHTML(row.releaseKey)}">Browse related releases</button>`:''}
      ${row.sourceUrl?`<a target="_blank" rel="noopener noreferrer" href="${escapeHTML(row.sourceUrl)}">Source</a>`:''}</div>
    </article>`;
  }
  function renderMatches() {
    $sc('scSelection').hidden=true;
    selected=null;
    const area=$sc('scMatches');
    if (!initialMatch) {area.innerHTML='<p class="sc-hint">Scan a car or search model name, number, or code to see possible matches.</p>';return;}
    const rows=found.filter(x=>selectedBrand===''||(selectedBrand!=='__other__'&&x.manufacturer===selectedBrand));
    if (!currentQuery() && !scanKind) {
      area.innerHTML='<p class="sc-hint">Enter a model, livery or product code. Try “Porsche Apple 89”.</p>';return;
    }
    area.innerHTML=`<div class="sc-count">${scanKind==='car'?'Visual lookalikes · ':scanKind==='family'?'Related vehicle releases · ':''}${rows.length} possible release${rows.length!==1?'s':''} ${selectedBrand?'for '+escapeHTML(selectedBrand):'across manufacturers'} · not guaranteed identifications</div>`+
      (rows.length?rows.slice(0,40).map(showItem).join(''):'<p class="sc-hint">No matching release found. Search the web, or add the missing release details for review.</p>')+
       `<button type="button" class="sc-outline" id="scSearchWeb">🌐 Search web for this release</button>`+
      `<button type="button" class="sc-outline" id="scUnlisted">Submit this release for review</button>`;
    if (rows.length>40)area.insertAdjacentHTML('beforeend','<p class="sc-hint">Showing top 40. Refine your search or choose a manufacturer.</p>');
  }
  async function addToGarage(status) {
    if(!selected || selected.origin!=='catalog')return;
    if(typeof saveStatus!=='function') {msg('Garage saving is not available.');return;}
    if(typeof session==='undefined'||!session){
      await saveStatus(selected.catalogId,status); // Site displays existing login dialog.
      msg('Sign in to save this release in your synced garage.');
      return;
    }
    await saveStatus(selected.catalogId,status);
  }
  async function prefillSubmission(row) {
    const brand=selectedBrand==='__other__'?$sc('scCustomBrand').value.trim():row?.manufacturer||selectedBrand;
    const manufacturer=brand||row?.manufacturer||'';
    if(!manufacturer) {msg('Select or enter the diecast manufacturer first.');return;}
    if(!addSubmitBrand(manufacturer)){msg('Enter a valid manufacturer.');return;}
    const inferred=aiResult||{};
    const modelName=row?.name||inferred.name||currentQuery();
    if (!row?.referenceId && inferred.productCode && containsPhrase(norm(modelName), norm(inferred.productCode)) && !inferred.name) {
      msg('Enter the model name in the search field before opening a missing-model draft.');
      $sc('scQuery').focus();
      return;
    }
    if(!modelName||modelName.length<3){msg('Enter the model name or livery before submitting.');return;}
    $sc('modelBrand').value=manufacturer;
    $sc('modelMake').value=row?.vehicleMake||inferred.vehicleMake||'';
    $sc('modelName').value=modelName.slice(0,180);
    $sc('modelCode').value=String(row?.productCode||inferred.productCode||'').slice(0,90);
    $sc('modelEdition').value=['Regular','Chase','Event Exclusive','Limited Edition'].includes(row?.edition)?row.edition:'Regular';
    $sc('modelRelease').value='Unverified';
    $sc('modelSource').value=validUrl(row?.sourceUrl)||'';
    const notes=[
      'Smart Camera draft — verify before approval.',
      'Manufacturer: '+manufacturer,
      row?.generation?'Vehicle generation: '+row.generation:'',
      row?.packagingVariant?'Separate packaging/display variant: '+row.packagingVariant:'',
      row?.referenceId?'Research release ID: '+row.referenceId:'',
      row?.productCode?'Product code: '+row.productCode:'',
      inferred.visibleText?'OCR packaging text: '+inferred.visibleText.slice(0,350):'',
      'Do not merge with another brand or edition solely because the livery matches.'
    ].filter(Boolean).join('\n').slice(0,1000);
    $sc('modelNote').value=notes;
    const photo=imageFile;
    const submission=$sc('submitMissingModel');
    submission.hidden=false;
    if(photo) {
      try { await addModelPhotos([photo]); }
      catch(e){ $sc('modelSubmitStatus').textContent='Photo could not be copied: '+e.message; }
    }
    submission.scrollIntoView({behavior:'smooth',block:'start'});
    $sc('modelGeneralStatus').textContent='Smart Camera filled this draft. Verify the product code, edition and source; submit for administrator approval. For new brands, the Supabase brand constraint migration must be applied.';
  }
  function renderSelection(row){
    selected=row;
    const area=$sc('scSelection');
    area.hidden=false;
    area.innerHTML=`<div class="sc-selected-title">Selected release</div>
      <strong>${escapeHTML(row.manufacturerLabel||row.manufacturer)} — ${escapeHTML(row.name)}</strong>
      <div class="sc-itemmeta">${escapeHTML(row.productCode||row.displayCode||'SKU pending')} · ${escapeHTML(row.packagingVariant||'')}</div>
      ${scanKind==='car'?'<p class="sc-hint">Compare the actual car and check the markings before saving this release.</p>':''}
      <div class="sc-itemactions">
        ${scanKind==='car'?'<button type="button" class="sc-outline" id="scFindRelated">Find related catalog releases</button>':''}
        <button type="button" class="sc-outline" id="scSearchSelected">Search web for selected release</button>
      </div>
      ${row.origin==='catalog' ? `<div class="sc-itemactions"><button type="button" class="sc-primary" data-sc-save="Owned">Add Owned</button><button type="button" data-sc-save="Ordered">Add Ordered</button><button type="button" data-sc-save="Wishlist">Wishlist</button></div>`:
      `<p class="sc-hint">This release is not yet in the Turbo164 catalog. Check its details and submit it for administrator review.</p><button type="button" class="sc-primary" id="scSubmitSelected">Add release details for review</button>`}`;
  }
  function open(){
    if(!$sc('scDialog').open)$sc('scDialog').showModal();
    renderBrands();renderMatches();
  }
  function init(){
    const main=document.querySelector('main');
    if(!main||$sc('scDialog'))return;
    const launch=document.createElement('section');launch.className='sc-launch';
    launch.innerHTML='<div><strong>Smart Camera v2.3</strong><p>Scan a diecast, compare manufacturers and choose the exact release.</p></div><button type="button" id="scLaunchBtn" class="sc-primary">📷 Open Scanner</button>';
    (main.querySelector('.hero')||main.firstElementChild)?.insertAdjacentElement('afterend',launch);
    const css=document.createElement('style');css.textContent=`
      .sc-launch{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#151e2b;border:1px solid #806a49;border-radius:16px;padding:15px;margin-bottom:20px}.sc-launch p{margin:5px 0 0;color:#aeb9c9;font-size:13px}
      .sc-primary{background:#d5a65a!important;color:#15120c!important;font-weight:800;border:0;border-radius:10px;padding:11px 13px}.sc-outline{border:1px solid #526178!important;background:#1c2735!important;color:#e4edff!important;border-radius:10px;padding:10px 12px}
      .sc-dialog{width:min(94vw,620px);max-height:92dvh;overflow:auto;border:1px solid #45516a;border-radius:20px;background:#101824;color:#f1f5fc;padding:20px;box-shadow:0 24px 70px #000a}.sc-dialog::backdrop{background:#000a}
      .sc-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.sc-head h2{margin:0}.sc-head button{font-size:20px;background:transparent}
      .sc-step{font-size:13px;font-weight:800;color:#edbe78;margin:20px 0 10px}.sc-controls{display:flex;gap:8px;flex-wrap:wrap}.sc-controls button{flex:1;min-width:125px}.sc-crop-frame{position:relative;display:table;margin:10px auto;max-width:100%;overflow:hidden}.sc-preview{display:block;max-width:100%;max-height:280px;width:auto;height:auto}.sc-crop-box{position:absolute;inset:0;border:2px solid #f8cf85;box-shadow:0 0 0 500px #090f1db3;pointer-events:none}.sc-crop-inputs{display:grid;grid-template-columns:1fr 1fr;column-gap:12px}.sc-crop-inputs input{width:100%}.sc-reference{display:block;max-width:100%;max-height:150px;margin-top:8px;border-radius:8px}.sc-dialog select{max-width:100%;padding:8px}
      .sc-dialog input[type=text],.sc-dialog input[type=search]{background:#0b1320;color:white;border:1px solid #435168;border-radius:10px;padding:12px;width:100%;font:inherit;min-width:0}.sc-dialog label{display:block;margin:12px 0 6px;color:#bdd0e8;font-size:13px}
      .sc-consent{display:flex!important;gap:9px;align-items:flex-start}.sc-consent input{margin-top:3px}.sc-hint,.sc-dialog small{font-size:12px;line-height:1.55;color:#b7c4d6}.sc-message{font-size:13px;color:#f7ce93;min-height:1.8em;margin:10px 0}.sc-brands{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.sc-brands button{border:1px solid #42516a;background:#1a2636;color:#fff;border-radius:99px;padding:8px 11px;font-size:12px}.sc-brands button.sc-selected{background:#d5a65a;color:#10141d;border-color:#d5a65a;font-weight:850}
      .sc-item{border:1px solid #35445b;background:#131e2d;border-radius:13px;padding:13px;margin:10px 0}.sc-itemtop,.sc-itemactions{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.sc-itemtop strong{font-size:14px}.sc-tag{font-size:10px;background:#463b23;color:#f1ca83;padding:5px 7px;border-radius:8px}.sc-tag.sc-listed{background:#1e4b3e;color:#9df3ca}.sc-itemname{font-weight:750;margin:9px 0 5px}.sc-itemmeta{font-size:12px;color:#b7c6d8;line-height:1.5;margin:4px 0}.sc-itemactions{justify-content:flex-start;margin-top:10px}.sc-itemactions a{color:#edbd72;font-size:12px;padding:8px}.sc-itemactions button{font-size:12px}.sc-count{font-size:12px;color:#a6b6cc;margin:13px 0}.sc-selection{border:1px solid #9b7a47;border-radius:12px;background:#242333;padding:13px;margin-top:15px}.sc-selection[hidden]{display:none}.sc-selected-title{font-size:12px;font-weight:800;color:#efc88c;margin-bottom:7px}
      @media(max-width:480px){.sc-launch{align-items:flex-start;flex-direction:column}.sc-launch button{width:100%}.sc-dialog{padding:15px}}`;
    document.head.append(css);
    const modal=document.createElement('dialog');modal.id='scDialog';modal.className='sc-dialog';
    modal.setAttribute('aria-labelledby','scTitle');
    modal.innerHTML=`
      <div class="sc-head"><h2 id="scTitle">📷 Turbo164 Smart Camera</h2><button id="scClose" type="button" aria-label="Close scanner">✕</button></div>
      <label for="scMode">Scan mode</label>
      <select id="scMode"><option value="packaging">Packaging</option><option value="car">Car Only</option></select>
      <p id="scModeHelp" class="sc-hint">Frame the printed label or box. The first OCR scan may download reader files.</p>
      <div class="sc-controls"><button type="button" class="sc-primary" id="scCamera">📷 Take photo</button><button type="button" class="sc-outline" id="scGallery">Choose photo</button></div>
      <input type="file" id="scCameraInput" accept="image/*" capture="environment" hidden>
      <input type="file" id="scGalleryInput" accept="image/*" hidden>
      <div id="scPhoto" hidden>
        <div class="sc-crop-frame"><img id="scPreview" class="sc-preview" alt="Photo with crop outline"><span id="scCropBox" class="sc-crop-box" aria-hidden="true"></span></div>
        <details><summary>Adjust photo crop</summary>
          <div class="sc-crop-inputs">${cropEdges.map(edge=>`<label>Trim ${edge.toLowerCase()}<input type="range" id="scCrop${edge}" min="0" max="80" value="0"></label>`).join('')}</div>
          <button type="button" id="scResetCrop" class="sc-outline">Reset crop</button>
        </details>
      </div>
      <label for="scQuery">Model name, livery or product code</label>
      <input type="search" id="scQuery" placeholder="e.g. Porsche Apple 89 or T64-015-AP" maxlength="150">
      <p class="sc-hint">Scans run in your browser. Your photo is only shared if you submit it.</p>
      <div class="sc-controls"><button type="button" id="scAnalyze" class="sc-primary">Read packaging</button><button type="button" id="scFind" class="sc-outline">Search catalog & releases</button></div>
      <div id="scMessage" class="sc-message" role="status" aria-live="polite"></div>
      <div class="sc-step">2 · Choose manufacturer (searchable)</div>
      <input type="search" id="scBrandSearch" placeholder="Filter manufacturer names…" aria-label="Search manufacturers">
      <div id="scBrands" class="sc-brands" aria-label="Manufacturer options"></div>
      <div id="scCustomBrandWrap" hidden><label for="scCustomBrand">Manufacturer not listed</label><input type="text" id="scCustomBrand" placeholder="Enter the exact diecast manufacturer" maxlength="90"></div>
      <div class="sc-step">3 · Choose exact release / package</div>
      <div id="scMatches"><p class="sc-hint">Search to find possible releases.</p></div>
      <div id="scSelection" class="sc-selection" hidden></div>
      <p class="sc-hint">A matching livery is not proof of the manufacturer, vehicle generation, SKU, or edition. New releases require administrator approval before entering the shared catalog.</p>`;
    document.body.append(modal);
    const submission=$sc('submitMissingModel');
    if(submission) modal.append(submission);
    $sc('scLaunchBtn').addEventListener('click',open);
    $sc('scClose').addEventListener('click',()=>modal.close());
    $sc('scCamera').addEventListener('click',()=>$sc('scCameraInput').click());
    $sc('scGallery').addEventListener('click',()=>$sc('scGalleryInput').click());
    $sc('scCameraInput').addEventListener('change',e=>setPhoto(e.target.files?.[0]));
    $sc('scGalleryInput').addEventListener('change',e=>setPhoto(e.target.files?.[0]));
    $sc('scAnalyze').addEventListener('click',scanPhoto);
    $sc('scMode').addEventListener('change', () => {
      clearResults();
      const car = $sc('scMode').value === 'car';
      $sc('scAnalyze').textContent = car ? 'Find lookalikes' : 'Read packaging';
      $sc('scModeHelp').textContent = car
        ? 'Crop tightly around the loose car. The scanner compares shape and color against accessible catalog photos. Viewpoint and background can affect results. Verify the manufacturer, edition and SKU yourself.'
        : 'Frame the printed label or box. The first OCR scan may download reader files.';
      msg('');
    });
    for (const [index, edge] of cropEdges.entries()) {
      $sc('scCrop'+edge).addEventListener('input', event => {
        const opposite = $sc('scCrop'+cropEdges[(index + 2) % 4]);
        event.target.value = Math.min(Number(event.target.value), 90 - Number(opposite.value));
        updateCrop();
        clearResults();
      });
    }
    $sc('scResetCrop').addEventListener('click', () => {
      for (const edge of cropEdges) $sc('scCrop'+edge).value = 0;
      updateCrop();
      clearResults();
    });
    $sc('scQuery').addEventListener('input', () => { autoQuery = ''; });
    modal.addEventListener('cancel', e => { if (busy) e.preventDefault(); });
    $sc('scFind').addEventListener('click',()=>{selectedBrand='';renderBrands();findMatches();});
    $sc('scQuery').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();selectedBrand='';renderBrands();findMatches();}});
    $sc('scBrandSearch').addEventListener('input',renderBrands);
    $sc('scBrands').addEventListener('click',e=>{
      const button=e.target.closest('[data-sc-brand]');if(!button)return;
      if (busy) return;
      selectedBrand=button.dataset.scBrand;renderBrands();
      if(initialMatch)renderMatches();
    });
    $sc('scMatches').addEventListener('click',e=>{
      if(e.target.closest('#scSearchWeb')){searchWeb();return;}
      const related=e.target.closest('[data-sc-related]');
      if (related) {
        const row = found.find(x => x.releaseKey === related.dataset.scRelated);
        if (row) showRelatedReleases(row);
        return;
      }
      const select=e.target.closest('[data-sc-select]');
      if(select){const row=found.find(x=>x.releaseKey===select.dataset.scSelect);if(row)renderSelection(row);return;}
      if(e.target.closest('#scUnlisted')){
        const brand=selectedBrand==='__other__'?$sc('scCustomBrand').value.trim():selectedBrand;
        prefillSubmission({manufacturer:brand,vehicleMake:aiResult?.vehicleMake||'',name:(currentQuery() && currentQuery() !== autoQuery ? currentQuery() : aiResult?.name)||currentQuery(),productCode:aiResult?.productCode||'',generation:aiResult?.generation||'',edition:'Regular'});
      }
    });
    $sc('scSelection').addEventListener('click',e=>{
      const btn=e.target.closest('[data-sc-save]');if(btn){addToGarage(btn.dataset.scSave);return;}
      if(e.target.closest('#scFindRelated') && selected)showRelatedReleases(selected);
      if(e.target.closest('#scSearchSelected') && selected)searchWeb(selected);
      if(e.target.closest('#scSubmitSelected'))prefillSubmission(selected);
    });
    modal.addEventListener('close', () => {
      ++photoRevision;
      resetPhoto();
      clearResults();
      $sc('scAnalyze').disabled = false;
      msg('');
    });
    referencesReady = fetch('scan-references.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('References unavailable');return r.json()})
      .then(data=>{references=Array.isArray(data.releases)?data.releases:[];references.forEach(x=>addSubmitBrand(x.manufacturer));renderBrands();if(initialMatch && !scanKind)findMatches();})
      .catch(()=>msg('Reference dataset unavailable. Existing catalog search still works.'));
    renderBrands();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  // For browser test harnesses only; never write data to the global catalogue.
  window.Turbo164Scanner = { getReleaseCandidates:()=>candidateRows().map(r=>({...r})), getManufacturers:knownBrands, releaseIdentity:candidateKey };
})();

