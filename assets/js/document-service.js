import { db, storage } from "./firebase.js";
import { formatDateForInput, getYearFromDate } from "./date-utils.js";
import {
    getFirebaseErrorMessage as getCommonFirebaseErrorMessage,
    PUBLIC_QUERY_LIMIT,
    withFirestoreTimeout
} from "./firestore-utils.js";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore-lite.js";
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytesResumable
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

const documentsRef = collection(db, "documents");
const ALLOWED_FILE_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export function normalizeDocument(id, data = {}) {
    return {
        id,
        type: data.type || "report",
        title: data.title || "",
        subtitle: data.subtitle || "",
        description: data.description || "",
        icon: data.icon || "",
        date: data.date || "",
        year: Number(data.year || getYearFromDate(data.date) || new Date().getFullYear()),
        category: data.category || "",
        status: data.status || "draft",
        isImportant: Boolean(data.isImportant),
        fileName: data.fileName || "",
        filePath: data.filePath || "",
        fileSize: Number(data.fileSize || 0),
        contentType: data.contentType || "",
        downloadUrl: data.downloadUrl || "",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
    };
}

export function sortDocuments(documents) {
    return [...documents].sort((a, b) => {
        const dateCompare = parseDocumentDate(b.date) - parseDocumentDate(a.date);

        if (dateCompare !== 0) return dateCompare;

        return String(a.title || "").localeCompare(String(b.title || ""), "ko");
    });
}

export async function fetchPublishedDocuments({ type, year } = {}) {
    // 등호(==) 조건만 사용하므로 복합 인덱스 없이 서버에서 type을 필터링할 수 있다.
    const constraints = [where("status", "==", "published")];

    if (type) {
        constraints.push(where("type", "==", type));
    }

    constraints.push(limit(PUBLIC_QUERY_LIMIT));

    const snapshot = await withFirestoreTimeout(getDocs(query(documentsRef, ...constraints)));
    const documents = snapshot.docs
        .map(item => normalizeDocument(item.id, item.data()))
        .filter(item => !year || item.year === Number(year));

    return sortDocuments(documents);
}

export async function fetchAllDocuments() {
    const snapshot = await withFirestoreTimeout(getDocs(documentsRef));
    const documents = snapshot.docs.map(item => normalizeDocument(item.id, item.data()));

    return sortDocuments(documents);
}

export async function createDocument(data, file, onProgress) {
    if (!file) {
        throw new Error("업로드할 파일을 선택해주세요.");
    }

    validateFile(file);

    const documentRef = doc(documentsRef);
    const payload = buildDocumentPayload(data, file, true);
    const storagePath = getStoragePath(documentRef.id, payload.type, file.name);

    await uploadFile(storagePath, file, onProgress);

    const downloadUrl = await getDownloadURL(ref(storage, storagePath));

    await withFirestoreTimeout(setDoc(documentRef, {
        ...payload,
        filePath: storagePath,
        downloadUrl,
        createdAt: serverTimestamp()
    }));

    return documentRef.id;
}

export async function updateDocument(id, data, file, previousDocument, onProgress) {
    const payload = buildDocumentPayload(data, file || previousDocument, false);

    if (file) {
        validateFile(file);

        const storagePath = getStoragePath(id, payload.type, file.name);

        await uploadFile(storagePath, file, onProgress);
        payload.filePath = storagePath;
        payload.downloadUrl = await getDownloadURL(ref(storage, storagePath));

        if (previousDocument?.filePath && previousDocument.filePath !== storagePath) {
            await deleteStorageFile(previousDocument.filePath);
        }
    }

    await withFirestoreTimeout(updateDoc(doc(db, "documents", String(id)), payload));
}

export async function removeDocument(documentItem) {
    if (documentItem?.filePath) {
        await deleteStorageFile(documentItem.filePath);
    }

    await withFirestoreTimeout(deleteDoc(doc(db, "documents", String(documentItem.id))));
}

export async function resolveDocumentDownloadUrl(documentItem) {
    if (documentItem.downloadUrl) return documentItem.downloadUrl;
    if (!documentItem.filePath) return "";

    return getDownloadURL(ref(storage, documentItem.filePath));
}

export function getFirebaseDocumentErrorMessage(error) {
    return getCommonFirebaseErrorMessage(error, {
        rulesName: "Firestore Rules와 Storage Rules"
    });
}

function buildDocumentPayload(data, fileLike, isCreate) {
    const date = data.date || formatDateForInput(new Date());
    const fileName = fileLike?.name || fileLike?.fileName || "";
    const contentType = fileLike?.type || fileLike?.contentType || "";
    const fileSize = fileLike?.size || fileLike?.fileSize || 0;

    return {
        type: data.type || "report",
        title: data.title || "",
        subtitle: data.subtitle || "",
        description: data.description || "",
        icon: data.icon || "",
        date,
        year: Number(data.year || getYearFromDate(date) || new Date().getFullYear()),
        category: data.category || "",
        status: data.status || "draft",
        isImportant: Boolean(data.isImportant),
        fileName,
        fileSize,
        contentType,
        updatedAt: serverTimestamp()
    };
}

function uploadFile(storagePath, file, onProgress) {
    return new Promise((resolve, reject) => {
        const task = uploadBytesResumable(ref(storage, storagePath), file, {
            contentType: file.type || guessContentType(file.name),
            contentDisposition: `attachment; filename*=UTF-8''${encodeRFC5987ValueChars(file.name)}`,
            customMetadata: {
                originalName: file.name
            }
        });

        task.on(
            "state_changed",
            snapshot => {
                const progress = snapshot.totalBytes > 0
                    ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
                    : 0;

                if (typeof onProgress === "function") {
                    onProgress(progress);
                }
            },
            reject,
            () => resolve(task.snapshot)
        );
    });
}

function validateFile(file) {
    const contentType = file.type || guessContentType(file.name);

    if (!ALLOWED_FILE_TYPES.has(contentType)) {
        throw new Error("PDF, DOC, DOCX 파일만 업로드할 수 있습니다.");
    }
}

async function deleteStorageFile(filePath) {
    try {
        await deleteObject(ref(storage, filePath));
    } catch (error) {
        if (error?.code !== "storage/object-not-found") {
            throw error;
        }
    }
}

function getStoragePath(id, type, fileName) {
    const typeMap = {
        minutes: "minutes",
        report: "reports",
        regularAudit: "regular-audit",
        rule: "rules",
        form: "forms"
    };
    const safeType = typeMap[type] || "documents";
    const extension = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "file";

    return `public/${safeType}/${id}/document.${extension}`;
}

function guessContentType(fileName) {
    const extension = String(fileName || "").split(".").pop().toLowerCase();

    if (extension === "pdf") return "application/pdf";
    if (extension === "doc") return "application/msword";
    if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    return "";
}

function encodeRFC5987ValueChars(value) {
    return encodeURIComponent(value)
        .replaceAll("'", "%27")
        .replaceAll("(", "%28")
        .replaceAll(")", "%29")
        .replaceAll("*", "%2A");
}

function parseDocumentDate(value) {
    const parts = String(value || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);

    if (!parts) return 0;

    return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])).getTime();
}
                                                                                                                                                                                                                                               