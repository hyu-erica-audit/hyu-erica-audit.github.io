export function formatDisplayDate(value) {
    const parts = String(value || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);

    if (!parts) return value || "";

    return `${parts[1]}. ${String(parts[2]).padStart(2, "0")}. ${String(parts[3]).padStart(2, "0")}.`;
}

export function toDateInputValue(value) {
    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    const parts = String(value || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);

    if (!parts) return "";

    return `${parts[1]}-${String(parts[2]).padStart(2, "0")}-${String(parts[3]).padStart(2, "0")}`;
}

export function formatDateForInput(value) {
    return toDateInputValue(value);
}

export function getYearFromDate(value) {
    const year = String(value || "").match(/\d{4}/)?.[0];

    return year ? Number(year) : null;
}

export function getTodayDateInputValue() {
    return toDateInputValue(new Date());
}
