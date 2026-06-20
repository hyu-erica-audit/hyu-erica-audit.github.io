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
                const label = button.querySelector("span");

                if (label) {
                    label.textContent = "복사됨";
                    window.setTimeout(() => {
                        label.textContent = defaultText;
                    }, 1600);
                }
            } catch (error) {
                console.error("Copy failed:", error);
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initSubmissionCardDetails();
    initInquiryCopyButtons();
});
