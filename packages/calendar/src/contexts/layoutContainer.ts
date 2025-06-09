import { createContext, useContext } from 'react';
import { isUndefined } from 'lodash-es';

const LayoutContainerContext = createContext<HTMLDivElement | null>(null);

export const LayoutContainerProvider = LayoutContainerContext.Provider;

export const useLayoutContainer = () => {
  const ref = useContext(LayoutContainerContext);

  if (isUndefined(ref)) {
    throw new Error('LayoutContainerProvider is not found');
  }

  return ref;
};
