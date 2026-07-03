import { compareNoticesForNumbering, fetchPublishedNotices } from "../notice-service.js";
import { escapeHtml } from "../html-utils.js";

const ITEMS_PER_PAGE = 10;

document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("notice-list-body");
    const totalCountElement = document.getElementById("total-count");
    const paginationWrapper = document.getElementById("pagination-wrapper");

    if (!tableBody || !paginationWrapper) return;

    tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-5 text-muted">공지사항을 불러오는 중입니다.</td></tr>`;

    try {
        const notices = await fetchPublishedNotices();

        renderNoticeList(notices, getPageFromLocation(), tableBody, totalCountElement, paginationWrapper);

        paginationWrapper.addEventListener("click", event => {
            const link = event.target.closest("a.page-link");

            if (!link) return;

            event.preventDefault();

            const parent = link.closest(".page-item");

            if (parent?.classList.contains("disabled") || parent?.classList.contains("active")) return;

            const requestedPage = parseInt(new URL(link.href, window.location.href).searchParams.get("page"), 10);

            if (!requestedPage || requestedPage < 1) return;

            const renderedPage = renderNoticeList(notices, requestedPage, tableBody, totalCountElement, paginationWrapper);

            window.history.replaceState(null, "", `?page=${renderedPage}`);
        });
    } catch (error) {
        console.error("Notice list load failed:", error);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-5 text-danger">공지사항을 불러오지 못했습니다. Firestore 설정을 확인해주세요.</td></tr>`;
        if (totalCountElement) totalCountElement.textContent = "0";
        paginationWrapper.innerHTML = "";
    }
});

function getPageFromLocation() {
    const urlParams = new URLSearchParams(window.location.search);

    return Math.max(parseInt(urlParams.get("page"), 10) || 1, 1);
}

function renderNoticeList(notices, requestedPage, tableBody, totalCountElement, paginationWrapper) {
    const totalItems = notices.length;
    const totalPages = Math.max(Math.ceil(totalItems / ITEMS_PER_PAGE), 1);
    const safeCurrentPage = Math.min(Math.max(requestedPage, 1), totalPages);
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const currentData = notices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const displayNumberMap = getDisplayNoticeNumbers(notices);

    if (totalCountElement) {
        totalCountElement.textContent = totalItems;
    }

    if (currentData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-5 text-muted">게시된 공지사항이 없습니다.</td></tr>`;
    } else {
        tableBody.innerHTML = currentData.map(notice => {
            const badgeClass = notice.type === "필독" ? "bg-danger" : "bg-secondary";
            const displayNo = displayNumberMap.get(notice.id) || "";

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

    return safeCurrentPage;
}

// 렌더링 시점에 번호를 계산한다. legacyId가 있으면 그대로 사용하고,
// 없는 게시글에는 게시 순서 기준(compareNoticesForNumbering)의 순번을 부여한다.
function getDisplayNoticeNumbers(notices) {
    const numberMap = new Map();
    const usedNumbers = new Set();
    const unnumbered = [];

    [...notices].sort(compareNoticesForNumbering).forEach(notice => {
        const legacyNo = Number(notice.legacyId);

        if (legacyNo > 0 && !usedNumbers.has(legacyNo)) {
            numberMap.set(notice.id, legacyNo);
            usedNumbers.add(legacyNo);
            return;
        }

        unnumbered.push(notice.id);
    });

    let nextNumber = 1;

    unnumbered.forEach(id => {
        while (usedNumbers.has(nextNumber)) nextNumber += 1;

        numberMap.set(id, nextNumber);
        usedNumbers.add(nextNumber);
    });

    return numberMap;
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
