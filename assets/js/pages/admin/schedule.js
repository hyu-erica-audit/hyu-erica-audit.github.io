import { escapeHtml } from "../../html-utils.js";
import { getFirebaseErrorMessage } from "../../notice-service.js";
import {
    createSchedule,
    fetchAllSchedules,
    formatSchedulePeriod,
    getScheduleColor,
    getScheduleCategoryLabel,
    removeSchedule,
    sortSchedules,
    updateSchedule
} from "../../schedule-service.js";
import { getTodayDateInputValue } from "../../date-utils.js";
import {
    attachListActions,
    createBusySetter,
    dangerRow,
    deleteEntity,
    mutedRow,
    saveEntity,
    statusBadge
} from "./shared.js";

const scheduleList = document.getElementById("admin-schedule-list");
const scheduleForm = document.getElementById("admin-schedule-form");
const scheduleEditorTitle = document.getElementById("admin-schedule-editor-title");
const newScheduleButton = document.getElementById("admin-new-schedule");
const deleteScheduleButton = document.getElementById("admin-delete-schedule");

const scheduleFields = {
    id: document.getElementById("schedule-id"),
    title: document.getElementById("schedule-title"),
    category: document.getElementById("schedule-category"),
    color: document.getElementById("schedule-color"),
    startDate: document.getElementById("schedule-start-date"),
    endDate: document.getElementById("schedule-end-date"),
    status: document.getElementById("schedule-status"),
    description: document.getElementById("schedule-description")
};

let schedules = [];

const setBusy = createBusySetter({ form: scheduleForm, buttons: [newScheduleButton] });

export function initSchedule() {
    resetScheduleForm();

    newScheduleButton?.addEventListener("click", resetScheduleForm);
    scheduleForm?.addEventListener("submit", handleSubmit);
    deleteScheduleButton?.addEventListener("click", handleDelete);

    attachListActions(scheduleList, {
        "edit-schedule": id => {
            const schedule = schedules.find(item => item.id === id);

            if (schedule) fillScheduleForm(schedule);
        }
    });

    return loadSchedules;
}

async function handleSubmit(event) {
    event.preventDefault();

    const payload = readScheduleForm();

    await saveEntity({
        id: scheduleFields.id.value,
        validate: () => {
            if (!payload.title || !payload.startDate) return "일정 제목과 시작일을 입력해주세요.";
            if (payload.endDate < payload.startDate) return "종료일은 시작일보다 빠를 수 없습니다.";

            return null;
        },
        create: () => createSchedule(payload),
        update: id => updateSchedule(id, payload),
        setBusy,
        reload: loadSchedules,
        reset: resetScheduleForm,
        getErrorMessage: getFirebaseErrorMessage,
        messages: {
            created: "일정을 저장했습니다.",
            updated: "일정을 수정했습니다.",
            failed: "일정 저장에 실패했습니다.",
            logLabel: "Schedule save failed:"
        }
    });
}

async function handleDelete() {
    const id = scheduleFields.id.value;

    await deleteEntity({
        item: id || null,
        confirmMessage: "이 일정을 삭제할까요?",
        remove: () => removeSchedule(id),
        setBusy,
        reset: resetScheduleForm,
        reload: loadSchedules,
        getErrorMessage: getFirebaseErrorMessage,
        messages: {
            success: "일정을 삭제했습니다.",
            failed: "일정 삭제에 실패했습니다.",
            logLabel: "Schedule delete failed:"
        }
    });
}

async function loadSchedules() {
    if (!scheduleList) return;

    scheduleList.innerHTML = mutedRow("일정을 불러오는 중입니다.");

    try {
        schedules = await fetchAllSchedules();
        renderScheduleRows();
    } catch (error) {
        console.error("Admin schedule load failed:", error);
        scheduleList.innerHTML = dangerRow(`일정을 불러오지 못했습니다. ${escapeHtml(getFirebaseErrorMessage(error))}`);
        throw error;
    }
}

function renderScheduleRows() {
    if (!scheduleList) return;

    schedules = sortSchedules(schedules);

    if (schedules.length === 0) {
        scheduleList.innerHTML = mutedRow("저장된 일정이 없습니다.");
        return;
    }

    scheduleList.innerHTML = schedules.map(schedule => `
        <tr>
            <td>${statusBadge(schedule.status)}</td>
            <td>
                <button type="button" class="admin-link-button" data-action="edit-schedule" data-id="${escapeHtml(schedule.id)}">
                    ${escapeHtml(schedule.title || "제목 없음")}
                </button>
                <div class="admin-schedule-category text-muted small">
                    <span class="admin-color-swatch" style="background-color: ${escapeHtml(getScheduleColor(schedule.color))};"></span>
                    ${escapeHtml(getScheduleCategoryLabel(schedule.category))}
                </div>
            </td>
            <td class="text-muted">${escapeHtml(formatSchedulePeriod(schedule))}</td>
            <td class="text-end">
                <a class="btn btn-outline-dark btn-sm" href="/pages/intro/schedule.html" target="_blank" rel="noopener">
                    보기
                </a>
            </td>
        </tr>
    `).join("");
}

function readScheduleForm() {
    return {
        title: scheduleFields.title.value.trim(),
        category: scheduleFields.category.value.trim(),
        color: scheduleFields.color.value,
        startDate: scheduleFields.startDate.value,
        endDate: scheduleFields.endDate.value || scheduleFields.startDate.value,
        status: scheduleFields.status.value,
        description: scheduleFields.description.value.trim()
    };
}

function fillScheduleForm(schedule) {
    scheduleFields.id.value = schedule.id;
    scheduleFields.title.value = schedule.title || "";
    scheduleFields.category.value = getScheduleCategoryLabel(schedule.category);
    scheduleFields.color.value = getScheduleColor(schedule.color || schedule.category);
    scheduleFields.startDate.value = schedule.startDate || "";
    scheduleFields.endDate.value = schedule.endDate || schedule.startDate || "";
    scheduleFields.status.value = schedule.status || "draft";
    scheduleFields.description.value = schedule.description || "";

    scheduleEditorTitle.textContent = "일정 수정";
    deleteScheduleButton?.classList.remove("d-none");
    scheduleFields.title.focus();
}

function resetScheduleForm() {
    scheduleForm?.reset();

    scheduleFields.id.value = "";
    scheduleFields.category.value = "정기감사";
    scheduleFields.color.value = "#50b9b9";
    scheduleFields.startDate.value = getTodayDateInputValue();
    scheduleFields.endDate.value = getTodayDateInputValue();
    scheduleFields.status.value = "published";
    scheduleFields.description.value = "";

    scheduleEditorTitle.textContent = "새 일정 작성";
    deleteScheduleButton?.classList.add("d-none");
}
