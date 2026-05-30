import { db } from "./firebase.js?v=20260530-no-local-data";
import {
    getFirebaseErrorMessage as getCommonFirebaseErrorMessage,
    PUBLIC_QUERY_LIMIT,
    withFirestoreTimeout
} from "./firestore-utils.js";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore-lite.js";

const organizationRef = collection(db, "organizationMembers");
export function normalizeOrganizationMember(id, data = {}) {
    return {
        id,
        name: data.name || "",
        role: data.role || "",
        department: data.department || "",
        team: data.team || "중앙감사위원회",
        order: Number(data.order || 0),
        status: data.status || "draft",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
    };
}

export function sortOrganizationMembers(members) {
    return [...members].sort((a, b) => {
        const teamRankCompare = getOrganizationTeamSortRank(a) - getOrganizationTeamSortRank(b);

        if (teamRankCompare !== 0) return teamRankCompare;

        const teamCompare = String(a.team || "").localeCompare(String(b.team || ""), "ko");

        if (teamCompare !== 0) return teamCompare;

        const orderCompare = Number(a.order || 0) - Number(b.order || 0);

        if (orderCompare !== 0) return orderCompare;

        return String(a.name || "").localeCompare(String(b.name || ""), "ko");
    });
}

export function isChairMember(member) {
    const role = normalizeText(member.role);
    const team = normalizeText(member.team);

    return (role.includes("위원장") && !role.includes("부위원장")) || team === "위원장";
}

export function isViceChairMember(member) {
    const role = normalizeText(member.role);
    const team = normalizeText(member.team);

    return role.includes("부위원장") || team === "부위원장";
}

export async function fetchPublishedOrganizationMembers() {
    const snapshot = await withFirestoreTimeout(getDocs(query(organizationRef, where("status", "==", "published"), limit(PUBLIC_QUERY_LIMIT))));
    const members = snapshot.docs.map(item => normalizeOrganizationMember(item.id, item.data()));

    return sortOrganizationMembers(members);
}

export async function fetchAllOrganizationMembers() {
    const snapshot = await withFirestoreTimeout(getDocs(organizationRef));
    const members = snapshot.docs.map(item => normalizeOrganizationMember(item.id, item.data()));

    return sortOrganizationMembers(members);
}

export async function createOrganizationMember(data) {
    const created = await withFirestoreTimeout(addDoc(organizationRef, buildOrganizationPayload(data, true)));

    return created.id;
}

export async function updateOrganizationMember(id, data) {
    await withFirestoreTimeout(updateDoc(doc(db, "organizationMembers", String(id)), buildOrganizationPayload(data, false)));
}

export async function removeOrganizationMember(id) {
    await withFirestoreTimeout(deleteDoc(doc(db, "organizationMembers", String(id))));
}

function buildOrganizationPayload(data, isCreate) {
    const payload = {
        name: data.name || "",
        role: data.role || "",
        team: data.team || "중앙감사위원회",
        department: data.department || "",
        order: Number(data.order || 0),
        status: data.status || "draft",
        updatedAt: serverTimestamp()
    };

    if (isCreate) {
        payload.createdAt = serverTimestamp();
    }

    return payload;
}

function getOrganizationTeamSortRank(member) {
    if (isChairMember(member)) return 0;
    if (isViceChairMember(member)) return 10;

    const team = String(member.team || "");
    const auditTeam = team.match(/감사\s*(\d+)\s*팀/);

    if (auditTeam) return 100 + Number(auditTeam[1]);

    if (team.includes("위원단")) return 900;

    return 500;
}

function normalizeText(value) {
    return String(value || "").replace(/\s+/g, "");
}

export function getFirebaseOrganizationErrorMessage(error) {
    return getCommonFirebaseErrorMessage(error);
}
