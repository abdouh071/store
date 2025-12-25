// ==================== Constants ====================
const PRODUCTS_API = "/api/products";
const ORDERS_API = "/api/orders";
const DZAYER_API = "/api/dz"; // ⭐ Use proxy to avoid CORS
window.allProducts = window.allProducts || []; // store all products for consistent rendering

// ==================== Site Settings Applier ====================
async function applySiteSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return;
    
    const settings = await res.json();
    
    // Store Name / Logo
    const logos = document.querySelectorAll('.logo');
    logos.forEach(logo => {
      if (settings.logoUrl) {
        // Replace text with image
        logo.innerHTML = `<a href="index.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;">
          <img src="${settings.logoUrl}" alt="${settings.storeName}" style="height:32px;object-fit:contain;">
          <span>${settings.storeName}</span>
        </a>`;
      } else if (settings.storeName) {
        // Text only
        const link = logo.querySelector('a');
        if (link) {
          link.textContent = settings.storeName;
        } else {
          logo.innerHTML = `<a href="index.html" style="color:inherit;text-decoration:none;">${settings.storeName}</a>`;
        }
      }
    });
    
    // Hero Section (only on index.html)
    // Skip elements with data-i18n attributes - let the translation system handle them
    const heroTitle = document.querySelector('.hero-text h2');
    const heroSubtitle = document.querySelector('.hero-text p');
    if (heroTitle && settings.heroTitle && !heroTitle.hasAttribute('data-i18n')) {
      heroTitle.textContent = settings.heroTitle;
    }
    if (heroSubtitle && settings.heroSubtitle && !heroSubtitle.hasAttribute('data-i18n')) {
      heroSubtitle.textContent = settings.heroSubtitle;
    }
    
    // Category Titles (only on index.html)
    if (settings.categoryTitles) {
      const topRatedH2 = document.querySelector('#top-rated > h2');
      const trendingH2 = document.querySelector('#trending .section-header h2, #trending > h2');
      const newArrivalsH2 = document.querySelector('#new-arrivals > h2');
      const featuredH2 = document.querySelector('#featured-collection .section-header h2');
      
      if (topRatedH2 && settings.categoryTitles.topRated) topRatedH2.textContent = settings.categoryTitles.topRated;
      if (trendingH2 && settings.categoryTitles.trending) trendingH2.textContent = settings.categoryTitles.trending;
      if (newArrivalsH2 && settings.categoryTitles.newArrivals) newArrivalsH2.textContent = settings.categoryTitles.newArrivals;
      if (featuredH2 && settings.categoryTitles.featuredCollection) featuredH2.textContent = settings.categoryTitles.featuredCollection;
    }
    
    // Footer
    const footerDesc = document.querySelector('.footer-section p');
    if (footerDesc && settings.footerText) footerDesc.textContent = settings.footerText;
    
    // Footer Store Name
    const footerTitle = document.querySelector('.footer-section h3');
    if (footerTitle && settings.storeName) footerTitle.textContent = settings.storeName;
    
  } catch (err) {
    console.error('Failed to apply site settings:', err);
  }
}

// ==================== Skeleton Loading ====================
// ==================== Skeleton Loading ====================
function getSkeletonHTML(count) {
  return Array(count).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-price"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>
  `).join('');
}

function showSkeletonLoading(container, count = 6) {
  if (!container) return;
  container.innerHTML = getSkeletonHTML(count);
}

// ==================== Mobile Menu & Auth ====================
// ==================== Mobile Menu & Global UI ====================
function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  const mobileOverlay = document.getElementById('mobileOverlay');
  const closeMenuBtn = document.getElementById('closeMenu');

  function toggleMenu() {
    if (!navLinks || !mobileOverlay) return;
    navLinks.classList.toggle('active');
    mobileOverlay.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
  }

  if (menuToggle) menuToggle.addEventListener('click', toggleMenu);

  if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', () => {
      if (navLinks && navLinks.classList.contains('active')) toggleMenu();
    });
  }

  if (mobileOverlay) mobileOverlay.addEventListener('click', toggleMenu);

  // Close menu when clicking any item inside (links, buttons, or icons)
  if (navLinks) {
    navLinks.addEventListener('click', (e) => {
      // If the clicked element is a link, button, or common interactive element
      const target = e.target.closest('a, button, .theme-toggle, .cart-icon, .wishlist-icon');
      if (target && navLinks.classList.contains('active')) {
        // Delay slightly to allow the primary action (like theme toggle) to fire
        setTimeout(() => {
          if (navLinks.classList.contains('active')) toggleMenu();
        }, 100);
      }
    });
  }

  // Expose toggle function globally for external calls (like switchLanguage)
  window.closeMobileMenu = () => {
    if (navLinks && navLinks.classList.contains('active')) toggleMenu();
  };

  // --- Search Logic (Desktop & Mobile) ---
  const searchInputs = document.querySelectorAll('#navSearchInput, #mobileSearchInput');
  searchInputs.forEach(searchInput => {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `store.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  });
}

// ==================== Cart Logic ====================
function triggerCartAnimation() {
  const cartIcons = document.querySelectorAll('.cart-icon, .bottom-nav-item[href="#"][onclick*="cartSidebar"] .bottom-nav-icon');
  
  cartIcons.forEach(icon => {
    // Reset animation if needed
    icon.classList.remove('animate');
    void icon.offsetWidth; // Force reflow
    icon.classList.add('animate');
    
    // Remove class after animation to clean up
    setTimeout(() => {
      icon.classList.remove('animate');
    }, 600); // Matches animation duration
  });
}

// ==================== Auth Logic (REMOVED) ====================
// Auth has been removed as per user request. 
// Site now operates in guest mode only.


// ==================== DZAYER API (Wilayas & Communes) ====================
async function loadWilayas() {
  try {
    const res = await fetch(`/api/wilayas`);
    const data = await res.json();

    const wilayaSelect =
      document.getElementById("wilaya") ||
      document.getElementById("customerWilaya");

    if (!wilayaSelect) return;

    // Translation setup
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    const t = window.translations[savedLang] || window.translations['en'];

    wilayaSelect.innerHTML =
      `<option value="">${t.select_wilaya || 'Select wilaya'}</option>` +
      data
        .map(w => `<option value="${w.wilayaCode}">${w.wilayaCode} - ${w.nameFr} (${w.nameAr})</option>`)
        .join("");

  } catch (err) {
    console.error("Failed to load wilayas:", err);
  }
}

async function loadCommunes(wilayaCode) {
  try {
    const res = await fetch(`/api/wilayas/${wilayaCode}/communes`);
    const data = await res.json();

    const communeSelect =
      document.getElementById("commune") ||
      document.getElementById("customerCommune");

    if (!communeSelect) return;

    // Translation setup
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    const t = window.translations[savedLang] || window.translations['en'];

    communeSelect.innerHTML =
      `<option value="">${t.select_commune || 'Select commune'}</option>` +
      data
        .map(c => `<option value="${c.nameFr}">${c.nameFr} (${c.nameAr})</option>`)
        .join("");
  } catch (err) {
    console.error("Failed to load communes:", err);
  }
}

// ==================== Description Toggle ====================
window.toggleDescription = function() {
  const content = document.getElementById('descContent');
  const btn = document.getElementById('toggleDescBtn');
  
  if (!content || !btn) return;
  
  const isExpanded = content.classList.contains('expanded');
  
  if (isExpanded) {
    content.classList.remove('expanded');
    btn.innerHTML = 'Read More <span class="arrow">▼</span>';
  } else {
    content.classList.add('expanded');
    btn.innerHTML = 'Read Less <span class="arrow">▼</span>';
  }
};

// ==================== Utilities ====================
function getProductIdFromURL() {
  return new URLSearchParams(window.location.search).get("id");
}

// ==================== Spotlight Mode Logic ====================
function setupFormFocusMode() {
  const form = document.getElementById('productOrderForm');
  if (!form) return;
  
  // Use focusin/focusout to catch events from children
  form.addEventListener('focusin', () => {
    document.body.classList.add('form-focused');
  });

  form.addEventListener('focusout', (e) => {
    // Delay check to see where focus went
    setTimeout(() => {
      // If active element is NOT inside the form, disable mode
      if (!form.contains(document.activeElement)) {
        document.body.classList.remove('form-focused');
      }
    }, 50);
  });
}

// ==================== Wishlist Logic ====================
function getWishlist() {
  return JSON.parse(localStorage.getItem('clothingStoreWishlist') || '[]');
}

function checkWishlistState(id) {
  const wishlist = getWishlist();
  return wishlist.some(item => item._id === id);
}
window.checkWishlistState = checkWishlistState;

// Format price with discount (Enhanced)
window.getPriceHTML = function(price, previousPrice, isProductPage = false) {
  if (previousPrice && previousPrice > price) {
    const discount = Math.round(((previousPrice - price) / previousPrice) * 100);
    
    // More impactful styling for product page (badge on image instead)
    if (isProductPage) {
      return `
        <div class="price-display-enhanced">
          <div class="price-row">
            <span class="original-price-large">$${previousPrice.toFixed(2)}</span>
            <span class="current-price-large">$${price.toFixed(2)}</span>
          </div>
        </div>
      `;
    }
    
    // Standard display for cards
    return `
      <span class="original-price">$${previousPrice.toFixed(2)}</span>
      <span class="current-price">$${price.toFixed(2)}</span>
      <span class="discount-badge">-${discount}%</span>
    `;
  }
  
  // No discount
  if (isProductPage) {
    return `<span class="current-price-large">$${price.toFixed(2)}</span>`;
  }
  return `<span class="current-price">$${price.toFixed(2)}</span>`;
};

function updateWishlistCount() {
  const wishlist = getWishlist();
  const badge = document.querySelector('.wishlist-badge');
  if (badge) {
    badge.textContent = wishlist.length;
    badge.style.display = wishlist.length > 0 ? 'flex' : 'none';
  }
}

// Make globally available
window.toggleWishlist = function(btn, id, name, price, img, cat) {
  // Prevent card click if inside a card
  if (event) event.stopPropagation();

  let wishlist = getWishlist();
  const index = wishlist.findIndex(item => item._id === id);
  
  if (index !== -1) {
    // Remove
    wishlist.splice(index, 1);
    btn.classList.remove('active');
    showToast(`Removed ${name} from wishlist`);
  } else {
    // Add
    wishlist.push({ _id: id, name, price, imageUrl: img, category: cat });
    btn.classList.add('active');
    
    // Add animation effect
    btn.style.transform = 'scale(1.3)';
    setTimeout(() => btn.style.transform = 'scale(1)', 200);
    
    showToast(`Added ${name} to wishlist`);
  }
  
  localStorage.setItem('clothingStoreWishlist', JSON.stringify(wishlist));
  updateWishlistCount();
  
  // Update other buttons for same product if any
  document.querySelectorAll(`.btn-wishlist[data-id="${id}"], .btn-wishlist-detail[data-id="${id}"]`).forEach(b => {
    if (b !== btn) {
      if (index !== -1) b.classList.remove('active');
      else b.classList.add('active');
    }
  });

};

// Initialize wishlist count on load (Moved to initApp)

// ==================== Carousel Setup ====================
function setupCarousel(products) {
  const track = document.querySelector(".carousel-track");
  const indicatorsContainer = document.querySelector(".carousel-indicators");
  if (!track || !indicatorsContainer) return;

  const featured = products.slice(0, 3);

  track.innerHTML = featured
    .map(
      p => `
    <div class="carousel-item">
      <img src="${p.imageUrl || 'placeholder.jpg'}" alt="${p.name}">
      <div class="carousel-caption">
        <h2>${p.name}</h2>
        <p>${p.description || ''}</p>
        <button onclick="location.href='/product.html?id=${p._id}'">View Product</button>
      </div>
    </div>
  `
    )
    .join("");

  indicatorsContainer.innerHTML = featured
    .map((_, i) => `<span class="indicator ${i === 0 ? "active" : ""}" data-index="${i}"></span>`)
    .join("");

  const items = Array.from(track.children);
  const indicators = Array.from(indicatorsContainer.children);
  const nextBtn = document.querySelector(".carousel-btn.next");
  const prevBtn = document.querySelector(".carousel-btn.prev");

  let currentIndex = 0;

  function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    indicators.forEach((dot, i) => dot.classList.toggle("active", i === currentIndex));
  }

  nextBtn?.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % items.length;
    updateCarousel();
  });

  prevBtn?.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateCarousel();
  });

  indicators.forEach(dot => {
    dot.addEventListener("click", () => {
      currentIndex = parseInt(dot.dataset.index);
      updateCarousel();
    });
  });

  setInterval(() => {
    currentIndex = (currentIndex + 1) % items.length;
    updateCarousel();
  }, 5000);
}

// ==================== Store Page ====================
function getSkeletonHTML(count) {
  return Array(count).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-price"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>
  `).join('');
}

// ==================== Store Page ====================
async function loadProducts(category = "") {
  const container =
    document.getElementById("products") ||
    document.getElementById("product-list");
  
  const carouselTrack = document.querySelector(".carousel-track");

  // If neither container nor carousel exists, do nothing
  if (!container && !carouselTrack) return;

  // Show skeletons only if container exists
  if (container) {
    container.innerHTML = getSkeletonHTML(8);
  }

  let url = PRODUCTS_API;
  if (category) url += `?category=${encodeURIComponent(category)}`;

  try {
    const res = await fetch(url);
    const products = await res.json();

    if (!allProducts.length) allProducts = products;

    // Setup Carousel if exists (using all products, not filtered by category usually)
    if (carouselTrack) {
      setupCarousel(allProducts);
    }

    // If no container, we are done (just needed carousel)
    if (!container) return;

    container.innerHTML = "";

    if (!products.length) {
      container.innerHTML = `
        <div class="no-results">
          <p>No products found in this category.</p>
        </div>`;
      return;
    }

    products.forEach(p => {
      const isOut = p.quantity <= 0;
      const card = document.createElement("div");
      card.className = `product-card ${isOut ? "out-of-stock" : ""}`;

      // Only make the card clickable if the product is in stock
      if (!isOut) {
        card.style.cursor = "pointer";
        card.addEventListener("click", () => {
          window.location.href = `product.html?id=${p._id}`;
        });
      }



      let saleBadge = '';
      if (p.previousPrice && p.previousPrice > p.price) {
        const percent = Math.round(((p.previousPrice - p.price) / p.previousPrice) * 100);
        saleBadge = `<div class="sale-badge">-${percent}%</div>`;
      }

      card.innerHTML = `
        <div class="product-image">
          ${saleBadge}
          <img src="${p.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'}" alt="${p.name}">
          ${isOut ? `<span class="badge not-available" data-i18n="not_available">${t.not_available || 'Not Available'}</span>` : ""}
          <button class="btn-wishlist ${checkWishlistState(p._id) ? 'active' : ''}" 
            data-id="${p._id}"
            onclick="toggleWishlist(this, '${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.imageUrl || 'placeholder.jpg'}', '${p.category || ''}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
          <button class="btn-add-cart-mobile" onclick="event.stopPropagation(); addToCart('${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.imageUrl || 'placeholder.jpg'}', 1); showToast('Added to cart'); triggerCartAnimation();">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </button>
        </div>
        <div class="product-info">
          <h3 class="product-title">${p.name}</h3>
          <p class="product-desc">${(function(){const d=p.description||'Great quality product.';const l=35;return d.length>l?d.substring(0,l)+'<span style="color:#dc2626;font-weight:600;margin-left:2px;">...more</span>':d;})()}</p>
          <div class="product-price">${window.getPriceHTML(p.price, p.previousPrice)}</div>
          ${p.quantity > 0 && p.quantity <= 5 ? `<div class="stock-warning">Only ${p.quantity} left!</div>` : ''}
        </div>
      `;

      if (!isOut) {
        // Order Now button
        const orderBtn = card.querySelector(".btn-order-now");
        if (orderBtn) {
          orderBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent card click
            window.location.href = `product.html?id=${p._id}`;
          });
        }

        // Add to Cart button
        const cartBtn = card.querySelector(".btn-add-cart");
        if (cartBtn) {
          cartBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent card click
            addToCart(p._id, p.name, p.price, p.imageUrl || 'placeholder.jpg', 1);
          });
        }
      }

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading products:", err);
    if (container) {
      container.innerHTML = `<p class="error-msg">Failed to load products. Please try again later.</p>`;
    }
  }
}

// ==================== Product Detail Page ====================
async function loadProduct() {
  const id = getProductIdFromURL();
  const savedLang = localStorage.getItem('preferredLanguage') || 'en';
  const t = window.translations[savedLang] || window.translations['en'];
  
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("desc");
  const priceEl = document.getElementById("price");
  const imgEl = document.getElementById("img");

  if (!id) {
    if (titleEl) titleEl.textContent = "No Product Selected";
    if (descEl) descEl.textContent = "Please select a product from the home page.";
    if (priceEl) priceEl.style.display = "none";
    return;
  }

  // Show skeletons
  const imgCol = document.querySelector('.product-image-col');
  const infoCol = document.querySelector('.product-info-col');
  
  if (imgCol && infoCol) {
    if (titleEl) titleEl.innerHTML = '<div class="skeleton detail-skeleton-title"></div>';
    if (descEl) descEl.innerHTML = '<div class="skeleton detail-skeleton-desc"></div>';
    if (priceEl) priceEl.innerHTML = '<div class="skeleton detail-skeleton-price"></div>';
    
    if (imgEl) {
      const imgSkeleton = document.createElement('div');
      imgSkeleton.className = 'skeleton detail-skeleton-img';
      imgSkeleton.id = 'temp-img-skeleton';
      imgEl.style.display = 'none';
      imgEl.parentNode.insertBefore(imgSkeleton, imgEl);
    }
  }

  try {
    const res = await fetch(`${PRODUCTS_API}/${id}`);
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Product not found");
    }
    
    const p = await res.json();

    // Remove skeletons
    const imgSkeleton = document.getElementById('temp-img-skeleton');
    if (imgSkeleton) imgSkeleton.remove();
    if (imgEl) imgEl.style.display = 'block';
    if (titleEl) titleEl.textContent = p.name;

    // Update Breadcrumb Navigation
    const breadcrumbCategory = document.getElementById("breadcrumbCategory");
    const breadcrumbProduct = document.getElementById("breadcrumbProduct");
    
    if (breadcrumbCategory && p.category) {
      const categoryDisplay = p.category.charAt(0).toUpperCase() + p.category.slice(1);
      breadcrumbCategory.textContent = categoryDisplay;
      breadcrumbCategory.href = `store.html?category=${encodeURIComponent(p.category)}`;
    }
    
    if (breadcrumbProduct) {
      breadcrumbProduct.textContent = p.name;
    }
    
    // Stock Warning
    const warningEl = document.getElementById("stockWarning");
    if (warningEl) {
      if (p.quantity > 0 && p.quantity <= 5) {
        warningEl.innerHTML = `<div class="stock-warning" style="font-size: 1rem; margin-bottom: 12px;">🔥 Only ${p.quantity} left in stock! Order soon.</div>`;
      } else {
        warningEl.innerHTML = '';
      }
    }
    
    window._currentProductStock = p.quantity || 99;
    
    if (descEl) descEl.textContent = p.description;

    // Check description height for accordion logic
    setTimeout(() => {
       const descContent = document.getElementById('descContent');
       const toggleBtn = document.getElementById('toggleDescBtn');
       if (descContent && toggleBtn && descEl) {
           if (descEl.scrollHeight > 80) {
               toggleBtn.style.display = 'flex';
               descContent.classList.remove('short');
           } else {
               toggleBtn.style.display = 'none';
               descContent.classList.add('short');
           }
       }
    }, 50);

    if (priceEl) priceEl.innerHTML = window.getPriceHTML(p.price, p.previousPrice, true);
    if (imgEl) imgEl.src = p.imageUrl || "placeholder.jpg";

    // Update floating price badge (for mobile)
    const floatingPriceBadge = document.getElementById("floatingPrice");
    if (floatingPriceBadge) {
      if (p.previousPrice && p.previousPrice > p.price) {
        floatingPriceBadge.innerHTML = `<span class="original-price">$${p.previousPrice.toFixed(2)}</span><span class="current-price">$${p.price.toFixed(2)}</span>`;
      } else {
        floatingPriceBadge.textContent = `$${p.price.toFixed(2)}`;
      }
    }



    // Update sale badge on image (discount percentage)
    const saleBadge = document.getElementById("productSaleBadge");
    if (saleBadge) {
      if (p.previousPrice && p.previousPrice > p.price) {
        const discount = Math.round(((p.previousPrice - p.price) / p.previousPrice) * 100);
        saleBadge.textContent = `-${discount}%`;
        saleBadge.style.display = 'block';
      } else {
        saleBadge.style.display = 'none';
      }
    }

    // --- RENDER THUMBNAILS WITH SWIPE SUPPORT ---
    const thumbnailsContainer = document.getElementById('thumbnails');
    let productImages = []; // Store for swipe functionality
    
    if (thumbnailsContainer && p.images && p.images.length > 0) {
      // Include main image as first thumbnail
      const allImages = [p.imageUrl, ...p.images].filter(Boolean);
      // Deduplicate
      productImages = [...new Set(allImages)];
      
      if (productImages.length > 1) {
        thumbnailsContainer.innerHTML = productImages.map((imgUrl, index) => `
          <img src="${imgUrl}" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}" onclick="changeMainImage(this, '${imgUrl}', ${index})">
        `).join('');
        
        // Initialize swipe gestures on main image
        initImageSwipe(productImages);
      } else {
        thumbnailsContainer.innerHTML = '';
      }
    } else if (thumbnailsContainer) {
      thumbnailsContainer.innerHTML = '';
    }

    // --- RENDER VARIANTS ---
    // Store selected variants dynamically
    const selectedVariants = {};

    // Parse all variants from backend structure
    let allVariants = [];
    
    if (p.variants && Array.isArray(p.variants)) {
      allVariants = p.variants.filter(v => v.name && v.options && v.options.length > 0);
    }
    
    // Fallback to legacy color/size fields
    if (allVariants.length === 0) {
      if (p.colors && p.colors.length > 0) {
        allVariants.push({ name: 'Color', options: p.colors });
      }
      if (p.sizes && p.sizes.length > 0) {
        allVariants.push({ name: 'Size', options: p.sizes });
      }
    }

    const dynamicVariantsContainer = document.getElementById('dynamicVariants');
    
    if (dynamicVariantsContainer && allVariants.length > 0) {
      dynamicVariantsContainer.innerHTML = allVariants.map((variant, index) => {
        const variantName = variant.name;
        const variantId = variantName.toLowerCase().replace(/\s+/g, '-');
        const isColorType = variantName.toLowerCase().includes('color') || variantName.toLowerCase().includes('couleur');
        
        return `
          <div class="variant-group" id="variantGroup-${variantId}">
            <label>${variantName}</label>
            <div class="variant-options" id="variantOptions-${variantId}">
              ${variant.options.map(option => {
                if (isColorType) {
                  return `<div class="color-swatch" style="background-color: ${option.toLowerCase()};" title="${option}" onclick="selectVariant('${variantName}', this, '${option}')"></div>`;
                } else {
                  return `<div class="size-btn" onclick="selectVariant('${variantName}', this, '${option}')">${option}</div>`;
                }
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    } else if (dynamicVariantsContainer) {
      dynamicVariantsContainer.innerHTML = '';
    }

    // Unified variant selection function
    window.selectVariant = (variantName, el, value) => {
      const variantId = variantName.toLowerCase().replace(/\s+/g, '-');
      const container = document.getElementById(`variantOptions-${variantId}`);
      
      if (container) {
        container.querySelectorAll('.color-swatch, .size-btn').forEach(item => item.classList.remove('active'));
        el.classList.add('active');
      }
      
      selectedVariants[variantName] = value;
      
      // Sync with form variant (if exists)
      const formEl = document.querySelector(`[data-form-variant="${variantName}"][data-value="${value}"]`);
      if (formEl) {
        const formContainer = formEl.closest('.variant-options');
        if (formContainer) {
          formContainer.querySelectorAll('.color-swatch, .size-btn').forEach(item => item.classList.remove('active'));
          formEl.classList.add('active');
        }
      }
      
      // Update variant summary display
      updateVariantSummary(selectedVariants);
      updateFormVariantSummary();
    };

    // Function to update the variant summary display
    function updateVariantSummary(variants) {
      const summaryEl = document.getElementById('variantSummary');
      const summaryTextEl = document.getElementById('variantSummaryText');
      
      if (!summaryEl || !summaryTextEl) return;
      
      const selectedItems = Object.entries(variants)
        .filter(([key, value]) => value)
        .map(([key, value]) => `${key}: ${value}`);
      
      if (selectedItems.length > 0) {
        summaryTextEl.innerHTML = selectedItems.join('<span class="variant-summary-divider">•</span>');
        summaryEl.style.display = 'flex';
      } else {
        summaryEl.style.display = 'none';
      }
    }

    // Keep backward compatibility for color/size
    let selectedColor = null;
    let selectedSize = null;
    let colors = allVariants.find(v => v.name.toLowerCase() === 'color')?.options || [];
    let sizes = allVariants.find(v => v.name.toLowerCase() === 'size')?.options || [];

    // Expose selection functions globally so onclick works
    window.changeMainImage = (el, src, index = 0) => {
      document.getElementById('img').src = src;
      document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
      if (el) el.classList.add('active');
      window._currentImageIndex = index;
    };

    window.selectColor = (el, color) => {
      document.querySelectorAll('.color-swatch').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      selectedColor = color;
    };
    
    // Load Related Products
    loadRelatedProducts(p.category, p._id);
    
    // Load Reviews
    loadProductReviews(id);

    window.selectSize = (el, size) => {
      document.querySelectorAll('.size-btn').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
      selectedSize = size;
      
      // Sync with form
      const formBtn = document.querySelector(`.form-size-btn[data-size="${size}"]`);
      if (formBtn) {
        document.querySelectorAll('.form-size-btn').forEach(b => b.classList.remove('active'));
        formBtn.classList.add('active');
        updateFormVariantSummary();
      }
    };

    // --- RECENTLY VIEWED LOGIC ---
    addToRecentlyViewed(p);
    loadRecentlyViewed();

    // --- STICKY ADD TO CART BAR (Mobile) - Enhanced ---
    const body = document.body;
    let stickyBar = document.getElementById('stickyCartBar');
    
    // Create if not exists
    if (!stickyBar) {
      stickyBar = document.createElement('div');
      stickyBar.id = 'stickyCartBar';
      stickyBar.className = 'sticky-cart-bar';
      stickyBar.innerHTML = `
        <div class="sticky-product-info">
          <span class="sticky-product-title" id="stickyTitle"></span>
          <div class="sticky-product-price" id="stickyPrice"></div>
        </div>
        <button class="sticky-add-btn" id="stickyAddBtn">Add to Cart</button>
      `;
      body.appendChild(stickyBar);
    }
    
    // Update Content with compact price format
    document.getElementById('stickyTitle').textContent = p.name;
    
    // Custom compact price for sticky bar
    const stickyPriceEl = document.getElementById('stickyPrice');
    if (p.previousPrice && p.previousPrice > p.price) {
      stickyPriceEl.innerHTML = `
        <span class="original-price">$${p.previousPrice.toFixed(2)}</span>
        <span>$${p.price.toFixed(2)}</span>
      `;
    } else {
      stickyPriceEl.textContent = `$${p.price.toFixed(2)}`;
    }
    
    const stickyBtn = document.getElementById('stickyAddBtn');
    // Remove old listeners by cloning
    const newStickyBtn = stickyBtn.cloneNode(true);
    stickyBtn.parentNode.replaceChild(newStickyBtn, stickyBtn);
    
    newStickyBtn.addEventListener('click', () => {
      // Trigger main add to cart logic
      const mainBtn = document.getElementById('addToCartBtn');
      if (mainBtn) mainBtn.click();
    });
    
    // Scroll Listener - Show when Add to Cart button is out of view
    const handleStickyScroll = () => {
      const mainBtn = document.getElementById('addToCartBtn');
      if (!mainBtn) return;
      
      const rect = mainBtn.getBoundingClientRect();
      
      // Show sticky bar when main button is scrolled out of view (above viewport)
      if (rect.bottom < 0) {
        stickyBar.classList.add('visible');
      } else {
        stickyBar.classList.remove('visible');
      }
    };
    
    // Remove any existing scroll listener and add new one
    window.removeEventListener('scroll', window._stickyScrollHandler);
    window._stickyScrollHandler = handleStickyScroll;
    window.addEventListener('scroll', handleStickyScroll, { passive: true });

    // --- POPULATE FORM VARIANTS ---
    const formVariantSelection = document.getElementById('formVariantSelection');
    const formColorOptions = document.getElementById('formColorOptions');
    const formSizeOptions = document.getElementById('formSizeOptions');
    const formVariantSummary = document.getElementById('formVariantSummary');

    if (formVariantSelection && allVariants.length > 0) {
      // Dynamically render all variants in the form
      formColorOptions.innerHTML = ''; // Clear
      formSizeOptions.innerHTML = ''; // Clear
      
      let formVariantsHTML = allVariants.map(variant => {
        const variantName = variant.name;
        const variantId = variantName.toLowerCase().replace(/\s+/g, '-');
        const isColorType = variantName.toLowerCase().includes('color') || variantName.toLowerCase().includes('couleur');
        
        return `
          <div class="form-variant-group" style="margin-bottom: 15px;">
            <label class="variant-label">Choose a ${variantName}:</label>
            <div class="${isColorType ? 'variant-swatches' : 'variant-buttons'}">
              ${variant.options.map(option => {
                if (isColorType) {
                  return `<div class="color-swatch form-color-swatch" 
                       style="background-color: ${option.toLowerCase()};" 
                       title="${option}" 
                       data-form-variant="${variantName}"
                       data-value="${option}"
                       onclick="selectFormVariant('${variantName}', this, '${option}')"></div>`;
                } else {
                  return `<div class="size-btn form-size-btn" 
                       data-form-variant="${variantName}"
                       data-value="${option}"
                       onclick="selectFormVariant('${variantName}', this, '${option}')">${option}</div>`;
                }
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
      
      formColorOptions.innerHTML = formVariantsHTML;
      formVariantSelection.style.display = 'block';
    } else if (formVariantSelection) {
      formVariantSelection.style.display = 'none';
    }

    // Unified form variant selection function
    window.selectFormVariant = (variantName, el, value) => {
      const container = el.closest('.variant-swatches, .variant-buttons');
      if (container) {
        container.querySelectorAll('.color-swatch, .size-btn').forEach(item => item.classList.remove('active'));
        el.classList.add('active');
      }
      
      selectedVariants[variantName] = value;
      
      // Backward compatibility
      if (variantName.toLowerCase() === 'color') selectedColor = value;
      if (variantName.toLowerCase() === 'size') selectedSize = value;
      
      // Sync with top variant (if exists)
      const variantId = variantName.toLowerCase().replace(/\s+/g, '-');
      const topContainer = document.getElementById(`variantOptions-${variantId}`);
      if (topContainer) {
        topContainer.querySelectorAll('.color-swatch, .size-btn').forEach(item => item.classList.remove('active'));
        const topEl = Array.from(topContainer.querySelectorAll('.color-swatch, .size-btn')).find(
          item => item.title === value || item.textContent === value
        );
        if (topEl) topEl.classList.add('active');
      }
      
      updateFormVariantSummary();
    };

    function updateFormVariantSummary() {
      if (!formVariantSummary) return;
      const entries = Object.entries(selectedVariants).filter(([k, v]) => v);
      if (entries.length > 0) {
        formVariantSummary.textContent = `Selected: ${entries.map(([k, v]) => v).join(' / ')}`;
      } else {
        formVariantSummary.textContent = '';
      }
    }

    const orderBtn = document.getElementById("orderBtn");
    const qtyInput = document.getElementById("customerQty");
    const orderForm = document.getElementById("productOrderForm");

    if (p.quantity <= 0) {
      orderBtn.disabled = true;
      orderBtn.textContent = t.not_available || "Not Available";
      orderBtn.setAttribute('data-i18n', 'not_available');
      qtyInput.disabled = true;
      return;
    }

    // Add to Cart button
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
      // Remove old listeners to prevent duplicates if re-run
      const newBtn = addToCartBtn.cloneNode(true);
      addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);
      
      newBtn.addEventListener('click', () => {
        // Validate variants if they exist
        if (p.colors && p.colors.length > 0 && !selectedColor) {
          showToast("Please select a color", "error");
          return;
        }
        if (p.sizes && p.sizes.length > 0 && !selectedSize) {
          showToast("Please select a size", "error");
          return;
        }

        const qty = parseInt(qtyInput?.value || 1, 10);
        // We need to update addToCart signature to accept variants, or pass them in a different way
        // For now, let's append them to the name or handle in addToCart if we update it.
        // Let's update addToCart signature below.
        addToCart(p._id, p.name, p.price, p.imageUrl || 'placeholder.jpg', qty, selectedColor, selectedSize);
        toggleCart(); // Open cart to show the added item
      });
    }

    // Wishlist Button on Detail Page
    const wishlistContainer = document.querySelector('.product-actions-row') || document.querySelector('.product-card-actions');
    
    // If we don't have a dedicated row, let's create one or append to existing actions
    // The current layout has buttons directly. Let's try to find where to insert it.
    // Usually near Add to Cart.
    
    // Re-query the button because it was replaced above
    const currentAddToCartBtn = document.getElementById('addToCartBtn');

    // Let's look for the container of addToCartBtn
    if (currentAddToCartBtn) {
      const actionsContainer = currentAddToCartBtn.parentNode;
      
      // Check if we already added it
      if (!actionsContainer.querySelector('.btn-wishlist-detail')) {
        const wishlistBtn = document.createElement('button');
        wishlistBtn.className = `btn-wishlist-detail ${checkWishlistState(p._id) ? 'active' : ''}`;
        wishlistBtn.dataset.id = p._id;
        wishlistBtn.innerHTML = '♥';
        wishlistBtn.title = "Add to Wishlist";
        wishlistBtn.onclick = function() {
          toggleWishlist(this, p._id, p.name, p.price, p.imageUrl || 'placeholder.jpg', p.category || '');
        };
        
        // Insert after add to cart
        actionsContainer.appendChild(wishlistBtn);
        
        // Ensure container is flex
        actionsContainer.style.display = 'flex';
        actionsContainer.style.gap = '10px';
        actionsContainer.style.alignItems = 'center';
      }
    }

    // Buy Now button (shows order form)
    // Clone to remove old listeners
    const newOrderBtn = orderBtn.cloneNode(true);
    orderBtn.parentNode.replaceChild(newOrderBtn, orderBtn);
    
    newOrderBtn.addEventListener("click", () => {
       // Validate variants if they exist
       if (p.colors && p.colors.length > 0 && !selectedColor) {
        showToast("Please select a color", "error");
        return;
      }
      if (p.sizes && p.sizes.length > 0 && !selectedSize) {
        showToast("Please select a size", "error");
        return;
      }

      orderForm.style.display = "block";
      // Scroll to form
      orderForm.scrollIntoView({ behavior: 'smooth' });
      loadWilayas();
    });

    // Submit Order
    const submitOrderBtn = document.getElementById("submitOrder");
    if (submitOrderBtn) {
      // Remove old listener
      const newSubmitBtn = submitOrderBtn.cloneNode(true);
      submitOrderBtn.parentNode.replaceChild(newSubmitBtn, submitOrderBtn);
      
      newSubmitBtn.addEventListener("click", async () => {
        const name = document.getElementById("customerName").value;
        const phone = document.getElementById("customerPhone").value;
        const wilayaSelect = document.getElementById("wilaya");
        const wilaya = wilayaSelect.options[wilayaSelect.selectedIndex]?.text;
        const commune = document.getElementById("commune").value;
        const address = document.getElementById("customerAddress").value;
        const qty = parseInt(qtyInput.value);

        if (!name || !phone || !wilaya || !commune) {
          showToast("Please fill in all required fields.", "error");
          return;
        }

        // Validate variants
        if (colors.length > 0 && !selectedColor) {
          showToast("Please select a color.", "error");
          document.getElementById('formVariantSelection').scrollIntoView({ behavior: 'smooth' });
          return;
        }
        if (sizes.length > 0 && !selectedSize) {
          showToast("Please select a size.", "error");
          document.getElementById('formVariantSelection').scrollIntoView({ behavior: 'smooth' });
          return;
        }

        newSubmitBtn.disabled = true;
        newSubmitBtn.textContent = "Processing...";

        try {
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;

          // Build variants string from selectedVariants
          const variantsStr = Object.entries(selectedVariants)
            .filter(([k, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ') || null;

          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: name,
              customerPhone: phone,
              customerWilaya: wilaya,
              customerCommune: commune,
              customerAddress: address,
              userId: user ? user.id : null,
              items: [{
                productId: p._id,
                name: p.name,
                quantity: qty,
                variants: variantsStr
              }]
            }),
          });

          if (res.ok) {
            const data = await res.json();

            // ⭐ Save to Local Guest History
            registerOrderInHistory({
              _id: data._id,
              customerName: name,
              customerPhone: phone,
              customerAddress: address,
              customerWilaya: wilaya,
              customerCommune: commune,
              totalPrice: data.totalPrice || (p.price * qty),
              createdAt: data.createdAt || new Date().toISOString(),
              items: [{
                productId: p._id,
                name: p.name,
                price: p.price,
                quantity: qty,
                variants: variantsStr,
                imageUrl: p.imageUrl || 'placeholder.jpg'
              }]
            });

            showToast("Order placed successfully! Redirecting...", "success");
            setTimeout(() => {
              window.location.href = `order-success.html?id=${data._id}`;
            }, 1000);
          } else {
            const data = await res.json();
            showToast(data.error || "Order failed", "error");
            newSubmitBtn.disabled = false;
            newSubmitBtn.textContent = "Confirm Order";
          }
        } catch (err) {
          console.error(err);
          showToast("Network error. Please try again.", "error");
          newSubmitBtn.disabled = false;
          newSubmitBtn.textContent = "Confirm Order";
        }
      });
    }

    // Load reviews
    loadProductReviews(id);

    // Enable Spotlight Mode for Form
    setupFormFocusMode();
  } catch (err) {
    console.error("Error loading product:", err);
    document.getElementById("title").textContent = "Error Loading Product";
    document.getElementById("desc").textContent = err.message || "Please try again later.";
    document.getElementById("price").style.display = "none";
    document.getElementById("orderBtn").style.display = "none";
    if(document.getElementById("addToCartBtn")) document.getElementById("addToCartBtn").style.display = "none";
  }
}

// ==================== Homepage Categories ====================
async function loadHomeCategories() {
  const sections = [
    { id: "top-rated", endpoint: "/api/products/top-rated" },
    { id: "trending", endpoint: "/api/products/trending" },
    { id: "new-arrivals", endpoint: "/api/products/new-arrivals" },
    { id: "featured-collection", endpoint: "/api/products/featured-collection" }
  ];

  for (const section of sections) {
    // Check for grid container first (for trending)
    const grid = document.getElementById(`${section.id}-grid`);
    
    if (grid) {
      grid.innerHTML = getSkeletonHTML(6);
      try {
        const res = await fetch(section.endpoint);
        const products = await res.json();

        if (!products.length) {
          grid.innerHTML = getEmptyStateHTML('No products found', 'We are updating this collection. Check back soon!');
          continue;
        }

        // Limit to 6 items for grid
        const gridProducts = products.slice(0, 6);

        const savedLang = localStorage.getItem('preferredLanguage') || 'en';
        const t = window.translations[savedLang] || window.translations['en'];
        grid.innerHTML = gridProducts.map(p => {
          const isOut = p.quantity <= 0;
          let saleBadge = '';
          if (p.previousPrice && p.previousPrice > p.price) {
            const percent = Math.round(((p.previousPrice - p.price) / p.previousPrice) * 100);
            saleBadge = `<div class="sale-badge">-${percent}%</div>`;
          }
          
          return `
          <div class="product-card ${isOut ? 'out-of-stock' : ''}" ${!isOut ? `onclick="window.location.href='product.html?id=${p._id}'"` : ''}>
            <div class="product-image">
              ${saleBadge}
              <img src="${p.imageUrl || 'https://via.placeholder.com/300'}" alt="${p.name}">
              ${isOut ? `<span class="badge not-available" data-i18n="not_available">${t.not_available || 'Not Available'}</span>` : ''}
              <button class="btn-wishlist ${checkWishlistState(p._id) ? 'active' : ''}" 
                data-id="${p._id}"
                onclick="event.stopPropagation(); toggleWishlist(this, '${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.imageUrl || 'https://via.placeholder.com/300'}', '${p.category || ''}')">
                ♥
              </button>
              <button class="btn-quick-view" onclick="event.stopPropagation(); openQuickView('${p._id}')" title="Quick View">
                👁️
              </button>
            </div>
            <div class="product-info">
              <h3 class="product-title">${p.name}</h3>
              ${p.quantity > 0 && p.quantity <= 5 ? `<div class="stock-warning">Only ${p.quantity} left!</div>` : ''}
              <p class="product-desc">${(function(){const d=p.description||'Great quality product.';const l=25;return d.length>l?d.substring(0,l)+'<span style="color:#dc2626;font-weight:600;margin-left:2px;">...more</span>':d;})()}</p>
              <div class="product-price">$${p.price.toFixed(2)}</div>
              <div class="product-card-actions">
                <button class="btn-buy-now" onclick="event.stopPropagation(); window.location.href='product.html?id=${p._id}';" ${isOut ? 'disabled' : ''}>
                  Buy Now
                </button>
                <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.imageUrl}', 1);" ${isOut ? 'disabled' : ''}>
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        `}).join('');
      } catch (err) {
        console.error(`Error loading ${section.id}:`, err);
        grid.innerHTML = `<p class="error-msg">Failed to load.</p>`;
      }
      continue; // Skip carousel logic for this section
    }

    // Fallback to carousel logic
    const track = document.getElementById(`${section.id}-track`);
    if (!track) continue;

    // Show skeletons
    track.innerHTML = getSkeletonHTML(4);

    try {
      const res = await fetch(section.endpoint);
      const products = await res.json();

      if (!products.length) {
        // Use standard DOM manipulation for carousel track instead of innerHTML to ensure styling
        const container = track.parentElement; 
        // We replace the track content or the container content? Usually track is flex.
        // Let's replace the track content, but ensure it takes full width.
        track.innerHTML = getEmptyStateHTML('Coming Soon', 'We are curating the best items for this collection.');
        track.style.display = 'block'; // Ensure it's not flex column if it messes up
        continue;
      }

      const savedLang2 = localStorage.getItem('preferredLanguage') || 'en';
      const t2 = window.translations[savedLang2] || window.translations['en'];
      track.innerHTML = products.map(p => {
        const isOut = p.quantity <= 0;
        let saleBadge = '';
        if (p.previousPrice && p.previousPrice > p.price) {
          const percent = Math.round(((p.previousPrice - p.price) / p.previousPrice) * 100);
          saleBadge = `<div class="sale-badge">-${percent}%</div>`;
        }
        
        return `
        <div class="product-card ${isOut ? 'out-of-stock' : ''}" ${!isOut ? `onclick="window.location.href='product.html?id=${p._id}'"` : ''}>
          <div class="product-image">
            ${saleBadge}
            <img src="${p.imageUrl || 'https://via.placeholder.com/300'}" alt="${p.name}">
            ${isOut ? `<span class="badge not-available" data-i18n="not_available">${t2.not_available || 'Not Available'}</span>` : ''}
            <button class="btn-wishlist ${checkWishlistState(p._id) ? 'active' : ''}" 
              data-id="${p._id}"
              onclick="event.stopPropagation(); toggleWishlist(this, '${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.imageUrl || 'https://via.placeholder.com/300'}', '${p.category || ''}')">
              ♥
            </button>
            ${section.id === 'featured-collection' ? `
            <div class="quick-view-overlay">
              <button class="btn-quick-view" onclick="event.stopPropagation(); openQuickView('${p._id}')">Quick View</button>
            </div>
            ` : `
            <button class="btn-quick-view" onclick="event.stopPropagation(); openQuickView('${p._id}')" title="Quick View">
              👁️
            </button>
            `}
          </div>
          <div class="product-info">
            <h3 class="product-title">${p.name}</h3>
            <p class="product-desc">${(function(){const d=p.description||'Great quality product.';const l=25;return d.length>l?d.substring(0,l)+'<span style="color:#dc2626;font-weight:600;margin-left:2px;">...more</span>':d;})()}</p>
            <div class="product-price">${window.getPriceHTML(p.price, p.previousPrice)}</div>
            <div class="product-card-actions">
              <button class="btn-buy-now" onclick="event.stopPropagation(); window.location.href='product.html?id=${p._id}';" ${isOut ? 'disabled' : ''}>
                Buy Now
              </button>
              <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.imageUrl}', 1);" ${isOut ? 'disabled' : ''}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      `; }).join('');

      if (section.id === 'featured-collection') {
        startFeaturedAutoPlay();
      }
    } catch (err) {
      console.error(`Error loading ${section.id}:`, err);
      track.innerHTML = `<p class="error-msg">Failed to load.</p>`;
    }
  }
}

function getEmptyStateHTML(title, message) {
  const savedLang = localStorage.getItem('preferredLanguage') || 'en';
  const t = window.translations[savedLang] || window.translations['en'];

  // Generate 3 ghost cards for the background effect as per user suggestion
  const ghostCards = Array(3).fill(0).map(() => `
    <div class="placeholder-card">
      <div class="placeholder-img"></div>
      <div class="placeholder-line short"></div>
      <div class="placeholder-line"></div>
    </div>
  `).join('');

  return `
    <div class="empty-state-wrapper">
      <div class="placeholder-grid">
        ${ghostCards}
      </div>
      <div class="empty-state-content">
        <div class="empty-state-icon" style="margin-bottom: 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </div>
        <h3>${title === 'Coming Soon' ? t.coming_soon : (title === 'No products found' ? t.no_products_found : title)}</h3>
        <p>${message === 'We are curating the best items for this collection.' ? t.curating_desc : (message === 'We are updating this collection. Check back soon!' ? t.collection_updating : message)}</p>
        <div class="empty-state-actions">
           <a href="store.html" class="empty-state-cta-btn">${t.discover_all}</a>
        </div>
      </div>
    </div>
  `;
}

function initCarouselArrows(sectionId) {
  const track = document.getElementById(`${sectionId}-track`);
  const leftBtn = document.querySelector(`.carousel-arrow.left[data-target="${sectionId}"]`);
  const rightBtn = document.querySelector(`.carousel-arrow.right[data-target="${sectionId}"]`);

  if (!track || !leftBtn || !rightBtn) return;

  leftBtn.addEventListener("click", () => {
      track.scrollBy({ left: -300, behavior: "smooth" });
  });

  rightBtn.addEventListener("click", () => {
    track.scrollBy({ left: 300, behavior: "smooth" });
  });
}

// ==================== SHOPPING CART (Server-Side) ====================
const CART_API = "/api/cart";
const CART_ID_KEY = 'cartSessionId'; // Only store cartId in localStorage
const LEGACY_CART_KEY = 'clothingStoreCart'; // For migration

// Get or create cart session ID
async function getOrCreateCartId() {
  let cartId = localStorage.getItem(CART_ID_KEY);
  
  if (!cartId) {
    // Check for legacy localStorage cart to migrate
    const legacyCart = localStorage.getItem(LEGACY_CART_KEY);
    
    // Create new cart on server
    try {
      const res = await fetch(CART_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      cartId = data.cartId;
      localStorage.setItem(CART_ID_KEY, cartId);
      
      // Migrate legacy cart if exists
      if (legacyCart) {
        await migrateLegacyCart(cartId, JSON.parse(legacyCart));
        localStorage.removeItem(LEGACY_CART_KEY);
      }
    } catch (err) {
      console.error('Error creating cart:', err);
      return null;
    }
  }
  
  return cartId;
}

// Migrate legacy localStorage cart to server
async function migrateLegacyCart(cartId, legacyItems) {
  try {
    for (const item of legacyItems) {
      await fetch(`${CART_API}/${cartId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          quantity: item.quantity
        })
      });
    }
    console.log('✅ Legacy cart migrated to server');
  } catch (err) {
    console.error('Error migrating legacy cart:', err);
  }
}

// Get cart from server
async function getCart() {
  const cartId = await getOrCreateCartId();
  if (!cartId) return [];
  
  try {
    const res = await fetch(`${CART_API}/${cartId}`);
    if (!res.ok) {
      if (res.status === 404) {
        // Cart not found, create new one
        localStorage.removeItem(CART_ID_KEY);
        return await getCart(); // Recursive call to create new cart
      }
      throw new Error('Failed to fetch cart');
    }
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('Error getting cart:', err);
    return [];
  }
}

// Add item to cart (server-side with stock validation)
// Add item to cart (server-side with stock validation)
async function addToCart(productId, name, price, imageUrl, quantity = 1, color = null, size = null) {
  const cartId = await getOrCreateCartId();
  if (!cartId) {
    showCartNotification('❌ Failed to initialize cart');
    return;
  }
  
  try {
    const res = await fetch(`${CART_API}/${cartId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        name,
        price,
        imageUrl,
        quantity,
        color,
        size
      })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      // Handle stock errors
      if (data.error === 'Out of stock') {
        showCartNotification(`❌ ${name} is out of stock!`);
      } else if (data.error === 'Insufficient stock') {
        showCartNotification(data.message || `⚠️ Only ${data.available} available`);
      } else {
        showCartNotification(`❌ ${data.error || 'Failed to add item'}`);
      }
      return;
    }
    
    await updateCartBadge();
    await renderCart();
    showCartNotification(`Added ${name} to cart!`);
    triggerCartAnimation(); // Trigger the visual pop
  } catch (err) {
    console.error('Error adding to cart:', err);
    showCartNotification('❌ Failed to add item to cart');
  }
}

// Remove item from cart
async function removeFromCart(productId) {
  const cartId = await getOrCreateCartId();
  if (!cartId) return;
  
  try {
    const res = await fetch(`${CART_API}/${cartId}/items/${productId}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) throw new Error('Failed to remove item');
    
    await updateCartBadge();
    await renderCart();
  } catch (err) {
    console.error('Error removing from cart:', err);
    showCartNotification('❌ Failed to remove item');
  }
}

// Update item quantity (with optimistic UI and stock validation)
// Global cart cache to avoid server fetch delay
let cartCache = null;

async function updateQuantity(productId, quantity) {
  const cartId = await getOrCreateCartId();
  if (!cartId) return;
  
  // Use cached cart or fetch if not available
  if (!cartCache) {
    cartCache = await getCart();
  }
  
  const item = cartCache.find(item => item.productId.toString() === productId);
  if (!item) return;
  
  // Store original quantity for rollback
  const originalQuantity = item.quantity;
  
  // INSTANT optimistic update - no await!
  item.quantity = quantity;
  renderCartOptimistic(cartCache); // Synchronous render
  
  // Then sync with server in background
  try {
    const res = await fetch(`${CART_API}/${cartId}/items/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      // Rollback on error
      item.quantity = originalQuantity;
      renderCartOptimistic(cartCache);
      
      if (data.error === 'Insufficient stock') {
        showCartNotification(`⚠️ Only ${data.available} available in stock`);
      } else {
        showCartNotification(`❌ ${data.error || 'Failed to update quantity'}`);
      }
      return;
    }
    
    // Success - update cache with server data
    cartCache = data.items;
  } catch (err) {
    // Rollback on network error
    item.quantity = originalQuantity;
    renderCartOptimistic(cartCache);
    console.error('Error updating quantity:', err);
    showCartNotification('❌ Failed to update quantity');
  }
}

// Get total cart count
async function getCartCount() {
  const cart = await getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
}

// Get cart total price
async function getCartTotal() {
  const cart = await getCart();
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Clear cart
async function clearCart() {
  const cartId = await getOrCreateCartId();
  if (!cartId) return;
  
  try {
    const res = await fetch(`${CART_API}/${cartId}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) throw new Error('Failed to clear cart');
    
    await updateCartBadge();
    await renderCart();
  } catch (err) {
    console.error('Error clearing cart:', err);
    showCartNotification('❌ Failed to clear cart');
  }
}

// Update cart badge
async function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  if (badges.length === 0) return;
  
  const count = await getCartCount();
  badges.forEach(badge => {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

// Render cart items
async function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  const footer = document.getElementById('cartFooter');
  if (!container) return;
  
  const cart = await getCart();
  
  const savedLang = localStorage.getItem('preferredLanguage') || 'en';
  const t = window.translations[savedLang] || window.translations['en'];

  // Update cache for optimistic updates
  cartCache = cart;
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </div>
        <h3>${t.empty_cart}</h3>
        <p>${t.wishlist_empty_desc || 'Looks like you haven\'t added anything to your cart yet.'}</p>
        <button class="btn-primary empty-state-action" onclick="toggleCart(); window.location.href='store.html'">${t.start_shopping}</button>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }
  
  if (footer) footer.style.display = 'block';
  
  container.innerHTML = cart.map(item => {
    const atMaxStock = item.quantity >= (item.stock || Infinity);
    const atMinQuantity = item.quantity <= 1;
    const stockWarning = item.stock ? `<small style="color: #666; font-size: 0.8rem;">${t.stock}: ${item.stock}</small>` : '';
    
    // Parse variants if they are in string format or if new structure
    // Legacy support might be needed if variants are strings
    
    const variantsMsg = [];
    if (item.color) variantsMsg.push(`${t.color}: ${item.color}`);
    if (item.size) variantsMsg.push(`${t.size}: ${item.size}`);
    const variantsHtml = variantsMsg.length ? `<div class="cart-item-variants">${variantsMsg.join(" / ")}</div>` : "";

    return `
    <div class="cart-item">
      <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.name}</h4>
        ${variantsHtml}
        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
        ${stockWarning}
        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="updateQuantity('${item.productId}', ${item.quantity - 1})" ${atMinQuantity ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>−</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn" onclick="updateQuantity('${item.productId}', ${item.quantity + 1})" ${atMaxStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>+</button>
          </div>
          <button class="remove-item" onclick="removeFromCart('${item.productId}')" title="${t.remove_item}">🗑️</button>
        </div>
        ${atMaxStock ? `<small style="color: #ef4444; font-size: 0.75rem;">⚠️ ${t.max_quantity_reached}</small>` : ''}
      </div>
    </div>
    `;
  }).join('');
  
  // Update total
  const totalElement = document.getElementById('cartTotalAmount');
  if (totalElement) {
    const total = await getCartTotal();
    totalElement.textContent = `$${total.toFixed(2)}`;
  }
}

// Optimistic render - renders cart immediately without fetching from server
function renderCartOptimistic(cart) {
  const container = document.getElementById('cartItemsContainer');
  const footer = document.getElementById('cartFooter');
  if (!container) return;
  
  const savedLang = localStorage.getItem('preferredLanguage') || 'en';
  const t = window.translations[savedLang] || window.translations['en'];
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </div>
        <h3>${t.empty_cart}</h3>
        <p>${t.wishlist_empty_desc || 'Looks like you haven\'t added anything to your cart yet.'}</p>
        <button class="btn-primary empty-state-action" onclick="toggleCart(); window.location.href='store.html'">${t.start_shopping}</button>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }
  
  if (footer) footer.style.display = 'block';
  
  container.innerHTML = cart.map(item => {
    const atMaxStock = item.quantity >= (item.stock || Infinity);
    const atMinQuantity = item.quantity <= 1;
    const stockWarning = item.stock ? `<small style="color: #666; font-size: 0.8rem;">${t.stock}: ${item.stock}</small>` : '';
    
    const variantsMsg = [];
    if (item.color) variantsMsg.push(`${t.color}: ${item.color}`);
    if (item.size) variantsMsg.push(`${t.size}: ${item.size}`);
    const variantsHtml = variantsMsg.length ? `<div class="cart-item-variants">${variantsMsg.join(" / ")}</div>` : "";

    return `
    <div class="cart-item">
      <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.name}</h4>
        ${variantsHtml}
        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
        ${stockWarning}
        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="updateQuantity('${item.productId}', ${item.quantity - 1})" ${atMinQuantity ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>−</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn" onclick="updateQuantity('${item.productId}', ${item.quantity + 1})" ${atMaxStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>+</button>
          </div>
          <button class="remove-item" onclick="removeFromCart('${item.productId}')" title="${t.remove_item}">🗑️</button>
        </div>
        ${atMaxStock ? `<small style="color: #ef4444; font-size: 0.75rem;">⚠️ ${t.max_quantity_reached}</small>` : ''}
      </div>
    </div>
    `;
  }).join('');
  
  // Update total and badge immediately
  const totalElement = document.getElementById('cartTotalAmount');
  if (totalElement) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalElement.textContent = `$${total.toFixed(2)}`;
  }
  
  const badge = document.getElementById('cartBadge');
  if (badge) {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Toggle cart sidebar
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  
  if (sidebar && overlay) {
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      
      // Reset to cart view when closing
      setTimeout(() => {
        hideCheckoutForm();
      }, 300); // Wait for transition to finish
    } else {
      sidebar.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      renderCart();
    }
  }
}

// Show cart notification
function showCartNotification(message) {
  // Use the new toast system
  const type = message.includes('❌') || message.includes('⚠️') ? 'error' : 'success';
  // Strip emojis for cleaner toast
  const cleanMessage = message.replace(/❌|⚠️|✅/g, '').trim();
  showToast(cleanMessage, type);
}

// Add CSS for notifications
if (!document.querySelector('style#cart-notifications')) {
  const style = document.createElement('style');
  style.id = 'cart-notifications';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ==================== Initialize ====================
document.addEventListener("DOMContentLoaded", () => {
  const wilayaSelect =
    document.getElementById("wilaya") ||
    document.getElementById("customerWilaya");

  if (wilayaSelect) {
    loadWilayas();
    // Initialize searchable selects after a short delay to allow DOM to settle, 
    // but MutationObserver will handle the options population.
    initSearchableSelects(); 
    
    wilayaSelect.addEventListener("change", function () {
      if (this.value) loadCommunes(this.value);
    });
  }
});

// Placeholder for searchable selects initialization
// Placeholder for searchable selects initialization
function initSearchableSelects() {
  const selects = document.querySelectorAll('select.searchable');

  selects.forEach(select => {
    if (select.dataset.searchableInit) return; // Already initialized
    select.dataset.searchableInit = "true";

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'searchable-select-wrapper';

    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'searchable-select-input';
    input.placeholder = select.options[0]?.text || 'Search...';
    input.readOnly = false; // Allow typing
    input.autocomplete = 'off'; // Disable browser autocomplete

    // Create options list
    const list = document.createElement('div');
    list.className = 'searchable-select-list';
    
    // Insert wrapper and move select inside
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    wrapper.appendChild(input);
    wrapper.appendChild(list);

    // Hide original select
    select.style.display = 'none';

    // Populate list function
    function populateList(filterText = '') {
      list.innerHTML = '';
      const options = Array.from(select.options);
      
      let found = false;
      options.forEach(opt => {
        if (opt.value === "") return; // Skip placeholder
        
        const text = opt.text;
        if (text.toLowerCase().includes(filterText.toLowerCase())) {
            found = true;
            const item = document.createElement('div');
            item.className = 'searchable-select-item';
            item.textContent = text;
            item.dataset.value = opt.value;
            
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent bubbling
                select.value = opt.value;
                input.value = text;
                list.style.display = 'none';
                // Trigger change event on original select
                select.dispatchEvent(new Event('change'));
            });
            
            list.appendChild(item);
        }
      });

      if (!found) {
          const noResult = document.createElement('div');
          noResult.className = 'searchable-select-item disabled';
          noResult.textContent = 'No results found';
          list.appendChild(noResult);
      }
    }

    // Initial population
    populateList();

    // Event listeners
    input.addEventListener('focus', () => {
        populateList(input.value); // Refresh list
        list.style.display = 'block';
        // Scroll input to top on mobile to avoid keyboard covering
        if (window.innerWidth <= 480) {
            setTimeout(() => {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    });

    input.addEventListener('input', (e) => {
        populateList(e.target.value);
        list.style.display = 'block';
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            list.style.display = 'none';
            // If input is empty, reset select
            if (input.value === '') {
                select.value = '';
            } else {
                const selectedOption = select.options[select.selectedIndex];
                if (selectedOption && selectedOption.value) {
                    input.value = selectedOption.text;
                } else {
                    input.value = '';
                }
            }
        }
    });
    
    // Close on list click (backdrop area on mobile)
    list.addEventListener('click', (e) => {
      if (e.target === list) {
        list.style.display = 'none';
      }
    });

    // MutationObserver to watch for option changes (dynamic loading)
    const observer = new MutationObserver(() => {
        populateList();
        // Update input placeholder or value if needed
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.value) {
            input.value = selectedOption.text;
        } else {
            input.value = '';
            input.placeholder = select.options[0]?.text || 'Search...';
        }
    });
    
    observer.observe(select, { childList: true, subtree: true });
  });
}

// ==================== Quick View Logic ====================
window.openQuickView = async function(productId) {
  const modal = document.getElementById('quickViewOverlay');
  if (!modal) return;
  
  const content = modal.querySelector('.quick-view-content');
  
  // Clear previous content and show loading state
  const imgElement = document.getElementById('qvImage');
  // Use a transparent pixel to instantly clear the old image
  imgElement.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  imgElement.style.opacity = '0'; // Hide image until loaded
  
  document.getElementById('qvTitle').textContent = 'Loading...';
  document.getElementById('qvPrice').textContent = '';
  document.getElementById('qvCategory').textContent = '';
  document.getElementById('qvDescription').textContent = '';
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  try {
    // Try to find in local cache first if available
    let product = window.allProducts?.find(p => p._id === productId);
    
    if (!product) {
       const res = await fetch(`${PRODUCTS_API}/${productId}`);
       product = await res.json();
    }

    if (!product) throw new Error('Product not found');
    
    // Populate Modal
    document.getElementById('qvTitle').textContent = product.name;
    document.getElementById('qvPrice').innerHTML = window.getPriceHTML(product.price, product.previousPrice);
    document.getElementById('qvCategory').textContent = product.category || 'Uncategorized';
    document.getElementById('qvDescription').textContent = product.description || 'No description available.';
    
    // Handle Image Loading
    imgElement.onload = function() {
      imgElement.style.opacity = '1';
    };
    imgElement.src = product.imageUrl || 'https://via.placeholder.com/400';
    
    // Update View Details Link
    const viewBtn = document.getElementById('qvViewDetails');
    viewBtn.href = `product.html?id=${product._id}`;
    
    // Update Add to Cart Button
    const addBtn = document.getElementById('qvAddToCart');
    addBtn.onclick = () => {
      addToCart(product._id, product.name, product.price, product.imageUrl, 1);
      closeQuickView();
    };

  } catch (err) {
    console.error('Quick View Error:', err);
    showToast('Failed to load product details', 'error');
    closeQuickView();
  }
};

window.closeQuickView = function() {
  const modal = document.getElementById('quickViewOverlay');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// Close on click outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('quickViewOverlay');
  if (e.target === modal) {
    closeQuickView();
  }
});


// ==================== Real-Time Search Autocomplete ====================
async function initNavbarSearch() {
  // Target both Desktop and Mobile search containers
  const searchContainers = document.querySelectorAll('.nav-search-container, .mobile-search-bar');
  
  if (searchContainers.length === 0) return;
  
  // Preload products (Non-blocking)
  if (!window.allProducts || window.allProducts.length === 0) {
    fetch('/api/products')
      .then(res => {
         if(res.ok) return res.json();
         throw new Error('Failed to fetch products');
      })
      .then(data => {
         window.allProducts = Array.isArray(data) ? data : (data.products || []);
      })
      .catch(e => {
        console.error('Failed to preload products for search', e);
        window.allProducts = []; 
      });
  }

  searchContainers.forEach(container => {
    const input = container.querySelector('.nav-search-input') || container.querySelector('.mobile-search-input');
    let dropdown = container.querySelector('.search-dropdown');
    
    if (!input) return;
    
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'search-dropdown';
      container.appendChild(dropdown);
    }

    // Input Listener
    input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    
    // Safety check for data
    if (!window.allProducts || !Array.isArray(window.allProducts)) {
       // if not loaded yet, do nothing (or show loading in dropdown if desired)
       return; 
    }

    if (term.length < 2) {
      dropdown.classList.remove('active');
      return;
    }
    
    const matches = window.allProducts.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term))
    ).slice(0, 6); // Limit to 6 results
    
    if (matches.length > 0) {
      dropdown.innerHTML = matches.map(p => `
        <div class="search-result-item" onclick="window.location.href='product.html?id=${p._id}'">
          <img src="${p.imageUrl || 'placeholder.jpg'}" class="search-result-thumb" alt="${p.name}">
          <div class="search-result-info">
            <h4 class="search-result-title">${p.name}</h4>
            <div class="search-result-price">${window.getPriceHTML ? window.getPriceHTML(p.price, p.previousPrice) : '$' + p.price.toFixed(2)}</div>
          </div>
        </div>
      `).join('');
    } else {
      dropdown.innerHTML = `<div class="search-no-results">No products found for "${term}"</div>`;
    }
    
      dropdown.classList.add('active');
    });
    
    // Focus/Blur handling
    input.addEventListener('focus', () => {
      if (input.value.length >= 2) dropdown.classList.add('active');
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    // Handle Enter key for search
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          window.location.href = `store.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  });
}

// ==================== Recently Viewed Functions ====================
function addToRecentlyViewed(product) {
  let recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
  
  // Remove duplicate if exists
  recent = recent.filter(p => p._id !== product._id);
  
  // Add new product to the beginning
  recent.unshift({
    _id: product._id,
    name: product.name,
    price: product.price,
    previousPrice: product.previousPrice,
    imageUrl: product.imageUrl || 'placeholder.jpg',
    category: product.category
  });
  
  // Keep only last 8 items
  if (recent.length > 8) {
    recent.pop();
  }
  
  localStorage.setItem('recentlyViewed', JSON.stringify(recent));
}

function loadRecentlyViewed() {
  const container = document.getElementById('recentlyViewedGrid');
  const section = document.getElementById('recentlyViewedSection');
  
  if (!container || !section) return;
  
  // Get current product ID to exclude it from list (optional, but good UX)
  const currentId = getProductIdFromURL();
  
  let recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
  
  // Filter out current product
  recent = recent.filter(p => p._id !== currentId);
  
  if (recent.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  const savedLang3 = localStorage.getItem('preferredLanguage') || 'en';
  const t3 = window.translations[savedLang3] || window.translations['en'];
  container.innerHTML = recent.map(p => {
    const isOut = p.quantity <= 0;
    let saleBadge = '';
    if (p.previousPrice && p.previousPrice > p.price) {
      const percent = Math.round(((p.previousPrice - p.price) / p.previousPrice) * 100);
      saleBadge = `<div class="sale-badge" style="padding: 2px 6px; font-size: 0.7rem; top: 6px; right: 6px;">-${percent}%</div>`;
    }
    
    return `
    <div class="product-card ${isOut ? 'out-of-stock' : ''}" ${!isOut ? `onclick="window.location.href='product.html?id=${p._id}'"` : ''}>
      <div class="product-image">
        ${saleBadge}
        <img src="${p.imageUrl}" alt="${p.name}">
        ${isOut ? `<span class="badge not-available" data-i18n="not_available">${t3.not_available || 'Not Available'}</span>` : ''}
        <button class="btn-wishlist ${checkWishlistState(p._id) ? 'active' : ''}" 
          onclick="event.stopPropagation(); toggleWishlist(this, '${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.imageUrl}', '${p.category || ''}')">
          ♥
        </button>
      </div>
      <div class="product-info">
        <h3 class="product-title" style="font-size: 0.9rem;">${p.name}</h3>
        <div class="product-price" style="font-size: 1rem;">${window.getPriceHTML(p.price, p.previousPrice)}</div>
      </div>
    </div>
  `}).join('');
}

// ==================== Language Switching ====================
function switchLanguage(lang) {
  localStorage.setItem('preferredLanguage', lang);
  loadLanguage(lang);
  
  // Close mobile menu if open
  if (window.closeMobileMenu) window.closeMobileMenu();
  
  // Dispatch event for other scripts (like store.js)
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

function loadLanguage(lang) {
  if (!window.translations) return;
  const t = window.translations[lang];
  if (!t) return;

  // Set direction and lang attribute
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.body.classList.toggle('rtl-mode', lang === 'ar');

  // Update button states (Ensure UI reflects current language)
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = lang === 'ar' ? document.getElementById('langAr') : document.getElementById('langEn');
  if (activeBtn) activeBtn.classList.add('active');

  // Translate elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      // If it has children (like icons), we need to be careful not to overwrite them
      // In this simple app, most i18n elements are text-only or have icons in separate spans
      if (el.children.length === 0) {
        el.textContent = t[key];
      } else {
        // Special handling for elements with icons if needed
        // For now, let's assume we use textContent for simplicity unless it has spans
        const textSpan = el.querySelector('span:not(.bottom-nav-icon)');
        if (textSpan) {
           textSpan.textContent = t[key];
        } else {
           // Fallback or specific logic
        }
      }
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      el.placeholder = t[key];
    }
  });
  
  // Special cases for dynamic content that might be rendered already
  updateCartBadge();
}

// Initialize page logic
// Consolidated initialization
function initApp() {
  // Load preferred language
  const savedLang = localStorage.getItem('preferredLanguage') || 'en';
  loadLanguage(savedLang);
  
  // Make switchLanguage global
  window.switchLanguage = switchLanguage;
  window.loadLanguage = loadLanguage;
  window.toggleCart = toggleCart;

  // Inject CSS for Nav Search
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'nav-search.css';
  document.head.appendChild(link);
  
  // Initialize Global Components
  console.log('initApp starting...');
  initNavbarSearch();
  initMobileMenu();
  updateWishlistCount();
  initScrollAnimations();
  applySiteSettings();
  console.log('Global initializations complete.');

  // Page Specific Logic
  const isHomePage = !!document.getElementById("top-rated-track");
  const isStorePage = !!document.getElementById("categoryFilter");
  const isProductPage = !!document.querySelector('.product-detail-wrapper');
  
  if (isHomePage) {
    loadHomeCategories();
    
    // Initialize Hero Carousel
    if (!window.allProducts || window.allProducts.length === 0) {
      fetch(PRODUCTS_API)
        .then(res => res.json())
        .then(products => {
          window.allProducts = products;
          setupCarousel(products);
        })
        .catch(err => console.error('Hero Carousel Error:', err));
    } else {
      setupCarousel(window.allProducts);
    }
  }

  if (isStorePage) {
    const categoryFilter = document.getElementById("categoryFilter");
    loadProducts();
    categoryFilter.addEventListener("change", e => loadProducts(e.target.value));
  }

  if (isProductPage) {
    loadProduct();
    setupFormFocusMode();
  }
  
  // Common UI Elements (Cart, Checkout, etc.)
  setupCartEventListeners();
  ensureToastContainer();
  console.log('initApp finished.');
}

document.addEventListener('DOMContentLoaded', initApp);

function setupCartEventListeners() {
  const cartIcon = document.getElementById('cartIcon');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose = document.getElementById('cartClose');
  
  if (cartIcon) cartIcon.addEventListener('click', toggleCart);
  if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);
  if (cartClose) cartClose.addEventListener('click', toggleCart);

  // Close cart when clicking anywhere outside
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('cartSidebar');
    const cartIcon = document.getElementById('cartIcon');
    const bottomNavCart = document.querySelector('.bottom-nav-item[onclick*="toggleCart"]');
    
    // If sidebar is active and click is NOT inside sidebar AND NOT on the toggle button
    if (sidebar && sidebar.classList.contains('active')) {
      if (!sidebar.contains(e.target) && 
          (!cartIcon || !cartIcon.contains(e.target)) &&
          (!bottomNavCart || !bottomNavCart.contains(e.target))) {
        toggleCart();
      }
    }
  });
  
  const orderForm = document.getElementById('orderForm');
  console.log('setupCartEventListeners: orderForm found?', !!orderForm);
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      console.log('Order form submission triggered!');
      e.preventDefault();
      await submitOrder();
    });
  }

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      const cart = cartCache || await getCart();
      if (cart.length === 0) {
        showCartNotification('Your cart is empty!');
        return;
      }
      showCheckoutForm();
    });
  }

  const backToCartBtn = document.getElementById('backToCart');
  if (backToCartBtn) {
    backToCartBtn.addEventListener('click', hideCheckoutForm);
  }

  // Initialize cart badge on page load
  updateCartBadge();
}

// ==================== CHECKOUT FLOW ====================
let currentDiscount = 0;
let appliedCouponCode = null;

function showCheckoutForm() {
  const cartItems = document.querySelector('.cart-items');
  const cartFooter = document.getElementById('cartFooter');
  const checkoutForm = document.getElementById('checkoutForm');
  const sidebar = document.getElementById('cartSidebar');
  
  if (cartItems) cartItems.style.display = 'none';
  if (cartFooter) cartFooter.style.display = 'none';
  if (checkoutForm) checkoutForm.style.display = 'flex';
  
  // Expand sidebar for better form layout
  if (sidebar) {
    sidebar.style.width = '700px';
    sidebar.style.maxWidth = '95vw';
  }
  
  // Load wilayas and enable search
  loadWilayasForCheckout();
  
  // Populate order summary
  populateCheckoutSummary();

  // Initialize Coupon Logic
  initializeCouponLogic();
  
  // Initialize searchable selects after a short delay to ensure DOM is ready
  setTimeout(() => {
    initSearchableSelects();
  }, 100);
}

function hideCheckoutForm() {
  const cartItems = document.querySelector('.cart-items');
  const cartFooter = document.getElementById('cartFooter');
  const checkoutForm = document.getElementById('checkoutForm');
  const sidebar = document.getElementById('cartSidebar');
  
  if (cartItems) cartItems.style.display = 'block';
  if (cartFooter) cartFooter.style.display = 'block';
  if (checkoutForm) checkoutForm.style.display = 'none';
  
  // Reset sidebar width
  if (sidebar) {
    sidebar.style.width = '420px';
  }
}

async function loadWilayasForCheckout() {
  const wilayaSelect = document.getElementById('checkoutWilaya');
  if (!wilayaSelect) return;
  
  try {
    const res = await fetch('/api/wilayas');
    const wilayas = await res.json();
    
    wilayaSelect.innerHTML = '<option value="">Select Wilaya</option>';
    wilayas.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.wilayaCode;
      // Show French name with Arabic name in brackets
      opt.textContent = `${w.wilayaCode} - ${w.nameFr} (${w.nameAr})`;
      wilayaSelect.appendChild(opt);
    });
    
    // Setup commune loading
    wilayaSelect.addEventListener('change', async function() {
      if (this.value) {
        await loadCommunesForCheckout(this.value);
      }
    });
  } catch (err) {
    console.error('Error loading wilayas:', err);
  }
}

async function loadCommunesForCheckout(wilayaCode) {
  const communeSelect = document.getElementById('checkoutCommune');
  if (!communeSelect) return;
  
  try {
    const res = await fetch(`/api/wilayas/${wilayaCode}/communes`);
    const communes = await res.json();
    
    communeSelect.innerHTML = '<option value="">Select Commune</option>';
    communeSelect.disabled = false;
    communes.forEach(c => {
      const opt = document.createElement('option');
      // Show French name with Arabic name in brackets
      opt.value = c.nameFr;
      opt.textContent = `${c.nameFr} (${c.nameAr})`;
      communeSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading communes:', err);
  }
}

async function populateCheckoutSummary() {
  const cart = cartCache || await getCart();
  const itemsList = document.getElementById('checkoutItemsList');
  const totalAmount = document.getElementById('checkoutTotalAmount'); // Legacy
  
  // New Totals
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const finalTotalEl = document.getElementById('checkoutFinalTotal');

  if (!itemsList) return;
  
  itemsList.innerHTML = cart.map((item) => `
    <div class="summary-item">
      <img src="${item.imageUrl || 'placeholder.jpg'}" alt="${item.name}" class="summary-img">
      <div class="summary-info">
        <h4>${item.name}</h4>
        <p>Qty: ${item.quantity} ${item.variant ? `| ${item.variant}` : ''}</p>
        <p>$${(item.price * item.quantity).toFixed(2)}</p>
      </div>
    </div>
  `).join('');
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Update UI
  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  
  const total = subtotal;
  
  if (finalTotalEl) finalTotalEl.textContent = `$${Math.max(0, total).toFixed(2)}`;
  if (totalAmount) totalAmount.textContent = `$${Math.max(0, total).toFixed(2)}`;
}

// Handle order form submission (Moved to setupCartEventListeners)

async function submitOrder() {
  console.log('submitOrder called');
  const cart = cartCache || await getCart();
  console.log('submitOrder: cart items count:', cart.length);
  if (cart.length === 0) {
    showCartNotification('Your cart is empty!');
    return;
  }
  
  // Get form values
  const name = document.getElementById('checkoutName').value;
  const phone = document.getElementById('checkoutPhone').value;
  const wilayaCode = document.getElementById('checkoutWilaya').value;
  const commune = document.getElementById('checkoutCommune').value;
  const address = document.getElementById('checkoutAddress').value;
  
  console.log('Form values retrieved:', { name, phone, wilayaCode, commune, address });
  
  if (!name || !phone || !wilayaCode || !commune || !address) {
    console.warn('submitOrder: Missing required fields');
    showCartNotification('Please fill in all required fields');
    return;
  }
  
  // Get wilaya name
  const wilayaSelect = document.getElementById('checkoutWilaya');
  const wilayaName = wilayaSelect.options[wilayaSelect.selectedIndex].text;
  
  // Disable submit button
  const submitBtn = document.querySelector('.checkout-btn') || document.querySelector('.place-order-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Placing Order...';
  }
  
  try {
    // 1. Build items array
    const items = cart.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: parseInt(item.quantity) || 1,
      variants: item.variant || item.variants || null,
      imageUrl: item.imageUrl || 'placeholder.jpg' // ⭐ Include image
    }));
    
    // 2. Submit Order (Pure Guest Mode)
    
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: name,
        customerPhone: phone,
        customerWilaya: wilayaName,
        customerCommune: commune,
        customerAddress: address,
        userId: null, 
        items: items.map(({imageUrl, ...rest}) => rest), // Remove imageUrl for API
        // Coupon removed
        couponCode: null,
        discountAmount: 0
      })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to place order');
    }

    const data = await res.json();
    console.log('submitOrder: API success, data received:', data);
    
    // ⭐ Save to Local Guest History
    registerOrderInHistory({
      _id: data._id,
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      customerWilaya: wilayaName,
      customerCommune: commune,
      totalPrice: data.totalPrice,
      createdAt: data.createdAt || new Date().toISOString(),
      items: items
    });

    // Clear cart
    await clearCart();
    
    // Reset state
    currentDiscount = 0;
    // appliedCouponCode removed
    
    // Reset form
    document.getElementById('orderForm').reset();
    
    // Hide checkout, close cart
    hideCheckoutForm();
    toggleCart();
    
    // Show success message and redirect
    showCartNotification('✅ Order placed successfully! Redirecting...');
    setTimeout(() => {
      window.location.href = `order-success.html?id=${data._id}`;
    }, 1000);
    
  } catch (err) {
    console.error('Error placing order:', err);
    showCartNotification(`❌ ${err.message || 'Failed to place order'}`);
  } finally {
    // Re-enable submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Place Order';
    }
  }
}

/**
 * Unified function to register an order in local history
 */
function registerOrderInHistory(orderData) {
  try {
    const guestOrder = {
      _id: orderData._id || Date.now().toString(),
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      customerWilaya: orderData.customerWilaya,
      customerCommune: orderData.customerCommune,
      totalPrice: orderData.totalPrice || 0,
      createdAt: orderData.createdAt || new Date().toISOString(),
      items: orderData.items
    };

    let localHistory = JSON.parse(localStorage.getItem('guestOrderHistory') || '[]');
    localHistory.unshift(guestOrder);
    
    // Keep last 10 orders
    localStorage.setItem('guestOrderHistory', JSON.stringify(localHistory.slice(0, 10)));
    
    // Save user info for future auto-filling
    localStorage.setItem('guestUserInfo', JSON.stringify({
      name: orderData.customerName,
      phone: orderData.customerPhone,
      address: orderData.customerAddress,
      wilaya: orderData.customerWilaya,
      commune: orderData.customerCommune
    }));
    
    console.log('Order details registered to localStorage.');
  } catch (err) {
    console.error('Error saving order to localStorage:', err);
  }
}

// Toast Container initialized during initApp or on-demand
function ensureToastContainer() {
  if (!document.querySelector('.toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 400); // Wait for transition
  }, 3000);
}

// ==================== REVIEWS LOGIC ====================

// Render star rating HTML
function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<span class="star filled">★</span>';
    } else if (i - 0.5 <= rating) {
      stars += '<span class="star half">★</span>'; // Optional: if we supported half stars
    } else {
      stars += '<span class="star">★</span>';
    }
  }
  return stars;
}

// Toggle Product Review Form
window.toggleReviewForm = function() {
  const formContainer = document.getElementById('reviewFormContainer');
  if (formContainer) {
    const isHidden = formContainer.style.display === 'none';
    formContainer.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      // Scroll to form
      formContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

// Load Product Reviews
async function loadProductReviews(productId) {
  const track = document.getElementById('productReviewsTrack');
  if (!track) return;

  track.innerHTML = '<div class="product-review-slide"><p>Loading reviews...</p></div>';

  try {
    const res = await fetch(`/api/reviews/${productId}`);
    const reviews = await res.json();

    if (reviews.length === 0) {
      track.innerHTML = '<div class="product-review-slide"><p class="no-reviews">No reviews yet. Be the first to review!</p></div>';
      // Hide rating summary and inline preview if no reviews
      const ratingSummary = document.getElementById('productRatingSummary');
      const inlinePreview = document.getElementById('inlineReviewsPreview');
      if (ratingSummary) ratingSummary.style.display = 'none';
      if (inlinePreview) inlinePreview.style.display = 'none';
      return;
    }

    // Calculate average rating
    const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    
    // Update Rating Summary near title
    const ratingSummary = document.getElementById('productRatingSummary');
    const ratingStars = document.getElementById('ratingStars');
    const ratingScore = document.getElementById('ratingScore');
    const ratingCount = document.getElementById('ratingCount');
    
    if (ratingSummary && ratingStars && ratingScore && ratingCount) {
      ratingStars.innerHTML = renderStars(Math.round(avg));
      ratingScore.textContent = avg.toFixed(1);
      ratingCount.textContent = `(${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'})`;
      ratingSummary.style.display = 'flex';
    }
    
    // Update Inline Review Preview (show first 2 reviews)
    const inlinePreview = document.getElementById('inlineReviewsPreview');
    const inlineReviewsList = document.getElementById('inlineReviewsList');
    
    if (inlinePreview && inlineReviewsList) {
      const previewReviews = reviews.slice(0, 2);
      inlineReviewsList.innerHTML = previewReviews.map(r => `
        <div class="inline-review-card">
          <div class="inline-review-header">
            <div class="inline-review-avatar">${r.userName.charAt(0).toUpperCase()}</div>
            <div class="inline-review-author">
              <div class="name">${r.userName}</div>
              <div class="stars">${renderStars(r.rating)}</div>
            </div>
          </div>
          <p class="inline-review-text">${r.comment.length > 120 ? r.comment.substring(0, 120) + '...' : r.comment}</p>
        </div>
      `).join('');
      inlinePreview.style.display = 'block';
    }

    // Render full review carousel
    track.innerHTML = reviews.map(r => `
      <div class="product-review-slide">
        <div class="review-item">
          <div class="review-header">
            <span class="review-author">${r.userName}</span>
            <span class="review-date">${new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="review-rating">${renderStars(r.rating)}</div>
          <p class="review-text">${r.comment}</p>
        </div>
      </div>
    `).join('');
    
    // Initialize carousel state
    window.productReviewIndex = 0;
    updateProductReviewsCarousel();
    
    // Update old summary if elements exist (backwards compatibility)
    const avgRatingEl = document.querySelector('.average-rating');
    const starSummaryEl = document.querySelector('.rating-summary .stars');
    const countEl = document.querySelector('.review-count');
    
    if (avgRatingEl && starSummaryEl && countEl) {
      avgRatingEl.textContent = avg.toFixed(1);
      starSummaryEl.innerHTML = renderStars(Math.round(avg));
      countEl.textContent = `(${reviews.length} reviews)`;
    }

  } catch (err) {
    console.error('Error loading reviews:', err);
    track.innerHTML = '<div class="product-review-slide"><p class="error-msg">Failed to load reviews.</p></div>';
  }
}

// Product Review Carousel Logic
window.productReviewIndex = 0;

function getVisibleSlides() {
  if (window.innerWidth <= 576) return 1;
  if (window.innerWidth <= 992) return 2;
  return 4;
}

window.moveProductReviewsCarousel = function(direction) {
  const track = document.getElementById('productReviewsTrack');
  if (!track) return;
  
  const slides = track.querySelectorAll('.product-review-slide');
  if (slides.length === 0) return;

  const visibleSlides = getVisibleSlides();
  const maxIndex = Math.max(0, slides.length - visibleSlides);

  window.productReviewIndex += direction;
  
  if (window.productReviewIndex > maxIndex) {
    window.productReviewIndex = 0;
  } else if (window.productReviewIndex < 0) {
    window.productReviewIndex = maxIndex;
  }
  
  updateProductReviewsCarousel();
};

function updateProductReviewsCarousel() {
  const track = document.getElementById('productReviewsTrack');
  if (!track) return;
  
  const visibleSlides = getVisibleSlides();
  const percent = 100 / visibleSlides;
  track.style.transform = `translateX(-${window.productReviewIndex * percent}%)`;
}

// Update carousel on resize
window.addEventListener('resize', () => {
  // Reset index or clamp it on resize to avoid empty space
  const track = document.getElementById('productReviewsTrack');
  if (track) {
    const slides = track.querySelectorAll('.product-review-slide');
    const visibleSlides = getVisibleSlides();
    const maxIndex = Math.max(0, slides.length - visibleSlides);
    if (window.productReviewIndex > maxIndex) {
      window.productReviewIndex = maxIndex;
    }
    updateProductReviewsCarousel();
  }
});

// Submit Product Review
window.submitReview = async function(event) {
  event.preventDefault();
  
  const productId = getProductIdFromURL();
  if (!productId) {
    showToast('Error: Product not found', 'error');
    return;
  }

  const name = document.getElementById('reviewName').value;
  const comment = document.getElementById('reviewComment').value;
  const ratingEl = document.querySelector('input[name="rating"]:checked');
  
  if (!ratingEl) {
    showToast('Please select a rating', 'error');
    return;
  }
  
  const rating = parseInt(ratingEl.value);

  const submitBtn = event.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        userName: name,
        rating,
        comment,
        type: 'product'
      })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit review');
    }

    showToast('Review submitted successfully!');
    document.getElementById('reviewForm').reset();
    toggleReviewForm();
    loadProductReviews(productId);

  } catch (err) {
    console.error('Error submitting review:', err);
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

// ==================== STORE REVIEWS LOGIC ====================

// Toggle Store Review Form
window.toggleStoreReviewForm = function() {
  const formContainer = document.getElementById('storeReviewFormContainer');
  if (formContainer) {
    const isHidden = formContainer.style.display === 'none';
    formContainer.style.display = isHidden ? 'block' : 'none';
  }
};

// Load Store Reviews
async function loadStoreReviews() {
  const track = document.getElementById('storeReviewsTrack');
  if (!track) return;

  track.innerHTML = '<div class="store-review-slide"><p>Loading reviews...</p></div>';

  try {
    const res = await fetch('/api/reviews/store');
    const reviews = await res.json();

    if (reviews.length === 0) {
      track.innerHTML = '<div class="store-review-slide"><p class="no-reviews">No reviews yet.</p></div>';
      return;
    }

    track.innerHTML = reviews.map(r => `
      <div class="store-review-slide">
        <div class="review-item">
          <div class="review-header">
            <span class="review-author">${r.userName}</span>
            <span class="review-date">${new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="review-rating">${renderStars(r.rating)}</div>
          <p class="review-text">"${r.comment}"</p>
        </div>
      </div>
    `).join('');
    
    // Initialize carousel state
    window.storeReviewIndex = 0;
    updateStoreReviewsCarousel();

  } catch (err) {
    console.error('Error loading store reviews:', err);
    track.innerHTML = '<div class="store-review-slide"><p class="error-msg">Failed to load reviews.</p></div>';
  }
}

// Store Review Carousel Logic
window.storeReviewIndex = 0;

// Move Store Reviews Carousel
window.moveStoreReviewsCarousel = function(direction) {
  const track = document.getElementById('storeReviewsTrack');
  if (!track) return;
  
  const slides = track.querySelectorAll('.store-review-slide');
  if (slides.length === 0) return;

  const visibleSlides = getVisibleSlides();
  const maxIndex = Math.max(0, slides.length - visibleSlides);

  window.storeReviewIndex += direction;
  
  if (window.storeReviewIndex > maxIndex) {
    window.storeReviewIndex = 0;
  } else if (window.storeReviewIndex < 0) {
    window.storeReviewIndex = maxIndex;
  }
  
  updateStoreReviewsCarousel();
};

function updateStoreReviewsCarousel() {
  const track = document.getElementById('storeReviewsTrack');
  if (!track) return;
  
  const slides = track.querySelectorAll('.store-review-slide');
  if (slides.length === 0) return;

  const slideWidth = 100 / getVisibleSlides();
  const offset = window.storeReviewIndex * slideWidth;
  
  track.style.transform = `translateX(-${offset}%)`;
}

// Submit Store Review
window.submitStoreReview = async function(event) {
  event.preventDefault();
  
  const name = document.getElementById('storeReviewName').value;
  const comment = document.getElementById('storeReviewComment').value;
  const ratingEl = document.querySelector('input[name="storeRating"]:checked');
  
  if (!ratingEl) {
    showToast('Please select a rating', 'error');
    return;
  }
  
  const rating = parseInt(ratingEl.value);
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: name,
        rating,
        comment,
        type: 'store'
      })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit review');
    }

    showToast('Store review submitted successfully!');
    document.getElementById('storeReviewForm').reset();
    toggleStoreReviewForm();
    loadStoreReviews();

  } catch (err) {
    console.error('Error submitting store review:', err);
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

// Toggle Reviews Section
function toggleReviewsSection() {
  const reviewsSection = document.getElementById('reviewsSection');
  const btn = document.getElementById('toggleReviewsBtn');
  
  if (reviewsSection.style.display === 'none') {
    reviewsSection.style.display = 'block';
    btn.textContent = 'Hide Reviews';
    // Ensure carousel is updated when shown
    updateProductReviewsCarousel();
  } else {
    reviewsSection.style.display = 'none';
    btn.textContent = 'Show Reviews';
  }
}

// Load Related Products
async function loadRelatedProducts(category, currentId) {
  console.log('=== loadRelatedProducts called ===', { category, currentId });
  const grid = document.getElementById('relatedProductsGrid');
  if (!grid) return;
  
  grid.innerHTML = '<p>Loading related products...</p>';
  
  try {
    // Fetch all products (in a real app, use a category endpoint)
    const res = await fetch(PRODUCTS_API);
    const products = await res.json();
    
    // Filter: same category, exclude current, limit to 4
    let related = products.filter(p => p._id !== currentId);
    
    if (category) {
      const sameCategory = related.filter(p => p.category === category);
      if (sameCategory.length > 0) {
        related = sameCategory;
      }
    }
    
    // Shuffle and pick 4
    related = related.sort(() => 0.5 - Math.random()).slice(0, 4);
    
    if (related.length === 0) {
      grid.innerHTML = '<p>No related products found.</p>';
      return;
    }
    
    const savedLang4 = localStorage.getItem('preferredLanguage') || 'en';
    const t4 = window.translations[savedLang4] || window.translations['en'];
    grid.innerHTML = related.map((p, index) => {
      const isOut = p.quantity <= 0;
      let saleBadge = '';
      if (p.previousPrice && p.previousPrice > p.price) {
        const percent = Math.round(((p.previousPrice - p.price) / p.previousPrice) * 100);
        saleBadge = `<div class="sale-badge">-${percent}%</div>`;
      }
      
      return `
      <div class="product-card ${isOut ? 'out-of-stock' : ''}" style="${!isOut ? 'cursor: pointer;' : ''}" ${!isOut ? `onclick="window.location.href='product.html?id=${p._id}'"` : ''}>
        <div class="product-image">
          ${saleBadge}
          <img src="${p.imageUrl || 'placeholder.jpg'}" alt="${p.name}" loading="lazy">
          ${isOut ? `<span class="badge not-available" data-i18n="not_available">${t4.not_available || 'Not Available'}</span>` : ''}
          <button class="btn-wishlist ${checkWishlistState(p._id) ? 'active' : ''}" 
            data-id="${p._id}"
            onclick="event.stopPropagation(); toggleWishlist(this, '${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.imageUrl || 'placeholder.jpg'}', '${p.category || ''}')" 
            aria-label="Add to Wishlist">
            ♥
          </button>
          <button class="btn-quick-view related-qv-btn" data-product-id="${p._id}" title="Quick View">
            👁️
          </button>
        </div>
        <div class="product-info">
          <h3 class="product-title">${p.name}</h3>
          ${p.quantity > 0 && p.quantity <= 5 ? `<div class="stock-warning">Only ${p.quantity} left!</div>` : ''}
          <div class="product-price">${window.getPriceHTML(p.price, p.previousPrice)}</div>
          <div class="product-actions">
            <button class="btn-buy-now" onclick="event.stopPropagation(); window.location.href='product.html?id=${p._id}'" ${isOut ? 'disabled' : ''}>Buy Now</button>
            <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.imageUrl || ''}', 1)" ${isOut ? 'disabled' : ''}>Add to Cart</button>
          </div>
        </div>
      </div>
    `}).join('');
    
    // Attach event listeners to quick view buttons
    requestAnimationFrame(() => {
      const qvButtons = grid.querySelectorAll('.related-qv-btn');
      console.log('Found quick view buttons:', qvButtons.length);
      qvButtons.forEach((btn, index) => {
        console.log(`Attaching listener to button ${index}`);
        btn.addEventListener('click', (e) => {
          console.log('Quick view button clicked!');
          e.stopPropagation();
          e.preventDefault();
          const productId = btn.getAttribute('data-product-id');
          console.log('Opening quick view for product:', productId);
          if (typeof window.openQuickView === 'function') {
            window.openQuickView(productId);
          } else {
            console.error('window.openQuickView is not a function');
          }
        });
      });
    });
    
  } catch (err) {
    console.error('Error loading related products:', err);
    grid.innerHTML = '<p>Failed to load related products.</p>';
  }
}

function startFeaturedAutoPlay() {
  const track = document.getElementById('featured-collection-track');
  if (!track) return;
  
  // Enable fade mode
  track.classList.add('fade-mode');
  
  let idx = 0;
  const slides = track.children;
  
  if (slides.length === 0) return;

  // Initialize first slide
  slides[0].classList.add('active');

  setInterval(() => {
    // Remove active class from current
    slides[idx].classList.remove('active');
    
    // Move to next
    idx = (idx + 1) % slides.length;
    
    // Add active class to next
    slides[idx].classList.add('active');
  }, 5000);
}

// ==================== Image Zoom Toggle (Product Page) ====================
window.toggleZoom = function(container) {
  if (!container) return;
  
  // Toggle zoomed class
  container.classList.toggle('zoomed');
  
  // If zoomed, track mouse/touch position for panning
  if (container.classList.contains('zoomed')) {
    const img = container.querySelector('img');
    
    const handleMove = (e) => {
      const rect = container.getBoundingClientRect();
      let x, y;
      
      if (e.touches) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;
      
      img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    };
    
    container.addEventListener('mousemove', handleMove);
    container.addEventListener('touchmove', handleMove);
    
    // Store reference to remove later
    container._handleMove = handleMove;
  } else {
    // Remove listeners and reset
    const img = container.querySelector('img');
    img.style.transformOrigin = 'center center';
    
    if (container._handleMove) {
      container.removeEventListener('mousemove', container._handleMove);
      container.removeEventListener('touchmove', container._handleMove);
    }
  }
};

// ==================== Image Swipe Gestures (Product Page) ====================
window._currentImageIndex = 0;

function initImageSwipe(images) {
  const container = document.getElementById('zoomContainer');
  if (!container || images.length <= 1) return;
  
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  
  const handleTouchStart = (e) => {
    // Don't start swipe if zoomed
    if (container.classList.contains('zoomed')) return;
    
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  };
  
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = startX - currentX;
    const diffY = startY - currentY;
    
    // If horizontal swipe is greater than vertical, prevent scroll
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      e.preventDefault();
    }
  };
  
  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        // Swipe left - next image
        navigateImage(1, images);
      } else {
        // Swipe right - previous image
        navigateImage(-1, images);
      }
    }
  };
  
  // Remove old listeners if they exist
  if (container._swipeHandlers) {
    container.removeEventListener('touchstart', container._swipeHandlers.start);
    container.removeEventListener('touchmove', container._swipeHandlers.move);
    container.removeEventListener('touchend', container._swipeHandlers.end);
  }
  
  // Store references and add listeners
  container._swipeHandlers = {
    start: handleTouchStart,
    move: handleTouchMove,
    end: handleTouchEnd
  };
  
  container.addEventListener('touchstart', handleTouchStart, { passive: true });
  container.addEventListener('touchmove', handleTouchMove, { passive: false });
  container.addEventListener('touchend', handleTouchEnd, { passive: true });
}

function navigateImage(direction, images) {
  const newIndex = window._currentImageIndex + direction;
  
  // Bounds check
  if (newIndex < 0 || newIndex >= images.length) return;
  
  window._currentImageIndex = newIndex;
  const newSrc = images[newIndex];
  
  // Update main image with animation
  const mainImg = document.getElementById('img');
  mainImg.style.opacity = '0.5';
  mainImg.style.transform = direction > 0 ? 'translateX(-20px)' : 'translateX(20px)';
  
  setTimeout(() => {
    mainImg.src = newSrc;
    mainImg.style.opacity = '1';
    mainImg.style.transform = 'translateX(0)';
  }, 150);
  
  // Update thumbnail active state
  const thumbnails = document.querySelectorAll('.thumbnail');
  thumbnails.forEach((thumb, i) => {
    thumb.classList.toggle('active', i === newIndex);
    
    // Scroll thumbnail into view
    if (i === newIndex) {
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
}

// ==================== Quantity Selector ====================
window.updateQuantity = function(change) {
  const qtyInput = document.getElementById('customerQty');
  if (!qtyInput) return;
  
  let currentValue = parseInt(qtyInput.value) || 1;
  let newValue = currentValue + change;
  
  // Minimum 1
  if (newValue < 1) newValue = 1;
  
  // Get max stock if available (from product data)
  const maxStock = window._currentProductStock || 99;
  if (newValue > maxStock) {
    newValue = maxStock;
    // Optional: Show feedback
    if (window.showToast) {
      showToast(`Maximum ${maxStock} available`, 'warning');
    }
  }
  
  qtyInput.value = newValue;
  
  // Add button animation feedback
  const btn = change > 0 ? document.querySelector('.qty-btn.plus') : document.querySelector('.qty-btn.minus');
  if (btn) {
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 100);
  }
};

// ==================== Share Product Function ====================
window.shareProduct = function(platform) {
  const currentUrl = window.location.href;
  const productTitle = document.getElementById('title')?.textContent || 'Check out this product!';
  const shareText = `${productTitle} - ${currentUrl}`;
  
  let shareUrl = '';
  let toastMessage = '';
  let toastType = 'success';
  
  switch(platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
      toastMessage = '📘 Opening Facebook...';
      window.open(shareUrl, '_blank', 'width=600,height=400');
      break;
      
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(productTitle)}&url=${encodeURIComponent(currentUrl)}`;
      toastMessage = '🐦 Opening Twitter/X...';
      window.open(shareUrl, '_blank', 'width=600,height=400');
      break;
      
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      toastMessage = '💬 Opening WhatsApp...';
      window.open(shareUrl, '_blank');
      break;
      
    case 'copy':
      // Copy to clipboard
      navigator.clipboard.writeText(currentUrl).then(() => {
        toastMessage = '✓ Link copied to clipboard!';
        showToast(toastMessage, 'success');
        
        // Add visual feedback to button
        const copyBtn = document.querySelector('.share-btn.copy-link');
        if (copyBtn) {
          copyBtn.classList.add('copied');
          copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          `;
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            `;
          }, 2000);
        }
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toastMessage = '✓ Link copied to clipboard!';
        showToast(toastMessage, 'success');
      });
      return; // Early return, toast already shown
      
    default:
      toastMessage = 'Sharing...';
  }
  
  // Show toast for other platforms
  if (platform !== 'copy') {
    showToast(toastMessage, toastType);
  }
};

/* =========================================
   SCROLL ANIMATIONS
========================================= */
function initScrollAnimations() {
  // Check if IntersectionObserver is supported
  if (!('IntersectionObserver' in window)) {
    // If not supported, just show everything immediately
    document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observerOptions = {
    threshold: 0.15, // Trigger when 15% visible
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Run once per element
      }
    });
  }, observerOptions);

  const hiddenElements = document.querySelectorAll('.reveal-on-scroll');
  hiddenElements.forEach((el) => observer.observe(el));
}

// Start animations when DOM is ready
// initScrollAnimations called in initApp
