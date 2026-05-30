import {
    fetchPublishedGreeting,
    getFirebaseGreetingErrorMessage
} from "../greeting-service.js?v=20260530-greeting";

document.addEventListener("DOMContentLoaded", async () => {
    const titleElement = document.getElementById("greeting-title");
    const bodyElement = document.getElementById("greeting-body");
    const signatureTitleElement = document.getElementById("greeting-signature-title");
    const signatureNameElement = document.getElementById("greeting-signature-name");

    if (!titleElement || !bodyElement || !signatureTitleElement || !signatureNameElement) return;

    try {
        const greeting = await fetchPublishedGreeting();

        if (!greeting) return;

        titleElement.textContent = greeting.title || "";
        bodyElement.innerHTML = greeting.bodyHtml || "";
        signatureTitleElement.textContent = greeting.signatureTitle || "";
        signatureNameElement.textContent = greeting.signatureName || "";
    } catch (error) {
        console.error("Greeting load failed:", error);
        bodyElement.insertAdjacentHTML(
            "afterbegin",
            `<div class="alert alert-warning small">인사말 정보를 불러오지 못했습니다. ${escapeHtml(getFirebaseGreetingErrorMessage(error))}</div>`
        );
    }
});

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
