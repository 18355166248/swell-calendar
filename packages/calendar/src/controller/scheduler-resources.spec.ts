import { describe, expect, it } from 'vitest';

import { ResourceInfo } from '@/types/options.type';

import {
  buildTreeFromFlatList,
  computeNextVisibleResourceIds,
  findResource,
  flattenResourceTree,
  getFlattenedVisibleResources,
  normalizeResources,
} from './scheduler-resources';

const RESOURCES_FLAT = [
  { id: 'r1', name: '会议室 A' },
  { id: 'r2', name: '会议室 B', parentId: 'r1' },
  { id: 'r3', name: '张三' },
  { id: 'r4', name: '李四', parentId: 'r3' },
  { id: 'r5', name: '王五', parentId: 'r3' },
];

const RESOURCES_TREE: ResourceInfo[] = [
  {
    id: 'r1',
    name: '会议室 A',
    children: [{ id: 'r2', name: '会议室 B' }],
  },
  {
    id: 'r3',
    name: '张三',
    children: [
      { id: 'r4', name: '李四' },
      { id: 'r5', name: '王五' },
    ],
  },
];

describe('scheduler-resources', () => {
  describe('flattenResourceTree', () => {
    it('应该递归展开树形结构为扁平 Map', () => {
      const map = flattenResourceTree(RESOURCES_TREE);

      expect(map.size).toBe(5);
      expect(map.get('r1')?.depth).toBe(0);
      expect(map.get('r1')?.parentId).toBeUndefined();
      expect(map.get('r2')?.depth).toBe(1);
      expect(map.get('r2')?.parentId).toBe('r1');
      expect(map.get('r3')?.depth).toBe(0);
      expect(map.get('r4')?.depth).toBe(1);
      expect(map.get('r4')?.parentId).toBe('r3');
      expect(map.get('r5')?.depth).toBe(1);
      expect(map.get('r5')?.parentId).toBe('r3');
    });

    it('空输入应返回空 Map', () => {
      const map = flattenResourceTree([]);
      expect(map.size).toBe(0);
    });

    it('应正确处理循环引用（跳过已访问节点）', () => {
      const cyclic: ResourceInfo[] = [
        {
          id: 'a',
          name: 'A',
          children: [{ id: 'b', name: 'B' }],
        },
      ];
      // 人为制造循环引用
      (cyclic[0] as ResourceInfo).children![0].children = [cyclic[0]];

      const map = flattenResourceTree(cyclic);
      expect(map.size).toBe(2);
      expect(map.has('a')).toBe(true);
      expect(map.has('b')).toBe(true);
    });
  });

  describe('buildTreeFromFlatList', () => {
    it('应根据 parentId 将扁平列表构建为树', () => {
      const tree = buildTreeFromFlatList(RESOURCES_FLAT);

      expect(tree).toHaveLength(2);
      expect(tree[0].id).toBe('r1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children![0].id).toBe('r2');
      expect(tree[1].id).toBe('r3');
      expect(tree[1].children).toHaveLength(2);
    });

    it('无 parentId 的资源应全部位于顶层', () => {
      const flat = [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ];
      const tree = buildTreeFromFlatList(flat);
      expect(tree).toHaveLength(2);
    });

    it('parentId 指向不存在的节点时应放顶层', () => {
      const flat = [
        { id: 'a', name: 'A', parentId: 'nonexistent' },
        { id: 'b', name: 'B' },
      ];
      const tree = buildTreeFromFlatList(flat);
      expect(tree).toHaveLength(2);
      expect(tree[0].id).toBe('a');
      expect(tree[0].children).toHaveLength(0);
    });
  });

  describe('normalizeResources', () => {
    it('输入含 children 时应保持树结构', () => {
      const result = normalizeResources(RESOURCES_TREE);
      expect(result).toHaveLength(2);
      expect(result[0].children).toBeDefined();
    });

    it('输入只有 parentId 时应构建树', () => {
      const result = normalizeResources(RESOURCES_FLAT);
      expect(result).toHaveLength(2);
      const r1 = result.find((r) => r.id === 'r1');
      expect(r1?.children).toHaveLength(1);
    });
  });

  describe('getFlattenedVisibleResources', () => {
    it('visibleResourceIds 应过滤资源', () => {
      const result = getFlattenedVisibleResources(RESOURCES_TREE, ['r1', 'r2']);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id).sort()).toEqual(['r1', 'r2']);
    });

    it('hidden 字段应在无 visibleResourceIds 时生效', () => {
      const resources = [
        { id: 'a', name: 'A', hidden: true },
        { id: 'b', name: 'B' },
      ];
      const result = getFlattenedVisibleResources(resources);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('b');
    });

    it('visibleResourceIds 优先级应高于 hidden', () => {
      const resources = [
        { id: 'a', name: 'A', hidden: true },
        { id: 'b', name: 'B' },
      ];
      const result = getFlattenedVisibleResources(resources, ['a']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });

    it('collapsedIds 应隐藏被折叠祖先的子资源', () => {
      const collapsedIds = new Set(['r3']);
      const result = getFlattenedVisibleResources(RESOURCES_TREE, undefined, collapsedIds);

      expect(result.find((r) => r.id === 'r4')).toBeUndefined();
      expect(result.find((r) => r.id === 'r5')).toBeUndefined();
      expect(result.find((r) => r.id === 'r1')).toBeDefined();
      expect(result.find((r) => r.id === 'r2')).toBeDefined();
      expect(result.find((r) => r.id === 'r3')).toBeDefined();
    });

    it('collapsedIds 不影响非父子关系的资源', () => {
      const collapsedIds = new Set(['r1']);
      const result = getFlattenedVisibleResources(RESOURCES_TREE, undefined, collapsedIds);

      expect(result.find((r) => r.id === 'r2')).toBeUndefined();
      expect(result.find((r) => r.id === 'r3')).toBeDefined();
      expect(result.find((r) => r.id === 'r4')).toBeDefined();
    });
  });

  describe('computeNextVisibleResourceIds', () => {
    const FLAT = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ];

    it('显式 visibleResourceIds 下应移除被切换的可见资源', () => {
      const next = computeNextVisibleResourceIds(FLAT, ['a', 'b', 'c'], 'b');
      expect(next).toEqual(['a', 'c']);
    });

    it('显式 visibleResourceIds 下应加入被切换的隐藏资源，并按自然顺序归一', () => {
      const next = computeNextVisibleResourceIds(FLAT, ['a'], 'c');
      expect(next).toEqual(['a', 'c']);
    });

    it('无 visibleResourceIds 时应以「全量减 hidden」为基线', () => {
      const resources = [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B', hidden: true },
        { id: 'c', name: 'C' },
      ];
      // 基线可见 = a, c；切换 a -> 移除
      expect(computeNextVisibleResourceIds(resources, undefined, 'a')).toEqual(['c']);
      // 基线可见 = a, c；切换 b（当前隐藏）-> 加入
      expect(computeNextVisibleResourceIds(resources, undefined, 'b')).toEqual(['a', 'b', 'c']);
    });

    it('应支持树形资源（按扁平顺序归一）', () => {
      const next = computeNextVisibleResourceIds(RESOURCES_TREE, undefined, 'r4');
      expect(next).toEqual(['r1', 'r2', 'r3', 'r5']);
    });
  });

  describe('findResource', () => {
    it('应在树结构中递归查找资源', () => {
      const found = findResource(RESOURCES_TREE, 'r4');
      expect(found).toBeDefined();
      expect(found?.name).toBe('李四');
    });

    it('应在根节点找到资源', () => {
      const found = findResource(RESOURCES_TREE, 'r1');
      expect(found).toBeDefined();
      expect(found?.name).toBe('会议室 A');
    });

    it('不存在的资源应返回 null', () => {
      const found = findResource(RESOURCES_TREE, 'nonexistent');
      expect(found).toBeNull();
    });

    it('空列表应返回 null', () => {
      const found = findResource([], 'r1');
      expect(found).toBeNull();
    });
  });
});
