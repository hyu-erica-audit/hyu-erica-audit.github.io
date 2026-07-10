import test from "node:test";
import assert from "node:assert/strict";

import {
  formatDisplayDate,
  getYearFromDate,
  toDateInputValue
} from "../assets/js/date-utils.js";

test("date utilities normalize supported display and input formats", () => {
  assert.equal(formatDisplayDate("2026-7-10"), "2026. 07. 10.");
  assert.equal(toDateInputValue("2026년 7월 10일"), "2026-07-10");
  assert.equal(toDateInputValue(new Date(2026, 6, 10)), "2026-07-10");
});

test("date utilities keep empty and unrecognized values safe", () => {
  assert.equal(formatDisplayDate(""), "");
  assert.equal(toDateInputValue("not-a-date"), "");
  assert.equal(getYearFromDate("not-a-date"), null);
});

test("year extraction returns a number for supported date strings", () => {
  assert.equal(getYearFromDate("2026.07.10."), 2026);
});
