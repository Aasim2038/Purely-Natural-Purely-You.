// === GET ELEMENTS ===
const form = document.getElementById('productForm');
const tableBody = document.getElementById('productTable');
const toastContainer = document.getElementById('toastContainer');
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const editModalOverlay = document.getElementById('editModalOverlay');
const editForm = document.getElementById('editForm');
const cancelEditBtn = document.getElementById('cancelEdit');
const closeEditModalBtn = document.getElementById('closeEditModal');
const editProductId = document.getElementById('editProductId');

// === CONFIGURATION ===
const BACKEND_URL = "https://purely-natural-purely-you.onrender.com";
const API_URL = `${BACKEND_URL}/api/products`;
let userPassword = null;

// === HELPER FUNCTIONS ===
function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// === MAIN LOGIC ===

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    userPassword = passwordInput.value;
    localStorage.setItem('adminPassword', userPassword);
    loginOverlay.style.display = 'none';
    loadProducts();
});

// Load all products
async function loadProducts() {
    if (!userPassword) { return loginOverlay.style.display = 'flex'; }
    try {
        const res = await fetch(API_URL, { headers: { 'Authorization': userPassword } });
        if (!res.ok) {
            localStorage.removeItem('adminPassword');
            loginOverlay.style.display = 'flex';
            return showToast('Wrong Password or Server Error!');
        }
        const products = await res.json();
        
        tableBody.innerHTML = products.map(p => `
            <tr data-id="${p._id}">
                <td data-label="ID">${p._id}</td>
                <td data-label="Name">${p.name}</td>
                <td data-label="Price">${p.price}</td>
                <td data-label="Category">${p.category || 'N/A'}</td> <td data-label="Image"><img src="${p.img}" alt="${p.name}" width="50" /></td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) { console.error('Error in loadProducts:', error); }
}

// Add new product
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userPassword) { return showToast("Please login first."); }
    const formData = new FormData(form);
    formData.append('password', userPassword);
    try {
        await fetch(API_URL, { method: 'POST', body: formData });
        showToast('Product added successfully!', 'success');
        form.reset();
        loadProducts();
    } catch (error) { console.error('Error adding product:', error); }
});

// Handle clicks on Edit or Delete buttons
tableBody.addEventListener('click', async (e) => {
    if (!userPassword) return;
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;
    
    if (e.target.classList.contains('delete-btn')) {
        if (!confirm('Are you sure you want to delete this product?')) { return; }
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { 'Authorization': userPassword } });
            showToast('Product deleted!', 'success');
            loadProducts();
        } catch (error) { console.error('Error deleting product:', error); }
    }

    if (e.target.classList.contains('edit-btn')) {
        try {
            const res = await fetch(`${API_URL}/${id}`, { headers: { 'Authorization': userPassword } });
            const product = await res.json();
            editProductId.value = product._id;
            document.getElementById('editName').value = product.name;
            document.getElementById('editDesc').value = product.desc;
            document.getElementById('editPrice').value = product.price;
            document.getElementById('editCategory').value = product.category; // Category Set Karein
            editModalOverlay.style.display = 'flex';
        } catch (error) { console.error('Error fetching product for edit:', error); }
    }
});

// Submit Edit Form
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editProductId.value;
    const formData = new FormData(editForm);
    formData.append('password', userPassword);
    try {
        await fetch(`${API_URL}/${id}`, { method: 'PUT', body: formData });
        showToast('Product updated successfully!', 'success');
        editModalOverlay.style.display = 'none';
        loadProducts();
    } catch (error) { console.error('Error updating product:', error); showToast('Failed to update product.'); }
});

// Close modal
cancelEditBtn.addEventListener('click', () => { editModalOverlay.style.display = 'none'; });
closeEditModalBtn.addEventListener('click', () => { editModalOverlay.style.display = 'none'; });

// Initialize
function initializeAdminPanel() {
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword) {
        userPassword = savedPassword;
        loadProducts();
    } else {
        loginOverlay.style.display = 'flex';
    }
}
initializeAdminPanel();