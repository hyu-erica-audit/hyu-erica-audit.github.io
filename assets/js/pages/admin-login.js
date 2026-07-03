import { auth } from "../firebase.js";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const form = document.getElementById("admin-login-form");
const emailInput = document.getElementById("admin-email");
const passwordInput = document.getElementById("admin-password");
const message = document.getElementById("admin-login-message");
const submitButton = form?.querySelector("button[type='submit']");
const submitLabel = submitButton?.querySelector(".admin-submit-label");
const submitSpinner = submitButton?.querySelector(".admin-submit-spinner");

function setLoading(isLoading) {
    if (!submitButton || !submitLabel || !submitSpinner) return;

    submitButton.disabled = isLoading;
    submitLabel.textContent = isLoading ? "확인 중" : "로그인";
    submitSpinner.classList.toggle("d-none", !isLoading);
}

function showMessage(text, type = "danger") {
    if (!message) return;

    message.textContent = text;
    message.className = `admin-message admin-message-${type}`;
}

function getLoginErrorMessage(errorCode) {
    const messages = {
        "auth/invalid-email": "이메일 형식을 확인해주세요.",
        "auth/user-disabled": "비활성화된 계정입니다.",
        "auth/user-not-found": "등록되지 않은 계정입니다.",
        "auth/wrong-password": "비밀번호가 올바르지 않습니다.",
        "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다.",
        "auth/too-many-requests": "로그인 시도가 많습니다. 잠시 후 다시 시도해주세요."
    };

    return messages[errorCode] || "로그인 중 오류가 발생했습니다.";
}

onAuthStateChanged(auth, user => {
    if (user) {
        window.location.replace("/admin/index.html");
    }
});

form?.addEventListener("submit", async event => {
    event.preventDefault();
    setLoading(true);
    showMessage("", "muted");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        // Redirect is handled by the onAuthStateChanged listener above.
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        showMessage(getLoginErrorMessage(error.code));
    } finally {
        setLoading(false);
    }
});
