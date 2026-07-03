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
        return;
    }

    setBusy(true);
    onStart?.();

    try {
        await ensureFirestoreAuth();

        if (id) {
            await update(id);
            showMessage(messages.updated, "success");
        } else {
            await create();
            showMessage(messages.created, "success");
        }

        await reload();
        reset?.();
    } catch (error) {
        console.error(messages.logLabel || "Save failed:", error);
        showMessage(`${messages.failed} ${getErrorMessage(error)}`, "danger", 12000);
    } finally {
        setBusy(false);
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

    try {
        await ensureFirestoreAuth();
        await remove();
        showMessage(messages.success, "success");
        reset();
        await reload();
    } catch (error) {
        console.error(messages.logLabel || "Delete failed:", error);
        showMessage(`${messages.failed} ${getErrorMessage(error)}`, "danger", 12000);
    } finally {
        setBusy(false);
    }
}

export function createUploadProgress(progressElement) {
    const progressBar = progressElement?.querySelector(".progress-bar");

    return {
        set(progress) {
            if (!progressElement || !progressBar) return;

            progressElement.classList.remove("d-none");
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
        },
        reset() {
            if (!progressElement || !progressBar) return;

            progressElement.classList.add("d-none");
            progressBar.style.width = "0%";
            progressBar.textContent = "0%";
        }
    };
}

// --- Rich-text editor helpers (notice / faq / greeting) ---

const editors = new Map();

export function registerEditor(target, editor, textarea) {
    editors.set(target, { editor, textarea });

    editor?.addEventListener("input", () => syncEditorToTextarea(target));
    editor?.addEventListener("paste", event => handleEditorPaste(event, target));
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
    const trimmed = String(html || "").trim();

    if (!trimmed || trimmed === "<br>") return "";

    return trimmed;
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
}
