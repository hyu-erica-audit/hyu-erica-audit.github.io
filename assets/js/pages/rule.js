import {
    fetchPublishedDocuments,
    getFirebaseDocumentErrorMessage
} from "../document-service.js";
import { formatDisplayDate } from "../date-utils.js";
import { escapeHtml } from "../text-utils.js";
import { resolveDocumentDownloads } from "./document-page.js";

const RULE_SLOTS = ["중앙감사 세칙", "감사 시행 별칙"];

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("rule-container");

    if (!container) return;

    container.innerHTML = `<div class="col-12 text-center text-muted py-5">세칙을 불러오는 중입니다.</div>`;

    try {
        const rules = await fetchPublishedDocuments({ type: "rule" });
        const items = await resolveDocumentDownloads(rules);

        renderRules(container, items);
    } catch (error) {
        console.error("Rule documents load failed:", error);
        container.innerHTML = `<div class="col-12"><div class="alert alert-warning small">세칙을 불러오지 못했습니다. ${escapeHtml(getFirebaseDocumentErrorMessage(error))}</div></div>`;
    }
});

function renderRules(container, items) {
    const slotItems = RULE_SLOTS
        .map(category => items.find(item => item.category === category))
        .filter(Boolean);

    if (slotItems.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-folder-x text-secondary" style="font-size: 3rem;"></i>
                <p class="mt-3 text-muted">등록된 세칙이 없습니다.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = slotItems.map(item => {
        const card = getRuleCardStyle(item);

        return `
            <div class="col-md-6 col-lg-5">
                <div class="card h-100 border-0 shadow-sm hover-shadow transition-card">
                    <div class="card-body p-5 text-center">
                        <div class="mb-4">
                            <i class="bi ${card.icon} ${card.iconColor}" style="font-size: 4rem;"></i>
                        </div>
                        <h3 class="fw-bold mb-2">${escapeHtml(item.title)}</h3>
                        <p class="text-muted mb-4">
                            ${escapeHtml(item.subtitle || item.category || "세칙")}<br>
                            <span class="badge bg-secondary mt-2">${escapeHtml(formatDisplayDate(item.date))}</span>
                        </p>
                        ${item.description ? `<p class="card-text text-secondary mb-5 small keep-all rule-description">${escapeHtml(item.description)}</p>` : ""}
                        ${renderRuleDownloadAction(item, card.buttonClass)}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function getRuleCardStyle(item) {
    if (item.category === "감사 시행 별칙") {
        return {
            icon: "bi-book",
            iconColor: "text-dark",
            buttonClass: "btn-outline-dark"
        };
    }

    return {
        icon: "bi-file-earmark-pdf",
        iconColor: "text-primary",
        buttonClass: "btn-primary"
    };
}

function renderRuleDownloadAction(item, buttonClass) {
    if (!item.isDownloadAvailable) {
        return `
            <span class="btn btn-outline-secondary w-100 py-3 rounded-pill fw-bold disabled" aria-disabled="true">
                <i class="bi bi-exclamation-circle me-2"></i> 파일 이용 불가
            </span>
        `;
    }

    return `
        <a href="${escapeHtml(item.downloadUrl)}" class="btn ${buttonClass} w-100 py-3 rounded-pill fw-bold" download target="_blank" rel="noopener">
            <i class="bi bi-download me-2"></i> PDF 다운로드
        </a>
    `;
}
