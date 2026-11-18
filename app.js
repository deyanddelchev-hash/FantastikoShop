const products = [
  {id:'strawberries',name:'Български ягоди',category:'Плодове и зеленчуци',categoryId:'fresh',emoji:'🍓',price:5.49,unit:'250 г',badge:'БЪЛГАРСКИ',bg:'#fff0ed',description:'Сладки и ароматни · от местна ферма'},
  {id:'avocado',name:'Авокадо Хас',category:'Плодове и зеленчуци',categoryId:'fresh',emoji:'🥑',price:3.29,unit:'бр.',badge:'ЛЮБИМО',bg:'#eff4df',description:'Узряло точно колкото трябва'},
  {id:'sourdough',name:'Хляб с квас',category:'Хляб и печива',categoryId:'bakery',emoji:'🥖',price:4.20,unit:'400 г',badge:'ПРЯСНО ДНЕС',bg:'#f8edda',description:'Изпечен тази сутрин в квартала'},
  {id:'milk',name:'Прясно мляко',category:'Млечни продукти',categoryId:'dairy',emoji:'🥛',price:2.79,unit:'1 л',badge:'ФЕРМЕРСКО',bg:'#eef5f4',description:'Пълномаслено · от свободни крави'},
  {id:'honey',name:'Планински мед',category:'Био и фермерски',categoryId:'bio',emoji:'🍯',price:9.90,unit:'350 г',badge:'БИО',bg:'#fbf2da',description:'Билков букет от Родопите'},
  {id:'tomatoes',name:'Розови домати',category:'Плодове и зеленчуци',categoryId:'fresh',emoji:'🍅',price:4.80,unit:'кг',badge:'БЪЛГАРСКИ',bg:'#f9eae5',description:'Сочни и узрели на слънце'},
  {id:'coffee',name:'Кафе на зърна',category:'Напитки',categoryId:'drinks',emoji:'☕',price:12.50,unit:'250 г',badge:'АРАБИКА',bg:'#f0e9e2',description:'Средно изпечено · шоколадови нотки'},
  {id:'soap',name:'Натурален сапун',category:'За дома',categoryId:'home',emoji:'🧼',price:5.60,unit:'100 г',badge:'РЪЧНА ИЗРАБОТКА',bg:'#eaf1e9',description:'Лавандула и зехтин · без пластмаса'}
];
const categories = [
  {id:'fresh',name:'Плодове и зеленчуци',emoji:'🥑',count:'18 продукта'},
  {id:'bakery',name:'Хляб и печива',emoji:'🥐',count:'9 продукта'},
  {id:'dairy',name:'Млечни продукти',emoji:'🧀',count:'12 продукта'},
  {id:'bio',name:'Био и фермерски',emoji:'🍯',count:'14 продукта'},
  {id:'drinks',name:'Напитки',emoji:'☕',count:'21 продукта'},
  {id:'home',name:'За дома',emoji:'🧺',count:'16 продукта'}
];
const STORAGE_KEY='lavka-cart-v1';
let cart=loadCart();
let activeCategory='all';
let searchTerm='';
let toastTimer;
const $=selector=>document.querySelector(selector);
const money=value=>`${value.toFixed(2).replace('.',',')} лв.`;
function loadCart(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{}}catch{return {}}}
function saveCart(){localStorage.setItem(STORAGE_KEY,JSON.stringify(cart));renderCart()}
function renderCategories(){
  $('#category-list').innerHTML=categories.map(item=>`<button class="category-card ${activeCategory===item.id?'active':''}" data-category="${item.id}"><span class="category-emoji">${item.emoji}</span>${item.name}<small>${item.count}</small></button>`).join('');
  document.querySelectorAll('.category-card').forEach(button=>button.addEventListener('click',()=>{activeCategory=activeCategory===button.dataset.category?'all':button.dataset.category;renderCategories();renderProducts();document.querySelector('#products').scrollIntoView({behavior:'smooth'})}));
}
function getVisibleProducts(){
  let visible=products.filter(product=>(activeCategory==='all'||product.categoryId===activeCategory)&&(`${product.name} ${product.category} ${product.description}`.toLocaleLowerCase('bg').includes(searchTerm.toLocaleLowerCase('bg'))));
  const sort=$('#sort-select').value;
  if(sort==='price-asc')visible.sort((a,b)=>a.price-b.price);
  if(sort==='price-desc')visible.sort((a,b)=>b.price-a.price);
  return visible;
}
function renderProducts(){
  const visible=getVisibleProducts();
  $('#product-grid').innerHTML=visible.map(product=>`<article class="product-card"><div class="product-image" style="--product-bg:${product.bg}"><span class="product-badge">${product.badge}</span><span class="emoji" aria-hidden="true">${product.emoji}</span></div><div class="product-info"><span class="product-category">${product.category}</span><h3>${product.name}</h3><p class="product-description">${product.description}</p><div class="product-bottom"><span class="product-price">${money(product.price)} <small>/ ${product.unit}</small></span><button class="add-button" data-add="${product.id}" aria-label="Добави ${product.name} в количката">+</button></div></div></article>`).join('');
  $('#empty-state').classList.toggle('hidden',visible.length>0);
  $('#active-filter').innerHTML=activeCategory!=='all'?`<button class="filter-chip" id="clear-filter">${categories.find(c=>c.id===activeCategory).name} ×</button>`:'';
  $('#clear-filter')?.addEventListener('click',()=>{activeCategory='all';renderCategories();renderProducts()});
  document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>addToCart(button.dataset.add)));
}
function addToCart(id){cart[id]=(cart[id]||0)+1;saveCart();const product=products.find(item=>item.id===id);showToast(`${product.name} е добавен в количката ✓`)}
function changeQuantity(id,amount){cart[id]=(cart[id]||0)+amount;if(cart[id]<=0)delete cart[id];saveCart()}
function renderCart(){
  const entries=Object.entries(cart).filter(([id,qty])=>products.some(p=>p.id===id)&&qty>0);
  cart=Object.fromEntries(entries);
  const count=entries.reduce((sum,[,qty])=>sum+qty,0);
  const total=entries.reduce((sum,[id,qty])=>sum+products.find(p=>p.id===id).price*qty,0);
  $('#cart-count').textContent=count;$('#drawer-count').textContent=`(${count})`;
  $('#cart-items').innerHTML=entries.map(([id,qty])=>{const product=products.find(p=>p.id===id);return `<article class="cart-item"><div class="cart-item-art">${product.emoji}</div><div><h3>${product.name}</h3><span class="cart-item-price">${money(product.price)} / ${product.unit}</span><div class="quantity-control"><button data-change="${id}" data-amount="-1" aria-label="Намали количеството">−</button><span>${qty}</span><button data-change="${id}" data-amount="1" aria-label="Увеличи количеството">+</button></div></div><button class="remove-item" data-remove="${id}" aria-label="Премахни ${product.name}">×</button></article>`}).join('');
  $('#cart-empty').classList.toggle('hidden',count>0);$('#cart-footer').classList.toggle('hidden',count===0);$('#cart-total').textContent=money(total);
  const remaining=Math.max(0,60-total);
  $('#delivery-hint').textContent=remaining>0?`Добави още ${money(remaining)} за безплатна доставка 🎁`:'Чудесно! Поръчката ти е с безплатна доставка 🎉';
  document.querySelectorAll('[data-change]').forEach(button=>button.addEventListener('click',()=>changeQuantity(button.dataset.change,Number(button.dataset.amount))));
  document.querySelectorAll('[data-remove]').forEach(button=>button.addEventListener('click',()=>changeQuantity(button.dataset.remove,-cart[button.dataset.remove])));
}
function showCart(){closeCheckout();$('#cart-drawer').classList.add('open');$('#cart-drawer').setAttribute('aria-hidden','false');$('#overlay').classList.add('open');document.body.style.overflow='hidden';$('#close-cart').focus()}
function hideCart(){ $('#cart-drawer').classList.remove('open');$('#cart-drawer').setAttribute('aria-hidden','true');$('#overlay').classList.remove('open');document.body.style.overflow=''}
function showCheckout(){hideCart();$('#order-success').classList.add('hidden');$('#checkout-form').classList.remove('hidden');$('#checkout-dialog').showModal()}
function closeCheckout(){if($('#checkout-dialog').open)$('#checkout-dialog').close()}
function showToast(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2300)}
$('#search-input').addEventListener('input',event=>{searchTerm=event.target.value.trim();renderProducts();if(searchTerm)document.querySelector('#products').scrollIntoView({behavior:'smooth',block:'start'})});
$('#sort-select').addEventListener('change',renderProducts);
$('#open-cart').addEventListener('click',showCart);
$('#close-cart').addEventListener('click',hideCart);
$('#overlay').addEventListener('click',hideCart);
$('#continue-shopping').addEventListener('click',hideCart);
$('#checkout-button').addEventListener('click',showCheckout);
$('#close-checkout').addEventListener('click',closeCheckout);
$('#checkout-dialog').addEventListener('click',event=>{if(event.target===$('#checkout-dialog'))closeCheckout()});
$('#checkout-form').addEventListener('submit',event=>{event.preventDefault();if(!event.currentTarget.reportValidity())return;cart={};saveCart();event.currentTarget.classList.add('hidden');$('#order-success').classList.remove('hidden')});
$('#finish-order').addEventListener('click',closeCheckout);
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('#search-input').focus()}if(event.key==='Escape'&&!$('#checkout-dialog').open)hideCart()});
renderCategories();renderProducts();renderCart();
