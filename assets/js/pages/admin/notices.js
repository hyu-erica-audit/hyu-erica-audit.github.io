import { escapeHtml } from "../../html-utils.js";
import {
    createNotice,
    fetchAllNotices,
    formatDate,
    getFirebaseErrorMessage,
    removeNotice,
    updateNotice
} from "../../notice-service.js";
import {
    attachListActions,
    createBusySetter,
    dangerRow,
    deleteEntity,
    mutedRow,
    registerEditor,
    saveEntity,
    setEditorHtml,
    statusBadge,
    syncEditorToTextarea
} from "./shared.js";

const list = document.getElementById("admin-notice-list");
const form = document.getElementById("admin-notice-form");
const editorTitle = document.getElementById("admin-editor-title");
const newButton = document.getElementById("admin-new-notice");
const deleteButton = document.getElementById("admin-delete-notice");

const fields = {
    id: document.getElementById("notice-id"),
    title: document.getElementById("notice-title"),
    type: document.getElementById("notice-type"),
    author: document.getElementById("notice-author"),
    date: document.getElementById("notice-date"),
    status: document.getElementById("notice-status"),
    pinned: document.getElementById("notice-pinned"),
    content: document.getElementById("notice-content"),
    editor: document.getElementById("notice-editor")
};

let notices = [];

const setBusy = createBusySetter({ form, buttons: [newButton], editor: fields.editor });

export function initNotices() {
    registerEditor("notice", fields.editor, fields.content);
    resetForm();

    newButton?.addEventListener("click", resetForm);
    form?.addEventListener("submit", handleSubmit);
    deleteButton?.addEventListener("click", handleDelete);

    attachListActions(list, {
        "edit-notice": id => {
            const notice = notices.find(item => item.id === id);

            if (notice) fillForm(notice);
        }
    });

    return loadNotices;
}

async function handleSubmit(event) {
    event.preventDefault();

    const currentNotice = notices.find(item => item.id === fields.id.value);
    const payload = {
        ...readForm(),
        publishedAt: currentNotice?.publishedAt || null
    };

    await saveEntity({
        id: fields.id.value,
        validate: () => (!payload.title || !payload.contentHtml ? "제목과 내용을 입력해주세요." : null),
        create: () => createNotice(payload),
        update: id => updateNotice(id, payload),
        setBusy,
        reload: loadNotices,
        reset: resetForm,
        getErrorMessage: getFirebaseErrorMessage,
        messages: {
            created: "공지사항을 저장했습니다.",
            updated: "공지사항을 수정했습니다.",
            failed: "저장에 실패했습니다.",
            logLabel: "Notice save failed:"
        }
    });
}

async function handleDelete() {
    const id = fields.id.value;

    await deleteEntity({
        item: id || null,
        confirmMessage: "이 공지사항을 삭제할까요?",
        remove: () => removeNotice(id),
        setBusy,
        reset: resetForm,
        reload: loadNotices,
        getErrorMessage: getFirebaseErrorMessage,
        messages: {
            success: "공지사항을 삭제했습니다.",
            failed: "삭제에 실패했습니다.",
            logLabel: "Notice delete failed:"
        }
    });
}

async function loadNotices() {
    if (!list) return;

    list.innerHTML = mutedRow("공지사항을 불러오는 중입니다.");

    try {
        notices = await fetchAllNotices();
        renderNoticeRows();
    } catch (error) {
        console.error("Admin notice load failed:", error);
        list.innerHTML = dangerRow(`공지사항을 불러오지 못했습니다. ${escapeHtml(getFirebaseErrorMessage(error))}`);
        throw error;
    }
}

function renderNoticeRows() {
    if (!list) return;

    if (notices.length === 0) {
        list.innerHTML = mutedRow("저장된 공지사항이 없습니다.");
        return;
    }

    list.innerHTML = notices.map(notice => `
        <tr>
            <td>${statusBadge(notice.status)}</td>
            <td>
                <button type="button" class="admin-link-button" data-action="edit-notice" data-id="${escapeHtml(notice.id)}">
                    ${notice.pinned ? '<i class="bi bi-pin-angle-fill text-danger me-1"></i>' : ""}
                    ${escapeHtml(notice.title || "제목 없음")}
                </button>
            </td>
            <td class="text-muted">${escapeHtml(notice.date)}</td>
            <td class="text-end">
                <a class="btn btn-outline-dark btn-sm" href="/pages/notice/view.html?id=${encodeURIComponent(notice.id)}" target="_blank" rel="noopener">
                    보기
                </a>
            </td>
        </tr>
    `).join("");
}

function readForm() {
    syncEditorToTextarea("notice");

    return {
        title: fields.title.value.trim(),
        type: fields.type.value,
        author: fields.author.value.trim() || "중앙감사위원회",
        date: fields.date.value.trim() || formatDate(),
        status: fields.status.value,
        pinned: fields.pinned.checked,
        contentHtml: fields.content.value.trim()
    };
}

function fillForm(notice) {
    fields.id.value = notice.id;
    fields.title.value = notice.title || "";
    fields.type.value = notice.type || "일반";
    fields.author.value = notice.author || "중앙감사위원회";
    fields.date.value = notice.date || formatDate();
    fields.status.value = notice.status || "draft";
    fields.pinned.checked = Boolean(notice.pinned);
    setEditorHtml("notice", notice.contentHtml || "");

    editorTitle.textContent = "공지 수정";
    deleteButton?.classList.remove("d-none");
    fields.title.focus();
}

function resetForm() {
    form?.reset();

    fields.id.value = "";
    fields.author.value = "중앙감사위원회";
    fields.date.value = formatDate();
    fields.status.value = "published";
    fields.pinned.checked = false;
    setEditorHtml("notice", "");

    editorTitle.textContent = "새 공지 작성";
    deleteButton?.classList.add("d-none");
}
