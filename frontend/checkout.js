document.addEventListener('DOMContentLoaded', async () => {
    const summaryItemsContainer = document.getElementById('summary-items');
    const summaryTotalEl = document.getElementById('summary-total-value');
    const checkoutForm = document.getElementById('checkoutForm');
    const API_URL_BASE = "https://purely-natural-purely-you.onrender.com";
    
    // Naye Elements
    const getLocationBtn = document.getElementById('getLocationBtn');
    const addressTextarea = document.getElementById('customerAddress');
    const customerLatInput = document.getElementById('customerLat');
    const customerLonInput = document.getElementById('customerLon');

    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    let cartWithDetails = [];
    let totalPrice = 0;

    // Cart icon ki ginti update karne ka function
    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = totalItems;
        }
    }

    // Order Summary ko render karne ka function
    async function renderOrderSummary() {
        if (cart.length === 0) {
            summaryItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            return;
        }

        const productDetailsPromises = cart.map(item =>
            fetch(`${API_URL_BASE}/api/public/products/${item.productId}`).then(res => res.json())
        );
        const productDetails = await Promise.all(productDetailsPromises);

        summaryItemsContainer.innerHTML = '';
        productDetails.forEach((product, index) => {
            const cartItem = cart[index];
            if (!product || !cartItem) return;

            const subtotal = parseInt(product.price) * cartItem.quantity;
            totalPrice += subtotal;

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('summary-item');
            itemDiv.innerHTML = `<span>${cartItem.quantity} x ${product.name}</span> <strong>₹${subtotal}</strong>`;
            summaryItemsContainer.appendChild(itemDiv);
            
            cartWithDetails.push({
                productId: product._id,
                name: product.name,
                quantity: cartItem.quantity,
                price: product.price
            });
        });

        summaryTotalEl.textContent = `₹${totalPrice}`;
    }
    
    // "USE MY LOCATION" LOGIC
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('Geolocation is not supported by your browser.');
                return;
            }

            getLocationBtn.textContent = 'Fetching Location...';
            getLocationBtn.disabled = true;

            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                
                // Hidden fields mein coordinates save karein
                if(customerLatInput) customerLatInput.value = latitude;
                if(customerLonInput) customerLonInput.value = longitude;

                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                
                if (data && data.display_name) {
                    addressTextarea.value = data.display_name;
                } else {
                    alert('Could not find a valid address. Please enter manually.');
                }
                getLocationBtn.textContent = '📍 Use My Current Location';
                getLocationBtn.disabled = false;

            }, (error) => {
                console.error("Geolocation error:", error);
                alert('Unable to retrieve your location. Please check browser permissions.');
                getLocationBtn.textContent = '📍 Use My Current Location';
                getLocationBtn.disabled = false;
            });
        });
    }

    // Form submit hone par order place karein
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const orderData = {
                customerName: document.getElementById('customerName').value,
                customerPhone: document.getElementById('customerPhone').value,
                customerAddress: addressTextarea.value,
                orderItems: cartWithDetails,
                totalAmount: totalPrice,
                location: {
                    latitude: customerLatInput ? customerLatInput.value : '',
                    longitude: customerLonInput ? customerLonInput.value : ''
                }
            };

            try {
                const res = await fetch(`${API_URL_BASE}/api/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                const result = await res.json();
                if (result.success) {
                    localStorage.removeItem('shoppingCart');
                    window.location.href = `order-success.html?orderId=${result.orderId}`;
                } else {
                    alert('Failed to place order. Please try again.');
                }
            } catch (err) {
                console.error("Order submission error:", err);
                alert('An error occurred. Please try again.');
            }
        });
    }

    // Initial load
    updateCartCount();
    renderOrderSummary();
});