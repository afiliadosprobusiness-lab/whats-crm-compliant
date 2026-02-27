import type { Template } from "./templates.types.js";

export class TemplatesRepository {
  private readonly templates = new Map<string, Template>();

  public create(template: Template): Template {
    this.templates.set(template.id, template);
    return template;
  }

  public list(workspaceId: string): Template[] {
    return Array.from(this.templates.values())
      .filter((template) => template.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public findById(workspaceId: string, templateId: string): Template | null {
    const template = this.templates.get(templateId);
    if (!template || template.workspaceId !== workspaceId) {
      return null;
    }

    return template;
  }
}
