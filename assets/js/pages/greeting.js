import {
    fetchPublishedGreeting,
    getFirebaseGreetingErrorMessage
} from "../greeting-service.js";
import { escapeHtml, sanitizeHtml } from "../html-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
    const titleElement = document.getElementById("greeting-title");
    const bodyElement = document.getElementById("greeting-body");
    const signatureTitleElement = document.getElementById("greeting-signature-title");
    const signatureNameElement = document.getElementById("greeting-signature-name");

    if (!titleElement || !bodyElement || !signatureTitleElement || !signatureNameElement) return;

    try {
        const greeting = await fetchPublishedGreeting();

        if (!greeting) {
            bodyElement.innerHTML = `<p class="text-muted text-center py-5">인사말을 준비 중입니다.</p>`;
            return;
        }

        titleElement.textContent = greeting.title || "";
        bodyElement.innerHTML = sanitizeHtml(greeting.bodyHtml || "");
        signatureTitleElement.textContent = greeting.signatureTitle || "";
        signatureNameElement.textContent = greeting.signatureName || "";
    } catch (error) {
        console.error("Greeting load failed:", error);
        bodyElement.insertAdjacentHTML(
            "afterbegin",
            `<div class="alert alert-warning small">인사말 정�