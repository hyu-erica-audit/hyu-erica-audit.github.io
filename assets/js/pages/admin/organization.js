import { escapeHtml } from "../../html-utils.js";
import {
    createOrganizationMember,
    fetchAllOrganizationMembers,
    getFirebaseOrganizationErrorMessage,
    removeOrganizationMember,
    sortOrganizationMembers,
    updateOrganizationMember
} from "../../organization-service.js";
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

const organizationList = document.getElementById("admin-organization-list");
const organizationForm = document.getElementById("admin-organization-form");
const organizationEditorTitle = document.getElementById("admin-organization-editor-title");
const newOrganizationButton = document.getElementById("admin-new-organization-member");
const deleteOrganizationButton = document.getElementById("admin-delete-organization-member");

const organizationFields = {
    id: document.getElementById("organization-id"),
    name: document.getElementById("organization-name"),
    role: document.getElementById("organization-role"),
    team: document.getElementById("organization-team"),
    order: document.getElementById("organization-order"),
    department: document.getElementById("organization-department"),
    status: document.getElementById("organization-status")
};

let organizationMembers = [];

const setBusy = createBusySetter({ form: organizationForm, buttons: [newOrganizationButton] });

export function initOrganization() {
    resetOrganizationForm();

    newOrganizationButton?.addEventListener("click", resetOrganizationForm);
    organizationForm?.addEventListener("submit", handleSubmit);
    deleteOrganizationButton?.addEventListener("click", handleDelete);

    attachListActions(organizationList, {
        "edit-organization-member": id => {
            const member = organizationMembers.find(item => item.id === id);

            if (member) fillOrganizationForm(member);
        }
    });

    return loadOrganizationMembers;
}

async function handleSubmit(event) {
    event.preventDefault();

    const payload = readOrganizationForm();

    await saveEntity({
        id: organizationFields.id.value,
        validate: () => (!payload.name || !payload.team ? "조직원 이름과 소속 팀을 입력해주세요." : null),
        create: () => createOrganizationMember(payload),
        update: id => updateOrganizationMember(id, payload),
        setBusy,
        reload: loadOrganizationMembers,
        reset: resetOrganizationForm,
        getErrorMessage: getFirebaseOrganizationErrorMessage,
        messages: {
            created: "조직원을 저장했습니다.",
            updated: "조직원을 수정했습니다.",
            failed: "조직원 저장에 실패했습니다.",
            logLabel: "Organization save failed:"
        }
    });
}

async function handleDelete() {
    const id = organizationFields.id.value;

    await deleteEntity({
        item: id || null,
        confirmMessage: "이 조직원을 삭제할까요?",
        remove: () => removeOrganizationMember(id),
        setBusy,
        reset: resetOrganizationForm,
        reload: loadOrganizationMembers,
        getErrorMessage: getFirebaseOrganizationErrorMessage,
        messages: {
            success: "조직원을 삭제했습니다.",
            failed: "조직원 삭제에 실패했습니다.",
            logLabel: "Organization delete failed:"
        }
    });
}

async function loadOrganizationMembers() {
    if (!organizationList) return;

    organizationList.innerHTML = mutedRow("조직도를 불러오는 중입니다.");

    try {
        organizationMembers = await fetchAllOrganizationMembers();
        renderOrganizationRows();
    } catch (error) {
        console.error("Admin organization load failed:", error);
        organizationList.innerHTML = dangerRow(`조직도를 불러오지 못했습니다. ${escapeHtml(getFirebaseOrganizationErrorMessage(error))}`);
    }
}

function renderOrganizationRows() {
    if (!organizationList) return;

    organizationMembers = sortOrganizationMembers(organizationMembers);

    if (organizationMembers.length === 0) {
        organizationList.innerHTML = mutedRow("저장된 조직원이 없습니다.");
        return;
    }

    const groups = groupOrganizationMembersForAdmin(organizationMembers);

    organizationList.innerHTML = groups.map(group => `
        ${groupHeaderRow(group.title)}
        ${group.members.map(member => `
        <tr>
            <td>${statusBadge(member.status)}</td>
            <td>
                <button type="button" class="admin-link-button" data-action="edit-organization-member" data-id="${escapeHtml(member.id)}">
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

function resetOrganizationForm() {
    organizationForm?.reset();

    organizationFields.id.value = "";
    organizationFields.team.value = "";
    organizationFields.order.value = organizationMembers.length + 1;
    organizationFields.status.value = "published";

    organizationEditorTitle.textContent = "새 조직원 작성";
    deleteOrganizationButton?.classList.add("d-none");
}
