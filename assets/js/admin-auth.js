import { auth } from "./firebase.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

export async function getAdminProfile(user) {
    if (!user) return null;

    return {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email
    };
}

export function requireAdmin({ onAllowed, onDenied } = {}) {
    return onAuthStateChanged(auth, async user => {
        if (!user) {
            window.location.replace("/admin/login.html");
            return;
        }

        const profile = await getAdminProfile(user);

        if (!profile) {
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
