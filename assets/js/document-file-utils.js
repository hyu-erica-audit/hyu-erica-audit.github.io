export const MAX_DOCUMENT_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const FILE_CONTENT_TYPES = new Map([
    ["pdf", "application/pdf"],
    ["doc", "application/msword"],
    ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
]);
const GENERIC_FILE_CONTENT_TYPES = new Set(["", "application/octet-stream"]);

export function validateDocumentFile(file) {
    const fileName = String(file?.name || "");
    const extension = getDocumentFileExtension(fileName);
    const contentType = FILE_CONTENT_TYPES.get(extension);
    const declaredContentType = String(file?.type || "").trim().toLowerCase();
    const fileSize = Number(file?.size);

    if (!contentType) {
        throw new Error("PDF, DOC, DOCX 파일만 업로드할 수 있습니다.");
    }

    if (!GENERIC_FILE_CONTENT_TYPES.has(declaredContentType) && declaredContentType !== contentType) {
        throw new Error("파일 확장자와 파일 형식이 일치하지 않습니다.");
    }

    if (!Number.isFinite(fileSize) || fileSize < 0 || fileSize >= MAX_DOCUMENT_FILE_SIZE_BYTES) {
        throw new Error("파일 크기는 25MB 미만이어야 합니다.");
    }

    return { contentType, extension, fileName, fileSize };
}

export function guessDocumentContentType(fileName) {
    return FILE_CONTENT_TYPES.get(getDocumentFileExtension(fileName)) || "";
}

export function getDocumentFileExtension(fileName) {
    const name = String(fileName || "");
    const dotIndex = name.lastIndexOf(".");

    return dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : "";
}

export function isSafeFirebaseDownloadUrl(value, expectedBucket) {
    const parsedUrl = parseFirebaseDownloadUrl(value);

    return Boolean(parsedUrl && matchesExpectedBucket(parsedUrl.bucket, expectedBucket));
}

export function getFirebaseStoragePathFromDownloadUrl(value, expectedBucket) {
    const parsedUrl = parseFirebaseDownloadUrl(value);

    if (!parsedUrl || !matchesExpectedBucket(parsedUrl.bucket, expectedBucket)) return "";

    return parsedUrl.filePath;
}

function parseFirebaseDownloadUrl(value) {
    try {
        const url = new URL(String(value || ""));
        const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);

        if (url.protocol !== "https:" || url.hostname !== "firebasestorage.googleapis.com" || !match) {
            return null;
        }

        return {
            bucket: normalizeBucket(decodeURIComponent(match[1])),
            filePath: decodeURIComponent(match[2])
        };
    } catch {
        return null;
    }
}

function matchesExpectedBucket(actualBucket, expectedBucket) {
    if (expectedBucket === undefined) return true;

    const normalizedExpectedBucket = normalizeBucket(expectedBucket);

    return Boolean(normalizedExpectedBucket) && actualBucket === normalizedExpectedBucket;
}

function normalizeBucket(value) {
    return String(value || "")
        .trim()
        .replace(/^gs:\/\//i, "")
        .replace(/\/+$/, "")
        .toLowerCase();
}

export function isDocumentStoragePathForId(filePath, documentId) {
    const segments = String(filePath || "").split("/");

    return segments.length === 4
        && segments[0] === "public"
        && Boolean(segments[1])
        && segments[2] === String(documentId || "")
        && Boolean(segments[3]);
}
