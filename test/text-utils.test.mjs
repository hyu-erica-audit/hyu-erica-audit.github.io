import test from "node:test";
import assert from "node:assert/strict";

import { escapeHtml } from "../assets/js/text-utils.js";

test("HTML escaping handles markup, attributes, ampersands, and nullish values", () => {
  assert.equal(
    escapeHtml(`<a href="'">&</a>`),
    "&lt;a href=&quot;&#039;&quot;&gt;&amp;&lt;/a&gt;"
  );
  assert.equal(escapeHtml(null), "");
});
