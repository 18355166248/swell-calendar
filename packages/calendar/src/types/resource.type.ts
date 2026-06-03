import { ResourceInfo } from './options.type';

export interface ResourceSlice {
  collapsedResourceIds: string[];
  toggleCollapse: (resourceId: string) => void;
  setCollapsedIds: (ids: string[]) => void;
  initCollapsedFromResources: (resources: ResourceInfo[]) => void;
}
