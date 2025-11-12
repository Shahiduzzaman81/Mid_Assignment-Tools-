// code.js - UPDATED
// -----------------
// CHANGED: Full cart, coupon, delivery and add-money logic added
// NOTE: keep this script after the HTML so elements exist when script runs.

// API Calling 
const searchProducts = () => {
  fetch("https://fakestoreapi.com/products")
    .then((res) => res.json())
    .then((data) => showDetails(data));
};

// Get the container
const productsGrid = document.getElementById("display-card");

// Global cart state
let cart = []; // [{id, title, price, qty, image}]
let userBalance = 1000; // CHANGED: initial balance
let couponApplied = false;
let couponCodeApplied = ""; // store code when applied
const DELIVERY_CHARGE = 100; // fixed delivery charge

// Utility - update wallet balance display
const walletBalanceElements = document.querySelectorAll(".walletbalance");
function updateBalanceDisplay() {
  walletBalanceElements.forEach((el) => {
    el.textContent = `${userBalance} BDT`;
  });
}

// CHANGED: call updateBalanceDisplay on load so navbar shows balance immediately
updateBalanceDisplay();

// Function to show products and hook Add-to-Cart buttons
const showDetails = (products) => {
  productsGrid.innerHTML = ""; // Clear previous content
  products.forEach((product) => {
    const productCard = document.createElement('div');
    productCard.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
    
    // CHANGED: display rating safely and provide add-to-cart button with data-id
    productCard.innerHTML = `
      <div class="h-48 overflow-hidden">
        <img src="${product.image}" alt="${product.title}" class="w-full h-full object-contain p-4">
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-lg mb-2 line-clamp-2">${product.title}</h3>
        <div class="flex items-center mb-2">
          <div class="flex text-yellow-400">
            ${"★".repeat(Math.round(product.rating?.rate || 0)).padEnd(0,'')} 
          </div>
          <span class="text-gray-600 text-sm ml-2">${product.rating?.rate || 0} (${product.rating?.count || 0})</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xl font-bold text-primary">${product.price} BDT</span>
          <button class="add-to-cart bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors duration-300" data-id="${product.id}">
            <i class="fas fa-cart-plus mr-2"></i>Add to Cart
          </button>
        </div>
      </div>
    `;
                
    productsGrid.appendChild(productCard);

    // NEW: add event listener for this product's add-to-cart button
    const btn = productCard.querySelector(".add-to-cart");
    btn.addEventListener("click", () => {
      addToCart({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        image: product.image,
      });
    });
  });
};
searchProducts();

// --- Cart functions ---

function addToCart(product) {
  // If product already in cart, increment qty
  const existing = cart.find((p) => p.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  couponApplied = false; // CHANGED: reset coupon when cart changes (so user must reapply)
  couponCodeApplied = "";
  updateCartDisplay();
}

function updateCartDisplay() {
  // total products = sum of qty
  const totalProducts = cart.reduce((sum, p) => sum + p.qty, 0);
  const subtotal = cart.reduce((sum, p) => sum + p.price * p.qty, 0);

  // delivery charge only when there are items
  const deliveryCharge = subtotal > 0 ? DELIVERY_CHARGE : 0;

  // compute discount if coupon applied (coupon gives 10% on subtotal)
  let discount = 0;
  if (couponApplied && couponCodeApplied.toLowerCase() === "lucky10") {
    discount = +(subtotal * 0.10).toFixed(2); // 10% discount
  }

  // grand total
  const grandTotal = +(subtotal - discount + deliveryCharge).toFixed(2);

  // update DOM elements (make sure these ids exist in HTML)
  document.getElementById("total-products").textContent = totalProducts;
  document.getElementById("price").textContent = `${subtotal.toFixed(2)} BDT`;
  document.getElementById("delivery-charge").textContent = `${deliveryCharge} BDT`;
  document.getElementById("subtotal").textContent = `${(subtotal - discount).toFixed(2)} BDT`; // show subtotal after discount
  document.getElementById("grandTotal").textContent = `${grandTotal} BDT`;

  // optional details message
  const details = document.getElementById("details");
  details.innerHTML = `
    <div>
      ${cart.length === 0 ? "<small>Cart is empty</small>" : `<small>${cart.length} item(s) in cart</small>`}
      ${couponApplied ? `<div class="text-green-600">Coupon "${couponCodeApplied}" applied. Discount: ${discount.toFixed(2)} BDT</div>` : ""}
    </div>
  `;
}

// Order button action (keeps simple)
function orderProducts() {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }
  // Here you might process payment - for demo, we check userBalance >= grandTotal
  const subtotal = cart.reduce((sum, p) => sum + p.price * p.qty, 0);
  const discount = couponApplied && couponCodeApplied.toLowerCase() === "lucky10" ? +(subtotal * 0.10).toFixed(2) : 0;
  const deliveryCharge = subtotal > 0 ? DELIVERY_CHARGE : 0;
  const grandTotal = +(subtotal - discount + deliveryCharge).toFixed(2);

  if (userBalance < grandTotal) {
    if (!confirm(`Insufficient balance (${userBalance} BDT). Add money or continue?`)) return;
  }

  // For demo: deduct from balance and clear cart
  userBalance = +(userBalance - grandTotal).toFixed(2);
  updateBalanceDisplay();
  cart = [];
  couponApplied = false;
  couponCodeApplied = "";
  updateCartDisplay();
  alert(`Order placed. ${grandTotal} BDT deducted from wallet.`);
}

// --- Coupon and Add Money UI wiring ---

// CHANGED: get coupon input and apply button by id created in HTML changes
const couponInput = document.getElementById("couponCode");
const applyCouponBtn = document.getElementById("applyCoupon");

applyCouponBtn.addEventListener("click", () => {
  const code = (couponInput.value || "").trim();
  if (!code) {
    alert("Enter a coupon code.");
    return;
  }

  if (code.toLowerCase() === "lucky10") {
    // apply 10% discount on subtotal
    couponApplied = true;
    couponCodeApplied = code;
    updateCartDisplay();
    alert("Coupon applied: 10% off on subtotal.");
  } else {
    alert("Invalid coupon code.");
  }
});

// CHANGED: add money button logic
const addMoneyBtn = document.getElementById("addMoneyBtn");
addMoneyBtn.addEventListener("click", () => {
  // add fixed 1000 as requested
  userBalance += 1000;
  updateBalanceDisplay();
  alert("1000 BDT added to wallet.");
});

// --- Reviews slider fixes ---
// CHANGED: fix translate(0) usage and also keep current logic (they had a bug earlier)
const reviewSlider = document.getElementById("review-slider");
let reviewNumber = 1; // start with first review
let totalSlides = 0;
// showReviews function is in original code and sets totalSlides

function nextReview() {
  if (reviewNumber < totalSlides) {
    reviewSlider.style.transform = `translate(-${reviewNumber * 100}%)`;
    reviewNumber++;
  } else {
    reviewSlider.style.transform = `translate(0)`; // CHANGED: proper string
    reviewNumber = 1;
  }
}

function prevReview() {
  if (reviewNumber > 1) {
    reviewSlider.style.transform = `translate(-${(reviewNumber - 2) * 100}%)`;
    reviewNumber--;
  } else {
    reviewSlider.style.transform = `translate(-${(totalSlides - 1) * 100}%)`;
    reviewNumber = totalSlides;
  }
}

// Event listeners for review buttons (ensure these ids exist)
const nextReviewBtn = document.getElementById("nextReview");
const prevReviewBtn = document.getElementById("prevReview");
if (nextReviewBtn) nextReviewBtn.addEventListener("click", nextReview);
if (prevReviewBtn) prevReviewBtn.addEventListener("click", prevReview);

// Auto-slide every 4 seconds
setInterval(nextReview, 4000);

// --- Reviews fetch (kept from your original code but fixed variable scope) ---
fetch("reviews.json")
  .then((res) => res.json())
  .then((data) => {
    // CHANGED: use showReviews as function scope to set totalSlides
    totalSlides = data.length;
    data.forEach((review) => {
      const card = document.createElement("div");
      card.classList.add("min-w-full", "p-4"); // each slide full width
      card.innerHTML = `
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              ${review.name.charAt(0)}
            </div>
            <div class="ml-4">
              <h4 class="font-semibold text-gray-800">${review.name}</h4>
              <p class="text-sm text-gray-500">${review.date}</p>
            </div>
          </div>
          <div class="text-yellow-500 mb-3">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div>
          <p class="text-gray-600">${review.comment}</p>
        </div>
      `;
      reviewSlider.appendChild(card);
    });
  })
  .catch((err) => {
    console.error("Failed to load reviews.json", err);
  });

// --- End of code.js ---
