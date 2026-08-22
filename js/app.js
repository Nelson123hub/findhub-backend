/* ============================================
   Futminna FindHub - Main Application
   Entry point: initializes all modules
   ============================================ */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth (login/register pages)
    if ($('#loginForm') || $('#registerForm')) {
        initAuth();
    }

    // Initialize dashboard (dashboard page)
    if ($('.app-layout')) {
        initDashboard();
    }

    // Smooth scroll for anchor links
    $$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = $(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Mobile nav toggle for landing page
    $('#mobileNavToggle')?.addEventListener('click', () => {
        $('#navLinks')?.classList.toggle('active');
    });

    // Close mobile nav when clicking a link
    $$('#navLinks a').forEach(link => {
        link.addEventListener('click', () => {
            $('#navLinks')?.classList.remove('active');
        });
    });
});
