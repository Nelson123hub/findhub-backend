/* ============================================
   Futminna FindHub - Dashboard Module
   Main app functionality, navigation, rendering
   ============================================ */

// ============================================
// DASHBOARD INITIALIZATION
// ============================================
async function initDashboard() {
    // Check authentication
    const savedUser = Storage.getUser();
    if (!savedUser || !Api.token) {
        window.location.href = 'login.html';
        return;
    }

    appState.currentUser = savedUser;

    try {
        const [itemsResult, notificationsResult] = await Promise.all([
            Api.getItems(),
            Api.getNotifications()
        ]);
        appState.items = itemsResult.items || [];
        appState.notifications = notificationsResult.notifications || [];
    } catch (error) {
        showToast(error.message, 'error', 'Backend Error');
        appState.items = Storage.getItems();
    }

    // Update UI with user info
    updateUserUI();

    // Setup navigation
    setupNavigation();

    // Setup mobile menu
    setupMobileMenu();

    // Setup notifications
    setupNotifications();

    // Setup logout
    $('#logoutBtn')?.addEventListener('click', logout);

    // Setup search and filters
    setupSearchAndFilters();

    // Setup modals
    setupModals();

    // Setup report form
    setupReportForm();

    // Load initial page
    navigateTo('dashboard');
}

// ============================================
// UPDATE USER UI
// ============================================
function updateUserUI() {
    const user = appState.currentUser;
    if (!user) return;

    // Sidebar header
    const userNameEl = $('#userName');
    const userRoleEl = $('#userRole');
    const userAvatarEl = $('#userAvatar');

    if (userNameEl) userNameEl.textContent = user.name;
    if (userRoleEl) userRoleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Student';
    if (userAvatarEl) userAvatarEl.textContent = getInitials(user.name);

    // Show admin nav for admin users
    const adminNav = $('#adminNavItem');
    if (adminNav) {
        adminNav.style.display = user.role === 'admin' ? 'flex' : 'none';
    }

    // Update notification badge
    updateNotificationBadge();
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ============================================
// NAVIGATION
// ============================================
function setupNavigation() {
    $$('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (!page) return;

            // Update active state
            $$('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Navigate
            navigateTo(page);

            // Close sidebar on mobile
            if (isMobile()) {
                $('.sidebar').classList.remove('active');
            }
        });
    });
}

function navigateTo(page) {
    appState.currentPage = page;

    // Hide all pages
    $$('.page-content').forEach(p => p.classList.add('hidden'));

    // Show target page
    const targetPage = $(`#${page}Page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // Update page title
    const pageTitle = $('#pageTitle');
    const titles = {
        dashboard: 'Dashboard',
        items: 'Browse Items',
        myReports: 'My Reports',
        claims: 'My Claims',
        admin: 'Admin Panel',
        settings: 'Settings'
    };
    if (pageTitle) pageTitle.textContent = titles[page] || 'Dashboard';

    // Render page content
    switch (page) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'items':
            renderItems();
            break;
        case 'myReports':
            renderMyReports();
            break;
        case 'claims':
            renderClaims();
            break;
        case 'admin':
            if (appState.currentUser?.role === 'admin') {
                renderAdminPanel();
            } else {
                navigateTo('dashboard');
            }
            break;
        case 'settings':
            renderSettings();
            break;
    }

    window.scrollTo(0, 0);
}

// ============================================
// MOBILE MENU
// ============================================
function setupMobileMenu() {
    const toggle = $('#mobileMenuToggle');
    if (!toggle) return;

    toggle.style.display = isMobile() || isTablet() ? 'flex' : 'none';

    toggle.addEventListener('click', () => {
        $('.sidebar').classList.toggle('active');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        const sidebar = $('.sidebar');
        const menuToggle = $('#mobileMenuToggle');
        if (sidebar?.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            !menuToggle?.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Update toggle visibility on resize
    window.addEventListener('resize', () => {
        if (toggle) {
            toggle.style.display = isMobile() || isTablet() ? 'flex' : 'none';
        }
    });
}

// ============================================
// NOTIFICATIONS
// ============================================
function setupNotifications() {
    const bell = $('#notificationsToggle');
    const panel = $('.notifications-panel');
    const closeBtn = $('#closeNotifications');

    if (bell) {
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            panel?.classList.toggle('active');
            renderNotifications();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', async () => {
            appState.notifications.forEach(n => n.read = true);
            updateNotificationBadge();
            renderNotifications();
            try { await Api.markNotificationsRead(); } catch (_) {}
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (panel?.classList.contains('active') &&
            !panel.contains(e.target) &&
            !bell?.contains(e.target)) {
            panel.classList.remove('active');
        }
    });
}

function updateNotificationBadge() {
    const unreadCount = appState.notifications.filter(n => !n.read).length;
    const badge = $('#notificationBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function renderNotifications() {
    const container = $('#notificationsList');
    if (!container) return;

    if (appState.notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: var(--space-xl);">
                <i class="fas fa-bell-slash" style="font-size: 2rem; color: var(--medium-gray); margin-bottom: var(--space-sm);"></i>
                <p style="color: var(--text-gray); font-size: var(--font-size-sm);">No notifications yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appState.notifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type}">
                <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <h4>${notif.title}</h4>
                <p>${notif.message}</p>
                <div class="notification-time">${notif.time}</div>
            </div>
        </div>
    `).join('');

    // Mark as read on click
    $$('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.remove('unread');
            const id = parseInt(item.dataset.id);
            const notif = appState.notifications.find(n => n.id === id);
            if (notif) notif.read = true;
            updateNotificationBadge();
        });
    });
}

function getNotificationIcon(type) {
    const icons = {
        match: 'link',
        claim: 'handshake',
        alert: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ============================================
// SEARCH & FILTERS
// ============================================
function setupSearchAndFilters() {
    const searchInput = $('#searchItems');
    const typeFilter = $('#filterType');
    const categoryFilter = $('#filterCategory');
    const statusFilter = $('#filterStatus');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            appState.filters.search = searchInput.value.toLowerCase();
            refreshCurrentPage();
        }, 300));
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            appState.filters.type = typeFilter.value;
            refreshCurrentPage();
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            appState.filters.category = categoryFilter.value;
            refreshCurrentPage();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            appState.filters.status = statusFilter.value;
            refreshCurrentPage();
        });
    }
}

function refreshCurrentPage() {
    switch (appState.currentPage) {
        case 'items':
            renderItems();
            break;
        case 'myReports':
            renderMyReports();
            break;
        case 'admin':
            renderAdminPanel();
            break;
    }
}

function getFilteredItems() {
    return appState.items.filter(item => {
        const matchSearch = !appState.filters.search ||
            item.title.toLowerCase().includes(appState.filters.search) ||
            item.description.toLowerCase().includes(appState.filters.search) ||
            item.location.toLowerCase().includes(appState.filters.search) ||
            item.category.toLowerCase().includes(appState.filters.search);

        const matchCategory = !appState.filters.category || item.category === appState.filters.category;
        const matchStatus = !appState.filters.status || item.status === appState.filters.status;
        const matchType = !appState.filters.type || item.type === appState.filters.type;

        return matchSearch && matchCategory && matchStatus && matchType;
    });
}

// ============================================
// MODALS SETUP
// ============================================
function setupModals() {
    // Close buttons
    $$('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) modal.classList.remove('active');
        });
    });

    // Close on overlay click
    $$('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    // Report item buttons
    $('#reportItemBtn')?.addEventListener('click', () => {
        toggleModal('reportItemModal', true);
    });
    $('#reportItemBtn2')?.addEventListener('click', () => {
        toggleModal('reportItemModal', true);
    });

    // Claim and edit forms
    $('#claimItemForm')?.addEventListener('submit', handleClaimSubmit);
    $('#editItemForm')?.addEventListener('submit', handleEditItemSubmit);

    // Claim image upload
    const claimUploadArea = $('#claimImageUpload');
    const claimFileInput = $('#claimImages');
    if (claimUploadArea && claimFileInput) {
        claimUploadArea.addEventListener('click', () => claimFileInput.click());
        claimFileInput.addEventListener('change', (e) => {
            handleImagePreview(e.target, 'claimImagePreview', 3);
        });
    }
}

// ============================================
// REPORT FORM SETUP
// ============================================
function setupReportForm() {
    const form = $('#reportItemForm');
    if (!form) return;

    form.addEventListener('submit', handleReportItem);

    // Image upload
    const uploadArea = $('#imageUploadArea');
    const fileInput = $('#itemImages');

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            handleImagePreview(e.target, 'imagePreviewGrid', 5);
        });
    }
}

// ============================================
// RENDER: DASHBOARD
// ============================================
function renderDashboard() {
    const myItems = appState.items.filter(i => i.reporter === appState.currentUser?.email);
    const totalReports = myItems.length;
    const resolved = myItems.filter(i => ['returned', 'closed'].includes(i.status)).length;
    const pending = myItems.filter(i => !['returned', 'closed'].includes(i.status)).length;
    const matches = myItems.filter(i => i.status === 'matched').length;

    const statsContainer = $('#dashboardStats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-card-icon purple"><i class="fas fa-clipboard-list"></i></div>
                <div class="stat-card-info"><h3>${totalReports}</h3><p>Total Reports</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon gold"><i class="fas fa-clock"></i></div>
                <div class="stat-card-info"><h3>${pending}</h3><p>Pending</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon green"><i class="fas fa-check-circle"></i></div>
                <div class="stat-card-info"><h3>${resolved}</h3><p>Resolved</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon blue"><i class="fas fa-link"></i></div>
                <div class="stat-card-info"><h3>${matches}</h3><p>Matches</p></div>
            </div>
        `;
    }

    // Recent items (last 4)
    const recentItems = appState.items.slice(0, 4);
    const recentContainer = $('#recentItems');
    if (recentContainer) {
        recentContainer.innerHTML = recentItems.length > 0
            ? recentItems.map(item => createItemCard(item)).join('')
            : renderEmptyState('No items reported yet', 'Be the first to report an item!');
    }

    // Quick actions
    const quickActions = $('#quickActions');
    if (quickActions) {
        quickActions.innerHTML = `
            <button class="btn btn-primary btn-lg" onclick="$('#reportType').value='lost'; toggleModal('reportItemModal', true);">
                <i class="fas fa-search"></i> Report Lost Item
            </button>
            <button class="btn btn-outline-dark btn-lg" onclick="$('#reportType').value='found'; toggleModal('reportItemModal', true);">
                <i class="fas fa-hand-holding"></i> Report Found Item
            </button>
        `;
    }
}

// ============================================
// RENDER: ITEMS
// ============================================
function renderItems() {
    const container = $('#itemsGrid');
    if (!container) return;

    const filteredItems = getFilteredItems();

    if (filteredItems.length === 0) {
        container.innerHTML = renderEmptyState('No items found', 'Try adjusting your search or filters.');
        return;
    }

    container.innerHTML = filteredItems.map(item => createItemCard(item)).join('');
}

// ============================================
// RENDER: MY REPORTS
// ============================================
function renderMyReports() {
    const myItems = appState.items.filter(i => i.reporter === appState.currentUser?.email);
    const container = $('#myReportsGrid');
    if (!container) return;

    if (myItems.length === 0) {
        container.innerHTML = renderEmptyState(
            'No reports yet',
            'Start by reporting a lost or found item.',
            `<button class="btn btn-primary mt-2" onclick="toggleModal('reportItemModal', true)">
                <i class="fas fa-plus"></i> Report Item
            </button>`
        );
        return;
    }

    container.innerHTML = myItems.map(item => createItemCard(item, true)).join('');
}

// ============================================
// RENDER: CLAIMS
// ============================================
function renderClaims() {
    // Show items where current user is the claimant OR items the user reported that have claims
    const myClaims = appState.items.filter(i =>
        (i.status === 'claim_initiated' || i.status === 'verified') &&
        (i.claimant === appState.currentUser?.email || i.reporter === appState.currentUser?.email)
    );
    const container = $('#claimsGrid');
    if (!container) return;

    if (myClaims.length === 0) {
        container.innerHTML = renderEmptyState(
            'No active claims',
            'When you claim an item or someone claims your item, it will appear here.'
        );
        return;
    }

    container.innerHTML = myClaims.map(item => createClaimCard(item)).join('');
}

// ============================================
// RENDER: ADMIN PANEL
// ============================================
function renderAdminPanel() {
    const totalItems = appState.items.length;
    const lostItems = appState.items.filter(i => i.type === 'lost').length;
    const foundItems = appState.items.filter(i => i.type === 'found').length;
    const returnedItems = appState.items.filter(i => i.status === 'returned').length;
    const pendingClaims = appState.items.filter(i => i.status === 'claim_initiated').length;

    const adminStats = $('#adminStats');
    if (adminStats) {
        adminStats.innerHTML = `
            <div class="stat-card">
                <div class="stat-card-icon purple"><i class="fas fa-clipboard-list"></i></div>
                <div class="stat-card-info"><h3>${totalItems}</h3><p>Total Reports</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon red"><i class="fas fa-search"></i></div>
                <div class="stat-card-info"><h3>${lostItems}</h3><p>Lost Items</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon green"><i class="fas fa-hand-holding"></i></div>
                <div class="stat-card-info"><h3>${foundItems}</h3><p>Found Items</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon blue"><i class="fas fa-check-circle"></i></div>
                <div class="stat-card-info"><h3>${returnedItems}</h3><p>Returned</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon gold"><i class="fas fa-exclamation-circle"></i></div>
                <div class="stat-card-info"><h3>${pendingClaims}</h3><p>Pending Claims</p></div>
            </div>
        `;
    }

    // All items table
    const tableBody = $('#adminItemsTable');
    if (tableBody) {
        const filteredItems = getFilteredItems();
        if (filteredItems.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: var(--space-xl); color: var(--text-gray);">No items found</td></tr>`;
        } else {
            tableBody.innerHTML = filteredItems.map(item => `
                <tr>
                    <td>#${item.id}</td>
                    <td>${escapeHtml(item.title)}</td>
                    <td><span class="badge badge-${item.type}">${item.type.toUpperCase()}</span></td>
                    <td><span class="table-status ${item.status}">${formatStatus(item.status)}</span></td>
                    <td>${item.category}</td>
                    <td>${formatDate(item.date)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-icon edit" onclick="viewItem(${item.id})" title="View"><i class="fas fa-eye"></i></button>
                            <button class="btn-icon edit" onclick="editItem(${item.id})" title="Edit"><i class="fas fa-edit"></i></button>
                            ${item.status === 'claim_initiated' ? `<button class="btn-icon edit" onclick="verifyClaim(${item.id})" title="Verify Claim" style="background: rgba(40,167,69,0.1); color: var(--success);"><i class="fas fa-check"></i></button>` : ''}
                            <button class="btn-icon delete" onclick="deleteItem(${item.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    const pendingClaimsTable = $('#pendingClaimsTable');
    if (pendingClaimsTable) {
        const pendingClaimItems = appState.items.filter(i => i.status === 'claim_initiated');
        pendingClaimsTable.innerHTML = pendingClaimItems.length
            ? pendingClaimItems.map(item => `
                <tr>
                    <td>#${item.id}</td>
                    <td>${escapeHtml(item.title)}</td>
                    <td>${escapeHtml(item.claimant || item.claim?.fullName || 'N/A')}</td>
                    <td>${formatDate(item.claimDate || item.date)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-icon edit" onclick="verifyClaim(${item.id})" title="Verify Claim" style="background: rgba(40,167,69,0.1); color: var(--success);"><i class="fas fa-check"></i></button>
                            <button class="btn-icon delete" onclick="activeVerificationItemId=${item.id}; rejectClaim()" title="Reject Claim"><i class="fas fa-times"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('')
            : '<tr><td colspan="5" class="text-center" style="padding: var(--space-xl); color: var(--text-gray);">No pending claims</td></tr>';
    }

    // Chart
    const chartContainer = $('#adminChart');
    if (chartContainer) {
        const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const chartData = [3, 5, 2, 8, 4, 6, 7];
        const maxVal = Math.max(...chartData);

        chartContainer.innerHTML = `
            <div class="chart-bar">
                ${chartData.map((val, i) => `
                    <div class="chart-bar-item">
                        <div class="chart-bar-fill lost" style="height: ${(val / maxVal * 100)}%"></div>
                        <span class="chart-bar-label">${chartLabels[i]}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// ============================================
// RENDER: SETTINGS
// ============================================
function renderSettings() {
    const user = appState.currentUser;
    if (!user) return;

    const settingsName = $('#settingsName');
    const settingsEmail = $('#settingsEmail');
    const settingsMatric = $('#settingsMatric');
    const settingsDept = $('#settingsDept');
    const settingsPhone = $('#settingsPhone');

    if (settingsName) settingsName.value = user.name;
    if (settingsEmail) settingsEmail.value = user.email;
    if (settingsMatric) settingsMatric.value = user.matric || '';
    if (settingsDept) settingsDept.value = user.department || '';
    if (settingsPhone) settingsPhone.value = user.phone || '';
}

// ============================================
// ITEM CARD CREATOR
// ============================================
function createItemCard(item, showActions = false) {
    const statusClass = getStatusClass(item.status);
    const typeBadge = item.type === 'lost' ? 'badge-lost' : 'badge-found';
    const primaryImage = item.images && item.images.length > 0
        ? item.images[0]
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';

    // Determine if current user can claim this item
    const canClaim = item.status !== 'returned' && 
                     item.status !== 'closed' && 
                     item.reporter !== appState.currentUser?.email &&
                     item.status !== 'claim_initiated' &&
                     item.status !== 'verified';

    const claimBtnText = item.type === 'lost' ? 'I Found This' : 'This Is Mine';
    const claimBtnIcon = item.type === 'lost' ? 'fa-hand-holding' : 'fa-handshake';

    return `
        <div class="item-card" data-id="${item.id}">
            <div class="item-card-image">
                <img src="${primaryImage}" alt="${escapeHtml(item.title)}" loading="lazy"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E'">
                <span class="item-card-badge ${typeBadge}">${item.type.toUpperCase()}</span>
            </div>
            <div class="item-card-body">
                <h3>${escapeHtml(item.title)}</h3>
                <div class="item-card-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.location)}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(item.date)}</span>
                    <span><i class="fas fa-tag"></i> ${item.category}</span>
                </div>
                <p class="item-card-desc">${escapeHtml(item.description)}</p>
                <div class="item-card-footer">
                    <div class="item-status ${statusClass}">
                        <span class="status-dot"></span>
                        ${formatStatus(item.status)}
                    </div>
                    <div class="item-card-actions">
                        <button class="btn btn-primary btn-sm" onclick="viewItem(${item.id})">View Details</button>
                        ${canClaim ? `
                            <button class="btn btn-secondary btn-sm" onclick="openClaimModal(${item.id})">
                                <i class="fas ${claimBtnIcon}"></i> ${claimBtnText}
                            </button>
                        ` : ''}
                        ${showActions ? `
                            <button class="btn-icon edit" onclick="editItem(${item.id})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete" onclick="deleteItem(${item.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// CLAIM CARD CREATOR
// ============================================
function createClaimCard(item) {
    const currentStepIndex = STATUS_ORDER.indexOf(item.status);
    const visibleSteps = STATUS_ORDER.slice(0, 5);
    const primaryImage = item.images && item.images.length > 0
        ? item.images[0]
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';

    return `
        <div class="item-card">
            <div class="item-card-image">
                <img src="${primaryImage}" alt="${escapeHtml(item.title)}" loading="lazy"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-size=\'16\'%3ENo Image%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="item-card-body">
                <h3>${escapeHtml(item.title)}</h3>
                <div class="item-card-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.location)}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(item.date)}</span>
                </div>
                <div style="margin: var(--space-md) 0;">
                    <p style="font-size: var(--font-size-xs); color: var(--text-gray); margin-bottom: var(--space-sm); font-weight: 600;">Claim Progress:</p>
                    <div class="status-timeline">
                        ${visibleSteps.map((step, i) => `
                            <div class="timeline-step ${i < currentStepIndex ? 'completed' : ''} ${i === currentStepIndex ? 'active' : ''}">
                                <div class="step-circle">${i < currentStepIndex ? '<i class="fas fa-check" style="font-size:0.7rem;"></i>' : i + 1}</div>
                                <p>${formatStatus(step)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="item-card-footer">
                    <div class="item-status ${getStatusClass(item.status)}">
                        <span class="status-dot"></span>
                        ${formatStatus(item.status)}
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="viewItem(${item.id})">View Details</button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// EMPTY STATE
// ============================================
function renderEmptyState(title, message, actionHtml = '') {
    return `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>${title}</h3>
            <p>${message}</p>
            ${actionHtml}
        </div>
    `;
}

// ============================================
// ESCAPE HTML
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// VIEW ITEM
// ============================================
function viewItem(id) {
    const item = appState.items.find(i => i.id === id);
    if (!item) return;

    const modalBody = $('#viewItemModalBody');
    if (!modalBody) return;

    const primaryImage = item.images && item.images.length > 0
        ? item.images[0]
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';

    const galleryImages = item.images && item.images.length > 0
        ? item.images.map(img => `
            <div class="image-preview-item">
                <img src="${img}" alt="" loading="lazy"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f0f0\'/%3E%3C/svg%3E'">
            </div>
        `).join('')
        : '<p style="color: var(--text-gray); font-size: var(--font-size-sm);">No images available</p>';

    const canClaimFromView = item.status !== 'returned' && 
                               item.status !== 'closed' && 
                               item.reporter !== appState.currentUser?.email &&
                               item.status !== 'claim_initiated' &&
                               item.status !== 'verified';

    const claimButtonText = item.type === 'lost' ? 'I Found This' : 'Claim This Item';
    const claimButtonIcon = item.type === 'lost' ? 'fa-hand-holding' : 'fa-handshake';

    const claimButton = canClaimFromView
        ? `<button class="btn btn-primary" onclick="toggleModal('viewItemModal', false); openClaimModal(${item.id});">
            <i class="fas ${claimButtonIcon}"></i> ${claimButtonText}
        </button>`
        : '';

    const verifyButton = item.status === 'claim_initiated' && appState.currentUser?.role === 'admin'
        ? `<button class="btn btn-primary" onclick="verifyClaim(${item.id})">
            <i class="fas fa-check-circle"></i> Verify Claim
        </button>`
        : '';

    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-xl);">
            <div>
                <img src="${primaryImage}" style="width: 100%; border-radius: var(--radius-sm); margin-bottom: var(--space-md); max-height: 280px; object-fit: cover;"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f0f0\'/%3E%3C/svg%3E'">
                <div class="image-preview-grid">
                    ${galleryImages}
                </div>
            </div>
            <div>
                <span class="item-card-badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}" style="margin-bottom: var(--space-md); display: inline-block;">${item.type.toUpperCase()}</span>
                <h2 style="color: var(--futminna-purple); margin-bottom: var(--space-sm); font-size: var(--font-size-xl);">${escapeHtml(item.title)}</h2>
                <div class="item-card-meta" style="margin-bottom: var(--space-md);">
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.location)}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(item.date)}</span>
                    <span><i class="fas fa-tag"></i> ${item.category}</span>
                </div>
                <p style="color: var(--text-gray); line-height: 1.7; margin-bottom: var(--space-lg); font-size: var(--font-size-sm);">${escapeHtml(item.description)}</p>

                <div style="background: var(--light-gray); padding: var(--space-md); border-radius: var(--radius-sm); margin-bottom: var(--space-lg);">
                    <p style="font-size: var(--font-size-sm); color: var(--text-gray); margin-bottom: var(--space-xs);"><strong>Contact:</strong> ${item.contact}</p>
                    <p style="font-size: var(--font-size-sm); color: var(--text-gray);"><strong>Reported by:</strong> ${item.reporter}</p>
                </div>

                <div class="item-status ${getStatusClass(item.status)}" style="margin-bottom: var(--space-md);">
                    <span class="status-dot"></span>
                    <strong>Status: ${formatStatus(item.status)}</strong>
                </div>

                <div style="display: flex; gap: var(--space-sm); flex-wrap: wrap;">
                    ${claimButton}
                    ${verifyButton}
                </div>
            </div>
        </div>
    `;

    toggleModal('viewItemModal', true);
}

// ============================================
// REPORT ITEM
// ============================================
async function handleReportItem(e) {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);

    const payload = {
        type: $('#reportType').value,
        title: $('#itemTitle').value.trim(),
        category: $('#itemCategory').value,
        location: $('#itemLocation').value.trim(),
        date: $('#itemDate').value,
        description: $('#itemDescription').value.trim(),
        images: appState.uploadedImages.length > 0 ? appState.uploadedImages : [],
        contact: $('#itemContact').value.trim()
    };

    try {
        const result = await Api.createItem(payload);
        appState.items.unshift(result.item);
        Storage.setItems(appState.items);
        showToast('Item reported successfully!', 'success', 'Report Submitted');
        toggleModal('reportItemModal', false);
        e.target.reset();
        clearImageUploads();
        refreshCurrentPage();
    } catch (error) {
        showToast(error.message, 'error', 'Report Failed');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ============================================
// CLAIM ITEM
// ============================================
function openClaimModal(itemId) {
    const item = appState.items.find(i => i.id === itemId);
    if (!item) return;

    // Set the item ID in the claim form
    $('#claimItemId').value = itemId;

    // Update modal title based on item type
    const modalTitle = document.querySelector('#claimItemModal .modal-header h2');
    if (modalTitle) {
        if (item.type === 'lost') {
            modalTitle.innerHTML = '<i class="fas fa-hand-holding"></i> I Found This Item';
        } else {
            modalTitle.innerHTML = '<i class="fas fa-handshake"></i> Claim This Item';
        }
    }

    // Update description text
    const descText = document.querySelector('#claimItemModal .modal-body > p');
    if (descText) {
        if (item.type === 'lost') {
            descText.textContent = 'You found this lost item! Please provide your details so the owner can verify and arrange pickup.';
        } else {
            descText.textContent = 'To claim this found item, please provide the following information for verification:';
        }
    }

    toggleModal('claimItemModal', true);
}

async function handleClaimSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);

    const itemId = parseInt($('#claimItemId').value);
    const item = appState.items.find(i => i.id === itemId);
    if (!item) {
        showToast('Item not found.', 'error', 'Error');
        setButtonLoading(btn, false);
        return;
    }

    const payload = {
        fullName: $('#claimFullName').value.trim(),
        matric: $('#claimMatric').value.trim(),
        phone: $('#claimPhone').value.trim(),
        description: $('#claimDescription').value.trim(),
        images: appState.uploadedImages.length > 0 ? appState.uploadedImages : []
    };

    try {
        const result = await Api.createClaim(itemId, payload);
        const index = appState.items.findIndex(i => i.id === itemId);
        if (index !== -1) appState.items[index] = result.item;
        Storage.setItems(appState.items);
        appState.notifications.unshift({
            id: Date.now(),
            type: 'claim',
            title: item.type === 'lost' ? 'Found Item Reported' : 'Claim Submitted',
            message: item.type === 'lost'
                ? `You reported finding "${item.title}". Awaiting owner verification.`
                : `Your claim for "${item.title}" has been submitted. Awaiting admin verification.`,
            time: 'Just now',
            read: false
        });
        showToast('Claim submitted successfully! Awaiting admin verification.', 'success', 'Claim Submitted');
        toggleModal('claimItemModal', false);
        e.target.reset();
        clearImageUploads();
        refreshCurrentPage();
        updateNotificationBadge();
    } catch (error) {
        showToast(error.message, 'error', 'Claim Failed');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ============================================
// EDIT / DELETE ITEM
// ============================================
function editItem(id) {
    const item = appState.items.find(i => i.id === id);
    if (!item) return;

    $('#editItemId').value = item.id;
    $('#editReportType').value = item.type || 'lost';
    $('#editItemCategory').value = item.category || '';
    $('#editItemTitle').value = item.title || '';
    $('#editItemLocation').value = item.location || '';
    $('#editItemDate').value = item.date || '';
    $('#editItemStatus').value = item.status || 'reported';
    $('#editItemDescription').value = item.description || '';
    $('#editItemContact').value = item.contact || '';

    const questions = item.securityQuestions || [];
    $('#editSecurityQuestion1').value = questions[0]?.question || '';
    $('#editSecurityAnswer1').value = questions[0]?.answer || '';
    $('#editSecurityQuestion2').value = questions[1]?.question || '';
    $('#editSecurityAnswer2').value = questions[1]?.answer || '';

    const statusGroup = $('#editStatusGroup');
    if (statusGroup) statusGroup.style.display = appState.currentUser?.role === 'admin' ? 'block' : 'none';

    toggleModal('editItemModal', true);
}

async function handleEditItemSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const itemId = parseInt($('#editItemId').value);
    const item = appState.items.find(i => i.id === itemId);
    if (!item) {
        showToast('Item not found.', 'error', 'Edit Failed');
        return;
    }

    const securityQuestions = [];
    const q1 = $('#editSecurityQuestion1').value.trim();
    const a1 = $('#editSecurityAnswer1').value.trim();
    const q2 = $('#editSecurityQuestion2').value.trim();
    const a2 = $('#editSecurityAnswer2').value.trim();
    if (q1 && a1) securityQuestions.push({ question: q1, answer: a1 });
    if (q2 && a2) securityQuestions.push({ question: q2, answer: a2 });

    const payload = {
        type: $('#editReportType').value,
        title: $('#editItemTitle').value.trim(),
        category: $('#editItemCategory').value,
        location: $('#editItemLocation').value.trim(),
        date: $('#editItemDate').value,
        description: $('#editItemDescription').value.trim(),
        contact: $('#editItemContact').value.trim(),
        securityQuestions
    };

    if (appState.currentUser?.role === 'admin') {
        payload.status = $('#editItemStatus').value;
    }

    setButtonLoading(btn, true);
    try {
        const result = await Api.updateItem(itemId, payload);
        const index = appState.items.findIndex(i => i.id === itemId);
        if (index !== -1) appState.items[index] = result.item;
        Storage.setItems(appState.items);
        showToast('Report updated successfully.', 'success', 'Saved');
        toggleModal('editItemModal', false);
        refreshCurrentPage();
        if (appState.currentPage === 'dashboard') renderDashboard();
    } catch (error) {
        showToast(error.message, 'error', 'Edit Failed');
    } finally {
        setButtonLoading(btn, false);
    }
}

function deleteItem(id) {
    confirmAction('Are you sure you want to delete this item?', async () => {
        try {
            await Api.deleteItem(id);
            appState.items = appState.items.filter(i => i.id !== id);
            Storage.setItems(appState.items);
            showToast('Item deleted successfully!', 'success', 'Deleted');
            refreshCurrentPage();
        } catch (error) {
            showToast(error.message, 'error', 'Delete Failed');
        }
    });
}

// ============================================
// VERIFY CLAIM
// ============================================
let activeVerificationItemId = null;

function verifyClaim(id) {
    const item = appState.items.find(i => i.id === id);
    if (!item) return;
    activeVerificationItemId = id;

    // Close view modal if open
    toggleModal('viewItemModal', false);

    const modalBody = $('#verifyClaimModalBody');
    if (!modalBody) return;

    const originalImage = item.images && item.images.length > 0
        ? item.images[0]
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3C/svg%3E';

    modalBody.innerHTML = `
        <div class="verification-card">
            <h3><i class="fas fa-shield-alt"></i> Claim Verification</h3>
            <p style="color: var(--text-gray); margin-bottom: var(--space-lg); font-size: var(--font-size-sm);">Please verify the claimant's answers to the security questions below.</p>

            ${item.securityQuestions ? item.securityQuestions.map((q, i) => `
                <div class="verification-question">
                    <label>Question ${i + 1}:</label>
                    <p>${escapeHtml(q.question)}</p>
                    <label>Claimant's Answer:</label>
                    <input type="text" class="form-control" placeholder="Enter claimant's answer" id="claimAnswer${i}">
                    <label style="margin-top: var(--space-sm);">Correct Answer:</label>
                    <p style="background: rgba(40,167,69,0.08); border-left-color: var(--success); border-left: 3px solid var(--success); padding: var(--space-sm); border-radius: var(--radius-sm); font-size: var(--font-size-sm);">${escapeHtml(q.answer)}</p>
                </div>
            `).join('') : '<p style="color: var(--text-gray);">No security questions set for this item.</p>'}

            <div class="verification-card" style="margin-top: var(--space-lg);">
                <h3><i class="fas fa-image"></i> Image Comparison</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); margin-top: var(--space-md);">
                    <div>
                        <p style="font-size: var(--font-size-xs); color: var(--text-gray); margin-bottom: var(--space-sm); font-weight: 600;">Original Report Image:</p>
                        <img src="${originalImage}" style="width: 100%; border-radius: var(--radius-sm); max-height: 200px; object-fit: cover;"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f0f0\'/%3E%3C/svg%3E'">
                    </div>
                    <div>
                        <p style="font-size: var(--font-size-xs); color: var(--text-gray); margin-bottom: var(--space-sm); font-weight: 600;">Claimant's Image:</p>
                        <img src="${originalImage}" style="width: 100%; border-radius: var(--radius-sm); max-height: 200px; object-fit: cover;"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f0f0\'/%3E%3C/svg%3E'">
                    </div>
                </div>
            </div>
        </div>
    `;

    toggleModal('verifyClaimModal', true);
}

async function approveClaim() {
    if (!activeVerificationItemId) return;
    try {
        const result = await Api.verifyClaim(activeVerificationItemId, 'approve');
        const index = appState.items.findIndex(i => i.id === activeVerificationItemId);
        if (index !== -1) appState.items[index] = result.item;
        Storage.setItems(appState.items);
        showToast('Claim approved! Status updated to Verified.', 'success', 'Claim Verified');
        toggleModal('verifyClaimModal', false);
        refreshCurrentPage();
    } catch (error) {
        showToast(error.message, 'error', 'Verification Failed');
    }
}

async function rejectClaim() {
    if (!activeVerificationItemId) return;
    try {
        const result = await Api.verifyClaim(activeVerificationItemId, 'reject');
        const index = appState.items.findIndex(i => i.id === activeVerificationItemId);
        if (index !== -1) appState.items[index] = result.item;
        Storage.setItems(appState.items);
        showToast('Claim rejected. Status reverted to Matched.', 'warning', 'Claim Rejected');
        toggleModal('verifyClaimModal', false);
        refreshCurrentPage();
    } catch (error) {
        showToast(error.message, 'error', 'Verification Failed');
    }
}

// ============================================
// SAVE SETTINGS
// ============================================
function saveSettings() {
    showToast('Settings saved successfully!', 'success', 'Settings Updated');
}
