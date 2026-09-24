const supabase = require("../config/supabase");

const redirectUrl =
    process.env.AUTH_REDIRECT_URL ||
    "http://127.0.0.1:5500/frontend/index.html";

// ==========================================
// REGISTER
// ==========================================
const register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const cleanName = fullName.trim();
        const cleanEmail = email.trim().toLowerCase();

        const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
                data: {
                    full_name: cleanName
                },
                emailRedirectTo: redirectUrl
            }
        });

        if (error) {
            console.error("Register error:", error.message);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(201).json({
            success: true,
            message:
                "Registration successful. Please verify your email.",
            user: data.user
                ? {
                      id: data.user.id,
                      email: data.user.email,
                      fullName:
                          data.user.user_metadata?.full_name ||
                          cleanName,
                      emailVerified:
                          !!data.user.email_confirmed_at
                  }
                : null,
            session: data.session || null
        });
    } catch (error) {
        console.error("Register server error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};

// ==========================================
// VERIFY SIGNUP OTP
// ==========================================
const verifyOtp = async (req, res) => {
    try {
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanToken = String(token).trim();

        const { data, error } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: "signup"
        });

        if (error) {
            console.error(
                "OTP verification error:",
                error.message
            );

            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        return res.json({
            success: true,
            message: "Email verified successfully",
            user: data.user
                ? {
                      id: data.user.id,
                      email: data.user.email,
                      fullName:
                          data.user.user_metadata?.full_name || ""
                  }
                : null,
            session: data.session || null
        });
    } catch (error) {
        console.error("OTP server error:", error);

        return res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });
    }
};

// ==========================================
// RESEND OTP
// ==========================================
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const { error } = await supabase.auth.resend({
            type: "signup",
            email: cleanEmail
        });

        if (error) {
            console.error("Resend error:", error.message);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.json({
            success: true,
            message: "Verification email sent again"
        });
    } catch (error) {
        console.error("Resend server error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to resend verification email"
        });
    }
};

// ==========================================
// LOGIN
// ==========================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const { data, error } =
            await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password
            });

        if (error) {
            console.error("Login error:", error.message);

            return res.status(401).json({
                success: false,
                message: error.message
            });
        }

        return res.json({
            success: true,
            message: "Login successful",
            user: data.user
                ? {
                      id: data.user.id,
                      email: data.user.email,
                      fullName:
                          data.user.user_metadata?.full_name || "",
                      emailVerified:
                          !!data.user.email_confirmed_at
                  }
                : null,
            session: data.session || null
        });
    } catch (error) {
        console.error("Login server error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const { error } =
            await supabase.auth.resetPasswordForEmail(
                cleanEmail,
                {
                    redirectTo: redirectUrl
                }
            );

        if (error) {
            console.error(
                "Forgot password error:",
                error.message
            );

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.json({
            success: true,
            message:
                "If the email exists, a password reset email has been sent."
        });
    } catch (error) {
        console.error(
            "Forgot password server error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to process password reset"
        });
    }
};

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
    register,
    verifyOtp,
    resendOtp,
    login,
    forgotPassword
};