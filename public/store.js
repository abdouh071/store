// Store.js - Product filtering, sorting, and rendering for store.html

(function() {
  console.log('Store.js loaded!');

  let storeProducts = []; // Renamed to avoid conflict
  let filteredProducts = [];

  // Initialize store page
  document.addEventListener('DOMContentLoaded', () => {
    // Only run on store.html
    if (!document.getElementById('productsGrid')) {
      console.log('Not on store page, skipping store.js initialization');
      return;
    }

    console.log('Initializing store page...');
    loadStoreProducts();
    initializeFilters();
    initializeMobileFilters();
    
    // Check for URL parameters (e.g., ?category=T-Shirts)
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const homeCategory = urlParams.get('homeCategory');
    const searchQuery = urlParams.get('search');

    if (category) {
    // Find the category radio button case‑insensitively
    const categoryRadios = document.querySelectorAll('input[name="category"]');
    categoryRadios.forEach(radio => {
      if (radio.value.toLowerCase() === category.toLowerCase()) {
        radio.checked = true;
      }
    });
  }

  if (homeCategory) {
    const homeCategoryRadio = document.querySelector(`input[name=\"homeCategory\"][value=\"${homeCategory}\"]`);
    if (homeCategoryRadio) homeCategoryRadio.checked = true;
  }
    if (searchQuery) {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = searchQuery;
    }
  });

  // Render Skeleton Helper
  function renderSkeletonProducts(count = 8) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.style.display = 'grid'; // Ensure grid is visible
    productsGrid.innerHTML = Array(count).fill(0).map(() => `
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

  // Load products from API
  async function loadStoreProducts() {
    console.log('Loading products...');
    const resultsCount = document.getElementById('resultsCount');
    const productsGrid = document.getElementById('productsGrid');
    
    // Show skeleton loading
    renderSkeletonProducts(8);
    
    try {
      // Add a timeout to the fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      // Fetch ALL products to allow client-side filtering
      const response = await fetch('/api/products', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache products globally
      if (Array.isArray(data)) {
        storeProducts = data;
        // Add to global cache for Quick View
        storeProducts.forEach(p => {
          if (!window.allProducts.find(ap => ap._id === p._id)) {
            window.allProducts.push(p);
          }
        });
      } else {
        console.error('API returned non-array data:', data);
        storeProducts = [];
      }

      console.log('Loaded products:', storeProducts.length);
      filteredProducts = [...storeProducts];
      
      applyFilters();
    } catch (error) {
      console.error('Error loading products:', error);
      if (resultsCount) {
        resultsCount.innerHTML = `<span style="color: red;">Error: ${error.message}. Is the server running?</span>`;
      }
      
      // Translation setup
      const savedLang = localStorage.getItem('preferredLanguage') || 'en';
      const t = window.translations[savedLang] || window.translations['en'];

      if (productsGrid) {
        productsGrid.innerHTML = `
          <div class="empty-state">
             <div class="empty-state-icon">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
             </div>
             <h3>${t.failed_load_products}</h3>
             <p>${error.message}<br>${t.server_error_desc}</p>
             <button onclick="location.reload()" class="btn-primary empty-state-action">${t.retry}</button>
          </div>
        `;
      }
    }
  }

  // Initialize filter event listeners
  function initializeFilters() {
    // Instant Search
    initializeInstantSearch();

    // Price Slider
    initializePriceSlider();

    // Category radio buttons
    const categoryRadios = document.querySelectorAll('input[name="category"]');
    categoryRadios.forEach(radio => {
      radio.addEventListener('change', applyFilters);
    });

    // Collection radio buttons
    const collectionRadios = document.querySelectorAll('input[name="homeCategory"]');
    collectionRadios.forEach(radio => {
      radio.addEventListener('change', applyFilters);
    });

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', applyFilters);
    }

    // Clear filters button
    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
      clearFilters.addEventListener('click', () => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.classList.remove('active');
        }

        const allCategoryRadio = document.getElementById('cat-all');
        if (allCategoryRadio) allCategoryRadio.checked = true;
        
        const allCollectionRadio = document.getElementById('col-all');
        if (allCollectionRadio) allCollectionRadio.checked = true;
        
        // Reset sliders
        const minSlider = document.getElementById('minPriceSlider');
        const maxSlider = document.getElementById('maxPriceSlider');
        const minInput = document.getElementById('minPrice');
        const maxInput = document.getElementById('maxPrice');
        
        if (minSlider) minSlider.value = 0;
        if (maxSlider) maxSlider.value = 1000;
        if (minInput) minInput.value = 0;
        if (maxInput) maxInput.value = 1000;
        updateSliderTrack();

        if (sortSelect) sortSelect.value = 'default';
        applyFilters();
      });
    }
  }

  function initializeInstantSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchInput || !searchResults) return;

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
        searchResults.classList.remove('active');
      }
    });

    // Show dropdown on focus if there's input
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length > 0) {
         searchResults.style.display = 'block';
         searchResults.classList.add('active');
      }
    });

    searchInput.addEventListener('input', debounce((e) => {
      const term = e.target.value.toLowerCase().trim();
      
      // Update Grid Filter
      applyFilters();

      // Update Dropdown
      if (term.length === 0) {
        searchResults.style.display = 'none';
        searchResults.classList.remove('active');
        return;
      }

      const matches = storeProducts.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.description && p.description.toLowerCase().includes(term))
      ).slice(0, 5); // Limit to top 5

      if (matches.length > 0) {
        searchResults.innerHTML = matches.map(p => `
          <div class="search-item" onclick="window.location.href='product.html?id=${p._id}'">
            <img src="${p.imageUrl || 'placeholder.jpg'}" alt="${p.name}">
            <div class="search-item-info">
              <h4>${p.name}</h4>
              <span>$${p.price.toFixed(2)}</span>
            </div>
          </div>
        `).join('');
        searchResults.style.display = 'block';
        searchResults.classList.add('active');
      } else {
        const savedLang = localStorage.getItem('preferredLanguage') || 'en';
        const t = window.translations[savedLang] || window.translations['en'];
        searchResults.innerHTML = `<div style="padding:10px; text-align:center; color:#666;">${t.no_matches_found}</div>`;
        searchResults.style.display = 'block';
        searchResults.classList.add('active');
      }
    }, 300));
  }

  function initializePriceSlider() {
    const minSlider = document.getElementById('minPriceSlider');
    const maxSlider = document.getElementById('maxPriceSlider');
    const minInput = document.getElementById('minPrice');
    const maxInput = document.getElementById('maxPrice');
    const track = document.querySelector('.slider-track');

    if (!minSlider || !maxSlider || !minInput || !maxInput) return;

    // Create highlight track if not exists
    let highlight = document.querySelector('.slider-track-highlight');
    if (!highlight && track) {
        highlight = document.createElement('div');
        highlight.className = 'slider-track-highlight';
        track.appendChild(highlight);
    }

    function updateTrack() {
        const min = parseInt(minSlider.value);
        const max = parseInt(maxSlider.value);
        const range = parseInt(maxSlider.max);
        
        // Prevent crossover
        if (min > max - 10) {
            // if dragged min, push min back
            if (this === minSlider) minSlider.value = max - 10;
            // if dragged max, push max forward
            else maxSlider.value = min + 10;
        }

        const minPercent = (parseInt(minSlider.value) / range) * 100;
        const maxPercent = (parseInt(maxSlider.value) / range) * 100;

        if(highlight) {
            highlight.style.left = minPercent + '%';
            highlight.style.width = (maxPercent - minPercent) + '%';
        }
        
        minInput.value = minSlider.value;
        maxInput.value = maxSlider.value;
    }

    // Attach listeners
    minSlider.addEventListener('input', function() { updateTrack.call(this); applyFilters(); });
    maxSlider.addEventListener('input', function() { updateTrack.call(this); applyFilters(); });
    
    // Inputs updating sliders
    minInput.addEventListener('change', function() {
        let val = parseInt(this.value);
        if(val >= parseInt(maxSlider.value)) val = parseInt(maxSlider.value) - 10;
        minSlider.value = val;
        updateTrack();
        applyFilters();
    });
    
    maxInput.addEventListener('change', function() {
        let val = parseInt(this.value);
        if(val <= parseInt(minSlider.value)) val = parseInt(minSlider.value) + 10;
        maxSlider.value = val;
        updateTrack();
        applyFilters();
    });

    // Make global for reset
    window.updateSliderTrack = updateTrack;
    
    // Init
    updateTrack();
  }

  // Initialize mobile filter toggle
  function initializeMobileFilters() {
    const filterToggle = document.getElementById('filterToggle');
    const filterSidebar = document.getElementById('filterSidebar');
    const filterOverlay = document.getElementById('filterOverlay');
    const closeFilters = document.getElementById('closeFilters');

    if (filterToggle) {
      filterToggle.addEventListener('click', () => {
        if (filterSidebar) filterSidebar.classList.add('active');
        if (filterOverlay) filterOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }

    if (closeFilters) {
      closeFilters.addEventListener('click', closeFilterSidebar);
    }

    if (filterOverlay) {
      filterOverlay.addEventListener('click', closeFilterSidebar);
    }

    function closeFilterSidebar() {
      if (filterSidebar) filterSidebar.classList.remove('active');
      if (filterOverlay) filterOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Apply all filters and sorting
  function applyFilters() {
    console.log('Applying filters...');
    
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const selectedCategoryRadio = document.querySelector('input[name="category"]:checked');
    const selectedCategory = selectedCategoryRadio ? selectedCategoryRadio.value : '';

    const selectedCollectionRadio = document.querySelector('input[name="homeCategory"]:checked');
    const selectedCollection = selectedCollectionRadio ? selectedCollectionRadio.value : '';
    
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const minPrice = parseFloat(minPriceInput?.value) || 0;
    const maxPrice = parseFloat(maxPriceInput?.value) || Infinity;
    
    const sortSelect = document.getElementById('sortSelect');
    const sortBy = sortSelect ? sortSelect.value : 'default';

    // Filter products
    filteredProducts = storeProducts.filter(product => {
      // Search filter
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        product.category.toLowerCase().includes(searchTerm);

      // Category filter
      const matchesCategory = !selectedCategory || product.category === selectedCategory;

      // Collection filter
      const matchesCollection = !selectedCollection || product.homeCategory === selectedCollection;

      // Price filter
      const matchesPrice = product.price >= minPrice && product.price <= maxPrice;

      return matchesSearch && matchesCategory && matchesCollection && matchesPrice;
    });

    console.log('Filtered products:', filteredProducts.length);

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name-az':
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // Default order (as returned from API)
        break;
    }

    renderProducts();
    updateResultsCount();
    updatePageTitle(selectedCategoryRadio, selectedCollectionRadio);
  }

  // Update page title based on filters
  function updatePageTitle(categoryRadio, collectionRadio) {
    const titleElement = document.querySelector('.store-header h1');
    if (!titleElement) return;

    let title = 'All Products';
    
    const categoryText = categoryRadio ? categoryRadio.nextElementSibling.textContent.trim() : '';
    const collectionText = collectionRadio ? collectionRadio.nextElementSibling.textContent.trim() : '';

    if (collectionText && categoryText && categoryText !== 'All Products' && collectionText !== 'All Collections') {
      title = `${collectionText} ${categoryText}`;
    } else if (collectionText && collectionText !== 'All Collections') {
      title = collectionText;
    } else if (categoryText && categoryText !== 'All Products') {
      title = categoryText;
    }

    titleElement.textContent = title;
  }

  // Render products to the grid
  function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');

    if (!grid || !noResults) {
      console.error('Grid or noResults element not found');
      return;
    }

    if (filteredProducts.length === 0) {
      grid.style.display = 'none';
      noResults.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    noResults.style.display = 'none';

    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    const t = window.translations[savedLang] || window.translations['en'];
    grid.innerHTML = filteredProducts.map(product => {
      const isOut = product.quantity <= 0;
      let saleBadge = '';
      if (product.previousPrice && product.previousPrice > product.price) {
        const percent = Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100);
        saleBadge = `<div class="sale-badge">-${percent}%</div>`;
      }

      const stockWarning = product.quantity > 0 && product.quantity <= 5 
        ? `<div class="stock-warning">Only ${product.quantity} left!</div>` 
        : '';
        
      return `

      <div class="product-card ${isOut ? 'out-of-stock' : ''}" ${!isOut ? `onclick="window.location.href='product.html?id=${product._id}'"` : ''}>
        <div class="product-image">
          ${saleBadge}
          <img src="${product.imageUrl || 'https://via.placeholder.com/400x500?text=No+Image'}" 
               alt="${product.name}"
               loading="lazy"
               onerror="this.src='https://via.placeholder.com/400x500?text=No+Image'">
          ${isOut ? `<span class="badge not-available" data-i18n="not_available">${t.not_available || 'Not Available'}</span>` : ''}
          <button class="btn-wishlist ${window.checkWishlistState && window.checkWishlistState(product._id) ? 'active' : ''}" 
            data-id="${product._id}"
            onclick="event.stopPropagation(); window.toggleWishlist(this, '${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.imageUrl || 'https://via.placeholder.com/400x500?text=No+Image'}', '${product.category || ''}')">
            ♥
          </button>
        </div>
          <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-desc">${(function(){const d=product.description||'Great quality product.';const l=35;return d.length>l?d.substring(0,l)+'<span style="color:#dc2626;font-weight:600;margin-left:2px;">...more</span>':d;})()}</p>
          <div class="product-price">${window.getPriceHTML(product.price, product.previousPrice)}</div>
          ${stockWarning}
          <div class="product-card-actions">
            <button class="btn-buy-now" onclick="event.stopPropagation(); window.location.href='product.html?id=${product._id}';" ${isOut ? 'disabled' : ''}>
              Buy Now
            </button>
            <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.imageUrl || 'https://via.placeholder.com/400x500?text=No+Image'}', 1);" ${isOut ? 'disabled' : ''}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `}).join('');

    console.log('Rendered', filteredProducts.length, 'products');
  }

  // Update results count
  function updateResultsCount() {
    const count = filteredProducts.length;
    const total = storeProducts.length;
    const resultsCount = document.getElementById('resultsCount');
    
    if (!resultsCount) return;
    
    if (count === total) {
      resultsCount.textContent = `Showing all ${total} products`;
    } else {
      resultsCount.textContent = `Showing ${count} of ${total} products`;
    }
  }

  // Debounce helper function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Quick View Logic moved to script.js
  // window.openQuickView and window.closeQuickView are now global

})();
