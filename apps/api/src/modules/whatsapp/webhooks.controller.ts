import type { Request, Response } from "express";
import { AppError } from "../../core/errors.js";
import type { WhatsAppService } from "./whatsapp.service.js";

export class WebhooksController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  public verifyWebhook = (req: Request, res: Response): void => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const isValid = this.whatsappService.verifyWebhook(
      typeof mode === "string" ? mode : undefined,
      typeof token === "string" ? token : undefined,
    );

    if (!isValid || typeof challenge !== "string") {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: "Webhook verification failed",
      });
    }

    res.status(200).send(challenge);
  };

  public receiveWebhook = (req: Request, res: Response): void => {
    this.whatsappService.storeWebhookEvent(req.body);
    res.status(200).json({ received: true });
  };

  public listWebhookEvents = (_req: Request, res: Response): void => {
    res.status(200).json({ events: this.whatsappService.listWebhookEvents() });
  };
}

