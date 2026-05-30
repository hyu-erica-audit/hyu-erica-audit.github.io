import { fetchNotice } from "../notice-service.js?v=20260530-notice-sequence";

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    if (!id) {
        moveToList();
        return;
    }

    try {
        const notice = await withTimeout(fetchNotice(id), 5000);

        if (!notice) {
            alert("존재하지 않거나 삭제된 게시글입니다.");
            moveToList();
            return;
        }

        renderNotice(notice);
    } catch (error) {
        console.error("Notice view load failed:", error);
        alert("공지사항을 불러오지 못했습니다.");
        moveToList();
    }
});

function renderNotice(notice) {
    const type = document.getElementById("view-type");
    const date = document.getElementById("view-date");
    const title = document.getElementById("view-title");
    const author = document.getElementById("view-author");
    const content = document.getElementById("view-content");

    if (type) {
        type.textContent = notice.type;
        type.className = notice.type === "필독" ? "badge bg-danger" : "badge bg-secondary";
    }

    if (date) date.textContent = notice.date;
    if (title) title.textContent = notice.title;
    if (author) author.textContent = notice.author;
    if (content) content.innerHTML = notice.contentHtml || "";
}

function moveToList() {
    window.location.href = "/pages/notice/general.html";
}

function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error("Notice request timed out")), timeoutMs);
        })
    ]);
}
