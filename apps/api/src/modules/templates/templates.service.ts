import { createId } from "../../core/id.js";
import type { TemplatesRepository } from "./templates.repository.js";
import type { Template } from "./templates.types.js";
import { createTemplateSchema } from "./templates.types.js";

export class TemplatesService {
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  public createTemplate(workspaceId: string, input: unknown): Template {
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

  public listTemplates(workspaceId: string): Template[] {
    return this.templatesRepository.list(workspaceId);
  }
}
