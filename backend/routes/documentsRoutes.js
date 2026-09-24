const express = require("express");
const multer = require("multer");

const requireAuth = require("../middleware/authMiddleware");

const {
    uploadDocument,
    listDocuments,
    getDocumentStats,
    downloadDocument,
    deleteDocument
} = require("../controllers/documentsController");

const router = express.Router();

// ==========================================
// MULTER - STORE FILE IN MEMORY
// ==========================================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

// ==========================================
// ALL DOCUMENT ROUTES REQUIRE LOGIN
// ==========================================

router.use(requireAuth);

// ==========================================
// UPLOAD
// ==========================================

router.post(
    "/upload",
    upload.single("file"),
    uploadDocument
);

// ==========================================
// LIST DOCUMENTS
// ==========================================

router.get(
    "/",
    listDocuments
);

// ==========================================
// STORAGE STATS
// ==========================================

router.get(
    "/stats",
    getDocumentStats
);

// ==========================================
// DOWNLOAD
// ==========================================

router.get(
    "/download",
    downloadDocument
);

// ==========================================
// DELETE
// ==========================================

router.delete(
    "/",
    deleteDocument
);

module.exports = router;