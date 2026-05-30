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
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore-lite.js";

const noticesRef = collection(db, "notices");

export function normalizeNotice(id, data = {}) {
    const publishedAt = data.publishedAt?.toDate?.() || data.createdAt?.toDate?.() || null;

    return {
        id,
        legacyId: data.legacyId || null,
        type: data.type || data.category || "일반",
        title: data.title || "",
        author: data.author || "중앙감사위원회",
        date: data.date || formatDate(publishedAt || new Date()),
        contentHtml: data.contentHtml || data.content || "",
        status: data.status || "draft",
        pinned: Boolean(data.pinned),
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
        publishedAt: data.publishedAt || null
    };
}

export function sortNotices(notices) {
    return [...notices].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

        const aDate = getNoticeDateSortTime(a);
        const bDate = getNoticeDateSortTime(b);

        if (aDate !== bDate) return bDate - aDate;

        const aNo = Number(a.legacyId) || 0;
        const bNo = Number(b.legacyId) || 0;

        return bNo - aNo;
    });
}

export async function fetchPublishedNotices() {
    const publishedQuery = query(noticesRef, where("status", "==", "published"), limit(PUBLIC_QUERY_LIMIT));
    const snapshot = await withFirestoreTimeout(getDocs(publishedQuery));
    const notices = snapshot.docs.map(item => normalizeNotice(item.id, item.data()));

    return sortNotices(notices);
}

export async function fetchAllNotices() {
    const snapshot = await withFirestoreTimeout(getDocs(noticesRef));
    const notices = snapshot.docs.map(item => normalizeNotice(item.id, item.data()));

    return sortNotices(notices);
}

export async function fetchNotice(id) {
    const snapshot = await withFirestoreTimeout(getDoc(doc(db, "notices", String(id))));

    if (!snapshot.exists()) return null;

    return normalizeNotice(snapshot.id, snapshot.data());
}

export async function createNotice(data) {
    const payload = buildNoticePayload(data, true);
    const created = await withFirestoreTimeout(addDoc(noticesRef, payload));
    await resequencePublishedNoticeNumbers();

    return created.id;
}

export async function updateNotice(id, data) {
    const payload = buildNoticePayload(data, false);

    await withFirestoreTimeout(updateDoc(doc(db, "notices", String(id)), payload));
    await resequencePublishedNoticeNumbers();
}

export async function removeNotice(id) {
    await withFirestoreTimeout(deleteDoc(doc(db, "notices", String(id))));
    await resequencePublishedNoticeNumbers();
}

export function formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}.${month}.${day}.`;
}

function buildNoticePayload(data, isCreate) {
    const status = data.status || "draft";
    const payload = {
        type: data.type || "일반",
        title: data.title || "",
        author: data.author || "중앙감사위원회",
        date: data.date || formatDate(),
        contentHtml: data.contentHtml || "",
        status,
        pinned: Boolean(data.pinned),
        updatedAt: serverTimestamp()
    };

    if (isCreate) {
        payload.createdAt = serverTimestamp();
    }

    if (status === "published") {
        payload.publishedAt = serverTimestamp();
    }

    return payload;
}

function getNoticeDateSortTime(notice) {
    const parsedDate = parseNoticeDate(notice.date);

    if (parsedDate) return parsedDate.getTime();

    const timestampDate = notice.publishedAt?.toDate?.() || notice.createdAt?.toDate?.();

    return timestampDate ? timestampDate.getTime() : 0;
}

async function resequencePublishedNoticeNumbers() {
    const snapshot = await withFirestoreTimeout(getDocs(query(noticesRef, where("status", "==", "published"))));
    const publishedNotices = snapshot.docs
        .map(item => normalizeNotice(item.id, item.data()))
        .sort(compareNoticesForNumbering);
    const updates = [];

    publishedNotices.forEach((notice, index) => {
        const nextLegacyId = index + 1;

        if (Number(notice.legacyId) !== nextLegacyId) {
            updates.push({ id: notice.id, legacyId: nextLegacyId });
        }
    });

    for (let index = 0; index < updates.length; index += 450) {
        const batch = writeBatch(db);
        const chunk = updates.slice(index, index + 450);

        chunk.forEach(update => {
            batch.update(doc(db, "notices", update.id), {
                legacyId: update.legacyId
            });
        });

        await withFirestoreTimeout(batch.commit());
    }
}

function compareNoticesForNumbering(a, b) {
    const dateCompare = getNoticeDateSortTime(a) - getNoticeDateSortTime(b);

    if (dateCompare !== 0) return dateCompare;

    const createdCompare = getTimestampSortTime(a.createdAt) - getTimestampSortTime(b.createdAt);

    if (createdCompare !== 0) return createdCompare;

    return String(a.id).localeCompare(String(b.id));
}

function getTimestampSortTime(timestamp) {
    return timestamp?.toDate?.()?.getTime?.() || 0;
}

function parseNoticeDate(value) {
    const dateParts = String(value || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);

    if (!dateParts) return null;

    return new Date(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]));
}

export function getFirebaseErrorMessage(error) {
    return getCommonFirebaseErrorMessage(error);
}
