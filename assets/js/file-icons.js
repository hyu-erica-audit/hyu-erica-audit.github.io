const ALLOWED_ICONS = new Set([
    "bi-file-earmark-text",
    "bi-card-checklist",
    "bi-receipt",
    "bi-clipboard-check",
    "bi-folder-check",
    "bi-file-earmark-word",
    "bi-file-earmark-pdf",
    "bi-bus-front",
    "bi-car-front",
    "bi-taxi-front",
    "bi-fuel-pump",
    "bi-cart"
]);

export function getFileIconClass(fileName) {
    const item = fileName && typeof fileName === "object" ? fileName : { fileName };
    const icon = String(item.icon || "");

    if (ALLOWED_ICONS.has(icon)) return icon;

    const name = String(item.fileName || "").toLowerCase();
    const contentType = String(item.contentType || "").toLowerCase();

    if (name.endsWith(".pdf") || contentType.includes("pdf")) return "bi-file-earmark-pdf";
    if (name.endsWith(".doc") || name.endsWith(".docx") || contentType.includes("word")) return "bi-file-earmark-word";

    return "bi-file-earmark-arrow-down";
}
