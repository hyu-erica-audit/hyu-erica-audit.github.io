function initSubmissionCardDetails() {
    const cards = document.querySelectorAll(".submission-card[data-detail-target]");
    const details = document.querySelectorAll(".submission-detail");

    cards.forEach(card => {
        card.addEventListener("click", () => {
            const targetId = card.dataset.detailTarget;
            const target = document.getElementById(targetId);
            const isOpen = card.getAttribute("aria-expanded") === "true";

            cards.forEach(item => {
                item.classList.remove("is-active");
                item.setAttribute("aria-expanded", "false");
            });

            details.forEach(detail => {
                detail.hidden = true;
                detail.classList.remove("is-visible");
            });

            if (!target || isOpen) return;

            card.classList.add("is-active");
            card.setAttribute("aria-expanded", "true");
            target.hidden = false;
            target.classList.add("is-visible");
        });
    });
}

function setCopyButtonLabel(button, text) {
    const label = button.querySelector("span");

    if (label) {
        label.textContent = text;
    }
}

function resetCopyButtonLabel(button, text) {
    window.setTimeout(() => {
        setCopyButtonLabel(button, text);
    }, 1600);
}

function initInquiryCopyButtons() {
    const copyButtons = document.querySelectorAll(".inquiry-copy-button[data-copy-target]");

    copyButtons.forEach(button => {
        const defaultText = button.querySelector("span")?.textContent || "복사";

        button.addEventListener("click", async () => {
            const target = document.getElementById(button.dataset.copyTarget);
            const text = target?.textContent;

            if (!text) return;

            try {
                await navigator.clipboard.writeText(text);
                setCopyButtonLabel(button, "복사됨");
                resetCopyButtonLabel(button, defaultText);
            } catch (error) {
                console.error("Copy failed:", error);
                setCopyButtonLabel(button, "실패");
                resetCopyButtonLabel(button, defaultText);
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initSubmissionCardDetails();
    initInquiryCopyButtons();
});
