// ==========================================
// MUJAHID ABBAS DOCX - API HELPER
// ==========================================

const API_CONFIG = {
    BASE_URL: "https://mujahid-abbas-docx.onrender.com/api",
    REQUEST_TIMEOUT: 30000,
    UPLOAD_TIMEOUT: 120000
};

const AUTH_TOKEN_KEY = "mujahid_auth_token";
const CURRENT_USER_KEY = "mujahid_current_user";

// ==========================================
// MAIN API REQUEST
// ==========================================

async function apiRequest(endpoint, options = {}) {
    const controller = new AbortController();

    const timeout =
        options.upload
            ? API_CONFIG.UPLOAD_TIMEOUT
            : API_CONFIG.REQUEST_TIMEOUT;

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);

        const headers = {
            Accept: "application/json",
            ...(options.headers || {})
        };

        // Add JSON content type when body is not FormData
        if (
            options.body &&
            !(options.body instanceof FormData) &&
            !headers["Content-Type"]
        ) {
            headers["Content-Type"] = "application/json";
        }

        // Add JWT token when available
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
            `${API_CONFIG.BASE_URL}${endpoint}`,
            {
                ...options,
                headers,
                signal: controller.signal
            }
        );

        const contentType =
            response.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();

            data = {
                success: response.ok,
                message: text
            };
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                `Request failed with status ${response.status}`
            );
        }

        return data;
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(
                "Request timed out. Please check that the backend is running."
            );
        }

        console.error("API Request Error:", error);

        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// ==========================================
// GET
// ==========================================

async function apiGet(endpoint) {
    return apiRequest(endpoint, {
        method: "GET"
    });
}

// ==========================================
// POST
// ==========================================

async function apiPost(endpoint, body = {}) {
    return apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
    });
}

// ==========================================
// PUT
// ==========================================

async function apiPut(endpoint, body = {}) {
    return apiRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(body)
    });
}

// ==========================================
// DELETE
// ==========================================

async function apiDelete(endpoint) {
    return apiRequest(endpoint, {
        method: "DELETE"
    });
}

// ==========================================
// FILE UPLOAD
// ==========================================

async function apiUpload(endpoint, formData) {
    return apiRequest(endpoint, {
        method: "POST",
        body: formData,
        upload: true
    });
}

// ==========================================
// SAVE AUTH SESSION
// ==========================================

function saveAuthSession(data) {
    if (!data) return;

    if (data.session) {
        if (data.session.access_token) {
            localStorage.setItem(
                AUTH_TOKEN_KEY,
                data.session.access_token
            );
        }

        if (data.session.refresh_token) {
            localStorage.setItem(
                "mujahid_auth_refresh_token",
                data.session.refresh_token
            );
        }
    }

    if (data.user) {
        localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify(data.user)
        );
    }
}

// ==========================================
// GET CURRENT USER
// ==========================================

function getCurrentUser() {
    try {
        const user =
            localStorage.getItem(CURRENT_USER_KEY);

        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error(
            "Unable to read current user:",
            error
        );

        return null;
    }
}

// ==========================================
// GET AUTH TOKEN
// ==========================================

function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

// ==========================================
// CHECK AUTHENTICATION
// ==========================================

function isAuthenticated() {
    return !!getAuthToken();
}

// ==========================================
// LOGOUT
// ==========================================

function logoutUser() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(
        "mujahid_auth_refresh_token"
    );
    localStorage.removeItem(CURRENT_USER_KEY);

    window.location.href = "index.html";
}

// ==========================================
// REQUIRE AUTHENTICATION
// ==========================================

function requireAuthentication() {
    if (!isAuthenticated()) {
        window.location.href = "index.html";
        return false;
    }

    return true;
}
