const auditSchedule = [
    {
        start: "2026-06-29",
        end: "2026-07-03",
        title: "초기 자료 제출",
        type: "submission"
    },
    {
        start: "2026-07-06",
        end: "2026-07-10",
        title: "1차 감사",
        type: "audit"
    },
    {
        start: "2026-07-13",
        end: "2026-07-17",
        title: "추가 자료 제출",
        type: "submission"
    },
    {
        start: "2026-07-20",
        end: "2026-07-21",
        title: "2차 감사",
        type: "audit"
    },
    {
        start: "2026-07-22",
        end: "2026-07-24",
        title: "이의제기",
        type: "submission"
    },
    {
        start: "2026-07-27",
        end: "2026-07-28",
        title: "재심의",
        type: "audit"
    },
    {
        start: "2026-07-29",
        end: "2026-07-29",
        title: "최종 보고",
        type: "final"
    }
];

const calendarMonth = {
    year: 2026,
    month: 6
};

function renderAuditCalendar() {
    const calendar = document.getElementById("audit-calendar-month");

    if (!calendar) return;

    calendar.innerHTML = `
        <div class="calendar-weekdays" aria-hidden="true">
            ${["일", "월", "화", "수", "목", "금", "토"].map(day => `<span>${day}</span>`).join("")}
        </div>
        ${buildCalendarWeeks().map(renderCalendarWeek).join("")}
    `;
}

function buildCalendarWeeks() {
    const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    return Array.from({ length: 5 }, (_, weekIndex) => {
        return Array.from({ length: 7 }, (_, dayIndex) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + weekIndex * 7 + dayIndex);
            return date;
        });
    });
}

function renderCalendarWeek(days) {
    const weekStart = days[0];
    const weekEnd = days[6];
    const weekEvents = auditSchedule
        .map(event => getEventSegment(event, weekStart, weekEnd))
        .filter(Boolean);

    return `
        <div class="calendar-week">
            <div class="calendar-days">
                ${days.map(renderCalendarDay).join("")}
            </div>
            <div class="calendar-events">
                ${weekEvents.map(renderCalendarEvent).join("")}
            </div>
        </div>
    `;
}

function renderCalendarDay(date) {
    const isCurrentMonth = date.getMonth() === calendarMonth.month;
    const dayClass = [
        "calendar-day",
        isCurrentMonth ? "" : "is-muted",
        date.getDay() === 0 ? "is-sunday" : "",
        date.getDay() === 6 ? "is-saturday" : ""
    ].filter(Boolean).join(" ");

    return `
        <div class="${dayClass}">
            <time datetime="${toDateKey(date)}">${date.getDate()}</time>
        </div>
    `;
}

function renderCalendarEvent(segment) {
    const style = `grid-column: ${segment.startColumn} / ${segment.endColumn};`;

    return `
        <div class="calendar-event event-${segment.type}" style="${style}" title="${segment.title}">
            ${segment.title}
        </div>
    `;
}

function getEventSegment(event, weekStart, weekEnd) {
    const eventStart = parseDate(event.start);
    const eventEnd = parseDate(event.end);

    if (eventEnd < weekStart || eventStart > weekEnd) return null;

    const segmentStart = eventStart < weekStart ? weekStart : eventStart;
    const segmentEnd = eventEnd > weekEnd ? weekEnd : eventEnd;

    return {
        title: event.title,
        type: event.type,
        startColumn: segmentStart.getDay() + 1,
        endColumn: segmentEnd.getDay() + 2
    };
}

function parseDate(value) {
    return new Date(`${value}T00:00:00`);
}

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

document.addEventListener("DOMContentLoaded", renderAuditCalendar);
