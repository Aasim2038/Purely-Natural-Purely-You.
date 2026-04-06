// ================= CONFIG & DATA =================
const WHATSAPP_NUMBER = "918055197578";
const API_URL_BASE = "https://purely-natural-purely-you.onrender.com/api/public";

// This object maps your category names to the correct image files.
// CORRECTED PATHS: All paths now point to the 'assets/img/' folder.
const categoryImages = {
    "Face Care": "img/Category-facecare.png",
    "Body Care": "img/Category-bodycare.png",
    "Hair Care": "img/Category-haircare.png",
    "Oral Care": "img/Category-oral.png",
    // "Health": "../img/category-health.jpg",
    // "Nutrition": "../img/category-nutrition.jpg",
    // "Spices": "../img/category-spices.jpg",
    // Add any new categories and their image paths here
};

// ================= HELPER FUNCTIONS =================
function openWhatsAppQuick(message = "") {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = totalItems;
    }
}

// ================= MAIN RENDER FUNCTION =================
async function fetchAndRenderCategories() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;

    try {
        const res = await fetch(`${API_URL_BASE}/categories`);
        const categories = await res.json();
        
        if (categories.length === 0) {
            grid.innerHTML = "<p>No categories found. Please add products in the admin panel.</p>";
            return;
        }

        grid.innerHTML = categories.map(category => {
            // Get the correct image URL from our mapping object
            const imageUrl = categoryImages[category] || 'assets/img/default-image.jpg'; // Default image path also corrected

            return `
            <a href="products.html?category=${encodeURIComponent(category)}" class="improved-card">
                <img class="improved-card-img" src="${imageUrl}" alt="${category}">
                <div class="improved-card-content">
                    <h3>${category}</h3>
                    <p>Explore our range of ${category.toLowerCase()}.</p>
                </div>
            </a>`;
        }).join('');

    } catch (err) {
        console.error("❌ Error loading categories:", err);
        grid.innerHTML = "<p style='color:red'>⚠️ Failed to load categories.</p>";
    }
}

// ================= SCRIPT START & EVENT LISTENERS =================
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    const hamburger = document.querySelector('.hamburger');
    const navUl = document.querySelector('nav ul');
    if (hamburger && navUl) {
        hamburger.addEventListener('click', () => {
            navUl.classList.toggle('active');
        });
    }

    if (document.getElementById('categoryGrid')) {
        fetchAndRenderCategories();
    }
});


