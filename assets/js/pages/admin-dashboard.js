import { auth } from "../firebase.js";
import { requireAdmin, logoutAdmin } from "../admin-auth.js";
import {
    createNotice,
    fetchAllNotices,
    formatDate,
    getFirebaseErrorMessage,
    removeNotice,
    updateNotice
} from "../notice-service.js?v=20260529-remove-import";
import {
    createFaq,
    fetchAllFaqs,
    removeFaq,
    updateFaq
} from "../faq-service.js?v=20260529-remove-faq-import";
import {
    createSchedule,
    fetchAllSchedules,
    formatSchedulePeriod,
    getScheduleColor,
    getScheduleCategoryLabel,
    removeSchedule,
    sortSchedules,
    updateSchedule
} from "../schedule-service.js?v=20260529-schedule-color";
import {
    createDocument,
    fetchAllDocuments,
    getFirebaseDocumentErrorMessage,
    removeDocument,
    sortDocuments,
    updateDocument
} from "../document-service.js?v=20260530-regular-audit";
import {
    createOrganizationMember,
    fetchAllOrganizationMembers,
    getFirebaseOrganizationErrorMessage,
    removeOrganizationMember,
    sortOrganizationMembers,
    updateOrganizationMember
} from "../organization-service.js?v=20260530-org-redesign";
import {
    createContributor,
    createContributorSection,
    fetchAllContributors,
    fetchAllContributorSections,
    getFirebaseContributorErrorMessage,
    removeContributor,
    removeContributorSection,
    sortContributors,
    sortContributorSections,
    updateContributor,
    updateContributorSection
} from "../contributor-service.js?v=20260530-contributors";
import {
    fetchGreetingForAdmin,
    getFirebaseGreetingErrorMessage,
    saveGreeting
} from "../greeting-service.js?v=20260530-greeting";

const loading = document.getElementById("admin-loading");
const app = document.getElementById("admin-app");
const email = document.getElementById("admin-user-email");
const logoutButton = document.getElementById("admin-logout-button");
const message = document.getElementById("admin-notice-message");
const topbarTitle = document.querySelector(".admin-topbar h1");
const viewLinks = document.querySelectorAll("[data-admin-view]");
const viewPanels = document.querySelectorAll("[data-admin-view-panel]");
const list = document.getElementById("admin-notice-list");
const form = document.getElementById("admin-notice-form");
const editorTitle = document.getElementById("admin-editor-title");
const newButton = document.getElementById("admin-new-notice");
const deleteButton = document.getElementById("admin-delete-notice");
const faqList = document.getElementById("admin-faq-list");
const faqForm = document.getElementById("admin-faq-form");
const faqEditorTitle = document.getElementById("admin-faq-editor-title");
const newFaqButton = document.getElementById("admin-new-faq");
const deleteFaqButton = document.getElementById("admin-delete-faq");
const scheduleList = document.getElementById("admin-schedule-list");
const scheduleForm = document.getElementById("admin-schedule-form");
const scheduleEditorTitle = document.getElementById("admin-schedule-editor-title");
const newScheduleButton = document.getElementById("admin-new-schedule");
const deleteScheduleButton = document.getElementById("admin-delete-schedule");
const greetingForm = document.getElementById("admin-greeting-form");
const greetingCurrentStatus = document.getElementById("admin-greeting-current-status");
const greetingCurrentTitle = document.getElementById("admin-greeting-current-title");
const greetingCurrentSignature = document.getElementById("admin-greeting-current-signature");
const organizationList = document.getElementById("admin-organization-list");
const organizationForm = document.getElementById("admin-organization-form");
const organizationEditorTitle = document.getElementById("admin-organization-editor-title");
const newOrganizationButton = document.getElementById("admin-new-organization-member");
const deleteOrganizationButton = document.getElementById("admin-delete-organization-member");
const contributorSectionList = document.getElementById("admin-contributor-section-list");
const contributorList = document.getElementById("admin-contributor-list");
const contributorSectionForm = document.getElementById("admin-contributor-section-form");
const contributorForm = document.getElementById("admin-contributor-form");
const contributorSectionEditorTitle = document.getElementById("admin-contributor-section-editor-title");
const contributorEditorTitle = document.getElementById("admin-contributor-editor-title");
const newContributorSectionButton = document.getElementById("admin-new-contributor-section");
const newContributorButton = document.getElementById("admin-new-contributor");
const deleteContributorSectionButton = document.getElementById("admin-delete-contributor-section");
const deleteContributorButton = document.getElementById("admin-delete-contributor");
const documentList = document.getElementById("admin-document-list");
const documentForm = document.getElementById("admin-document-form");
const documentEditorTitle = document.getElementById("admin-document-editor-title");
const newDocumentButton = document.getElementById("admin-new-document");
const deleteDocumentButton = document.getElementById("admin-delete-document");
const documentCurrentFile = document.getElementById("document-current-file");
const documentUploadProgress = document.getElementById("document-upload-progress");
const documentUploadProgressBar = documentUploadProgress?.querySelector(".progress-bar");
const ruleList = document.getElementById("admin-rule-list");
const ruleForm = document.getElementById("admin-rule-form");
const ruleEditorTitle = document.getElementById("admin-rule-editor-title");
const deleteRuleButton = document.getElementById("admin-delete-rule");
const ruleCurrentFile = document.getElementById("rule-current-file");
const ruleSlotLabel = document.getElementById("rule-slot-label");
const ruleUploadProgress = document.getElementById("rule-upload-progress");
const ruleUploadProgressBar = ruleUploadProgress?.querySelector(".progress-bar");
const formDocumentList = document.getElementById("admin-form-document-list");
const formDocumentForm = document.getElementById("admin-form-document-form");
const formDocumentEditorTitle = document.getElementById("admin-form-document-editor-title");
const newFormDocumentButton = document.getElementById("admin-new-form-document");
const deleteFormDocumentButton = document.getElementById("admin-delete-form-document");
const formDocumentCurrentFile = document.getElementById("form-document-current-file");
const formDocumentUploadProgress = document.getElementById("form-document-upload-progress");
const formDocumentUploadProgressBar = formDocumentUploadProgress?.querySelector(".progress-bar");

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
let faqs = [];
let schedules = [];
let greeting = null;
let organizationMembers = [];
let contributorSections = [];
let contributors = [];
let documents = [];

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

const faqFields = {
    id: document.getElementById("faq-id"),
    question: document.getElementById("faq-question"),
    order: document.getElementById("faq-order"),
    status: document.getElementById("faq-status"),
    answer: document.getElementById("faq-answer"),
    editor: document.getElementById("faq-editor")
};

const scheduleFields = {
    id: document.getElementById("schedule-id"),
    title: document.getElementById("schedule-title"),
    category: document.getElementById("schedule-category"),
    color: document.getElementById("schedule-color"),
    startDate: document.getElementById("schedule-start-date"),
    endDate: document.getElementById("schedule-end-date"),
    status: document.getElementById("schedule-status"),
    description: document.getElementById("schedule-description")
};

const greetingFields = {
    title: document.getElementById("greeting-title-input"),
    status: document.getElementById("greeting-status"),
    signatureTitle: document.getElementById("greeting-signature-title-input"),
    signatureName: document.getElementById("greeting-signature-name-input"),
    body: document.getElementById("greeting-body"),
    editor: document.getElementById("greeting-editor")
};

const organizationFields = {
    id: document.getElementById("organization-id"),
    name: document.getElementById("organization-name"),
    role: document.getElementById("organization-role"),
    team: document.getElementById("organization-team"),
    order: document.getElementById("organization-order"),
    department: document.getElementById("organization-department"),
    status: document.getElementById("organization-status")
};

const contributorSectionFields = {
    id: document.getElementById("contributor-section-id"),
    title: document.getElementById("contributor-section-title"),
    subtitle: document.getElementById("contributor-section-subtitle"),
    order: document.getElementById("contributor-section-order"),
    status: document.getElementById("contributor-section-status")
};

const contributorFields = {
    id: document.getElementById("contributor-id"),
    sectionId: document.getElementById("contributor-section"),
    name: document.getElementById("contributor-name"),
    role: document.getElementById("contributor-role"),
    dept: document.getElementById("contributor-dept"),
    order: document.getElementById("contributor-order"),
    status: document.getElementById("contributor-status")
};

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

requireAdmin({
    onAllowed: async ({ profile }) => {
        if (email) {
            email.textContent = profile.email || "";
        }

        loading?.classList.add("d-none");
        app?.classList.remove("d-none");

        resetForm();
        resetFaqForm();
        resetScheduleForm();
        resetGreetingForm();
        resetOrganizationForm();
        resetContributorSectionForm();
        resetContributorForm();
        resetDocumentForm();
        resetRuleForm();
        resetFormDocumentForm();
        await loadNotices();
        await loadFaqs();
        await loadSchedules();
        await loadGreeting();
        await loadOrganizationMembers();
        await loadContributors();
        await loadDocuments();
    }
});

logoutButton?.addEventListener("click", logoutAdmin);
newButton?.addEventListener("click", resetForm);
newFaqButton?.addEventListener("click", resetFaqForm);
newScheduleButton?.addEventListener("click", resetScheduleForm);
newOrganizationButton?.addEventListener("click", resetOrganizationForm);
newContributorSectionButton?.addEventListener("click", resetContributorSectionForm);
newContributorButton?.addEventListener("click", resetContributorForm);
newDocumentButton?.addEventListener("click", resetDocumentForm);
newFormDocumentButton?.addEventListener("click", resetFormDocumentForm);
viewLinks.forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        setAdminView(link.dataset.adminView, true);
    });
});
fields.editor?.addEventListener("input", syncEditorToTextarea);
fields.editor?.addEventListener("paste", handleEditorPaste);
faqFields.editor?.addEventListener("input", syncEditorToTextarea);
faqFields.editor?.addEventListener("paste", handleEditorPaste);
greetingFields.editor?.addEventListener("input", () => syncEditorToTextarea("greeting"));
greetingFields.editor?.addEventListener("paste", handleEditorPaste);

document.querySelectorAll("[data-editor-command]").forEach(button => {
    button.addEventListener("click", () => runEditorCommand(button));
});

setAdminView(getInitialView(), false);

faqForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const payload = readFaqForm();

    if (!payload.question || !payload.answerHtml) {
        showMessage("질문과 답변을 입력해주세요.", "danger");
        return;
    }

    setFaqFormBusy(true);

    try {
        await ensureFirestoreAuth();

        if (faqFields.id.value) {
            await updateFaq(faqFields.id.value, payload);
            showMessage("FAQ를 수정했습니다.", "success");
        } else {
            await createFaq(payload);
            showMessage("FAQ를 저장했습니다.", "success");
        }

        await loadFaqs();
        resetFaqForm();
    } catch (error) {
        console.error("FAQ save failed:", error);
        showMessage(`FAQ 저장에 실패했습니다. ${getFirebaseErrorMessage(error)}`, "danger", 12000);
    } finally {
        setFaqFormBusy(false);
    }
});

deleteFaqButton?.addEventListener("click", async () => {
    const id = faqFields.id.value;

    if (!id) return;
    if (!window.confirm("이 FAQ를 삭제할까요?")) return;

    setFaqFormBusy(true);

    try {
        await ensureFirestoreAuth();
        await removeFaq(id);
        showMessage("FAQ를 삭제했습니다.", "success");
        resetFaqForm();
        await loadFaqs();
    } catch (error) {
        console.error("FAQ delete failed:", error);
        showMessage(`FAQ 삭제에 실패했습니다. ${getFirebaseErrorMessage(error)}`, "danger", 12000);
    } finally {
        setFaqFormBusy(false);
    }
});

scheduleForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const payload = readScheduleForm();

    if (!payload.title || !payload.startDate) {
        showMessage("일정 제목과 시작일을 입력해주세요.", "danger");
        return;
    }

    if (payload.endDate < payload.startDate) {
        showMessage("종료일은 시작일보다 빠를 수 없습니다.", "danger");
        return;
    }

    setScheduleFormBusy(true);

    try {
        await ensureFirestoreAuth();

        if (scheduleFields.id.value) {
            await updateSchedule(scheduleFields.id.value, payload);
            showMessage("일정을 수정했습니다.", "success");
        } else {
            await createSchedule(payload);
            showMessage("일정을 저장했습니다.", "success");
        }

        await loadSchedules();
        resetScheduleForm();
    } catch (error) {
        console.error("Schedule save failed:", error);
        showMessage(`일정 저장에 실패했습니다. ${getFirebaseErrorMessage(error)}`, "danger", 12000);
    } finally {
        setScheduleFormBusy(false);
    }
});

deleteScheduleButton?.addEventListener("click", async () => {
    const id = scheduleFields.id.value;

    if (!id) return;
    if (!window.confirm("이 일정을 삭제할까요?")) return;

    setScheduleFormBusy(true);

    try {
        await ensureFirestoreAuth();
        await removeSchedule(id);
        showMessage("일정을 삭제했습니다.", "success");
        resetScheduleForm();
        await loadSchedules();
    } catch (error) {
        console.error("Schedule delete failed:", error);
        showMessage(`일정 삭제에 실패했습니다. ${getFirebaseErrorMessage(error)}`, "danger", 12000);
    } finally {
        setScheduleFormBusy(false);
    }
});

greetingForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const payload = readGreetingForm();

    if (!payload.title || !payload.bodyHtml) {
        showMessage("인사말 제목과 본문을 입력해주세요.", "danger");
        return;
    }

    setGreetingFormBusy(true);

    try {
        await ensureFirestoreAuth();
        await saveGreeting(payload);
        showMessage("인사말을 저장했습니다.", "success");
        await loadGreeting();
    } catch (error) {
        console.error("Greeting save failed:", error);
        showMessage(`인사말 저장에 실패했습니다. ${getFirebaseGreetingErrorMessage(error)}`, "danger", 12000);
    } finally {
        setGreetingFormBusy(false);
    }
});

organizationForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const payload = readOrganizationForm();

    if (!payload.name || !payload.team) {
        showMessage("조직원 이름과 소속 팀을 입력해주세요.", "danger");
        return;
    }

    setOrganizationFormBusy(true);

    try {
        await ensureFirestoreAuth();

        if (organizationFields.id.value) {
            await updateOrganizationMember(organizationFields.id.value, payload);
            showMessage("조직원을 수정했습니다.", "success");
        } else {
            await createOrganizationMember(payload);
            showMessage("조직원을 저장했습니다.", "success");
        }

        await loadOrganizationMembers();
        resetOrganizationForm();
    } catch (error) {
        console.error("Organization save failed:", error);
        showMessage(`조직원 저장에 실패했습니다. ${getFirebaseOrganizationErrorMessage(error)}`, "danger", 12000);
    } finally {
        setOrganizationFormBusy(false);
    }
});

deleteOrganizationButton?.addEventListener("click", async () => {
    const id = organizationFields.id.value;

    if (!id) return;
    if (!window.confirm("이 조직원을 삭제할까요?")) return;

    setOrganizationFormBusy(true);

    try {
        await ensureFirestoreAuth();
        await removeOrganizationMember(id);
        showMessage("조직원을 삭제했습니다.", "success");
        resetOrganizationForm();
        await loadOrganizationMembers();
    } catch (error) {
        console.error("Organization delete failed:", error);
        showMessage(`조직원 삭제에 실패했습니다. ${getFirebaseOrganizationErrorMessage(error)}`, "danger", 12000);
    } finally {
        setOrganizationFormBusy(false);
    }
});

contributorSectionForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const payload = readContributorSectionForm();

    if (!payload.title) {
        showMessage("섹션 제목을 입력해주세요.", "danger");
        return;
    }

    setContributorSectionFormBusy(true);

    try {
        await ensureFirestoreAuth();

        if (contributorSectionFields.id.value) {
            await updateContributorSection(contributorSectionFields.id.value, payload);
            showMessage("기여자 섹션을 수정했습니다.", "success");
        } else {
            await createContributorSection(payload);
            showMessage("기여자 섹션을 저장했습니다.", "success");
        }

        await loadContributors();
        resetContributorSectionForm();
    } catch (error) {
        console.error("Contributor section save failed:", error);
        showMessage(`기여자 섹션 저장에 실패했습니다. ${getFirebaseContributorErrorMessage(error)}`, "danger", 12000);
    } finally {
        setContributorSectionFormBusy(false);
    }
});

deleteContributorSectionButton?.addEventListener("click", async () => {
    const id = contributorSectionFields.id.value;

    if (!id) return;
    if (contributors.some(item => item.sectionId === id)) {
        showMessage("이 섹션에 속한 기여자를 먼저 삭제하거나 다른 섹션으로 옮겨주세요.", "danger", 8000);
        return;
    }
    if (!window.confirm("이 기여자 섹션을 삭제할까요?")) return;

    setContributorSectionFormBusy(true);

    try {
        await ensureFirestoreAuth();
        await removeContributorSection(id);
        showMessage("기여자 섹션을 삭제했습니다.", "success");
        resetContributorSectionForm();
        await loadContributors();
    } catch (error) {
        console.error("Contributor section delete failed:", error);
        showMessage(`기여자 섹션 삭제에 실패했습니다. ${getFirebaseContributorErrorMessage(error)}`, "danger", 12000);
    } finally {
        setContributorSectionFormBusy(false);
    }
});

contributorForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const payload = readContributorForm();

    if (!payload.sectionId || !payload.name) {
        showMessage("소속 섹션과 이름/단체명을 입력해주세요.", "danger");
        return;
    }

    setContributorFormBusy(true);

    try {
        await ensureFirestoreAuth();

        if (contributorFields.id.value) {
            await updateContributor(contributorFields.id.value, payload);
            showMessage("기여자를 수정했습니다.", "success");
        } else {
            await createContributor(payload);
            showMessage("기여자를 저장했습니다.", "success");
        }

        await loadContributors();
        resetContributorForm();
    } catch (error) {
        console.error("Contributor save failed:", error);
        showMessage(`기여자 저장에 실패했습니다. ${getFirebaseContributorErrorMessage(error)}`, "danger", 12000);
    } finally {
        setContributorFormBusy(false);
    }
});

deleteContributorButton?.addEventListener("click", async () => {
    const id = contributorFields.id.value;

    if (!id) return;
    if (!window.confirm("이 기여자를 삭제할까요?")) return;

    setContributorFormBusy(true);

    try {
        await ensureFirestoreAuth();
        await removeContributor(id);
        showMessage("기여자를 삭제했습니다.", "success");
        resetContributorForm();
        await loadContributors();
    } catch (error) {
        console.error("Contributor delete failed:", error);
        showMessage(`기여자 삭제에 실패했습니다. ${getFirebaseContributorErrorMessage(error)}`, "danger", 12000);
    } finally {
        setContributorFormBusy(false);
    }
});

documentForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const payload = readDocumentForm();
    const file = documentFields.file.files?.[0] || null;
    const previousDocument = documents.find(item => item.id === documentFields.id.value);

    if (!payload.title || !payload.date) {
        showMessage("문서 제목과 날짜를 입력해주세요.", "danger");
        return;
    }

    if (!documentFields.id.value && !file) {
        showMessage("새 문서를 업로드하려면 파일을 선택해주세요.", "danger");
        return;
    }

    setDocumentFormBusy(true);
    setUploadProgress(0);

    try {
        await ensureFirestoreAuth();

        if (documentFields.id.value) {
            await updateDocument(documentFields.id.value, payload, file, previousDocument, setUploadProgress);
            showMessage("문서를 수정했습니다.", "success");
        } else {
            await createDocument(payload, file, setUploadProgress);
            showMessage("문서를 업로드했습니다.", "success");
        }

        await loadDocuments();
        resetDocumentForm();
    } catch (error) {
        console.error("Document save failed:", error);
        showMessage(`문서 저장에 실패했습니다. ${getFirebaseDocumentErrorMessage(error)}`, "danger", 12000);
    } finally {
        setDocumentFormBusy(false);
    }
});

deleteDocumentButton?.addEventListener("click", async () => {
    const documentItem = documents.find(item => item.id === documentFields.id.value);

    if (!documentItem) return;
    if (!window.confirm("이 문서와 업로드된 파일을 삭제할까요?")) return;

    setDocumentFormBusy(true);

    try {
        await ensureFirestoreAuth();
        await removeDocument(documentItem);
        showMessage("문서를 삭제했습니다.", "success");
        resetDocumentForm();
        await loadDocuments();
    } catch (error) {
        console.error("Document delete failed:", error);
        showMessage(`문서 삭제에 실패했습니다. ${getFirebaseDocumentErrorMessage(error)}`, "danger", 12000);
    } finally {
        setDocumentFormBusy(false);
    }
});

ruleForm?.addEventListener("submit", async event => {
    event.preventDefault();
    await saveManagedDocument({
        type: "rule",
        fields: ruleFields,
        currentItems: getRuleDocuments(),
        reset: () => selectRuleSlot(ruleFields.category.value || "중앙감사 세칙"),
        reload: loadDocuments,
        setBusy: setRuleFormBusy,
        setProgress: setRuleUploadProgress,
        uniqueByCategory: true,
        deleteButton: deleteRuleButton,
        editorTitle: ruleEditorTitle,
        messages: {
            missingRequired: "세칙 제목과 날짜를 입력해주세요.",
            missingFile: "새 세칙을 업로드하려면 파일을 선택해주세요.",
            created: "세칙을 업로드했습니다.",
            updated: "세칙을 수정했습니다.",
            failed: "세칙 저장에 실패했습니다."
        }
    });
});

deleteRuleButton?.addEventListener("click", async () => {
    await deleteManagedDocument({
        item: getRuleDocuments().find(item => item.id === ruleFields.id.value),
        confirmMessage: "이 세칙 파일을 삭제할까요?",
        reset: resetRuleForm,
        reload: loadDocuments,
        setBusy: setRuleFormBusy,
        successMessage: "세칙을 삭제했습니다.",
        failedMessage: "세칙 삭제에 실패했습니다."
    });
});

formDocumentForm?.addEventListener("submit", async event => {
    event.preventDefault();
    await saveManagedDocument({
        type: "form",
        fields: formDocumentFields,
        currentItems: getFormDocuments(),
        reset: resetFormDocumentForm,
        reload: loadDocuments,
        setBusy: setFormDocumentFormBusy,
        setProgress: setFormDocumentUploadProgress,
        deleteButton: deleteFormDocumentButton,
        editorTitle: formDocumentEditorTitle,
        messages: {
            missingRequired: "서식 제목을 입력해주세요.",
            missingFile: "새 서식을 업로드하려면 파일을 선택해주세요.",
            created: "서식을 업로드했습니다.",
            updated: "서식을 수정했습니다.",
            failed: "서식 저장에 실패했습니다."
        }
    });
});

deleteFormDocumentButton?.addEventListener("click", async () => {
    await deleteManagedDocument({
        item: getFormDocuments().find(item => item.id === formDocumentFields.id.value),
        confirmMessage: "이 서식 파일을 삭제할까요?",
        reset: resetFormDocumentForm,
        reload: loadDocuments,
        setBusy: setFormDocumentFormBusy,
        successMessage: "서식을 삭제했습니다.",
        failedMessage: "서식 삭제에 실패했습니다."
    });
});

form?.addEventListener("submit", async event => {
    event.preventDefault();

    const payload = readForm();

    if (!payload.title || !payload.contentHtml) {
        showMessage("제목과 내용을 입력해주세요.", "danger");
        return;
    }

    setFormBusy(true);

    try {
        await ensureFirestoreAuth();

        if (fields.id.value) {
            await updateNotice(fields.id.value, payload);
            showMessage("공지사항을 수정했습니다.", "success");
        } else {
            await createNotice(payload);
            showMessage("공지사항을 저장했습니다.", "success");
        }

        await loadNotices();
        resetForm();
    } catch (error) {
        console.error("Notice save failed:", error);
        showMessage(`저장에 실패했습니다. ${getFirebaseErrorMessage(error)}`, "danger", 12000);
    } finally {
        setFormBusy(false);
    }
});

deleteButton?.addEventListener("click", async () => {
    const id = fields.id.value;

    if (!id) return;
    if (!window.confirm("이 공지사항을 삭제할까요?")) return;

    setFormBusy(true);

    try {
        await ensureFirestoreAuth();
        await removeNotice(id);
        showMessage("공지사항을 삭제했습니다.", "success");
        resetForm();
        await loadNotices();
    } catch (error) {
        console.error("Notice delete failed:", error);
        showMessage(`삭제에 실패했습니다. ${getFirebaseErrorMessage(error)}`, "danger", 12000);
    } finally {
        setFormBusy(false);
    }
});

async function loadNotices() {
    if (!list) return;

    list.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">공지사항을 불러오는 중입니다.</td></tr>`;

    try {
        notices = await fetchAllNotices();
        renderNoticeRows();
    } catch (error) {
        console.error("Admin notice load failed:", error);
        list.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">공지사항을 불러오지 못했습니다. ${escapeHtml(getFirebaseErrorMessage(error))}</td></tr>`;
    }
}

async function loadFaqs() {
    if (!faqList) return;

    faqList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">FAQ를 불러오는 중입니다.</td></tr>`;

    try {
        faqs = await fetchAllFaqs();
        renderFaqRows();
    } catch (error) {
        console.error("Admin FAQ load failed:", error);
        faqList.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">FAQ를 불러오지 못했습니다. ${escapeHtml(getFirebaseErrorMessage(error))}</td></tr>`;
    }
}

async function loadSchedules() {
    if (!scheduleList) return;

    scheduleList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">일정을 불러오는 중입니다.</td></tr>`;

    try {
        schedules = await fetchAllSchedules();
        renderScheduleRows();
    } catch (error) {
        console.error("Admin schedule load failed:", error);
        scheduleList.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">일정을 불러오지 못했습니다. ${escapeHtml(getFirebaseErrorMessage(error))}</td></tr>`;
    }
}

async function loadGreeting() {
    if (!greetingForm) return;

    setGreetingSummary(null, "불러오는 중");

    try {
        greeting = await fetchGreetingForAdmin();

        if (greeting) {
            fillGreetingForm(greeting);
            setGreetingSummary(greeting);
        } else {
            resetGreetingForm();
            setGreetingSummary(null, "저장된 인사말 없음");
        }
    } catch (error) {
        console.error("Admin greeting load failed:", error);
        setGreetingSummary(null, "불러오기 실패");
        showMessage(`인사말을 불러오지 못했습니다. ${getFirebaseGreetingErrorMessage(error)}`, "danger", 12000);
    }
}

async function loadOrganizationMembers() {
    if (!organizationList) return;

    organizationList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">조직도를 불러오는 중입니다.</td></tr>`;

    try {
        organizationMembers = await fetchAllOrganizationMembers();
        renderOrganizationRows();
    } catch (error) {
        console.error("Admin organization load failed:", error);
        organizationList.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">조직도를 불러오지 못했습니다. ${escapeHtml(getFirebaseOrganizationErrorMessage(error))}</td></tr>`;
    }
}

async function loadContributors() {
    if (!contributorSectionList || !contributorList) return;

    contributorSectionList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">섹션을 불러오는 중입니다.</td></tr>`;
    contributorList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">기여자를 불러오는 중입니다.</td></tr>`;

    try {
        [contributorSections, contributors] = await Promise.all([
            fetchAllContributorSections(),
            fetchAllContributors()
        ]);
        renderContributorSectionOptions();
        renderContributorSectionRows();
        renderContributorRows();
    } catch (error) {
        console.error("Admin contributor load failed:", error);
        const messageText = `기여자를 불러오지 못했습니다. ${escapeHtml(getFirebaseContributorErrorMessage(error))}`;
        contributorSectionList.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">${messageText}</td></tr>`;
        contributorList.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">${messageText}</td></tr>`;
    }
}

async function loadDocuments() {
    if (!documentList) return;

    documentList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">문서를 불러오는 중입니다.</td></tr>`;

    try {
        documents = await fetchAllDocuments();
        renderDocumentRows();
        renderRuleRows();
        renderFormDocumentRows();
    } catch (error) {
        console.error("Admin document load failed:", error);
        const errorMessage = `문서를 불러오지 못했습니다. ${escapeHtml(getFirebaseDocumentErrorMessage(error))}`;
        const errorRow = `<tr><td colspan="4" class="text-center text-danger py-4">${errorMessage}</td></tr>`;
        if (documentList) documentList.innerHTML = errorRow;
        if (ruleList) ruleList.innerHTML = `<div class="text-center text-danger py-4">${errorMessage}</div>`;
        if (formDocumentList) formDocumentList.innerHTML = errorRow;
    }
}

function renderOrganizationRows() {
    if (!organizationList) return;

    organizationMembers = sortOrganizationMembers(organizationMembers);

    if (organizationMembers.length === 0) {
        organizationList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">저장된 조직원이 없습니다.</td></tr>`;
        return;
    }

    const groups = groupOrganizationMembersForAdmin(organizationMembers);

    organizationList.innerHTML = groups.map(group => `
        <tr class="admin-table-group-row">
            <td colspan="4">${escapeHtml(group.title)}</td>
        </tr>
        ${group.members.map(member => `
        <tr>
            <td>
                <span class="badge ${member.status === "published" ? "bg-success" : "bg-secondary"}">
                    ${member.status === "published" ? "게시" : "임시"}
                </span>
            </td>
            <td>
                <button type="button" class="admin-link-button" data-edit-organization-member="${escapeHtml(member.id)}">
                    ${escapeHtml(member.name || "이름 없음")}
                </button>
                <div class="text-muted small">${escapeHtml(member.role || "직책 없음")}</div>
            </td>
            <td class="text-muted">${escapeHtml(member.team || "중앙감사위원회")} · ${escapeHtml(member.order)}</td>
            <td class="text-end">
                <a class="btn btn-outline-dark btn-sm" href="/pages/intro/org.html" target="_blank" rel="noopener">
                    보기
                </a>
            </td>
        </tr>
        `).join("")}
    `).join("");

    organizationList.querySelectorAll("[data-edit-organization-member]").forEach(button => {
        button.addEventListener("click", () => {
            const member = organizationMembers.find(item => item.id === button.dataset.editOrganizationMember);

            if (member) fillOrganizationForm(member);
        });
    });
}

function groupOrganizationMembersForAdmin(members) {
    const sortedMembers = [...members].sort(compareOrganizationMembersForAdmin);
    const chairMembers = sortedMembers.filter(isOrganizationChair);
    const teamMap = new Map();

    sortedMembers
        .filter(member => !isOrganizationChair(member))
        .forEach(member => {
            const team = member.team || "중앙감사위원회";

            if (!teamMap.has(team)) {
                teamMap.set(team, []);
            }

            teamMap.get(team).push(member);
        });

    const teamGroups = Array.from(teamMap, ([title, groupMembers]) => ({
        title,
        members: groupMembers
    })).sort((a, b) => getOrganizationTeamRank(a.title) - getOrganizationTeamRank(b.title) || a.title.localeCompare(b.title, "ko"));

    return [
        ...(chairMembers.length > 0 ? [{ title: "위원장", members: chairMembers }] : []),
        ...teamGroups
    ];
}

function compareOrganizationMembersForAdmin(a, b) {
    const orderCompare = Number(a.order || 0) - Number(b.order || 0);

    if (orderCompare !== 0) return orderCompare;

    return String(a.name || "").localeCompare(String(b.name || ""), "ko");
}

function getOrganizationTeamRank(team) {
    const auditTeam = String(team || "").match(/감사\s*(\d+)\s*팀/);

    if (auditTeam) return Number(auditTeam[1]);
    if (String(team || "").includes("위원단")) return 90;

    return 50;
}

function isOrganizationChair(member) {
    const role = normalizeOrganizationText(member.role);
    const team = normalizeOrganizationText(member.team);

    return (role.includes("위원장") && !role.includes("부위원장")) || team === "위원장";
}

function normalizeOrganizationText(value) {
    return String(value || "").replace(/\s+/g, "");
}

function renderContributorSectionRows() {
    if (!contributorSectionList) return;

    contributorSections = sortContributorSections(contributorSections);

    if (contributorSections.length === 0) {
        contributorSectionList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">저장된 섹션이 없습니다.</td></tr>`;
        return;
    }

    contributorSectionList.innerHTML = contributorSections.map(section => `
        <tr>
            <td>
                <span class="badge ${section.status === "published" ? "bg-success" : "bg-secondary"}">
                    ${section.status === "published" ? "게시" : "임시"}
                </span>
            </td>
            <td>
                <button type="button" class="admin-link-button" data-edit-contributor-section="${escapeHtml(section.id)}">
                    ${escapeHtml(section.title || "제목 없음")}
                </button>
                <div class="text-muted small">${escapeHtml(section.subtitle || "부제목 없음")}</div>
            </td>
            <td class="text-muted">${escapeHtml(section.order)}</td>
            <td class="text-end">
                <a class="btn btn-outline-dark btn-sm" href="/pages/intro/contributor.html" target="_blank" rel="noopener">보기</a>
            </td>
        </tr>
    `).join("");

    contributorSectionList.querySelectorAll("[data-edit-contributor-section]").forEach(button => {
        button.addEventListener("click", () => {
            const section = contributorSections.find(item => item.id === button.dataset.editContributorSection);

            if (section) fillContributorSectionForm(section);
        });
    });
}

function renderContributorRows() {
    if (!contributorList) return;

    contributors = sortContributors(contributors);

    if (contributors.length === 0) {
        contributorList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">저장된 기여자가 없습니다.</td></tr>`;
        return;
    }

    const groups = sortContributorSections(contributorSections)
        .map(section => ({
            section,
            items: sortContributors(contributors.filter(item => item.sectionId === section.id))
        }))
        .filter(group => group.items.length > 0);
    const orphanItems = sortContributors(contributors.filter(item => !contributorSections.some(section => section.id === item.sectionId)));

    contributorList.innerHTML = `
        ${groups.map(group => `
            <tr class="admin-table-group-row">
                <td colspan="4">${escapeHtml(group.section.title)}</td>
            </tr>
            ${group.items.map(item => renderContributorRow(item)).join("")}
        `).join("")}
        ${orphanItems.length > 0 ? `
            <tr class="admin-table-group-row">
                <td colspan="4">미분류</td>
            </tr>
            ${orphanItems.map(item => renderContributorRow(item)).join("")}
        ` : ""}
    `;

    contributorList.querySelectorAll("[data-edit-contributor]").forEach(button => {
        button.addEventListener("click", () => {
            const contributor = contributors.find(item => item.id === button.dataset.editContributor);

            if (contributor) fillContributorForm(contributor);
        });
    });
}

function renderContributorRow(item) {
    const section = contributorSections.find(sectionItem => sectionItem.id === item.sectionId);

    return `
        <tr>
            <td>
                <span class="badge ${item.status === "published" ? "bg-success" : "bg-secondary"}">
                    ${item.status === "published" ? "게시" : "임시"}
                </span>
            </td>
            <td>
                <button type="button" class="admin-link-button" data-edit-contributor="${escapeHtml(item.id)}">
                    ${escapeHtml(item.name || "이름 없음")}
                </button>
                <div class="text-muted small">${escapeHtml(item.role || "역할 없음")} · ${escapeHtml(item.dept || "소속 없음")}</div>
            </td>
            <td class="text-muted">${escapeHtml(section?.title || "미분류")} · ${escapeHtml(item.order)}</td>
            <td class="text-end">
                <a class="btn btn-outline-dark btn-sm" href="/pages/intro/contributor.html" target="_blank" rel="noopener">보기</a>
            </td>
        </tr>
    `;
}

function renderContributorSectionOptions() {
    if (!contributorFields.sectionId) return;

    const currentValue = contributorFields.sectionId.value;
    const sortedSections = sortContributorSections(contributorSections);

    contributorFields.sectionId.innerHTML = sortedSections.length > 0
        ? sortedSections.map(section => `<option value="${escapeHtml(section.id)}">${escapeHtml(section.title || "제목 없음")}</option>`).join("")
        : `<option value="">먼저 섹션을 만들어주세요</option>`;

    if (sortedSections.some(section => section.id === currentValue)) {
        contributorFields.sectionId.value = currentValue;
    }
}

function renderNoticeRows() {
    if (!list) return;

    if (notices.length === 0) {
        list.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">저장된 공지사항이 없습니다.</td></tr>`;
        return;
    }

    list.innerHTML = notices.map(notice => `
        <tr>
            <td>
                <span class="badge ${notice.status === "published" ? "bg-success" : "bg-secondary"}">
                    ${notice.status === "published" ? "게시" : "임시"}
                </span>
            </td>
            <td>
                <button type="button" class="admin-link-button" data-edit-notice="${escapeHtml(notice.id)}">
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

    list.querySelectorAll("[data-edit-notice]").forEach(button => {
        button.addEventListener("click", () => {
            const notice = notices.find(item => item.id === button.dataset.editNotice);

            if (notice) fillForm(notice);
        });
    });
}

function renderFaqRows() {
    if (!faqList) return;

    if (faqs.length === 0) {
        faqList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">저장된 FAQ가 없습니다.</td></tr>`;
        return;
    }

    faqList.innerHTML = faqs.map(faq => `
        <tr>
            <td>
                <span class="badge ${faq.status === "published" ? "bg-success" : "bg-secondary"}">
                    ${faq.status === "published" ? "게시" : "임시"}
                </span>
            </td>
            <td>
                <button type="button" class="admin-link-button" data-edit-faq="${escapeHtml(faq.id)}">
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

    faqList.querySelectorAll("[data-edit-faq]").forEach(button => {
        button.addEventListener("click", () => {
            const faq = faqs.find(item => item.id === button.dataset.editFaq);

            if (faq) fillFaqForm(faq);
        });
    });
}

function renderScheduleRows() {
    if (!scheduleList) return;

    schedules = sortSchedules(schedules);

    if (schedules.length === 0) {
        scheduleList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">저장된 일정이 없습니다.</td></tr>`;
        return;
    }

    scheduleList.innerHTML = schedules.map(schedule => `
        <tr>
            <td>
                <span class="badge ${schedule.status === "published" ? "bg-success" : "bg-secondary"}">
                    ${schedule.status === "published" ? "게시" : "임시"}
                </span>
            </td>
            <td>
                <button type="button" class="admin-link-button" data-edit-schedule="${escapeHtml(schedule.id)}">
                    ${escapeHtml(schedule.title || "제목 없음")}
                </button>
                <div class="admin-schedule-category text-muted small">
                    <span class="admin-color-swatch" style="background-color: ${escapeHtml(getScheduleColor(schedule.color))};"></span>
                    ${escapeHtml(getScheduleCategoryLabel(schedule.category))}
                </div>
            </td>
            <td class="text-muted">${escapeHtml(formatSchedulePeriod(schedule))}</td>
            <td class="text-end">
                <a class="btn btn-outline-dark btn-sm" href="/pages/intro/schedule.html" target="_blank" rel="noopener">
                    보기
                </a>
            </td>
        </tr>
    `).join("");

    scheduleList.querySelectorAll("[data-edit-schedule]").forEach(button => {
        button.addEventListener("click", () => {
            const schedule = schedules.find(item => item.id === button.dataset.editSchedule);

            if (schedule) fillScheduleForm(schedule);
        });
    });
}

function renderDocumentRows() {
    if (!documentList) return;

    const managedDocuments = sortDocuments(documents.filter(item => item.type === "regularAudit" || item.type === "minutes" || item.type === "report"));

    if (managedDocuments.length === 0) {
        documentList.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">저장된 문서가 없습니다.</td></tr>`;
        return;
    }

    const groups = [
        {
            title: "정기 감사 자료",
            items: managedDocuments.filter(item => item.type === "regularAudit")
        },
        {
            title: "회의록",
            items: managedDocuments.filter(item => item.type === "minutes")
        },
        {
            title: "2025년 감사보고서",
            items: managedDocuments.filter(item => item.type === "report" && item.year === 2025)
        },
        {
            title: "2026년 감사보고서",
            items: managedDocuments.filter(item => item.type === "report" && item.year === 2026)
        },
        {
            title: "기타 문서",
            items: managedDocuments.filter(item => item.type !== "regularAudit" && item.type !== "minutes" && !(item.type === "report" && (item.year === 2025 || item.year === 2026)))
        }
    ].filter(group => group.items.length > 0);

    documentList.innerHTML = groups.map(group => `
        <tr class="admin-table-group-row">
            <td colspan="4">${escapeHtml(group.title)}</td>
        </tr>
        ${group.items.map(item => `
        <tr>
            <td>
                <span class="badge ${item.status === "published" ? "bg-success" : "bg-secondary"}">
                    ${item.status === "published" ? "게시" : "임시"}
                </span>
            </td>
            <td>
                <button type="button" class="admin-link-button" data-edit-document="${escapeHtml(item.id)}">
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

    documentList.querySelectorAll("[data-edit-document]").forEach(button => {
        button.addEventListener("click", () => {
            const documentItem = documents.find(item => item.id === button.dataset.editDocument);

            if (documentItem) fillDocumentForm(documentItem);
        });
    });
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
                    <button type="button" class="btn btn-outline-dark btn-sm" data-select-rule-slot="${escapeHtml(slot.category)}">
                        ${item ? "교체" : "업로드"}
                    </button>
                </div>
            </article>
        `;
    }).join("");

    ruleList.querySelectorAll("[data-select-rule-slot]").forEach(button => {
        button.addEventListener("click", () => {
            selectRuleSlot(button.dataset.selectRuleSlot);
        });
    });
}

function renderFormDocumentRows() {
    renderManagedDocumentRows({
        listElement: formDocumentList,
        items: getFormDocuments(),
        emptyText: "저장된 서식이 없습니다.",
        editAttribute: "edit-form-document",
        datasetKey: "editFormDocument",
        fill: fillFormDocumentForm
    });
}

function renderManagedDocumentRows({ listElement, items, emptyText, editAttribute, datasetKey, fill }) {
    if (!listElement) return;

    const sortedItems = sortDocuments(items);

    if (sortedItems.length === 0) {
        listElement.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">${emptyText}</td></tr>`;
        return;
    }

    listElement.innerHTML = sortedItems.map(item => `
        <tr>
            <td>
                <span class="badge ${item.status === "published" ? "bg-success" : "bg-secondary"}">
                    ${item.status === "published" ? "게시" : "임시"}
                </span>
            </td>
            <td>
                <i class="bi ${escapeHtml(getFormIconClass(item))} text-primary" style="font-size: 1.35rem;"></i>
            </td>
            <td>
                <button type="button" class="admin-link-button" data-${editAttribute}="${escapeHtml(item.id)}">
                    ${escapeHtml(item.title || "제목 없음")}
                </button>
                <div class="text-muted small">${escapeHtml(item.fileName || "파일")}</div>
            </td>
            <td class="text-end">
                <span class="text-muted small">${escapeHtml(formatFileSize(item.fileSize))}</span>
            </td>
        </tr>
    `).join("");

    listElement.querySelectorAll(`[data-${editAttribute}]`).forEach(button => {
        button.addEventListener("click", () => {
            const item = sortedItems.find(documentItem => documentItem.id === button.dataset[datasetKey]);

            if (item) fill(item);
        });
    });
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

function readFaqForm() {
    syncEditorToTextarea("faq");

    return {
        question: faqFields.question.value.trim(),
        order: faqFields.order.value,
        status: faqFields.status.value,
        answerHtml: faqFields.answer.value.trim()
    };
}

function readScheduleForm() {
    return {
        title: scheduleFields.title.value.trim(),
        category: scheduleFields.category.value.trim(),
        color: scheduleFields.color.value,
        startDate: scheduleFields.startDate.value,
        endDate: scheduleFields.endDate.value || scheduleFields.startDate.value,
        status: scheduleFields.status.value,
        description: scheduleFields.description.value.trim()
    };
}

function readGreetingForm() {
    syncEditorToTextarea("greeting");

    return {
        title: greetingFields.title.value.trim(),
        bodyHtml: greetingFields.body.value.trim(),
        signatureTitle: greetingFields.signatureTitle.value.trim(),
        signatureName: greetingFields.signatureName.value.trim(),
        status: greetingFields.status.value,
        createdAt: greeting?.createdAt || null
    };
}

function readOrganizationForm() {
    return {
        name: organizationFields.name.value.trim(),
        role: organizationFields.role.value.trim(),
        team: organizationFields.team.value.trim(),
        order: organizationFields.order.value,
        department: organizationFields.department.value.trim(),
        status: organizationFields.status.value
    };
}

function readContributorSectionForm() {
    return {
        title: contributorSectionFields.title.value.trim(),
        subtitle: contributorSectionFields.subtitle.value.trim(),
        order: contributorSectionFields.order.value,
        status: contributorSectionFields.status.value
    };
}

function readContributorForm() {
    return {
        sectionId: contributorFields.sectionId.value,
        role: contributorFields.role.value.trim(),
        name: contributorFields.name.value.trim(),
        dept: contributorFields.dept.value.trim(),
        order: contributorFields.order.value,
        status: contributorFields.status.value
    };
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

function fillScheduleForm(schedule) {
    scheduleFields.id.value = schedule.id;
    scheduleFields.title.value = schedule.title || "";
    scheduleFields.category.value = getScheduleCategoryLabel(schedule.category);
    scheduleFields.color.value = getScheduleColor(schedule.color || schedule.category);
    scheduleFields.startDate.value = schedule.startDate || "";
    scheduleFields.endDate.value = schedule.endDate || schedule.startDate || "";
    scheduleFields.status.value = schedule.status || "draft";
    scheduleFields.description.value = schedule.description || "";

    scheduleEditorTitle.textContent = "일정 수정";
    deleteScheduleButton?.classList.remove("d-none");
    scheduleFields.title.focus();
}

function fillGreetingForm(nextGreeting) {
    greetingFields.title.value = nextGreeting.title || "";
    greetingFields.status.value = nextGreeting.status || "draft";
    greetingFields.signatureTitle.value = nextGreeting.signatureTitle || "";
    greetingFields.signatureName.value = nextGreeting.signatureName || "";
    setEditorHtml("greeting", nextGreeting.bodyHtml || "");
}

function fillOrganizationForm(member) {
    organizationFields.id.value = member.id;
    organizationFields.name.value = member.name || "";
    organizationFields.role.value = member.role || "";
    organizationFields.team.value = member.team || "";
    organizationFields.order.value = member.order || 0;
    organizationFields.department.value = member.department || "";
    organizationFields.status.value = member.status || "draft";

    organizationEditorTitle.textContent = "조직원 수정";
    deleteOrganizationButton?.classList.remove("d-none");
    organizationFields.name.focus();
}

function fillContributorSectionForm(section) {
    contributorSectionFields.id.value = section.id;
    contributorSectionFields.title.value = section.title || "";
    contributorSectionFields.subtitle.value = section.subtitle || "";
    contributorSectionFields.order.value = section.order || 0;
    contributorSectionFields.status.value = section.status || "draft";

    contributorSectionEditorTitle.textContent = "섹션 수정";
    deleteContributorSectionButton?.classList.remove("d-none");
    contributorSectionFields.title.focus();
}

function fillContributorForm(contributor) {
    contributorFields.id.value = contributor.id;
    contributorFields.sectionId.value = contributor.sectionId || contributorSections[0]?.id || "";
    contributorFields.role.value = contributor.role || "";
    contributorFields.name.value = contributor.name || "";
    contributorFields.dept.value = contributor.dept || "";
    contributorFields.order.value = contributor.order || 0;
    contributorFields.status.value = contributor.status || "draft";

    contributorEditorTitle.textContent = "기여자 수정";
    deleteContributorButton?.classList.remove("d-none");
    contributorFields.name.focus();
}

function fillDocumentForm(documentItem) {
    documentFields.id.value = documentItem.id;
    documentFields.title.value = documentItem.title || "";
    documentFields.type.value = getDocumentKindValue(documentItem);
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

    resetUploadProgress();
    documentEditorTitle.textContent = "문서 수정";
    deleteDocumentButton?.classList.remove("d-none");
    documentFields.title.focus();
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

function resetFaqForm() {
    faqForm?.reset();

    faqFields.id.value = "";
    faqFields.order.value = faqs.length + 1;
    faqFields.status.value = "published";
    setEditorHtml("faq", "");

    faqEditorTitle.textContent = "새 FAQ 작성";
    deleteFaqButton?.classList.add("d-none");
}

function resetScheduleForm() {
    scheduleForm?.reset();

    scheduleFields.id.value = "";
    scheduleFields.category.value = "정기감사";
    scheduleFields.color.value = "#50b9b9";
    scheduleFields.startDate.value = getTodayDateInputValue();
    scheduleFields.endDate.value = getTodayDateInputValue();
    scheduleFields.status.value = "published";
    scheduleFields.description.value = "";

    scheduleEditorTitle.textContent = "새 일정 작성";
    deleteScheduleButton?.classList.add("d-none");
}

function resetGreetingForm() {
    greetingForm?.reset();

    greetingFields.title.value = "";
    greetingFields.status.value = "published";
    greetingFields.signatureTitle.value = "";
    greetingFields.signatureName.value = "";
    setEditorHtml("greeting", "");
}

function resetOrganizationForm() {
    organizationForm?.reset();

    organizationFields.id.value = "";
    organizationFields.team.value = "";
    organizationFields.order.value = organizationMembers.length + 1;
    organizationFields.status.value = "published";

    organizationEditorTitle.textContent = "새 조직원 작성";
    deleteOrganizationButton?.classList.add("d-none");
}

function resetContributorSectionForm() {
    contributorSectionForm?.reset();

    contributorSectionFields.id.value = "";
    contributorSectionFields.order.value = contributorSections.length + 1;
    contributorSectionFields.status.value = "published";

    contributorSectionEditorTitle.textContent = "새 섹션 작성";
    deleteContributorSectionButton?.classList.add("d-none");
}

function resetContributorForm() {
    contributorForm?.reset();

    contributorFields.id.value = "";
    contributorFields.sectionId.value = contributorSections[0]?.id || "";
    contributorFields.order.value = contributors.length + 1;
    contributorFields.status.value = "published";

    contributorEditorTitle.textContent = "새 기여자 작성";
    deleteContributorButton?.classList.add("d-none");
}

function resetDocumentForm() {
    documentForm?.reset();

    documentFields.id.value = "";
    documentFields.type.value = "regularAudit";
    documentFields.date.value = getTodayDateInputValue();
    documentFields.category.value = "제출 가이드";
    documentFields.status.value = "published";
    documentFields.important.checked = false;

    if (documentCurrentFile) {
        documentCurrentFile.textContent = "새 문서는 파일 선택이 필요합니다.";
    }

    resetUploadProgress();
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
        resetProgress: resetRuleUploadProgress
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
        resetProgress: resetRuleUploadProgress
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
        resetProgress: resetFormDocumentUploadProgress
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
        resetProgress: resetFormDocumentUploadProgress
    });
}

function fillManagedDocumentForm({ item, fields: targetFields, currentFileElement, editorTitle: targetTitle, editorTitleText, deleteButton: targetDeleteButton, resetProgress }) {
    targetFields.id.value = item.id;
    targetFields.title.value = item.title || "";
    if (targetFields.subtitle) targetFields.subtitle.value = item.subtitle || "";
    if (targetFields.description) targetFields.description.value = item.description || "";
    if (targetFields.icon) targetFields.icon.value = getFormIconClass(item);
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

function setFormBusy(isBusy) {
    form?.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = isBusy;
    });

    if (newButton) newButton.disabled = isBusy;
    if (fields.editor) fields.editor.contentEditable = String(!isBusy);
}

function setFaqFormBusy(isBusy) {
    faqForm?.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = isBusy;
    });

    if (newFaqButton) newFaqButton.disabled = isBusy;
    if (faqFields.editor) faqFields.editor.contentEditable = String(!isBusy);
}

function setScheduleFormBusy(isBusy) {
    scheduleForm?.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = isBusy;
    });

    if (newScheduleButton) newScheduleButton.disabled = isBusy;
}

function setGreetingFormBusy(isBusy) {
    greetingForm?.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = isBusy;
    });

    if (greetingFields.editor) greetingFields.editor.contentEditable = String(!isBusy);
}

function setOrganizationFormBusy(isBusy) {
    organizationForm?.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = isBusy;
    });

    if (newOrganizationButton) newOrganizationButton.disabled = isBusy;
}

function setContributorSectionFormBusy(isBusy) {
    contributorSectionForm?.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = isBusy;
    });

    if (newContributorSectionButton) newContributorSectionButton.disabled = isBusy;
}

function setContributorFormBusy(isBusy) {
    contributorForm?.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = isBusy;
    });

    if (newContributorButton) newContributorButton.disabled = isBusy;
}

function setDocumentFormBusy(isBusy) {
    documentForm?.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = isBusy;
    });

    if (newDocumentButton) newDocumentButton.disabled = isBusy;
}

function setRuleFormBusy(isBusy) {
    ruleForm?.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = isBusy;
    });
    ruleList?.querySelectorAll("button").forEach(element => {
        element.disabled = isBusy;
    });
}

function setFormDocumentFormBusy(isBusy) {
    formDocumentForm?.querySelectorAll("input, select, textarea, button").forEach(element => {
        element.disabled = isBusy;
    });

    if (newFormDocumentButton) newFormDocumentButton.disabled = isBusy;
}

documentFields.type?.addEventListener("change", () => {
    const kind = parseDocumentKind(documentFields.type.value);
    const currentCategory = documentFields.category.value.trim();

    if (!currentCategory || currentCategory === "정기회의" || currentCategory === "정기감사") {
        documentFields.category.value = kind.defaultCategory;
    }
});

function showMessage(text, type = "success", duration = 5000) {
    if (!message) return;

    message.textContent = text;
    message.className = `admin-alert admin-alert-${type}`;
    message.classList.remove("d-none");

    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
        message.classList.add("d-none");
    }, duration);
}

function getInitialView() {
    const hash = window.location.hash.replace("#", "");

    if (hash === "faqs" || hash === "schedules" || hash === "greeting" || hash === "organization" || hash === "contributors" || hash === "documents" || hash === "rules" || hash === "forms") return hash;

    return "notices";
}

function setAdminView(view, updateHash) {
    const nextView = view === "faqs" || view === "schedules" || view === "greeting" || view === "organization" || view === "contributors" || view === "documents" || view === "rules" || view === "forms" ? view : "notices";
    const titleMap = {
        notices: "공지 관리",
        faqs: "FAQ 관리",
        schedules: "일정 관리",
        greeting: "인사말 관리",
        organization: "조직도 관리",
        contributors: "기여자 관리",
        documents: "문서 관리",
        rules: "세칙 관리",
        forms: "서식 관리"
    };

    viewPanels.forEach(panel => {
        panel.classList.toggle("d-none", panel.dataset.adminViewPanel !== nextView);
    });

    viewLinks.forEach(link => {
        link.classList.toggle("active", link.dataset.adminView === nextView);
    });

    if (topbarTitle) {
        topbarTitle.textContent = titleMap[nextView];
    }

    if (updateHash) {
        window.history.replaceState(null, "", `#${nextView}`);
    }
}

async function ensureFirestoreAuth() {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("현재 로그인 세션을 찾지 못했습니다. 로그아웃 후 다시 로그인해주세요.");
    }

    await user.getIdToken();
}

function getTodayDateInputValue() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function setUploadProgress(progress) {
    if (!documentUploadProgress || !documentUploadProgressBar) return;

    documentUploadProgress.classList.remove("d-none");
    documentUploadProgressBar.style.width = `${progress}%`;
    documentUploadProgressBar.textContent = `${progress}%`;
}

function resetUploadProgress() {
    if (!documentUploadProgress || !documentUploadProgressBar) return;

    documentUploadProgress.classList.add("d-none");
    documentUploadProgressBar.style.width = "0%";
    documentUploadProgressBar.textContent = "0%";
}

function setRuleUploadProgress(progress) {
    setGenericUploadProgress(ruleUploadProgress, ruleUploadProgressBar, progress);
}

function resetRuleUploadProgress() {
    resetGenericUploadProgress(ruleUploadProgress, ruleUploadProgressBar);
}

function setFormDocumentUploadProgress(progress) {
    setGenericUploadProgress(formDocumentUploadProgress, formDocumentUploadProgressBar, progress);
}

function resetFormDocumentUploadProgress() {
    resetGenericUploadProgress(formDocumentUploadProgress, formDocumentUploadProgressBar);
}

function setGenericUploadProgress(progressElement, progressBar, progress) {
    if (!progressElement || !progressBar) return;

    progressElement.classList.remove("d-none");
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${progress}%`;
}

function resetGenericUploadProgress(progressElement, progressBar) {
    if (!progressElement || !progressBar) return;

    progressElement.classList.add("d-none");
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
}

function formatDocumentDate(value) {
    const inputValue = toDateInputValue(value);

    if (!inputValue) return value || "";

    return inputValue.replaceAll("-", ".");
}

function toDateInputValue(value) {
    const parts = String(value || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);

    if (!parts) return "";

    return `${parts[1]}-${String(parts[2]).padStart(2, "0")}-${String(parts[3]).padStart(2, "0")}`;
}

function getYearFromDate(value) {
    return Number(String(value || "").match(/\d{4}/)?.[0]) || null;
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
            defaultCategory: "제출 가이드"
        };
    }

    if (value === "minutes") {
        return {
            type: "minutes",
            year: null,
            defaultCategory: "정기회의"
        };
    }

    const year = Number(String(value || "").match(/\d{4}/)?.[0]) || new Date().getFullYear();

    return {
        type: "report",
        year,
        defaultCategory: "정기감사"
    };
}

function getDocumentKindValue(documentItem) {
    if (documentItem.type === "regularAudit") return "regularAudit";
    if (documentItem.type === "minutes") return "minutes";

    return `report-${documentItem.year || getYearFromDate(documentItem.date) || new Date().getFullYear()}`;
}

async function saveManagedDocument({ type, fields: targetFields, currentItems, reset, reload, setBusy, setProgress, uniqueByCategory = false, messages }) {
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

    if (!payload.title || !payload.date) {
        showMessage(messages.missingRequired, "danger");
        return;
    }

    if (!documentId && !file) {
        showMessage(messages.missingFile, "danger");
        return;
    }

    setBusy(true);
    setProgress(0);

    try {
        await ensureFirestoreAuth();

        if (documentId) {
            await updateDocument(documentId, payload, file, previousDocument, setProgress);
            showMessage(messages.updated, "success");
        } else {
            await createDocument(payload, file, setProgress);
            showMessage(messages.created, "success");
        }

        await reload();
        reset();
    } catch (error) {
        console.error("Managed document save failed:", error);
        showMessage(`${messages.failed} ${getFirebaseDocumentErrorMessage(error)}`, "danger", 12000);
    } finally {
        setBusy(false);
    }
}

async function deleteManagedDocument({ item, confirmMessage, reset, reload, setBusy, successMessage, failedMessage }) {
    if (!item) return;
    if (!window.confirm(confirmMessage)) return;

    setBusy(true);

    try {
        await ensureFirestoreAuth();
        await removeDocument(item);
        showMessage(successMessage, "success");
        reset();
        await reload();
    } catch (error) {
        console.error("Managed document delete failed:", error);
        showMessage(`${failedMessage} ${getFirebaseDocumentErrorMessage(error)}`, "danger", 12000);
    } finally {
        setBusy(false);
    }
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

function getFormIconClass(item) {
    const icon = String(item.icon || "");
    const allowedIcons = new Set([
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

    if (allowedIcons.has(icon)) return icon;

    const fileName = String(item.fileName || "").toLowerCase();
    const contentType = String(item.contentType || "").toLowerCase();

    if (fileName.endsWith(".pdf") || contentType.includes("pdf")) return "bi-file-earmark-pdf";
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx") || contentType.includes("word")) return "bi-file-earmark-word";

    return "bi-file-earmark-text";
}

function formatFileSize(size) {
    const bytes = Number(size || 0);

    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;

    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function setGreetingSummary(nextGreeting, fallbackStatus = "-") {
    if (greetingCurrentStatus) {
        greetingCurrentStatus.textContent = nextGreeting
            ? nextGreeting.status === "published" ? "게시" : "임시저장"
            : fallbackStatus;
    }

    if (greetingCurrentTitle) {
        greetingCurrentTitle.textContent = nextGreeting?.title || "-";
    }

    if (greetingCurrentSignature) {
        greetingCurrentSignature.textContent = [nextGreeting?.signatureTitle, nextGreeting?.signatureName]
            .filter(Boolean)
            .join(" ") || "-";
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function runEditorCommand(button) {
    const target = button.dataset.editorTarget || "notice";
    const editorFields = getEditorFields(target);

    if (!editorFields?.editor) return;

    editorFields.editor.focus();

    const command = button.dataset.editorCommand;
    let value = button.dataset.editorValue || null;

    if (command === "createLink") {
        value = window.prompt("연결할 주소를 입력하세요.");

        if (!value) return;

        if (!/^https?:\/\//i.test(value) && !value.startsWith("/")) {
            value = `https://${value}`;
        }
    }

    document.execCommand(command, false, value);
    syncEditorToTextarea(target);
}

function setEditorHtml(target, html) {
    const editorFields = getEditorFields(target);

    if (editorFields?.editor) {
        editorFields.editor.innerHTML = html || "";
    }

    if (editorFields?.textarea) {
        editorFields.textarea.value = html || "";
    }
}

function syncEditorToTextarea(target = "notice") {
    const editorFields = getEditorFields(target);

    if (!editorFields?.editor || !editorFields?.textarea) return;

    editorFields.textarea.value = normalizeEditorHtml(editorFields.editor.innerHTML);
}

function normalizeEditorHtml(html) {
    const trimmed = String(html || "").trim();

    if (!trimmed || trimmed === "<br>") return "";

    return trimmed;
}

function handleEditorPaste(event) {
    event.preventDefault();
    const editorId = event.currentTarget?.id;
    const target = editorId === "faq-editor"
        ? "faq"
        : editorId === "greeting-editor"
            ? "greeting"
            : "notice";

    const text = event.clipboardData?.getData("text/plain") || "";
    const html = text
        .split(/\n{2,}/)
        .map(block => block.trim())
        .filter(Boolean)
        .map(block => `<p>${escapeHtml(block).replaceAll("\n", "<br>")}</p>`)
        .join("");

    document.execCommand("insertHTML", false, html || escapeHtml(text));
    syncEditorToTextarea(target);
}

function getEditorFields(target = "notice") {
    if (target === "faq") {
        return {
            editor: faqFields.editor,
            textarea: faqFields.answer
        };
    }

    if (target === "greeting") {
        return {
            editor: greetingFields.editor,
            textarea: greetingFields.body
        };
    }

    return {
        editor: fields.editor,
        textarea: fields.content
    };
}
