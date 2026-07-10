import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.2.4/+esm";
export { escapeHtml } from "./text-utils.js";

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

DOMPurify.addHook("afterSanitizeAttributes", node => {
    if (node.tagName !== "A" || node.getAttribute("target") !== "_blank") return;

    const relValues = new Set(String(node.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
    relValues.add("noopener");
    relValues.add("noreferrer");
    node.setAttribute("rel", Array.from(relValues).join(" "));
});

export function sanitizeHtml(html) {
    return DOMPurify.sanitize(String(html ?? ""), SANITIZE_CONFIG);
}
