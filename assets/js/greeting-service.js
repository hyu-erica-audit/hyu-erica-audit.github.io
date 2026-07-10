import { db } from "./firebase.js";
import {
    getFirebaseErrorMessage as getCommonFirebaseErrorMessage,
    withFirestoreReadTimeout
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
    let snapshot;

    try {
        snapshot = await withFirestoreReadTimeout(getDoc(greetingRef));
    } catch (error) {
        // Firestore Rules상 게시되지 않은 인사말은 공개 조회가 거부되므로 null로 처리한다.
        if (error?.code === "permission-denied") return null;

        throw error;
    }

    if (!snapshot.exists()) return null;

    const greeting = normalizeGreeting(snapshot.data());

    return greeting.status === "published" ? greeting : null;
}

export async function fetchGreetingForAdmin() {
    const snapshot = await withFirestoreReadTimeout(getDoc(greetingRef));

    return snapshot.exists() ? normalizeGreeting(snapshot.data()) : null;
}

export async function saveGreeting(data) {
    await setDoc(greetingRef, buildGreetingPayload(data), { merge: true });
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
