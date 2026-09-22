(() => {
  "use strict";
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
    store:'<path d="M3 10h18l-2-6H5z"/><path d="M4 10v11h16V10M9 21v-7h6v7"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    back:'<path d="m15 18-6-6 6-6"/>',
    check:'<path d="m5 12 5 5L20 7"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>'
  };
  const svg = (name, fill="none") => '<svg viewBox="0 0 24 24" fill="'+fill+'" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
  const labels = {market:"Marketi",mesara:"Mesare",apoteka:"Apoteke"};
  const singular = {market:"Market",mesara:"Mesara",apoteka:"Apoteka"};
  const descriptions = {market:"Namirnice i kućne potrepštine",mesara:"Meso i mesne prerađevine",apoteka:"Njega i apotekarski proizvodi"};
  const main = document.getElementById("app-main");
  const state = {view:"home",category:null,store:null,period:"daily",stores:[],offers:[],demo:true,error:"",saved:new Set(JSON.parse(localStorage.getItem("bn-saved") || "[]"))};
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
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
      weekly:[["Suncokretovo ulje","1 l",2.45,3.10,"🫒"],["Brašno","1 kg",1.10,1.45,"🌾"],["Kafa","200 g",3.95,5.20,"☕"],["Deterdžent","3 kg",8.90,11.20,"🧴"],["Šećer","1 kg",1.45,1.90,"🍬"],["Jogurt","1 l",1.95,2.40,"🥛"],["Riža","1 kg",2.20,2.85,"🍚"],["Banane","1 kg",2.10,2.70,"🍌"],["Hljeb","500 g",1.25,1.60,"🍞"],["Pasta","500 g",1.60,2.10,"🍝"]]
    },
    mesara:{
      daily:[["Pileći file","1 kg",9.90,12.90,"🍗"],["Juneće mljeveno meso","1 kg",13.50,16.80,"🥩"],["Pileći batak","1 kg",5.80,7.20,"🍗"]],
      weekly:[["Pileći file","1 kg",9.90,12.90,"🍗"],["Juneći but","1 kg",17.90,21.50,"🥩"],["Pileći batak","1 kg",5.80,7.20,"🍗"],["Ćevapi","500 g",6.90,8.40,"🥩"],["Svinjski vrat","1 kg",10.40,13.10,"🥩"],["Kobasica","500 g",5.20,6.70,"🌭"],["Pileća krilca","1 kg",4.90,6.20,"🍗"],["Juneća plećka","1 kg",15.90,19.30,"🥩"],["Pljeskavice","500 g",6.40,8.00,"🥩"],["Pureći file","1 kg",12.90,15.90,"🍗"]]
    },
    apoteka:{
      daily:[["Krema za ruke","75 ml",3.90,5.20,"🧴"],["Balzam za usne","4 g",2.80,3.60,"💄"],["Šampon","250 ml",5.40,6.90,"🧴"]],
      weekly:[["Krema za ruke","75 ml",3.90,5.20,"🧴"],["Šampon","250 ml",5.40,6.90,"🧴"],["Gel za tuširanje","400 ml",4.40,5.80,"🧴"],["Pasta za zube","75 ml",2.70,3.50,"🪥"],["Četkica za zube","1 kom",2.10,2.90,"🪥"],["Balzam za usne","4 g",2.80,3.60,"💄"],["Losion za tijelo","250 ml",6.90,8.50,"🧴"],["Krema za lice","50 ml",8.90,11.20,"🧴"],["Sapun","100 g",1.20,1.70,"🧼"],["Vlažne maramice","72 kom",3.30,4.20,"🧻"]]
    }
  };
  function demoData(){
    const stores=[]; const offers=[];
    for(const category of Object.keys(labels)){
      for(let i=1;i<=3;i++){
        const store=singular[category]+" "+i;
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
    const stores=new Map(), offers=[];
    for(const [index,row] of rows.entries()){
      if(row.every(v=>!v.trim()))continue;
      const get=name=>row[headers.indexOf(name)]?.trim()||"";
      const category=normalizeCategory(get("category")),period=normalizePeriod(get("period"));
      const store=get("store"),product=get("product"),unit=get("unit");
      const current=numberValue(get("price")),oldPrice=numberValue(get("old_price"));
      if(!category||!period||!store||!product||!unit||!Number.isFinite(current)||current<=0)throw Error("Neispravan podatak u redu "+(index+2)+".");
      const sid=idOf(category,store);
      if(!stores.has(sid))stores.set(sid,{id:sid,category,name:store});
      const count=offers.filter(o=>o.category===category&&o.store===store&&o.period===period).length;
      if(count >= (period==="daily"?3:10))continue;
      offers.push({category,store,period,product,unit,price:current,oldPrice:Number.isFinite(oldPrice)&&oldPrice>current?oldPrice:null,valid:get("valid_until"),emoji:({market:"🛒",mesara:"🥩",apoteka:"🧴"})[category]});
    }
    if(!offers.length)throw Error("Tabela nema valjanih ponuda.");
    return {stores:[...stores.values()],offers};
  }
  async function loadData(){
    const url=window.BN_CONFIG?.sheetCsvUrl?.trim();
    if(!url){const data=demoData();Object.assign(state,data,{demo:true});render();return}
    try{
      const response=await fetch(url,{cache:"no-store"});
      if(!response.ok)throw Error("Tabela nije dostupna ("+response.status+").");
      Object.assign(state,dataFromCSV(await response.text()),{demo:false,error:""});
    }catch(error){
      const data=demoData();Object.assign(state,data,{demo:true,error:"Google Sheet nije učitan: "+error.message});
    }
    render();
  }
  function navigate(view,category=null,store=null){
    state.view=view;state.category=category;state.store=store;state.period="daily";
    render();window.scrollTo({top:0,behavior:"instant"});main.focus({preventScroll:true});
  }
  function categoryCard(category){
    return '<button class="category-card" type="button" data-category="'+category+'"><span class="category-art '+category+'" aria-hidden="true"></span><span class="category-copy"><span class="category-title">'+labels[category]+'</span><span class="category-desc">'+descriptions[category]+'</span></span><span class="chevron" aria-hidden="true">›</span></button>';
  }
  function demoNotice(){return state.demo?'<span class="example-label">Primjeri cijena — nisu stvarne akcije</span>':""}
  function homeView(){
    return '<section class="banner" aria-label="Najbrže do dobrih cijena"><h1>Najbrže do<br>dobrih cijena</h1><div class="banner-art" aria-hidden="true"></div></section>'+
      '<h2 class="page-heading">Šta tražite danas?</h2><p class="page-lede">Izaberite kategoriju</p>'+
      '<div class="category-grid">'+Object.keys(labels).map(categoryCard).join("")+'</div>'+
      '<p class="rule-note">3 dnevne · 10 sedmičnih ponuda po objektu</p>';
  }
  function breadcrumb(category,store){
    return '<div class="breadcrumb"><button type="button" data-go="home">Početna</button><span>›</span><button type="button" data-category="'+category+'">'+labels[category]+'</button>'+(store?'<span>›</span><span>'+escapeHtml(store)+'</span>':"")+'</div>';
  }
  function storesView(category){
    const stores=state.stores.filter(s=>s.category===category);
    return breadcrumb(category)+'<div class="section-header"><h1>'+labels[category]+'</h1><p>Izaberite objekat i pogledajte ponude.</p></div>'+
      '<div class="search-wrap">'+svg("search")+'<input class="search" id="store-search" type="search" placeholder="Pronađi objekat" aria-label="Pronađi objekat"></div>'+
      '<div class="store-grid" id="filter-list">'+stores.map((s,i)=>'<button class="store-card '+category+'" type="button" data-store="'+escapeHtml(s.id)+'" data-search="'+escapeHtml(s.name.toLowerCase())+'"><span class="store-number">'+(i+1)+'</span><span><span class="store-name">'+escapeHtml(s.name)+'</span><span class="store-sub">Dnevne i sedmične ponude</span></span><span class="chevron" aria-hidden="true">›</span></button>').join("")+'</div>'+
      (!stores.length?'<div class="empty-state"><h2>Trenutno nema objekata</h2><p>Novi objekti će se pojaviti kada dodamo njihove ponude.</p></div>':"");
  }
  function offerCard(o,inSaved=false){
    const key=offerId(o),saved=state.saved.has(key);
    const source=inSaved?'<p class="offer-source"><strong>'+labels[o.category]+' · '+escapeHtml(o.store)+'</strong><span>'+(o.period==="daily"?"Danas":"Ove sedmice")+'</span></p>':"";
    const action=inSaved?svg("x")+'<span>Ukloni</span>':svg("bookmark",saved?"currentColor":"none");
    return '<article class="offer-card'+(inSaved?' saved-offer-card':'')+'" data-search="'+escapeHtml((o.product+" "+o.unit+" "+o.store).toLowerCase())+'"><div class="offer-visual" aria-hidden="true">'+o.emoji+'</div><div class="offer-details">'+source+'<h2 class="offer-name">'+escapeHtml(o.product)+'</h2><div class="offer-unit">'+escapeHtml(o.unit)+'</div><p class="offer-price">'+price(o.price)+(o.oldPrice?'<span class="offer-old">'+price(o.oldPrice)+'</span>':"")+'</p><p class="offer-valid">Važi '+escapeHtml(o.valid||"prema objavi")+'</p></div><button class="save-button '+(saved?"saved":"")+(inSaved?' remove-button':'')+'" type="button" data-save="'+escapeHtml(key)+'" aria-label="'+(inSaved?"Ukloni "+escapeHtml(o.product)+" iz sačuvanih ponuda":saved?"Ukloni sačuvanu ponudu":"Sačuvaj ponudu")+'" aria-pressed="'+saved+'">'+action+'</button></article>';
  }
  function offersView(category,store){
    const list=state.offers.filter(o=>o.category===category&&o.store===store&&o.period===state.period);
    const count=state.period==="daily"?3:10;
    return breadcrumb(category,store)+'<div class="section-header"><h1>'+escapeHtml(store)+'</h1><p>'+labels[category]+'</p></div>'+
      demoNotice()+(state.error?'<p class="status error" role="status">'+escapeHtml(state.error)+'</p>':"")+
      '<div class="segment" role="group" aria-label="Period akcija"><button type="button" data-period="daily" class="'+(state.period==="daily"?"active":"")+'" aria-pressed="'+(state.period==="daily")+'">Danas</button><button type="button" data-period="weekly" class="'+(state.period==="weekly"?"active":"")+'" aria-pressed="'+(state.period==="weekly")+'">Ove sedmice</button></div>'+
      '<p class="offer-count">'+list.length+' od '+count+' predviđenih proizvoda · '+(state.period==="daily"?"dnevna":"sedmična")+' ponuda</p>'+
      '<div class="search-wrap">'+svg("search")+'<input class="search" id="offer-search" type="search" placeholder="Pronađi proizvod" aria-label="Pronađi proizvod"></div>'+
      '<div class="offer-list" id="filter-list">'+list.map(o=>offerCard(o)).join("")+'</div>'+
      (!list.length?'<div class="empty-state"><h2>Nema ponuda za ovaj period</h2><p>Provjerite ponovo kasnije.</p></div>':"");
  }
  function savedView(){
    const list=state.offers.filter(o=>state.saved.has(offerId(o)));
    const total=list.reduce((sum,o)=>sum+o.price,0);
    const withOldPrice=list.filter(o=>Number.isFinite(o.oldPrice)&&o.oldPrice>o.price);
    const savings=withOldPrice.reduce((sum,o)=>sum+o.oldPrice-o.price,0);
    const withoutOldPrice=list.length-withOldPrice.length;
    const summary='<div class="saved-summary" aria-label="Zbir sačuvanih ponuda"><div class="summary-card"><span>Zbir akcijskih cijena</span><strong>'+price(total)+'</strong></div><div class="summary-card savings"><span>Moguća ušteda</span><strong>'+(withOldPrice.length?price(savings):"—")+'</strong></div></div>'+
      (withoutOldPrice?'<p class="savings-note">Broj ponuda bez stare cijene: '+withoutOldPrice+'. Za njih ušteda nije uračunata.</p>':"");
    return '<div class="section-header"><h1>Sačuvano</h1><p>Vaše odabrane ponude na ovom uređaju.</p></div>'+demoNotice()+
      (list.length?summary+'<p class="offer-count">Broj sačuvanih ponuda: '+list.length+'</p><div class="offer-list saved-offer-list">'+list.map(o=>offerCard(o,true)).join("")+'</div>':'<div class="empty-state"><h2>Još nema sačuvanih ponuda</h2><p>Otvorite objekat i dodirnite oznaku uz proizvod.</p></div>');
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
      if(state.view==="offers")navigate("stores",state.category);
      else navigate("home");
    }else if(el.dataset.category)navigate("stores",el.dataset.category);
    else if(el.dataset.store){
      const store=state.stores.find(s=>s.id===el.dataset.store);
      if(store)navigate("offers",store.category,store.name);
    }else if(el.dataset.period){state.period=el.dataset.period;render()}
    else if(el.dataset.save){
      const id=el.dataset.save;
      if(state.saved.has(id))state.saved.delete(id);else state.saved.add(id);
      localStorage.setItem("bn-saved",JSON.stringify([...state.saved]));
      render();
    }
  });
  document.addEventListener("input",event=>{
    if(!event.target.matches(".search"))return;
    const term=event.target.value.trim().toLowerCase();
    document.querySelectorAll("#filter-list > *").forEach(card=>card.hidden=!card.dataset.search.includes(term));
  });
  const splash=document.getElementById("splash");
  const dismiss=()=>{splash.classList.add("exit");setTimeout(()=>splash.remove(),370)};
  document.getElementById("skip-splash").addEventListener("click",dismiss);
  if(sessionStorage.getItem("bn-intro-seen")||matchMedia("(prefers-reduced-motion: reduce)").matches){splash.remove()}
  else{sessionStorage.setItem("bn-intro-seen","1");setTimeout(dismiss,2400)}
  loadData();
})();




