import { templates } from '@/Template/default';
import { TemplateConfig, TemplateSlice } from '@/types/template.type';

export function createTemplateSlice(templateConfig: TemplateConfig = {}): TemplateSlice {
  return {
    template: {
      ...templates,
      ...templateConfig,
    },
  };
}
