import { getFirebaseErrorMessage as getCommonFirebaseErrorMessage } from "./firestore-utils.js";
import { createCrudService, withTimestamps } from "./service-factory.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore-lite.js";

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

function buildNoticePayload(data, isCreate) {
    const status = data.status || "draft";
    const payload = withTimestamps({
        type: data.type || "일반",
        title: data.title || "",
        author: data.author || "중앙감사위원회",
        date: data.date || formatDate(),
        contentHtml: data.contentHtml || "",
        status,
        pinned: Boolean(data.pinned)
    }, isCreate);

    if (status === "published") {
        payload.publishedAt = data.publishedAt || serverTimestamp();
    }

    return payload;
}

const noticeService = createCrudService({
    collectionName: "notices",
    normalize: normalizeNotice,
    sort: sortNotices,
    buildPayload: buildNoticePayload
});

export const fetchPublishedNotices = noticeService.fetchPublished;
export const fetchAllNotices = noticeService.fetchAll;
export const fetchNotice = noticeService.fetchOne;
export const createNotice = noticeService.create;
export const updateNotice = noticeService.update;
export const removeNotice = noticeService.remove;

export function formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}.${month}.${day}.`;
}

export function compareNoticesForNumbering(a, b) {
    const dateCompare = getNoticeDateSortTime(a) - getNoticeDateSortTime(b);

    if (dateCompare !== 0) return dateCompare;

    const createdCompare = getTimestampSortTime(a.createdAt) - getTimestampSortTime(b.createdAt);

    if (createdCompare !== 0) return createdCompare;

    return String(a.id).localeCompare(String(b.id));
}

function getNoticeDateSortTime(notice) {
    const parsedDate = parseNoticeDate(notice.date);

    if (parsedDate) return parsedDate.getTime();

    const timestampDate = notice.publishedAt?.toDate?.() || notice.createdAt?.toDate?.();

    return timestampDate ? timestampDate.getTime() : 0;
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
