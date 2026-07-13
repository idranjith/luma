/**
 * Adobe Data Layer - Event-Driven Analytics
 */
window.adobeDataLayer = window.adobeDataLayer || [];

const DataLayerManager = {
    pageData: {},
    
    push: function(event) {
        const timestamp = new Date().toISOString();
        const eventData = {
            ...event,
            timestamp: timestamp,
            page: {
                name: this.getPageName(),
                url: window.location.href,
                path: window.location.pathname,
                title: document.title
            }
        };
        
        window.adobeDataLayer.push(eventData);
        console.log('Data Layer Event:', eventData);
        
        window.dispatchEvent(new CustomEvent('adobeDataLayerEvent', {
            detail: eventData
        }));
    },

    setPageData: function(data) {
        this.pageData = { ...this.pageData, ...data };
    },

    pageView: function(additionalData = {}) {
        // Prevent duplicate calls
        if (window.pageDataFired) {
            return;
        }
        window.pageDataFired = true;
        
        const pageType = this.getPageType();
        const userData = this.getUserData();
        
        // Determine the appropriate event name based on page type and data
        let eventName = 'pageView';
        if (pageType === 'product' && this.pageData.ecommerce?.detail) {
            eventName = 'productView';
        } else if (pageType === 'category' && this.pageData.ecommerce?.impressions) {
            eventName = 'categoryView';
        } else if (pageType === 'cart' && this.pageData.ecommerce?.cart) {
            eventName = 'cartView';
        } else if (pageType === 'checkout' && this.pageData.ecommerce?.checkout) {
            eventName = 'checkout';
        } else if (pageType === 'confirmation' && this.pageData.ecommerce?.purchase) {
            eventName = 'purchase';
        }
        
        // Build the complete event data
        const eventData = {
            event: eventName,
            pageType: pageType,
            user: userData,
            ...this.pageData,
            ...additionalData
        };
        
        this.push(eventData);
        
        // Clear page data after sending
        this.pageData = {};
    },

    productView: function(product) {
        this.push({
            event: 'productView',
            ecommerce: {
                detail: {
                    products: [{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        category: product.category,
                        subcategory: product.subcategory,
                        brand: 'Luma'
                    }]
                }
            }
        });
    },

    productListView: function(products, listName) {
        this.push({
            event: 'productListView',
            ecommerce: {
                impressions: products.map(product => ({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    subcategory: product.subcategory,
                    list: listName,
                    brand: 'Luma'
                }))
            }
        });
    },

    addToCart: function(product, quantity = 1, size = null, color = null, cartId = null) {
        this.push({
            event: 'addToCart',
            cartId: cartId,
            ecommerce: {
                currencyCode: 'USD',
                add: {
                    products: [{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        category: product.category,
                        subcategory: product.subcategory,
                        quantity: quantity,
                        brand: 'Luma',
                        size: size,
                        color: color
                    }]
                }
            }
        });
    },

    removeFromCart: function(product, quantity = 1, size = null, color = null, cartId = null) {
        this.push({
            event: 'removeFromCart',
            cartId: cartId,
            ecommerce: {
                remove: {
                    products: [{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        category: product.category,
                        subcategory: product.subcategory,
                        quantity: quantity,
                        size: size,
                        color: color
                    }]
                }
            }
        });
    },

    cartView: function(cartItems, cartTotal) {
        this.push({
            event: 'cartView',
            ecommerce: {
                cart: {
                    items: cartItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        category: item.category,
                        subcategory: item.subcategory,
                        quantity: item.quantity,
                        size: item.selectedSize,
                        color: item.selectedColor
                    })),
                    total: cartTotal
                }
            }
        });
    },

    checkoutStep: function(step, cartItems) {
        this.push({
            event: 'checkout',
            ecommerce: {
                checkout: {
                    actionField: { step: step },
                    products: cartItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        category: item.category,
                        subcategory: item.subcategory,
                        size: item.selectedSize,
                        color: item.selectedColor
                    }))
                }
            }
        });
    },

    purchase: function(orderId, orderData, cartItems) {
        this.push({
            event: 'purchase',
            ecommerce: {
                purchase: {
                    actionField: {
                        id: orderId,
                        revenue: orderData.total,
                        tax: orderData.tax,
                        shipping: orderData.shipping
                    },
                    products: cartItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        category: item.category,
                        subcategory: item.subcategory,
                        brand: 'Luma',
                        size: item.selectedSize,
                        color: item.selectedColor
                    }))
                }
            }
        });
    },

    userLogin: function(userId, email) {
        this.push({
            event: 'userLogin',
            user: {
                id: userId,
                email: email,
                loggedIn: true
            }
        });
    },

    userLogout: function() {
        this.push({
            event: 'userLogout',
            user: {
                loggedIn: false
            }
        });
    },

    userRegistration: function(userId, email) {
        this.push({
            event: 'userRegistration',
            user: {
                id: userId,
                email: email,
                newUser: true
            }
        });
    },

    newsletterSignup: function(email) {
        this.push({
            event: 'newsletterSignup',
            newsletter: {
                email: email
            }
        });
    },

    searchPerformed: function(searchTerm, resultCount) {
        this.push({
            event: 'search',
            search: {
                term: searchTerm,
                results: resultCount
            }
        });
    },

    clickEvent: function(elementType, elementName, elementUrl) {
        this.push({
            event: 'elementClick',
            element: {
                type: elementType,
                name: elementName,
                url: elementUrl
            }
        });
    },

    formSubmit: function(formName, formData) {
        this.push({
            event: 'formSubmit',
            form: {
                name: formName,
                data: formData
            }
        });
    },

    getPageType: function() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('category')) return 'category';
        if (path.includes('product.html')) return 'product';
        if (path.includes('cart')) return 'cart';
        if (path.includes('checkout')) return 'checkout';
        if (path.includes('order-confirmation')) return 'confirmation';
        if (path.includes('account')) return 'account';
        return 'other';
    },

    getPageName: function() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'Home';
        if (path.includes('category-women')) return 'Women Category';
        if (path.includes('category-men')) return 'Men Category';
        if (path.includes('category-equipment')) return 'Equipment Category';
        if (path.includes('category')) return 'Category';
        if (path.includes('product.html')) return 'Product Detail';
        if (path.includes('cart')) return 'Shopping Cart';
        if (path.includes('checkout')) return 'Checkout';
        if (path.includes('order-confirmation')) return 'Order Confirmation';
        if (path.includes('account')) return 'My Account';
        return document.title || 'Unknown Page';
    },

    getUserData: function() {
        const userStr = localStorage.getItem('lumaUser');
        if (userStr) {
            const user = JSON.parse(userStr);
            return {
                id: user.id,
                email: user.email,
                loggedIn: true
            };
        }
        return {
            loggedIn: false
        };
    }
};

// Initialize page view - will be called after page-specific data is set
window.DataLayerManager = DataLayerManager;

// Event-driven pageView initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Listen for page-specific scripts to signal they're ready
        window.addEventListener('pageDataReady', function() {
            DataLayerManager.pageView();
        }, { once: true });
        
        // Fallback timeout for pages without specific data
        setTimeout(function() {
            if (!window.pageDataFired) {
                DataLayerManager.pageView();
            }
        }, 500);
    });
} else {
    // DOM already loaded
    window.addEventListener('pageDataReady', function() {
        DataLayerManager.pageView();
    }, { once: true });
    
    setTimeout(function() {
        if (!window.pageDataFired) {
            DataLayerManager.pageView();
        }
    }, 500);
}
