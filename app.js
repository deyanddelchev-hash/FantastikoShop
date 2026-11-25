const categories = [
  { id: 'fresh', name: 'Плодове и зеленчуци', count: 'Свежо всеки ден', emoji: '🥑', color: '#eff5e9' },
  { id: 'dairy', name: 'Млечни продукти', count: 'Вкус от природата', emoji: '🧀', color: '#fff4dc' },
  { id: 'bakery', name: 'Хляб и печива', count: 'Току-що изпечени', emoji: '🥐', color: '#f9ece1' },
  { id: 'pantry', name: 'Основни храни', count: 'За всяка кухня', emoji: '🫙', color: '#f1eefa' },
  { id: 'drinks', name: 'Напитки', count: 'От сутрин до вечер', emoji: '☕', color: '#eaf1f5' },
  { id: 'all', name: 'Всички продукти', count: 'Разгледай всичко', emoji: '🛒', color: '#f7ecee' }
];
const STORAGE_KEY = 'lavka-cart-v2';
const $ = selector => document.querySelector(selector);
const money = value => `${Number(value).toFixed(2).replace('.', ',')} €`;
let products = [];
let activeCategory = 'all';
let searchTerm = '';
let toastTimer;
let cart = loadCart();

function loadCart() {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); return saved && typeof saved === 'object' ? saved : {}; }
  catch { return {}; }
}
function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {}
  renderCart();
}
function renderCategories() {
  const target = $('#category-list');
  if (!target) return;
  target.innerHTML = categories.map(item => `<button class="category-card ${activeCategory === item.id ? 'active' : ''}" data-category="${item.id}" type="button"><span class="category-art" style="background:${item.color}" aria-hidden="true">${item.emoji}</span><span class="category-copy"><strong>${item.name}</strong><small>${item.count}</small></span></button>`).join('');
}
function visibleProducts() {
  const term = searchTerm.toLocaleLowerCase('bg');
  let result = products.filter(product => (activeCategory === 'all' || product.categoryId === activeCategory) && (!term || `${product.name} ${product.category} ${product.badge}`.toLocaleLowerCase('bg').includes(term)));
  const sort = $('#sort-select')?.value;
  if (sort === 'price-asc') result = result.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') result = result.sort((a, b) => b.price - a.price);
  return result;
}
function renderProducts() {
  const grid = $('#product-grid');
  if (!grid) return;
  const visible = visibleProducts();
  grid.innerHTML = visible.map(product => `<article class="product-card"><div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'"><span class="product-badge">${product.badge}</span></div><div class="product-info"><small>${product.category}</small><h3>${product.name}</h3><span class="product-unit">${product.unit}</span><div class="product-bottom"><strong>${money(product.price)}</strong><button class="add-button" data-add="${product.id}" type="button" aria-label="Добави ${product.name} в количката">+</button></div></div></article>`).join('');
  $('#empty-state')?.classList.toggle('hidden', visible.length > 0);
  grid.classList.toggle('hidden', visible.length === 0);
  const active = $('#active-filter');
  if (active) active.innerHTML = activeCategory !== 'all' ? `<button class="filter-chip" id="clear-filter" type="button">${categories.find(item => item.id === activeCategory)?.name || 'Категория'} ×</button>` : '';
}
function addToCart(id) {
  if (!products.some(product => product.id === id)) return;
  cart[id] = Math.min(99, (Number(cart[id]) || 0) + 1);
  saveCart();
  showToast(`${products.find(product => product.id === id).name} е добавен в количката`);
}
function changeQuantity(id, amount) {
  cart[id] = (Number(cart[id]) || 0) + amount;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
}
function cartEntries() {
  return Object.entries(cart).filter(([id, quantity]) => products.some(product => product.id === id) && Number.isInteger(quantity) && quantity > 0);
}
function renderCart() {
  cart = Object.fromEntries(cartEntries());
  const entries = cartEntries();
  const count = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  const total = entries.reduce((sum, [id, quantity]) => sum + products.find(product => product.id === id).price * quantity, 0);
  if ($('#cart-count')) $('#cart-count').textContent = count;
  if ($('#drawer-count')) $('#drawer-count').textContent = `(${count})`;
  if ($('#cart-items')) $('#cart-items').innerHTML = entries.map(([id, quantity]) => {
    const product = products.find(item => item.id === id);
    return `<article class="cart-item"><div class="cart-item-art"><img src="${product.image}" alt=""></div><div class="cart-item-info"><strong>${product.name}</strong><small>${money(product.price)} / ${product.unit}</small><div class="quantity-control"><button type="button" data-change="${id}" data-amount="-1" aria-label="Намали">−</button><span>${quantity}</span><button type="button" data-change="${id}" data-amount="1" aria-label="Увеличи">+</button></div></div><strong>${money(product.price * quantity)}</strong></article>`;
  }).join('');
  $('#cart-empty')?.classList.toggle('hidden', count > 0);
  $('#cart-footer')?.classList.toggle('hidden', count === 0);
  if ($('#cart-total')) $('#cart-total').textContent = money(total);
  const hint = $('#delivery-hint');
  if (hint) hint.textContent = count ? `Сумата се преизчислява от магазина при поръчка. Междинна сума: ${money(total)}.` : '';
}
function showCart() {
  closeCheckout();
  $('#cart-drawer')?.classList.add('open');
  $('#cart-drawer')?.setAttribute('aria-hidden', 'false');
  $('#overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function hideCart() {
  $('#cart-drawer')?.classList.remove('open');
  $('#cart-drawer')?.setAttribute('aria-hidden', 'true');
  $('#overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}
function showCheckout() {
  if (!cartEntries().length) return;
  hideCart();
  const form = $('#checkout-form');
  $('#order-success')?.classList.add('hidden');
  form.classList.remove('hidden');
  form.innerHTML = `<button class="icon-button dialog-close" id="close-checkout" type="button" aria-label="Затвори">×</button><span class="eyebrow">ДОСТАВКА ДО ВРАТАТА</span><h2>Данни за поръчката</h2><p class="checkout-intro">Попълни данните си. Ще запазим поръчката и ще ти покажем номера ѝ.</p><div class="checkout-fields"><label>Име и фамилия<input name="name" autocomplete="name" required minlength="2" maxlength="100"></label><label>Имейл<input name="email" type="email" autocomplete="email" required maxlength="160"></label><label>Телефон<input name="phone" type="tel" autocomplete="tel" required minlength="7" maxlength="40" placeholder="Напр. 0888 123 456"></label><label>Населено място<input name="city" autocomplete="address-level2" required maxlength="100"></label><label class="field-wide">Адрес за доставка<input name="address" autocomplete="street-address" required minlength="5" maxlength="200" placeholder="Улица, номер, вход, етаж"></label><label>Пощенски код <span class="optional">(по желание)</span><input name="postalCode" autocomplete="postal-code" maxlength="20"></label><label>Предпочитан час <span class="optional">(по желание)</span><select name="deliverySlot"><option value="">Ще се уточни по телефона</option><option>09:00 – 12:00</option><option>12:00 – 15:00</option><option>15:00 – 18:00</option><option>18:00 – 21:00</option></select></label><label class="field-wide">Бележка към поръчката <span class="optional">(по желание)</span><textarea name="notes" rows="3" maxlength="500"></textarea></label></div><p class="checkout-total">Междинна сума: <strong>${money(cartEntries().reduce((sum, [id, qty]) => sum + products.find(p => p.id === id).price * qty, 0))}</strong></p><p class="checkout-notice">Плащането и часът за доставка се уточняват с магазина по телефона. Онлайн плащане още не е настроено.</p><button class="primary-button checkout-submit" type="submit">Изпрати поръчката</button>`;
  $('#checkout-dialog').showModal();
}
function closeCheckout() { const dialog = $('#checkout-dialog'); if (dialog?.open) dialog.close(); }
function showToast(message) {
  const toast = $('#toast'); if (!toast) return;
  toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

$('#search-form')?.addEventListener('submit', event => { event.preventDefault(); searchTerm = $('#search-input').value.trim(); renderProducts(); $('#products')?.scrollIntoView({ behavior: 'smooth' }); });
$('#search-input')?.addEventListener('input', event => { searchTerm = event.target.value.trim(); renderProducts(); });
$('#sort-select')?.addEventListener('change', renderProducts);
$('#open-cart')?.addEventListener('click', showCart);
$('#close-cart')?.addEventListener('click', hideCart);
$('#overlay')?.addEventListener('click', hideCart);
$('#continue-shopping')?.addEventListener('click', hideCart);
$('#checkout-button')?.addEventListener('click', showCheckout);
$('#close-checkout')?.addEventListener('click', closeCheckout);
$('#checkout-dialog')?.addEventListener('click', event => { if (event.target === $('#checkout-dialog')) closeCheckout(); });
$('#checkout-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Изпращане…';
  const customer = Object.fromEntries(new FormData(form).entries());
  const items = cartEntries().map(([id, quantity]) => ({ id, quantity }));
  try {
    const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer, items }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Поръчката не можа да бъде изпратена.');
    cart = {}; saveCart(); form.classList.add('hidden');
    const success = $('#order-success');
    success.innerHTML = `<div class="success-mark" aria-hidden="true">✓</div><span class="eyebrow">ПОРЪЧКАТА Е ЗАПИСАНА</span><h2>Благодарим ти!</h2><p>Номер на поръчката: <strong>${result.orderId}</strong></p><p>Магазинът ще се свърже с теб за потвърждение и уточняване на доставката.</p><button class="primary-button" id="finish-order" type="button">Готово</button>`;
    success.classList.remove('hidden');
    $('#finish-order').addEventListener('click', closeCheckout);
  } catch (error) {
    showToast(error.message || 'Няма връзка със сървъра. Опитай отново.');
    submit.disabled = false; submit.textContent = 'Изпрати поръчката';
  }
});
$('#reset-filters')?.addEventListener('click', () => { if ($('#search-input')) $('#search-input').value = ''; searchTerm = ''; activeCategory = 'all'; renderCategories(); renderProducts(); });
document.addEventListener('click', event => {
  const category = event.target.closest('[data-category], [data-nav-category], .nav-all');
  if (category) {
    activeCategory = category.dataset.category || category.dataset.navCategory || 'all';
    renderCategories(); renderProducts();
  }
  const add = event.target.closest('[data-add]'); if (add) addToCart(add.dataset.add);
  const change = event.target.closest('[data-change]'); if (change) changeQuantity(change.dataset.change, Number(change.dataset.amount));
  if (event.target.closest('#clear-filter')) { activeCategory = 'all'; renderCategories(); renderProducts(); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#checkout-dialog')?.open && $('#cart-drawer')?.classList.contains('open')) hideCart();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#search-input')?.focus(); }
});
if ($('#current-year')) $('#current-year').textContent = new Date().getFullYear();

async function start() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Сървърът не върна каталога.');
    ({ products } = await response.json());
    renderCategories(); renderProducts(); renderCart();
  } catch (error) {
    const grid = $('#product-grid');
    if (grid) grid.innerHTML = `<p role="alert">Не успяхме да заредим магазина. Стартирай го с <code>npm start</code> и отвори <code>http://localhost:3000</code>.</p>`;
  }
}
start();
