import test from "node:test";
import assert from "node:assert/strict";

import { getFileIconClass } from "../assets/js/file-icons.js";

test("file icons honor only allowlisted explicit icon names", () => {
  assert.equal(getFileIconClass({ icon: "bi-receipt" }), "bi-receipt");
  assert.equal(
    getFileIconClass({ icon: "bi-unknown", fileName: "report.pdf" }),
    "bi-file-earmark-pdf"
  );
});

test("file icons infer common document types and use a safe fallback", () => {
  assert.equal(getFileIconClass("minutes.DOCX"), "bi-file-earmark-word");
  assert.equal(
    getFileIconClass({ fileName: "download", contentType: "application/pdf" }),
    "bi-file-earmark-pdf"
  );
  assert.equal(getFileIconClass("archive.bin"), "bi-file-earmark-arrow-down");
});
