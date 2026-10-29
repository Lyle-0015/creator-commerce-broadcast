import test from "node:test";
import assert from "node:assert/strict";
import { announcementBody, announcementEvent } from "./broadcast-announce.ts";

test("a validated creator announcement becomes the member event payload", () => {
  const input = { title: "Drop live", message: "Members can collect now.", creatorAccountId: "creator-7", memberChannel: "members-7" };
  const parsed = announcementBody.parse(input);
  assert.deepEqual(announcementEvent(parsed), { type: "creator_announcement", title: "Drop live", message: "Members can collect now." });
});
