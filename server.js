const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = path.join(ROOT, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const { products } = require('./products.json');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.ico':'image/x-icon' };

function send(res, status, payload, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(JSON.stringify(payload));
}
function readOrders() {
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 64 * 1024) { reject(new Error('Заявката е твърде голяма.')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(new Error('Невалидни данни.')); }
    });
    req.on('error', reject);
  });
}
function clean(value, max = 200) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function validateOrder(input) {
  const customer = input && input.customer || {};
  const name = clean(customer.name, 100);
  const email = clean(customer.email, 160).toLowerCase();
  const phone = clean(customer.phone, 40);
  const address = clean(customer.address, 200);
  const city = clean(customer.city, 100);
  const postalCode = clean(customer.postalCode, 20);
  const deliverySlot = clean(customer.deliverySlot, 80);
  const notes = clean(customer.notes, 500);
  if (name.length < 2) return { error: 'Моля, въведете име и фамилия.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Моля, въведете валиден имейл адрес.' };
  if (phone.replace(/\D/g, '').length < 7) return { error: 'Моля, въведете валиден телефонен номер.' };
  if (address.length < 5 || city.length < 2) return { error: 'Моля, въведете адрес и населено място.' };
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 100) return { error: 'Количката е празна или съдържа невалидни продукти.' };
  const byId = new Map(products.map(product => [product.id, product]));
  const items = [];
  for (const line of input.items) {
    const product = byId.get(line && line.id);
    const quantity = Number(line && line.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return { error: 'Количката съдържа невалиден продукт или количество.' };
    items.push({ id: product.id, name: product.name, unit: product.unit, price: product.price, quantity, lineTotal: Math.round(product.price * quantity * 100) / 100 });
  }
  const total = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  return { order: { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'new', customer: { name, email, phone, address, city, postalCode, deliverySlot, notes }, items, total } };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true });
  if (req.method === 'GET' && url.pathname === '/api/products') return send(res, 200, { products });
  if (req.method === 'POST' && url.pathname === '/api/orders') {
    try {
      const input = await readBody(req);
      const result = validateOrder(input);
      if (result.error) return send(res, 400, { error: result.error });
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const orders = readOrders();
      orders.push(result.order);
      fs.writeFileSync(ORDERS_FILE, `${JSON.stringify(orders, null, 2)}\n`, { mode: 0o600 });
      return send(res, 201, { orderId: result.order.id, total: result.order.total });
    } catch (error) {
      console.error('Order submission failed:', error.message);
      return send(res, 400, { error: error.message || 'Поръчката не можа да бъде запазена.' });
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Методът не се поддържа.' }, { Allow: 'GET, HEAD' });
  const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const filename = path.resolve(ROOT, `.${relative}`);
  if (!filename.startsWith(`${ROOT}${path.sep}`)) return send(res, 403, { error: 'Забранен достъп.' });
  fs.readFile(filename, (error, content) => {
    if (error) {
      const status = error.code === 'ENOENT' ? 404 : 500;
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
      return res.end(status === 404 ? 'Страницата не е намерена.' : 'Грешка при зареждане.');
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') return res.end();
    res.end(content);
  });
});
server.listen(PORT, HOST, () => console.log(`Лавка работи на http://localhost:${PORT}`));
