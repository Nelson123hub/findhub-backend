/* ============================================
   Futminna FindHub - Authentication Module
   Backend-powered login, register, OTP, logout
   ============================================ */

let pendingRegistration = null;
let otpTimerInterval = null;

function initAuth() {
    const savedUser = Storage.getUser();
    if (savedUser && Api.token) {
        appState.currentUser = savedUser;
        if (window.location.pathname.includes('login') ||
            window.location.pathname.includes('index.html') &&
            !window.location.pathname.includes('dashboard')) {
            window.location.href = 'dashboard.html';
        }
    }

    $('#loginForm')?.addEventListener('submit', handleLogin);
    $('#registerForm')?.addEventListener('submit', handleRegister);
    setupOTPInputs();
    setupAuthTabs();
    setupDemoLogins();
    $('#resendOtp')?.addEventListener('click', handleResendOTP);
}

function setupAuthTabs() {
    const tabs = $$('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            $$('.auth-form').forEach(form => form.classList.remove('active'));
            const targetForm = $(`#${tab.dataset.target}`);
            if (targetForm) targetForm.classList.add('active');
        });
    });
}

function setupOTPInputs() {
    const otpInputs = $$('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (!/^\d*$/.test(val)) {
                e.target.value = val.replace(/\D/g, '');
                return;
            }
            if (val.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            pastedData.split('').forEach((char, i) => {
                if (otpInputs[i]) otpInputs[i].value = char;
            });
            if (otpInputs[pastedData.length - 1]) {
                otpInputs[pastedData.length - 1].focus();
            }
        });
    });
}

function setupDemoLogins() {
    $$('[data-demo-login]').forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.dataset.demoLogin;
            const user = DEMO_USERS.find(u => u.role === role);
            if (user) {
                $('#loginEmail').value = user.email;
                $('#loginPassword').value = user.password;
                showToast('Demo credentials filled. Click Login to continue.', 'info', 'Demo Account');
            }
        });
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    const btn = e.target.querySelector('button[type="submit"]');

    if (!email || !password) {
        showToast('Please fill in all fields.', 'error', 'Validation Error');
        return;
    }

    setButtonLoading(btn, true);
    try {
        const result = await Api.login(email, password);
        Api.token = result.token;
        appState.currentUser = result.user;
        Storage.setUser(result.user);
        showToast(`Welcome back, ${result.user.firstName}! Redirecting...`, 'success', 'Login Successful');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
    } catch (error) {
        showToast(error.message, 'error', 'Login Failed');
        setButtonLoading(btn, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const firstName = $('#regFirstName').value.trim();
    const lastName = $('#regLastName').value.trim();
    const email = $('#regEmail').value.trim();
    const matric = $('#regMatric').value.trim();
    const department = $('#regDepartment').value;
    const phone = $('#regPhone').value.trim();
    const password = $('#regPassword').value;
    const confirmPassword = $('#regConfirmPassword').value;
    const agreeTerms = $('#agreeTerms').checked;

    ['regFirstName', 'regLastName', 'regEmail', 'regMatric', 'regDepartment',
     'regPhone', 'regPassword', 'regConfirmPassword'].forEach(clearFieldError);

    let hasError = false;
    if (!firstName) { showFieldError('regFirstName', 'First name is required'); hasError = true; }
    if (!lastName) { showFieldError('regLastName', 'Last name is required'); hasError = true; }
    if (!email) { showFieldError('regEmail', 'Email is required'); hasError = true; }
    else if (!validateEmail(email)) { showFieldError('regEmail', 'Please enter a valid email address'); hasError = true; }
    else if (!email.toLowerCase().endsWith('@st.futminna.edu.ng') && !email.toLowerCase().endsWith('@futminna.edu.ng')) {
        showFieldError('regEmail', 'Please use your FUTMINNA email address'); hasError = true;
    }
    if (!matric) { showFieldError('regMatric', 'Matric number is required'); hasError = true; }
    else if (!validateMatric(matric)) { showFieldError('regMatric', 'Format: YYYY/N/NNNNNXX (e.g., 2023/1/34567CF)'); hasError = true; }
    if (!department) { showFieldError('regDepartment', 'Please select your department'); hasError = true; }
    if (!phone) { showFieldError('regPhone', 'Phone number is required'); hasError = true; }
    else if (!/^\d{11}$/.test(phone.replace(/\s/g, ''))) { showFieldError('regPhone', 'Please enter a valid 11-digit phone number'); hasError = true; }
    if (!password) { showFieldError('regPassword', 'Password is required'); hasError = true; }
    else if (password.length < 8) { showFieldError('regPassword', 'Password must be at least 8 characters'); hasError = true; }
    if (password !== confirmPassword) { showFieldError('regConfirmPassword', 'Passwords do not match'); hasError = true; }
    if (!agreeTerms) { showToast('You must agree to the Terms of Service.', 'warning', 'Terms Required'); hasError = true; }
    if (hasError) return;

    const btn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);

    pendingRegistration = { firstName, lastName, email, matric, department, phone, password };
    try {
        const result = await Api.requestRegistration(pendingRegistration);
        const message = result.emailSent
            ? 'Verification code sent to your email.'
            : `Verification code generated. Demo OTP: ${result.devCode}`;
        showToast(message, 'success', 'Check Your Email');
        $('#registerFormFields').classList.add('hidden');
        $('#otpSection').classList.remove('hidden');
        setButtonLoading(btn, false);
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Verify & Create Account';
        e.target.removeEventListener('submit', handleRegister);
        e.target.addEventListener('submit', verifyOTP);
        startOTPTimer();
    } catch (error) {
        showToast(error.message, 'error', 'Registration Failed');
        setButtonLoading(btn, false);
    }
}

async function verifyOTP(e) {
    e.preventDefault();
    const otp = Array.from($$('.otp-input')).map(i => i.value).join('');
    if (otp.length !== 6) {
        showToast('Please enter all 6 digits of the verification code.', 'error', 'Invalid OTP');
        return;
    }
    if (!pendingRegistration) {
        showToast('Registration session expired. Please fill the form again.', 'error', 'Try Again');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);
    try {
        await Api.verifyRegistration(pendingRegistration.email, otp);
        showToast('Account created successfully! You can now login.', 'success', 'Account Created');
        setTimeout(() => {
            document.querySelector('[data-target="loginForm"]').click();
            e.target.reset();
            $('#registerFormFields').classList.remove('hidden');
            $('#otpSection').classList.add('hidden');
            setButtonLoading(btn, false);
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            e.target.removeEventListener('submit', verifyOTP);
            e.target.addEventListener('submit', handleRegister);
            pendingRegistration = null;
        }, 1200);
    } catch (error) {
        showToast(error.message, 'error', 'Verification Failed');
        setButtonLoading(btn, false);
    }
}

function startOTPTimer() {
    let seconds = 59;
    const timerEl = $('#otpTimer');
    const resendLink = $('#resendOtp');
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    resendLink.style.pointerEvents = 'none';
    resendLink.style.opacity = '0.5';
    resendLink.textContent = 'Resend in ';
    const span = document.createElement('span');
    span.id = 'otpTimer';
    span.textContent = '59';
    resendLink.appendChild(span);
    resendLink.append('s');

    otpTimerInterval = setInterval(() => {
        const currentTimer = $('#otpTimer');
        if (currentTimer) currentTimer.textContent = seconds;
        seconds--;
        if (seconds < 0) {
            clearInterval(otpTimerInterval);
            resendLink.style.pointerEvents = 'auto';
            resendLink.style.opacity = '1';
            resendLink.textContent = 'Resend Code';
        }
    }, 1000);
}

async function handleResendOTP(e) {
    e.preventDefault();
    if (!pendingRegistration) return;
    try {
        const result = await Api.requestRegistration(pendingRegistration);
        const message = result.emailSent
            ? 'A new verification code has been sent to your email.'
            : `New demo OTP: ${result.devCode}`;
        showToast(message, 'success', 'Code Resent');
        startOTPTimer();
    } catch (error) {
        showToast(error.message, 'error', 'Could Not Resend');
    }
}

async function logout() {
    try { await Api.logout(); } catch (_) {}
    appState.currentUser = null;
    Api.token = null;
    Storage.removeUser();
    showToast('Logged out successfully!', 'info', 'Goodbye');
    setTimeout(() => { window.location.href = 'index.html'; }, 700);
}

function togglePasswordVisibility(inputId, toggleBtn) {
    const input = $(`#${inputId}`);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}
