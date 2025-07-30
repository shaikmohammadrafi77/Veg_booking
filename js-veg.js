// Vegetable Data - Can be replaced with API call in production
const vegetables = [
    { id: 1, name: "Tomato", price: 40, image: "https://source.unsplash.com/random/300x200/?tomato", stock: 50 },
    { id: 2, name: "Potato", price: 25, image: "https://source.unsplash.com/random/300x200/?potato", stock: 100 },
    { id: 3, name: "Onion", price: 30, image: "https://source.unsplash.com/random/300x200/?onion", stock: 80 },
    { id: 4, name: "Carrot", price: 50, image: "https://source.unsplash.com/random/300x200/?carrot", stock: 40 },
    { id: 5, name: "Cabbage", price: 35, image: "https://source.unsplash.com/random/300x200/?cabbage", stock: 30 },
    { id: 6, name: "Cauliflower", price: 45, image: "https://source.unsplash.com/random/300x200/?cauliflower", stock: 25 },
    { id: 7, name: "Spinach", price: 20, image: "https://source.unsplash.com/random/300x200/?spinach", stock: 60 },
    { id: 8, name: "Brinjal", price: 35, image: "https://source.unsplash.com/random/300x200/?eggplant", stock: 35 }
];

// Cart Management
let cart = JSON.parse(localStorage.getItem('vegCart')) || [];

// DOM Elements
const vegContainer = document.getElementById('vegContainer');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const searchInput = document.getElementById('searchInput');
const notification = document.getElementById('notification');

// Initialize the application
function initApp() {
    renderVegetables();
    updateCartDisplay();
    setupEventListeners();
}

// Render vegetables to the page
function renderVegetables(vegList = vegetables) {
    vegContainer.innerHTML = '';
    
    if (vegList.length === 0) {
        vegContainer.innerHTML = '<p class="no-results">No vegetables found matching your search.</p>';
        return;
    }

    vegList.forEach(veg => {
        const vegCard = document.createElement('div');
        vegCard.className = 'veg-card';
        vegCard.innerHTML = `
            <div class="veg-image" style="background-image: url('${veg.image}')"></div>
            <div class="veg-info">
                <h3 class="veg-name">${veg.name}</h3>
                <div class="veg-price">₹${veg.price.toFixed(2)}/kg</div>
                <div class="veg-stock">${veg.stock} kg available</div>
                <div class="veg-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn minus" data-id="${veg.id}" aria-label="Decrease quantity">-</button>
                        <input type="number" class="quantity-input" data-id="${veg.id}" value="0" min="0" max="${veg.stock}" aria-label="Quantity">
                        <button class="quantity-btn plus" data-id="${veg.id}" aria-label="Increase quantity">+</button>
                    </div>
                    <button class="add-to-cart" data-id="${veg.id}">Add to Cart</button>
                </div>
            </div>
        `;
        vegContainer.appendChild(vegCard);
    });
}

// Setup all event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', debounce(function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filteredVeg = vegetables.filter(veg => 
            veg.name.toLowerCase().includes(searchTerm)
        );
        renderVegetables(filteredVeg);
    }, 300));

    // Checkout button
    checkoutBtn.addEventListener('click', handleCheckout);

    // Delegate events for dynamic elements
    document.addEventListener('click', function(e) {
        // Quantity minus button
        if (e.target.classList.contains('minus')) {
            const id = parseInt(e.target.dataset.id);
            const input = document.querySelector(`.quantity-input[data-id="${id}"]`);
            if (parseInt(input.value) > 0) {
                input.value = parseInt(input.value) - 1;
            }
        }
        
        // Quantity plus button
        if (e.target.classList.contains('plus')) {
            const id = parseInt(e.target.dataset.id);
            const input = document.querySelector(`.quantity-input[data-id="${id}"]`);
            const veg = vegetables.find(v => v.id === id);
            if (parseInt(input.value) < veg.stock) {
                input.value = parseInt(input.value) + 1;
            }
        }
        
        // Add to cart button
        if (e.target.classList.contains('add-to-cart')) {
            const id = parseInt(e.target.dataset.id);
            const input = document.querySelector(`.quantity-input[data-id="${id}"]`);
            const quantity = parseInt(input.value);
            const veg = vegetables.find(v => v.id === id);
            
            if (quantity > 0) {
                if (quantity > veg.stock) {
                    showNotification(`Only ${veg.stock} kg available for ${veg.name}`, 'error');
                    return;
                }
                addToCart(id, quantity);
                input.value = 0;
                showNotification(`${quantity} kg ${veg.name} added to cart`, 'success');
            }
        }
    });
}

// Add item to cart
function addToCart(id, quantity) {
    const veg = vegetables.find(v => v.id === id);
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: veg.id,
            name: veg.name,
            price: veg.price,
            quantity: quantity,
            image: veg.image
        });
    }
    
    saveCart();
    updateCartDisplay();
}

// Update cart display
function updateCartDisplay() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = 'Total: ₹0.00';
        checkoutBtn.disabled = true;
        return;
    }
    
    let itemsHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        itemsHTML += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image" style="background-image: url('${item.image}')"></div>
                <div class="cart-item-details">
                    <span class="cart-item-name">${item.name}</span>
                    <div class="cart-item-quantity">
                        <button class="cart-quantity-btn minus" data-id="${item.id}">-</button>
                        <span>${item.quantity} kg</span>
                        <button class="cart-quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <div class="cart-item-price">₹${itemTotal.toFixed(2)}</div>
                <button class="remove-item" data-id="${item.id}" aria-label="Remove item">×</button>
            </div>
        `;
    });
    
    cartItems.innerHTML = itemsHTML;
    cartTotal.textContent = `Total: ₹${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
}

// Handle checkout process
function handleCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    // In a real app, you would redirect to checkout page or process payment
    const orderDetails = cart.map(item => 
        `${item.quantity} kg ${item.name} - ₹${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (confirm(`Confirm order:\n\n${orderDetails}\n\nTotal: ₹${totalAmount.toFixed(2)}\n\nProceed to payment?`)) {
        // Clear cart after successful order
        cart = [];
        saveCart();
        updateCartDisplay();
        showNotification('Order placed successfully!', 'success');
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('vegCart', JSON.stringify(cart));
}

// Show notification
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `real-time-notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Debounce function for search input
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);