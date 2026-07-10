import { auth, db } from "./firebase.js";
import { withFirestoreReadTimeout } from "./firestore-utils.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
    collection,
    getDocs,
    limit,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore-lite.js";

export async function getAdminProfile(user) {
    if (!user) return null;

    const profile = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email
    };

    // Firestore Rules상 관리자만 초안(draft) 목록을 조회할 수 있으므로,
    // 이 쿼리가 성공하면 실제 Rules와 동일한 관리자 권한이 있는 것으로 판단한다.
    // A custom claim alone is not accepted because the deployed Rules may use a
    // different policy (for example, a verified-email allowlist).
    await withFirestoreReadTimeout(
        getDocs(query(collection(db, "notices"), where("status", "==", "draft"), limit(1)))
    );

    return profile;
}

export function requireAdmin({ onAllowed, onDenied, onError } = {}) {
    let checkSequence = 0;

    return onAuthStateChanged(auth, async user => {
        const currentCheck = ++checkSequence;

        if (!user) {
            window.location.replace("/admin/login.html");
            return;
        }

        let profile;

        try {
            profile = await getAdminProfile(user);
        } catch (error) {
            if (currentCheck !== checkSequence) return;

            if (isPermissionDenied(error)) {
                if (typeof onDenied === "function") {
                    onDenied(error);
                } else if (typeof onError === "function") {
                    onError(error);
                }

                return;
            }

            console.error("Admin permission probe failed:", error);

            if (typeof onError === "function") {
                onError(error);
            }

            return;
        }

        if (currentCheck !== checkSequence || auth.currentUser?.uid !== user.uid) return;

        if (typeof onAllowed === "function") {
            try {
                await onAllowed({ user, profile });
            } catch (error) {
                console.error("Admin initialization failed:", error);

                if (typeof onError === "function") {
                    onError(error);
                }
            }
        }
    }, error => {
        console.error("Admin authentication observer failed:", error);

        if (typeof onError === "function") {
            onError(error);
        }
    });
}

export async function logoutAdmin() {
    await signOut(auth);
    window.location.replace("/admin/login.html");
}

function isPermissionDenied(error) {
    return String(error?.code || "").endsWith("permission-denied");
}
