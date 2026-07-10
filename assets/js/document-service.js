import { db, storage } from "./firebase.js";
import { formatDateForInput, getYearFromDate } from "./date-utils.js";
import {
    getFirebaseStoragePathFromDownloadUrl,
    guessDocumentContentType as guessContentType,
    isDocumentStoragePathForId,
    isSafeFirebaseDownloadUrl,
    validateDocumentFile as validateFile
} from "./document-file-utils.js";
import {
    getFirebaseErrorMessage as getCommonFirebaseErrorMessage,
    PUBLIC_QUERY_LIMIT,
    withFirestoreReadTimeout
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
const storageBucket = storage.app?.options?.storageBucket;

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

    const snapshot = await withFirestoreReadTimeout(getDocs(query(documentsRef, ...constraints)));
    const documents = snapshot.docs
        .map(item => normalizeDocument(item.id, item.data()))
        .filter(item => !year || item.year === Number(year));

    return sortDocuments(documents);
}

export async function fetchAllDocuments() {
    const snapshot = await withFirestoreReadTimeout(getDocs(documentsRef));
    const documents = snapshot.docs.map(item => normalizeDocument(item.id, item.data()));

    return sortDocuments(documents);
}

export async function createDocument(data, file, onProgress) {
    if (!file) {
        throw new Error("업로드할 파일을 선택해주세요.");
    }

    const fileMetadata = validateFile(file);

    const documentRef = doc(documentsRef);
    const payload = buildDocumentPayload(data, file, fileMetadata);
    const storagePath = getStoragePath(documentRef.id, payload.type, fileMetadata.extension);

    await uploadFile(storagePath, file, onProgress, fileMetadata.contentType);

    let downloadUrl;

    try {
        downloadUrl = await getDownloadURL(ref(storage, storagePath));
    } catch (error) {
        await compensateUploadedFile(storagePath, error);
        throw error;
    }

    try {
        await setDoc(documentRef, {
            ...payload,
            filePath: storagePath,
            downloadUrl,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        await handleMetadataWriteFailure(storagePath, error);
        throw error;
    }

    return documentRef.id;
}

export async function updateDocument(id, data, file, previousDocument, onProgress) {
    const fileMetadata = file ? validateFile(file) : null;
    const payload = buildDocumentPayload(data, file || previousDocument, fileMetadata);
    const documentRef = doc(db, "documents", String(id));

    if (file) {
        // A versioned object keeps the currently referenced file intact until
        // the Firestore pointer has been committed successfully.
        const storagePath = getStoragePath(id, payload.type, fileMetadata.extension);

        await uploadFile(storagePath, file, onProgress, fileMetadata.contentType);

        try {
            payload.downloadUrl = await getDownloadURL(ref(storage, storagePath));
        } catch (error) {
            await compensateUploadedFile(storagePath, error);
            throw error;
        }

        payload.filePath = storagePath;

        try {
            await updateDoc(documentRef, payload);
        } catch (error) {
            await handleMetadataWriteFailure(storagePath, error);
            throw error;
        }

        const oldFileCleanupFailed = previousDocument?.filePath && previousDocument.filePath !== storagePath
            ? await cleanupPreviousFile(previousDocument.filePath, id)
            : false;

        return { oldFileCleanupFailed };
    }

    await updateDoc(documentRef, payload);

    return { oldFileCleanupFailed: false };
}

export async function removeDocument(documentItem) {
    const documentRef = doc(db, "documents", String(documentItem.id));
    const legacyFilePath = getFirebaseStoragePathFromDownloadUrl(documentItem.downloadUrl, storageBucket);
    const filePath = documentItem.filePath || legacyFilePath;

    if (!filePath && documentItem.downloadUrl) {
        throw new Error("기존 다운로드 URL에서 Storage 경로를 확인할 수 없어 삭제를 중단했습니다.");
    }

    if (filePath && !isDocumentStoragePathForId(filePath, documentItem.id)) {
        throw new Error("문서 ID와 Storage 경로가 일치하지 않아 삭제를 중단했습니다.");
    }

    if (filePath) {
        // Stage the document as draft to block Rules-authorized reads before
        // deleting its object. A retry can continue if either resource is gone.
        try {
            await updateDoc(documentRef, {
                status: "draft",
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            if (!isDocumentNotFoundError(error)) {
                throw !isDefinitiveWriteFailure(error) ? markPartialMutation(error) : error;
            }
        }

        try {
            await deleteStorageFile(filePath);
            await deleteDoc(documentRef);
        } catch (error) {
            throw markPartialMutation(error);
        }

        return;
    }

    await deleteDoc(documentRef);
}

export async function resolveDocumentDownloadUrl(documentItem) {
    const tokenPath = getFirebaseStoragePathFromDownloadUrl(documentItem.downloadUrl, storageBucket);

    if (isSafeFirebaseDownloadUrl(documentItem.downloadUrl, storageBucket) && isDocumentStoragePathForId(tokenPath, documentItem.id)) {
        return documentItem.downloadUrl;
    }

    if (!isDocumentStoragePathForId(documentItem.filePath, documentItem.id)) return "";

    const downloadUrl = await getDownloadURL(ref(storage, documentItem.filePath));

    return isSafeFirebaseDownloadUrl(downloadUrl, storageBucket) ? downloadUrl : "";
}

export function getFirebaseDocumentErrorMessage(error) {
    if (error?.newFileCleanupFailed) {
        return "저장에 실패했고 새 업로드 파일도 자동 정리하지 못했습니다. Storage의 고아 파일을 확인해주세요.";
    }

    if (error?.metadataWriteOutcomeUnknown) {
        return "저장 결과를 확인할 수 없습니다. 중복 업로드를 피하려면 목록을 새로고침해 반영 여부를 먼저 확인해주세요.";
    }

    return getCommonFirebaseErrorMessage(error, {
        rulesName: "Firestore Rules와 Storage Rules"
    });
}

function buildDocumentPayload(data, fileLike, fileMetadata = null) {
    const date = data.date || formatDateForInput(new Date());
    const fileName = fileMetadata?.fileName ?? fileLike?.fileName ?? fileLike?.name ?? "";
    const contentType = fileMetadata?.contentType ?? fileLike?.contentType ?? "";
    const fileSize = fileMetadata?.fileSize ?? fileLike?.fileSize ?? fileLike?.size ?? 0;

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

function uploadFile(storagePath, file, onProgress, contentType) {
    return new Promise((resolve, reject) => {
        const task = uploadBytesResumable(ref(storage, storagePath), file, {
            contentType: contentType || guessContentType(file.name),
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

async function deleteStorageFile(filePath) {
    try {
        await deleteObject(ref(storage, filePath));
    } catch (error) {
        if (error?.code !== "storage/object-not-found") {
            throw error;
        }
    }
}

function getStoragePath(id, type, extension) {
    const typeMap = {
        minutes: "minutes",
        report: "reports",
        regularAudit: "regular-audit",
        rule: "rules",
        form: "forms"
    };
    const safeType = typeMap[type] || "documents";
    const version = createStorageVersion();

    return `public/${safeType}/${id}/document-${version}.${extension}`;
}

function createStorageVersion() {
    return globalThis.crypto?.randomUUID?.()
        || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

async function compensateUploadedFile(filePath, originalError) {
    try {
        await deleteStorageFile(filePath);
    } catch (cleanupError) {
        console.error("New document file cleanup failed after metadata save failure:", cleanupError);

        if (originalError && typeof originalError === "object" && Object.isExtensible(originalError)) {
            originalError.newFileCleanupFailed = true;
        }
    }
}

async function handleMetadataWriteFailure(filePath, originalError) {
    if (isDefinitiveWriteFailure(originalError)) {
        await compensateUploadedFile(filePath, originalError);
        return;
    }

    if (originalError && typeof originalError === "object" && Object.isExtensible(originalError)) {
        originalError.metadataWriteOutcomeUnknown = true;
    }
}

async function cleanupPreviousFile(filePath, documentId) {
    if (!isDocumentStoragePathForId(filePath, documentId)) {
        console.error("Previous document file cleanup skipped because its path does not match the document ID.");
        return true;
    }

    try {
        await deleteStorageFile(filePath);
        return false;
    } catch (error) {
        console.error("Previous document file cleanup failed after metadata update:", error);
        return true;
    }
}

function isDocumentNotFoundError(error) {
    return error?.code === "not-found" || error?.code === "firestore/not-found";
}

function isDefinitiveWriteFailure(error) {
    return [
        "already-exists",
        "failed-precondition",
        "invalid-argument",
        "not-found",
        "out-of-range",
        "permission-denied",
        "unauthenticated",
        "unimplemented"
    ].includes(String(error?.code || "").replace(/^firestore\//, ""));
}

function markPartialMutation(error) {
    if (error && typeof error === "object" && Object.isExtensible(error)) {
        error.mutationPartiallyApplied = true;
        return error;
    }

    const wrappedError = new Error(error?.message || "Document deletion was partially applied.", { cause: error });
    wrappedError.code = error?.code;
    wrappedError.mutationPartiallyApplied = true;

    return wrappedError;
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
