
import { fetchPublishedFaqs } from "../faq-service.js?v=20260529-remove-faq-import";

document.addEventListener("DOMContentLoaded", async function() {
            let faqData = [];

            const accordionContainer = document.getElementById('faqAccordion');
            const searchInput = document.getElementById('faqSearch');
            const noResults = document.getElementById('noResults');

            if (!accordionContainer || !searchInput || !noResults) return;

            function renderFaqs(data) {
                accordionContainer.innerHTML = "";
                if (data.length === 0) {
                    noResults.classList.remove('d-none');
                    return;
                }
                noResults.classList.add('d-none');

                data.forEach((item, index) => {
                    const html = `
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-${index}">
                                    <span class="q-prefix">Q.</span> ${item.question}
                                </button>
                            </h2>
                            <div id="faq-${index}" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                <div class="accordion-body">
                                    ${item.answerHtml}
                                </div>
                            </div>
                        </div>
                    `;
                    accordionContainer.innerHTML += html;
                });
            }

            try {
                const firestoreFaqs = await withTimeout(fetchPublishedFaqs(), 5000);
                faqData = firestoreFaqs;
                renderFaqs(faqData);
            } catch (error) {
                console.error("FAQ load failed:", error);
                renderFaqs([]);
            }

            searchInput.addEventListener('input', function(e) {
                const keyword = e.target.value.toLowerCase();
                const filteredData = faqData.filter(item => 
                    item.question.toLowerCase().includes(keyword) || 
                    item.answerHtml.toLowerCase().includes(keyword)
                );
                renderFaqs(filteredData);
            });
        });

function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error("FAQ request timed out")), timeoutMs);
        })
    ]);
}
