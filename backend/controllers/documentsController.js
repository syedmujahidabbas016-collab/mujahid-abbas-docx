const supabase = require("../config/supabase");

const BUCKET_NAME = "documents";

// ==========================================
// SAFE FILE NAME
// ==========================================

function safeFileName(fileName) {
    return fileName
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_")
        .substring(0, 180);
}

// ==========================================
// UPLOAD DOCUMENT
// ==========================================

const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a file"
            });
        }

        const userId = req.user.id;
        const originalName = req.file.originalname;
        const safeName = safeFileName(originalName);

        const filePath =
            `${userId}/${Date.now()}-${safeName}`;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, req.file.buffer, {
                contentType:
                    req.file.mimetype ||
                    "application/octet-stream",

                upsert: false
            });

        if (error) {
            console.error(
                "Supabase upload error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message: "File upload failed"
            });
        }

        return res.status(201).json({
            success: true,
            message: "File uploaded successfully",
            document: {
                name: originalName,
                path: filePath,
                size: req.file.size,
                type:
                    req.file.mimetype ||
                    "application/octet-stream",
                createdAt:
                    new Date().toISOString()
            }
        });
    } catch (error) {
        console.error(
            "Upload controller error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to upload document"
        });
    }
};

// ==========================================
// LIST USER DOCUMENTS
// ==========================================

const listDocuments = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list(userId, {
                limit: 100,
                sortBy: {
                    column: "created_at",
                    order: "desc"
                }
            });

        if (error) {
            console.error(
                "Supabase list error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load documents"
            });
        }

        const documents = (data || [])
            .filter((file) => file.name)
            .map((file) => ({
                id: `${userId}/${file.name}`,
                name: file.name.replace(
                    /^\d+-/,
                    ""
                ),
                path: `${userId}/${file.name}`,
                size:
                    file.metadata?.size ||
                    0,
                type:
                    file.metadata?.mimetype ||
                    file.metadata?.contentType ||
                    "application/octet-stream",
                createdAt:
                    file.created_at ||
                    file.updated_at ||
                    null,
                updatedAt:
                    file.updated_at ||
                    null
            }));

        return res.json({
            success: true,
            documents
        });
    } catch (error) {
        console.error(
            "List documents error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load documents"
        });
    }
};

// ==========================================
// STORAGE STATS
// ==========================================

const getDocumentStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list(userId, {
                limit: 1000
            });

        if (error) {
            throw error;
        }

        const files = (data || []).filter(
            (file) => file.name
        );

        const totalFiles = files.length;

        const storageUsed =
            files.reduce(
                (total, file) =>
                    total +
                    Number(
                        file.metadata?.size ||
                        0
                    ),
                0
            );

        return res.json({
            success: true,
            stats: {
                totalFiles,
                storageUsed,
                storageUsedGB: (
                    storageUsed /
                    (1024 * 1024 * 1024)
                ).toFixed(2),

                availableGB: 64
            }
        });
    } catch (error) {
        console.error(
            "Stats error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load storage statistics"
        });
    }
};

// ==========================================
// DOWNLOAD DOCUMENT
// ==========================================

const downloadDocument = async (req, res) => {
    try {
        const userId = req.user.id;
        const fileName = req.query.file;

        if (!fileName) {
            return res.status(400).json({
                success: false,
                message: "File path is required"
            });
        }

        if (!fileName.startsWith(`${userId}/`)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const { data, error } =
            await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(
                    fileName,
                    60
                );

        if (error) {
            console.error(
                "Signed URL error:",
                error.message
            );

            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        return res.json({
            success: true,
            url: data.signedUrl
        });
    } catch (error) {
        console.error(
            "Download error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to download document"
        });
    }
};

// ==========================================
// DELETE DOCUMENT
// ==========================================

const deleteDocument = async (req, res) => {
    try {
        const userId = req.user.id;
        const { path } = req.body;

        if (!path) {
            return res.status(400).json({
                success: false,
                message: "File path is required"
            });
        }

        if (!path.startsWith(`${userId}/`)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const { error } =
            await supabase.storage
                .from(BUCKET_NAME)
                .remove([path]);

        if (error) {
            console.error(
                "Delete error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message: "Unable to delete document"
            });
        }

        return res.json({
            success: true,
            message: "Document deleted successfully"
        });
    } catch (error) {
        console.error(
            "Delete document error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to delete document"
        });
    }
};

module.exports = {
    uploadDocument,
    listDocuments,
    getDocumentStats,
    downloadDocument,
    deleteDocument
};