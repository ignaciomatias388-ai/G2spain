// ── HTTPS redirect ──
(function(){
  var h=location.hostname;
  if(location.protocol==='http:'&&h!=='localhost'&&h!=='127.0.0.1'&&h!==''){
    location.replace(location.href.replace(/^http:/,'https:'));
  }
})();

// ── WhatsApp — 4s throttle entre clics ──
var _waTs=0;
function openWA(){
  var now=Date.now();
  if(now-_waTs<4000)return;
  _waTs=now;
  var msg='Hola, me gustaría importar un auto desde Alemania a España. Quisiera saber el precio estimado, los tiempos de entrega y el proceso completo. ¿Me puedes ayudar?';
  window.open('https://wa.me/491771800435?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');
}

function selectCalcMode(mode, el){
  document.querySelectorAll('.calc-mode').forEach(function(m){m.classList.remove('selected');});
  if(el) el.classList.add('selected');
  var urlBox=document.getElementById('calc-url-box');
  var form=document.getElementById('calc-form');
  if(mode==='auto'){
    urlBox.style.display='block';
    form.style.display='none';
    urlBox.scrollIntoView({behavior:'smooth',block:'nearest'});
  } else {
    urlBox.style.display='none';
    form.style.display='flex';
    form.style.flexDirection='column';
    setTimeout(function(){form.scrollIntoView({behavior:'smooth',block:'nearest'});},100);
  }
}
var _ALLOWED_DOMAINS=['mobile.de','autoscout24.','coches.net'];
function continueWithUrl(){
  var url=document.getElementById('vehicle-url').value.trim();
  if(!url){alert('Introduce el link del anuncio primero');return;}
  var isKnown=_ALLOWED_DOMAINS.some(function(d){return url.indexOf(d)!==-1;});
  if(!isKnown){alert('Introduce un link de Mobile.de, AutoScout24 o Coches.net');return;}
  var portal='el portal';
  if(url.indexOf('mobile.de')!==-1) portal='Mobile.de';
  else if(url.indexOf('autoscout24')!==-1) portal='AutoScout24';
  else if(url.indexOf('coches.net')!==-1) portal='Coches.net';
  var yearMatch=url.match(/(20[0-2]\d)/);
  document.getElementById('qf-portal-name').textContent=portal;
  if(yearMatch) document.getElementById('qf-year').value=yearMatch[1];
  document.getElementById('calc-url-box').style.display='none';
  var qf=document.getElementById('calc-quickfill');
  qf.style.display='block';
  setTimeout(function(){qf.scrollIntoView({behavior:'smooth',block:'nearest'});},100);
}
function applyQuickFill(){
  if(document.getElementById('hp-website').value!=='')return; // honeypot check
  var price=parseFloat(document.getElementById('qf-price').value)||0;
  var yr=document.getElementById('qf-year').value;
  var km=document.getElementById('qf-km').value;
  if(price<=0){alert('Introduce el precio del anuncio para continuar');return;}
  if(price>2000000){alert('El precio introducido parece incorrecto. Compruébalo e inténtalo de nuevo.');return;}
  document.getElementById('precio-min').value=price;
  document.getElementById('precio-max').value=price;
  if(yr){document.getElementById('anio-desde').value=yr;document.getElementById('anio-hasta').value=yr;}
  if(km){document.getElementById('km-desde').value=0;document.getElementById('km-hasta').value=km;}
  document.getElementById('calc-quickfill').style.display='none';
  var form=document.getElementById('calc-form');
  form.style.display='flex';form.style.flexDirection='column';
  calcularV2();
  setTimeout(function(){document.getElementById('results-v2').scrollIntoView({behavior:'smooth'});},200);
}

function openCalModal(){
  var modal=document.getElementById('cal-modal');
  var iframe=document.getElementById('cal-iframe');
  if(iframe.src==='about:blank') iframe.src=iframe.dataset.src;
  modal.style.display='flex';
  document.body.style.overflow='hidden';
}
function closeCalModal(){
  document.getElementById('cal-modal').style.display='none';
  document.body.style.overflow='';
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeCalModal();});

function shuffle(arr){
  var a=[...arr];
  for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}
  return a;
}

function toggleOtros(){
  const panel=document.getElementById('otros-panel');
  const btn=document.getElementById('otros-btn');
  panel.classList.toggle('open');
  btn.innerHTML=panel.classList.contains('open')
    ?'Otros <i class="ti ti-chevron-up"></i>'
    :'Otros <i class="ti ti-chevron-down"></i>';
}

function toggleMenu(){
  const m=document.getElementById('mobile-menu');
  const h=document.getElementById('hamburger');
  m.classList.toggle('open');
  h.classList.toggle('open');
}
function closeMenu(){
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

function fmt(n){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);}

let transportMode='camion';
function setTransport(mode){
  transportMode=mode;
  document.getElementById('opt-camion').classList.toggle('active',mode==='camion');
  document.getElementById('opt-propia').classList.toggle('active',mode==='propia');
  if(mode==='camion'){
    document.getElementById('row-placas').style.display='';
    document.getElementById('row-seguro').style.display='';
    document.getElementById('r2-transp-label').textContent='Camión / Portavehículos';
    document.getElementById('r2-transp').textContent='800–1.800€';
  } else {
    document.getElementById('row-placas').style.display='none';
    document.getElementById('row-seguro').style.display='none';
    document.getElementById('r2-transp-label').textContent='Conducción propia (placas, seguro, comb., peajes incluidos)';
    document.getElementById('r2-transp').textContent='400–1.200€';
  }
}

function estimarCO2(precioMed, anioMed){
  let base;
  if(precioMed<15000) base=112;
  else if(precioMed<25000) base=135;
  else if(precioMed<40000) base=158;
  else if(precioMed<60000) base=185;
  else base=210;
  if(anioMed>=2022) base=Math.round(base*0.91);
  else if(anioMed>=2019) base=Math.round(base*0.96);
  return base;
}

var _calcTs=0;
function calcularV2(){
  var now=Date.now();
  if(now-_calcTs<1500)return; // 1.5s debounce
  _calcTs=now;
  const precioMin=parseFloat(document.getElementById('precio-min').value)||0;
  const precioMax=parseFloat(document.getElementById('precio-max').value)||0;
  const anioDesde=parseInt(document.getElementById('anio-desde').value)||0;
  const anioHasta=parseInt(document.getElementById('anio-hasta').value)||0;
  const kmDesde=parseInt(document.getElementById('km-desde').value)||0;
  const kmHasta=parseInt(document.getElementById('km-hasta').value)||0;
  const conGestoria=document.getElementById('gestoria').checked;

  if(precioMin<=0&&precioMax<=0){alert('Introduce al menos el precio mínimo o máximo del vehículo');return;}
  const pMin=precioMin>0?precioMin:precioMax;
  const pMax=precioMax>0?precioMax:precioMin;
  if(pMin>pMax){alert('El precio mínimo no puede ser mayor al precio máximo');return;}
  const pMed=Math.round((pMin+pMax)/2);
  const anioMed=anioDesde&&anioHasta?Math.round((anioDesde+anioHasta)/2):anioDesde||anioHasta||2020;

  // CO2 estimado automáticamente (nunca visible para el usuario)
  const co2Estimado=estimarCO2(pMed,anioMed);

  // Ranges [min, med, max]
  const baja=[10,30,50];
  const docs=[50,125,200];
  const itv=[100,200,300];
  const dgt=[50,100,150];
  const gestoria=conGestoria?[100,200,300]:[0,0,0];
  let placas,seguro,transp;
  if(transportMode==='camion'){
    placas=[100,175,250]; seguro=[50,100,150]; transp=[800,1300,1800];
  } else {
    placas=[0,0,0]; seguro=[0,0,0]; transp=[400,800,1200];
  }

  // Ajuste por kilometraje
  const kmRef=kmHasta||kmDesde||0;
  const kmSurcharge=kmRef>150000?[150,250,400]:kmRef>80000?[0,100,200]:[0,0,0];

  // Ajuste por antigüedad del vehículo
  const yearRef=anioDesde||anioHasta||2020;
  const yearSurcharge=yearRef<2015?[100,200,350]:[0,0,0];

  // IEDMT según CO2 estimado
  let pct=0;
  if(co2Estimado<120) pct=0;
  else if(co2Estimado<=159) pct=0.0475;
  else if(co2Estimado<=199) pct=0.0975;
  else pct=0.1475;

  const iedmtMin=Math.round(pMin*pct);
  const iedmtMed=Math.round(pMed*pct);
  const iedmtMax=Math.round(pMax*pct);

  const total=(i,p,iedmt)=>p+baja[i]+placas[i]+seguro[i]+docs[i]+transp[i]+itv[i]+dgt[i]+gestoria[i]+iedmt+kmSurcharge[i]+yearSurcharge[i];

  const priceLabel=pMin===pMax?fmt(pMin):`${fmt(pMin)} – ${fmt(pMax)}`;
  document.getElementById('r2-precio').textContent=priceLabel;
  document.getElementById('r2-iedmt-label').textContent=pct===0
    ?`Exento (0%) — CO₂ estimado < 120 g/km`
    :`${(pct*100).toFixed(2)}% sobre precio (CO₂ estimado: ~${co2Estimado} g/km)`;
  document.getElementById('r2-iedmt').textContent=pct===0?'0 €':`${fmt(iedmtMin)} – ${fmt(iedmtMax)}`;
  document.getElementById('row-gestoria').style.display=conGestoria?'':'none';
  document.getElementById('r2-low').textContent=fmt(total(0,pMin,iedmtMin));
  document.getElementById('r2-mid').textContent=fmt(total(1,pMed,iedmtMed));
  document.getElementById('r2-high').textContent=fmt(total(2,pMax,iedmtMax));
  document.getElementById('results-v2').classList.add('show');
  setTimeout(()=>document.getElementById('results-v2').scrollIntoView({behavior:'smooth'}),100);
}

const W='https://commons.wikimedia.org/wiki/Special:FilePath/';
/* Imagen de respaldo garantizada por marca (todas verificadas en Commons) */
const BF={
  bmw:       W+'BMW_M4_(G82)_Mint_Green_IAA_2021_1X7A0002.jpg',
  mercedes:  W+'Mercedes_A-Klasse_front.JPG',
  audi:      W+'Audi_A3_Sportback_8V_(front).JPG',
  volkswagen:W+'VW_Golf_GTI_(VIII)_–_f_03012021.jpg',
  porsche:   W+'Porsche_Macan_(2015)_from_Stuttgart.JPG',
  toyota:    W+'Toyota_Yaris_front.JPG',
  renault:   W+'Renault_Clio_III_20090527_front.JPG',
  peugeot:   W+'The_frontview_of_Peugeot_208_GTi.JPG',
  opel:      W+'Opel_Corsa_D_OPC_front.JPG',
  skoda:     W+'Skoda_Octavia.JPG',
  ford:      W+'Ford_Mustang_GT.JPG',
  seat:      W+'Seat_Ibiza_6J.JPG',
  kia:       W+'Kia_Picanto_front.JPG',
  volvo:     W+'Volvo_V40_Facelift.JPG',
};

const catalogData={
  bmw:{
    as:'https://www.autoscout24.de/lst/bmw?atype=C&cy=D&damaged_listing=exclude',
    mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=3500%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'BMW 116i Hatchback',year:2020,km:'52.000 km',fuel:'Gasolina · 109 CV',price:'14.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/BMW_1er_(E87)_front.JPG',portal:'Mobile.de'},
      {model:'BMW 320i M-Sport',year:2021,km:'38.000 km',fuel:'Gasolina · 184 CV',price:'24.500 €',img:W+'BMW_320d_Facelift_Front.JPG',portal:'AutoScout24'},
      {model:'BMW X3 xDrive20d',year:2021,km:'41.000 km',fuel:'Diésel · 190 CV',price:'32.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/BMW_X3_F25.JPG',portal:'Mobile.de'},
      {model:'BMW M4 Competition',year:2022,km:'18.000 km',fuel:'Gasolina · 510 CV',price:'62.000 €',img:W+'BMW_M4_(G82)_Mint_Green_IAA_2021_1X7A0002.jpg',portal:'AutoScout24'},
    ]
  },
  mercedes:{
    as:'https://www.autoscout24.de/lst/mercedes-benz?atype=C&cy=D&damaged_listing=exclude',
    mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=17200%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'Mercedes Clase A 180',year:2020,km:'48.000 km',fuel:'Gasolina · 136 CV',price:'16.500 €',img:W+'Mercedes_A-Klasse_front.JPG',portal:'Mobile.de'},
      {model:'Mercedes Clase C 220d',year:2021,km:'35.000 km',fuel:'Diésel · 194 CV',price:'26.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Mercedes-Benz_W206_C_300_4MATIC_AMG_Line_Graphite_Grey_(2).jpg',portal:'AutoScout24'},
      {model:'Mercedes GLC 300 4MATIC',year:2022,km:'22.000 km',fuel:'Gasolina · 258 CV',price:'39.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Mercedes-Benz_GLS_350d_4MATIC_Sports_(X166)_front.JPG',portal:'Mobile.de'},
      {model:'Mercedes-AMG C63 S',year:2021,km:'29.000 km',fuel:'Gasolina · 510 CV',price:'67.000 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Mercedes-Benz_C-Class_W205_JPN_003.JPG',portal:'AutoScout24'},
    ]
  },
  audi:{
    as:'https://www.autoscout24.de/lst/audi?atype=C&cy=D&damaged_listing=exclude',
    mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=1900%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'Audi A3 Sportback 30 TFSI',year:2020,km:'55.000 km',fuel:'Gasolina · 116 CV',price:'15.900 €',img:W+'Audi_A3_Sportback_8V_(front).JPG',portal:'Mobile.de'},
      {model:'Audi A4 Avant 35 TDI',year:2021,km:'42.000 km',fuel:'Diésel · 163 CV',price:'25.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Audi_A3_Sportback_2.0_TDI_Facelift_front.JPG',portal:'AutoScout24'},
      {model:'Audi Q5 40 TDI S-Line',year:2022,km:'28.000 km',fuel:'Diésel · 204 CV',price:'37.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Audi_A3_Sportback_8V_(front).JPG',portal:'Mobile.de'},
      {model:'Audi RS3 Sportback',year:2022,km:'14.000 km',fuel:'Gasolina · 400 CV',price:'51.000 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Audi_RS3_Sportback_Daytonagrau.JPG',portal:'AutoScout24'},
    ]
  },
  volkswagen:{
    as:'https://www.autoscout24.de/lst/volkswagen?atype=C&cy=D&damaged_listing=exclude',
    mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=24100%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'VW Polo 1.0 TSI Comfortline',year:2020,km:'58.000 km',fuel:'Gasolina · 95 CV',price:'12.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/VW_Polo_TSI_Comfortline_(6R)_front.JPG',portal:'Mobile.de'},
      {model:'VW Golf 1.5 TSI Life',year:2021,km:'36.000 km',fuel:'Gasolina · 130 CV',price:'19.800 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Volkswagen_Golf_VII_GTI_front.JPG',portal:'AutoScout24'},
      {model:'VW Golf GTI Performance',year:2022,km:'21.000 km',fuel:'Gasolina · 245 CV',price:'29.500 €',img:W+'VW_Golf_GTI_(VIII)_–_f_03012021.jpg',portal:'Mobile.de'},
      {model:'VW Golf R 4Motion',year:2022,km:'15.000 km',fuel:'Gasolina · 320 CV',price:'38.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/VW_Golf_VII_R_Variant_4Motion_2.0_TSI_DSG.JPG',portal:'AutoScout24'},
    ]
  },
  porsche:{
    as:'https://www.autoscout24.de/lst/porsche?atype=C&cy=D&damaged_listing=exclude',
    mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=20000%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'Porsche Macan 2.0',year:2020,km:'52.000 km',fuel:'Gasolina · 245 CV',price:'38.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Porsche_Macan_(2015)_from_Stuttgart.JPG',portal:'Mobile.de'},
      {model:'Porsche Macan S',year:2021,km:'34.000 km',fuel:'Gasolina · 354 CV',price:'52.000 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Porsche_Macan_(2015)_at_Wolfsburg.JPG',portal:'AutoScout24'},
      {model:'Porsche Cayenne 3.0',year:2021,km:'38.000 km',fuel:'Gasolina · 340 CV',price:'65.000 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Porsche_Macan_(2015)_from_Stuttgart.JPG',portal:'Mobile.de'},
      {model:'Porsche 911 Carrera',year:2020,km:'28.000 km',fuel:'Gasolina · 385 CV',price:'88.000 €',img:W+'Porsche_911_GT2_Front.JPG',portal:'AutoScout24'},
    ]
  },
  toyota:{as:'https://www.autoscout24.de/lst/toyota?atype=C&cy=D',mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=23600%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'Toyota Yaris 1.5 Hybrid',year:2021,km:'32.000 km',fuel:'Híbrido · 116 CV',price:'14.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Toyota_Yaris_front.JPG',portal:'Mobile.de'},
      {model:'Toyota Corolla TS Hybrid',year:2021,km:'28.000 km',fuel:'Híbrido · 184 CV',price:'22.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Toyota_RAV4_001.JPG',portal:'AutoScout24'},
      {model:'Toyota RAV4 Hybrid',year:2022,km:'24.000 km',fuel:'Híbrido · 222 CV',price:'32.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Toyota_RAV4_001.JPG',portal:'Mobile.de'},
      {model:'Toyota GR86',year:2022,km:'12.000 km',fuel:'Gasolina · 234 CV',price:'31.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Toyota_Yaris_front.JPG',portal:'AutoScout24'},
    ]},
  renault:{as:'https://www.autoscout24.de/lst/renault?atype=C&cy=D',mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=20700%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'Renault Clio 1.0 TCe',year:2021,km:'38.000 km',fuel:'Gasolina · 90 CV',price:'11.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Renault_Clio_III_20090527_front.JPG',portal:'Mobile.de'},
      {model:'Renault Mégane RS Line',year:2021,km:'29.000 km',fuel:'Gasolina · 140 CV',price:'18.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Renault_Clio-IV-Estate_Front.JPG',portal:'AutoScout24'},
      {model:'Renault Arkana E-Tech',year:2022,km:'22.000 km',fuel:'Híbrido · 145 CV',price:'24.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Renault_Clio_III_20090527_front.JPG',portal:'Mobile.de'},
      {model:'Renault Mégane RS Trophy',year:2021,km:'19.000 km',fuel:'Gasolina · 300 CV',price:'29.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Renault_Clio-IV-RS_Front.JPG',portal:'AutoScout24'},
    ]},
  peugeot:{as:'https://www.autoscout24.de/lst/peugeot?atype=C&cy=D',mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=19800%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'Peugeot 208 1.2 PureTech',year:2021,km:'34.000 km',fuel:'Gasolina · 100 CV',price:'13.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/The_frontview_of_Peugeot_208_GTi.JPG',portal:'Mobile.de'},
      {model:'Peugeot 308 Allure',year:2022,km:'21.000 km',fuel:'Gasolina · 130 CV',price:'21.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Peugeot_208.JPG',portal:'AutoScout24'},
      {model:'Peugeot 3008 GT Hybrid',year:2022,km:'25.000 km',fuel:'Híbrido · 225 CV',price:'31.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/The_frontview_of_Peugeot_208_GTi.JPG',portal:'Mobile.de'},
      {model:'Peugeot 508 SW GT',year:2021,km:'30.000 km',fuel:'Gasolina · 225 CV',price:'28.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Peugeot_208.JPG',portal:'AutoScout24'},
    ]},
  opel:{as:'https://www.autoscout24.de/lst/opel?atype=C&cy=D',mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=19000%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'Opel Corsa 1.2 Edition',year:2021,km:'36.000 km',fuel:'Gasolina · 75 CV',price:'12.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Opel_Corsa_D_OPC_front.JPG',portal:'Mobile.de'},
      {model:'Opel Astra 1.5 CDTI',year:2021,km:'41.000 km',fuel:'Diésel · 122 CV',price:'18.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Opel_Corsa_D_1.2_front.JPG',portal:'AutoScout24'},
      {model:'Opel Grandland X Hybrid',year:2022,km:'24.000 km',fuel:'Híbrido · 224 CV',price:'27.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Opel_Corsa_D_OPC_front.JPG',portal:'Mobile.de'},
      {model:'Opel Astra GSe',year:2022,km:'14.000 km',fuel:'Híbrido · 225 CV',price:'28.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Opel_Corsa_D_OPC_front.JPG',portal:'AutoScout24'},
    ]},
  skoda:{as:'https://www.autoscout24.de/lst/skoda?atype=C&cy=D',mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=22400%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'Skoda Fabia 1.0 TSI',year:2021,km:'38.000 km',fuel:'Gasolina · 95 CV',price:'13.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Skoda_Octavia.JPG',portal:'Mobile.de'},
      {model:'Skoda Octavia 2.0 TDI',year:2021,km:'44.000 km',fuel:'Diésel · 150 CV',price:'21.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Skoda_Octavia.JPG',portal:'AutoScout24'},
      {model:'Skoda Kodiaq 2.0 TDI',year:2022,km:'28.000 km',fuel:'Diésel · 200 CV',price:'32.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Skoda_Octavia.JPG',portal:'Mobile.de'},
      {model:'Skoda Octavia RS',year:2022,km:'21.000 km',fuel:'Gasolina · 245 CV',price:'29.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Skoda_Octavia_IV_RS_IMG_4251.jpg',portal:'AutoScout24'},
    ]},
  ford:{as:'https://www.autoscout24.de/lst/ford?atype=C&cy=D',mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=9200%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'Ford Fiesta 1.0 EcoBoost',year:2021,km:'42.000 km',fuel:'Gasolina · 95 CV',price:'12.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Ford_Mustang_GT.JPG',portal:'Mobile.de'},
      {model:'Ford Focus 1.5 EcoBoost',year:2021,km:'35.000 km',fuel:'Gasolina · 150 CV',price:'19.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Ford_Mustang_GT.JPG',portal:'AutoScout24'},
      {model:'Ford Puma ST',year:2022,km:'14.000 km',fuel:'Gasolina · 225 CV',price:'26.800 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Ford_Mustang_GT.JPG',portal:'Mobile.de'},
      {model:'Ford Mustang 5.0 GT',year:2021,km:'22.000 km',fuel:'Gasolina · 450 CV',price:'42.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Ford_MUSTANG_V8_GT_Coupé_Premium_(S197)_front.JPG',portal:'AutoScout24'},
    ]},
  seat:{as:'https://www.autoscout24.de/lst/seat?atype=C&cy=D',mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=21700%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'SEAT Ibiza 1.0 TSI FR',year:2021,km:'39.000 km',fuel:'Gasolina · 110 CV',price:'13.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Seat_Ibiza_6J.JPG',portal:'Mobile.de'},
      {model:'SEAT León 1.5 TSI FR',year:2022,km:'22.000 km',fuel:'Gasolina · 150 CV',price:'21.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/SEAT_Ibiza_CONNECT.JPG',portal:'AutoScout24'},
      {model:'Cupra León e-Hybrid',year:2022,km:'18.000 km',fuel:'Híbrido · 245 CV',price:'34.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Seat_Ibiza_6J.JPG',portal:'Mobile.de'},
      {model:'Cupra Formentor VZ5',year:2022,km:'12.000 km',fuel:'Gasolina · 390 CV',price:'48.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Seat_Ibiza_6J.JPG',portal:'AutoScout24'},
    ]},
  kia:{as:'https://www.autoscout24.de/lst/kia?atype=C&cy=D',mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=12900%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'Kia Picanto 1.0',year:2021,km:'36.000 km',fuel:'Gasolina · 67 CV',price:'10.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Kia_Picanto_front.JPG',portal:'Mobile.de'},
      {model:'Hyundai i20 1.0 T-GDI',year:2022,km:'24.000 km',fuel:'Gasolina · 100 CV',price:'16.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Hyundai_i20_front.JPG',portal:'AutoScout24'},
      {model:'Kia EV6 GT-Line',year:2022,km:'18.000 km',fuel:'Eléctrico · 229 CV',price:'34.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Kia_Picanto_front.JPG',portal:'Mobile.de'},
      {model:'Hyundai i30 N Performance',year:2022,km:'14.000 km',fuel:'Gasolina · 280 CV',price:'28.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Hyundai_i30_1.4_Classic_Steelgrey.JPG',portal:'AutoScout24'},
    ]},
  volvo:{as:'https://www.autoscout24.de/lst/volvo?atype=C&cy=D',mob:'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=24300%3B%3B%3B&sb=rel&vc=Car',
    cars:[
      {model:'Volvo V40 T3 Momentum',year:2020,km:'52.000 km',fuel:'Gasolina · 152 CV',price:'16.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Volvo_V40_Facelift.JPG',portal:'Mobile.de'},
      {model:'Volvo XC40 T4 AWD',year:2021,km:'34.000 km',fuel:'Gasolina · 211 CV',price:'28.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Volvo_V40_Facelift.JPG',portal:'AutoScout24'},
      {model:'Volvo V60 T6 AWD R-Design',year:2021,km:'38.000 km',fuel:'Gasolina · 300 CV',price:'36.900 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/2nd_generation_VOLVO_V40_T4_SE_front.JPG',portal:'Mobile.de'},
      {model:'Volvo XC60 Polestar',year:2021,km:'31.000 km',fuel:'Gasolina · 415 CV',price:'44.500 €',img:'https://commons.wikimedia.org/wiki/Special:FilePath/Volvo_V40_Facelift.JPG',portal:'AutoScout24'},
    ]}
};

function renderCarCard(c, as, mob, fallback){
  const imgSrc = c.img || fallback;
  const q = encodeURIComponent(c.model);
  const asUrl = as + '&q=' + q;
  const mobUrl = mob + '&q=' + q;
  return `
    <div class="car-listing">
      <div class="car-listing-img">
        <img src="${imgSrc}" alt="${c.model}" loading="lazy"
             onerror="this.onerror=null;this.src='${fallback}'">
        <div class="car-listing-badge">${c.year}</div>
        <div class="car-listing-portal">${c.portal}</div>
      </div>
      <div class="car-listing-body">
        <div class="car-listing-model">${c.model}</div>
        <div class="car-listing-meta">
          <span><i class="ti ti-road"></i> ${c.km}</span>
          <span><i class="ti ti-engine"></i> ${c.fuel}</span>
        </div>
        <div class="car-listing-price">${c.price}</div>
        <div class="car-listing-ctas">
          <a href="${asUrl}" target="_blank" rel="noopener noreferrer" class="car-listing-cta"><i class="ti ti-external-link"></i> AutoScout24</a>
          <a href="${mobUrl}" target="_blank" rel="noopener noreferrer" class="car-listing-cta"><i class="ti ti-external-link"></i> Mobile.de</a>
        </div>
      </div>
    </div>`;
}

function setCatalog(brand, el){
  document.querySelectorAll('.brand-main-tab,.brand-sec-tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  const data=catalogData[brand];
  if(!data) return;
  document.getElementById('link-autoscout').href=data.as;
  document.getElementById('link-mobile').href=data.mob;
  const fallback=BF[brand]||BF.bmw;
  const grid=document.getElementById('car-grid');
  grid.innerHTML=shuffle(data.cars).map(c=>renderCarCard(c,data.as,data.mob,fallback)).join('');
}

setCatalog('bmw', document.querySelector('.brand-main-tab'));

// ── Advanced scroll animations ──
(function(){
  'use strict';

  // Helper: assign data-anim + optional delay to an element
  function anim(el, type, delay){
    el.setAttribute('data-anim', type || 'fade-up');
    if(delay) el.setAttribute('data-delay', String(delay));
  }

  // ── Section headings & dividers ──
  document.querySelectorAll('section h2, .about-sec h2').forEach(function(el){
    anim(el, 'fade-up');
  });
  document.querySelectorAll('.gold-line').forEach(function(el){
    anim(el, 'fade-up', 80);
  });
  document.querySelectorAll('.sec-sub').forEach(function(el){
    anim(el, 'fade-up', 150);
  });

  // ── Stats bar — staggered ──
  document.querySelectorAll('.stat').forEach(function(el, i){
    anim(el, 'fade-up', i * 90);
  });

  // ── Process steps — staggered, remove parent .reveal so children animate individually ──
  var stepsWrap = document.querySelector('.steps.reveal');
  if(stepsWrap) stepsWrap.classList.remove('reveal');
  document.querySelectorAll('.step').forEach(function(el, i){
    anim(el, 'fade-up', i * 100);
  });

  // ── Calculator section header ──
  var calcSec = document.querySelector('.calc-sec');
  if(calcSec){
    var calcModes = calcSec.querySelector('.calc-modes');
    if(calcModes) anim(calcModes, 'fade-up', 120);
  }

  // ── About intro paragraphs ──
  document.querySelectorAll('.about-intro p').forEach(function(el, i){
    anim(el, 'fade-up', i * 100);
  });

  // ── About inner blocks — alternating left/right ──
  document.querySelectorAll('.about-inner').forEach(function(block, i){
    var imgWrap = block.querySelector('.about-img-wrap');
    var txt = block.querySelector('.about-text');
    if(imgWrap) anim(imgWrap, i % 2 === 0 ? 'fade-left' : 'fade-right');
    if(txt)     anim(txt,     i % 2 === 0 ? 'fade-right' : 'fade-left', 120);
  });

  // ── About tags ──
  document.querySelectorAll('.about-tag').forEach(function(el, i){
    anim(el, 'fade-up', 60 + i * 60);
  });

  // ── Catalog tabs & portal cards ──
  var brandTabs = document.querySelector('.brand-main-tabs.reveal');
  if(brandTabs) brandTabs.classList.remove('reveal');
  anim(document.querySelector('.brand-main-tabs') || document.createElement('div'), 'fade-up', 80);
  document.querySelectorAll('.cat-card').forEach(function(el, i){
    anim(el, 'fade-up', i * 110);
  });

  // ── Testimonials — staggered, remove parent .reveal ──
  var testGrid = document.querySelector('.test-grid.reveal');
  if(testGrid) testGrid.classList.remove('reveal');
  document.querySelectorAll('.test-card').forEach(function(el, i){
    anim(el, 'fade-up', i * 75);
  });

  // ── Contact cards — staggered, remove parent .reveal ──
  var contactCards = document.querySelector('.contact-cards.reveal');
  if(contactCards) contactCards.classList.remove('reveal');
  document.querySelectorAll('.cc').forEach(function(el, i){
    anim(el, 'fade-up', i * 100);
  });

  // ── Vcall section ──
  var vcall = document.querySelector('.vcall.reveal');
  if(vcall) vcall.classList.remove('reveal');
  var vcallEl = document.getElementById('vcall');
  if(vcallEl) anim(vcallEl, 'fade-up', 60);

  // ── Main observer for [data-anim] elements ──
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      var el = e.target;
      var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      setTimeout(function(){ el.classList.add('anim-in'); }, delay);
      io.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

  document.querySelectorAll('[data-anim]').forEach(function(el){ io.observe(el); });

  // ── Keep legacy .reveal elements working (calc-wrap, brand-main-tabs remaining) ──
  var io2 = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('visible'); io2.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(function(el){ io2.observe(el); });

  // ── Counter animation for stat numbers ──
  function animCounter(el){
    var raw = el.textContent.trim();
    var match = raw.match(/^([+]?)(\d+(?:\.\d+)?)(.*)$/);
    if(!match) return;
    var prefix = match[1], num = parseFloat(match[2]), suffix = match[3];
    var duration = 1100, start = null;
    function tick(ts){
      if(!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(ease * num) + suffix;
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var cio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ animCounter(e.target); cio.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.stat-n').forEach(function(el){ cio.observe(el); });

})();
