import {
    fetchPublishedSchedules,
    formatSchedulePeriod,
    toCalendarEvent
} from "../schedule-service.js?v=20260529-schedule-color";

let calendar;

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

    if (!calendarEl) return;

    const schedules = await loadSchedules();

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
            showDetail(info.event);
        }
    });

    calendar.render();
});

async function loadSchedules() {
    try {
        return await fetchPublishedSchedules();
    } catch (error) {
        console.error("Schedule load failed:", error);
        return [];
    }
}

function showDetail(event) {
    const rail = document.getElementById("schedule-rail");

    document.getElementById("sideTitle").innerText = event.title;
    document.getElementById("sideDate").innerText = formatSchedulePeriod({
        startDate: event.extendedProps.startDate || toDateValue(event.start),
        endDate: event.extendedProps.endDate || event.extendedProps.startDate || toDateValue(event.start)
    });
    document.getElementById("sideDescription").innerText = event.extendedProps.description || "";

    rail.classList.add("active");
}

function closeDetail() {
    const rail = document.getElementById("schedule-rail");

    rail.classList.remove("active");
}

function toDateValue(date) {
    if (!(date instanceof Date)) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

window.closeDetail = closeDetail;
