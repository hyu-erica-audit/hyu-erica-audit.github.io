import {
    fetchPublishedOrganizationMembers,
    getFirebaseOrganizationErrorMessage,
    isChairMember,
    isViceChairMember,
    sortOrganizationMembers
} from "../organization-service.js";
import { escapeHtml } from "../text-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("organization-container");

    if (!container) return;

    container.innerHTML = `<div class="text-center text-muted py-5">조직도를 불러오는 중입니다.</div>`;

    try {
        const members = await fetchPublishedOrganizationMembers();
        renderOrganization(container, members);
    } catch (error) {
        console.error("Organization chart load failed:", error);
        container.innerHTML = `<div class="alert alert-warning small">조직도를 불러오지 못했습니다. ${escapeHtml(getFirebaseOrganizationErrorMessage(error))}</div>`;
    }
});

function renderOrganization(container, members) {
    if (members.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-diagram-3 text-secondary" style="font-size: 3rem;"></i>
                <p class="mt-3 text-muted">등록된 조직도가 없습니다.</p>
            </div>
        `;
        return;
    }

    const chairMembers = sortOrganizationMembers(members.filter(isChairMember));
    const teamGroups = groupTeamMembers(members.filter(member => !isChairMember(member)));

    container.innerHTML = `
        <div class="audit-org-chart" aria-label="중앙감사위원회 조직도">
            ${renderLeadership(chairMembers)}
            ${teamGroups.length > 0 ? `<div class="org-main-connector" aria-hidden="true"></div>` : ""}
            ${renderTeamBoard(teamGroups)}
        </div>
    `;
}

function renderLeadership(chairMembers) {
    if (chairMembers.length === 0) return "";

    return `
        <section class="org-leadership" aria-label="위원단">
            <div class="org-leadership-row">
                ${chairMembers.map(member => renderExecutiveNode(member)).join("")}
            </div>
        </section>
    `;
}

function renderExecutiveNode(member) {
    return `
        <article class="org-executive-node">
            <span class="org-node-kicker">${escapeHtml(member.role || "중앙감사위원장")}</span>
            <strong>${escapeHtml(member.name)}</strong>
            ${member.department ? `<p>${escapeHtml(member.department)}</p>` : ""}
        </article>
    `;
}

function renderTeamBoard(teamGroups) {
    if (teamGroups.length === 0) return "";

    return `
        <section class="org-team-board" aria-label="감사팀">
            ${teamGroups.map(group => `
                <article class="org-team-panel">
                    <header class="org-team-header">
                        <span class="org-team-index">${escapeHtml(getTeamIndexLabel(group.team))}</span>
                        <h3>${escapeHtml(group.team)}</h3>
                    </header>
                    <div class="org-team-members">
                        ${group.members.map(member => renderTeamMember(member, group.team)).join("")}
                    </div>
                </article>
            `).join("")}
        </section>
    `;
}

function renderTeamMember(member, team) {
    const role = getVisibleRole(member, team);
    const viceClass = isViceChairMember(member) ? " org-member-node-vice" : "";

    return `
        <article class="org-member-node${viceClass}">
            ${member.department ? `<p>${escapeHtml(member.department)}</p>` : ""}
            <strong>${escapeHtml(member.name)}</strong>
            <span class="${role ? "" : "org-member-role-empty"}">${role ? escapeHtml(role) : "&nbsp;"}</span>
        </article>
    `;
}

function groupTeamMembers(members) {
    const teamMap = new Map();

    sortOrganizationMembers(members).forEach(member => {
        const team = member.team || "중앙감사위원회";

        if (!teamMap.has(team)) {
            teamMap.set(team, []);
        }

        teamMap.get(team).push(member);
    });

    return Array.from(teamMap, ([team, teamMembers]) => ({ team, members: teamMembers }))
        .sort((a, b) => getTeamSortRank(a.team) - getTeamSortRank(b.team) || a.team.localeCompare(b.team, "ko"));
}

function getTeamSortRank(team) {
    const auditTeam = String(team || "").match(/감사\s*(\d+)\s*팀/);

    if (auditTeam) return Number(auditTeam[1]);
    if (String(team || "").includes("위원단")) return 90;

    return 50;
}

function getTeamIndexLabel(team) {
    const auditTeam = String(team || "").match(/감사\s*(\d+)\s*팀/);

    if (auditTeam) return `TEAM ${auditTeam[1]}`;

    return "TEAM";
}

function getVisibleRole(member, team) {
    const role = String(member.role || "").trim();

    if (!role) return "";
    if (normalizeText(role) === normalizeText(team)) return "";

    return role;
}

function normalizeText(value) {
    return String(value || "").replace(/\s+/g, "");
}
