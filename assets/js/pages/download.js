import {
    fetchPublishedDocuments,
    getFirebaseDocumentErrorMessage,
    resolveDocumentDownloadUrl
} from "../document-service.js?v=20260530-form-icon";

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("report-container");

    if (!container) return;

    container.innerHTML = `<div class="col-12 text-center text-muted py-5">서식을 불러오는 중입니다.</div>`;

    try {
        const forms = await fetchPublishedDocuments({ type: "form" });
        const items = await Promise.all(forms.map(async item => ({
            ...item,
            downloadUrl: await resolveDocumentDownloadUrl(item)
        })));

        renderForms(container, items);
    } catch (error) {
        console.error("Form documents load failed:", error);
        container.innerHTML = `<div class="col-12"><div class="alert alert-warning small">서식을 불러오지 못했습니다. ${escapeHtml(getFirebaseDocumentErrorMessage(error))}</div></div>`;
    }
});

function renderForms(container, items) {
    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-folder-x text-secondary" style="font-size: 3rem;"></i>
                <p class="mt-3 text-muted">등록된 서식이 없습니다.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="col">
            <div class="card h-100 border-0 shadow-sm transition-card">
                <div class="card-body p-5 text-center">
                    <div class="mb-3">
                        <i class="bi ${getFileIconClass(item)} text-primary" style="font-size: 3rem;"></i>
                    </div>
                    <h5 class="fw-bold mb-4">${escapeHtml(item.title)}</h5>
                    <a href="${escapeHtml(item.downloadUrl)}" class="btn btn-outline-dark w-100 rounded-pill fw-bold" download target="_blank" rel="noopener">
                        <i class="bi bi-download me-2"></i> 다운로드
                    </a>
                </div>
            </div>
        </div>
    `).join("");
}

function getFileIconClass(item) {
    const icon = String(item.icon || "");
    const allowedIcons = new Set([
        "bi-file-earmark-text",
        "bi-card-checklist",
        "bi-receipt",
        "bi-clipboard-check",
        "bi-folder-check",
        "bi-file-earmark-word",
        "bi-file-earmark-pdf",
        "bi-bus-front",
        "bi-car-front",
        "bi-taxi-front",
        "bi-fuel-pump",
        "bi-cart"
    ]);

    if (allowedIcons.has(icon)) return icon;

    const fileName = String(item.fileName || "").toLowerCase();
    const contentType = String(item.contentType || "").toLowerCase();

    if (fileName.endsWith(".pdf") || contentType.includes("pdf")) return "bi-file-earmark-pdf";
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx") || contentType.includes("word")) return "bi-file-earmark-word";

    return "bi-file-earmark-arrow-down";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
