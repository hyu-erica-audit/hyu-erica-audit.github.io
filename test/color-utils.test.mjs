import test from "node:test";
import assert from "node:assert/strict";

import { getContrastTextColor } from "../assets/js/color-utils.js";

test("contrast text color selects dark text for light schedule colors", () => {
  for (const color of ["#50b9b9", "#808fe5", "#63be82", "#ff7c7c"]) {
    assert.equal(getContrastTextColor(color), "#111827");
  }
});

test("contrast text color selects white for dark or unknown colors", () => {
  assert.equal(getContrastTextColor("#2070b1"), "#ffffff");
  assert.equal(getContrastTextColor("invalid"), "#ffffff");
});
