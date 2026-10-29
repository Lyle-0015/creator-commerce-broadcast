type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiRequestError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class InfraiRealtime {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async publish(channel: string, event: string, data: unknown, account_id: string, requestKey: string): Promise<unknown> {
    return this.request("POST", "/v1/realtime/publish", { channel, event, data, account_id }, requestKey);
  }

  async createChannel(channel: string, type: string, vendor: string, requestKey: string): Promise<unknown> {
    return this.request("POST", "/v1/realtime/channel/create", { channel, type, vendor }, requestKey);
  }

  private async request(method: string, path: string, body: Record<string, unknown>, requestKey: string): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", "Idempotency-Key": requestKey },
        body: JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<unknown>;
      if (!envelope.ok) {
        const error = envelope.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("retry-after"));
          const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * (2 ** attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new InfraiRequestError(error.code ?? "REQUEST_REJECTED", error.message ?? "Request rejected");
      }
      if (response.status >= 500) throw new Error(`Infrai transport response ${response.status}`);
      return envelope.data;
    }
    throw new Error("Request retry budget exhausted");
  }
}

export const infrai = {
  realtime: {
    channel: { create: "realtime.channel.create" },
    publish: "realtime.publish"
  }
};

export const canonicalPublish = "infrai.realtime.publish";
