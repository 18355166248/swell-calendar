import { isNil, isString } from 'lodash-es';
import { cloneElement, createElement } from 'react';

import { useCalendarStore } from '@/contexts/calendarStore';
import { cls } from '@/helpers/css';
import { TemplateName, TemplateReturnType } from '@/types/template.type';
import { sanitize } from '@/utils/sanitizer';

interface Props {
  template: TemplateName;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  param?: any;
  as?: keyof HTMLElementTagNameMap;
}

export function Template({ template, param, as: tagName = 'div' }: Props) {
  const { template: templateConfig } = useCalendarStore();

  const templateFn = templateConfig[template];

  if (isNil(templateFn)) {
    return null;
  }

  const htmlOrVNode: TemplateReturnType = templateFn(param);

  return isString(htmlOrVNode)
    ? createElement(tagName, {
        className: cls(`template-${template}`),
        dangerouslySetInnerHTML: {
          __html: sanitize(htmlOrVNode),
        },
      })
    : cloneElement(htmlOrVNode, {
        className: `${htmlOrVNode.props.className ?? ''} ${cls(`template-${template}`)}`,
      });
}
