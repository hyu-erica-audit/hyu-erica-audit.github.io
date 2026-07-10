import test from "node:test";
import assert from "node:assert/strict";

import {
  getFirebaseErrorMessage,
  withFirestoreReadTimeout
} from "../assets/js/firestore-utils.js";

test("Firestore read timeout preserves successful results", async () => {
  await assert.doesNotReject(async () => {
    assert.equal(await withFirestoreReadTimeout(Promise.resolve("ok"), 25), "ok");
  });
});

test("Firestore read timeout rejects stalled reads with an actionable error", async () => {
  await assert.rejects(
    withFirestoreReadTimeout(new Promise(() => {}), 5),
    /Firestore read timed out/
  );
});

test("Firebase error messages classify common authorization failures", () => {
  assert.match(
    getFirebaseErrorMessage({ code: "permission-denied", message: "denied" }),
    /권한이 거부되었습니다/
  );
});
