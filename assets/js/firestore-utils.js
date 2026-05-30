export const FIRESTORE_TIMEOUT_MS = 20000;
export const PUBLIC_QUERY_LIMIT = 300;

export function withFirestoreTimeout(promise, timeoutMs = FIRESTORE_TIMEOUT_MS) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => {
                reject(new Error("Firestore request timed out. Check network, Firebase project settings, and Firestore rules."));
            }, timeoutMs);
        })
    ]);
}

export function getFirebaseErrorMessage(error, { serviceName = "Firestore", rulesName = "Firestore Rules" } = {}) {
    const code = error?.code ? `[${error.code}] ` : "";
    const message = error?.message || String(error);

    if (message.includes("timed out")) {
        return `${code}${serviceName} 응답 시간이 초과되었습니다. 네트워크 또는 Firebase 설정을 확인해주세요.`;
    }

    if (error?.code === "storage/unauthorized" || error?.code === "permission-denied") {
        return `${code}권한이 거부되었습니다. ${rulesName}가 게시되었는지, 로그인 계정 권한이 올바른지 확인해주세요.`;
    }

    if (error?.code === "storage/quota-exceeded") {
        return `${code}Storage 사용량 또는 다운로드 한도를 초과했습니다. Firebase 사용량을 확인해주세요.`;
    }

    if (error?.code === "unauthenticated") {
        return `${code}로그인 인증이 전달되지 않았습니다. 로그아웃 후 다시 로그인해주세요.`;
    }

    if (error?.code === "failed-precondition") {
        return `${code}${serviceName} 설정 또는 인덱스 조건이 맞지 않습니다.`;
    }

    if (error?.code === "unavailable") {
        return `${code}${serviceName} 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.`;
    }

    return `${code}${message}`;
}
