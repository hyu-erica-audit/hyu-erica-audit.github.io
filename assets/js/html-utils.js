import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.2.4/+esm";

const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        "p", "br", "div", "span",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "b", "strong", "i", "em", "u", "s", "strike",
        "ul", "ol", "li",
        "a", "img", "blockquote", "pre", "code",
        "table", "thead", "tbody", "tr", "td", "th",
        "hr"
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
};

export function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function sanitizeHtml(html) {
    return DOMPurify.sanitize(String(html ?? ""), SANITIZE_CONFIG);
}
