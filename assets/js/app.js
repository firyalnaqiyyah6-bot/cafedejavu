// State
const $ = (q, ctx=document)=>ctx.querySelector(q);
const $$ = (q, ctx=document)=>Array.from(ctx.querySelectorAll(q));

const CART_KEY = "dejavu_cart_v1";
const TESTI_KEY = "dejavu_testi_v1";

const money = n => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', maximumFractionDigits:0}).format(n);

const cart = {
  items: [],
  load(){
    try{ this.items = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch{ this.items = []; }
    renderCart();
  },
  persist(){ localStorage.setItem(CART_KEY, JSON.stringify(this.items)); updateCartCount(); },
  add(item){
    const idx = this.items.findIndex(i=>i.id===item.id);
    if(idx>-1){ this.items[idx].qty += 1; }
    else{ this.items.push({...item, qty:1}); }
    this.persist(); toast(`Ditambahkan: ${item.name}`);
  },
  remove(id){
    this.items = this.items.filter(i=>i.id!==id);
    this.persist();
  },
  inc(id){ const it=this.items.find(i=>i.id===id); if(it){ it.qty++; this.persist(); }},
  dec(id){ const it=this.items.find(i=>i.id===id); if(it){ it.qty=Math.max(1, it.qty-1); this.persist(); }},
  total(){ return this.items.reduce((s,i)=>s + i.price*i.qty, 0); },
  clear(){ this.items = []; this.persist(); }
};

function updateCartCount(){
  $("#cartCount").textContent = cart.items.reduce((s,i)=>s+i.qty,0);
}

function renderCart(){
  const wrap = $("#cartItems");
  wrap.innerHTML = "";
  cart.items.forEach(it=>{
    const el = document.createElement("div");
    el.className = "cart-item";
    const imgSrc = mapIdToImg(it.id);
    el.innerHTML = `
      <img src="${imgSrc}" alt="${it.name}">
      <div>
        <div style="font-weight:700">${it.name}</div>
        <div class="muted">${money(it.price)}</div>
      </div>
      <div class="qty">
        <button aria-label="Kurangi" data-dec="${it.id}">–</button>
        <span>${it.qty}</span>
        <button aria-label="Tambah" data-inc="${it.id}">+</button>
      </div>
      <button class="icon-btn" aria-label="Hapus" data-del="${it.id}">🗑</button>
    `;
    wrap.appendChild(el);
  });
  $("#cartTotal").textContent = money(cart.total());
  updateCartCount();
}

function mapIdToImg(id){
  if(id.includes("coffee")) return "assets/img/coffee.svg";
  if(id.includes("croissant")) return "assets/img/croissant.svg";
  if(id.includes("donut")) return "assets/img/donut.svg";
  if(id.includes("muffin")) return "assets/img/muffin.svg";
  return "assets/img/cake.svg";
}

// Slider
function initSlider(){
  const slider = $("[data-slider]");
  if(!slider) return;
  const track = $("[data-track]", slider);
  const prev = $("[data-prev]", slider);
  const next = $("[data-next]", slider);
  let idx = 0;
  const step = () => {
    const card = track.children[0];
    const w = card.offsetWidth + parseInt(getComputedStyle(track).gap || 0);
    track.scrollTo({left: idx*w, behavior:"smooth"});
  };
  prev.addEventListener("click", ()=>{ idx = Math.max(0, idx-1); step(); });
  next.addEventListener("click", ()=>{ idx = Math.min(track.children.length-1, idx+1); step(); });
  // drag/scroll snapping works natively; also auto-advance
  setInterval(()=>{ idx = (idx+1) % track.children.length; step(); }, 6000);
}

// Add to cart (both in slider and menu)
function bindAddToCart(){
  $$(".add-cart").forEach(btn=>{
    btn.addEventListener("click", e=>{
      const btn = e.currentTarget;
      const data = btn.dataset.product ? JSON.parse(btn.dataset.product) : JSON.parse(btn.closest("[data-product]").dataset.product);
      cart.add(data);
      renderCart();
    });
  });
}

// Drawer
function openCart(){ $("#cartDrawer").setAttribute("aria-hidden","false"); }
function closeCart(){ $("#cartDrawer").setAttribute("aria-hidden","true"); }
$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#cartDrawer").addEventListener("click", e=>{ if(e.target.id==="cartDrawer") closeCart(); });

// Cart item buttons (event delegation)
$("#cartItems").addEventListener("click", e=>{
  const inc = e.target.closest("[data-inc]"); if(inc){ cart.inc(inc.dataset.inc); renderCart(); return; }
  const dec = e.target.closest("[data-dec]"); if(dec){ cart.dec(dec.dataset.dec); renderCart(); return; }
  const del = e.target.closest("[data-del]"); if(del){ cart.remove(del.dataset.del); renderCart(); return; }
});

// Checkout (simulate)
$("#checkoutBtn").addEventListener("click", ()=>{
  if(cart.items.length===0){ toast("Keranjang masih kosong"); return; }
  const payload = { items: cart.items, total: cart.total(), at: new Date().toISOString() };
  console.log("Checkout payload (simulasi):", payload);
  alert("Terima kasih! Pesanan kamu diproses (simulasi). Total: " + money(cart.total()));
  cart.clear(); renderCart(); closeCart();
});

// Intersection Observer reveal
function initReveal(){
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("revealed"); io.unobserve(e.target);} });
  }, {threshold:.12});
  $$(".reveal, .menu-card").forEach(el=>io.observe(el));
}

// Testimoni
const testi = {
  list: [],
  load(){
    try{ this.list = JSON.parse(localStorage.getItem(TESTI_KEY) || "[]"); }
    catch{ this.list = []; }
    renderTesti();
  },
  add({nama, rating, pesan}){
    this.list.unshift({nama, rating: Number(rating), pesan, at: new Date().toISOString()});
    localStorage.setItem(TESTI_KEY, JSON.stringify(this.list));
    renderTesti();
  }
};

function renderTesti(){
  const wrap = $("#listTesti");
  wrap.innerHTML = "";
  testi.list.forEach(t=>{
    const el = document.createElement("div");
    el.className = "testi card";
    el.innerHTML = `
      <strong>${t.nama}</strong>
      <span>${"⭐".repeat(t.rating)}</span>
      <p>${t.pesan}</p>
      <span class="muted" style="font-size:.85rem">${new Date(t.at).toLocaleString("id-ID")}</span>
    `;
    wrap.appendChild(el);
  });
}

// Forms
$("#formTesti").addEventListener("submit", e=>{
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  testi.add({ nama: fd.get("nama"), rating: fd.get("rating"), pesan: fd.get("pesan") });
  e.currentTarget.reset();
  toast("Terima kasih atas testimoninya!");
});

$("#formKritik").addEventListener("submit", e=>{
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const data = Object.fromEntries(fd.entries());
  console.log("Kritik & Saran (simulasi):", data);
  e.currentTarget.reset();
  toast("Kritik & saran diterima. Terima kasih!");
});

// Toast helper
let toastT;
function toast(msg){
  clearTimeout(toastT);
  let el = $("#toast");
  if(!el){ el = document.createElement("div"); el.id="toast"; document.body.appendChild(el); }
  el.textContent = msg;
  el.style.cssText = `position:fixed; left:50%; transform:translateX(-50%); bottom:24px; 
    background:linear-gradient(135deg, var(--choco), var(--accent)); color:#fff; padding:10px 14px;
    border-radius:12px; box-shadow:var(--shadow); z-index:1000; opacity:0; transition:opacity .2s ease;`;
  requestAnimationFrame(()=>{ el.style.opacity = 1; });
  toastT = setTimeout(()=>{ el.style.opacity = 0; }, 1800);
}

// Init
window.addEventListener("DOMContentLoaded", ()=>{
  cart.load();
  testi.load();
  initSlider();
  bindAddToCart();
  initReveal();
});
