
import { fetchPublishedFaqs } from "../faq-service.js";
import { escapeHtml, sanitizeHtml } from "../html-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
    const accordionContainer = document.getElementById("faqAccordion");
    const searchInput = document.getElementById("faqSearch");
    const emptyState = document.getElementById("faqEmpty");
    const noResults = document.getElementById("noResults");
    const status = document.getElementById("faqStatus");

    if (!accordionContainer || !searchInput || !emptyState || !noResults || !status) return;

    status.textContent = "자주 묻는 질문을 불러오는 중입니다.";

    let faqData;

    try {
        const items = await fetchPublishedFaqs();
        faqData = items.map(item => ({
            ...item,
            searchText: normalizeSearchText(`${item.question} ${getVisibleText(item.answerHtml)}`)
        }));
        renderFaqs(faqData, { accordionContainer, emptyState, noResults, status });
    } catch (error) {
        console.error("FAQ load failed:", error);
        renderLoadError({ accordionContainer, emptyState, noResults, status });
        return;
    }

    searchInput.addEventListener("input", event => {
        const keyword = normalizeSearchText(event.target.value);
        const filteredData = keyword
            ? faqData.filter(item => item.searchText.includes(keyword))
            : faqData;

        renderFaqs(filteredData, {
            accordionContainer,
            emptyState,
            noResults,
            status,
            keyword: faqData.length > 0 ? keyword : ""
        });
    });
});

function renderFaqs(data, { accordionContainer, emptyState, noResults, status, keyword = "" }) {
    accordionContainer.innerHTML = "";
    emptyState.classList.add("d-none");
    noResults.classList.add("d-none");

    if (data.length === 0) {
        const isSearch = Boolean(keyword);

        (isSearch ? noResults : emptyState).classList.remove("d-none");
        status.textContent = isSearch
            ? "검색 결과가 없습니다."
            : "등록된 자주 묻는 질문이 없습니다.";
        return;
    }

    accordionContainer.innerHTML = data.map((item, index) => {
        const buttonId = `faq-button-${index}`;
        const panelId = `faq-panel-${index}`;

        return `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" id="${buttonId}" type="button"
                        data-bs-toggle="collapse" data-bs-target="#${panelId}"
                        aria-expanded="false" aria-controls="${panelId}">
                        <span class="q-prefix">Q.</span> ${escapeHtml(item.question)}
                    </button>
                </h2>
                <div id="${panelId}" class="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion" aria-labelledby="${buttonId}">
                    <div class="accordion-body">
                        ${sanitizeHtml(item.answerHtml)}
                    </div>
                </div>
            </div>
        `;
    }).join("");

    status.textContent = keyword
        ? `검색 결과 ${data.length}개가 있습니다.`
        : `자주 묻는 질문 ${data.length}개를 불러왔습니다.`;
}

function renderLoadError({ accordionContainer, emptyState, noResults, status }) {
    emptyState.classList.add("d-none");
    noResults.classList.add("d-none");
    accordionContainer.innerHTML = `
        <div class="alert alert-warning small" role="alert">FAQ를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>
    `;
    status.textContent = "자주 묻는 질문을 불러오지 못했습니다.";
}

function getVisibleText(html) {
    const template = document.createElement("template");

    template.innerHTML = sanitizeHtml(html);

    return template.content.textContent || "";
}

function normalizeSearchText(value) {
    return String(value || "").toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}
