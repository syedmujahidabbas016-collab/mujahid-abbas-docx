const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const supabase = require("./config/supabase");

const authRoutes = require("./routes/authRoutes");
const documentsRoutes = require("./routes/documentsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// CORS
// ==========================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json());
app.use(
    express.urlencoded({
        extended: true
    })
);

// ==========================================
// REQUEST LOGGER
// ==========================================

app.use((req, res, next) => {
    console.log(
        `${req.method} ${req.originalUrl}`
    );

    next();
});

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message:
            "MUJAHID ABBAS DOCX API is running",
        version: "1.0.0"
    });
});

// ==========================================
// HEALTH + SUPABASE TEST
// ==========================================

app.get("/api/health", async (req, res) => {
    try {
        const { error } =
            await supabase.storage
                .from("documents")
                .list("", {
                    limit: 1
                });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message:
                "Backend and Supabase connected successfully",
            storage: "documents"
        });
    } catch (error) {
        console.error(
            "Supabase connection error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Supabase connection failed"
        });
    }
});

// ==========================================
// AUTH ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);

// ==========================================
// DOCUMENT ROUTES
// ==========================================

app.use(
    "/api/documents",
    documentsRoutes
);

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
    console.log(
        `404 - ${req.method} ${req.originalUrl}`
    );

    res.status(404).json({
        success: false,
        message:
            "API route not found"
    });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use(
    (err, req, res, next) => {
        console.error(
            "Server Error:",
            err
        );

        res.status(500).json({
            success: false,
            message:
                "Internal server error"
        });
    }
);

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(
        "===================================="
    );

    console.log(
        "MUJAHID ABBAS DOCX BACKEND"
    );

    console.log(
        "===================================="
    );

    console.log(
        `Server running on port ${PORT}`
    );

    console.log(
        `http://localhost:${PORT}`
    );

    console.log(
        "===================================="
    );
});