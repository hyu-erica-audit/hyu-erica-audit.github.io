import {
    fetchPublishedDocuments,
    getFirebaseDocumentErrorMessage
} from "../document-service.js";
import { getFileIconClass } from "../file-icons.js";
import { escapeHtml } from "../text-utils.js";
import { resolveDocumentDownloads } from "./document-page.js";

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("report-container");

    if (!container) return;

    container.innerHTML = `<div class="col-12 text-center text-muted py-5">서식을 불러오는 중입니다.</div>`;

    try {
        const forms = await fetchPublishedDocuments({ type: "form" });
        const items = await resolveDocumentDownloads(forms);

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
                    ${renderFormDownloadAction(item)}
                </div>
            </div>
        </div>
    `).join("");
}

function renderFormDownloadAction(item) {
    if (!item.isDownloadAvailable) {
        return `
            <span class="btn btn-outline-secondary w-100 rounded-pill fw-bold disabled" aria-disabled="true">
                <i class="bi bi-exclamation-circle me-2"></i> 파일 이용 불가
            </span>
        `;
    }

    return `
        <a href="${escapeHtml(item.downloadUrl)}" class="btn btn-outline-dark w-100 rounded-pill fw-bold" download target="_blank" rel="noopener">
            <i class="bi bi-download me-2"></i> 다운로드
        </a>
    `;
}
