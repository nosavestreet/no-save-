/* NO SAVE — vitrine estática. Carrinho no navegador (localStorage, só neste aparelho).
   Nada é enviado a servidor nenhum. O pedido só existe quando registrado no /admin. */
(function () {
  'use strict';
  var CATALOG = window.NOSAVE_CATALOG || { products: [] };
  var STORE = window.NOSAVE_CONFIG || {};
  var CART_KEY = 'nosave-cart-v1';

  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function money(cents) { return 'R$ ' + (cents / 100).toFixed(2).replace('.', ','); }
  function productBySlug(slug) {
    for (var i = 0; i < CATALOG.products.length; i++) if (CATALOG.products[i].slug === slug) return CATALOG.products[i];
    return null;
  }
  function variantKey(slug, color, size) { return slug + '|' + color + '|' + size; }

  /* ---------- carrinho ---------- */
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    updateCartBadge();
  }
  function cartCount() {
    return loadCart().reduce(function (n, it) { return n + it.qty; }, 0);
  }
  function updateCartBadge() {
    $all('.cart-count').forEach(function (el) { el.textContent = cartCount(); });
  }
  function cartSubtotal() {
    var total = 0;
    loadCart().forEach(function (it) {
      var p = productBySlug(it.slug);
      if (p) total += p.priceCents * it.qty;
    });
    return total;
  }
  function addToCart(slug, color, size, qty, img) {
    var p = productBySlug(slug);
    if (!p) return false;
    var v = null;
    p.variants.forEach(function (vv) { if (vv.color === color && vv.size === size) v = vv; });
    if (!v || !v.inStock) return false;
    var cart = loadCart();
    var key = variantKey(slug, color, size);
    var found = null;
    cart.forEach(function (it) { if (it.key === key) found = it; });
    if (found) {
      if (found.qty + qty > 1) { toast('Só há 1 unidade desta variante.'); return false; }
      found.qty += qty;
    } else {
      cart.push({ key: key, slug: slug, color: color, size: size, qty: qty, img: img || '' });
    }
    saveCart(cart);
    return true;
  }
  function setQty(key, qty) {
    var cart = loadCart().filter(function (it) {
      if (it.key !== key) return true;
      it.qty = qty;
      return it.qty > 0;
    });
    saveCart(cart);
  }
  function removeItem(key) {
    saveCart(loadCart().filter(function (it) { return it.key !== key; }));
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('.toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.style.display = 'none'; }, 2600);
  }

  /* ---------- página de produto ---------- */
  function initProductPage() {
    var page = document.querySelector('[data-product]');
    if (!page) return;
    var p = productBySlug(page.getAttribute('data-product'));
    if (!p) return;
    var selected = { color: null, size: null };
    var colorBtns = $all('[data-color]', page);
    var sizeBtns = $all('[data-size]', page);
    function sync() {
      colorBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-color') === selected.color ? 'true' : 'false'); });
      sizeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-size') === selected.size ? 'true' : 'false'); });
      var ok = selected.color && selected.size;
      $all('[data-add],[data-buy]', page).forEach(function (b) { b.disabled = !ok; });
    }
    colorBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        selected.color = b.getAttribute('data-color');
        var sizes = p.variants.filter(function (v) { return v.color === selected.color; }).map(function (v) { return v.size; });
        sizeBtns.forEach(function (sb) { sb.disabled = sizes.indexOf(sb.getAttribute('data-size')) === -1; });
        if (sizes.indexOf(selected.size) === -1) selected.size = sizes.length === 1 ? sizes[0] : null;
        sync();
      });
    });
    sizeBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        selected.size = b.getAttribute('data-size');
        sync();
      });
    });
    if (colorBtns.length === 1) { colorBtns[0].click(); }
    if (sizeBtns.length === 1) { sizeBtns[0].click(); }
    var pageImg = page.querySelector('.photo img');
    var pageImgSrc = pageImg ? pageImg.getAttribute('src') : '';
    $all('[data-add]', page).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!selected.color || !selected.size) { toast('Escolha a cor e o tamanho.'); return; }
        if (addToCart(p.slug, selected.color, selected.size, 1, pageImgSrc)) toast('Adicionado ao carrinho.');
      });
    });
    $all('[data-buy]', page).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!selected.color || !selected.size) { toast('Escolha a cor e o tamanho.'); return; }
        if (addToCart(p.slug, selected.color, selected.size, 1, pageImgSrc)) window.location.href = 'checkout.html';
      });
    });
    sync();
  }

  /* ---------- carrinho ---------- */
  function initCartPage() {
    var box = $('#cart-box');
    if (!box) return;
    function render() {
      var cart = loadCart();
      if (!cart.length) {
        box.innerHTML = '<div class="empty"><p>Seu carrinho está vazio.</p><a class="btn" href="produtos.html">Ver produtos</a></div>';
        return;
      }
      var rows = cart.map(function (it) {
        var p = productBySlug(it.slug);
        if (!p) return '';
        return '<tr><td><div class="cart-item"><img src="' + esc(it.img || '') + '" alt="' + esc(p.name) + '"><div><strong>' + esc(p.name) + '</strong><br><span>' + esc(it.color) + ' / ' + esc(it.size) + '</span></div></div></td>' +
          '<td><div class="qty"><button type="button" data-dec="' + esc(it.key) + '" aria-label="Diminuir quantidade">−</button><span>' + it.qty + '</span><button type="button" data-inc="' + esc(it.key) + '" aria-label="Aumentar quantidade">+</button></div></td>' +
          '<td>' + money(p.priceCents * it.qty) + '</td>' +
          '<td><button type="button" class="remove" data-remove="' + esc(it.key) + '">Remover</button></td></tr>';
      }).join('');
      box.innerHTML = '<table class="cart"><thead><tr><th>Produto</th><th>Qtd.</th><th>Valor</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="summary"><div class="row"><span>Subtotal</span><strong>' + money(cartSubtotal()) + '</strong></div>' +
        '<div class="row"><span>Entrega local</span><strong>Sem taxa por enquanto</strong></div>' +
        '<div class="row"><span>Prazo e bairros</span><span>Combinados no WhatsApp</span></div>' +
        '<div class="row total"><span>Total</span><span>' + money(cartSubtotal()) + '</span></div></div>' +
        '<a class="btn block" href="checkout.html">Finalizar pedido</a>' +
        '<p class="note" style="text-align:center">Compra sem cadastro. Pagamento por Pix ou dinheiro, confirmado pela loja no WhatsApp.</p>';
      $all('[data-inc]', box).forEach(function (b) { b.addEventListener('click', function () { var it = findItem(b.getAttribute('data-inc')); if (it && it.qty >= 1) { toast('Só há 1 unidade desta variante.'); return; } setQty(b.getAttribute('data-inc'), 1); render(); }); });
      $all('[data-dec]', box).forEach(function (b) { b.addEventListener('click', function () { var it = findItem(b.getAttribute('data-dec')); setQty(b.getAttribute('data-dec'), (it ? it.qty : 1) - 1); render(); }); });
      $all('[data-remove]', box).forEach(function (b) { b.addEventListener('click', function () { removeItem(b.getAttribute('data-remove')); render(); }); });
    }
    function findItem(key) {
      var found = null;
      loadCart().forEach(function (it) { if (it.key === key) found = it; });
      return found;
    }
    render();
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- checkout ---------- */
  function initCheckout() {
    var form = $('#checkout-form');
    if (!form) return;
    if (!loadCart().length) {
      form.innerHTML = '<div class="empty"><p>Seu carrinho está vazio.</p><a class="btn" href="produtos.html">Ver produtos</a></div>';
      return;
    }
    renderCheckoutSummary();
    var cepInput = $('#cep');
    if (cepInput) {
      cepInput.addEventListener('blur', function () {
        var cep = cepInput.value.replace(/\D/g, '');
        if (cep.length !== 8) return;
        fetch('https://viacep.com.br/ws/' + cep + '/json/')
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.erro) { toast('CEP não encontrado — preencha o endereço manualmente.'); return; }
            setVal('#logradouro', d.logradouro || '');
            setVal('#bairro', d.bairro || '');
            setVal('#cidade', d.localidade || '');
            setVal('#uf', d.uf || '');
            var num = $('#numero'); if (num) num.focus();
          })
          .catch(function () { toast('Não foi possível buscar o CEP — preencha o endereço manualmente.'); });
      });
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      var firstBad = null;
      function need(id, test, msg) {
        var f = $(id).closest('.field');
        var val = $(id).value.trim();
        var valid = test(val);
        f.classList.toggle('error', !valid);
        if (!valid) { ok = false; if (!firstBad) firstBad = f; }
        return valid;
      }
      need('#nome', function (v) { return v.length >= 2; });
      need('#telefone', function (v) { return v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 11; });
      need('#cep', function (v) { return v.replace(/\D/g, '').length === 8; });
      need('#logradouro', function (v) { return v.length >= 2; });
      need('#numero', function (v) { return v.length >= 1; });
      need('#bairro', function (v) { return v.length >= 2; });
      need('#cidade', function (v) { return v.length >= 2; });
      var terms = $('#aceite');
      var termsField = terms.closest('.field');
      termsField.classList.toggle('error', !terms.checked);
      if (!terms.checked) { ok = false; if (!firstBad) firstBad = termsField; }
      if (!ok) {
        if (firstBad) {
          firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
          var input = firstBad.querySelector('input, textarea, select');
          if (input) input.focus();
        }
        return;
      }
      var order = buildOrder(form);
      try { sessionStorage.setItem('nosave-order', JSON.stringify(order)); } catch (e) {}
      saveCart([]);
      window.location.href = 'pedido.html?ref=' + encodeURIComponent(order.ref);
    });
  }
  function setVal(sel, val) { var el = $(sel); if (el) el.value = val; }
  function renderCheckoutSummary() {
    var box = $('#checkout-summary');
    if (!box) return;
    var cart = loadCart();
    var rows = cart.map(function (it) {
      var p = productBySlug(it.slug);
      if (!p) return '';
      return '<div class="row"><span>' + it.qty + 'x ' + esc(p.name) + ' — ' + esc(it.color) + ' / ' + esc(it.size) + '</span><strong>' + money(p.priceCents * it.qty) + '</strong></div>';
    }).join('');
    box.innerHTML = rows +
      '<div class="row"><span>Entrega local</span><strong>Sem taxa por enquanto</strong></div>' +
      '<div class="row total"><span>Total</span><span>' + money(cartSubtotal()) + '</span></div>';
  }
  function buildOrder(form) {
    var now = new Date();
    var y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0'), d = String(now.getDate()).padStart(2, '0');
    var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', suffix = '';
    for (var i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
    var ref = 'NS-' + y + m + d + '-' + suffix;
    var items = loadCart().map(function (it) {
      var p = productBySlug(it.slug);
      return { name: p.name, color: it.color, size: it.size, qty: it.qty, priceCents: p.priceCents };
    });
    var g = function (id) { var el = $(id); return el ? el.value.trim() : ''; };
    return {
      ref: ref,
      items: items,
      subtotalCents: cartSubtotal(),
      delivery: 'Entrega local em Boa Esperança – MG',
      name: g('#nome'), phone: g('#telefone'),
      address: g('#logradouro') + ', ' + g('#numero') + ' — ' + g('#bairro') + ', ' + g('#cidade') + ' - ' + g('#uf') + ' — CEP ' + g('#cep'),
      notes: g('#observacoes'),
      createdAt: now.toISOString()
    };
  }

  /* ---------- página do pedido ---------- */
  function initOrderPage() {
    var box = $('#order-box');
    if (!box) return;
    var order = null;
    try { order = JSON.parse(sessionStorage.getItem('nosave-order') || 'null'); } catch (e) {}
    var params = new URLSearchParams(window.location.search);
    var ref = params.get('ref');
    if (!order || (ref && order.ref !== ref)) {
      box.innerHTML = '<p>Não encontramos os dados deste pedido neste aparelho. O pedido é montado no aparelho em que foi criado. Se você já criou o pedido, volte ao checkout e finalize novamente — ou fale com a gente no Instagram @nosavestreet.</p>';
      return;
    }
    var lines = order.items.map(function (it) {
      return it.qty + 'x ' + it.name + ' — ' + it.color + ' / ' + it.size + ' — ' + money(it.priceCents * it.qty);
    });
    var msg = 'Olá! Quero fazer um pedido na NO SAVE\n\n' +
      'Pedido: ' + order.ref + '\n\n' +
      lines.join('\n') + '\n\n' +
      'Subtotal: ' + money(order.subtotalCents) + '\n' +
      'Entrega: ' + order.delivery + ' (a combinar)\n' +
      '---\n' +
      'Nome: ' + order.name + '\n' +
      'Telefone: ' + order.phone + '\n' +
      'Endereço: ' + order.address + '\n' +
      (order.notes ? 'Observações: ' + order.notes + '\n' : '') +
      '\nEnviar a mensagem não confirma o pedido — aguardo a confirmação do Vitor/Rafael.';
    var itemsHtml = order.items.map(function (it) {
      return '<div class="row"><span>' + it.qty + 'x ' + esc(it.name) + ' — ' + esc(it.color) + ' / ' + esc(it.size) + '</span><strong>' + money(it.priceCents * it.qty) + '</strong></div>';
    }).join('');
    box.innerHTML =
      '<h3>Pedido ' + esc(order.ref) + '</h3>' + itemsHtml +
      '<div class="row"><span>Subtotal</span><strong>' + money(order.subtotalCents) + '</strong></div>' +
      '<div class="row"><span>Entrega</span><strong>' + esc(order.delivery) + ' — sem taxa por enquanto</strong></div>' +
      '<div class="row"><span>Pagamento</span><strong>Pix ou dinheiro (confirmação manual)</strong></div>' +
      '<p class="note" style="margin-top:14px">Anote a referência do pedido: ela identifica a sua mensagem.</p>' +
      '<h3 style="margin-top:22px">Mensagem do pedido</h3>' +
      '<pre id="order-msg">' + esc(msg) + '</pre>' +
      '<button type="button" class="btn block" id="copy-msg">Copiar mensagem do pedido</button>' +
      '<div class="alert warn"><strong>Enviar a mensagem não confirma o pedido.</strong> O pedido só é confirmado quando o Vitor ou o Rafael responder no WhatsApp.</div>' +
      '<div class="alert info"><strong>Envio pelo WhatsApp — em configuração.</strong> A finalização pelo WhatsApp desta vitrine ainda não está liberada: os números não podem ser publicados. Copie a mensagem acima e guarde a referência ' + esc(order.ref) + '. Assim que a finalização for liberada, você envia a mensagem e a loja confirma o pedido. Dúvidas: Instagram @nosavestreet.</div>';
    var copyBtn = $('#copy-msg');
    copyBtn.addEventListener('click', function () {
      var done = function () { toast('Mensagem copiada.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msg).then(done, function () { fallbackCopy(msg); done(); });
      } else { fallbackCopy(msg); done(); }
    });
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------- guia de medidas ---------- */
  function initGuide() {
    $all('[data-guide]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var m = $('#guide-modal');
        if (m) m.classList.add('open');
      });
    });
    $all('[data-close-guide]').forEach(function (b) {
      b.addEventListener('click', function () {
        var m = $('#guide-modal');
        if (m) m.classList.remove('open');
      });
    });
    var modal = $('#guide-modal');
    if (modal) modal.addEventListener('click', function (ev) { if (ev.target === modal) modal.classList.remove('open'); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && modal) modal.classList.remove('open');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateCartBadge();
    initProductPage();
    initCartPage();
    initCheckout();
    initOrderPage();
    initGuide();
  });
})();
