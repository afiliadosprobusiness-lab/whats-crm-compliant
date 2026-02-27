import type { EnvConfig } from "../../config/env.js";
import { createId } from "../../core/id.js";
import type { WebhookEventsRepository } from "./webhook-events.repository.js";

type Provider = "dry_run" | "whatsapp_cloud_api";

export type SendMessageResult = {
  status: "sent" | "failed";
  provider: Provider;
  messageId: string | null;
  error: string | null;
};

export class WhatsAppService {
  constructor(
    private readonly env: EnvConfig,
    private readonly webhookEventsRepository: WebhookEventsRepository,
  ) {}

  public async sendTextMessage(to: string, body: string): Promise<SendMessageResult> {
    if (!this.env.whatsappAccessToken || !this.env.whatsappPhoneNumberId) {
      return {
        status: "sent",
        provider: "dry_run",
        messageId: `dry_${Date.now()}`,
        error: null,
      };
    }

    const response = await fetch(
      `https://graph.facebook.com/${this.env.whatsappGraphApiVersion}/${this.env.whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.env.whatsappAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }),
      },
    );

    const payload = (await response.json().catch(() => null)) as { messages?: Array<{ id?: string }>; error?: { message?: string } } | null;

    if (!response.ok) {
      return {
        status: "failed",
        provider: "whatsapp_cloud_api",
        messageId: null,
        error: payload?.error?.message ?? "Error enviando a WhatsApp Cloud API",
      };
    }

    return {
      status: "sent",
      provider: "whatsapp_cloud_api",
      messageId: payload?.messages?.[0]?.id ?? null,
      error: null,
    };
  }

  public verifyWebhook(mode: string | undefined, verifyToken: string | undefined): boolean {
    return mode === "subscribe" && verifyToken === this.env.whatsappVerifyToken;
  }

  public async storeWebhookEvent(payload: unknown): Promise<void> {
    await this.webhookEventsRepository.create({
      id: createId("evt"),
      receivedAt: new Date().toISOString(),
      payload,
    });
  }

  public async listWebhookEvents() {
    return this.webhookEventsRepository.listRecent(100);
  }
}
