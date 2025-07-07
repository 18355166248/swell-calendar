import { isFunction, isNil, isNumber, isString } from 'lodash-es';

// 项目ID类型：字符串或数字
export type ItemID = string | number;

// 项目基础类型，包含可选的_id字段
export type Item = {
  _id?: ItemID;
  [k: string | number]: any;
};

// 过滤器函数类型
export type Filter<ItemType> = (item: ItemType) => boolean;

/**
 * 基于ES6 Map的通用集合类
 *
 * 需要提供获取模型唯一ID的函数
 *
 * 如果没有提供函数，则使用默认函数 {@link Collection#getItemID}
 * @param {function} [getItemIDFn] 获取模型ID的函数
 */
export default class Collection<ItemType extends Item> {
  // 内部存储的Map实例
  private internalMap: Map<ItemID, ItemType> = new Map();

  constructor(getItemIDFn?: (item: ItemType) => ItemID) {
    if (isFunction(getItemIDFn)) {
      this.getItemID = getItemIDFn;
    }
  }

  /**
   * 组合多个过滤器函数，使用AND条件
   * @param {...Filter} filterFns - 过滤器函数数组
   * @returns {function} 组合后的过滤器
   */
  static and<ItemType>(...filterFns: Array<Filter<ItemType>>) {
    const { length } = filterFns;

    return (item: ItemType) => {
      for (let i = 0; i < length; i += 1) {
        if (!filterFns[i].call(null, item)) {
          return false;
        }
      }

      return true;
    };
  }

  /**
   * 组合多个过滤器函数，使用OR条件
   * @param {...function} filterFns - 过滤器函数数组
   * @returns {function} 组合后的过滤器
   */
  static or<ItemType>(...filterFns: Array<Filter<ItemType>>) {
    const { length } = filterFns;

    if (!length) {
      return () => false;
    }

    return (item: ItemType) => {
      let result = filterFns[0].call(null, item);

      for (let i = 1; i < length; i += 1) {
        result = result || filterFns[i].call(null, item);
      }

      return result;
    };
  }

  /**
   * 获取模型的唯一ID
   * @param {object} item 模型实例
   * @returns {string | number} 模型唯一ID
   */
  getItemID(item: ItemType): ItemID {
    return item?._id ?? '';
  }

  /**
   * 获取集合中的第一个项目
   * @returns {ItemType | null} 第一个项目或null
   */
  getFirstItem(): ItemType | null {
    const iterator = this.internalMap.values();
    const firstItem = iterator.next().value;

    return firstItem ?? null;
  }

  /**
   * 添加模型到集合中
   * @param {Object[]} items - 要添加到集合的模型数组
   */
  add(...items: ItemType[]): Collection<ItemType> {
    items.forEach((item) => {
      const id = this.getItemID(item);

      this.internalMap.set(id, item);
    });

    return this;
  }

  /**
   * 从集合中移除模型
   * @param {Array.<(Object|string|number)>} items 要删除的模型实例或唯一ID数组
   */
  remove(...items: Array<ItemType | ItemID>): ItemType[] | ItemType {
    const removeResult: ItemType[] = [];

    items.forEach((item) => {
      const id: ItemID = isString(item) || isNumber(item) ? item : this.getItemID(item);

      if (!this.internalMap.has(id)) {
        return;
      }

      removeResult.push(this.internalMap.get(id) as ItemType);
      this.internalMap['delete'](id);
    });

    return removeResult.length === 1 ? removeResult[0] : removeResult;
  }

  /**
   * 检查集合是否包含特定模型
   * @param {(object|string|number)} item 要检查的模型实例或ID
   * @returns {boolean} 是否包含该模型
   */
  has(item: ItemType | ItemID): boolean {
    const id: ItemID = isString(item) || isNumber(item) ? item : this.getItemID(item);

    return this.internalMap.has(id);
  }

  /**
   * 根据ID或模型实例获取项目
   * @param {ItemType | ItemID} item 模型实例或ID
   * @returns {ItemType | null} 找到的项目或null
   */
  get(item: ItemType | ItemID): ItemType | null {
    const id: ItemID = isString(item) || isNumber(item) ? item : this.getItemID(item);

    return this.internalMap.get(id) ?? null;
  }

  /**
   * 当模型存在于集合中时执行回调函数
   * @param {(string|number)} id 模型唯一ID
   * @param {function} callback 回调函数
   */
  doWhenHas(id: ItemID, callback: (item: ItemType) => void) {
    const item = this.internalMap.get(id);

    if (isNil(item)) {
      return;
    }

    callback(item);
  }

  /**
   * 搜索模型并返回新的集合
   * @param {function} filterFn 过滤函数
   * @returns {Collection} 包含过滤后模型的新集合
   * @example
   * collection.filter(function(item) {
   *     return item.edited === true;
   * });
   *
   * function filter1(item) {
   *     return item.edited === false;
   * }
   *
   * function filter2(item) {
   *     return item.disabled === false;
   * }
   *
   * collection.filter(Collection.and(filter1, filter2));
   *
   * collection.filter(Collection.or(filter1, filter2));
   */
  filter(filterFn: Filter<ItemType>): Collection<ItemType> {
    const result = new Collection<ItemType>();

    if (this.hasOwnProperty('getItemID')) {
      result.getItemID = this.getItemID;
    }

    this.internalMap.forEach((item) => {
      if (filterFn(item) === true) {
        result.add(item);
      }
    });

    return result;
  }

  /**
   * 按特定键值对元素进行分组
   *
   * 如果键参数是函数，则调用它并使用返回值
   * @param {(string|number|function)} groupByFn 键属性或获取器函数
   * @returns {object.<string|number, Collection>} 分组后的对象
   * @example
   * // 传递 `string`、`number`、`boolean` 类型的值，按属性值分组
   * collection.groupBy('gender');    // 按 'gender' 属性值分组
   * collection.groupBy(50);          // 按 '50' 属性值分组
   *
   * // 传递 `function` 则按返回值分组。每次调用 `function` 时传入 `(item)`
   * collection.groupBy(function(item) {
   *     if (item.score > 60) {
   *         return 'pass';
   *     }
   *     return 'fail';
   * });
   */
  groupBy(
    groupByFn: string | number | ((item: ItemType) => string | number)
  ): Record<string, Collection<ItemType>> {
    const result: Record<string, Collection<ItemType>> = {};

    this.internalMap.forEach((item) => {
      let key = isFunction(groupByFn) ? groupByFn(item) : item[groupByFn];

      if (isFunction(key)) {
        key = key.call(item);
      }

      result[key] ??= new Collection<ItemType>(this.getItemID);
      result[key].add(item);
    });

    return result;
  }

  /**
   * 返回集合中满足提供函数的第一个项目
   * @param {function} [findFn] - 过滤函数
   * @returns {object|null} 找到的项目
   */
  find(findFn: Filter<ItemType>): ItemType | null {
    let result: ItemType | null = null;
    const items = this.internalMap.values();
    let next = items.next();

    while (next.done === false) {
      if (findFn(next.value)) {
        result = next.value;
        break;
      }
      next = items.next();
    }

    return result;
  }

  /**
   * 基于提供的比较函数进行排序
   * @param {function} compareFn 比较函数
   * @returns {array} 排序后的数组
   */
  sort(compareFn: (a: ItemType, b: ItemType) => number): ItemType[] {
    return this.toArray().sort(compareFn);
  }

  /**
   * 遍历每个模型元素
   *
   * 当迭代器返回false时中断循环
   * @param {function} iteratee 迭代器函数(item, key)
   */
  each(iteratee: (item: ItemType, key: keyof ItemType) => boolean | void) {
    const entries = this.internalMap.entries();
    let next = entries.next();

    while (next.done === false) {
      const [key, value] = next.value;
      if (iteratee(value, key) === false) {
        break;
      }
      next = entries.next();
    }
  }

  /**
   * 清空集合中的所有模型
   */
  clear() {
    this.internalMap.clear();
  }

  /**
   * 返回包含集合项目的新数组
   * @returns {array} 新数组
   */
  toArray(): ItemType[] {
    return Array.from(this.internalMap.values());
  }

  /**
   * 获取集合的大小
   * @returns {number} 集合中项目的数量
   */
  get size(): number {
    return this.internalMap.size;
  }
}
