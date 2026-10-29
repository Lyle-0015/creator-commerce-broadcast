import { randomUUID } from "node:crypto";
import { z } from "zod";
import { InfraiRealtime } from "./infrai-realtime.ts";

export const announcementBody = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  creatorAccountId: z.string().min(1),
  memberChannel: z.string().min(1)
});

export type Announcement = z.infer<typeof announcementBody>;

export function announcementEvent(input: Announcement) {
  return { type: "creator_announcement", title: input.title, message: input.message };
}

export async function broadcastAnnouncement(input: unknown, client: InfraiRealtime) {
  const announcement = announcementBody.parse(input);
  return client.publish(
    announcement.memberChannel,
    "announcement.created",
    announcementEvent(announcement),
    announcement.creatorAccountId,
    randomUUID()
  );
}

const key = process.env.INFRAI_API_KEY;
if (process.argv[1]?.endsWith("broadcast-announce.ts")) {
  if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
  const input = {
    title: "Studio update",
    message: "The new digital collection is ready for members.",
    creatorAccountId: "creator-demo",
    memberChannel: "creator-members"
  };
  const client = new InfraiRealtime(key);
  await client.createChannel(input.memberChannel, "public", "tencent_im", randomUUID());
  const result = await broadcastAnnouncement(input, client);
  console.log(JSON.stringify({ published: true, data: result }));
}
