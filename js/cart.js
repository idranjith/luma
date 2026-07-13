/**
 * Luma Cart Management
 */
const CartManager = {
    getCart: function() {
        const cartStr = localStorage.getItem('lumaCart');
        return cartStr ? JSON.parse(cartStr) : [];
    },

    getCartId: function() {
        let cartId = localStorage.getItem('lumaCartId');
        if (!cartId) {
            cartId = this.generateCartId();
            localStorage.setItem('lumaCartId', cartId);
        }
        return cartId;
    },

    generateCartId: function() {
        return 'CART-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },

    clearCartId: function() {
        localStorage.removeItem('lumaCartId');
    },

    saveCart: function(cart) {
        localStorage.setItem('lumaCart', JSON.stringify(cart));
        this.updateCartCount();
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    },

    addItem: function(product, quantity = 1, selectedSize = null, selectedColor = null) {
        const cart = this.getCart();
        
        // Ensure we have a cart ID
        const cartId = this.getCartId();
        
        const existingItemIndex = cart.findIndex(item => 
            item.id === product.id && 
            item.selectedSize === selectedSize && 
            item.selectedColor === selectedColor
        );

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity,
                selectedSize: selectedSize,
                selectedColor: selectedColor,
                category: product.category,
                subcategory: product.subcategory
            });
        }

        this.saveCart(cart);
        
        // Fire addToCart data layer event
        if (window.DataLayerManager && typeof window.DataLayerManager.addToCart === 'function') {
            window.DataLayerManager.addToCart(product, quantity, selectedSize, selectedColor, cartId);
        }

        return true;
    },

    removeItem: function(itemId, selectedSize, selectedColor) {
        let cart = this.getCart();
        const itemIndex = cart.findIndex(item => 
            item.id === itemId && 
            item.selectedSize === selectedSize && 
            item.selectedColor === selectedColor
        );

        if (itemIndex > -1) {
            const item = cart[itemIndex];
            const cartId = this.getCartId();
            if (window.DataLayerManager) {
                window.DataLayerManager.removeFromCart(item, item.quantity, item.selectedSize, item.selectedColor, cartId);
            }
            cart.splice(itemIndex, 1);
            this.saveCart(cart);
        }
    },

    updateQuantity: function(itemId, selectedSize, selectedColor, newQuantity) {
        const cart = this.getCart();
        const itemIndex = cart.findIndex(item => 
            item.id === itemId && 
            item.selectedSize === selectedSize && 
            item.selectedColor === selectedColor
        );

        if (itemIndex > -1) {
            if (newQuantity <= 0) {
                this.removeItem(itemId, selectedSize, selectedColor);
            } else {
                cart[itemIndex].quantity = newQuantity;
                this.saveCart(cart);
            }
        }
    },

    getCartCount: function() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    },

    getSubtotal: function() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    calculateTax: function(subtotal) {
        return subtotal * 0.10;
    },

    getShippingCost: function(shippingMethod = 'standard') {
        const costs = {
            'standard': 5.00,
            'express': 15.00,
            'overnight': 25.00
        };
        return costs[shippingMethod] || 5.00;
    },

    getTotal: function(shippingMethod = 'standard') {
        const subtotal = this.getSubtotal();
        const tax = this.calculateTax(subtotal);
        const shipping = this.getShippingCost(shippingMethod);
        return subtotal + tax + shipping;
    },

    clearCart: function() {
        localStorage.removeItem('lumaCart');
        this.clearCartId();
        this.updateCartCount();
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    },

    updateCartCount: function() {
        const count = this.getCartCount();
        const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
        cartCountElements.forEach(element => {
            element.textContent = count;
        });
    },

    formatPrice: function(price) {
        return `$${price.toFixed(2)}`;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    CartManager.updateCartCount();
});

window.CartManager = CartManager;
