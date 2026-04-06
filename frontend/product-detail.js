document.addEventListener('DOMContentLoaded', () => {
    const productDetailContainer = document.getElementById('productDetailContainer');
    const API_URL_BASE = "https://purely-natural-purely-you.onrender.com/api/public";

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        productDetailContainer.innerHTML = "<h2>Product not found.</h2>";
        return;
    }

    // Cart icon ki ginti update karne ka function
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = totalItems;
        }
        updateCartCount();
    }

    async function fetchProductDetails() {
        try {
            const res = await fetch(`${API_URL_BASE}/products/${productId}`);
            const product = await res.json();

            productDetailContainer.innerHTML = `
                <div class="product-detail-layout">
                    <div class="product-image-section">
                        <img src="${product.img}" alt="${product.name}">
                    </div>
                    <div class="product-info-section">
                        <h1>${product.name}</h1>
                        <p class="product-desc">${product.desc}</p>
                        <div class="price-detail">₹${product.price}</div>
                        <div class="quantity-selector">
                            <label for="quantity">Quantity:</label>
                            <input type="number" id="quantity" value="1" min="1">
                        </div>
                        <button class="btn-primary add-to-cart-btn">Add to Cart</button>
                    </div>
                </div>
            `;

            // "Add to Cart" button par click listener lagayein
            const addToCartBtn = document.querySelector('.add-to-cart-btn');
            addToCartBtn.addEventListener('click', () => {
                const quantityInput = document.getElementById('quantity');
                const quantity = parseInt(quantityInput.value);

                // Local Storage se purana cart nikalein
                let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

                // Check karein ki product pehle se cart mein hai ya nahi
                const existingProductIndex = cart.findIndex(item => item.productId === productId);

                if (existingProductIndex > -1) {
                    // Agar hai, toh sirf quantity badhayein
                    cart[existingProductIndex].quantity += quantity;
                } else {
                    // Agar nahi, toh naya product add karein
                    cart.push({ productId: productId, quantity: quantity });
                }

                // Naye cart ko wapas Local Storage mein save karein
                localStorage.setItem('shoppingCart', JSON.stringify(cart));

                // User ko feedback dein
                alert(`${quantity} x ${product.name} has been added to your cart!`);
                updateCartCount();
            });

        } catch (err) {
            console.error("Error fetching product details:", err);
            productDetailContainer.innerHTML = "<p style='color:red;'>Failed to load product details.</p>";
        }
    }

    fetchProductDetails();
    updateCartCount(); // Page load hote hi cart count update karein
});

// Cart Count ko update karne ke liye
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = totalItems;
    }
}

// Page load hote hi count ko update karein
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});