import { isNil } from 'lodash-es';

interface StampObj extends Record<string, any> {
  __swell_id?: number;
}

function idGenerator() {
  let id = 0;
  return {
    next() {
      id++;

      return id;
    },
  };
}

const getId = (function () {
  const generator = idGenerator();

  return () => generator.next();
})();

export function stamp(obj: StampObj): number {
  if (!obj.__swell_id) {
    obj.__swell_id = getId();
  }

  return obj.__swell_id;
}

export function hasStamp(obj: StampObj): boolean {
  return !isNil(obj.__swell_id);
}
