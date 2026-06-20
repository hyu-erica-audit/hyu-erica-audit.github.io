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

document.addEventListener("DOMContentLoaded", () => {
    initSubmissionCardDetails();
});
