const supabase = require("../config/supabase");

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required"
            });
        }

        const token = authHeader.substring(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required"
            });
        }

        const {
            data: { user },
            error
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token"
            });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error(
            "Authentication middleware error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

module.exports = requireAuth;