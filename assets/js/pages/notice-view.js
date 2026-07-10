import { fetchNotice } from "../notice-service.js";
import { sanitizeHtml } from "../html-utils.js";

const DEFAULT_TITLE = "공지사항 | ERICA 중앙감사위원회";

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    document.title = DEFAULT_TITLE;

    if (!id) {
        showInlineAlert("잘못된 접근입니다. 게시글 주소를 확인해주세요.");
        return;
    }

    try {
        const notice = await fetchNotice(id);

        if (!notice) {
            showInlineAlert("존재하지 않거나 삭제된 게시글입니다.");
            return;
        }

        renderNotice(notice);
    } catch (error) {
        console.error("Notice view load failed:", error);
        showInlineAlert("공지사항을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
});

function renderNotice(notice) {
    const metadata = document.getElementById("view-metadata");
    const type = document.getElementById("view-type");
    const date = document.getElementById("view-date");
    const title = document.getElementById("view-title");
    const authorRow = document.getElementById("view-author-row");
    const author = document.getElementById("view-author");
    const content = document.getElementById("view-content");

    document.title = notice.title ? `${notice.title} | ERICA 중앙감사위원회` : DEFAULT_TITLE;

    if (metadata) metadata.hidden = false;
    if (authorRow) authorRow.hidden = false;

    if (type) {
        type.textContent = notice.type;
        type.className = notice.type === "필독" ? "badge bg-danger" : "badge bg-secondary";
    }

    if (date) date.textContent = notice.date;
    if (title) title.textContent = notice.title;
    if (author) author.textContent = notice.author;
    if (content) content.innerHTML = sanitizeHtml(notice.contentHtml || "");
}

function showInlineAlert(message) {
    const content = document.getElementById("view-content");
    const title = document.getElementById("view-title");
    const alertHtml = `
        <div class="alert alert-warning small" role="alert" aria-live="assertive">
            ${message}
            <a href="/pages/notice/general.html" class="alert-link ms-1">목록으로 돌아가기</a>
        </div>
    `;

    clearNoticeMetadata();

    if (title) title.textContent = "공지사항";

    if (content) {
        content.innerHTML = alertHtml;
        return;
    }

    document.querySelector("main, body")?.insertAdjacentHTML("afterbegin", alertHtml);
}

function clearNoticeMetadata() {
    const metadata = document.getElementById("view-metadata");
    const authorRow = document.getElementById("view-author-row");
    const type = document.getElementById("view-type");
    const date = document.getElementById("view-date");
    const author = document.getElementById("view-author");

    if (metadata) metadata.hidden = true;
    if (authorRow) authorRow.hidden = true;
    if (type) type.textContent = "";
    if (date) date.textContent = "";
    if (author) author.textContent = "";
}
