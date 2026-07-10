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
        <div class="calendar-grid" role="grid" aria-label="${calendarMonth.year}년 ${calendarMonth.month + 1}월 감사 일정 달력">
        <div class="calendar-weekdays" role="row">
            ${[
                ["일", "일요일"],
                ["월", "월요일"],
                ["화", "화요일"],
                ["수", "수요일"],
                ["목", "목요일"],
                ["금", "금요일"],
                ["토", "토요일"]
            ].map(([shortLabel, fullLabel]) => `<span role="columnheader" aria-label="${fullLabel}">${shortLabel}</span>`).join("")}
        </div>
        ${buildCalendarWeeks().map(renderCalendarWeek).join("")}
        </div>
        ${renderAccessibleSchedule()}
    `;
}

function buildCalendarWeeks() {
    const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const lastDay = new Date(calendarMonth.year, calendarMonth.month + 1, 0);
    const weekCount = Math.ceil((firstDay.getDay() + lastDay.getDate()) / 7);

    return Array.from({ length: weekCount }, (_, weekIndex) => {
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
        <div class="calendar-week" role="rowgroup">
            <div class="calendar-days" role="row">
                ${days.map(renderCalendarDay).join("")}
            </div>
            <div class="calendar-events" aria-hidden="true">
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
        <div class="${dayClass}" role="gridcell" aria-label="${formatAccessibleDate(date)}">
            <time datetime="${toDateKey(date)}" aria-hidden="true">${date.getDate()}</time>
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

function renderAccessibleSchedule() {
    return `
        <div class="visually-hidden">
            <p id="audit-calendar-agenda-title">감사 일정 목록</p>
            <ul aria-labelledby="audit-calendar-agenda-title">
                ${auditSchedule.map(event => `
                    <li>
                        <strong>${event.title}</strong>:
                        <time datetime="${event.start}">${formatDateValue(event.start)}</time>
                        ${event.end !== event.start ? `부터 <time datetime="${event.end}">${formatDateValue(event.end)}</time>까지` : ""}
                    </li>
                `).join("")}
            </ul>
        </div>
    `;
}

function formatAccessibleDate(date) {
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
    }).format(date);
}

function formatDateValue(value) {
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric"
    }).format(parseDate(value));
}

document.addEventListener("DOMContentLoaded", renderAuditCalendar);
