import {
    fetchGreetingForAdmin,
    getFirebaseGreetingErrorMessage,
    saveGreeting
} from "../../greeting-service.js";
import {
    createBusySetter,
    registerEditor,
    saveEntity,
    setEditorHtml,
    showMessage,
    syncEditorToTextarea
} from "./shared.js";

const greetingForm = document.getElementById("admin-greeting-form");
const greetingCurrentStatus = document.getElementById("admin-greeting-current-status");
const greetingCurrentTitle = document.getElementById("admin-greeting-current-title");
const greetingCurrentSignature = document.getElementById("admin-greeting-current-signature");

const greetingFields = {
    title: document.getElementById("greeting-title-input"),
    status: document.getElementById("greeting-status"),
    signatureTitle: document.getElementById("greeting-signature-title-input"),
    signatureName: document.getElementById("greeting-signature-name-input"),
    body: document.getElementById("greeting-body"),
    editor: document.getElementById("greeting-editor")
};

let greeting = null;

const setBusy = createBusySetter({ form: greetingForm, editor: greetingFields.editor });

export function initGreeting() {
    registerEditor("greeting", greetingFields.editor, greetingFields.body);
    resetGreetingForm();

    greetingForm?.addEventListener("submit", handleSubmit);

    return loadGreeting;
}

async function handleSubmit(event) {
    event.preventDefault();

    const payload = readGreetingForm();

    await saveEntity({
        id: "greeting",
        validate: () => (!payload.title || !payload.bodyHtml ? "인사말 제목과 본문을 입력해주세요." : null),
        update: () => saveGreeting(payload),
        setBusy,
        reload: loadGreeting,
        getErrorMessage: getFirebaseGreetingErrorMessage,
        messages: {
            updated: "인사말을 저장했습니다.",
            failed: "인사말 저장에 실패했습니다.",
            logLabel: "Greeting save failed:"
        }
    });
}

async function loadGreeting() {
    if (!greetingForm) return;

    setGreetingSummary(null, "불러오는 중");

    try {
        greeting = await fetchGreetingForAdmin();

        if (greeting) {
            fillGreetingForm(greeting);
            setGreetingSummary(greeting);
        } else {
            resetGreetingForm();
            setGreetingSummary(null, "저장된 인사말 없음");
        }
    } catch (error) {
        console.error("Admin greeting load failed:", error);
        setGreetingSummary(null, "불러오기 실패");
        showMessage(`인사말을 불러오지 못했습니다. ${getFirebaseGreetingErrorMessage(error)}`, "danger", 12000);
    }
}

function readGreetingForm() {
    syncEditorToTextarea("greeting");

    return {
        title: greetingFields.title.value.trim(),
        bodyHtml: greetingFields.body.value.trim(),
        signatureTitle: greetingFields.signatureTitle.value.trim(),
        signatureName: greetingFields.signatureName.value.trim(),
        status: greetingFields.status.value,
        createdAt: greeting?.createdAt || null
    };
}

function fillGreetingForm(nextGreeting) {
    greetingFields.title.value = nextGreeting.title || "";
    greetingFields.status.value = nextGreeting.status || "draft";
    greetingFields.signatureTitle.value = nextGreeting.signatureTitle || "";
    greetingFields.signatureName.value = nextGreeting.signatureName || "";
    setEditorHtml("greeting", nextGreeting.bodyHtml || "");
}

function resetGreetingForm() {
    greetingForm?.reset();

    greetingFields.title.value = "";
    greetingFields.status.value = "published";
    greetingFields.signatureTitle.value = "";
    greetingFields.signatureName.value = "";
    setEditorHtml("greeting", "");
}

function setGreetingSummary(nextGreeting, fallbackStatus = "-") {
    if (greetingCurrentStatus) {
        greetingCurrentStatus.textContent = nextGreeting
            ? nextGreeting.status === "published" ? "게시" : "임시저장"
            : fallbackStatus;
    }

    if (greetingCurrentTitle) {
        greetingCurrentTitle.textContent = nextGreeting?.title || "-";
    }

    if (greetingCurrentSignature) {
        greetingCurrentSignature.textContent = [nextGreeting?.signatureTitle, nextGreeting?.signatureName]
            .filter(Boolean)
            .join(" ") || "-";
    }
}
