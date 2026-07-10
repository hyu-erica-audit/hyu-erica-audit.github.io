import { auth } from "../firebase.js";
import { getAdminProfile } from "../admin-auth.js";
import {
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const form = document.getElementById("admin-login-form");
const emailInput = document.getElementById("admin-email");
const passwordInput = document.getElementById("admin-password");
const message = document.getElementById("admin-login-message");
const submitButton = form?.querySelector("button[type='submit']");
const submitLabel = submitButton?.querySelector(".admin-submit-label");
const submitSpinner = submitButton?.querySelector(".admin-submit-spinner");
const signOutButton = document.getElementById("admin-login-signout");
let verificationSequence = 0;
let currentVerification = null;

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
        void verifyAdminAccess(user);
        return;
    }

    verificationSequence += 1;
    currentVerification = null;
    signOutButton?.classList.add("d-none");
    setLoading(false);
});

signOutButton?.addEventListener("click", async () => {
    setLoading(true);

    try {
        await signOut(auth);
        showMessage("로그아웃했습니다. 다른 관리자 계정으로 로그인해주세요.", "muted");
        emailInput?.focus();
    } catch (error) {
        console.error("Admin login sign-out failed:", error);
        showMessage("로그아웃하지 못했습니다. 페이지를 새로고침해주세요.");
    } finally {
        setLoading(false);
    }
});

form?.addEventListener("submit", async event => {
    event.preventDefault();
    setLoading(true);
    showMessage("", "muted");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await verifyAdminAccess(credential.user);
    } catch (error) {
        showMessage(getLoginErrorMessage(error.code));
        setLoading(false);
    }
});

function verifyAdminAccess(user) {
    if (currentVerification?.uid === user.uid) {
        return currentVerification.promise;
    }

    const sequence = ++verificationSequence;
    const promise = (async () => {
        setLoading(true);
        signOutButton?.classList.add("d-none");
        showMessage("관리자 권한을 확인하는 중입니다.", "muted");

        try {
            await getAdminProfile(user);

            if (sequence !== verificationSequence || auth.currentUser?.uid !== user.uid) return;

            window.location.replace("/admin/index.html");
        } catch (error) {
            if (sequence !== verificationSequence || auth.currentUser?.uid !== user.uid) return;

            console.error("Admin login permission probe failed:", error);
            showMessage("관리자 권한 또는 App Check 상태를 확인하지 못했습니다. 다시 시도하거나 다른 계정으로 로그인해주세요.");
            signOutButton?.classList.remove("d-none");
        } finally {
            if (sequence === verificationSequence && auth.currentUser?.uid === user.uid) {
                currentVerification = null;
                setLoading(false);
            }
        }
    })();

    currentVerification = { uid: user.uid, promise };

    return promise;
}
