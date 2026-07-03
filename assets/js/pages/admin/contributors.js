import { escapeHtml } from "../../html-utils.js";
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
} from "../../contributor-service.js";
import {
    attachListActions,
    createBusySetter,
    dangerRow,
    deleteEntity,
    groupHeaderRow,
    mutedRow,
    saveEntity,
    statusBadge
} from "./shared.js";

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

let contributorSections = [];
let contributors = [];

const setSectionBusy = createBusySetter({ form: contributorSectionForm, buttons: [newContributorSectionButton] });
const setContributorBusy = createBusySetter({ form: contributorForm, buttons: [newContributorButton] });

export function initContributors() {
    resetContributorSectionForm();
    resetContributorForm();

    newContributorSectionButton?.addEventListener("click", resetContributorSectionForm);
    newContributorButton?.addEventListener("click", resetContributorForm);
    contributorSectionForm?.addEventListener("submit", handleSectionSubmit);
    contributorForm?.addEventListener("submit", handleContributorSubmit);
    deleteContributorSectionButton?.addEventListener("click", handleSectionDelete);
    deleteContributorButton?.addEventListener("click", handleContributorDelete);

    attachListActions(contributorSectionList, {
        "edit-contributor-section": id => {
            const section = contributorSections.find(item => item.id === id);

            if (section) fillContributorSectionForm(section);
        }
    });

    attachListActions(contributorList, {
        "edit-contributor": id => {
            const contributor = contributors.find(item => item.id === id);

            if (contributor) fillContributorForm(contributor);
        }
    });

    return loadContributors;
}

async function handleSectionSubmit(event) {
    event.preventDefault();

    const payload = readContributorSectionForm();

    await saveEntity({
        id: contributorSectionFields.id.value,
        validate: () => (!payload.title ? "섹션 제목을 입력해주세요." : null),
        create: () => createContributorSection(payload),
        update: id => updateContributorSection(id, payload),
        setBusy: setSectionBusy,
        reload: loadContributors,
        reset: resetContributorSectionForm,
        getErrorMessage: getFirebaseContributorErrorMessage,
        messages: {
            created: "기여자 섹션을 저장했습니다.",
            updated: "기여자 섹션을 수정했습니다.",
            failed: "기여자 섹션 저장에 실패했습니다.",
            logLabel: "Contributor section save failed:"
        }
    });
}

async function handleContributorSubmit(event) {
    event.preventDefault();

    const payload = readContributorForm();

    await saveEntity({
        id: contributorFields.id.value,
        validate: () => (!payload.sectionId || !payload.name ? "소속 섹션과 이름/단체명을 입력해주세요." : null),
        create: () => createContributor(payload),
        update: id => updateContributor(id, payload),
        setBusy: setContributorBusy,
        reload: loadContributors,
        reset: resetContributorForm,
        getErrorMessage: getFirebaseContributorErrorMessage,
        messages: {
            created: "기여자를 저장했습니다.",
            updated: "기여자를 수정했습니다.",
            failed: "기여자 저장에 실패했습니다.",
            logLabel: "Contributor save failed:"
        }
    });
}

async function handleSectionDelete() {
    const id = contributorSectionFields.id.value;

    await deleteEntity({
        item: id || null,
        guard: () => (contributors.some(item => item.sectionId === id)
            ? "이 섹션에 속한 기여자를 먼저 삭제하거나 다른 섹션으로 옮겨주세요."
            : null),
        confirmMessage: "이 기여자 섹션을 삭제할까요?",
        remove: () => removeContributorSection(id),
        setBusy: setSectionBusy,
        reset: resetContributorSectionForm,
        reload: loadContributors,
        getErrorMessage: getFirebaseContributorErrorMessage,
        messages: {
            success: "기여자 섹션을 삭제했습니다.",
            failed: "기여자 섹션 삭제에 실패했습니다.",
            logLabel: "Contributor section delete failed:"
        }
    });
}

async function handleContributorDelete() {
    const id = contributorFields.id.value;

    await deleteEntity({
        item: id || null,
        confirmMessage: "이 기여자를 삭제할까요?",
        remove: () => removeContributor(id),
        setBusy: setContributorBusy,
        reset: resetContributorForm,
        reload: loadContributors,
        getErrorMessage: getFirebaseContributorErrorMessage,
        messages: {
            success: "기여자를 삭제했습니다.",
            failed: "기여자 삭제에 실패했습니다.",
            logLabel: "Contributor delete failed:"
        }
    });
}

async function loadContributors() {
    if (!contributorSectionList || !contributorList) return;

    contributorSectionList.innerHTML = mutedRow("섹션을 불러오는 중입니다.");
    contributorList.innerHTML = mutedRow("기여자를 불러오는 중입니다.");

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
        contributorSectionList.innerHTML = dangerRow(messageText);
        contributorList.innerHTML = dangerRow(messageText);
    }
}

function renderContributorSectionRows() {
    if (!contributorSectionList) return;

    contributorSections = sortContributorSections(contributorSections);

    if (contributorSections.length === 0) {
        contributorSectionList.innerHTML = mutedRow("저장된 섹션이 없습니다.");
        return;
    }

    contributorSectionList.innerHTML = contributorSections.map(section => `
        <tr>
            <td>${statusBadge(section.status)}</td>
            <td>
                <button type="button" class="admin-link-button" data-action="edit-contributor-section" data-id="${escapeHtml(section.id)}">
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
}

function renderContributorRows() {
    if (!contributorList) return;

    contributors = sortContributors(contributors);

    if (contributors.length === 0) {
        contributorList.innerHTML = mutedRow("저장된 기여자가 없습니다.");
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
            ${groupHeaderRow(group.section.title)}
            ${group.items.map(item => renderContributorRow(item)).join("")}
        `).join("")}
        ${orphanItems.length > 0 ? `
            ${groupHeaderRow("미분류")}
            ${orphanItems.map(item => renderContributorRow(item)).join("")}
        ` : ""}
    `;
}

function renderContributorRow(item) {
    const section = contributorSections.find(sectionItem => sectionItem.id === item.sectionId);

    return `
        <tr>
            <td>${statusBadge(item.status)}</td>
            <td>
                <button type="button" class="admin-link-button" data-action="edit-contributor" data-id="${escapeHtml(item.id)}">
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
