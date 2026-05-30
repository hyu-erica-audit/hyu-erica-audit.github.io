import { db } from "./firebase.js?v=20260530-no-local-data";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore-lite.js";

const greetingRef = doc(db, "siteContents", "greeting");
const FIRESTORE_TIMEOUT_MS = 20000;

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

export function getFirebaseGreetingErrorMessage(error) {
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
