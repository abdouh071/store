// ==================== History Page Logic ====================

document.addEventListener('DOMContentLoaded', () => {
    // initApp is global from script.js and is already attached to DOMContentLoaded there.
    // We only need to load history.
    loadHistory();
});

function loadHistory() {
    const ordersTrack = document.getElementById('ordersTrack');
    const emptyState = document.getElementById('emptyState');
    
    if (!ordersTrack) return;

    const history = JSON.parse(localStorage.getItem('guestOrderHistory') || '[]');
    
    // Translations setup
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    const t = window.translations[savedLang] || window.translations['en'];

    if (history.length === 0) {
        emptyState.style.display = 'block';
        ordersTrack.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';
    
    ordersTrack.innerHTML = history.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const itemsHtml = order.items.map(item => `
            <div class="order-item-row">
                <img src="${item.imageUrl || 'https://via.placeholder.com/100'}" alt="${item.name}" class="order-item-img">
                <div class="order-item-details">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-meta">${t.qty_short}: ${item.quantity} | ${item.variants || t.no_variants}</div>
                </div>
                <div class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `).join('');

        return `
            <div class="order-card">
                <div class="order-card-header">
                    <div class="order-id-track">
                        <span class="order-date">${date}</span>
                        <span class="order-id">${t.order_id_full || 'Order ID'}: #${order._id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div class="order-status-badge">${t.pending_verification}</div>
                </div>
                
                <div class="order-items-list">
                    ${itemsHtml}
                </div>
                
                <div class="order-card-footer">
                    <div class="order-total">${t.total} $${parseFloat(order.totalPrice || 0).toFixed(2)}</div>
                    <a href="track-order.html?orderId=${order._id}&phone=${order.customerPhone}" class="btn-track-order">
                        ${t.track_details}
                    </a>
                </div>
            </div>
        `;
    }).join('');
}
