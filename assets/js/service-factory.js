import { db } from "./firebase.js";
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

export function createCrudService({
    collectionName,
    normalize,
    sort,
    buildPayload,
    publishedField = "status",
    publishedValue = "published"
}) {
    const ref = collection(db, collectionName);
    const sortItems = typeof sort === "function" ? sort : items => items;

    async function fetchPublished() {
        const publishedQuery = query(ref, where(publishedField, "==", publishedValue), limit(PUBLIC_QUERY_LIMIT));
        const snapshot = await withFirestoreTimeout(getDocs(publishedQuery));

        return sortItems(snapshot.docs.map(item => normalize(item.id, item.data())));
    }

    async function fetchAll() {
        const snapshot = await withFirestoreTimeout(getDocs(ref));

        return sortItems(snapshot.docs.map(item => normalize(item.id, item.data())));
    }

    async function fetchOne(id) {
        const snapshot = await withFirestoreTimeout(getDoc(doc(db, collectionName, String(id))));

        if (!snapshot.exists()) return null;

        return normalize(snapshot.id, snapshot.data());
    }

    async function create(data) {
        const created = await withFirestoreTimeout(addDoc(ref, buildPayload(data, true)));

        return created.id;
    }

    async function update(id, data) {
        await withFirestoreTimeout(updateDoc(doc(db, collectionName, String(id)), buildPayload(data, false)));
    }

    async function remove(id) {
        await withFirestoreTimeout(deleteDoc(doc(db, collectionName, String(id))));
    }

    return { ref, fetchPublished, fetchAll, fetchOne, create, update, remove };
}

export function withTimestamps(payload, isCreate) {
    const result = {
        ...payload,
        updatedAt: serverTimestamp()
    };

    if (isCreate) {
        result.createdAt = serverTimestamp();
    }

    return result;
}
