document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('productGrid');
    const categoryTitle = document.getElementById('categoryTitle');
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
    updateCartCount(); // Page load hote hi count ko update karein

    // URL se category ka naam nikalein
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');

    if (!category) {
        if (categoryTitle) categoryTitle.textContent = "No Category Selected";
        return;
    }

    if (categoryTitle) {
        categoryTitle.textContent = `Showing Products for: ${decodeURIComponent(category)}`;
    }

    async function fetchProductsByCategory() {
        try {
            // --- YAHAN BADLAAV KIYA GAYA HAI ---
            const res = await fetch(`${API_URL_BASE}/products/category/${category}`);
            const products = await res.json();

            if (products.length === 0) {
                if(productGrid) productGrid.innerHTML = `<p>No products found in this category.</p>`;
                return;
            }

            if(productGrid) {
                productGrid.innerHTML = products.map(p => `
                    <a href="product-detail.html?id=${p._id}" class="card">
                        <div class="card-image-container">
                            <img src="${p.img}" alt="${p.name}">
                        </div>
                        <div class="card-content">
                            <h3>${p.name}</h3>
                            <p>${p.desc || ''}</p>
                            <div class="price">₹${p.price}</div>
                        </div>
                    </a>
                `).join('');
            }
        } catch (err) {
            console.error("Error fetching products by category:", err);
            if(productGrid) productGrid.innerHTML = "<p style='color:red;'>Failed to load products.</p>";
        }
    }

    fetchProductsByCategory();
});