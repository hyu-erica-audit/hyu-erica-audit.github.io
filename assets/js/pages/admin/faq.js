import { escapeHtml } from "../../html-utils.js";
import { getFirebaseErrorMessage } from "../../notice-service.js";
import {
    createFaq,
    fetchAllFaqs,
    removeFaq,
    updateFaq
} from "../../faq-service.js";
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

const faqList = document.getElementById("admin-faq-list");
const faqForm = document.getElementById("admin-faq-form");
const faqEditorTitle = document.getElementById("admin-faq-editor-title");
const newFaqButton = document.getElementById("admin-new-faq");
const deleteFaqButton = document.getElementById("admin-delete-faq");

const faqFields = {
    id: document.getElementById("faq-id"),
    question: document.getElementById("faq-question"),
    order: document.getElementById("faq-order"),
    status: document.getElementById("faq-status"),
    answer: document.getElementById("faq-answer"),
    editor: document.getElementById("faq-editor")
};

let faqs = [];

const setBusy = createBusySetter({ form: faqForm, buttons: [newFaqButton], editor: faqFields.editor });

export function initFaq() {
    registerEditor("faq", faqFields.editor, faqFields.answer);
    resetFaqForm();

    newFaqButton?.addEventListener("click", resetFaqForm);
    faqForm?.addEventListener("submit", handleSubmit);
    deleteFaqButton?.addEventListener("click", handleDelete);

    attachListActions(faqList, {
        "edit-faq": id => {
            const faq = faqs.find(item => item.id === id);

            if (faq) fillFaqForm(faq);
        }
    });

    return loadFaqs;
}

async function handleSubmit(event) {
    event.preventDefault();

    const payload = readFaqForm();

    await saveEntity({
        id: faqFields.id.value,
        validate: () => (!payload.question || !payload.answerHtml ? "질문과 답변을 입력해주세요." : null),
        create: () => createFaq(payload),
        update: id => updateFaq(id, payload),
        setBusy,
        reload: loadFaqs,
        reset: resetFaqForm,
        getErrorMessage: getFirebaseErrorMessage,
        messages: {
            created: "FAQ를 저장했습니다.",
            updated: "FAQ를 수정했습니다.",
            failed: "FAQ 저장에 실패했습니다.",
            logLabel: "FAQ save failed:"
        }
    });
}

async function handleDelete() {
    const id = faqFields.id.value;

    await deleteEntity({
        item: id || null,
        confirmMessage: "이 FAQ를 삭제할까요?",
        remove: () => removeFaq(id),
        setBusy,
        reset: resetFaqForm,
        reload: loadFaqs,
        getErrorMessage: getFirebaseErrorMessage,
        messages: {
            success: "FAQ를 삭제했습니다.",
            failed: "FAQ 삭제에 실패했습니다.",
            logLabel: "FAQ delete failed:"
        }
    });
}

async function loadFaqs() {
    if (!faqList) return;

    faqList.innerHTML = mutedRow("FAQ를 불러오는 중입니다.");

    try {
        faqs = await fetchAllFaqs();
        renderFaqRows();
    } catch (error) {
        console.error("Admin FAQ load failed:", error);
        faqList.innerHTML = dangerRow(`FAQ를 불러오지 못했습니다. ${escapeHtml(getFirebaseErrorMessage(error))}`);
    }
}

function renderFaqRows() {
    if (!faqList) return;

    if (faqs.length === 0) {
        faqList.innerHTML = mutedRow("저장된 FAQ가 없습니다.");
        return;
    }

    faqList.innerHTML = faqs.map(faq => `
        <tr>
            <td>${statusBadge(faq.status)}</td>
            <td>
                <button type="button" class="admin-link-button" data-action="edit-faq" data-id="${escapeHtml(faq.id)}">
                    ${escapeHtml(faq.question || "질문 없음")}
                </button>
            </td>
            <td class="text-muted">${escapeHtml(faq.order)}</td>
            <td class="text-end">
                <a class="btn btn-outline-dark btn-sm" href="/pages/ask/faq.html" target="_blank" rel="noopener">
                    보기
                </a>
            </td>
        </tr>
    `).join("");
}

function readFaqForm() {
    syncEditorToTextarea("faq");

    return {
        question: faqFields.question.value.trim(),
        order: faqFields.order.value,
        status: faqFields.status.value,
        answerHtml: faqFields.answer.value.trim()
    };
}

function fillFaqForm(faq) {
    faqFields.id.value = faq.id;
    faqFields.question.value = faq.question || "";
    faqFields.order.value = faq.order || 0;
    faqFields.status.value = faq.status || "draft";
    setEditorHtml("faq", faq.answerHtml || "");

    faqEditorTitle.textContent = "FAQ 수정";
    deleteFaqButton?.classList.remove("d-none");
    faqFields.question.focus();
}

function resetFaqForm() {
    faqForm?.reset();

    faqFields.id.value = "";
    faqFields.order.value = faqs.length + 1;
    faqFields.status.value = "published";
    setEditorHtml("faq", "");

    faqEditorTitle.textContent = "새 FAQ 작성";
    deleteFaqButton?.classList.add("d-none");
}
