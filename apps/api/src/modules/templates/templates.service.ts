import { createId } from "../../core/id.js";
import type { TemplatesRepository } from "./templates.repository.js";
import type { Template } from "./templates.types.js";
import { createTemplateSchema } from "./templates.types.js";

export class TemplatesService {
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  public async createTemplate(workspaceId: string, input: unknown): Promise<Template> {
    const payload = createTemplateSchema.parse(input);
    const now = new Date().toISOString();

    return this.templatesRepository.create({
      id: createId("tpl"),
      workspaceId,
      name: payload.name,
      body: payload.body,
      createdAt: now,
      updatedAt: now,
    });
  }

  public async listTemplates(workspaceId: string): Promise<Template[]> {
    return this.templatesRepository.list(workspaceId);
  }
}
