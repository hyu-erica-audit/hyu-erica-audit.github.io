import { db } from "./firebase.js?v=20260530-no-local-data";
import {
    getFirebaseErrorMessage as getCommonFirebaseErrorMessage,
    withFirestoreTimeout
} from "./firestore-utils.js";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore-lite.js";

const greetingRef = doc(db, "siteContents", "greeting");

export function normalizeGreeting(data = {}) {
    return {
        title: data.title || "",
        bodyHtml: data.bodyHtml || "",
        signatureTitle: data.signatureTitle || "",
        signatureName: data.signatureName || "",
        status: data.status || "draft",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
    };
}

export async function fetchPublishedGreeting() {
    const snapshot = await withFirestoreTimeout(getDoc(greetingRef));

    if (!snapshot.exists()) return null;

    const greeting = normalizeGreeting(snapshot.data());

    return greeting.status === "published" ? greeting : null;
}

export async function fetchGreetingForAdmin() {
    const snapshot = await withFirestoreTimeout(getDoc(greetingRef));

    return snapshot.exists() ? normalizeGreeting(snapshot.data()) : null;
}

export async function saveGreeting(data) {
    await withFirestoreTimeout(setDoc(greetingRef, buildGreetingPayload(data), { merge: true }));
}

function buildGreetingPayload(data) {
    return {
        title: data.title || "",
        bodyHtml: data.bodyHtml || "",
        signatureTitle: data.signatureTitle || "",
        signatureName: data.signatureName || "",
        status: data.status || "draft",
        updatedAt: serverTimestamp(),
        createdAt: data.createdAt || serverTimestamp()
    };
}

export function getFirebaseGreetingErrorMessage(error) {
    return getCommonFirebaseErrorMessage(error);
}
