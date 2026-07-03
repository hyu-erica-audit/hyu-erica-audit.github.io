import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.2.4/+esm";

const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        "p", "br", "div", "span",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "b", "strong", "i", "em", "u", "s", "str