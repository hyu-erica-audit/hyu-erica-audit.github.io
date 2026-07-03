import { escapeHtml } from "../../html-utils.js";
import {
    createDocument,
    fetchAllDocuments,
    getFirebaseDocumentErrorMessage,
    removeDocument,
    sortDocuments,
    updateDocument
} from "../../document-service.js";
import { getTodayDateInputValue, getYearFromDate, toDateInputValue } from "../../date-utils.js";
import { getFileIconClass } from "../../file-icons.js";
import {
    attachListActions,
    createBusySetter,
    createUploadProgress,
    dangerRow,
    deleteEntity,
    groupHeaderRow,
    mutedRow,
    saveEntity,
    statusBadge
} from "./shared.js";

const documentList = document.getElementById("admin-document-list");
const documentForm = document.getElementById("admin-document-form");
const documentEditorTitle = document.getElementById("admin-document-editor-title");
const newDocumentButton = document.getElementById("admin-new-document");
const deleteDocumentButton = document.getElementById("admin-delete-document");
const documentCurrentFile = document.getElementById("document-current-file");
const documentProgress = createUploadProgress(document.getElementById("document-upload-progress"));

const ruleList = document.getElementById("admin-rule-list");
const ruleForm = document.getElementById("admin-rule-form");
const ruleEditorTitle = document.getElementById("admin-rule-editor-title");
const deleteRuleButton = document.getElementById("admin-delete-rule");
const ruleCurrentFile = document.getElementById("rule-current-file");
const ruleSlotLabel = document.getElementById("rule-slot-label");
const ruleProgress = createUploadProgress(document.getElementById("rule-upload-progress"));

const formDocumentList = document.getElementById("admin-form-document-list");
const formDocumentForm = document.getElementById("admin-form-document-form");
const formDocumentEditorTitle = document.getElementById("admin-form-document-editor-title");
const newFormDocumentButton = document.getElementById("admin-new-form-document");
const deleteFormDocumentButton = document.getElementById("admin-delete-form-document");
const formDocumentCurrentFile = document.getElementById("form-document-current-file");
const formDocumentProgress = createUploadProgress(document.getElementById("form-document-upload-progress"));

const documentFields = {
    id: document.getElementById("document-id"),
    title: document.getElementById("document-title"),
    type: document.getElementById("document-type"),
    date: document.getElementById("document-date"),
    category: document.getElementById("document-category"),
    status: document.getElementById("document-status"),
    file: document.getElementById("document-file"),
    important: document.getElementById("document-important")
};

const ruleFields = {
    id: document.getElementById("rule-id"),
    title: document.getElementById("rule-title"),
    subtitle: document.getElementById("rule-subtitle"),
    description: document.getElementById("rule-description"),
    category: document.getElementById("rule-category"),
    date: document.getElementById("rule-date"),
    status: document.getElementById("rule-status"),
    file: document.getElementById("rule-file")
};

const formDocumentFields = {
    id: document.getElementById("form-document-id"),
    title: document.getElementById("form-document-title"),
    icon: document.getElementById("form-document-icon"),
    status: document.getElementById("form-document-status"),
    file: document.getElementById("form-document-file")
};

const RULE_SLOTS = [
    {
        category: "중앙감사 세칙",
        title: "한양대학교 ERICA 중앙감사 세칙",
        subtitle: "중앙감사위원회 감사 기준 및 절차",
        description: "중앙감사위원회의 구성, 권한, 감사 절차 및 징계에 관한 세부적인 사항을 규정하고 있는 세칙입니다.",
        emptyText: "중앙감사 세칙 PDF가 아직 업로드되지 않았습니다."
    },
    {
        category: "감사 시행 별칙",
        title: "한양대학교 ERICA 감사 시행 별칙",
        subtitle: "감사 시행을 위한 세부 기준",
        description: "중앙감사 시행에 관한 구체적인 절차와 방법을 규정하고 있는 별칙입니다.",
        emptyText: "감사 시행 별칙 PDF가 아직 업로드되지 않았습니다."
    }
];

const ALLOWED_FORM_ICONS = new Set([
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

let documents = [];

const setDocumentBusy = createBusySetter({ form: documentForm, buttons: [newDocumentButton] });
const setRuleBusy = createBusySetter({ form: ruleForm, containers: [ruleList] });
const setFormDocumentBusy = createBusySetter({ form: formDocumentForm, buttons: [newFormDocumentButton] });

export function initDocuments() {
    resetDocumentForm();
    resetRuleForm();
    resetFormDocumentForm();

    newDocumentButton?.addEventListener("click", resetDocumentForm);
    newFormDocumentButton?.addEventListener("click", resetFormDocumentForm);

    documentForm?.addEventListener("submit", handleDocumentSubmit);
    deleteDocumentButton?.addEventListener("click", handleDocumentDelete);
    ruleForm?.addEventListener("submit", handleRuleSubmit);
    deleteRuleButton?.addEventListener("click", handleRuleDelete);
    formDocumentForm?.addEventListener("submit", handleFormDocumentSubmit);
    deleteFormDocumentButton?.addEventListener("click", handleFormDocumentDelete);

    documentFields.type?.addEventListener("change", () => {
        const kind = parseDocumentKind(documentFields.type.value);
        const currentCategory = documentFields.category.value.trim();

        if (!currentCategory || currentCategory === "정기회의" || currentCategory === "정기감사") {
            documentFields.category.value = kind.defaultCategory;
        }
    });

    attachListActions(documentList, {
        "edit-document": id => {
            const documentItem = documents.find(item => item.id === id);

            if (documentItem) fillDocumentForm(documentItem);
        }
    });

    attachListActions(ruleList, {
        "select-rule-slot": category => selectRuleSlot(category)
    });

    attachListActions(formDocumentList, {
        "edit-form-document": id => {
            const item = getFormDocuments().find(documentItem => documentItem.id === id);

            if (item) fillFormDocumentForm(item);
        }
    });

    return loadDocuments;
}

async function handleDocumentSubmit(event) {
    event.preventDefault();

    const payload = readDocumentForm();
    const file = documentFields.file.files?.[0] || null;
    const previousDocument = documents.find(item => item.id === documentFields.id.value);

    await saveEntity({
        id: documentFields.id.value,
        validate: () => {
            if (!payload.title || !payload.date) return "문서 제목과 날짜를 입력해주세요.";
            if (!documentFields.id.value && !file) return "새 문서를 업로드하려면 파일을 선택해주세요.";

            return null;
        },
        onStart: () => documentProgress.set(0),
        create: () => createDocument(payload, file, documentProgress.set),
        update: id => updateDocument(id, payload, file, previousDocument, documentProgress.set),
        setBusy: setDocumentBusy,
        reload: loadDocuments,
        reset: resetDocumentForm,
        getErrorMessage: getFirebaseDocumentErrorMessage,
        messages: {
            created: "문서를 업로드했습니다.",
            updated: "문서를 수정했습니다.",
            failed: "문서 저장에 실패했습니다.",
            logLabel: "Document save failed:"
        }
    });
}

async function handleDocumentDelete() {
    const documentItem = documents.find(item => item.id === documentFields.id.value);

    await deleteEntity({
        item: documentItem,
        confirmMessage: "이 문서와 업로드된 파일을 삭제할까요?",
        remove: () => removeDocument(documentItem),
        setBusy: setDocumentBusy,
        reset: resetDocumentForm,
        reload: loadDocuments,
        getErrorMessage: getFirebaseDocumentErrorMessage,
        messages: {
            success: "문서를 삭제했습니다.",
            failed: "문서 삭제에 실패했습니다.",
            logLabel: "Document delete failed:"
        }
    });
}

async function handleRuleSubmit(event) {
    event.preventDefault();
    await saveManagedDocument({
        type: "rule",
        fields: ruleFields,
        currentItems: getRuleDocuments(),
        reset: () => selectRuleSlot(ruleFields.category.value || "중앙감사 세칙"),
        setBusy: setRuleBusy,
        progress: ruleProgress,
        uniqueByCategory: true,
        messages: {
            missingRequired: "세칙 제목과 날짜를 입력해주세요.",
            missingFile: "새 세칙을 업로드하려면 파일을 선택해주세요.",
            created: "세칙을 업로드했습니다.",
            updated: "세칙을 수정했습니다.",
            failed: "세칙 저장에 실패했습니다."
        }
    });
}

async function handleRuleDelete() {
    const ruleItem = getRuleDocuments().find(item => item.id === ruleFields.id.value);

    await deleteEntity({
        item: ruleItem,
        confirmMessage: "이 세칙 파일을 삭제할까요?",
        remove: () => removeDocument(ruleItem),
        setBusy: setRuleBusy,
        reset: resetRuleForm,
        reload: loadDocuments,
        getErrorMessage: getFirebaseDocumentErrorMessage,
        messages: {
            success: "세칙을 삭제했습니다.",
            failed: "세칙 삭제에 실패했습니다.",
            logLabel: "Managed document delete failed:"
        }
    });
}

async function handleFormDocumentSubmit(event) {
    event.preventDefault();
    await saveManagedDocument({
        type: "form",
        fields: formDocumentFields,
        currentItems: getFormDocuments(),
        reset: resetFormDocumentForm,
        setBusy: setFormDocumentBusy,
        progress: formDocumentProgress,
        messages: {
            missingRequired: "서식 제목을 입력해주세요.",
            missingFile: "새 서식을 업로드하려면 파일을 선택해주세요.",
            created: "서식을 업로드했습니다.",
            updated: "서식을 수정했습니다.",
            failed: "서식 저장에 실패했습니다."
        }
    });
}

async function handleFormDocumentDelete() {
    const formItem = getFormDocuments().find(item => item.id === formDocumentFields.id.value);

    await deleteEntity({
        item: formItem,
        confirmMessage: "이 서식 파일을 삭제할까요?",
        remove: () => removeDocument(formItem),
        setBusy: setFormDocumentBusy,
        reset: resetFormDocumentForm,
        reload: loadDocuments,
        getErrorMessage: getFirebaseDocumentErrorMessage,
        messages: {
            success: "서식을 삭제했습니다.",
            failed: "서식 삭제에 실패했습니다.",
            logLabel: "Managed document delete failed:"
        }
    });
}

async function saveManagedDocument({ type, fields: targetFields, currentItems, reset, setBusy, progress, uniqueByCategory = false, messages }) {
    const payload = {
        type,
        title: targetFields.title.value.trim(),
        subtitle: targetFields.subtitle?.value.trim() || "",
        description: targetFields.description?.value.trim() || "",
        icon: targetFields.icon?.value || "",
        date: targetFields.date?.value || getTodayDateInputValue(),
        year: getYearFromDate(targetFields.date?.value || getTodayDateInputValue()) || new Date().getFullYear(),
        category: targetFields.category?.value.trim() || "",
        status: targetFields.status.value,
        isImportant: false
    };
    const file = targetFields.file.files?.[0] || null;
    const previousDocument = currentItems.find(item => item.id === targetFields.id.value)
        || (uniqueByCategory ? currentItems.find(item => item.category === payload.category) : null);
    const documentId = targetFields.id.value || previousDocument?.id || "";

    await saveEntity({
        id: documentId,
        validate: () => {
            if (!payload.title || !payload.date) return messages.missingRequired;
            if (!documentId && !file) return messages.missingFile;

            return null;
        },
        onStart: () => progress.set(0),
        create: () => createDocument(payload, file, progress.set),
        update: id => updateDocument(id, payload, file, previousDocument, progress.set),
        setBusy,
        reload: loadDocuments,
        reset,
        getErrorMessage: getFirebaseDocumentErrorMessage,
        messages: {
            created: messages.created,
            updated: messages.updated,
            failed: messages.failed,
            logLabel: "Managed document save failed:"
        }
    });
}

async function loadDocuments() {
    if (!documentList) return;

    documentList.innerHTML = mutedRow("문서를 불러오는 중입니다.");

    try {
        documents = await fetchAllDocuments();
        syncReportYearOptions();
        renderDocumentRows();
        renderRuleRows();
        renderFormDocumentRows();
    } catch (error) {
        console.error("Admin document load failed:", error);
        const errorMessage = `문서를 불러오지 못했습니다. ${escapeHtml(getFirebaseDocumentErrorMessage(error))}`;
        if (documentList) documentList.innerHTML = dangerRow(errorMessage);
        if (ruleList) ruleList.innerHTML = `<div class="text-center text-danger py-4">${errorMessage}</div>`;
        if (formDocumentList) formDocumentList.innerHTML = dangerRow(errorMessage);
    }
}

function getReportYears() {
    const years = new Set(
        documents
            .filter(item => item.type === "report")
            .map(item => item.year || getYearFromDate(item.date))
            .filter(Boolean)
    );

    years.add(new Date().getFullYear());

    return [...years].sort((a, b) => a - b);
}

// Keeps the "문서 종류" <select>의 report-<year> options in sync with the
// years that actually exist in the data (plus the current year), so a new
// year works without code changes.
function syncReportYearOptions() {
    const select = documentFields.type;

    if (!select) return;

    const currentValue = select.value;

    [...select.options]
        .filter(option => option.value.startsWith("report-"))
        .forEach(option => option.remove());

    getReportYears().forEach(year => {
        const option = document.createElement("option");
        option.value = `report-${year}`;
        option.textContent = `${year}년 감사보고서`;
        select.append(option);
    });

    if ([...select.options].some(option => option.value === currentValue)) {
        select.value = currentValue;
    }
}

function ensureDocumentTypeOption(value) {
    const select = documentFields.type;

    if (!select || !value.startsWith("report-")) return;
    if ([...select.options].some(option => option.value === value)) return;

    const year = parseReportYear(value);
    const option = document.createElement("option");
    option.value = value;
    option.textContent = year ? `${year}년 감사보고서` : value;
    select.append(option);
}

function renderDocumentRows() {
    if (!documentList) return;

    const managedDocuments = sortDocuments(documents.filter(item => item.type === "regularAudit" || item.type === "minutes" || item.type === "report"));

    if (managedDocuments.length === 0) {
        documentList.innerHTML = mutedRow("저장된 문서가 없습니다.");
        return;
    }

    const reportYears = [...new Set(
        managedDocuments
            .filter(item => item.type === "report")
            .map(item => item.year)
            .filter(Boolean)
    )].sort((a, b) => a - b);

    const groups = [
        {
            title: "정기 감사 자료",
            items: managedDocuments.filter(item => item.type === "regularAudit")
        },
        {
            title: "회의록",
            items: managedDocuments.filter(item => item.type === "minutes")
        },
        ...reportYears.map(year => ({
            title: `${year}년 감사보고서`,
            items: managedDocuments.filter(item => item.type === "report" && item.year === year)
        })),
        {
            title: "기타 문서",
            items: managedDocuments.filter(item => item.type === "report" && !item.year)
        }
    ].filter(group => group.items.length > 0);

    documentList.innerHTML = groups.map(group => `
        ${groupHeaderRow(group.title)}
        ${group.items.map(item => `
        <tr>
            <td>${statusBadge(item.status)}</td>
            <td>
                <button type="button" class="admin-link-button" data-action="edit-document" data-id="${escapeHtml(item.id)}">
                    ${escapeHtml(item.title || "제목 없음")}
                </button>
                <div class="text-muted small">${escapeHtml(getDocumentTypeLabel(item.type))} · ${escapeHtml(item.category || "문서")}</div>
            </td>
            <td class="text-muted">${escapeHtml(formatDocumentDate(item.date))}</td>
            <td class="text-end">
                <span class="text-muted small">${escapeHtml(formatFileSize(item.fileSize))}</span>
            </td>
        </tr>
        `).join("")}
    `).join("");
}

function renderRuleRows() {
    if (!ruleList) return;

    ruleList.innerHTML = RULE_SLOTS.map(slot => {
        const item = getRuleSlotDocument(slot.category);
        const isPublished = item?.status === "published";

        return `
            <article class="admin-rule-slot ${item ? "is-filled" : "is-empty"}">
                <div class="admin-rule-slot-main">
                    <span class="admin-rule-slot-icon"><i class="bi ${item ? "bi-file-earmark-pdf" : "bi-file-earmark-plus"}"></i></span>
                    <div>
                        <div class="admin-rule-slot-title">${escapeHtml(slot.category)}</div>
                        <div class="admin-rule-slot-meta">
                            ${item ? `${escapeHtml(formatDocumentDate(item.date))} · ${escapeHtml(formatFileSize(item.fileSize) || item.fileName || "파일 저장됨")}` : escapeHtml(slot.emptyText)}
                        </div>
                    </div>
                </div>
                <div class="admin-rule-slot-actions">
                    <span class="badge ${isPublished ? "bg-success" : item ? "bg-secondary" : "bg-light text-dark"}">
                        ${isPublished ? "게시" : item ? "임시" : "미등록"}
                    </span>
                    <button type="button" class="btn btn-outline-dark btn-sm" data-action="select-rule-slot" data-id="${escapeHtml(slot.category)}">
                        ${item ? "교체" : "업로드"}
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function renderFormDocumentRows() {
    if (!formDocumentList) return;

    const sortedItems = sortDocuments(getFormDocuments());

    if (sortedItems.length === 0) {
        formDocumentList.innerHTML = mutedRow("저장된 서식이 없습니다.");
        return;
    }

    formDocumentList.innerHTML = sortedItems.map(item => `
        <tr>
            <td>${statusBadge(item.status)}</td>
            <td>
                <i class="bi ${escapeHtml(getDocumentIconClass(item))} text-primary" style="font-size: 1.35rem;"></i>
            </td>
            <td>
                <button type="button" class="admin-link-button" data-action="edit-form-document" data-id="${escapeHtml(item.id)}">
                    ${escapeHtml(item.title || "제목 없음")}
                </button>
                <div class="text-muted small">${escapeHtml(item.fileName || "파일")}</div>
            </td>
            <td class="text-end">
                <span class="text-muted small">${escapeHtml(formatFileSize(item.fileSize))}</span>
            </td>
        </tr>
    `).join("");
}

function readDocumentForm() {
    const kind = parseDocumentKind(documentFields.type.value);

    return {
        title: documentFields.title.value.trim(),
        type: kind.type,
        date: documentFields.date.value,
        year: kind.year || getYearFromDate(documentFields.date.value),
        category: documentFields.category.value.trim() || kind.defaultCategory,
        status: documentFields.status.value,
        isImportant: documentFields.important.checked
    };
}

function fillDocumentForm(documentItem) {
    const kindValue = getDocumentKindValue(documentItem);

    ensureDocumentTypeOption(kindValue);

    documentFields.id.value = documentItem.id;
    documentFields.title.value = documentItem.title || "";
    documentFields.type.value = kindValue;
    documentFields.date.value = toDateInputValue(documentItem.date);
    documentFields.category.value = documentItem.category || "";
    documentFields.status.value = documentItem.status || "draft";
    documentFields.important.checked = Boolean(documentItem.isImportant);
    documentFields.file.value = "";

    if (documentCurrentFile) {
        documentCurrentFile.textContent = documentItem.fileName
            ? `현재 파일: ${documentItem.fileName}`
            : "현재 저장된 파일이 없습니다.";
    }

    documentProgress.reset();
    documentEditorTitle.textContent = "문서 수정";
    deleteDocumentButton?.classList.remove("d-none");
    documentFields.title.focus();
}

function resetDocumentForm() {
    documentForm?.reset();

    documentFields.id.value = "";
    documentFields.type.value = "minutes";
    documentFields.date.value = getTodayDateInputValue();
    documentFields.category.value = "정기회의";
    documentFields.status.value = "published";
    documentFields.important.checked = false;

    if (documentCurrentFile) {
        documentCurrentFile.textContent = "새 문서는 파일 선택이 필요합니다.";
    }

    documentProgress.reset();
    documentEditorTitle.textContent = "새 문서 업로드";
    deleteDocumentButton?.classList.add("d-none");
}

function fillRuleForm(item) {
    fillManagedDocumentForm({
        item,
        fields: ruleFields,
        currentFileElement: ruleCurrentFile,
        editorTitle: ruleEditorTitle,
        editorTitleText: `${item.category || "세칙"} 교체`,
        deleteButton: deleteRuleButton,
        resetProgress: ruleProgress.reset
    });

    setRuleSlotLabel(item.category || "중앙감사 세칙");
}

function resetRuleForm() {
    selectRuleSlot("중앙감사 세칙");
}

function selectRuleSlot(category) {
    const slot = RULE_SLOTS.find(item => item.category === category) || RULE_SLOTS[0];
    const existingDocument = getRuleSlotDocument(slot.category);

    if (existingDocument) {
        fillRuleForm(existingDocument);
        return;
    }

    resetManagedDocumentForm({
        fields: ruleFields,
        defaultCategory: slot.category,
        currentFileElement: ruleCurrentFile,
        currentFileText: slot.emptyText,
        editorTitle: ruleEditorTitle,
        editorTitleText: `${slot.category} 업로드`,
        deleteButton: deleteRuleButton,
        resetProgress: ruleProgress.reset
    });

    ruleFields.title.value = slot.title;
    if (ruleFields.subtitle) ruleFields.subtitle.value = slot.subtitle;
    if (ruleFields.description) ruleFields.description.value = slot.description;
    setRuleSlotLabel(slot.category);
}

function setRuleSlotLabel(category) {
    if (ruleSlotLabel) ruleSlotLabel.textContent = category;
}

function fillFormDocumentForm(item) {
    fillManagedDocumentForm({
        item,
        fields: formDocumentFields,
        currentFileElement: formDocumentCurrentFile,
        editorTitle: formDocumentEditorTitle,
        editorTitleText: "서식 수정",
        deleteButton: deleteFormDocumentButton,
        resetProgress: formDocumentProgress.reset
    });
}

function resetFormDocumentForm() {
    resetManagedDocumentForm({
        fields: formDocumentFields,
        defaultCategory: "증빙 양식",
        currentFileElement: formDocumentCurrentFile,
        currentFileText: "새 서식은 파일 선택이 필요합니다.",
        editorTitle: formDocumentEditorTitle,
        editorTitleText: "새 서식 업로드",
        deleteButton: deleteFormDocumentButton,
        resetProgress: formDocumentProgress.reset
    });
}

function fillManagedDocumentForm({ item, fields: targetFields, currentFileElement, editorTitle: targetTitle, editorTitleText, deleteButton: targetDeleteButton, resetProgress }) {
    targetFields.id.value = item.id;
    targetFields.title.value = item.title || "";
    if (targetFields.subtitle) targetFields.subtitle.value = item.subtitle || "";
    if (targetFields.description) targetFields.description.value = item.description || "";
    if (targetFields.icon) targetFields.icon.value = getDocumentIconClass(item);
    if (targetFields.category) targetFields.category.value = item.category || "";
    if (targetFields.date) targetFields.date.value = toDateInputValue(item.date);
    targetFields.status.value = item.status || "draft";
    targetFields.file.value = "";

    if (currentFileElement) {
        currentFileElement.textContent = item.fileName ? `현재 파일: ${item.fileName}` : "현재 저장된 파일이 없습니다.";
    }

    resetProgress();
    targetTitle.textContent = editorTitleText;
    targetDeleteButton?.classList.remove("d-none");
    targetFields.title.focus();
}

function resetManagedDocumentForm({ fields: targetFields, defaultCategory, currentFileElement, currentFileText, editorTitle: targetTitle, editorTitleText, deleteButton: targetDeleteButton, resetProgress }) {
    targetFields.id.value = "";
    targetFields.title.value = "";
    if (targetFields.subtitle) targetFields.subtitle.value = "";
    if (targetFields.description) targetFields.description.value = "";
    if (targetFields.icon) targetFields.icon.value = "bi-file-earmark-text";
    if (targetFields.category) targetFields.category.value = defaultCategory;
    if (targetFields.date) targetFields.date.value = getTodayDateInputValue();
    targetFields.status.value = "published";
    targetFields.file.value = "";

    if (currentFileElement) {
        currentFileElement.textContent = currentFileText;
    }

    resetProgress();
    targetTitle.textContent = editorTitleText;
    targetDeleteButton?.classList.add("d-none");
}

function getDocumentTypeLabel(type) {
    if (type === "regularAudit") return "정기 감사 자료";
    if (type === "minutes") return "회의록";

    return "감사보고서";
}

function parseDocumentKind(value) {
    if (value === "regularAudit") {
        return {
            type: "regularAudit",
            year: null,
            defaultCategory: "정기감사"
        };
    }

    if (value === "minutes") {
        return {
            type: "minutes",
            year: null,
            defaultCategory: "정기회의"
        };
    }

    const year = parseReportYear(value) || new Date().getFullYear();

    return {
        type: "report",
        year,
        defaultCategory: "정기회의"
    };
}

// Parses the year out of a "report-<year>" select value (not a date).
function parseReportYear(value) {
    return Number(String(value || "").match(/\d{4}/)?.[0]) || null;
}

function getDocumentKindValue(documentItem) {
    if (documentItem.type === "regularAudit") return "regularAudit";
    if (documentItem.type === "minutes") return "minutes";

    return `report-${documentItem.year || getYearFromDate(documentItem.date) || new Date().getFullYear()}`;
}

function getRuleDocuments() {
    return documents.filter(item => item.type === "rule");
}

function getRuleSlotDocument(category) {
    return sortDocuments(getRuleDocuments().filter(item => item.category === category))[0] || null;
}

function getFormDocuments() {
    return documents.filter(item => item.type === "form");
}

function getDocumentIconClass(item) {
    const icon = String(item.icon || "");

    if (ALLOWED_FORM_ICONS.has(icon)) return icon;

    return getFileIconClass(item.fileName || "");
}

function formatDocumentDate(value) {
    const inputValue = toDateInputValue(value);

    if (!inputValue) return value || "";

    return inputValue.replaceAll("-", ".");
}

function formatFileSize(size) {
    const byt