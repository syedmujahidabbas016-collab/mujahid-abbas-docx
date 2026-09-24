const express = require("express");

const {
    register,
    verifyOtp,
    resendOtp,
    login,
    forgotPassword
} = require("../controllers/authController");

const router = express.Router();

// Register
router.post("/register", register);

// Verify email OTP
router.post("/verify-otp", verifyOtp);

// Resend verification email
router.post("/resend-otp", resendOtp);

// Login
router.post("/login", login);

// Forgot password
router.post("/forgot-password", forgotPassword);

module.exports = router;