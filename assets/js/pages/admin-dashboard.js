import { requireAdmin, logoutAdmin } from "../admin-auth.js";
import { auth } from "../firebase.js";
import { initEditorToolbar } from "./admin/shared.js";
import { initNotices } from "./admin/notices.js";
import { initFaq } from "./admin/faq.js";
import { initSchedule } from "./admin/schedule.js";
import { initGreeting } from "./admin/greeting.js";
import { initOrganization } from "./admin/organization.js";
import { initContributors } from "./admin/contributors.js";
import { initDocuments } from "./admin/documents.js";

const loading = document.getElementById("admin-loading");
const loadingSpinner = document.getElementById("admin-loading-spinner");
const loadingMessage = document.getElementById("admin-loading-message");
const retryButton = document.getElementById("admin-auth-retry");
const authErrorLogoutButton = document.getElementById("admin-auth-logout");
const app = document.getElementById("admin-app");
const email = document.getElementById("admin-user-email");
const logoutButton = document.getElementById("admin-logout-button");
const topbarTitle = document.querySelector(".admin-topbar h1");
const viewLinks = document.querySelectorAll("[data-admin-view]");
const viewPanels = document.querySelectorAll("[data-admin-view-panel]");

// Each init wires its own DOM listeners and returns the section loader.
const sectionLoaders = [
    initNotices(),
    initFaq(),
    initSchedule(),
    initGreeting(),
    initOrganization(),
    initContributors(),
    initDocuments()
];

initEditorToolbar();

logoutButton?.addEventListener("click", logoutAdmin);
retryButton?.addEventListener("click", () => window.location.reload());
authErrorLogoutButton?.addEventListener("click", logoutAdmin);

viewLinks.forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        setAdminView(link.dataset.adminView, true);
    });
});

setAdminView(getInitialView(), false);

requireAdmin({
    onAllowed: async ({ profile, user }) => {
        setLoadingState("관리 데이터를 불러오는 중입니다.");

        if (email) {
            email.textContent = profile.email || "";
        }

        // Load all sections in parallel; each loader renders its own error
        // state, so a failed section never blocks the others.
        const results = await Promise.allSettled(sectionLoaders.map(load => load()));

        results.forEach(result => {
            if (result.status === "rejected") {
                console.error("Admin section load failed:", result.reason);
            }
        });

        if (auth.currentUser?.uid !== user.uid) return;

        if (results.some(result => result.status === "rejected")) {
            showAdminError("일부 관리 데이터를 불러오지 못했습니다. 다시 시도해주세요.");
            return;
        }

        loading?.classList.add("d-none");
        app?.classList.remove("d-none");
    },
    onError: error => {
        console.error("Admin access could not be verified:", error);
        showAdminError();
    }
});

function setLoadingState(text) {
    app?.classList.add("d-none");
    loading?.classList.remove("d-none");
    loadingSpinner?.classList.remove("d-none");
    retryButton?.classList.add("d-none");
    authErrorLogoutButton?.classList.add("d-none");

    if (loadingMessage) {
        loadingMessage.textContent = text;
    }
}

function showAdminError(text = "관리자 권한을 확인하지 못했습니다. 계정 권한, App Check, 네트워크 상태를 확인한 뒤 다시 시도해주세요.") {
    app?.classList.add("d-none");
    loading?.classList.remove("d-none");
    loadingSpinner?.classList.add("d-none");
    retryButton?.classList.remove("d-none");
    authErrorLogoutButton?.classList.remove("d-none");

    if (loadingMessage) {
        loadingMessage.textContent = text;
    }
}

function getInitialView() {
    const hash = window.location.hash.replace("#", "");

    if (hash === "faqs" || hash === "schedules" || hash === "greeting" || hash === "organization" || hash === "contributors" || hash === "documents" || hash === "rules" || hash === "forms") return hash;

    return "notices";
}

function setAdminView(view, updateHash) {
    const nextView = view === "faqs" || view === "schedules" || view === "greeting" || view === "organization" || view === "contributors" || view === "documents" || view === "rules" || view === "forms" ? view : "notices";
    const titleMap = {
        notices: "공지 관리",
        faqs: "FAQ 관리",
        schedules: "일정 관리",
        greeting: "인사말 관리",
        organization: "조직도 관리",
        contributors: "기여자 관리",
        documents: "문서 관리",
        rules: "세칙 관리",
        forms: "서식 관리"
    };

    viewPanels.forEach(panel => {
        panel.classList.toggle("d-none", panel.dataset.adminViewPanel !== nextView);
    });

    viewLinks.forEach(link => {
        const isActive = link.dataset.adminView === nextView;

        link.classList.toggle("active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    if (topbarTitle) {
        topbarTitle.textContent = titleMap[nextView];
    }

    if (updateHash) {
        window.history.replaceState(null, "", `#${nextView}`);
    }
}
