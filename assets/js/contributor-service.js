import { db } from "./firebase.js?v=20260530-no-local-data";
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

const sectionsRef = collection(db, "contributorSections");
const contributorsRef = collection(db, "contributors");
const FIRESTORE_TIMEOUT_MS = 20000;
const PUBLIC_QUERY_LIMIT = 300;

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

export async function fetchPublishedContributorSections() {
    const snapshot = await withFirestoreTimeout(getDocs(query(sectionsRef, where("status", "==", "published"), limit(PUBLIC_QUERY_LIMIT))));
    const sections = snapshot.docs.map(item => normalizeContributorSection(item.id, item.data()));

    return sortContributorSections(sections);
}

export async function fetchAllContributorSections() {
    const snapshot = await withFirestoreTimeout(getDocs(sectionsRef));
    const sections = snapshot.docs.map(item => normalizeContributorSection(item.id, item.data()));

    return sortContributorSections(sections);
}

export async function fetchPublishedContributors() {
    const snapshot = await withFirestoreTimeout(getDocs(query(contributorsRef, where("status", "==", "published"), limit(PUBLIC_QUERY_LIMIT))));
    const contributors = snapshot.docs.map(item => normalizeContributor(item.id, item.data()));

    return sortContributors(contributors);
}

export async function fetchAllContributors() {
    const snapshot = await withFirestoreTimeout(getDocs(contributorsRef));
    const contributors = snapshot.docs.map(item => normalizeContributor(item.id, item.data()));

    return sortContributors(contributors);
}

export async function createContributorSection(data) {
    const created = await withFirestoreTimeout(addDoc(sectionsRef, buildSectionPayload(data, true)));

    return created.id;
}

export async function updateContributorSection(id, data) {
    await withFirestoreTimeout(updateDoc(doc(db, "contributorSections", String(id)), buildSectionPayload(data, false)));
}

export async function removeContributorSection(id) {
    await withFirestoreTimeout(deleteDoc(doc(db, "contributorSections", String(id))));
}

export async function createContributor(data) {
    const created = await withFirestoreTimeout(addDoc(contributorsRef, buildContributorPayload(data, true)));

    return created.id;
}

export async function updateContributor(id, data) {
    await withFirestoreTimeout(updateDoc(doc(db, "contributors", String(id)), buildContributorPayload(data, false)));
}

export async function removeContributor(id) {
    await withFirestoreTimeout(deleteDoc(doc(db, "contributors", String(id))));
}

function buildSectionPayload(data, isCreate) {
    const payload = {
        title: data.title || "",
        subtitle: data.subtitle || "",
        order: Number(data.order || 0),
        status: data.status || "draft",
        updatedAt: serverTimestamp()
    };

    if (isCreate) payload.createdAt = serverTimestamp();

    return payload;
}

function buildContributorPayload(data, isCreate) {
    const payload = {
        sectionId: data.sectionId || "",
        role: data.role || "",
        name: data.name || "",
        dept: data.dept || "",
        order: Number(data.order || 0),
        status: data.status || "draft",
        updatedAt: serverTimestamp()
    };

    if (isCreate) payload.createdAt = serverTimestamp();

    return payload;
}

function withFirestoreTimeout(promise) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => {
                reject(new Error("Firestore request timed out. Check network, Firebase project settings, and Firestore rules."));
            }, FIRESTORE_TIMEOUT_MS);
        })
    ]);
}

export function getFirebaseContributorErrorMessage(error) {
    const code = error?.code ? `[${error.code}] ` : "";
    const message = error?.message || String(error);

    if (message.includes("timed out")) {
        return `${code}Firestore 응답 시간이 초과되었습니다. 네트워크 또는 Firestore 설정을 확인해주세요.`;
    }

    if (error?.code === "permission-denied") {
        return `${code}권한이 거부되었습니다. Firestore Rules가 게시되었는지, 로그인 상태가 유지되는지 확인해주세요.`;
    }

    return `${code}${message}`;
}
