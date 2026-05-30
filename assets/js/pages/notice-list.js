import { fetchPublishedNotices } from "../notice-service.js?v=20260530-display-number";

const ITEMS_PER_PAGE = 10;

document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("notice-list-body");
    const totalCountElement = document.getElementById("total-count");
    const paginationWrapper = document.getElementById("pagination-wrapper");

    if (!tableBody || !paginationWrapper) return;

    tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-5 text-muted">공지사항을 불러오는 중입니다.</td></tr>`;

    try {
        const firestoreNotices = await withTimeout(fetchPublishedNotices(), 5000);

        renderNoticeList(firestoreNotices, tableBody, totalCountElement, paginationWrapper);
    } catch (error) {
        console.error("Notice list load failed:", error);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-5 text-danger">공지사항을 불러오지 못했습니다. Firestore 설정을 확인해주세요.</td></tr>`;
        if (totalCountElement) totalCountElement.textContent = "0";
        paginationWrapper.innerHTML = "";
    }
});

function renderNoticeList(notices, tableBody, totalCountElement, paginationWrapper) {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = Math.max(parseInt(urlParams.get("page"), 10) || 1, 1);
    const totalItems = notices.length;
    const totalPages = Math.max(Math.ceil(totalItems / ITEMS_PER_PAGE), 1);
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const currentData = notices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (totalCountElement) {
        totalCountElement.textContent = totalItems;
    }

    if (currentData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-5 text-muted">게시된 공지사항이 없습니다.</td></tr>`;
    } else {
        tableBody.innerHTML = currentData.map((notice, index) => {
            const badgeClass = notice.type === "필독" ? "bg-danger" : "bg-secondary";
            const displayNo = totalItems - (startIndex + index);

            return `
                <tr>
                    <td class="text-center text-muted d-none d-md-table-cell">${displayNo}</td>
                    <td>
                        <a href="/pages/notice/view.html?id=${encodeURIComponent(notice.id)}" class="text-decoration-none text-dark fw-bold">
                            <span class="badge ${badgeClass} me-2">${escapeHtml(notice.type)}</span>
                            ${escapeHtml(notice.title)}
                        </a>
                    </td>
                    <td class="text-center text-muted d-none d-md-table-cell">${escapeHtml(notice.author)}</td>
                    <td class="text-center text-muted d-none d-md-table-cell">${escapeHtml(notice.date)}</td>
                </tr>
            `;
        }).join("");
    }

    renderPagination(totalPages, safeCurrentPage, paginationWrapper);
}

function renderPagination(totalPages, currentPage, paginationWrapper) {
    const prevDisabled = currentPage === 1 ? "disabled" : "";
    const nextDisabled = currentPage === totalPages ? "disabled" : "";
    let html = `
        <li class="page-item ${prevDisabled}">
            <a class="page-link" href="?page=${currentPage - 1}" aria-label="Previous">
                <span aria-hidden="true"><i class="bi bi-chevron-left"></i></span>
            </a>
        </li>
    `;

    for (let i = 1; i <= totalPages; i += 1) {
        html += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link" href="?page=${i}">${i}</a>
            </li>
        `;
    }

    html += `
        <li class="page-item ${nextDisabled}">
            <a class="page-link" href="?page=${currentPage + 1}" aria-label="Next">
                <span aria-hidden="true"><i class="bi bi-chevron-right"></i></span>
            </a>
        </li>
    `;

    paginationWrapper.innerHTML = html;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error("Notice request timed out")), timeoutMs);
        })
    ]);
}
