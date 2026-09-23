(() => {
  "use strict";
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
    store:'<path d="M3 10h18l-2-6H5z"/><path d="M4 10v11h16V10M9 21v-7h6v7"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    back:'<path d="m15 18-6-6 6-6"/>',
    check:'<path d="m5 12 5 5L20 7"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>'
  };
  const svg = (name, fill="none") => '<svg viewBox="0 0 24 24" fill="'+fill+'" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
  const labels = {market:"Marketi",mesara:"Mesare",apoteka:"Apoteke"};
  const singular = {market:"Market",mesara:"Mesara",apoteka:"Apoteka"};
  const descriptions = {market:"Namirnice i kućne potrepštine",mesara:"Meso i mesne prerađevine",apoteka:"Njega i apotekarski proizvodi"};
  // Fotorealistične sličice za poznate proizvode iz menija; nepoznati proizvodi (npr. iz tabele) i dalje dobijaju emoji.
  const productImages = {
    "Mlijeko 2,8%":"mlijeko.png","Jaja":"jaja.png","Jabuke":"jabuke.png","Suncokretovo ulje":"suncokretovo-ulje.png",
    "Brašno":"brasno.png","Kafa":"kafa.png","Deterdžent":"deterdzent.png","Šećer":"secer.png","Jogurt":"jogurt.png",
    "Riža":"riza.png","Banane":"banane.png","Hljeb":"hljeb.png","Pasta":"pasta.png",
    "Pileći file":"pileci-file.png","Juneće mljeveno meso":"junece-mljeveno-meso.png","Pileći batak":"pileci-batak.png",
    "Juneći but":"junece-but.png","Ćevapi":"cevapi.png","Svinjski vrat":"svinjski-vrat.png","Kobasica":"kobasica.png",
    "Pileća krilca":"pileca-krilca.png","Juneća plećka":"junece-plecka.png","Pljeskavice":"pljeskavice.png","Pureći file":"pureci-file.png",
    "Krema za ruke":"krema-za-ruke.png","Balzam za usne":"balzam-za-usne.png","Šampon":"sampon.png","Gel za tuširanje":"gel-za-tusiranje.png",
    "Pasta za zube":"pasta-za-zube.png","Četkica za zube":"cetkica-za-zube.png","Losion za tijelo":"losion-za-tijelo.png",
    "Krema za lice":"krema-za-lice.png","Sapun":"sapun.png","Vlažne maramice":"vlazne-maramice.png"
  };
  // Logotipi za poznate objekte; objekti bez loga i dalje prikazuju samo ime.
  const storeLogos = {"Tropik":"tropik.png","Fortuna":"fortuna.webp"};
  // Bost nema jedinstvenu sliku sa ikonicom i nazivom zajedno, pa se ikonica i uvećan natpis slažu ovdje.
  const storeIconText = {"Bost":{icon:"bost-icon.png",word:"bost-word.png"}};
  const storeNameHtml = (name,cls) => {
    const combo=storeIconText[name];
    if(combo)return '<img class="'+cls+'-icon" src="./assets/logos/'+combo.icon+'" alt=""><img class="'+cls+'-word" src="./assets/logos/'+combo.word+'" alt="'+escapeHtml(name)+'">';
    return storeLogos[name]?'<img class="'+cls+'" src="./assets/logos/'+storeLogos[name]+'" alt="'+escapeHtml(name)+'">':escapeHtml(name);
  };
  const hasStoreLogo = name => Boolean(storeLogos[name]||storeIconText[name]);
  const main = document.getElementById("app-main");
  const storageGet = (store,key) => {try{return window[store].getItem(key)}catch{return null}};
  const storageSet = (store,key,value) => {try{window[store].setItem(key,value)}catch{}};
  // Saved offers are stored as [id, copy of the offer] so they stay visible after the offer leaves the table.
  // Older versions stored only ids; those get their copy once the offer is seen again.
  const readSaved = () => {
    try{
      const list=JSON.parse(storageGet("localStorage","bn-saved")||"[]");
      if(!Array.isArray(list))return [];
      return list.map(item=>typeof item==="string"?[item,null]:item).filter(item=>Array.isArray(item)&&typeof item[0]==="string");
    }catch{return []}
  };
  const writeSaved = () => storageSet("localStorage","bn-saved",JSON.stringify([...state.saved]));
  const snapshot = (o,qty=1) => ({category:o.category,store:o.store,period:o.period,product:o.product,unit:o.unit,price:o.price,oldPrice:o.oldPrice,valid:o.valid,emoji:o.emoji,qty});
  const state = {view:"home",category:null,store:null,period:"daily",stores:[],offers:[],demo:true,error:"",warning:"",saved:new Map(readSaved()),qty:new Map()};
  // Količina: dok ponuda nije sačuvana pamti se privremeno (qty mapa); nakon čuvanja živi u sačuvanoj kopiji, da bi ostala i poslije osvježavanja.
  const MAX_QTY=99;
  const getQty = key => state.saved.has(key) ? (state.saved.get(key).qty||1) : (state.qty.get(key)||1);
  const setQty = (key,qty) => {
    qty=Math.max(1,Math.min(MAX_QTY,Math.round(qty)));
    if(state.saved.has(key)){state.saved.set(key,{...state.saved.get(key),qty});writeSaved()}
    else state.qty.set(key,qty);
  };
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  // Search ignores case and diacritics, so "secer" finds "Šećer" and "dj" finds "đ".
  const fold = value => String(value ?? "").toLowerCase().replace(/đ/g,"dj").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim();
  const price = value => Number(value).toFixed(2).replace(".",",") + " KM";
  const idOf = (category,store) => category+"::"+store;
  const offerId = o => [o.category,o.store,o.period,o.product,o.unit].join("::");
  const fmtDate = date => String(date.getDate()).padStart(2,"0")+"."+String(date.getMonth()+1).padStart(2,"0")+".";
  const today = new Date();
  const weekStart = new Date(today); weekStart.setDate(today.getDate()-((today.getDay()+6)%7));
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
  const validity = {daily:fmtDate(today),weekly:fmtDate(weekStart)+"–"+fmtDate(weekEnd)};
  const demoProducts = {
    market:{
      daily:[["Mlijeko 2,8%","1 l",1.65,2.20,"🥛"],["Jaja","10 kom",3.60,4.50,"🥚"],["Jabuke","1 kg",1.50,2.00,"🍎"]],
      weekly:[["Suncokretovo ulje","1 l",2.45,3.10,"🌻"],["Brašno","1 kg",1.10,1.45,"🌾"],["Kafa","200 g",3.95,5.20,"☕"],["Deterdžent","3 kg",8.90,11.20,"🧴"],["Šećer","1 kg",1.45,1.90,"🍬"],["Jogurt","1 l",1.95,2.40,"🥛"],["Riža","1 kg",2.20,2.85,"🍚"],["Banane","1 kg",2.10,2.70,"🍌"],["Hljeb","500 g",1.25,1.60,"🍞"],["Pasta","500 g",1.60,2.10,"🍝"]]
    },
    mesara:{
      daily:[["Pileći file","1 kg",9.90,12.90,"🍗"],["Juneće mljeveno meso","1 kg",13.50,16.80,"🥩"],["Pileći batak","1 kg",5.80,7.20,"🍗"]],
      weekly:[["Pileći file","1 kg",9.90,12.90,"🍗"],["Juneći but","1 kg",17.90,21.50,"🥩"],["Pileći batak","1 kg",5.80,7.20,"🍗"],["Ćevapi","500 g",6.90,8.40,"🥩"],["Svinjski vrat","1 kg",10.40,13.10,"🥩"],["Kobasica","500 g",5.20,6.70,"🌭"],["Pileća krilca","1 kg",4.90,6.20,"🍗"],["Juneća plećka","1 kg",15.90,19.30,"🥩"],["Pljeskavice","500 g",6.40,8.00,"🥩"],["Pureći file","1 kg",12.90,15.90,"🍗"]]
    },
    apoteka:{
      daily:[["Krema za ruke","75 ml",3.90,5.20,"🧴"],["Balzam za usne","4 g",2.80,3.60,"💄"],["Šampon","250 ml",5.40,6.90,"🧴"]],
      weekly:[["Krema za ruke","75 ml",3.90,5.20,"🧴"],["Šampon","250 ml",5.40,6.90,"🧴"],["Gel za tuširanje","400 ml",4.40,5.80,"🧴"],["Pasta za zube","75 ml",2.70,3.50,"🦷"],["Četkica za zube","1 kom",2.10,2.90,"🦷"],["Balzam za usne","4 g",2.80,3.60,"💄"],["Losion za tijelo","250 ml",6.90,8.50,"🧴"],["Krema za lice","50 ml",8.90,11.20,"🧴"],["Sapun","100 g",1.20,1.70,"🧼"],["Vlažne maramice","72 kom",3.30,4.20,"🧻"]]
    }
  };
  const marketNames = ["Tropik","Fortuna","Bost"];
  function demoData(){
    const stores=[]; const offers=[];
    for(const category of Object.keys(labels)){
      for(let i=1;i<=3;i++){
        const store=category==="market"?marketNames[i-1]:singular[category]+" "+i;
        stores.push({id:idOf(category,store),category,name:store});
        for(const period of ["daily","weekly"]){
          demoProducts[category][period].forEach(([product,unit,current,old,emoji])=>{
            offers.push({category,store,period,product,unit,price:Math.round((current+(i-1)*0.1)*100)/100,oldPrice:Math.round((old+(i-1)*0.1)*100)/100,valid:validity[period],emoji});
          });
        }
      }
    }
    return {stores,offers};
  }
  function parseCSV(text){
    const rows=[];let row=[],cell="",quoted=false;
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quoted){
        if(c==='"'&&text[i+1]==='"'){cell+='"';i++}
        else if(c==='"')quoted=false;
        else cell+=c;
      } else if(c==='"') quoted=true;
      else if(c===","){row.push(cell);cell=""}
      else if(c==="\n"){row.push(cell);rows.push(row);row=[];cell=""}
      else if(c!=="\r")cell+=c;
    }
    if(cell!==""||row.length){row.push(cell);rows.push(row)}
    return rows;
  }
  function normalizeCategory(raw){
    const v=String(raw).trim().toLowerCase();
    return ({market:"market",marketi:"market",mesara:"mesara",mesare:"mesara",apoteka:"apoteka",apoteke:"apoteka"})[v];
  }
  function normalizePeriod(raw){
    const v=String(raw).trim().toLowerCase();
    return ({daily:"daily",dnevno:"daily",danas:"daily",weekly:"weekly",sedmicno:"weekly","sedmično":"weekly",sedmica:"weekly"})[v];
  }
  function numberValue(value){
    const v=String(value ?? "").trim().replace(/\s|KM/gi,"");
    return Number(v.includes(",")?v.replace(/\./g,"").replace(",","."):v);
  }
  function dataFromCSV(csv){
    const rows=parseCSV(csv.trim().replace(/^\uFEFF/,""));
    if(rows.length<2)throw Error("Tabela nema redove sa ponudama.");
    const headers=rows.shift().map(x=>x.trim().toLowerCase());
    for(const required of ["category","store","period","product","unit","price","valid_until"]){
      if(!headers.includes(required))throw Error("Nedostaje kolona: "+required);
    }
    const stores=new Map(), offers=[], badRows=[];
    for(const [index,row] of rows.entries()){
      if(row.every(v=>!v.trim()))continue;
      const get=name=>row[headers.indexOf(name)]?.trim()||"";
      const category=normalizeCategory(get("category")),period=normalizePeriod(get("period"));
      const store=get("store"),product=get("product"),unit=get("unit");
      const current=numberValue(get("price")),oldPrice=numberValue(get("old_price"));
      if(!category||!period||!store||!product||!unit||!Number.isFinite(current)||current<=0){badRows.push(index+2);continue}
      const sid=idOf(category,store);
      if(!stores.has(sid))stores.set(sid,{id:sid,category,name:store});
      const count=offers.filter(o=>o.category===category&&o.store===store&&o.period===period).length;
      if(count >= (period==="daily"?3:10))continue;
      offers.push({category,store,period,product,unit,price:current,oldPrice:Number.isFinite(oldPrice)&&oldPrice>current?oldPrice:null,valid:get("valid_until"),emoji:({market:"🛒",mesara:"🥩",apoteka:"🧴"})[category]});
    }
    if(!offers.length)throw Error("Tabela nema valjanih ponuda.");
    const warning=badRows.length?"Preskočeni neispravni redovi u tabeli: "+badRows.slice(0,10).join(", ")+(badRows.length>10?" i još "+(badRows.length-10):"")+".":"";
    return {stores:[...stores.values()],offers,warning};
  }
  const sheetUrl=window.BN_CONFIG?.sheetCsvUrl?.trim();
  let lastSnapshot="";
  async function loadData(){
    if(!sheetUrl)Object.assign(state,demoData(),{demo:true});
    else try{
      const response=await fetch(sheetUrl,{cache:"no-store"});
      if(!response.ok)throw Error("Tabela nije dostupna ("+response.status+").");
      Object.assign(state,dataFromCSV(await response.text()),{demo:false,error:""});
    }catch(error){
      // A failed refresh keeps the last real offers; examples appear only if nothing real was ever loaded.
      if(state.demo)Object.assign(state,demoData(),{error:"Google Sheet nije učitan: "+error.message});
      else state.error="Osvježavanje nije uspjelo, prikazane su posljednje učitane ponude.";
    }
    let savedChanged=false;
    for(const o of state.offers){
      const id=offerId(o);
      if(!state.saved.has(id))continue;
      const fresh=snapshot(o,state.saved.get(id).qty||1);
      if(JSON.stringify(state.saved.get(id))!==JSON.stringify(fresh)){state.saved.set(id,fresh);savedChanged=true}
    }
    if(savedChanged)writeSaved();
    const current=JSON.stringify([state.offers,state.error,state.warning]);
    if(current===lastSnapshot)return;
    lastSnapshot=current;
    const term=document.querySelector(".search")?.value||"";
    render();
    const search=document.querySelector(".search");
    if(term&&search){search.value=term;search.dispatchEvent(new Event("input",{bubbles:true}))}
  }
  function navigate(view,category=null,store=null,fromHistory=false){
    if(!fromHistory)history.pushState({view,category,store,depth:(history.state?.depth||0)+1},"");
    state.view=view;state.category=category;state.store=store;state.period="daily";
    render();window.scrollTo({top:0,behavior:"instant"});main.focus({preventScroll:true});
  }
  function categoryCard(category){
    return '<button class="category-card" type="button" data-category="'+category+'"><span class="category-art '+category+'" aria-hidden="true"></span><span class="category-copy"><span class="category-title">'+labels[category]+'</span><span class="category-desc">'+descriptions[category]+'</span></span><span class="chevron" aria-hidden="true">›</span></button>';
  }
  function statusNotice(){
    return [state.error,state.warning].filter(Boolean).map(text=>'<p class="status error" role="status">'+escapeHtml(text)+'</p>').join("");
  }
  function homeView(){
    return statusNotice()+'<section class="banner" aria-label="Najbrže do dobrih cijena"><div class="banner-copy"><span class="banner-eyebrow">BN AKCIJA <span aria-hidden="true">✦</span> AKCIJE SVAKI DAN</span><h1>Najbrže do<br>dobrih cijena<span class="banner-period">.</span></h1><p>Dnevne i sedmične akcije blizu vas</p></div><div class="banner-art" aria-hidden="true"></div></section>'+
      '<h2 class="page-heading">Šta tražite danas?</h2><p class="page-lede">Izaberite kategoriju</p>'+
      '<div class="category-grid">'+Object.keys(labels).map(categoryCard).join("")+'</div>'+
      '<p class="rule-note">3 dnevne · 10 sedmičnih ponuda po objektu</p>';
  }
  function breadcrumb(category,store){
    return '<div class="breadcrumb"><button type="button" data-go="home">Početna</button><span>›</span><button type="button" data-category="'+category+'">'+labels[category]+'</button>'+(store?'<span>›</span><span>'+escapeHtml(store)+'</span>':"")+'</div>';
  }
  function storesView(category){
    const stores=state.stores.filter(s=>s.category===category);
    return breadcrumb(category)+'<div class="section-header category-head"><div class="category-head-copy"><h1>'+labels[category]+'</h1><p>Izaberite objekat i pogledajte ponude.</p></div><span class="category-art '+category+'" aria-hidden="true"></span></div>'+
      '<div class="search-wrap">'+svg("search")+'<input class="search" id="store-search" type="search" placeholder="Pronađi objekat" aria-label="Pronađi objekat"></div>'+
      '<div class="store-grid" id="filter-list">'+stores.map((s,i)=>'<button class="store-card '+category+'" type="button" data-store="'+escapeHtml(s.id)+'" data-search="'+escapeHtml(fold(s.name))+'"><span class="store-number">'+(i+1)+'</span><span class="store-copy"><span class="store-name'+(hasStoreLogo(s.name)?' has-logo':'')+'">'+storeNameHtml(s.name,"store-logo")+'</span><span class="store-sub">Dnevne i sedmične ponude</span></span><span class="chevron" aria-hidden="true">›</span></button>').join("")+'</div>'+
      (!stores.length?'<div class="empty-state"><h2>Trenutno nema objekata</h2><p>Novi objekti će se pojaviti kada dodamo njihove ponude.</p></div>':"");
  }
  // Last date written in valid_until ("23.09.", "21.09.–27.09.", "30.09.2026"); unreadable text never hides an offer.
  function validUntil(text){
    const matches=[...String(text||"").matchAll(/(\d{1,2})\.\s*(\d{1,2})\.?\s*(\d{4})?/g)];
    if(!matches.length)return null;
    const [,d,m,y]=matches[matches.length-1];
    const now=new Date();
    const end=new Date(y?Number(y):now.getFullYear(),Number(m)-1,Number(d),23,59,59);
    if(end.getDate()!==Number(d)||end.getMonth()!==Number(m)-1)return null;
    if(!y){
      const days=(end-now)/864e5;
      if(days>180)end.setFullYear(end.getFullYear()-1);
      else if(days<-180)end.setFullYear(end.getFullYear()+1);
    }
    return end;
  }
  const isActive = o => {const end=validUntil(o.valid);return !end||end>=new Date()};
  function offerCard(o,inSaved=false,stale=false){
    const key=offerId(o),saved=state.saved.has(key);
    // Active saved offers sit under their store's heading, so only stale ones repeat the store name.
    const source=inSaved?'<p class="offer-source">'+(stale?'<strong>'+labels[o.category]+' · '+escapeHtml(o.store)+'</strong>':'')+'<span>'+(o.period==="daily"?"Danas":"Ove sedmice")+'</span></p>':"";
    const action=inSaved?svg("trash"):svg("bookmark",saved?"currentColor":"none");
    const validLine=stale?'<p class="offer-valid stale-note">Više nije u ponudi</p>':'<p class="offer-valid">Važi '+escapeHtml(o.valid||"prema objavi")+'</p>';
    const image=productImages[o.product];
    const visual=image?'<img src="./assets/products/'+image+'" alt="">':o.emoji;
    const qty=getQty(key);
    const qtyRow='<div class="qty-row"><span class="qty-label">Količina</span><div class="qty-stepper"><button type="button" class="qty-btn" data-qty="'+escapeHtml(key)+'" data-dir="-1" aria-label="Smanji količinu">−</button><span class="qty-value" aria-live="polite">'+qty+'</span><button type="button" class="qty-btn" data-qty="'+escapeHtml(key)+'" data-dir="1" aria-label="Povećaj količinu">+</button></div></div>';
    const totalLine=qty>1?'<p class="offer-total">Ukupno: '+price(o.price*qty)+'</p>':"";
    return '<article class="offer-card'+(inSaved?' saved-offer-card':'')+(stale?' stale-offer':'')+'" data-search="'+escapeHtml(fold(o.product+" "+o.unit+" "+o.store))+'"><div class="offer-visual" aria-hidden="true">'+visual+'</div><div class="offer-details">'+source+'<h2 class="offer-name">'+escapeHtml(o.product)+'</h2><div class="offer-unit">'+escapeHtml(o.unit)+'</div>'+qtyRow+'<p class="offer-price">'+price(o.price)+(o.oldPrice?'<span class="offer-old">'+price(o.oldPrice)+'</span>':"")+'</p>'+totalLine+validLine+'</div><button class="save-button '+(saved?"saved":"")+(inSaved?' remove-button':'')+'" type="button" data-save="'+escapeHtml(key)+'" aria-label="'+(inSaved?"Ukloni "+escapeHtml(o.product)+" iz sačuvanih ponuda":saved?"Ukloni sačuvanu ponudu":"Sačuvaj ponudu")+'" aria-pressed="'+saved+'">'+action+'</button></article>';
  }
  function offersView(category,store){
    const list=state.offers.filter(o=>o.category===category&&o.store===store&&o.period===state.period&&isActive(o));
    const count=state.period==="daily"?3:10;
    return breadcrumb(category,store)+'<div class="section-header category-head"><div class="category-head-copy"><h1'+(hasStoreLogo(store)?' class="has-logo"':'')+'>'+storeNameHtml(store,"store-logo-lg")+'</h1><p>'+labels[category]+'</p></div><span class="category-art '+category+'" aria-hidden="true"></span></div>'+
      statusNotice()+
      '<div class="segment" role="group" aria-label="Period akcija"><button type="button" data-period="daily" class="'+(state.period==="daily"?"active":"")+'" aria-pressed="'+(state.period==="daily")+'">Danas</button><button type="button" data-period="weekly" class="'+(state.period==="weekly"?"active":"")+'" aria-pressed="'+(state.period==="weekly")+'">Ove sedmice</button></div>'+
      '<p class="offer-count">'+list.length+' od '+count+' predviđenih proizvoda · '+(state.period==="daily"?"dnevna":"sedmična")+' ponuda</p>'+
      '<div class="search-wrap">'+svg("search")+'<input class="search" id="offer-search" type="search" placeholder="Pronađi proizvod" aria-label="Pronađi proizvod"></div>'+
      '<div class="offer-list" id="filter-list">'+list.map(o=>offerCard(o)).join("")+'</div>'+
      (!list.length?'<div class="empty-state"><h2>Nema ponuda za ovaj period</h2><p>Provjerite ponovo kasnije.</p></div>':"");
  }
  function savedView(){
    const activeById=new Map(state.offers.filter(isActive).map(o=>[offerId(o),o]));
    const list=[],stale=[];
    for(const [id,copy] of state.saved){
      if(activeById.has(id))list.push({...activeById.get(id),qty:copy?.qty||1});
      else if(copy)stale.push(copy);
    }
    const total=list.reduce((sum,o)=>sum+o.price*o.qty,0);
    const withOldPrice=list.filter(o=>Number.isFinite(o.oldPrice)&&o.oldPrice>o.price);
    const savings=withOldPrice.reduce((sum,o)=>sum+(o.oldPrice-o.price)*o.qty,0);
    const withoutOldPrice=list.length-withOldPrice.length;
    const summary='<div class="saved-summary" aria-label="Zbir sačuvanih ponuda"><div class="summary-card"><span>Zbir akcijskih cijena</span><strong>'+price(total)+'</strong></div><div class="summary-card savings"><span>Moguća ušteda</span><strong>'+(withOldPrice.length?price(savings):"—")+'</strong></div></div>'+
      (withoutOldPrice?'<p class="savings-note">Broj ponuda bez stare cijene: '+withoutOldPrice+'. Za njih ušteda nije uračunata.</p>':"");
    const groups=new Map();
    for(const o of list){
      const id=idOf(o.category,o.store);
      if(!groups.has(id))groups.set(id,[]);
      groups.get(id).push(o);
    }
    const countText=n=>n+" "+(n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?"ponude":"ponuda");
    const grouped=[...groups.values()].map(items=>'<section class="saved-group"><div class="saved-group-head"><span class="saved-group-name"><strong>'+escapeHtml(items[0].store)+'</strong><span>'+labels[items[0].category]+'</span></span><span class="saved-group-total">'+countText(items.length)+' · '+price(items.reduce((sum,o)=>sum+o.price*o.qty,0))+'</span></div><div class="offer-list saved-offer-list">'+items.map(o=>offerCard(o,true)).join("")+'</div></section>').join("");
    const subtitle=list.length?"Broj sačuvanih ponuda: "+list.length+", poredane po prodavnicama.":"Vaše odabrane ponude na ovom uređaju.";
    return '<div class="section-header category-head saved-head"><div class="category-head-copy"><h1>Sačuvano</h1><p>'+subtitle+'</p></div><span class="saved-head-icon" aria-hidden="true">'+svg("bookmark","currentColor")+'</span></div>'+
      (list.length?summary+grouped:
        !stale.length?'<div class="empty-state"><h2>Još nema sačuvanih ponuda</h2><p>Otvorite objekat i dodirnite oznaku uz proizvod.</p></div>':"")+
      (stale.length?'<h2 class="stale-heading">Više nije u ponudi</h2><p class="savings-note">Ove ponude su istekle ili su uklonjene iz tabele i nisu uračunate u zbir.</p><div class="offer-list saved-offer-list">'+stale.map(o=>offerCard(o,true,true)).join("")+'</div>':"");
  }
  function allStoresView(){
    return '<div class="section-header"><h1>Prodavnice</h1><p>Izaberite kategoriju i objekat.</p></div><div class="category-grid">'+Object.keys(labels).map(categoryCard).join("")+'</div>';
  }
  function navButton(id,icon,label,active){
    const button=document.getElementById(id);
    button.innerHTML=svg(icon)+(label);
    button.classList.toggle("active",active);
    if(active)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");
  }
  function render(){
    main.innerHTML=state.view==="home"?homeView():state.view==="stores"?storesView(state.category):state.view==="offers"?offersView(state.category,state.store):state.view==="saved"?savedView():allStoresView();
    document.getElementById("header-back").classList.toggle("hidden",!["stores","offers"].includes(state.view));
    navButton("nav-home","home","Početna",["home","stores","offers"].includes(state.view));
    navButton("nav-saved","bookmark","Sačuvano",state.view==="saved");
    navButton("nav-stores","store","Prodavnice",state.view==="all-stores");
    document.getElementById("header-back").innerHTML=svg("back");
  }
  document.addEventListener("click",event=>{
    const el=event.target.closest("button");
    if(!el)return;
    if(el.id==="brand-home"||el.id==="nav-home"||el.dataset.go==="home")navigate("home");
    else if(el.id==="nav-saved")navigate("saved");
    else if(el.id==="nav-stores")navigate("all-stores");
    else if(el.id==="header-back"){
      if(history.state?.depth>0)history.back();
      else if(state.view==="offers")navigate("stores",state.category);
      else navigate("home");
    }else if(el.dataset.category)navigate("stores",el.dataset.category);
    else if(el.dataset.store){
      const store=state.stores.find(s=>s.id===el.dataset.store);
      if(store)navigate("offers",store.category,store.name);
    }else if(el.dataset.period){state.period=el.dataset.period;render()}
    else if(el.dataset.save){
      const id=el.dataset.save;
      if(state.saved.has(id))state.saved.delete(id);
      else{const offer=state.offers.find(o=>offerId(o)===id);if(offer)state.saved.set(id,snapshot(offer,getQty(id)))}
      writeSaved();
      render();
    }else if(el.dataset.qty){
      setQty(el.dataset.qty,getQty(el.dataset.qty)+Number(el.dataset.dir));
      render();
    }
  });
  document.addEventListener("input",event=>{
    if(!event.target.matches(".search"))return;
    const term=fold(event.target.value);
    const cards=[...document.querySelectorAll("#filter-list > *")];
    cards.forEach(card=>card.hidden=!card.dataset.search.includes(term));
    const list=document.getElementById("filter-list");
    let empty=document.getElementById("no-results");
    if(!empty&&list){
      empty=document.createElement("div");empty.id="no-results";empty.className="empty-state";empty.setAttribute("role","status");
      list.after(empty);
    }
    if(empty){
      const none=cards.length>0&&cards.every(card=>card.hidden);
      empty.hidden=!none;
      empty.innerHTML=none?'<h2>Nema rezultata</h2><p>Ništa ne odgovara pojmu „'+escapeHtml(event.target.value.trim())+'“.</p>':"";
    }
  });
  const splash=document.getElementById("splash");
  const dismiss=()=>{if(!splash.isConnected)return;splash.classList.add("exit");setTimeout(()=>splash.remove(),370)};
  document.getElementById("skip-splash").addEventListener("click",dismiss);
  // Intro: text rises, products hop and drop, a pale yellow then a green curtain pass, and a growing quarter circle reveals the app.
  // "?uvod" in the address replays it even if it was already seen in this session.
  const forceIntro=new URLSearchParams(location.search).has("uvod");
  if(!forceIntro&&(storageGet("sessionStorage","bn-intro-seen")||matchMedia("(prefers-reduced-motion: reduce)").matches)){splash.remove()}
  else{
    storageSet("sessionStorage","bn-intro-seen","1");
    setTimeout(()=>splash.classList.add("sweep"),2250);
    setTimeout(dismiss,3180);
  }
  history.replaceState({view:"home",category:null,store:null,depth:0},"");
  window.addEventListener("popstate",event=>{
    const s=event.state||{view:"home"};
    navigate(s.view,s.category||null,s.store||null,true);
  });
  loadData();
  if(sheetUrl){
    const minutes=Number(window.BN_CONFIG?.refreshMinutes)||15;
    setInterval(()=>{if(!document.hidden)loadData()},Math.max(1,minutes)*60000);
    let hiddenAt=0;
    document.addEventListener("visibilitychange",()=>{
      if(document.hidden)hiddenAt=Date.now();
      else if(Date.now()-hiddenAt>60000)loadData();
    });
  }
})();
