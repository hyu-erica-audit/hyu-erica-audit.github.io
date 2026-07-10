import {
    fetchPublishedContributors,
    fetchPublishedContributorSections,
    getFirebaseContributorErrorMessage,
    sortContributors
} from "../contributor-service.js";
import { escapeHtml } from "../text-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
    const wrapper = document.getElementById("sections-wrapper");

    if (!wrapper) return;

    wrapper.innerHTML = `<div class="text-center text-muted py-5">기여자 정보를 불러오는 중입니다.</div>`;

    try {
        const [sections, contributors] = await Promise.all([
            fetchPublishedContributorSections(),
            fetchPublishedContributors()
        ]);

        renderContributorSections(wrapper, sections, contributors);
    } catch (error) {
        console.error("Contributor load failed:", error);
        wrapper.innerHTML = `<div class="alert alert-warning small">기여자 정보를 불러오지 못했습니다. ${escapeHtml(getFirebaseContributorErrorMessage(error))}</div>`;
    }
});

function renderContributorSections(wrapper, sections, contributors) {
    const visibleSections = sections
        .map(section => ({
            ...section,
            members: sortContributors(contributors.filter(person => person.sectionId === section.id))
        }))
        .filter(section => section.members.length > 0);

    if (visibleSections.length === 0) {
        wrapper.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-people text-secondary" style="font-size: 3rem;"></i>
                <p class="mt-3 text-muted">등록된 기여자가 없습니다.</p>
            </div>
        `;
        return;
    }

    wrapper.innerHTML = visibleSections.map((section, index) => `
        <div class="section-block ${index > 0 ? "mt-5 pt-5" : ""}">
            <div class="mb-4">
                <h2 class="fw-bold tracking-tight">${escapeHtml(section.title)}</h2>
                <p class="text-secondary keep-all">${escapeHtml(section.subtitle)}</p>
            </div>
            <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 g-0">
                ${section.members.map(person => `
                    <div class="col">
                        <div class="contributor-item">
                            <span class="role-text">${escapeHtml(person.role)}</span>
                            <div class="name-text">${escapeHtml(person.name)}</div>
                            <div class="dept-text">${escapeHtml(person.dept)}</div>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `).join("");
}
