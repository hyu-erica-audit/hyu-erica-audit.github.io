import {
    fetchPublishedSchedules,
    formatSchedulePeriod,
    toCalendarEvent
} from "../schedule-service.js";

let calendar;
let lastFocusedEventElement = null;
let detailOpenFrameId = null;

const holidays = [
    "2026-01-01",
    "2026-02-16", "2026-02-17", "2026-02-18",
    "2026-03-02",
    "2026-05-05", "2026-05-25",
    "2026-06-03", "2026-06-06",
    "2026-07-17",
    "2026-08-15", "2026-08-17",
    "2026-09-24", "2026-09-25", "2026-09-26",
    "2026-10-03", "2026-10-05", "2026-10-09",
    "2026-12-25",
    "2027-01-01"
];

document.addEventListener("DOMContentLoaded", async () => {
    const calendarEl = document.getElementById("calendar");
    const detailCloseButton = document.getElementById("schedule-detail-close");

    if (!calendarEl) return;

    detailCloseButton?.addEventListener("click", closeDetail);
    document.addEventListener("keydown", event => {
        const detailPanel = document.getElementById("detail-col");

        if (event.key !== "Escape" || detailPanel?.hidden) return;

        event.preventDefault();
        closeDetail();
    });

    if (typeof window.FullCalendar === "undefined") {
        console.error("FullCalendar library is not loaded.");
        showLoadWarning(calendarEl, "달력 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.");
        return;
    }

    const schedules = await loadSchedules(calendarEl);

    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: "ko",
        initialView: "dayGridMonth",
        dayCellContent(arg) {
            return arg.date.getDate();
        },
        dayMaxEvents: true,
        headerToolbar: {
            left: "prev,next",
            center: "title",
            right: ""
        },
        dayCellClassNames(arg) {
            const year = arg.date.getFullYear();
            const month = String(arg.date.getMonth() + 1).padStart(2, "0");
            const day = String(arg.date.getDate()).padStart(2, "0");
            const dateStr = `${year}-${month}-${day}`;

            if (holidays.includes(dateStr)) {
                return ["fc-day-holiday"];
            }

            return [];
        },
        events: schedules.map(toCalendarEvent),
        eventClick(info) {
            showDetail(info.event, info.el);
        }
    });

    calendar.render();
});

async function loadSchedules(calendarEl) {
    try {
        return await fetchPublishedSchedules();
    } catch (error) {
        console.error("Schedule load failed:", error);
        showLoadWarning(calendarEl, "일정을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        return [];
    }
}

function showLoadWarning(calendarEl, message) {
    calendarEl.insertAdjacentHTML(
        "beforebegin",
        `<div class="alert alert-warning small">${message}</div>`
    );
}

function showDetail(event, triggerElement) {
    const rail = document.getElementById("schedule-rail");
    const detailPanel = document.getElementById("detail-col");
    const detailCloseButton = document.getElementById("schedule-detail-close");
    const title = document.getElementById("sideTitle");
    const date = document.getElementById("sideDate");
    const description = document.getElementById("sideDescription");

    if (!rail || !detailPanel || !detailCloseButton || !title || !date || !description) return;

    lastFocusedEventElement = triggerElement instanceof HTMLElement
        ? triggerElement
        : document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

    title.innerText = event.title;
    date.innerText = formatSchedulePeriod({
        startDate: event.extendedProps.startDate || toDateValue(event.start),
        endDate: event.extendedProps.endDate || event.extendedProps.startDate || toDateValue(event.start)
    });
    description.innerText = event.extendedProps.description || "";

    detailPanel.hidden = false;
    detailPanel.removeAttribute("inert");
    detailPanel.setAttribute("aria-hidden", "false");

    if (detailOpenFrameId !== null) {
        window.cancelAnimationFrame(detailOpenFrameId);
    }

    detailOpenFrameId = window.requestAnimationFrame(() => {
        rail.classList.add("active");
        detailCloseButton.focus({ preventScroll: true });
        detailOpenFrameId = null;
    });
}

function closeDetail() {
    const rail = document.getElementById("schedule-rail");
    const detailPanel = document.getElementById("detail-col");

    if (!rail || !detailPanel || detailPanel.hidden) return;

    if (detailOpenFrameId !== null) {
        window.cancelAnimationFrame(detailOpenFrameId);
        detailOpenFrameId = null;
    }

    rail.classList.remove("active");
    detailPanel.hidden = true;
    detailPanel.setAttribute("inert", "");
    detailPanel.setAttribute("aria-hidden", "true");

    if (lastFocusedEventElement?.isConnected) {
        lastFocusedEventElement.focus({ preventScroll: true });
    }

    lastFocusedEventElement = null;
}

function toDateValue(date) {
    if (!(date instanceof Date)) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}
