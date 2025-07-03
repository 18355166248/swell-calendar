import { isNil } from 'lodash-es';
import { createContext, createElement, useContext, useMemo } from 'react';
import { StoreApi, useStore as useZustandStore } from 'zustand';

export function createStoreContext<State extends Record<string, any>>() {
  const StoreContext = createContext<StoreApi<State> | null>(null);

  function StoreProvider({
    children,
    store,
  }: {
    children: React.ReactNode;
    store: StoreApi<State>;
  }) {
    return createElement(StoreContext.Provider, { value: store }, children);
  }

  function useStore<T = State>(selector?: (state: State) => T): T {
    const store = useContext(StoreContext);
    if (isNil(store)) {
      throw new Error('StoreProvider is not found');
    }
    return useZustandStore(store, selector as any) as T;
  }

  const useInternalStore = () => {
    const storeCtx = useContext(StoreContext);
    if (isNil(storeCtx)) {
      throw new Error('StoreProvider is not found');
    }

    return useMemo(() => storeCtx, [storeCtx]);
  };

  return { StoreProvider, useStore, useInternalStore };
}
