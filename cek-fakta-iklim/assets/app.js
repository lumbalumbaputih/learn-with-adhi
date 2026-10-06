const BASE=document.body.dataset.base||"";const PAGE=document.body.dataset.page||"home";const POSTS=INDEX;const POST=window.POST||null;
const artUrl=s=>`${BASE}artikel/${s}.html`;
const UI={
 id:{tagline:"Sains iklim, bahasa sehari-hari",navHome:"Beranda",navGlossary:"Kamus kata sulit",navAbout:"Tentang situs ini",
  h1:"Benar atau tidak? Cek dulu di sini.",
  intro:"Banyak kabar soal cuaca panas, banjir, dan iklim yang beredar di WhatsApp dan media sosial. Di sini kamu bisa cek jawabannya. Tulisannya dari Skeptical Science, situs sains iklim yang ditulis para ilmuwan dan relawan.",
  first:"<b>Baru pertama kali?</b> Mulai dari “Kabar yang sering beredar”. Tulisannya pendek, cukup 2 menit.",
  mt:"<b>Catatan:</b> Isi tulisan diterjemahkan otomatis oleh Google Translate. Kadang ada kata yang kurang pas. Kamu selalu bisa membaca tulisan aslinya (Bahasa Inggris).",
  searchL:"Cari kabar atau topik",searchPh:"Contoh: chemtrail, banjir, mobil listrik",searchBtn:"Cari",
  found:(n,q)=>`${n} tulisan cocok dengan “${q}”`,notFound:q=>`Belum ada tulisan tentang “${q}”. Coba kata lain, atau pilih topik di bawah.`,clear:"Hapus pencarian",
  quickH:"Kabar yang sering beredar",quickSub:"Bacaan singkat",
  newsH:"Berita dan penjelasan",newsSub:"Bacaan panjang",
  all:"Semua",wrong:"SALAH",rumor:"Kabar yang beredar",fact:"Faktanya",read:m=>`${m} menit`,short:"Bacaan singkat",long:"Bacaan panjang",
  none:"Belum ada tulisan untuk topik ini.",back:"Kembali",moreQ:n=>`Lihat semua kabar (${n})`,moreN:n=>`Lihat semua berita (${n})`,count:n=>`${n} tulisan`,
  mtArt:"<b>Terjemahan otomatis (Google Translate).</b> Mungkin ada kata yang kurang pas. Kotak berwarna biru ditulis dengan bantuan AI dalam bahasa sederhana dan belum diperiksa ahli.",
  showEn:"Baca versi asli (English)",showId:"Baca versi Indonesia",
  bigger:"Huruf lebih besar",listen:"Dengarkan",stop:"Berhenti",
  noVoice:"HP atau browser ini belum punya suara Bahasa Indonesia. Coba buka di Google Chrome di HP Android.",
  intinya:"Intinya",
  local:"Apa artinya untuk Indonesia?",localSrc:"Sumber",
  origQ:"Pertanyaan asli dari Gigafact",origA:v=>`Jawaban aslinya: ${v==="Yes"?"Ya":"Tidak"}.`,
  sources:"Sumber (Bahasa Inggris)",
  old:(d)=>`Tulisan ini terbit ${d}. Beberapa angka di dalamnya mungkin sudah berubah.`,
  origin:"Tulisan asli",originTxt:(t,d,b)=>`Tulisan ini aslinya berjudul <b>“${t}”</b>, terbit ${d} di Skeptical Science oleh ${b}.`,
  openOrig:"Buka di Skeptical Science ↗",by:"oleh",guest:"penulis tamu",
  shareH:"Bagikan ke keluarga dan teman",copy:"Salin pesan",copied:"Pesan sudah disalin. Tempel di WhatsApp.",copyFail:"Tidak bisa menyalin otomatis. Tekan lama pada pesan di atas, lalu pilih Salin.",
  wa:"Kirim lewat WhatsApp",shareNote:"Pesan ini memakai ringkasan yang ditulis dengan bantuan AI. Tulisan lengkapnya ada di tautan.",
  shareFb:(c,f,u)=>`Kabar: “${c}”\nIni SALAH.\nFaktanya: ${f}\nBaca selengkapnya: ${u}`,
  shareNews:(t,i,u)=>`${t}\nIntinya: ${i}\nBaca: ${u}`,
  zoom:"Ketuk gambar untuk memperbesar. Tulisan di dalam gambar berbahasa Inggris.",close:"Tutup",themeToDark:"Ganti ke mode gelap",themeToLight:"Ganti ke mode terang",mvpEyebrow:"Prototipe (MVP)",mvpTitle:"Apa itu Cek Fakta Iklim?",mvpLede:"Cek Fakta Iklim adalah situs prototipe yang membawa tulisan sains iklim dari Skeptical Science ke Bahasa Indonesia yang sederhana. Banyak kabar soal iklim beredar lewat WhatsApp. Situs ini membantu orang mengecek kabar itu sebelum membagikannya.",mvp1h:"Dari Skeptical Science",mvp1t:"87 tulisan: 76 fakta singkat dan 11 tulisan asli. Diterjemahkan oleh Google Translate dan diberi label.",mvp2h:"Dibuat untuk WhatsApp",mvp2t:"Tombol bagikan sekali ketuk, kamus kata sulit, dan fitur Dengarkan untuk pembaca yang belum terbiasa dengan bahasa sains.",mvp3h:"Rencana berikutnya",mvp3t:"Dengan relawan: editor menerjemahkan dengan benar, menambah konteks Indonesia, dan membuat konten media sosial yang ringan. Ini baru rencana, belum dibuat.",mvpFine:"Ini prototipe, bukan situs resmi Skeptical Science.",mvpCta:"Lihat situsnya",mvpWhyH:"Kenapa harus Bahasa Indonesia yang sederhana?",mvpWhyQ:"Kalau hoaks lebih gampang dibaca daripada faktanya, hoaks yang menang.",mvpWhy1:"Hoaks itu pendek dan menyebar lewat WhatsApp dalam hitungan detik. Penjelasan sains biasanya panjang, penuh istilah, dan berbahasa Inggris.",mvpWhy2:"Tidak semua orang sempat belajar sains dengan baik di sekolah. Artikel yang sulit gampang ditinggalkan di tengah jalan.",mvpWhy3:"Karena itu fakta harus semudah hoaks untuk dibaca, tanpa kehilangan isinya.",
  glH:"Kamus kata sulit",glLede:"Kata-kata ini sering muncul di tulisan tentang iklim. Di dalam artikel, kata yang bergaris titik-titik bisa kamu ketuk untuk melihat artinya.",
  footer:"Tulisan berasal dari Skeptical Science dan diterjemahkan otomatis oleh Google Translate. Bukan situs resmi Skeptical Science. Hak cipta tetap milik penulis aslinya."},
 en:{tagline:"Climate science in everyday words",navHome:"Home",navGlossary:"Word list",navAbout:"About this site",
  h1:"True or not? Check here first.",
  intro:"Lots of messages about heat, floods and climate get shared on WhatsApp and social media. Here you can check the answer. The articles come from Skeptical Science, a climate science site written by scientists and volunteers.",
  first:"<b>First time here?</b> Start with “Claims going around”. They are short, about 2 minutes each.",
  mt:"<b>Note:</b> In Indonesian mode, articles are translated automatically by Google Translate. You are now reading the original English.",
  searchL:"Search claims or topics",searchPh:"For example: chemtrail, flood, electric car",searchBtn:"Search",
  found:(n,q)=>`${n} articles match “${q}”`,notFound:q=>`No articles about “${q}” yet. Try another word, or pick a topic below.`,clear:"Clear search",
  quickH:"Claims going around",quickSub:"Short reads",
  newsH:"News and explainers",newsSub:"Long reads",
  all:"All",wrong:"FALSE",rumor:"The claim",fact:"The facts",read:m=>`${m} min`,short:"Short read",long:"Long read",
  none:"No articles for this topic yet.",back:"Back",moreQ:n=>`Show all claims (${n})`,moreN:n=>`Show all articles (${n})`,count:n=>`${n} articles`,
  mtArt:"<b>Original English text</b> from Skeptical Science. Blue boxes were written with AI help in plain words and have not been checked by an expert.",
  showEn:"Read the original (English)",showId:"Read in Indonesian",
  bigger:"Bigger text",listen:"Listen",stop:"Stop",
  noVoice:"This phone or browser has no English voice installed.",
  intinya:"In short",
  local:"What does it mean for Indonesia?",localSrc:"Source",
  origQ:"Original Gigafact question",origA:v=>`Original answer: ${v}.`,
  sources:"Sources",
  old:(d)=>`Published ${d}. Some numbers may have changed since.`,
  origin:"Original article",originTxt:(t,d,b)=>`Originally published as <b>“${t}”</b> on ${d} at Skeptical Science by ${b}.`,
  openOrig:"Open on Skeptical Science ↗",by:"by",guest:"guest author",
  shareH:"Share with family and friends",copy:"Copy message",copied:"Message copied. Paste it into WhatsApp.",copyFail:"Couldn't copy automatically. Press and hold the message above, then choose Copy.",
  wa:"Send on WhatsApp",shareNote:"This message uses a summary written with AI help. The full article is at the link.",
  shareFb:(c,f,u)=>`Claim: “${c}”\nThis is FALSE.\nThe facts: ${f}\nRead more: ${u}`,
  shareNews:(t,i,u)=>`${t}\nIn short: ${i}\nRead: ${u}`,
  zoom:"Tap an image to enlarge it.",close:"Close",themeToDark:"Switch to dark mode",themeToLight:"Switch to light mode",mvpEyebrow:"Prototype (MVP)",mvpTitle:"What is Cek Fakta Iklim?",mvpLede:"Cek Fakta Iklim is a prototype website that brings climate science articles from Skeptical Science into plain Indonesian. Many climate claims spread through WhatsApp. This site helps people check a claim before they share it.",mvp1h:"From Skeptical Science",mvp1t:"87 articles: 76 fact briefs and 11 originals. Translated by Google Translate and clearly labelled.",mvp2h:"Made for WhatsApp",mvp2t:"A one-tap share button, a glossary of hard words, and a Listen feature for readers who are not used to science language.",mvp3h:"Next steps",mvp3t:"With volunteers: an editor to translate properly, Indonesian context added, and light social media content. This is a plan only, not built yet.",mvpFine:"This is a prototype, not an official Skeptical Science site.",mvpCta:"See the site",mvpWhyH:"Why plain Indonesian?",mvpWhyQ:"If a hoax is easier to read than the facts, the hoax wins.",mvpWhy1:"A hoax is short and travels through WhatsApp in seconds. Science explanations are usually long, full of technical words, and in English.",mvpWhy2:"Not everyone has had the chance to study science well at school. A hard article is easy to give up on halfway.",mvpWhy3:"So the facts have to be as easy to read as the hoax, without losing what they say.",
  glH:"Word list",glLede:"These words come up a lot in climate articles. Inside an article, tap a word with a dotted underline to see what it means.",
  footer:"Articles come from Skeptical Science, machine-translated into Indonesian by Google Translate. Not an official Skeptical Science site. Copyright stays with the original authors."}
};
const TOPICS={id:{warm:"Bumi makin panas?",cause:"Siapa penyebabnya?",elnino:"El Niño",disaster:"Bencana dan kesehatan",ocean:"Laut dan es",energy:"Energi",hoax:"Hoaks"},
              en:{warm:"Is Earth warming?",cause:"What's causing it?",elnino:"El Niño",disaster:"Disasters and health",ocean:"Oceans and ice",energy:"Energy",hoax:"Hoaxes"}};
const MONTHS_ID=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTHS_EN=["January","February","March","April","May","June","July","August","September","October","November","December"];
let lang="id",topic="all",big=false,moreQ=false,moreN=false,query="",homeScroll=0,cameFromHome=false;
try{lang=localStorage.getItem("cfi-lang")||"id";big=localStorage.getItem("cfi-big")==="1"}catch(e){}
const T=k=>UI[lang][k];
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const strip=s=>String(s).replace(/<[^>]+>/g,"");
function fmtDate(d){if(lang==="en")return d;const[a,m,y]=d.split(" ");return `${a} ${MONTHS_ID[MONTHS_EN.indexOf(m)]} ${y}`}
function toDate(d){const[a,m,y]=d.split(" ");return new Date(+y,MONTHS_EN.indexOf(m),+a)}
function mins(p){return Math.max(2,Math.round(p.words/150))}
function isShort(p){return p.words<600}
function tx(o){return o?(lang==="id"?o.id:o.en):""}
function byline(p){return p.byline==="Guest Author"?T("guest"):p.byline.replace(", Guest Author","")}
function badge(cls=""){return `<span class="stamp no ${cls}">${T("wrong")}</span>`}
function firstImg(p){return p.thumb?BASE+p.thumb:null}
function teaser(p){return p.intinya?tx(p.intinya):""}
const icon={
 swap:'<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
 big:'<path d="M3 19l5-14 5 14M5 14h6M15 19l3.5-9 3.5 9M16.2 16h4.6"/>',
 speak:'<path d="M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16.5v.5"/>',
 lang:'<path d="M4 5h9M8.5 3v2M6 5c.5 3 3 6 6 7M11 5c-.5 3-3 6-6 7M13 20l4-9 4 9M14.5 17h5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 pin:'<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon[k]}</svg>`;
const darkMQ=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null;
function isDark(){const t=document.documentElement.getAttribute("data-theme");return t?t==="dark":!!(darkMQ&&darkMQ.matches)}
function setThemeUI(){
  const b=$("#theme");if(b){const s=isDark()?T("themeToLight"):T("themeToDark");b.setAttribute("aria-label",s);b.title=s}
  const m=document.querySelector('meta[name="theme-color"]');if(m){const g=getComputedStyle(document.documentElement).getPropertyValue("--ground").trim();if(g)m.content=g}
}
if(darkMQ&&darkMQ.addEventListener)darkMQ.addEventListener("change",setThemeUI);
function setChrome(){
  document.documentElement.lang=lang;
  setThemeUI();
  document.querySelectorAll("[data-i]").forEach(el=>el.textContent=T(el.dataset.i));
  document.querySelectorAll(".lang button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.lang===lang));
  document.body.style.setProperty("--fs",big?"1.3rem":"1.125rem");
}
/* search */
const norm=s=>String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[₂]/g,"2").replace(/[^a-z0-9 ]+/g," ");
function haystack(p){return norm([p.title.id,p.title.en,p.claim&&p.claim.id,p.claim&&p.claim.en,p.fakta&&p.fakta.id,p.intinya&&p.intinya.id,p.intinya&&p.intinya.en,p.question&&p.question.id,p.question&&p.question.en,TOPICS.id[p.topic],TOPICS.en[p.topic],p.kw].join(" "))}
function search(q){
  const toks=norm(q).split(" ").filter(t=>t.length>1);if(!toks.length)return POSTS;
  const scored=POSTS.map(p=>{const h=" "+haystack(p);let s=0,w=0;for(const t of toks){if(h.includes(" "+t)){s+=2;w++}else if(h.includes(t))s+=1}return{p,s,w,all:w===toks.length}});
  const strict=scored.filter(x=>x.all),some=scored.filter(x=>x.w>0),loose=scored.filter(x=>x.s>0);
  return (strict.length?strict:some.length?some:loose).sort((a,b)=>b.s-a.s).map(x=>x.p);
}
function qCard(p){return `<a class="q" href="${artUrl(p.slug)}">${badge()}<div><span class="lbl">${T("rumor")}</span><h3>“${esc(tx(p.claim))}”</h3><p class="fk"><b>${T("fact")}:</b> ${esc(tx(p.fakta))}</p><div class="meta">${T("short")} · ${T("read")(mins(p))} · ${TOPICS[lang][p.topic]}</div></div></a>`}
function nCard(p){const im=firstImg(p);return `<a class="n ${im?"":"noimg"}" href="${artUrl(p.slug)}"><div><span class="tag">${TOPICS[lang][p.topic]}</span><h3>${esc(tx(p.title))}</h3><p>${esc(teaser(p))}</p><p class="meta">${T("long")} · ${T("read")(mins(p))} · ${fmtDate(p.date)}</p></div>${im?`<img src="${im}" alt="" loading="lazy">`:""}</a>`}
function home(){
  const cnt=k=>POSTS.filter(p=>k==="all"||p.topic===k).length;
  const tb=["all",...Object.keys(TOPICS.id)].map(k=>`<button id="topic-${k}" data-topic="${k}" aria-pressed="${topic===k&&!query}">${k==="all"?T("all"):TOPICS[lang][k]} <span class="c">${cnt(k)}</span></button>`).join("");
  const form=`<form class="search" id="search-form" role="search"><label for="q" class="sr">${T("searchL")}</label><span class="si">${svg("search")}</span><input id="q" type="search" autocomplete="off" placeholder="${T("searchPh")}" value="${esc(query)}"><button type="submit">${T("searchBtn")}</button></form>`;
  let lists;
  if(query){
    const r=search(query);
    lists=`<div class="found" role="status">${r.length?T("found")(r.length,esc(query)):T("notFound")(esc(query))} · <button class="linkbtn" id="clear-q" type="button">${T("clear")}</button></div>
      <div class="qlist">${r.filter(p=>p.fb).map(qCard).join("")}</div><div class="news">${r.filter(p=>!p.fb).map(nCard).join("")}</div>`;
  } else {
    const qAll=POSTS.filter(p=>p.fb&&(topic==="all"||p.topic===topic)),nAll=POSTS.filter(p=>!p.fb&&(topic==="all"||p.topic===topic));
    const lim=topic==="all",qs=lim&&!moreQ?qAll.slice(0,6):qAll,ns=lim&&!moreN?nAll.slice(0,6):nAll;
    lists=`<div class="section-h"><h2>${T("quickH")}</h2><span>${T("quickSub")} · ${T("count")(qAll.length)}</span></div>
   <div class="qlist">${qs.map(qCard).join("")||`<p class="empty">${T("none")}</p>`}</div>
   ${qs.length<qAll.length?`<button class="more" id="more-q" type="button">${T("moreQ")(qAll.length)}</button>`:""}
   <div class="section-h"><h2>${T("newsH")}</h2><span>${T("newsSub")} · ${T("count")(nAll.length)}</span></div>
   <div class="news">${ns.map(nCard).join("")||`<p class="empty">${T("none")}</p>`}</div>
   ${ns.length<nAll.length?`<button class="more" id="more-n" type="button">${T("moreN")(nAll.length)}</button>`:""}`;
  }
  return `<section class="intro"><h1>${T("h1")}</h1><p>${T("intro")}</p>${form}
   <div class="mtnote">${svg("info")}<div>${T("mt")}</div></div>
   <p class="first">${T("first")}</p></section>
   <div class="topics" role="group" aria-label="Topik">${tb}</div>${lists}`;
}
function block(b){
  if(b.t==="img")return `<figure><button class="zoom" type="button" aria-label="${esc(T("zoom"))}"><img src="${BASE}${b.src}" width="${b.w}" height="${b.hh}" alt="${esc(b.alt||"")}" loading="lazy"></button></figure>`;
  if(b.t==="hr")return "<hr>";
  if(b.t==="ul"||b.t==="ol")return `<${b.t}>${b.items.map(i=>`<li>${tx(i)}</li>`).join("")}</${b.t}>`;
  if(b.t==="h2"||b.t==="h3")return `<h2>${tx(b.h)}</h2>`;
  if(b.t==="blockquote")return `<blockquote>${tx(b.h)}</blockquote>`;
  const cls={credit:"credit",note:"note",caption:"caption"}[b.t]||"";
  return `<p class="${cls}">${tx(b.h)}</p>`;
}
function shareText(p){const u=location.href.split("#")[0];return p.fb?T("shareFb")(tx(p.claim),tx(p.fakta),u):T("shareNews")(tx(p.title),tx(p.intinya).split(". ")[0].replace(/\.$/,"")+".",u)}
function article(p){
  const age=(Date.now()-toDate(p.date))/864e5;
  let top="";
  if(p.fb){
    top+=`<div class="verdict">${badge("big")}<div><span class="lbl">${T("fact")}</span><p>${esc(tx(p.fakta))}</p></div></div>
      <div class="origq"><span class="lbl">${T("origQ")}</span> ${esc(tx(p.question))} ${T("origA")(p.verdict)}</div>`;
  }
  if(p.intinya) top+=`<div class="ours"><span class="lbl">${T("intinya")}</span><p>${esc(tx(p.intinya))}</p></div>`;
  let blocks=p.blocks;
  let body=`<div class="body" id="body">${blocks.some(b=>b.t==="img")?`<p class="zoomnote">${T("zoom")}</p>`:""}${blocks.map(block).join("")}</div>`;
  if(p.local) body+=`<div class="ours local"><span class="lbl">${svg("pin")} ${T("local")}</span><p>${esc(tx(p.local))}</p><small>${T("localSrc")}: ${p.local.src.map(s=>`<a href="${s.u}">${esc(s.t)}</a>`).join("; ")}.</small></div>`;
  if(p.sources&&p.sources.length) body+=`<div class="sources"><h2>${T("sources")}</h2><ul>${p.sources.map(s=>`<li>${s.en}</li>`).join("")}</ul></div>`;
  const st=shareText(p);
  body+=`<div class="share"><h2>${T("shareH")}</h2><pre id="share-text">${esc(st)}</pre>
    <div class="share-btns"><button type="button" id="copy">${T("copy")}</button><a class="wa" href="https://wa.me/?text=${encodeURIComponent(st)}">${T("wa")}</a></div>
    <p class="copymsg" id="copymsg" role="status"></p><p class="note">${T("shareNote")}</p></div>`;
  body+=`<div class="origin"><b>${T("origin")}</b><p>${T("originTxt")(esc(p.title.en),fmtDate(p.date),esc(p.byline.replace(", Guest Author","")))}</p><a href="${p.url}">${T("openOrig")}</a></div>`;
  return `<a class="back" href="${BASE}index.html" id="back">← ${T("back")}</a>
   <header class="art-h"><span class="tag">${TOPICS[lang][p.topic]} · ${isShort(p)?T("short"):T("long")}</span>
   ${p.fb?`<span class="lbl rumor">${T("rumor")}</span>`:""}
   <h1 id="art-title">${esc(p.fb?"“"+tx(p.claim)+"”":tx(p.title))}</h1>
   <div class="byline">${fmtDate(p.date)} · ${T("by")} ${esc(byline(p))} · ${T("read")(mins(p))}</div>
   ${age>270?`<p class="old">${svg("clock")}<span>${T("old")(fmtDate(p.date))}</span></p>`:""}
   <div class="mtnote">${svg("lang")}<div>${T("mtArt")}</div></div>
   <div class="tools">
     <button id="swap" type="button">${svg("swap")}${lang==="id"?T("showEn"):T("showId")}</button>
     <button id="bigger" type="button" aria-pressed="${big}">${svg("big")}${T("bigger")}</button>
     <button id="speak" type="button" aria-pressed="false">${svg("speak")}<span>${T("listen")}</span></button>
   </div><p class="speakmsg" id="speakmsg" hidden></p></header>${top}${body}`;
}
function glossary(){
  const g=[...GLOSS].sort((a,b)=>(lang==="id"?a.id:a.en).localeCompare(lang==="id"?b.id:b.en));
  return `<div class="page"><h1>${T("glH")}</h1><p class="lede">${T("glLede")}</p>
  <dl class="gl">${g.map(g=>`<div id="k-${g.key}"><dt>${esc(lang==="id"?g.id:g.en)}</dt><dd>${esc(lang==="id"?g.defId:g.defEn)}</dd></div>`).join("")}</dl></div>`;
}
function about(){
  const n=POSTS.length;
  if(lang==="en") return `<div class="page"><h1>About this site</h1>
  <p class="lede">Cek Fakta Iklim is a prototype. It tests one idea: can climate science reach more Indonesians if the site is simple and the articles are in Indonesian?</p>
  <h2>Where do the articles come from?</h2><p>All ${n} articles come from <a href="https://skepticalscience.com">Skeptical Science</a>, where scientists and volunteers explain climate science and answer false claims. We did not change the articles. We chose them and tidied up how they look. Copyright stays with the original authors.</p>
  <h2>Who translated them?</h2><p>A machine: Google Translate. No person has checked the Indonesian text. If a sentence sounds strange, tap “Read the original (English)”.</p>
  <h2>Is this an official Skeptical Science site?</h2><p>No. This is an independent project. Skeptical Science and the original authors have not reviewed or endorsed it.</p></div>`;
  return `<div class="page"><h1>Tentang situs ini</h1>
  <p class="lede">Cek Fakta Iklim adalah prototipe (contoh awal). Tujuannya menguji satu ide: apakah sains iklim bisa sampai ke lebih banyak orang Indonesia kalau situsnya sederhana dan tulisannya dalam Bahasa Indonesia?</p>
  <h2>Tulisannya dari mana?</h2><p>Semua ${n} tulisan berasal dari <a href="https://skepticalscience.com">Skeptical Science</a>. Di sana, para ilmuwan dan relawan menjelaskan sains iklim dan menjawab kabar yang salah. Kami tidak mengubah isi tulisannya. Kami hanya memilih dan merapikan tampilannya. Hak cipta tulisan tetap milik penulis aslinya.</p>
  <h2>Siapa yang menerjemahkan?</h2><p>Mesin, yaitu Google Translate. Belum ada orang yang memeriksa terjemahannya. Kalau ada kalimat yang terasa aneh, ketuk “Baca versi asli (English)”.</p>
  <h2>Apakah ini situs resmi Skeptical Science?</h2><p>Bukan. Ini proyek mandiri. Skeptical Science dan penulis aslinya tidak memeriksa atau mendukung situs ini.</p></div>`;
}
/* glossary: first match per term per paragraph */
let TERMS=null;
function termList(){return GLOSS.flatMap(g=>(lang==="id"?g.matchId:g.matchEn).map(m=>({g,re:new RegExp("(^|[^\\p{L}\\p{N}])("+m.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")(?![\\p{L}])",lang==="id"?"iu":"u"),len:m.length}))).sort((a,b)=>b.len-a.len)}
function markTerms(root){
  const terms=termList();
  root.querySelectorAll("p,li,blockquote").forEach(par=>{
    if(par.closest(".credit,.note,.sources,.share,.origin,.zoomnote,.ours small"))return;
    const done=new Set();
    const walker=document.createTreeWalker(par,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest("a,button")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(let node of nodes){
      let guard=0;
      while(node&&guard++<20){
        let best=null;
        for(const t of terms){if(done.has(t.g.key))continue;const h=t.re.exec(node.nodeValue);if(h&&(!best||h.index<best.h.index))best={t,h}}
        if(!best)break;
        done.add(best.t.g.key);
        const start=best.h.index+best.h[1].length,len=best.h[2].length;
        const mid=node.splitText(start);const rest=mid.splitText(len);
        const btn=document.createElement("button");btn.type="button";btn.className="term";btn.dataset.key=best.t.g.key;btn.textContent=mid.nodeValue;
        mid.replaceWith(btn);node=rest;
      }
    }
  });
}
function showTip(key){
  const g=GLOSS.find(x=>x.key===key);const tip=$("#tip");
  tip.innerHTML=`<b>${esc(lang==="id"?g.id:g.en)}</b>${esc(lang==="id"?g.defId:g.defEn)}<button type="button" aria-label="${T("close")}" id="tip-close">×</button>`;
  tip.hidden=false;
}
/* speech: chunked queue so long articles don't cut off on Android */
let speaking=false;
function voicesReady(){return new Promise(r=>{const v=speechSynthesis.getVoices();if(v.length)return r(v);let done=false;speechSynthesis.onvoiceschanged=()=>{if(!done){done=true;r(speechSynthesis.getVoices())}};setTimeout(()=>{if(!done){done=true;r(speechSynthesis.getVoices())}},1500)})}
function chunks(text){const out=[];for(const s of text.replace(/\s+/g," ").split(/(?<=[.!?])\s+/)){if(!s.trim())continue;if(out.length&&(out[out.length-1]+" "+s).length<220)out[out.length-1]+=" "+s;else out.push(s)}return out}
function stopSpeak(){try{speechSynthesis.cancel()}catch(e){}speaking=false;const b=$("#speak");if(b){b.setAttribute("aria-pressed","false");b.querySelector("span").textContent=T("listen")}}
async function speak(){
  const btn=$("#speak"),msg=$("#speakmsg");
  if(!("speechSynthesis" in window)){msg.textContent=T("noVoice");msg.hidden=false;return}
  if(speaking){stopSpeak();return}
  const voices=await voicesReady();const code=lang==="id"?"id":"en";
  const v=voices.find(v=>v.lang.toLowerCase().replace("_","-").startsWith(code));
  if(voices.length&&!v){msg.textContent=T("noVoice");msg.hidden=false;return}
  const parts=[$("#art-title").textContent,...[...document.querySelectorAll(".verdict p,.ours>p,#body p:not(.zoomnote),#body li,#body h2,.local p")].map(e=>e.textContent)];
  const queue=chunks(parts.join(". ").replace(/\.\s*\./g,"."));
  speaking=true;btn.setAttribute("aria-pressed","true");btn.querySelector("span").textContent=T("stop");
  let i=0;const next=()=>{if(!speaking||i>=queue.length){stopSpeak();return}const u=new SpeechSynthesisUtterance(queue[i++]);u.lang=lang==="id"?"id-ID":"en-US";if(v)u.voice=v;u.rate=.9;u.onend=next;u.onerror=next;speechSynthesis.speak(u)};
  next();
}
/* image zoom */
function openZoom(src){const z=$("#zoom");z.querySelector("img").src=src;z.hidden=false;z.querySelector("button").focus()}
function saveHome(){try{sessionStorage.setItem("cfi-home",JSON.stringify({topic,query,moreQ,moreN}))}catch(_){}}
function loadHome(){try{const s=JSON.parse(sessionStorage.getItem("cfi-home")||"{}");topic=s.topic||"all";query=s.query||"";moreQ=!!s.moreQ;moreN=!!s.moreN}catch(_){}}
function render(){
  stopSpeak();$("#tip").hidden=true;
  setChrome();
  const route=PAGE==="article"?"article":PAGE;
  document.querySelectorAll(".nav a").forEach(a=>{if(a.dataset.route===(route==="article"?"":route==="home"?"beranda":route))a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
  const app=$("#app");
  app.innerHTML=(route==="article"?article(POST):route==="kamus"?glossary():route==="tentang"?about():home())+`<footer>${T("footer")}</footer>`;
  app.querySelectorAll(".body a,.sources a,.origin a,.page a,.local a,.wa").forEach(a=>{a.target="_blank";a.rel="noopener"});
  if(route==="article"){markTerms(app)}
  if(route==="home")saveHome();
  document.title=route==="article"?`${$("#art-title").textContent} · Cek Fakta Iklim`:route==="kamus"?`${T("glH")} · Cek Fakta Iklim`:route==="tentang"?`${T("navAbout")} · Cek Fakta Iklim`:"Cek Fakta Iklim";
}
document.addEventListener("click",e=>{
  if(e.target.closest("#theme")){const n=isDark()?"light":"dark";document.documentElement.setAttribute("data-theme",n);try{localStorage.setItem("cfi-theme",n)}catch(_){}setThemeUI();return}
  const l=e.target.closest("[data-lang]");if(l){lang=l.dataset.lang;try{localStorage.setItem("cfi-lang",lang)}catch(_){}render();return}
  const t=e.target.closest("[data-topic]");if(t){topic=t.dataset.topic;query="";render();return}
  if(e.target.closest("#back")&&document.referrer&&history.length>1){e.preventDefault();history.back();return}
  if(e.target.closest("#swap")){lang=lang==="id"?"en":"id";try{localStorage.setItem("cfi-lang",lang)}catch(_){}render();return}
  if(e.target.closest("#bigger")){big=!big;try{localStorage.setItem("cfi-big",big?"1":"0")}catch(_){}render();return}
  if(e.target.closest("#speak")){speak();return}
  if(e.target.closest("#more-q")){moreQ=true;render();return}
  if(e.target.closest("#more-n")){moreN=true;render();return}
  if(e.target.closest("#clear-q")){query="";render();return}
  if(e.target.closest("#copy")){
    const txt=$("#share-text").textContent,msg=$("#copymsg");
    const fail=()=>{msg.textContent=T("copyFail");const r=document.createRange();r.selectNodeContents($("#share-text"));const s=getSelection();s.removeAllRanges();s.addRange(r)};
    try{navigator.clipboard.writeText(txt).then(()=>{msg.textContent=T("copied")},fail)}catch(_){fail()}
    return}
  const z=e.target.closest(".zoom");if(z){openZoom(z.querySelector("img").src);return}
  if(e.target.closest("#zoom-close")||e.target.id==="zoom"){$("#zoom").hidden=true;return}
  const term=e.target.closest(".term");if(term){showTip(term.dataset.key);return}
  if(e.target.closest("#tip-close")){$("#tip").hidden=true}
});
document.addEventListener("submit",e=>{if(e.target.id==="search-form"){e.preventDefault();query=$("#q").value.trim();topic="all";render();const f=$(".found");if(f)f.scrollIntoView({block:"start"})}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){$("#tip").hidden=true;$("#zoom").hidden=true}});
if(PAGE==="home")loadHome();
render();
