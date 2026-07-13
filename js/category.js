/**
 * Luma Category Page Script
 */
let currentCategory = '';
let allCategoryProducts = [];
let filteredProducts = [];

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path.includes('women')) {
        currentCategory = 'women';
    } else if (path.includes('men')) {
        currentCategory = 'men';
    } else if (path.includes('equipment')) {
        currentCategory = 'equipment';
    }

    loadCategoryProducts();
    setupFilters();
    setupSorting();
    setupSearch();
});

function loadCategoryProducts() {
    allCategoryProducts = ProductManager.getProductsByCategory(currentCategory);
    filteredProducts = [...allCategoryProducts];
    
    // Set page data for consolidated page load event
    if (window.DataLayerManager && typeof window.DataLayerManager.setPageData === 'function') {
        const categoryName = ProductManager.getCategoryName(currentCategory);
        window.DataLayerManager.setPageData({
            page: {
                name: `${categoryName} Category`
            },
            ecommerce: {
                currencyCode: 'USD',
                impressions: allCategoryProducts.map((product, index) => ({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    subcategory: product.subcategory,
                    brand: 'Luma',
                    list: `${categoryName} Category`,
                    position: index + 1
                }))
            }
        });
        // Signal that page data is ready
        window.dispatchEvent(new CustomEvent('pageDataReady'));
    }

    displayProducts(filteredProducts);
}

function displayProducts(products) {
    const container = document.getElementById('categoryProducts');
    const countElement = document.getElementById('productCount');

    if (!container) return;

    countElement.textContent = products.length;

    if (products.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No products found matching your criteria.</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card" onclick="viewProduct('${product.id}')">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-details">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${ProductManager.formatPrice(product.price)}</div>
            </div>
        </div>
    `).join('');
}

function setupFilters() {
    const categoryCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    const colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', function() {
            this.classList.toggle('selected');
            applyFilters();
        });
    });
}

function applyFilters() {
    let products = [...allCategoryProducts];

    const selectedSubcategories = Array.from(document.querySelectorAll('.filter-group input[value="tops"]:checked, .filter-group input[value="bottoms"]:checked, .filter-group input[value="jackets"]:checked, .filter-group input[value="sports-bras"]:checked, .filter-group input[value="bags"]:checked, .filter-group input[value="fitness-equipment"]:checked'))
        .map(cb => cb.value);

    const selectedSizes = Array.from(document.querySelectorAll('.filter-group input[value="xs"]:checked, .filter-group input[value="s"]:checked, .filter-group input[value="m"]:checked, .filter-group input[value="l"]:checked, .filter-group input[value="xl"]:checked'))
        .map(cb => cb.value.toUpperCase());

    const selectedPriceRanges = Array.from(document.querySelectorAll('.filter-group input[value^="0-"]:checked, .filter-group input[value^="50-"]:checked, .filter-group input[value^="100-"]:checked'))
        .map(cb => cb.value);

    const selectedColors = Array.from(document.querySelectorAll('.color-swatch.selected'))
        .map(swatch => swatch.getAttribute('data-color'));

    if (selectedSubcategories.length > 0) {
        products = products.filter(p => selectedSubcategories.includes(p.subcategory));
    }

    if (selectedSizes.length > 0) {
        products = products.filter(p => 
            p.sizes.some(size => selectedSizes.includes(size))
        );
    }

    if (selectedPriceRanges.length > 0) {
        products = products.filter(p => {
            return selectedPriceRanges.some(range => {
                const [min, max] = range.split('-').map(Number);
                return p.price >= min && p.price <= max;
            });
        });
    }

    if (selectedColors.length > 0) {
        products = products.filter(p => 
            p.colors.some(color => selectedColors.includes(color.name.toLowerCase()))
        );
    }

    filteredProducts = products;
    displayProducts(filteredProducts);
}

function setupSorting() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function() {
        const sortBy = this.value;
        let products = [...filteredProducts];

        switch(sortBy) {
            case 'name':
                products.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price-low':
                products.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                products.sort((a, b) => b.price - a.price);
                break;
            default:
                break;
        }

        displayProducts(products);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                const results = ProductManager.searchProducts(query);
                if (window.DataLayerManager) {
                    window.DataLayerManager.searchPerformed(query, results.length);
                }
                filteredProducts = results.filter(p => p.category === currentCategory);
                displayProducts(filteredProducts);
            }
        }
    });
}

function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}
