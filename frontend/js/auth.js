// ==========================================
// MUJAHID ABBAS DOCX - AUTHENTICATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeAuth();
});

let pendingOtpEmail = "";

// ==========================================
// INITIALIZE
// ==========================================

function initializeAuth() {
    setupFormEvents();
    setupNavigationEvents();
    setupPasswordToggles();
    setupPasswordStrength();
    setupOtpInputs();
    hideAuthLoader();
}

// ==========================================
// FORM EVENTS
// ==========================================

function setupFormEvents() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const otpForm = document.getElementById("otpForm");
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }

    if (otpForm) {
        otpForm.addEventListener("submit", handleOtpVerification);
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener(
            "submit",
            handleForgotPassword
        );
    }
}

// ==========================================
// NAVIGATION
// ==========================================

function setupNavigationEvents() {
    const showRegisterLinks = document.querySelectorAll(
        '[data-auth="register"], #showRegister, .show-register'
    );

    const showLoginLinks = document.querySelectorAll(
        '[data-auth="login"], #showLogin, .show-login'
    );

    const showForgotLinks = document.querySelectorAll(
        '[data-auth="forgot"], #showForgotPassword, .show-forgot'
    );

    const backToLoginLinks = document.querySelectorAll(
        '[data-auth="back-login"], #backToLogin, .back-to-login'
    );

    showRegisterLinks.forEach((element) => {
        element.addEventListener("click", (event) => {
            event.preventDefault();
            showAuthSection("register");
        });
    });

    showLoginLinks.forEach((element) => {
        element.addEventListener("click", (event) => {
            event.preventDefault();
            showAuthSection("login");
        });
    });

    showForgotLinks.forEach((element) => {
        element.addEventListener("click", (event) => {
            event.preventDefault();
            showAuthSection("forgot");
        });
    });

    backToLoginLinks.forEach((element) => {
        element.addEventListener("click", (event) => {
            event.preventDefault();
            showAuthSection("login");
        });
    });
}

// ==========================================
// SHOW AUTH SECTION
// ==========================================

function showAuthSection(section) {
    const loginContainer =
        document.getElementById("loginContainer") ||
        document.getElementById("loginSection");

    const registerContainer =
        document.getElementById("registerContainer") ||
        document.getElementById("registerSection");

    const otpContainer =
        document.getElementById("otpContainer") ||
        document.getElementById("otpSection");

    const forgotContainer =
        document.getElementById("forgotContainer") ||
        document.getElementById("forgotPasswordSection");

    const containers = [
        loginContainer,
        registerContainer,
        otpContainer,
        forgotContainer
    ];

    containers.forEach((container) => {
        if (container) {
            container.classList.remove("active");
            container.style.display = "none";
        }
    });

    let target = null;

    if (section === "login") {
        target = loginContainer;
    } else if (section === "register") {
        target = registerContainer;
    } else if (section === "otp") {
        target = otpContainer;
    } else if (section === "forgot") {
        target = forgotContainer;
    }

    if (target) {
        target.classList.add("active");
        target.style.display = "block";
    }
}

// ==========================================
// LOGIN
// ==========================================

async function handleLogin(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const emailInput = form.querySelector(
        'input[name="email"], #loginEmail, #email'
    );
    const passwordInput = form.querySelector(
        'input[name="password"], #loginPassword, #password'
    );
    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {
        showAuthMessage("Please enter email and password.", "error");
        shakeElement(form);
        return;
    }

    try {
        setButtonLoading(submitButton, true, "Signing in...");

        const result = await apiPost("/auth/login", {
            email,
            password
        });

        if (!result.success) {
            throw new Error(result.message || "Login failed");
        }

        if (result.session) {
            saveAuthSession(result);
        }

        showAuthMessage("Login successful.", "success");

        setTimeout(() => {
            window.location.href = "documents.html";
        }, 700);
    } catch (error) {
        console.error("Login error:", error);

        showAuthMessage(
            error.message || "Unable to sign in.",
            "error"
        );

        shakeElement(form);
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// ==========================================
// REGISTER
// ==========================================

async function handleRegister(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const nameInput = form.querySelector(
        'input[name="fullName"], input[name="name"], #registerFullName, #fullName'
    );

    const emailInput = form.querySelector(
        'input[name="email"], #registerEmail, #email'
    );

    const passwordInput = form.querySelector(
        'input[name="password"], #registerPassword, #password'
    );

    const confirmPasswordInput = form.querySelector(
        'input[name="confirmPassword"], #confirmPassword, #registerConfirmPassword'
    );

    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    const fullName = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const confirmPassword = confirmPasswordInput
        ? confirmPasswordInput.value
        : "";

    if (!fullName || !email || !password || !confirmPassword) {
        showAuthMessage(
            "Please fill in all registration fields.",
            "error"
        );
        shakeElement(form);
        return;
    }

    if (!isValidEmail(email)) {
        showAuthMessage("Please enter a valid email address.", "error");
        shakeElement(form);
        return;
    }

    if (password.length < 8) {
        showAuthMessage(
            "Password must be at least 8 characters.",
            "error"
        );
        shakeElement(form);
        return;
    }

    if (password !== confirmPassword) {
        showAuthMessage("Passwords do not match.", "error");
        shakeElement(form);
        return;
    }

    try {
        setButtonLoading(submitButton, true, "Creating account...");

        const result = await apiPost("/auth/register", {
            fullName,
            email,
            password
        });

        if (!result.success) {
            throw new Error(
                result.message || "Registration failed"
            );
        }

        pendingOtpEmail = email.toLowerCase();

        const otpEmailText =
            document.getElementById("otpEmail");

        if (otpEmailText) {
            otpEmailText.textContent = pendingOtpEmail;
        }

        clearOtpInputs();
        showAuthSection("otp");

        showAuthMessage(
            "Verification code sent to your email.",
            "success"
        );
    } catch (error) {
        console.error("Registration error:", error);

        showAuthMessage(
            error.message || "Unable to create account.",
            "error"
        );

        shakeElement(form);
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// ==========================================
// OTP VERIFICATION
// ==========================================

async function handleOtpVerification(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    const otp = getOtpValue();

    if (!pendingOtpEmail) {
        showAuthMessage(
            "Registration session expired. Please register again.",
            "error"
        );
        return;
    }

    if (otp.length !== 6) {
        showAuthMessage(
            "Please enter the complete 6-digit OTP.",
            "error"
        );
        shakeElement(form);
        return;
    }

    try {
        setButtonLoading(submitButton, true, "Verifying...");

        const result = await apiPost("/auth/verify-otp", {
            email: pendingOtpEmail,
            token: otp
        });

        if (!result.success) {
            throw new Error(
                result.message || "OTP verification failed"
            );
        }

        if (result.session) {
            saveAuthSession(result);
        }

        showAuthMessage(
            "Email verified successfully.",
            "success"
        );

        setTimeout(() => {
            if (result.session) {
                window.location.href = "documents.html";
            } else {
                showAuthSection("login");
                showAuthMessage(
                    "Email verified. Please sign in.",
                    "success"
                );
            }
        }, 900);
    } catch (error) {
        console.error("OTP error:", error);

        showAuthMessage(
            error.message || "Invalid or expired OTP.",
            "error"
        );

        shakeElement(form);
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// ==========================================
// RESEND OTP
// ==========================================

async function resendOtp() {
    if (!pendingOtpEmail) {
        showAuthMessage(
            "Please start registration again.",
            "error"
        );
        return;
    }

    const resendButton =
        document.getElementById("resendOtpBtn") ||
        document.querySelector(".resend-otp");

    try {
        setButtonLoading(resendButton, true, "Sending...");

        const result = await apiPost("/auth/resend-otp", {
            email: pendingOtpEmail
        });

        if (!result.success) {
            throw new Error(
                result.message || "Unable to resend OTP"
            );
        }

        showAuthMessage(
            "A new verification code has been sent.",
            "success"
        );

        startOtpCountdown();
    } catch (error) {
        console.error("Resend OTP error:", error);

        showAuthMessage(
            error.message || "Unable to resend verification code.",
            "error"
        );
    } finally {
        setButtonLoading(resendButton, false);
    }
}

// ==========================================
// FORGOT PASSWORD
// ==========================================

async function handleForgotPassword(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const emailInput = form.querySelector(
        'input[name="email"], #forgotEmail'
    );

    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    const email = emailInput ? emailInput.value.trim() : "";

    if (!email) {
        showAuthMessage("Please enter your email.", "error");
        return;
    }

    if (!isValidEmail(email)) {
        showAuthMessage("Please enter a valid email.", "error");
        return;
    }

    try {
        setButtonLoading(
            submitButton,
            true,
            "Sending..."
        );

        const result = await apiPost(
            "/auth/forgot-password",
            {
                email
            }
        );

        if (!result.success) {
            throw new Error(
                result.message || "Unable to send reset email"
            );
        }

        showAuthMessage(
            "Password reset instructions have been sent to your email.",
            "success"
        );

        form.reset();
    } catch (error) {
        console.error("Forgot password error:", error);

        showAuthMessage(
            error.message || "Unable to process password reset.",
            "error"
        );
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// ==========================================
// PASSWORD TOGGLES
// ==========================================

function setupPasswordToggles() {
    document.querySelectorAll(
        "[data-password-toggle], .password-toggle, .toggle-password"
    ).forEach((button) => {
        button.addEventListener("click", () => {
            const targetId =
                button.getAttribute("data-target");

            let input = null;

            if (targetId) {
                input = document.getElementById(targetId);
            }

            if (!input) {
                const wrapper = button.closest(
                    ".password-field, .input-group, .form-group"
                );

                if (wrapper) {
                    input = wrapper.querySelector(
                        'input[type="password"], input[type="text"]'
                    );
                }
            }

            if (!input) return;

            if (input.type === "password") {
                input.type = "text";
                button.classList.add("active");
            } else {
                input.type = "password";
                button.classList.remove("active");
            }
        });
    });
}

// ==========================================
// PASSWORD STRENGTH
// ==========================================

function setupPasswordStrength() {
    const passwordInputs = document.querySelectorAll(
        '#registerPassword, #password, input[name="password"]'
    );

    passwordInputs.forEach((input) => {
        input.addEventListener("input", () => {
            updatePasswordStrength(input.value);
        });
    });
}

function updatePasswordStrength(password) {
    const strengthBar =
        document.getElementById("passwordStrengthBar");

    const strengthText =
        document.getElementById("passwordStrengthText");

    if (!strengthBar && !strengthText) {
        return;
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels = [
        "Very weak",
        "Weak",
        "Fair",
        "Good",
        "Strong",
        "Very strong"
    ];

    const label = labels[score];

    if (strengthBar) {
        strengthBar.style.width = `${Math.min(
            score * 20,
            100
        )}%`;
    }

    if (strengthText) {
        strengthText.textContent = password
            ? label
            : "";
    }
}

// ==========================================
// OTP INPUTS
// ==========================================

function setupOtpInputs() {
    const otpInputs = getOtpInputs();

    otpInputs.forEach((input, index) => {
        input.addEventListener("input", () => {
            input.value = input.value
                .replace(/\D/g, "")
                .slice(0, 1);

            if (
                input.value &&
                otpInputs[index + 1]
            ) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener("keydown", (event) => {
            if (
                event.key === "Backspace" &&
                !input.value &&
                otpInputs[index - 1]
            ) {
                otpInputs[index - 1].focus();
            }
        });

        input.addEventListener("paste", (event) => {
            event.preventDefault();

            const pasted =
                event.clipboardData
                    .getData("text")
                    .replace(/\D/g, "")
                    .slice(0, 6);

            pasted.split("").forEach((digit, i) => {
                if (otpInputs[i]) {
                    otpInputs[i].value = digit;
                }
            });

            const next =
                otpInputs[Math.min(pasted.length, 5)];

            if (next) {
                next.focus();
            }
        });
    });

    const resendButton =
        document.getElementById("resendOtpBtn") ||
        document.querySelector(".resend-otp");

    if (resendButton) {
        resendButton.addEventListener(
            "click",
            resendOtp
        );
    }

    startOtpCountdown();
}

function getOtpInputs() {
    const inputs = [
        ...document.querySelectorAll(
            '#otpForm input[maxlength="1"], .otp-input'
        )
    ];

    return inputs.slice(0, 6);
}

function getOtpValue() {
    return getOtpInputs()
        .map((input) => input.value.trim())
        .join("");
}

function clearOtpInputs() {
    getOtpInputs().forEach((input) => {
        input.value = "";
    });

    const first = getOtpInputs()[0];

    if (first) {
        first.focus();
    }
}

// ==========================================
// OTP COUNTDOWN
// ==========================================

let otpCountdownTimer = null;

function startOtpCountdown() {
    const countdownElement =
        document.getElementById("otpCountdown");

    const resendButton =
        document.getElementById("resendOtpBtn") ||
        document.querySelector(".resend-otp");

    if (!countdownElement) {
        return;
    }

    clearInterval(otpCountdownTimer);

    let seconds = 60;

    if (resendButton) {
        resendButton.disabled = true;
    }

    countdownElement.textContent =
        `Resend in ${seconds}s`;

    otpCountdownTimer = setInterval(() => {
        seconds--;

        if (seconds <= 0) {
            clearInterval(otpCountdownTimer);

            countdownElement.textContent =
                "You can resend the code";

            if (resendButton) {
                resendButton.disabled = false;
            }

            return;
        }

        countdownElement.textContent =
            `Resend in ${seconds}s`;
    }, 1000);
}

// ==========================================
// BUTTON LOADING
// ==========================================

function setButtonLoading(
    button,
    loading,
    loadingText = "Loading..."
) {
    if (!button) return;

    if (loading) {
        button.dataset.originalText =
            button.textContent;

        button.disabled = true;
        button.classList.add("loading");

        if (button.tagName === "INPUT") {
            button.value = loadingText;
        } else {
            button.textContent = loadingText;
        }
    } else {
        button.disabled = false;
        button.classList.remove("loading");

        if (button.tagName === "INPUT") {
            button.value =
                button.dataset.originalText || "Submit";
        } else {
            button.textContent =
                button.dataset.originalText || "Submit";
        }
    }
}

// ==========================================
// MESSAGE
// ==========================================

function showAuthMessage(message, type = "info") {
    const existing =
        document.querySelector(".auth-message");

    if (existing) {
        existing.remove();
    }

    const messageBox = document.createElement("div");

    messageBox.className =
        `auth-message ${type}`;

    messageBox.textContent = message;

    const authCard =
        document.querySelector(
            ".auth-card, .auth-form-container, .auth-panel"
        );

    if (authCard) {
        authCard.insertBefore(
            messageBox,
            authCard.firstChild
        );
    } else {
        document.body.appendChild(messageBox);
    }

    setTimeout(() => {
        messageBox.classList.add("show");
    }, 10);

    setTimeout(() => {
        messageBox.classList.remove("show");

        setTimeout(() => {
            messageBox.remove();
        }, 300);
    }, 4000);
}

// ==========================================
// SHAKE ANIMATION
// ==========================================

function shakeElement(element) {
    if (!element) return;

    element.classList.remove("shake");

    void element.offsetWidth;

    element.classList.add("shake");

    setTimeout(() => {
        element.classList.remove("shake");
    }, 500);
}

// ==========================================
// VALIDATION
// ==========================================

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==========================================
// LOADER
// ==========================================

function hideAuthLoader() {
    const loader =
        document.getElementById("pageLoader");

    if (!loader) return;

    setTimeout(() => {
        loader.classList.add("hidden");
    }, 300);
}

// ==========================================
// AUTH SESSION CHECK
// ==========================================

function redirectIfAlreadyLoggedIn() {
    if (
        typeof isAuthenticated === "function" &&
        isAuthenticated()
    ) {
        window.location.href = "documents.html";
    }
}