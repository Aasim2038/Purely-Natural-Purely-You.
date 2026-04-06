document.addEventListener('DOMContentLoaded', async () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    const totalPriceEl = document.getElementById('total-price-value');
    const API_URL_BASE = "https://purely-natural-purely-you.onrender.com/api/public";

    // Cart icon ki ginti update karne ka function
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = totalItems;
        }
    }

    async function renderCart() {
        updateCartCount();
        const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center;">Your cart is empty. <a href="index.html">Continue Shopping</a></p>';
            cartSummary.style.display = 'none';
            return;
        }

        const productDetailsPromises = cart.map(item =>
            fetch(`${API_URL_BASE}/products/${item.productId}`).then(res => res.json())
        );
        
        const productDetails = await Promise.all(productDetailsPromises);
        let totalPrice = 0;

        cartItemsContainer.innerHTML = `
            <table class="cart-table">
                <thead> <tr> <th>Product</th> <th>Price</th> <th>Quantity</th> <th>Subtotal</th> <th>Action</th> </tr> </thead>
                <tbody></tbody>
            </table>`;
        
        const tableBody = cartItemsContainer.querySelector('tbody');
        tableBody.innerHTML = '';

        productDetails.forEach((product, index) => {
            const cartItem = cart[index];
            if (!product || !cartItem) return;

            const subtotal = parseInt(product.price) * cartItem.quantity;
            totalPrice += subtotal;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Product">
                    <div class="cart-product-info">
                        <img src="${product.img}" alt="${product.name}" width="60">
                        <span>${product.name}</span>
                    </div>
                </td>
                <td data-label="Price">₹${product.price}</td>
                <td data-label="Quantity">
                    <input type="number" class="quantity-input" value="${cartItem.quantity}" min="1" data-product-id="${product._id}">
                </td>
                <td data-label="Subtotal">₹${subtotal}</td>
                <td data-label="Action"><button class="remove-item-btn" data-product-id="${product._id}">Remove</button></td>
            `;
            tableBody.appendChild(row);
        });

        totalPriceEl.textContent = `₹${totalPrice}`;
        cartSummary.style.display = 'block';
    }

    function updateCart(productId, newQuantity) {
        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        const productIndex = cart.findIndex(item => item.productId === productId);

        if (productIndex > -1) {
            if (newQuantity > 0) {
                cart[productIndex].quantity = newQuantity;
            } else {
                cart.splice(productIndex, 1);
            }
        }
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        renderCart();
    }

    cartItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const productId = e.target.dataset.productId;
            updateCart(productId, 0);
        }
    });

    cartItemsContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const productId = e.target.dataset.productId;
            const newQuantity = parseInt(e.target.value);
            updateCart(productId, newQuantity);
        }
    });

    renderCart();
});