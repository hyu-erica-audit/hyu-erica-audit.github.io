import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  getFirebaseStoragePathFromDownloadUrl,
  guessDocumentContentType,
  isSafeFirebaseDownloadUrl,
  isDocumentStoragePathForId,
  validateDocumentFile
} from "../assets/js/document-file-utils.js";

test("document validation accepts allowed extensions with canonical or generic MIME", () => {
  assert.deepEqual(
    validateDocumentFile({ name: "REPORT.PDF", type: "application/octet-stream", size: 1024 }),
    {
      contentType: "application/pdf",
      extension: "pdf",
      fileName: "REPORT.PDF",
      fileSize: 1024
    }
  );
  assert.equal(guessDocumentContentType("minutes.docx"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
});

test("document download URLs allow only Firebase HTTPS token URLs", () => {
  const storageBucket = "example.appspot.com";
  const downloadUrl = "https://firebasestorage.googleapis.com/v0/b/example.appspot.com/o/public%2Freports%2Fdoc-1%2Freport.pdf?alt=media";

  assert.equal(
    isSafeFirebaseDownloadUrl(downloadUrl, storageBucket),
    true
  );
  assert.equal(getFirebaseStoragePathFromDownloadUrl(downloadUrl, storageBucket), "public/reports/doc-1/report.pdf");
  assert.equal(isSafeFirebaseDownloadUrl(downloadUrl, "other.appspot.com"), false);
  assert.equal(getFirebaseStoragePathFromDownloadUrl(downloadUrl, "other.appspot.com"), "");
  assert.equal(isDocumentStoragePathForId("public/reports/doc-1/report.pdf", "doc-1"), true);
  assert.equal(isDocumentStoragePathForId("public/reports/doc-2/report.pdf", "doc-1"), false);
  assert.equal(isSafeFirebaseDownloadUrl("javascript:alert(1)"), false);
  assert.equal(isSafeFirebaseDownloadUrl("https://example.com/report.pdf"), false);
});

test("document validation rejects spoofed, unsupported, and oversized files", () => {
  assert.throws(
    () => validateDocumentFile({ name: "report.exe", type: "application/pdf", size: 1024 }),
    /PDF, DOC, DOCX/
  );
  assert.throws(
    () => validateDocumentFile({ name: "report.pdf", type: "application/msword", size: 1024 }),
    /일치하지 않습니다/
  );
  assert.throws(
    () => validateDocumentFile({ name: "report.pdf", type: "application/pdf", size: MAX_DOCUMENT_FILE_SIZE_BYTES }),
    /25MB 미만/
  );
});
