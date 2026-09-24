// ==========================================
// MUJAHID ABBAS DOCX - DOCUMENTS
// CLEAN UPLOAD VERSION
// ==========================================

let documents = [];
let currentFilter = "all";
let searchTerm = "";
let currentView = "grid";

// ==========================================
// START
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeDocumentsPage();
});

async function initializeDocumentsPage() {
    forceCloseModals();

    if (
        typeof requireAuthentication === "function" &&
        !requireAuthentication()
    ) {
        return;
    }

    setupUploadButtons();
    setupSearch();
    setupFilters();
    setupLogout();
    setupViewButtons();
    setupModalButtons();

    await loadDocuments();

    hideLoader();
}

// ==========================================
// UPLOAD BUTTONS
// ==========================================

function setupUploadButtons() {
    document.addEventListener("click", (event) => {
        const button = event.target.closest("button, a, div");

        if (!button) return;

        const text = button.textContent
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();

        if (
            text === "upload files" ||
            text === "choose files" ||
            text.includes("upload your first file") ||
            text.includes("drop files here") ||
            text.includes("click to browse")
        ) {
            event.preventDefault();
            event.stopPropagation();

            openFilePicker();
        }
    });
}

// ==========================================
// NATIVE FILE PICKER
// ==========================================

function openFilePicker() {
    const input = document.createElement("input");

    input.type = "file";

    input.accept =
        ".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx";

    input.style.position = "fixed";
    input.style.left = "-10000px";
    input.style.top = "-10000px";

    document.body.appendChild(input);

    input.addEventListener("change", async () => {
        const file = input.files?.[0];

        if (!file) {
            input.remove();
            return;
        }

        console.log("Selected file:", file.name);

        await uploadSelectedFile(file);

        input.remove();
    });

    input.click();
}

// ==========================================
// REAL UPLOAD
// ==========================================

async function uploadSelectedFile(file) {
    if (file.size > 50 * 1024 * 1024) {
        alert("File size must be 50 MB or less.");
        return;
    }

    showUploadMessage(
        `Uploading ${file.name}...`
    );

    try {
        const token =
            localStorage.getItem(
                "mujahid_auth_token"
            );

        if (!token) {
            throw new Error(
                "Login session expired. Please sign in again."
            );
        }

        const formData = new FormData();

        formData.append(
            "file",
            file
        );

        const response = await fetch(
            "http://localhost:5000/api/documents/upload",
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                },

                body: formData
            }
        );

        const result =
            await response.json();

        console.log(
            "Upload response:",
            result
        );

        if (!response.ok) {
            throw new Error(
                result.message ||
                    "Upload failed"
            );
        }

        if (!result.success) {
            throw new Error(
                result.message ||
                    "Upload failed"
            );
        }

        forceCloseModals();

        showUploadSuccess(
            `${file.name} uploaded successfully.`
        );

        await loadDocuments();
    } catch (error) {
        console.error(
            "UPLOAD ERROR:",
            error
        );

        alert(
            error.message ||
                "File upload failed."
        );

        forceCloseModals();
    }
}

// ==========================================
// LOAD DOCUMENTS
// ==========================================

async function loadDocuments() {
    try {
        const result =
            await apiGet(
                "/documents"
            );

        if (
            !result ||
            !result.success
        ) {
            throw new Error(
                result?.message ||
                    "Unable to load documents"
            );
        }

        documents =
            Array.isArray(
                result.documents
            )
                ? result.documents
                : [];

        renderDocuments();

        await loadStats();
    } catch (error) {
        console.error(
            "Load documents error:",
            error
        );

        documents = [];

        renderDocuments();
    }
}

// ==========================================
// STATS
// ==========================================

async function loadStats() {
    try {
        const result =
            await apiGet(
                "/documents/stats"
            );

        if (
            !result ||
            !result.success ||
            !result.stats
        ) {
            return;
        }

        const stats =
            result.stats;

        updateElements(
            [
                "#totalFiles",
                "[data-total-files]",
                ".total-files"
            ],
            String(
                stats.totalFiles || 0
            )
        );

        updateElements(
            [
                "#storageUsed",
                "[data-storage-used]",
                ".storage-used"
            ],
            `${Number(
                stats.storageUsedGB || 0
            ).toFixed(2)} GB`
        );

        updateElements(
            [
                "#availableStorage",
                "[data-available-storage]",
                ".available-storage"
            ],
            `${stats.availableGB || 64} GB`
        );

        updateElements(
            [
                "#storageText",
                "[data-storage-text]",
                ".storage-text"
            ],
            `${Number(
                stats.storageUsedGB || 0
            ).toFixed(2)} GB of ${
                stats.availableGB || 64
            } GB`
        );

        const percentage =
            Math.min(
                (
                    Number(
                        stats.storageUsedGB || 0
                    ) /
                    Number(
                        stats.availableGB || 64
                    )
                ) * 100,
                100
            );

        document
            .querySelectorAll(
                "#storageProgress, [data-storage-progress], .storage-progress-bar"
            )
            .forEach((element) => {
                element.style.width =
                    `${percentage}%`;
            });
    } catch (error) {
        console.warn(
            "Stats error:",
            error.message
        );
    }
}

// ==========================================
// RENDER DOCUMENTS
// ==========================================

function renderDocuments() {
    const container =
        getDocumentsContainer();

    if (!container) {
        return;
    }

    const filtered =
        getFilteredDocuments();

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-documents">
                <div class="empty-documents-icon">
                    📂
                </div>

                <h3>
                    No documents yet
                </h3>

                <p>
                    Your uploaded files will appear here.
                </p>

                <button
                    type="button"
                    class="auth-button"
                    id="emptyUploadButton"
                >
                    Upload Your First File
                </button>
            </div>
        `;

        updateFileCount(0);

        const button =
            document.getElementById(
                "emptyUploadButton"
            );

        if (button) {
            button.addEventListener(
                "click",
                openFilePicker
            );
        }

        return;
    }

    container.innerHTML =
        filtered
            .map(
                createDocumentCard
            )
            .join("");

    updateFileCount(
        filtered.length
    );

    setupDocumentActions();

    applyView();
}

// ==========================================
// FILTER
// ==========================================

function getFilteredDocuments() {
    let result =
        [...documents];

    if (
        currentFilter ===
        "recent"
    ) {
        result.sort(
            (a, b) =>
                new Date(
                    b.createdAt || 0
                ) -
                new Date(
                    a.createdAt || 0
                )
        );

        result =
            result.slice(
                0,
                10
            );
    }

    if (
        currentFilter ===
        "pdf"
    ) {
        result =
            result.filter(
                (item) =>
                    String(
                        item.type || ""
                    )
                        .toLowerCase()
                        .includes("pdf")
            );
    }

    if (
        currentFilter ===
        "image"
    ) {
        result =
            result.filter(
                (item) =>
                    String(
                        item.type || ""
                    )
                        .toLowerCase()
                        .startsWith(
                            "image/"
                        )
            );
    }

    if (
        currentFilter ===
        "document"
    ) {
        result =
            result.filter(
                (item) => {
                    const name =
                        String(
                            item.name || ""
                        )
                            .toLowerCase();

                    const type =
                        String(
                            item.type || ""
                        )
                            .toLowerCase();

                    return (
                        type.includes(
                            "word"
                        ) ||
                        type.includes(
                            "document"
                        ) ||
                        name.endsWith(
                            ".doc"
                        ) ||
                        name.endsWith(
                            ".docx"
                        )
                    );
                }
            );
    }

    if (searchTerm) {
        result =
            result.filter(
                (item) =>
                    String(
                        item.name || ""
                    )
                        .toLowerCase()
                        .includes(
                            searchTerm
                        )
            );
    }

    return result;
}

// ==========================================
// DOCUMENT CARD
// ==========================================

function createDocumentCard(
    item
) {
    const path =
        escapeHTML(
            item.path || ""
        );

    const name =
        escapeHTML(
            item.name ||
                "Unnamed file"
        );

    const type =
        String(
            item.type || ""
        ).toLowerCase();

    return `
        <article
            class="document-card"
            data-path="${path}"
        >

            <div class="document-icon">
                ${getFileIcon(
                    type,
                    name
                )}
            </div>

            <div class="document-info">

                <h3
                    class="document-name"
                    title="${name}"
                >
                    ${name}
                </h3>

                <p class="document-meta">
                    ${formatBytes(
                        Number(
                            item.size || 0
                        )
                    )}
                    •
                    ${formatDate(
                        item.createdAt
                    )}
                </p>

            </div>

            <div class="document-actions">

                <button
                    type="button"
                    data-action="download"
                    data-path="${path}"
                    class="document-action"
                    title="Download"
                >
                    ↓
                </button>

                <button
                    type="button"
                    data-action="delete"
                    data-path="${path}"
                    class="document-action"
                    title="Delete"
                >
                    🗑
                </button>

            </div>

        </article>
    `;
}

// ==========================================
// DOCUMENT ACTIONS
// ==========================================

function setupDocumentActions() {
    document
        .querySelectorAll(
            '[data-action="download"]'
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () =>
                    downloadDocument(
                        button.dataset.path
                    )
            );
        });

    document
        .querySelectorAll(
            '[data-action="delete"]'
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () =>
                    openDeleteModal(
                        button.dataset.path
                    )
            );
        });
}

// ==========================================
// DOWNLOAD
// ==========================================

async function downloadDocument(
    path
) {
    try {
        const result =
            await apiGet(
                `/documents/download?file=${encodeURIComponent(
                    path
                )}`
            );

        if (
            !result ||
            !result.success
        ) {
            throw new Error(
                result?.message ||
                    "Download failed"
            );
        }

        window.open(
            result.url,
            "_blank"
        );
    } catch (error) {
        console.error(
            "Download error:",
            error
        );

        alert(
            error.message ||
                "Unable to download file."
        );
    }
}

// ==========================================
// DELETE
// ==========================================

function setupModalButtons() {
    document
        .querySelectorAll(
            "#closeDeleteModal, [data-close='delete'], .close-delete-modal"
        )
        .forEach((button) => {
            button.onclick = () => {
                closeDeleteModal();
            };
        });

    const confirmButton =
        document.getElementById(
            "confirmDeleteBtn"
        );

    if (confirmButton) {
        confirmButton.onclick =
            confirmDelete;
    }
}

function openDeleteModal(
    path
) {
    deleteTargetPath =
        path;

    const modal =
        document.getElementById(
            "deleteModal"
        );

    if (!modal) {
        if (
            window.confirm(
                "Are you sure you want to permanently delete this file?"
            )
        ) {
            confirmDelete();
        }

        return;
    }

    modal.classList.add(
        "active"
    );

    modal.style.setProperty(
        "display",
        "flex",
        "important"
    );

    modal.style.setProperty(
        "visibility",
        "visible",
        "important"
    );

    modal.style.setProperty(
        "opacity",
        "1",
        "important"
    );

    modal.style.setProperty(
        "pointer-events",
        "auto",
        "important"
    );
}

function closeDeleteModal() {
    const modal =
        document.getElementById(
            "deleteModal"
        );

    if (modal) {
        modal.classList.remove(
            "active",
            "open",
            "show"
        );

        modal.style.setProperty(
            "display",
            "none",
            "important"
        );

        modal.style.setProperty(
            "visibility",
            "hidden",
            "important"
        );

        modal.style.setProperty(
            "opacity",
            "0",
            "important"
        );

        modal.style.setProperty(
            "pointer-events",
            "none",
            "important"
        );
    }

    deleteTargetPath =
        null;
}

let deleteTargetPath = null;

async function confirmDelete() {
    if (!deleteTargetPath) {
        closeDeleteModal();
        return;
    }

    const path =
        deleteTargetPath;

    try {
        const result =
            await apiRequest(
                "/documents",
                {
                    method: "DELETE",
                    body: JSON.stringify({
                        path
                    })
                }
            );

        if (
            !result ||
            !result.success
        ) {
            throw new Error(
                result?.message ||
                    "Delete failed"
            );
        }

        closeDeleteModal();

        showUploadSuccess(
            "Document deleted successfully."
        );

        await loadDocuments();
    } catch (error) {
        console.error(
            "Delete error:",
            error
        );

        alert(
            error.message ||
                "Unable to delete document."
        );
    }
}

// ==========================================
// SEARCH
// ==========================================

function setupSearch() {
    document
        .querySelectorAll(
            "#searchInput, .search-input, [data-search]"
        )
        .forEach((input) => {
            input.addEventListener(
                "input",
                () => {
                    searchTerm =
                        input.value
                            .trim()
                            .toLowerCase();

                    renderDocuments();
                }
            );
        });
}

// ==========================================
// FILTERS
// ==========================================

function setupFilters() {
    document
        .querySelectorAll(
            "#filterSelect, .filter-select, [data-filter]"
        )
        .forEach((select) => {
            select.addEventListener(
                "change",
                () => {
                    currentFilter =
                        select.value ||
                        "all";

                    renderDocuments();
                }
            );
        });

    readUrlFilter();
}

function readUrlFilter() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const filter =
        params.get("filter");

    if (
        filter === "recent"
    ) {
        currentFilter =
            "recent";
    } else if (
        filter === "images"
    ) {
        currentFilter =
            "image";
    } else if (
        filter === "pdf"
    ) {
        currentFilter =
            "pdf";
    } else if (
        filter === "docx"
    ) {
        currentFilter =
            "document";
    }
}

// ==========================================
// VIEW
// ==========================================

function setupViewButtons() {
    document
        .querySelectorAll(
            "#gridViewBtn, [data-view='grid'], .grid-view-btn"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    currentView =
                        "grid";

                    applyView();
                }
            );
        });

    document
        .querySelectorAll(
            "#listViewBtn, [data-view='list'], .list-view-btn"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    currentView =
                        "list";

                    applyView();
                }
            );
        });
}

function applyView() {
    const container =
        getDocumentsContainer();

    if (!container) return;

    container.classList.toggle(
        "grid-view",
        currentView ===
            "grid"
    );

    container.classList.toggle(
        "list-view",
        currentView ===
            "list"
    );
}

// ==========================================
// LOGOUT
// ==========================================

function setupLogout() {
    document
        .querySelectorAll(
            "#logoutBtn, .logout-btn, [data-action='logout']"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    if (
                        typeof logoutUser ===
                        "function"
                    ) {
                        logoutUser();
                    } else {
                        localStorage.clear();

                        window.location.href =
                            "index.html";
                    }
                }
            );
        });
}

// ==========================================
// CONTAINER
// ==========================================

function getDocumentsContainer() {
    return (
        document.getElementById(
            "documentsGrid"
        ) ||
        document.getElementById(
            "documentsContainer"
        ) ||
        document.querySelector(
            ".documents-grid"
        ) ||
        document.querySelector(
            ".documents-container"
        )
    );
}

// ==========================================
// FILE ICON
// ==========================================

function getFileIcon(
    type,
    name
) {
    const lowerName =
        String(
            name || ""
        ).toLowerCase();

    if (
        type.includes("pdf") ||
        lowerName.endsWith(".pdf")
    ) {
        return "📕";
    }

    if (
        type.includes("word") ||
        lowerName.endsWith(".doc") ||
        lowerName.endsWith(".docx")
    ) {
        return "📘";
    }

    if (
        type.startsWith(
            "image/"
        )
    ) {
        return "🖼️";
    }

    if (
        type.includes("sheet") ||
        lowerName.endsWith(".xls") ||
        lowerName.endsWith(".xlsx")
    ) {
        return "📗";
    }

    return "📄";
}

// ==========================================
// HELPERS
// ==========================================

function updateElements(
    selectors,
    value
) {
    selectors.forEach(
        (selector) => {
            document
                .querySelectorAll(
                    selector
                )
                .forEach(
                    (element) => {
                        element.textContent =
                            value;
                    }
                );
        }
    );
}

function updateFileCount(
    count
) {
    updateElements(
        [
            "#totalFiles",
            "[data-total-files]",
            ".total-files"
        ],
        String(count)
    );

    updateElements(
        [
            "#documentsCount",
            ".documents-count"
        ],
        `${count} ${
            count === 1
                ? "file"
                : "files"
        }`
    );
}

function formatBytes(
    bytes
) {
    if (
        !bytes ||
        bytes <= 0
    ) {
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

    return `${(
        bytes /
        Math.pow(
            1024,
            index
        )
    ).toFixed(
        index === 0 ? 0 : 2
    )} ${
        units[
            Math.min(
                index,
                units.length - 1
            )
        ]
    }`;
}

function formatDate(
    value
) {
    if (!value) {
        return "Recently";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Recently";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function escapeHTML(
    value
) {
    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

// ==========================================
// MESSAGES
// ==========================================

function showUploadMessage(
    message
) {
    let element =
        document.getElementById(
            "uploadStatusMessage"
        );

    if (!element) {
        element =
            document.createElement(
                "div"
            );

        element.id =
            "uploadStatusMessage";

        element.style.position =
            "fixed";

        element.style.top =
            "20px";

        element.style.right =
            "20px";

        element.style.zIndex =
            "99999";

        element.style.padding =
            "14px 18px";

        element.style.background =
            "#111";

        element.style.color =
            "#fff";

        element.style.borderRadius =
            "10px";

        document.body.appendChild(
            element
        );
    }

    element.textContent =
        message;

    element.style.display =
        "block";
}

function showUploadSuccess(
    message
) {
    let element =
        document.getElementById(
            "uploadStatusMessage"
        );

    if (!element) {
        element =
            document.createElement(
                "div"
            );

        element.id =
            "uploadStatusMessage";

        element.style.position =
            "fixed";

        element.style.top =
            "20px";

        element.style.right =
            "20px";

        element.style.zIndex =
            "99999";

        element.style.padding =
            "14px 18px";

        element.style.borderRadius =
            "10px";

        document.body.appendChild(
            element
        );
    }

    element.textContent =
        message;

    element.style.display =
        "block";

    element.style.background =
        "#16794a";

    element.style.color =
        "#fff";

    setTimeout(() => {
        element.style.display =
            "none";
    }, 4000);
}

// ==========================================
// FORCE CLOSE MODALS
// ==========================================

function forceCloseModals() {
    document
        .querySelectorAll(
            "#uploadModal, #deleteModal, #previewModal"
        )
        .forEach((modal) => {
            modal.classList.remove(
                "active",
                "open",
                "show"
            );

            modal.style.setProperty(
                "display",
                "none",
                "important"
            );

            modal.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            modal.style.setProperty(
                "opacity",
                "0",
                "important"
            );

            modal.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );
        });
}

// ==========================================
// LOADER
// ==========================================

function hideLoader() {
    const loader =
        document.getElementById(
            "pageLoader"
        );

    if (!loader) return;

    loader.classList.add(
        "hidden"
    );

    loader.style.setProperty(
        "display",
        "none",
        "important"
    );

    loader.style.setProperty(
        "visibility",
        "hidden",
        "important"
    );
}