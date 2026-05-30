import { db } from "./firebase.js?v=20260529-schedule-color";
import { PUBLIC_QUERY_LIMIT, withFirestoreTimeout } from "./firestore-utils.js";
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
    where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore-lite.js";

const schedulesRef = collection(db, "schedules");
export const scheduleCategories = [
    { value: "event-audit-regular", label: "정기감사", color: "#50b9b9" },
    { value: "event-audit-examine", label: "검토", color: "#808fe5" },
    { value: "event-meeting-regular", label: "정기회의", color: "#63be82" },
    { value: "event-audit-exceptional", label: "특정감사", color: "#ff7c7c" },
    { value: "event-school-activity", label: "학교 일정", color: "#2070b1" }
];

export function normalizeSchedule(id, data = {}) {
    const category = getScheduleCategoryLabel(data.category || data.className || "");

    return {
        id,
        title: data.title || "",
        startDate: data.startDate || data.start || "",
        endDate: data.endDate || data.end || data.startDate || data.start || "",
        category,
        color: getScheduleColor(data.color || data.backgroundColor || data.category || data.className),
        description: data.description || "",
        status: data.status || "draft",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
    };
}

export function sortSchedules(schedules) {
    return [...schedules].sort((a, b) => {
        const dateCompare = String(a.startDate || "").localeCompare(String(b.startDate || ""));

        if (dateCompare !== 0) return dateCompare;

        const endDateCompare = String(a.endDate || a.startDate || "").localeCompare(String(b.endDate || b.startDate || ""));

        if (endDateCompare !== 0) return endDateCompare;

        return String(a.title || "").localeCompare(String(b.title || ""), "ko");
    });
}

export async function fetchPublishedSchedules() {
    const publishedQuery = query(schedulesRef, where("status", "==", "published"), limit(PUBLIC_QUERY_LIMIT));
    const snapshot = await withFirestoreTimeout(getDocs(publishedQuery));
    const schedules = snapshot.docs.map(item => normalizeSchedule(item.id, item.data()));

    return sortSchedules(schedules);
}

export async function fetchAllSchedules() {
    const snapshot = await withFirestoreTimeout(getDocs(schedulesRef));
    const schedules = snapshot.docs.map(item => normalizeSchedule(item.id, item.data()));

    return sortSchedules(schedules);
}

export async function fetchSchedule(id) {
    const snapshot = await withFirestoreTimeout(getDoc(doc(db, "schedules", String(id))));

    if (!snapshot.exists()) return null;

    return normalizeSchedule(snapshot.id, snapshot.data());
}

export async function createSchedule(data) {
    const payload = buildSchedulePayload(data, true);
    const created = await withFirestoreTimeout(addDoc(schedulesRef, payload));

    return created.id;
}

export async function updateSchedule(id, data) {
    const payload = buildSchedulePayload(data, false);

    await withFirestoreTimeout(updateDoc(doc(db, "schedules", String(id)), payload));
}

export async function removeSchedule(id) {
    await withFirestoreTimeout(deleteDoc(doc(db, "schedules", String(id))));
}

export function toCalendarEvent(schedule) {
    const normalized = normalizeSchedule(schedule.id, schedule);
    const endDate = normalized.endDate || normalized.startDate;

    return {
        id: normalized.id,
        title: normalized.title,
        start: normalized.startDate,
        end: getCalendarExclusiveEnd(normalized.startDate, endDate),
        backgroundColor: normalized.color,
        borderColor: normalized.color,
        textColor: "#ffffff",
        extendedProps: {
            category: normalized.category,
            color: normalized.color,
            description: normalized.description,
            startDate: normalized.startDate,
            endDate
        }
    };
}

export function formatSchedulePeriod(schedule) {
    const start = formatKoreanDate(schedule.startDate);
    const end = formatKoreanDate(schedule.endDate || schedule.startDate);

    if (!start) return "";
    if (!end || schedule.startDate === schedule.endDate) return start;

    return `${start} ~ ${end}`;
}

export function getScheduleCategoryLabel(value) {
    const category = scheduleCategories.find(item => item.value === value || item.label === value);

    return category?.label || value || "일정";
}

export function getScheduleColor(value) {
    const normalized = normalizeColor(value);

    if (normalized) return normalized;

    const category = scheduleCategories.find(item => item.value === value || item.label === value);

    return category?.color || "#50b9b9";
}

function buildSchedulePayload(data, isCreate) {
    const payload = {
        title: data.title || "",
        startDate: data.startDate || "",
        endDate: data.endDate || data.startDate || "",
        category: data.category || "일정",
        color: getScheduleColor(data.color),
        description: data.description || "",
        status: data.status || "draft",
        updatedAt: serverTimestamp()
    };

    if (isCreate) {
        payload.createdAt = serverTimestamp();
    }

    return payload;
}

function getCalendarExclusiveEnd(startDate, endDate) {
    if (!endDate || startDate === endDate) return undefined;

    const parsed = parseDate(endDate);

    if (!parsed) return endDate;

    parsed.setDate(parsed.getDate() + 1);

    return toDateInputValue(parsed);
}

function formatKoreanDate(value) {
    const parsed = parseDate(value);

    if (!parsed) return "";

    return `${parsed.getFullYear()}년 ${parsed.getMonth() + 1}월 ${parsed.getDate()}일`;
}

function parseDate(value) {
    const parts = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!parts) return null;

    return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
}

function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function normalizeColor(value) {
    const color = String(value || "").trim();

    if (/^#[0-9a-f]{6}$/i.test(color)) return color;

    return "";
}
