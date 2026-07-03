import { auth, db } from "./firebase.js";
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

    try {
        const token = await user.getIdTokenResult();

        if (token.claims.admin === true) return profile;
    } catch (error) {
        console.error("Admin claim check failed:", error);
    }

    try {
        // Firestore Rules상 관리자만 초안(draft) 목록을 조회할 수 있으므로,
        // 이 쿼리가 성공하면 관리자 권한이 있는 것으로 판단한다.
        await getDocs(query(collection(db, "notices"), where("status", "==", "draft"), limit(1)));

        return profile;
    } catch (error) {
        console.error("Admin permission probe failed:", error);

        return null;
    }
}

export function requireAdmin({ onAllowed, onDenied } = {}) {
    return onAuthStateChanged(auth, async user => {
        if (!user) {
            window.location.replace("/admin/login.html");
            return;
        }

        const profile = await getAdminProfile(user);

        if (!profile) {
            await signOut(auth);

            if (typeof onDenied === "function") {
                onDenied();
                return;
            }

            window.location.replace("/admin/login.html");
            return;
        }

        if (typeof onAllowed === "function") {
            onAllowed({ user, profile });
        }
    });
}

export async function logoutAdmin() {
    await signOut(auth);
    window.location.replace("/admin/login.html");
}
