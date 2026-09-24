/* =========================================================
   MUJAHID ABBAS DOCX
   PROFILE PAGE JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeProfilePage();
});

let currentProfileUser = null;


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeProfilePage() {
    loadProfileData();
    setupProfileEvents();
    setupPasswordToggles();
    setupMobileSidebar();
    updateStorageInformation();
}


/* =========================================================
   LOAD USER DATA
   ========================================================= */

function loadProfileData() {
    currentProfileUser = getCurrentUser();

    if (!currentProfileUser) {
        setDefaultProfileData();
        return;
    }

    const name =
        currentProfileUser.name ||
        currentProfileUser.fullName ||
        "Mujahid Abbas";

    const email =
        currentProfileUser.email ||
        "No email available";

    setText("profileName", name);
    setText("profileEmail", email);
    setText("profileFullName", name);
    setText("profileEmailInfo", email);

    setInitials("profileAvatar", name);
    setInitials("headerAvatar", name);

    const editName = document.getElementById("editFullName");
    const editEmail = document.getElementById("editEmail");

    if (editName) {
        editName.value = name;
    }

    if (editEmail) {
        editEmail.value = email;
    }
}


function setDefaultProfileData() {
    setText("profileName", "Mujahid Abbas");
    setText("profileEmail", "Not signed in");
    setText("profileFullName", "Mujahid Abbas");
    setText("profileEmailInfo", "Not available");

    setInitials("profileAvatar", "Mujahid Abbas");
    setInitials("headerAvatar", "Mujahid Abbas");
}


function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function setInitials(id, name) {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    const words = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    let initials = "MA";

    if (words.length >= 2) {
        initials =
            words[0].charAt(0) +
            words[words.length - 1].charAt(0);
    } else if (words.length === 1) {
        initials = words[0].substring(0, 2);
    }

    element.textContent = initials.toUpperCase();
}


/* =========================================================
   EVENTS
   ========================================================= */

function setupProfileEvents() {

    document
        .getElementById("editProfileBtn")
        ?.addEventListener("click", openEditProfileModal);

    document
        .getElementById("closeEditProfile")
        ?.addEventListener("click", closeEditProfileModal);

    document
        .getElementById("cancelEditProfile")
        ?.addEventListener("click", closeEditProfileModal);

    document
        .getElementById("editProfileForm")
        ?.addEventListener("submit", saveProfile);

    document
        .getElementById("changePasswordBtn")
        ?.addEventListener("click", openPasswordModal);

    document
        .getElementById("closePasswordModal")
        ?.addEventListener("click", closePasswordModal);

    document
        .getElementById("cancelPassword")
        ?.addEventListener("click", closePasswordModal);

    document
        .getElementById("changePasswordForm")
        ?.addEventListener("submit", changePassword);

    document
        .getElementById("deleteAccountBtn")
        ?.addEventListener("click", openDeleteModal);

    document
        .getElementById("closeDeleteModal")
        ?.addEventListener("click", closeDeleteModal);

    document
        .getElementById("cancelDelete")
        ?.addEventListener("click", closeDeleteModal);

    document
        .getElementById("confirmDeleteAccount")
        ?.addEventListener("click", deleteAccount);

    document
        .getElementById("logoutBtn")
        ?.addEventListener("click", handleLogout);

    document
        .getElementById("sidebarLogout")
        ?.addEventListener("click", handleLogout);

    document
        .querySelectorAll(".profile-modal")
        .forEach((modal) => {

            modal.addEventListener("click", (event) => {

                if (event.target === modal) {
                    closeAllModals();
                }

            });

        });

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeAllModals();
        }

    });
}


/* =========================================================
   EDIT PROFILE
   ========================================================= */

function openEditProfileModal() {

    const modal =
        document.getElementById("editProfileModal");

    if (!modal) {
        return;
    }

    const nameInput =
        document.getElementById("editFullName");

    const emailInput =
        document.getElementById("editEmail");

    if (currentProfileUser) {

        if (nameInput) {
            nameInput.value =
                currentProfileUser.name ||
                currentProfileUser.fullName ||
                "";
        }

        if (emailInput) {
            emailInput.value =
                currentProfileUser.email ||
                "";
        }
    }

    modal.classList.add("active");

    setTimeout(() => {
        nameInput?.focus();
    }, 200);
}


function closeEditProfileModal() {

    document
        .getElementById("editProfileModal")
        ?.classList.remove("active");
}


async function saveProfile(event) {

    event.preventDefault();

    const nameInput =
        document.getElementById("editFullName");

    const emailInput =
        document.getElementById("editEmail");

    const name =
        nameInput?.value.trim() || "";

    const email =
        emailInput?.value.trim() || "";

    if (name.length < 2) {

        showProfileToast(
            "Please enter a valid full name.",
            "error"
        );

        nameInput?.focus();
        return;
    }

    if (!isValidEmail(email)) {

        showProfileToast(
            "Please enter a valid email address.",
            "error"
        );

        emailInput?.focus();
        return;
    }

    const saveButton =
        document.getElementById("saveProfileBtn");

    setButtonLoading(saveButton, true);

    try {

        const updatedUser = {
            ...(currentProfileUser || {}),
            name: name,
            fullName: name,
            email: email
        };

        currentProfileUser = updatedUser;

        localStorage.setItem(
            "mujahid_user",
            JSON.stringify(updatedUser)
        );

        loadProfileData();
        closeEditProfileModal();

        showProfileToast(
            "Profile updated successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );

        showProfileToast(
            "Unable to update profile.",
            "error"
        );

    } finally {

        setButtonLoading(
            saveButton,
            false
        );
    }
}


/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

function openPasswordModal() {

    const modal =
        document.getElementById("changePasswordModal");

    if (!modal) {
        return;
    }

    document
        .getElementById("changePasswordForm")
        ?.reset();

    modal.classList.add("active");

    setTimeout(() => {

        document
            .getElementById("currentPassword")
            ?.focus();

    }, 200);
}


function closePasswordModal() {

    document
        .getElementById("changePasswordModal")
        ?.classList.remove("active");
}


async function changePassword(event) {

    event.preventDefault();

    const currentPassword =
        document.getElementById("currentPassword")
        ?.value || "";

    const newPassword =
        document.getElementById("newPassword")
        ?.value || "";

    const confirmPassword =
        document.getElementById("confirmNewPassword")
        ?.value || "";

    if (!currentPassword) {

        showProfileToast(
            "Please enter your current password.",
            "error"
        );

        return;
    }

    if (newPassword.length < 8) {

        showProfileToast(
            "New password must contain at least 8 characters.",
            "error"
        );

        return;
    }

    if (newPassword !== confirmPassword) {

        showProfileToast(
            "New passwords do not match.",
            "error"
        );

        return;
    }

    const button =
        document.getElementById("savePasswordBtn");

    setButtonLoading(button, true);

    try {

        await new Promise((resolve) => {
            setTimeout(resolve, 800);
        });

        closePasswordModal();

        showProfileToast(
            "Password change request saved. Backend security will be connected next.",
            "success"
        );

    } catch (error) {

        console.error(
            "Password change error:",
            error
        );

        showProfileToast(
            "Unable to change password.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   PASSWORD SHOW / HIDE
   ========================================================= */

function setupPasswordToggles() {

    document
        .querySelectorAll(".profile-password-toggle")
        .forEach((button) => {

            button.addEventListener("click", () => {

                const targetId =
                    button.getAttribute("data-target");

                if (!targetId) {
                    return;
                }

                const input =
                    document.getElementById(targetId);

                if (!input) {
                    return;
                }

                if (input.type === "password") {

                    input.type = "text";

                    button.setAttribute(
                        "aria-label",
                        "Hide password"
                    );

                } else {

                    input.type = "password";

                    button.setAttribute(
                        "aria-label",
                        "Show password"
                    );
                }

            });

        });
}


/* =========================================================
   DELETE ACCOUNT
   ========================================================= */

function openDeleteModal() {

    document
        .getElementById("deleteAccountModal")
        ?.classList.add("active");
}


function closeDeleteModal() {

    document
        .getElementById("deleteAccountModal")
        ?.classList.remove("active");
}


async function deleteAccount() {

    const button =
        document.getElementById("confirmDeleteAccount");

    setButtonLoading(button, true);

    try {

        await new Promise((resolve) => {
            setTimeout(resolve, 800);
        });

        closeDeleteModal();

        showProfileToast(
            "Account deletion requires backend verification.",
            "error"
        );

    } catch (error) {

        console.error(
            "Delete account error:",
            error
        );

        showProfileToast(
            "Unable to process account deletion.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

function handleLogout(event) {

    if (event) {
        event.preventDefault();
    }

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );

    if (!confirmed) {
        return;
    }

    logoutUser();
}


/* =========================================================
   STORAGE INFORMATION
   ========================================================= */

function updateStorageInformation() {

    let usedBytes = 0;

    try {

        const storedDocuments =
            JSON.parse(
                localStorage.getItem(
                    "mujahid_documents"
                ) || "[]"
            );

        if (Array.isArray(storedDocuments)) {

            usedBytes =
                storedDocuments.reduce(
                    (total, document) => {

                        return (
                            total +
                            Number(
                                document.size || 0
                            )
                        );

                    },
                    0
                );
        }

    } catch (error) {

        console.warn(
            "Unable to read local document storage.",
            error
        );
    }

    const maxStorageBytes =
        64 * 1024 * 1024 * 1024;

    const percentage =
        Math.min(
            (usedBytes / maxStorageBytes) * 100,
            100
        );

    const usedText =
        formatStorageSize(usedBytes);

    const availableBytes =
        Math.max(
            maxStorageBytes - usedBytes,
            0
        );

    const availableText =
        formatStorageSize(availableBytes);

    setText(
        "profileStorageUsed",
        usedText
    );

    setText(
        "profileStorageAvailable",
        availableText
    );

    setText(
        "profileStoragePercentage",
        `${percentage.toFixed(2)}%`
    );

    const progress =
        document.getElementById(
            "profileStorageProgress"
        );

    if (progress) {
        progress.style.width =
            `${percentage}%`;
    }
}


/* =========================================================
   FORMAT STORAGE SIZE
   ========================================================= */

function formatStorageSize(bytes) {

    if (!bytes || bytes <= 0) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB",
        "TB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    const safeIndex =
        Math.min(
            index,
            units.length - 1
        );

    const value =
        bytes /
        Math.pow(
            1024,
            safeIndex
        );

    return `${value.toFixed(
        safeIndex === 0 ? 0 : 2
    )} ${units[safeIndex]}`;
}


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function setupMobileSidebar() {

    const menuButton =
        document.getElementById(
            "mobileMenuBtn"
        );

    const sidebar =
        document.querySelector(
            ".profile-sidebar"
        );

    const overlay =
        document.querySelector(
            ".profile-mobile-overlay"
        );

    if (!menuButton || !sidebar) {
        return;
    }

    menuButton.addEventListener("click", () => {

        sidebar.classList.toggle(
            "mobile-open"
        );

        if (overlay) {
            overlay.classList.toggle(
                "active"
            );
        }

    });

    if (overlay) {

        overlay.addEventListener("click", () => {

            sidebar.classList.remove(
                "mobile-open"
            );

            overlay.classList.remove(
                "active"
            );

        });
    }
}


/* =========================================================
   CLOSE ALL MODALS
   ========================================================= */

function closeAllModals() {

    document
        .querySelectorAll(".profile-modal")
        .forEach((modal) => {

            modal.classList.remove("active");

        });
}


/* =========================================================
   TOAST
   ========================================================= */

function showProfileToast(message, type = "info") {

    const container =
        document.getElementById(
            "profileToastContainer"
        ) ||
        document.getElementById(
            "toastContainer"
        );

    if (!container) {
        alert(message);
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `profile-toast toast-${type}`;

    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 3500);
}


/* =========================================================
   BUTTON LOADING
   ========================================================= */

function setButtonLoading(button, loading) {

    if (!button) {
        return;
    }

    if (loading) {

        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Please wait...";

        button.classList.add(
            "is-loading"
        );

    } else {

        button.disabled = false;

        if (button.dataset.originalText) {

            button.textContent =
                button.dataset.originalText;

        }

        button.classList.remove(
            "is-loading"
        );
    }
}


/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


/* =========================================================
   PAGE LOADER
   ========================================================= */

window.addEventListener("load", () => {

    const loader =
        document.getElementById(
            "pageLoader"
        );

    if (loader) {

        setTimeout(() => {

            loader.classList.add(
                "hidden"
            );

        }, 300);
    }
});