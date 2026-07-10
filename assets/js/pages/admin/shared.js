import { auth } from "../../firebase.js";
import { escapeHtml, sanitizeHtml } from "../../html-utils.js";

const message = document.getElementById("admin-notice-message");

export function showMessage(text, type = "success", duration = 5000) {
    if (!message) return;

    message.textContent = text;
    message.className = `admin-alert admin-alert-${type}`;
    message.classList.remove("d-none");

    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
        message.classList.add("d-none");
    }, duration);
}

export async function ensureFirestoreAuth() {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("현재 로그인 세션을 찾지 못했습니다. 로그아웃 후 다시 로그인해주세요.");
    }

    await user.getIdToken();
}

export function createBusySetter({ form = null, buttons = [], editor = null, containers = [] } = {}) {
    return isBusy => {
        form?.querySelectorAll("input, select, textarea, button").forEach(element => {
            element.disabled = isBusy;
        });

        containers.forEach(container => {
            container?.querySelectorAll("button").forEach(element => {
                element.disabled = isBusy;
            });
        });

        buttons.forEach(button => {
            if (button) button.disabled = isBusy;
        });

        if (editor) editor.contentEditable = String(!isBusy);
    };
}

export function nextOrder(items = []) {
    const highestOrder = items.reduce((highest, item) => {
        const order = Number(item?.order);

        return Number.isFinite(order) ? Math.max(highest, order) : highest;
    }, 0);

    return highestOrder + 1;
}

export function statusBadge(status) {
    const isPublished = status === "published";

    return `<span class="badge ${isPublished ? "bg-success" : "bg-secondary"}">${isPublished ? "게시" : "임시"}</span>`;
}

// Callers are responsible for escaping any dynamic parts of `text`.
export function mutedRow(text) {
    return `<tr><td colspan="4" class="text-center text-muted py-4">${text}</td></tr>`;
}

export function dangerRow(text) {
    return `<tr><td colspan="4" class="text-center text-danger py-4">${text}</td></tr>`;
}

export function groupHeaderRow(title) {
    return `<tr class="admin-table-group-row"><td colspan="4">${escapeHtml(title)}</td></tr>`;
}

// One delegated click listener per list container. Row templates use
// data-action="..." data-id="..." attributes instead of per-row listeners.
export function attachListActions(container, handlers) {
    container?.addEventListener("click", event => {
        const trigger = event.target.closest("[data-action]");

        if (!trigger || !container.contains(trigger)) return;

        const handler = handlers[trigger.dataset.action];

        if (handler) handler(trigger.dataset.id ?? "", trigger);
    });
}

// Generic save handler shared by every entity (notices, documents, faq,
// greeting, org, contributors, schedule). `validate` returns an error
// message string, or null when the payload is valid.
export async function saveEntity({
    id = "",
    validate = null,
    create = null,
    update = null,
    setBusy,
    reload,
    reset = null,
    onStart = null,
    getErrorMessage,
    messages
}) {
    const validationError = validate ? validate() : null;

    if (validationError) {
        showMessage(validationError, "danger");
        return { ok: false, validationError };
    }

    setBusy(true);
    let preserveBusyState = false;

    try {
        let mutationResult;
        const action = id ? "update" : "create";

        try {
            onStart?.();
            await ensureFirestoreAuth();

            mutationResult = id
                ? await update(id)
                : await create();
        } catch (error) {
            console.error(messages.logLabel || "Save failed:", error);
            showMessage(`${messages.failed} ${getErrorMessage(error)}`, "danger", 12000);

            return { ok: false, error };
        }

        const postMutation = await finishMutation({
            reload,
            reset,
            logLabel: messages.logLabel || "Save"
        });
        preserveBusyState = hasPostMutationFailure(postMutation);
        const feedback = resolveSuccessFeedback(
            id ? messages.updated : messages.created,
            mutationResult,
            { action, id }
        );

        showMutationFeedback(feedback, postMutation);

        return {
            ok: true,
            result: mutationResult,
            ...postMutation
        };
    } finally {
        if (!preserveBusyState) {
            setBusy(false);
        }
    }
}

// Generic delete handler shared by every entity. `guard` returns an error
// message string when deletion must be blocked, or null to proceed.
export async function deleteEntity({
    item,
    guard = null,
    confirmMessage,
    remove,
    setBusy,
    reset,
    reload,
    getErrorMessage,
    messages
}) {
    if (!item) return;

    const guardError = guard ? guard() : null;

    if (guardError) {
        showMessage(guardError, "danger", 8000);
        return;
    }

    if (!window.confirm(confirmMessage)) return;

    setBusy(true);
    let preserveBusyState = false;

    try {
        let mutationResult;

        try {
            await ensureFirestoreAuth();
            mutationResult = await remove();
        } catch (error) {
            if (error?.mutationPartiallyApplied) {
                console.warn(messages.logLabel || "Delete partially applied:", error);

                const postMutation = await finishMutation({
                    reload,
                    reset,
                    logLabel: messages.logLabel || "Delete"
                });
                preserveBusyState = hasPostMutationFailure(postMutation);
                const feedback = {
                    text: messages.partial || "삭제가 일부 반영되었습니다. 현재 목록을 확인한 뒤 다시 시도해주세요.",
                    type: "warning",
                    duration: 12000
                };

                showMutationFeedback(feedback, postMutation);

                return {
                    ok: false,
                    partial: true,
                    error,
                    ...postMutation
                };
            }

            console.error(messages.logLabel || "Delete failed:", error);
            showMessage(`${messages.failed} ${getErrorMessage(error)}`, "danger", 12000);

            return { ok: false, error };
        }

        const postMutation = await finishMutation({
            reload,
            reset,
            logLabel: messages.logLabel || "Delete"
        });
        preserveBusyState = hasPostMutationFailure(postMutation);
        const feedback = resolveSuccessFeedback(
            messages.success,
            mutationResult,
            { action: "delete", item }
        );

        showMutationFeedback(feedback, postMutation);

        return {
            ok: true,
            result: mutationResult,
            ...postMutation
        };
    } finally {
        if (!preserveBusyState) {
            setBusy(false);
        }
    }
}

async function finishMutation({ reload, reset, logLabel }) {
    let reloadError = null;
    let resetError = null;

    try {
        await reload?.();
    } catch (error) {
        reloadError = error;
        console.error(`${logLabel} refresh failed:`, error);
    }

    if (!reloadError) {
        try {
            await reset?.();
        } catch (error) {
            resetError = error;
            console.error(`${logLabel} form reset failed:`, error);
        }
    }

    return { reloadError, resetError };
}

function hasPostMutationFailure({ reloadError, resetError }) {
    return Boolean(reloadError || resetError);
}

function resolveSuccessFeedback(message, result, context) {
    let resolved;

    try {
        resolved = typeof message === "function"
            ? message(result, context)
            : message;
    } catch (error) {
        console.error("Success feedback resolution failed:", error);
        resolved = "작업을 완료했습니다.";
    }

    if (resolved && typeof resolved === "object") {
        return {
            text: String(resolved.text || resolved.message || "작업을 완료했습니다."),
            type: resolved.type || "success",
            duration: Number(resolved.duration) || 5000
        };
    }

    return {
        text: String(resolved || "작업을 완료했습니다."),
        type: "success",
        duration: 5000
    };
}

function showMutationFeedback(feedback, { reloadError, resetError }) {
    const followUpMessages = [];

    if (reloadError) {
        followUpMessages.push("목록을 새로고치지 못했습니다.");
    }

    if (resetError) {
        followUpMessages.push("입력 폼을 초기화하지 못했습니다.");
    }

    if (followUpMessages.length > 0) {
        showMessage(
            `${feedback.text} 다만 ${followUpMessages.join(" ")} 페이지를 새로고침해주세요.`,
            "warning",
            12000
        );
        return;
    }

    showMessage(feedback.text, feedback.type, feedback.duration);
}

export function createUploadProgress(progressElement) {
    const progressBar = progressElement?.querySelector(".progress-bar");

    return {
        set(progress) {
            if (!progressElement || !progressBar) return;

            const safeProgress = Math.min(Math.max(Number(progress) || 0, 0), 100);

            progressElement.classList.remove("d-none");
            progressElement.setAttribute("aria-valuenow", String(safeProgress));
            progressBar.style.width = `${safeProgress}%`;
            progressBar.textContent = `${safeProgress}%`;
        },
        reset() {
            if (!progressElement || !progressBar) return;

            progressElement.classList.add("d-none");
            progressElement.setAttribute("aria-valuenow", "0");
            progressBar.style.width = "0%";
            progressBar.textContent = "0%";
        }
    };
}

// --- Rich-text editor helpers (notice / faq / greeting) ---

const editors = new Map();
const TOGGLE_EDITOR_COMMANDS = new Set(["bold", "italic", "underline", "strikeThrough"]);

export function registerEditor(target, editor, textarea) {
    editors.set(target, { editor, textarea });

    editor?.addEventListener("input", () => syncEditorToTextarea(target));
    editor?.addEventListener("paste", event => handleEditorPaste(event, target));
    editor?.addEventListener("keyup", () => updateEditorToolbarState(target));
    editor?.addEventListener("mouseup", () => updateEditorToolbarState(target));
    editor?.addEventListener("focus", () => updateEditorToolbarState(target));
}

export function setEditorHtml(target, html) {
    const editorFields = editors.get(target);
    const safeHtml = sanitizeHtml(html || "");

    if (editorFields?.editor) {
        editorFields.editor.innerHTML = safeHtml;
    }

    if (editorFields?.textarea) {
        editorFields.textarea.value = safeHtml;
    }
}

export function syncEditorToTextarea(target = "notice") {
    const editorFields = editors.get(target);

    if (!editorFields?.editor || !editorFields?.textarea) return;

    editorFields.textarea.value = normalizeEditorHtml(editorFields.editor.innerHTML);
}

function normalizeEditorHtml(html) {
    const safeHtml = sanitizeHtml(String(html || "").trim());

    if (!safeHtml) return "";

    const template = document.createElement("template");
    template.innerHTML = safeHtml;

    const text = String(template.content.textContent || "")
        .replaceAll("\u00a0", " ")
        .trim();
    const hasNonTextContent = Boolean(template.content.querySelector('img[src]:not([src=""])'));

    return text || hasNonTextContent ? safeHtml : "";
}

function handleEditorPaste(event, target) {
    event.preventDefault();

    const text = event.clipboardData?.getData("text/plain") || "";
    const html = text
        .split(/\n{2,}/)
        .map(block => block.trim())
        .filter(Boolean)
        .map(block => `<p>${escapeHtml(block).replaceAll("\n", "<br>")}</p>`)
        .join("");

    document.execCommand("insertHTML", false, html || escapeHtml(text));
    syncEditorToTextarea(target);
}

export function initEditorToolbar() {
    document.querySelectorAll("[data-editor-command]").forEach(button => {
        const command = button.dataset.editorCommand;

        if (!button.hasAttribute("aria-label") && button.title) {
            button.setAttribute("aria-label", button.title);
        }

        if (TOGGLE_EDITOR_COMMANDS.has(command)) {
            button.setAttribute("aria-pressed", "false");
        }

        button.addEventListener("click", () => runEditorCommand(button));
    });
}

function runEditorCommand(button) {
    const target = button.dataset.editorTarget || "notice";
    const editorFields = editors.get(target);

    if (!editorFields?.editor) return;

    editorFields.editor.focus();

    const command = button.dataset.editorCommand;
    let value = button.dataset.editorValue || null;

    if (command === "createLink") {
        value = window.prompt("연결할 주소를 입력하세요.");

        if (!value) return;

        if (!/^https?:\/\//i.test(value) && !value.startsWith("/")) {
            value = `https://${value}`;
        }
    }

    document.execCommand(command, false, value);
    syncEditorToTextarea(target);
    updateEditorToolbarState(target);
}

function updateEditorToolbarState(target) {
    document.querySelectorAll(`[data-editor-target="${target}"][data-editor-command]`).forEach(button => {
        const command = button.dataset.editorCommand;

        if (!TOGGLE_EDITOR_COMMANDS.has(command)) return;

        let isActive = false;

        try {
            isActive = document.queryCommandState(command);
        } catch {
            isActive = false;
        }

        button.setAttribute("aria-pressed", String(isActive));
    });
}
