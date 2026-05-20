// Menu Database (5 Coffee Items)
const MENU_ITEMS = [
  {
    id: 'espresso',
    name: '에스프레소',
    engName: 'Espresso',
    desc: '엄선된 원두로 추출하여 묵직한 바디감과 진한 아로마가 특징인 더블 샷 에스프레소',
    price: 1500,
    image: './assets/espresso.png',
    badges: ['best']
  },
  {
    id: 'decaf_americano',
    name: '디카페인 아메리카노',
    engName: 'Decaf Americano',
    desc: '카페인 부담 없이 풍부한 커피의 향과 부드럽고 깔끔한 맛을 살린 아메리카노',
    price: 2500,
    image: './assets/decaf_americano.png',
    badges: ['decaf']
  },
  {
    id: 'caffe_latte',
    name: '카페라떼',
    engName: 'Caffe Latte',
    desc: '에스프레소의 고소한 맛과 부드러운 스팀밀크가 완벽한 조화를 이루는 라떼',
    price: 2900,
    image: './assets/caffe_latte.png',
    badges: []
  },
  {
    id: 'caramel_macchiato',
    name: '카라멜 마키아또',
    engName: 'Caramel Macchiato',
    desc: '부드러운 우유 거품 위에 달콤한 카라멜 소스와 에스프레소가 어우러진 음료',
    price: 3700,
    image: './assets/caramel_macchiato.png',
    badges: ['best']
  },
  {
    id: 'mocha_latte',
    name: '모카라떼',
    engName: 'Mocha Latte',
    desc: '진한 초콜릿 소스와 에스프레소, 스팀밀크에 휘핑 크림을 듬뿍 올린 달콤한 라떼',
    price: 3900,
    image: './assets/mocha_latte.png',
    badges: []
  }
];

// App State
let cart = [];
let orderType = 'dine-in'; // 'dine-in' | 'take-out'
let activePaymentMethod = 'card'; // 'card' | 'applepay' | 'kakaopay' | 'samsungpay'
let selectedProduct = null;
let currentOptions = {
  temp: 'hot',
  shots: 0,
  waterIce: 'normal',
  syrup: 'no',
  quantity: 1
};
let autoRedirectTimer = null;

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const cartItemsContainer = document.getElementById('cart-items');
const emptyCartEl = document.getElementById('empty-cart');
const cartCountEl = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total');
const btnCheckout = document.getElementById('btn-checkout');
const currentTimeEl = document.getElementById('current-time');

// Order Type Buttons
const btnDineIn = document.getElementById('btn-dine-in');
const btnTakeOut = document.getElementById('btn-take-out');

// Dialog elements
const optionDialog = document.getElementById('option-dialog');
const checkoutDialog = document.getElementById('checkout-dialog');

// Modal Elements
const modalProductImg = document.getElementById('modal-product-img');
const modalProductName = document.getElementById('modal-product-name');
const modalProductDesc = document.getElementById('modal-product-desc');
const modalBasePrice = document.getElementById('modal-base-price');
const modalTotalPrice = document.getElementById('modal-total-price');
const modalQtyEl = document.getElementById('modal-qty');
const waterIceLabel = document.getElementById('water-ice-label');

// Initialize Kiosk
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  updateTime();
  setInterval(updateTime, 60000);
  setupEventListeners();
});

// Update Clock
function updateTime() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  currentTimeEl.textContent = `${hours}:${minutes}`;
}

// Setup Event Listeners
function setupEventListeners() {
  // Dine-in / Take-out handlers
  btnDineIn.addEventListener('click', () => setOrderType('dine-in'));
  btnTakeOut.addEventListener('click', () => setOrderType('take-out'));

  // Option Modal - Option buttons click
  setupSegmentControl('opt-temp', 'temp', (val) => {
    // Dynamically change label based on HOT vs ICE
    if (val === 'hot') {
      waterIceLabel.textContent = '물 양 선택';
    } else {
      waterIceLabel.textContent = '얼음 양 선택';
    }
  });
  setupSegmentControl('opt-shots', 'shots');
  setupSegmentControl('opt-water-ice', 'waterIce');
  setupSegmentControl('opt-syrup', 'syrup');

  // Modal Quantity handlers
  document.getElementById('btn-qty-minus').addEventListener('click', () => {
    if (currentOptions.quantity > 1) {
      currentOptions.quantity--;
      updateModalSummary();
    }
  });
  document.getElementById('btn-qty-plus').addEventListener('click', () => {
    currentOptions.quantity++;
    updateModalSummary();
  });

  // Modal actions
  document.getElementById('btn-close-option').addEventListener('click', () => optionDialog.close());
  document.getElementById('btn-add-to-cart').addEventListener('click', addToCart);

  // Cart action
  btnCheckout.addEventListener('click', openCheckout);

  // Checkout actions
  document.getElementById('btn-close-checkout').addEventListener('click', () => checkoutDialog.close());
  document.getElementById('btn-pay-submit').addEventListener('click', processPayment);
  document.getElementById('btn-success-close').addEventListener('click', resetKiosk);

  // Payment method selection
  const payBtns = document.querySelectorAll('.pay-method-btn');
  payBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      payBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePaymentMethod = btn.dataset.method;
    });
  });
}

// Order Type Selection
function setOrderType(type) {
  orderType = type;
  if (type === 'dine-in') {
    btnDineIn.classList.add('active');
    btnTakeOut.classList.remove('active');
  } else {
    btnDineIn.classList.remove('active');
    btnTakeOut.classList.add('active');
  }
}

// Segmented Control Helper
function setupSegmentControl(containerId, stateKey, callback) {
  const container = document.getElementById(containerId);
  const buttons = container.querySelectorAll('.segment-btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const val = btn.dataset.value;
      // Convert to number if it represents shots or prices
      currentOptions[stateKey] = isNaN(val) ? val : parseInt(val, 10);
      
      if (callback) callback(val);
      updateModalSummary();
    });
  });
}

// Render Coffee Menu Grid
function renderMenu() {
  menuGrid.innerHTML = '';
  MENU_ITEMS.forEach(product => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    
    let badgeHTML = '';
    if (product.badges.includes('best')) {
      badgeHTML = `<span class="menu-badge badge-best">Best</span>`;
    } else if (product.badges.includes('decaf')) {
      badgeHTML = `<span class="menu-badge badge-decaf">디카페인</span>`;
    }

    card.innerHTML = `
      ${badgeHTML}
      <div class="menu-card-img-wrapper">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="menu-card-info">
        <h3 class="menu-card-title">${product.name}</h3>
        <p class="menu-card-desc">${product.desc}</p>
        <div class="menu-card-footer">
          <span class="menu-card-price">₩${product.price.toLocaleString()}</span>
          <button class="menu-add-btn" aria-label="옵션 선택">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Click handler to customize options
    card.addEventListener('click', () => openOptionModal(product));
    menuGrid.appendChild(card);
  });
}

// Open Customize Options Dialog
function openOptionModal(product) {
  selectedProduct = product;
  
  // Set default configurations
  currentOptions = {
    temp: 'hot',
    shots: 0,
    waterIce: 'normal',
    syrup: 'no',
    quantity: 1
  };
  
  // Update Product details in Dialog
  modalProductImg.src = product.image;
  modalProductImg.alt = product.name;
  modalProductName.textContent = product.name;
  modalProductDesc.textContent = product.desc;
  modalBasePrice.textContent = `₩${product.price.toLocaleString()}`;
  
  // Reset Segment Active Classes
  resetSegments('opt-temp', currentOptions.temp);
  resetSegments('opt-shots', currentOptions.shots.toString());
  resetSegments('opt-water-ice', currentOptions.waterIce);
  resetSegments('opt-syrup', currentOptions.syrup);
  
  waterIceLabel.textContent = '물 양 선택';
  
  updateModalSummary();
  optionDialog.showModal();
}

// Reset segment control elements back to active defaults
function resetSegments(containerId, value) {
  const container = document.getElementById(containerId);
  const buttons = container.querySelectorAll('.segment-btn');
  buttons.forEach(btn => {
    if (btn.dataset.value === value) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Update option total prices in the modal
function updateModalSummary() {
  let cost = selectedProduct.price;
  
  // Calculate Shot addition price
  if (currentOptions.shots > 0) {
    cost += currentOptions.shots * 500;
  }
  
  // Calculate Syrup price
  if (currentOptions.syrup === 'yes') {
    cost += 500;
  }
  
  const total = cost * currentOptions.quantity;
  
  modalQtyEl.textContent = currentOptions.quantity;
  modalTotalPrice.textContent = `₩${total.toLocaleString()}`;
}

// Add Item to Shopping Cart
function addToCart() {
  const shotsText = currentOptions.shots > 0 ? `+${currentOptions.shots}샷` : '';
  const syrupText = currentOptions.syrup === 'yes' ? '시럽 추가' : '';
  const tempText = currentOptions.temp === 'hot' ? 'HOT' : 'ICE';
  
  let iceWaterDetail = '';
  if (currentOptions.temp === 'hot') {
    iceWaterDetail = `물:${currentOptions.waterIce === 'less' ? '적게' : currentOptions.waterIce === 'more' ? '많이' : '보통'}`;
  } else {
    iceWaterDetail = `얼음:${currentOptions.waterIce === 'less' ? '적게' : currentOptions.waterIce === 'more' ? '많이' : '보통'}`;
  }
  
  // Build Option string for comparison and display
  const optionSummaryArray = [tempText, shotsText, iceWaterDetail, syrupText].filter(Boolean);
  const optionsString = optionSummaryArray.join(', ');
  
  // Custom unique id for card items based on item id and unique option combination
  const optionHash = `${selectedProduct.id}-${currentOptions.temp}-${currentOptions.shots}-${currentOptions.waterIce}-${currentOptions.syrup}`;
  
  // Check if identical item is already in cart
  const existingCartIndex = cart.findIndex(item => item.optionHash === optionHash);
  
  let extraCost = 0;
  if (currentOptions.shots > 0) extraCost += currentOptions.shots * 500;
  if (currentOptions.syrup === 'yes') extraCost += 500;
  const singleUnitCost = selectedProduct.price + extraCost;
  
  if (existingCartIndex > -1) {
    // Increase quantity of existing item
    cart[existingCartIndex].quantity += currentOptions.quantity;
    cart[existingCartIndex].totalCost = cart[existingCartIndex].quantity * cart[existingCartIndex].singleUnitCost;
  } else {
    // Push new item to cart
    cart.push({
      cartId: Date.now(),
      optionHash: optionHash,
      itemId: selectedProduct.id,
      name: selectedProduct.name,
      basePrice: selectedProduct.price,
      singleUnitCost: singleUnitCost,
      optionsText: optionsString,
      quantity: currentOptions.quantity,
      totalCost: currentOptions.quantity * singleUnitCost
    });
  }
  
  optionDialog.close();
  showToast(`${selectedProduct.name}이 장바구니에 담겼습니다.`);
  renderCart();
}

// Display Toast Alert
function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  toast.innerHTML = `
    <div class="toast-icon-wrapper">
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </div>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Slide out and remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 2500);
}

// Render Cart items in Sidebar
function renderCart() {
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.appendChild(emptyCartEl);
    cartCountEl.textContent = '0';
    cartTotalEl.textContent = '₩0';
    btnCheckout.disabled = true;
    return;
  }
  
  emptyCartEl.remove();
  
  let totalCount = 0;
  let totalCost = 0;
  
  cart.forEach(item => {
    totalCount += item.quantity;
    totalCost += item.totalCost;
    
    const card = document.createElement('div');
    card.className = 'cart-item-card';
    card.innerHTML = `
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name}</h4>
        <p class="cart-item-options">${item.optionsText}</p>
      </div>
      <div class="cart-item-bottom">
        <span class="cart-item-price">₩${item.totalCost.toLocaleString()}</span>
        <div class="cart-item-qty-selector">
          <button type="button" class="cart-qty-btn decrease-qty" data-id="${item.cartId}">—</button>
          <span class="cart-qty-number">${item.quantity}</span>
          <button type="button" class="cart-qty-btn increase-qty" data-id="${item.cartId}">+</button>
        </div>
      </div>
      <button type="button" class="cart-item-remove" data-id="${item.cartId}" aria-label="삭제">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    `;
    
    // Quantity modifications in cart
    card.querySelector('.decrease-qty').addEventListener('click', () => updateCartQuantity(item.cartId, -1));
    card.querySelector('.increase-qty').addEventListener('click', () => updateCartQuantity(item.cartId, 1));
    card.querySelector('.cart-item-remove').addEventListener('click', () => removeCartItem(item.cartId));
    
    cartItemsContainer.appendChild(card);
  });
  
  cartCountEl.textContent = totalCount.toString();
  cartTotalEl.textContent = `₩${totalCost.toLocaleString()}`;
  btnCheckout.disabled = false;
}

// Adjust quantity in Cart
function updateCartQuantity(cartId, change) {
  const itemIndex = cart.findIndex(item => item.cartId === cartId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += change;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    } else {
      cart[itemIndex].totalCost = cart[itemIndex].quantity * cart[itemIndex].singleUnitCost;
    }
    renderCart();
  }
}

// Remove single item from Cart
function removeCartItem(cartId) {
  const itemIndex = cart.findIndex(item => item.cartId === cartId);
  if (itemIndex > -1) {
    cart.splice(itemIndex, 1);
    renderCart();
  }
}

// Open Checkout Modal
function openCheckout() {
  // Reset payment view states
  document.getElementById('checkout-step-pay').classList.add('active');
  document.getElementById('checkout-step-processing').classList.remove('active');
  document.getElementById('checkout-step-success').classList.remove('active');
  
  // Set dynamic values in checkout box
  document.getElementById('checkout-order-type').textContent = orderType === 'dine-in' ? '매장 식사' : '포장 하기';
  
  // Populate summary items
  const summaryList = document.getElementById('checkout-summary-items');
  summaryList.innerHTML = '';
  
  let totalCost = 0;
  cart.forEach(item => {
    totalCost += item.totalCost;
    const row = document.createElement('div');
    row.className = 'summary-item-row';
    row.innerHTML = `
      <span class="item-name">${item.name} x${item.quantity}</span>
      <span class="item-price">₩${item.totalCost.toLocaleString()}</span>
    `;
    summaryList.appendChild(row);
  });
  
  document.getElementById('checkout-total-price').textContent = `₩${totalCost.toLocaleString()}`;
  checkoutDialog.showModal();
}

// Process Payment Action (Simulation)
function processPayment() {
  // Switch to processing loader spinner
  document.getElementById('checkout-step-pay').classList.remove('active');
  document.getElementById('checkout-step-processing').classList.add('active');
  
  // Simulating response delay
  setTimeout(() => {
    document.getElementById('checkout-step-processing').classList.remove('active');
    document.getElementById('checkout-step-success').classList.add('active');
    
    // Generate order receipts
    generateReceipt();
  }, 2500);
}

// Generate Receipt Summary
function generateReceipt() {
  // Generate random order number
  const orderNum = Math.floor(Math.random() * 900) + 100; // 100 - 999
  document.getElementById('success-order-num').textContent = orderNum.toString().padStart(4, '0');
  
  // Date format
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  document.getElementById('receipt-date').textContent = dateStr;
  
  // List items
  const listEl = document.getElementById('receipt-items-list');
  listEl.innerHTML = '';
  
  let totalCost = 0;
  cart.forEach(item => {
    totalCost += item.totalCost;
    const row = document.createElement('div');
    row.className = 'receipt-row';
    row.innerHTML = `
      <span>${item.name} x${item.quantity}</span>
      <span>₩${item.totalCost.toLocaleString()}</span>
    `;
    listEl.appendChild(row);
  });
  
  // Translate payment method name
  let payMethodText = '신용카드';
  if (activePaymentMethod === 'applepay') payMethodText = 'Apple Pay';
  else if (activePaymentMethod === 'kakaopay') payMethodText = '카카오페이';
  else if (activePaymentMethod === 'samsungpay') payMethodText = '삼성페이';
  
  document.getElementById('receipt-total-price').textContent = `₩${totalCost.toLocaleString()}`;
  document.getElementById('checkout-total-price').textContent = `₩${totalCost.toLocaleString()}`;
  document.getElementById('receipt-payment-method').textContent = payMethodText;
  
  // Set automatic redirection timer to clean screen in 5 seconds
  if (autoRedirectTimer) clearTimeout(autoRedirectTimer);
  autoRedirectTimer = setTimeout(resetKiosk, 5000);
}

// Reset Kiosk State
function resetKiosk() {
  if (autoRedirectTimer) clearTimeout(autoRedirectTimer);
  
  // Clear cart
  cart = [];
  renderCart();
  
  // Close dialogs
  checkoutDialog.close();
}
