/**
 * Luma Homepage Script
 */
document.addEventListener('DOMContentLoaded', function() {
    loadHotSellers();
    setupNewsletterForm();
    setupSearch();
});

function loadHotSellers() {
    const hotSellersContainer = document.getElementById('hotSellers');
    if (!hotSellersContainer) return;

    const featuredProducts = ProductManager.getFeaturedProducts(8);
    
    // Set page data for consolidated page load event
    if (window.DataLayerManager && typeof window.DataLayerManager.setPageData === 'function') {
        window.DataLayerManager.setPageData({
            page: {
                name: 'Home'
            },
            ecommerce: {
                currencyCode: 'USD',
                impressions: featuredProducts.map((product, index) => ({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    subcategory: product.subcategory,
                    brand: 'Luma',
                    list: 'Hot Sellers',
                    position: index + 1
                }))
            }
        });
        // Signal that page data is ready
        window.dispatchEvent(new CustomEvent('pageDataReady'));
    }

    hotSellersContainer.innerHTML = featuredProducts.map(product => `
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

function setupNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterMessage = document.getElementById('newsletterMessage');

    if (!newsletterForm) return;

    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail').value;

        const subscribers = JSON.parse(localStorage.getItem('lumaNewsletterSubscribers') || '[]');
        
        if (subscribers.includes(email)) {
            newsletterMessage.textContent = 'You are already subscribed!';
            newsletterMessage.className = 'newsletter-message error';
        } else {
            subscribers.push(email);
            localStorage.setItem('lumaNewsletterSubscribers', JSON.stringify(subscribers));
            
            if (window.DataLayerManager) {
                window.DataLayerManager.newsletterSignup(email);
            }

            newsletterMessage.textContent = 'Thank you for subscribing!';
            newsletterMessage.className = 'newsletter-message success';
            newsletterForm.reset();
        }

        setTimeout(() => {
            newsletterMessage.textContent = '';
            newsletterMessage.className = 'newsletter-message';
        }, 5000);
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
                window.location.href = 'category-women.html';
            }
        }
    });
}

function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}
