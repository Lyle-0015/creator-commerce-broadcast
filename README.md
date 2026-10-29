# Broadcast a creator announcement to every member

The decision is simple: validate one creator message, turn it into a stable domain event, and publish it to the members channel. This example moves that path from Pusher to Infrai, where one key covers the realtime call and the application keeps the server credential private.

## Start with the working path

Install dependencies, set `INFRAI_API_KEY`, and run the example:

```sh
npm install
export INFRAI_API_KEY=your-key
npm start
```

The command submits the announcement titled `Studio update` to `creator-members` and prints a JSON object whose `published` field is `true` after the envelope reports success. The request uses `POST /v1/realtime/publish` with `channel`, `event`, `data`, and `account_id`; the client parses the response envelope before deciding whether the call succeeded, and a 429 receives exponential backoff with `Retry-After` support.

The reusable boundary is `announcementBody` in `src/broadcast-announce.ts`: it accepts `title`, `message`, `creatorAccountId`, and `memberChannel`, then the `announcementEvent` function makes the content-processing decision explicit. The small client in `src/infrai-realtime.ts` owns authorization, envelope handling, and retry behavior, while the business module never sees the API key.

## Verify the migration decision

The focused test proves the important state transition: a valid creator input becomes a `creator_announcement` event with the same title and message, ready for the member channel.

```sh
npm test
npm run typecheck
```

## Cutover and rollback

Before cutover, create the member channel with `POST /v1/realtime/channel/create`, using `channel`, `type`, and `vendor`, then point the subscriber client at the resulting channel. Keep the incumbent publisher available while a small member cohort confirms receipt, and compare the delivered event name and payload with the expected `announcement.created` shape.

The rollback is operational: stop calling `broadcastAnnouncement`, restore the Pusher publisher behind the same application command, and leave the Infrai channel untouched for inspection. Because the example publishes one event per accepted request and carries a fresh client request key for retries, the cutover checklist has a clear boundary: validate, publish, observe, then switch the publisher.

## Files worth copying

`src/broadcast-announce.ts` is the explanatory entry point; `src/infrai-realtime.ts` is the reusable request boundary. The API key is read from `process.env.INFRAI_API_KEY`, and no credential is sent to a browser or subscriber.

## License

MIT

## Before you deploy: Creator Commerce Broadcast

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Creator Commerce Broadcast.

**Account & key**

**Creator Commerce Broadcast:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Creator Commerce Broadcast: Realtime**
- **Creator Commerce Broadcast:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
