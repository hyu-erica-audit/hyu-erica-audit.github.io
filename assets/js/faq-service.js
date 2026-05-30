import { db } from "./firebase.js?v=20260529-faq-editor";
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

const faqsRef = collection(db, "faqs");
const FIRESTORE_TIMEOUT_MS = 20000;
const PUBLIC_QUERY_LIMIT = 300;

export function normalizeFaq(id, data = {}) {
    return {
        id,
        question: data.question || "",
        answerHtml: data.answerHtml || data.answer || "",
        status: data.status || "draft",
        order: Number(data.order || 0),
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
    };
}

export function sortFaqs(faqs) {
    return [...faqs].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;

        const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;

        return aTime - bTime;
    });
}

export async function fetchPublishedFaqs() {
    const publishedQuery = query(faqsRef, where("status", "==", "published"), limit(PUBLIC_QUERY_LIMIT));
    const snapshot = await withFirestoreTimeout(getDocs(publishedQuery));
    const faqs = snapshot.docs.map(item => normalizeFaq(item.id, item.data()));

    return sortFaqs(faqs);
}

export async function fetchAllFaqs() {
    const snapshot = await withFirestoreTimeout(getDocs(faqsRef));
    const faqs = snapshot.docs.map(item => normalizeFaq(item.id, item.data()));

    return sortFaqs(faqs);
}

export async function fetchFaq(id) {
    const snapshot = await withFirestoreTimeout(getDoc(doc(db, "faqs", String(id))));

    if (!snapshot.exists()) return null;

    return normalizeFaq(snapshot.id, snapshot.data());
}

export async function createFaq(data) {
    const payload = buildFaqPayload(data, true);
    const created = await withFirestoreTimeout(addDoc(faqsRef, payload));

    return created.id;
}

export async function updateFaq(id, data) {
    const payload = buildFaqPayload(data, false);

    await withFirestoreTimeout(updateDoc(doc(db, "faqs", String(id)), payload));
}

export async function removeFaq(id) {
    await withFirestoreTimeout(deleteDoc(doc(db, "faqs", String(id))));
}

function buildFaqPayload(data, isCreate) {
    const payload = {
        question: data.question || "",
        answerHtml: data.answerHtml || "",
        status: data.status || "draft",
        order: Number(data.order || 0),
        updatedAt: serverTimestamp()
    };

    if (isCreate) {
        payload.createdAt = serverTimestamp();
    }

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
