import { getFirebaseErrorMessage as getCommonFirebaseErrorMessage } from "./firestore-utils.js";
import { createCrudService, withTimestamps } from "./service-factory.js";
import { deleteField } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore-lite.js";

export function normalizeContributorSection(id, data = {}) {
    return {
        id,
        title: data.title || "",
        subtitle: data.subtitle || "",
        order: Number(data.order || 0),
        status: data.status || "draft",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
    };
}

export function normalizeContributor(id, data = {}) {
    return {
        id,
        sectionId: data.sectionId || "",
        role: data.role || "",
        name: data.name || "",
        dept: data.dept || data.department || "",
        order: Number(data.order || 0),
        status: data.status || "draft",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
    };
}

export function sortContributorSections(sections) {
    return [...sections].sort((a, b) => {
        const orderCompare = Number(a.order || 0) - Number(b.order || 0);

        if (orderCompare !== 0) return orderCompare;

        return String(a.title || "").localeCompare(String(b.title || ""), "ko");
    });
}

export function sortContributors(contributors) {
    return [...contributors].sort((a, b) => {
        const orderCompare = Number(a.order || 0) - Number(b.order || 0);

        if (orderCompare !== 0) return orderCompare;

        return String(a.name || "").localeCompare(String(b.name || ""), "ko");
    });
}

function buildSectionPayload(data, isCreate) {
    return withTimestamps({
        title: data.title || "",
        subtitle: data.subtitle || "",
        order: Number(data.order || 0),
        status: data.status || "draft"
    }, isCreate);
}

function buildContributorPayload(data, isCreate) {
    const payload = withTimestamps({
        sectionId: data.sectionId || "",
        role: data.role || "",
        name: data.name || "",
        dept: data.dept || "",
        order: Number(data.order || 0),
        status: data.status || "draft"
    }, isCreate);

    if (!isCreate) {
        payload.department = deleteField();
    }

    return payload;
}

const sectionService = createCrudService({
    collectionName: "contributorSections",
    normalize: normalizeContributorSection,
    sort: sortContributorSections,
    buildPayload: buildSectionPayload
});

const contributorService = createCrudService({
    collectionName: "contributors",
    normalize: normalizeContributor,
    sort: sortContributors,
    buildPayload: buildContributorPayload
});

export const fetchPublishedContributorSections = sectionService.fetchPublished;
export const fetchAllContributorSections = sectionService.fetchAll;
export const createContributorSection = sectionService.create;
export const updateContributorSection = sectionService.update;
export const removeContributorSection = sectionService.remove;

export const fetchPublishedContributors = contributorService.fetchPublished;
export const fetchAllContributors = contributorService.fetchAll;
export const createContributor = contributorService.create;
export const updateContributor = contributorService.update;
export const removeContributor = contributorService.remove;

export function getFirebaseContributorErrorMessage(error) {
    return getCommonFirebaseErrorMessage(error);
}
