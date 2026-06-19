import { ResourceInfo } from '@/types/options.type';

/**
 * 带深度信息的资源类型（内部使用）
 */
export interface ResourceWithDepth extends ResourceInfo {
  depth: number;
  parentId?: string;
  children?: ResourceWithDepth[];
}

/**
 * 递归扁平化资源树
 *
 * 将树形资源（含 children）扁平化为带 depth 的 Map，
 * 同时为每个节点补全 parentId。
 */
export function flattenResourceTree(
  resources: ResourceInfo[],
  depth = 0,
  parentId?: string,
  visited = new Set<string>(),
  result = new Map<string, ResourceWithDepth>()
): Map<string, ResourceWithDepth> {
  for (const resource of resources) {
    if (visited.has(resource.id)) {
      continue;
    }

    visited.add(resource.id);

    const flat: ResourceWithDepth = {
      id: resource.id,
      name: resource.name,
      depth,
      parentId: resource.parentId ?? parentId,
      color: resource.color,
      backgroundColor: resource.backgroundColor,
      hidden: resource.hidden,
      order: resource.order,
      width: resource.width,
      meta: resource.meta,
      collapsed: resource.collapsed,
    };

    result.set(resource.id, flat);

    if (resource.children && resource.children.length > 0) {
      flattenResourceTree(resource.children, depth + 1, resource.id, visited, result);
    }
  }

  return result;
}

/**
 * 按 parentId 将扁平列表构建为树
 *
 * 输入纯扁平 parentId 列表，输出原顺序但顶层带 children 的结构。
 */
export function buildTreeFromFlatList(resources: ResourceInfo[]): ResourceInfo[] {
  const map = new Map<string, ResourceInfo & { children: ResourceInfo[] }>();

  for (const resource of resources) {
    map.set(resource.id, { ...resource, children: [] });
  }

  const roots: (ResourceInfo & { children: ResourceInfo[] })[] = [];

  for (const resource of resources) {
    const node = map.get(resource.id)!;

    if (resource.parentId && map.has(resource.parentId)) {
      const parent = map.get(resource.parentId)!;
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * 归一化资源列表
 *
 * 若输入中含有 children，以 children 为真源统一为树；
 * 若只有 parentId，根据 parentId 构建树。
 */
export function normalizeResources(resources: ResourceInfo[]): ResourceInfo[] {
  const hasChildren = resources.some((r) => r.children && r.children.length > 0);

  if (hasChildren) {
    return resources;
  }

  return buildTreeFromFlatList(resources);
}

/**
 * 获取顶层资源
 */
export function getRootResources(resources: ResourceInfo[]): ResourceInfo[] {
  const normalized = normalizeResources(resources);
  return normalized;
}

/**
 * 从归一化后的资源列表中获取所有可见资源的扁平列表（可选排除折叠组的子资源）
 */
export function getFlattenedVisibleResources(
  resources: ResourceInfo[],
  visibleResourceIds?: string[],
  collapsedIds?: Set<string>
): ResourceWithDepth[] {
  const normalized = normalizeResources(resources);
  const flatMap = flattenResourceTree(normalized);

  const result: ResourceWithDepth[] = [];

  for (const [, resource] of flatMap) {
    // visibleResourceIds 过滤
    if (visibleResourceIds && visibleResourceIds.length > 0) {
      if (!visibleResourceIds.includes(resource.id)) {
        continue;
      }
    } else if (resource.hidden) {
      continue;
    }

    // collapsedIds 过滤：若某个祖先被折叠，则当前资源不可见
    if (collapsedIds && collapsedIds.size > 0) {
      let ancestorHidden = false;
      let parentId = resource.parentId;

      while (parentId) {
        if (collapsedIds.has(parentId)) {
          ancestorHidden = true;
          break;
        }

        const parent = flatMap.get(parentId);
        parentId = parent?.parentId;
      }

      if (ancestorHidden) {
        continue;
      }
    }

    result.push(resource);
  }

  return result;
}

/**
 * 计算显隐切换后的完整可见资源 id 集合
 *
 * 用于资源列头显隐控件的受控回填：
 * - 先确定「当前可见基线」：若宿主已显式提供 `visibleResourceIds`，直接采用；
 *   否则由「全量资源（扁平）减去 `hidden`」派生，与 `getFlattenedVisibleResources`
 *   的 fallback 优先级保持一致。
 * - 再对 `toggledId` 取反：当前可见则移除，当前隐藏则加入。
 * - 输出始终是显式 id 数组，宿主回写到 `visibleResourceIds` 主入口即生效。
 *
 * 顺序按全量扁平资源的自然顺序归一，避免回填后列序抖动。
 */
export function computeNextVisibleResourceIds(
  resources: ResourceInfo[],
  visibleResourceIds: string[] | undefined,
  toggledId: string
): string[] {
  const flatMap = flattenResourceTree(normalizeResources(resources));
  const allIds = Array.from(flatMap.keys());

  const baseline =
    visibleResourceIds && visibleResourceIds.length > 0
      ? new Set(visibleResourceIds)
      : new Set(allIds.filter((id) => !flatMap.get(id)?.hidden));

  if (baseline.has(toggledId)) {
    baseline.delete(toggledId);
  } else {
    baseline.add(toggledId);
  }

  return allIds.filter((id) => baseline.has(id));
}

/**
 * 递归搜索资源（支持树形结构）
 */
export function findResource(resources: ResourceInfo[], id: string): ResourceInfo | null {
  for (const resource of resources) {
    if (resource.id === id) {
      return resource;
    }

    if (resource.children) {
      const found = findResource(resource.children, id);
      if (found) {
        return found;
      }
    }
  }

  return null;
}
