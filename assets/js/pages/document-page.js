import {
    fetchPublishedDocuments,
    getFirebaseDocumentErrorMessage,
    resolveDocumentDownloadUrl
} from "../document-service.js?v=20260530-documents";

export async function renderDocumentPage({ type, year, containerId = "document-container", emptyId = "document-empty" }) {
    const container = document.getElementById(containerId);
    const empty = document.getElementById(emptyId);

    if (!container) return;

    container.innerHTML = `<div class="col-12 text-center text-muted py-5">문서를 불러오는 중입니다.</div>`;
    empty?.classList.add("d-none");

    try {
        const documents = await fetchPublishedDocuments({ type, year });
        const items = await Promise.all(documents.map(async item => ({
            ...item,
            downloadUrl: await resolveDocumentDownloadUrl(item)
        })));

        renderDocumentCards(container, empty, items);
    } catch (error) {
        console.error("Document page load failed:", error);
        renderDocumentCards(container, empty, []);
        showInlineMessage(container, `Firebase 문서를 불러오지 못했습니다. ${getFirebaseDocumentErrorMessage(error)}`);
    }
}

function renderDocumentCards(container, empty, items) {
    if (items.length === 0) {
        container.innerHTML = "";
        empty?.classList.remove("d-none");
        return;
    }

    empty?.classList.add("d-none");
    container.innerHTML = items.map(item => {
        const badgeClass = item.isImportant ? "bg-danger" : "bg-light text-dark border";
        const iconClass = getFileIconClass(item);

        return `
            <div class="col-12 mb-3">
                <div class="card border-0 shadow-sm transition-card">
                    <div class="card-body p-4">
                        <div class="row align-items-center">
                            <div class="col-md-2 text-center border-end-md">
                                <div class="text-primary fw-bold">${escapeHtml(formatDisplayDate(item.date))}</div>
                                <span class="badge ${badgeClass} mt-1">
                                    ${escapeHtml(item.category || "문서")}
                                </span>
                            </div>
                            <div class="col-md-7 py-2 py-md-0">
                                <h5 class="fw-bold mb-1 ms-md-3">${escapeHtml(item.title)}</h5>
                                <p class="text-muted small mb-0 ms-md-3">${escapeHtml(item.fileName || "")}</p>
                            </div>
                            <div class="col-md-3 text-md-end">
                                <a href="${escapeHtml(item.downloadUrl)}" class="btn btn-primary rounded-pill px-4 fw-bold w-100 w-md-auto" download target="_blank" rel="noopener">
                                    <i class="bi ${iconClass} me-1"></i> 다운로드
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function showInlineMessage(container, text) {
    container.insertAdjacentHTML("afterbegin", `
        <div class="col-12">
            <div class="alert alert-warning small">${escapeHtml(text)}</div>
        </div>
    `);
}

function getFileIconClass(item) {
    const fileName = String(item.fileName || "").toLowerCase();
    const contentType = String(item.contentType || "").toLowerCase();

    if (fileName.endsWith(".doc") || fileName.endsWith(".docx") || contentType.includes("word")) {
        return "bi-file-earmark-word";
    }

    return "bi-file-earmark-pdf";
}

function formatDisplayDate(value) {
    const parts = String(value || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);

    if (!parts) return value || "";

    return `${parts[1]}. ${String(parts[2]).padStart(2, "0")}. ${String(parts[3]).padStart(2, "0")}.`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
