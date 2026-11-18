const products = [
  {id:'strawberries',name:'Български ягоди',category:'Плодове и зеленчуци',categoryId:'fresh',price:3.49,unit:'250 г',badge:'БЪЛГАРСКИ ПРОДУКТ',image:'https://images.unsplash.com/photo- strawberries?auto=format&fit=crop&w=700&q=80',emoji:'🍓'},
  {id:'tomatoes',name:'Розови домати',category:'Плодове и зеленчуци',categoryId:'fresh',price:2.99,unit:'кг',badge:'СЕЗОННО',image:'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=700&q=80',emoji:'🍅'},
  {id:'avocado',name:'Авокадо Хас',category:'Плодове и зеленчуци',categoryId:'fresh',price:1.79,unit:'бр.',badge:'ЛЮБИМ ИЗБОР',image:'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=700&q=80',emoji:'🥑'},
  {id:'sourdough',name:'Хляб с квас',category:'Хляб и печива',categoryId:'bakery',price:2.69,unit:'400 г',badge:'ПРЯСНО ИЗПЕЧЕН',image:'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=700&q=80',emoji:'🥖'},
  {id:'milk',name:'Прясно мляко 3.6%',category:'Млечни продукти',categoryId:'dairy',price:1.69,unit:'1 л',badge:'ФЕРМЕРСКО',image:'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=80',emoji:'🥛'},
  {id:'cheese',name:'Бяло саламурено сирене',category:'Млечни продукти',categoryId:'dairy',price:4.89,unit:'400 г',badge:'ТРАДИЦИОНЕН ВКУС',image:'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=700&q=80',emoji:'🧀'},
  {id:'honey',name:'Планински пчелен мед',category:'Основни храни',categoryId:'pantry',price:5.49,unit:'350 г',badge:'ПОДБРА��О',image:'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=700&q=80',emoji:'🍯'},
  {id:'coffee',name:'Кафе на зърна',category:'Напитки',categoryId:'drinks',price:7.99,unit:'250 г',badge:'АРАБИКА',image:'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=700&q=80',emoji:'☕'},
  {id:'apples',name:'Червени ябълки',category:'Плодове и зеленчуци',categoryId:'fresh',price:1.89,unit:'кг',badge:'СВЕЖО',image:'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=700&q=80',emoji:'🍎'},
  {id:'olive-oil',name:'Студено пресован зехтин',category:'Основни храни',categoryId:'pantry',price:8.49,unit:'500 мл',badge:'СРЕДИЗЕМНОМОРСКИ',image:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=80',emoji:'🫒'},
  {id:'croissant',name:'Маслен кроасан',category:'Хляб и печива',categoryId:'bakery',price:1.29,unit:'бр.',badge:'ПРЯСНО ИЗПЕЧЕН',image:'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=80',emoji:'🥐'},
  {id:'oranges',name:'Сочни портокали',category:'Плодове и зеленчуци',categoryId:'fresh',price:2.19,unit:'кг',badge:'СЕЗОННО',image:'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=700&q=80',emoji:'🍊'}
];
const categories = [
  {id:'fresh',name:'Плодове и зеленчуци',count:'Свежо всеки ден',emoji:'🥑',color:'#eff5e9'},
  {id:'dairy',name:'Млечни продукти',count:'Вкус от природата',emoji:'🧀',color:'#fff4dc'},
  {id:'bakery',name:'Хляб и печива',count:'Току-що изпечени',emoji:'🥐',color:'#f9ece1'},
  {id:'pantry',name:'Основни храни',count:'За всяка кухня',emoji:'🫙',color:'#f1eefa'},
  {id:'drinks',name:'Напитки',count:'От сутрин до вечер',emoji:'☕',color:'#eaf1f5'},
  {id:'all',name:'Всички продукти',count:'Разгледай всичко',emoji:'🛒',color:'#f7ecee'}
];
const STORAGE_KEY='fantastiko-demo-cart-v1';
const $=selector=>document.querySelector(selector);
const money=value=>`${value.toFixed(2).replace('.',',')} €`;
let activeCategory='all';
let searchTerm='';
let toastTimer;
let cart=loadCart();
function loadCart(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY));return value&&typeof value==='object'?value:{}}catch{return {}}}
function saveCart(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(cart))}catch{}renderCart()}
function renderCategories(){
  $('#category-list').innerHTML=categories.map(item=>`<button class="category-card ${activeCategory===item.id?'active':''}" data-category="${item.id}" type="button"><span class="category-art" style="background:${item.color}">${item.emoji}</span><b>${item.name}</b><small>${item.count}</small></button>`).join('');
  document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{activeCategory=button.dataset.category;renderCategories();renderProducts();$('#products').scrollIntoView({behavior:'smooth'})}));
}
function getVisibleProducts(){
  const term=searchTerm.toLocaleLowerCase('bg');
  let visible=products.filter(product=>(activeCategory==='all'||product.categoryId===activeCategory)&&(!term||`${product.name} ${product.category} ${product.badge}`.toLocaleLowerCase('bg').includes(term)));
  const sort=$('#sort-select').value;
  if(sort==='price-asc')visible=visible.sort((a,b)=>a.price-b.price);
  if(sort==='price-desc')visible=visible.sort((a,b)=>b.price-a.price);
  return visible;
}
function renderProducts(){
  const visible=getVisibleProducts();
  $('#product-grid').innerHTML=visible.map(product=>`<article class="product-card"><div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.outerHTML='<span class=\'fallback-emoji\' aria-hidden=\'true\'>${product.emoji}</span>'"><span class="product-badge">${product.badge}</span></div><div class="product-info"><span class="product-category">${product.category}</span><h3 class="product-name">${product.name}</h3><div class="product-bottom"><div><strong class="product-price">${money(product.price)}</strong><small class="product-unit">за ${product.unit}</small></div><button class="add-button" type="button" data-add="${product.id}" aria-label="Добави ${product.name} в количката">+</button></div></div></article>`).join('');
  $('#empty-state').classList.toggle('hidden',visible.length>0);
  $('#product-grid').classList.toggle('hidden',visible.length===0);
  $('#active-filter').innerHTML=activeCategory!=='all'?`<button class="filter-chip" id="clear-filter" type="button">${categories.find(c=>c.id===activeCategory)?.name||'Категория'} ×</button>`:'';
  $('#clear-filter')?.addEventListener('click',()=>{activeCategory='all';renderCategories();renderProducts()});
  document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>addToCart(button.dataset.add)));
}
function addToCart(id){cart[id]=(cart[id]||0)+1;saveCart();const product=products.find(item=>item.id===id);showToast(`${product.name} е добавен в количката`)}
function changeQuantity(id,amount){cart[id]=(cart[id]||0)+amount;if(cart[id]<=0)delete cart[id];saveCart()}
function renderCart(){
  const entries=Object.entries(cart).filter(([id,qty])=>products.some(product=>product.id===id)&&Number.isFinite(qty)&&qty>0);
  cart=Object.fromEntries(entries);
  const count=entries.reduce((sum,[,qty])=>sum+qty,0);
  const total=entries.reduce((sum,[id,qty])=>sum+products.find(product=>product.id===id).price*qty,0);
  $('#cart-count').textContent=count;$('#drawer-count').textContent=`(${count})`;
  $('#cart-items').innerHTML=entries.map(([id,qty])=>{const product=products.find(item=>item.id===id);return `<article class="cart-item"><div class="cart-item-art"><img src="${product.image}" alt="" onerror="this.outerHTML='<span>${product.emoji}</span>'"></div><div><h3>${product.name}</h3><span class="cart-item-price">${money(product.price)} / ${product.unit}</span><div class="quantity-control"><button type="button" data-change="${id}" data-amount="-1" aria-label="Намали количеството">−</button><span>${qty}</span><button type="button" data-change="${id}" data-amount="1" aria-label="Увеличи количеството">+</button></div></div><strong>${money(product.price*qty)}</strong></article>`}).join('');
  $('#cart-empty').classList.toggle('hidden',count>0);$('#cart-footer').classList.toggle('hidden',count===0);$('#cart-total').textContent=money(total);
  $('#delivery-hint').textContent=`Поръчката е демонстрационна. Общо за продуктите: ${money(total)}.`;
  document.querySelectorAll('[data-change]').forEach(button=>button.addEventListener('click',()=>changeQuantity(button.dataset.change,Number(button.dataset.amount))));
}
function showCart(){closeCheckout();$('#cart-drawer').classList.add('open');$('#cart-drawer').setAttribute('aria-hidden','false');$('#overlay').classList.add('open');document.body.style.overflow='hidden';$('#close-cart').focus()}
function hideCart(){$('#cart-drawer').classList.remove('open');$('#cart-drawer').setAttribute('aria-hidden','true');$('#overlay').classList.remove('open');document.body.style.overflow='';$('#open-cart').focus()}
function showCheckout(){if(!Object.keys(cart).length)return;hideCart();$('#order-success').classList.add('hidden');$('#checkout-form').classList.remove('hidden');$('#checkout-dialog').showModal()}
function closeCheckout(){if($('#checkout-dialog').open)$('#checkout-dialog').close()}
function showToast(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2200)}
$('#search-form').addEventListener('submit',event=>{event.preventDefault();searchTerm=$('#search-input').value.trim();renderProducts();$('#products').scrollIntoView({behavior:'smooth'})});
$('#search-input').addEventListener('input',event=>{searchTerm=event.target.value.trim();renderProducts()});
$('#sort-select').addEventListener('change',renderProducts);
document.querySelectorAll('[data-nav-category]').forEach(link=>link.addEventListener('click',()=>{activeCategory=link.dataset.navCategory;renderCategories();renderProducts()}));
$('.nav-all').addEventListener('click',()=>{activeCategory='all';renderCategories();renderProducts()});
$('#open-cart').addEventListener('click',showCart);
$('#close-cart').addEventListener('click',hideCart);
$('#overlay').addEventListener('click',hideCart);
$('#continue-shopping').addEventListener('click',hideCart);
$('#checkout-button').addEventListener('click',showCheckout);
$('#close-checkout').addEventListener('click',closeCheckout);
$('#checkout-dialog').addEventListener('click',event=>{if(event.target===$('#checkout-dialog'))closeCheckout()});
$('#checkout-form').addEventListener('submit',event=>{event.preventDefault();if(!event.currentTarget.reportValidity())return;cart={};saveCart();event.currentTarget.classList.add('hidden');$('#order-success').classList.remove('hidden')});
$('#finish-order').addEventListener('click',closeCheckout);
$('#reset-filters').addEventListener('click',()=>{$('#search-input').value='';searchTerm='';activeCategory='all';renderCategories();renderProducts()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#checkout-dialog').open&&$('#cart-drawer').classList.contains('open'))hideCart();if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('#search-input').focus()}});
$('#current-year').textContent=new Date().getFullYear();
renderCategories();renderProducts();renderCart();
