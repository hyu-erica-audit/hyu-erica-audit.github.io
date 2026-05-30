import { renderDocumentPage } from "./document-page.js?v=20260530-refactor";

document.addEventListener("DOMContentLoaded", () => {
    renderDocumentPage({
        type: "report",
        year: 2026
    });
});
