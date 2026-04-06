document.addEventListener('DOMContentLoaded', () => {
    const ordersTableBody = document.getElementById('ordersTableBody');
    const API_URL_ORDERS = 'https://purely-natural-purely-you.onrender.com/api/orders';

    const adminPassword = localStorage.getItem('adminPassword');

    if (!adminPassword) {
        ordersTableBody.innerHTML = `<tr><td colspan="7">Error: Not logged in.</td></tr>`;
        return;
    }

    async function fetchOrders() {
        try {
            const res = await fetch(API_URL_ORDERS, {
                headers: { 'Authorization': adminPassword }
            });
            if (!res.ok) throw new Error('Failed to fetch orders.');

            const orders = await res.json();

            if (orders.length === 0) {
                ordersTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No new orders found.</td></tr>`;
                return;
            }

           ordersTableBody.innerHTML = orders.map(order => {
                // Google Maps ka link banayein
                let mapLink = 'N/A';
                if (order.location && order.location.latitude && order.location.longitude) {
                    mapLink = `<a href="https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}" target="_blank">View on Map</a>`;
                }

                return `
                <tr data-order-id="${order._id}">
                    <td data-label="Order ID">${order.orderId || 'N/A'}</td>
                    <td data-label="Date">${new Date(order.orderDate).toLocaleDateString()}</td>
                    <td data-label="Customer">${order.customerName}<br><small>${order.customerPhone}</small></td>
                    <td data-label="Address">${order.customerAddress}<br><small style="font-weight:bold;">${mapLink}</small></td>
                    <td data-label="Items">
                        <ul>${order.orderItems.map(item => `<li>${item.quantity} x ${item.name}</li>`).join('')}</ul>
                    </td>
                    <td data-label="Total">₹${order.totalAmount}</td>
                    <td data-label="Action">
                        <button class="complete-order-btn" data-order-id="${order._id}">Complete</button>
                    </td>
                </tr>
            `}).join('');


        } catch (err) {
            console.error(err);
            ordersTableBody.innerHTML = `<tr><td colspan="7">${err.message}</td></tr>`;
        }
    }

    // Event listener for the "Complete" button
    ordersTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('complete-order-btn')) {
            // Ask for confirmation
            const isConfirmed = confirm('Are you sure this order is completed and you want to remove it?');
            
            if (isConfirmed) {
                const orderId = e.target.dataset.orderId;
                try {
                    const res = await fetch(`${API_URL_ORDERS}/${orderId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': adminPassword }
                    });
                    if (!res.ok) throw new Error('Failed to delete the order.');

                    // Refresh the list of orders
                    fetchOrders();
                } catch (err) {
                    console.error(err);
                    alert(err.message);
                }
            }
        }
    });

    fetchOrders(); // Initial fetch
});