<template>
  <div class="sticky-tree-menu">
    <div :style="polyfillTopStyle"/>
    <!-- 筛选框 -->
    <vi-input
      v-model.trim="search"
      :style="filterInputStyle"
      clearable
      suffix-icon="vi-icon-search"
    />
    <div :style="polyfillMidStyle"/>
    <!-- 列表展示 -->
    <div v-if="displayedList.length" class="list-wrapper">
      <div
        v-for="(node, index) in displayedList"
        v-show="isShowNode(node)"
        :key="index"
        :style="getNodeStyle(node)"
        :class="getNodeClass(node)"
        @click="clickNode(node)"
      >
        <!-- 叶子节点有hint时展示popover -->
        <vi-popover
          v-if="isLeafNode(node) && getNodeHint(node)"
          ref="popover"
          placement="right"
          width="200"
          trigger="hover"
        >
          <!-- popper内容 -->
          <p>{{ getNodeHint(node) }}</p>
          <!-- popper宿主 -->
          <div slot="reference" :data-index="getLeafIndex(node)" class="popover-ref">
            <vi-checkbox :value="node.checked" class="check" @change="clickNode(node)"/>
            <span :title="getNodeContent(node)" class="content">{{ getNodeContent(node) }}</span>
          </div>
        </vi-popover>
        <!-- 叶子节点没有有hint时只展示普通内容 -->
        <div v-else-if="isLeafNode(node)">
          <vi-checkbox :value="node.checked" class="check" @change="clickNode(node)"/>
          <span :title="getNodeContent(node)" class="content">{{ getNodeContent(node) }}</span>
        </div>
        <!-- 非叶子节点展示内容 -->
        <template v-else>
          <span class="content">{{ getNodeContent(node) }}</span>
          <span>
            <!-- 箭头 -->
            <i :class="['icon', getIconClass(node)]"/>
          </span>
        </template>
      </div>
    </div>
    <!-- 无数据 -->
    <div v-else class="no-result">
      <img :src="emptyDataPng">
      <div>{{ $t('reporting-tree-menu-no-data') }}</div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import emptyDataPng from "src/assets/images/empty-data.png";

export default {
  name: "sticky-tree-menu",
  props: {
    list: {
      type: Array,
      default: () => []
    },
    selected: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      emptyDataPng,
      search: "",
      flatternList: this.flattern({
        // 打平的列表，用于sticky属性发挥作用
        flatterned: [],
        list: _.cloneDeep(this.list)
      }),
      expanded: []
    };
  },
  computed: {
    stickyElementHeight() {
      return {
        polyfillTop: 16,
        filterInput: 34,
        polyfillMid: 8,
        menuItem: 38
      };
    },
    polyfillTopStyle() {
      return {
        height: `${this.stickyElementHeight.polyfillTop}px`,
        position: "sticky",
        top: "0",
        zIndex: 10,
        background: "#fff"
      };
    },
    filterInputStyle() {
      const { filterInput, polyfillTop } = this.stickyElementHeight;
      return {
        height: `${filterInput}px`,
        position: "sticky",
        top: `${polyfillTop}px`,
        width: "100%",
        zIndex: 10
      };
    },
    polyfillMidStyle() {
      const {
        filterInput,
        polyfillTop,
        polyfillMid
      } = this.stickyElementHeight;

      return {
        height: `${polyfillMid}px`,
        position: "sticky",
        top: `${polyfillTop + filterInput}px`,
        zIndex: 10,
        background: "#fff"
      };
    },
    // 筛选结果列表，只展示叶子节点
    filteredList() {
      return this.flatternList.filter(node => {
        const matchText = this.$t(node.i18nPath).includes(this.search);
        return this.isLeafNode(node) && matchText;
      });
    },
    // 最终在页面展示的列表，flatternList或者filteredList
    displayedList() {
      return this.search ? this.filteredList : this.flatternList;
    },
    // 叶子节点列表
    leafList() {
      return this.displayedList.filter(node => this.isLeafNode(node));
    }
  },
  watch: {
    list(newList) {
      this.flatternList = this.flattern({
        flatterned: [],
        list: _.cloneDeep(newList)
      });
    },
    selected(newSelected) {
      this.flatternList = this.flattern({
        flatterned: [],
        list: _.cloneDeep(this.list),
        selected: newSelected
      });
    }
  },
  methods: {
    // 打平树状结构的列表
    flattern({
      flatterned = [],
      list = [],
      selected = this.selected,
      pathPrefix
    }) {
      const len = list.length;
      let index = -1;
      if (!len) {
        return [];
      }

      while (++index < len) {
        const node = list[index];
        const curPath = (pathPrefix ? `${pathPrefix}.` : "") + index; // 若有前缀，则以点号连接

        node.path = curPath; // 记录路径
        node.level = curPath.split(".children.").length - 1; // 计算节点层级
        node.expanded =
          node.level === 0 || (this.expanded || []).includes(node.key); // 默认第一层展开, 此前已展开的节点，继续维持展开
        node.checked = selected.includes(node.key);

        if (node.level === 0) {
          node.parent = -1;
        }

        flatterned.push(node);

        const { children = [] } = node;
        if (children.length) {
          // 记录父级节点在flatterned的索引
          children.forEach(item => {
            item.parent = flatterned.length - 1;
          });
          this.flattern({
            flatterned,
            list: children,
            selected,
            pathPrefix: `${curPath}.children`
          });
        }
      }

      return flatterned;
    },
    /** ---------------------- 节点相关操作  -------------------------- */

    getNodeStyle(node) {
      const {
        filterInput,
        polyfillTop,
        polyfillMid,
        menuItem
      } = this.stickyElementHeight;
      const basePadding = 12;
      const paddingStep = 8;
      const baseTop = polyfillTop + filterInput + polyfillMid;
      const { level } = node;
      // const leaf = this.isLeafNode(node);

      let result = {};
      // 第一、二层节点存在滚动吸顶效果，使用sticky定位实现
      if (level === 0) {
        result = {
          position: "sticky",
          top: `${baseTop}px`, // sticky定位需要至少top/bottom/left/right的一个
          paddingLeft: `${basePadding}px`
        };
      } else if (level === 1) {
        result = {
          position: "sticky",
          top: `${baseTop + menuItem}px`,
          cursor: "pointer",
          paddingLeft: `${basePadding}px`
        };
      } else {
        // 其他节点层级缩进
        result = {
          cursor: "pointer",
          paddingLeft: `${basePadding + (level - 1) * paddingStep}px` // 层级缩进
        };
        // 非叶子节点继续使用sticky定位, FIXME: 始终保持sticky，会对后面的节点造成干扰
        // if (!leaf) {
        //   result.position = 'sticky';
        //   result.top = `${baseTop + level * menuItem}px`;
        // }
      }
      result.height = `${menuItem}px`;
      return result;
    },
    // 节点class
    getNodeClass(node) {
      const leaf = this.isLeafNode(node);
      const root = this.isRootNode(node);
      return [
        "tree-node",
        leaf ? "leaf-node" : "",
        root ? "root-node" : "",
        !leaf && !root ? "trunk-node" : "",
        node.checked ? "selected-node" : "",
        node.level === 1 ? "border-bottom" : ""
      ];
    },
    // 节点右侧的箭头类名
    getIconClass(node) {
      if (node.level < 1) {
        return "";
      }
      return node.expanded ? "vi-icon-arrow-down" : "vi-icon-arrow-right";
    },
    getNodeContent(node) {
      return this.$te(node.i18nPath) ? this.$t(node.i18nPath) : node.i18nPath;
    },
    getNodeHint(node) {
      const { hint } = node;
      if (!hint) {
        return "";
      }
      return this.$te(hint) ? this.$t(hint) : hint;
    },
    // 当前节点的父节点
    getNodeParent(node) {
      return this.flatternList[node.parent];
    },
    // 当前节点所属的根节点
    getNodeRoot(node) {
      let cur = node;
      let parentNode = this.getNodeParent(cur);
      while (parentNode) {
        cur = parentNode;
        parentNode = this.getNodeParent(cur);
      }
      return cur;
    },
    // 是否展示node, 只有在所有父级节点均展开时才展示
    isShowNode(node) {
      const { search } = this;
      // 非搜索状态下，第一、二层节点始终展示
      if (!search && node.level <= 1) {
        return true;
      }

      // 搜索状态下，处于筛选列表的节点始终展示
      if (search && this.filteredList.includes(node)) {
        return true;
      }

      let cur = node;
      let parentNode = this.getNodeParent(cur);
      while (parentNode) {
        if (!parentNode.expanded) {
          return false;
        }
        cur = parentNode;
        parentNode = this.getNodeParent(cur);
      }
      return true;
    },
    // 是否叶子节点
    isLeafNode(node) {
      const { children = [] } = node;
      return !children.length;
    },
    // 是否根节点
    isRootNode(node) {
      return node.level === 0;
    },
    // 获取在叶子节点中的索引
    getLeafIndex(node) {
      if (!this.isLeafNode(node)) {
        return -1;
      }
      return this.leafList.indexOf(node);
    },
    // 切换children节点展开状态
    toggleExpandChildren(node) {
      // 根节点以及叶子节点，展开操作没有意义
      if (this.isLeafNode(node) || node.level === 0) {
        return;
      }

      node.expanded = !node.expanded;

      const { expanded: expandedList } = this;
      const index = expandedList.indexOf(node.key);
      // 新增
      if (node.expanded && index < 0) {
        expandedList.push(node.key);
      }
      // 取消
      if (!node.expanded && index > -1) {
        expandedList.splice(index, 1);
      }

      this.flatternList = this.flatternList.slice(); // trigger update
    },
    // 点击节点
    clickNode(node) {
      // 叶子节点触发选中
      if (this.isLeafNode(node)) {
        node.checked = !node.checked;
        this.flatternList = this.flatternList.slice(); // trigger update
        const rootNode = this.getNodeRoot(node);

        this.$emit("select", {
          type: rootNode.key,
          value: node.key,
          checked: node.checked
        });
      } else {
        // 非叶子节点触发展开
        this.toggleExpandChildren(node);
      }
    }
  }
};
</script>

<style scoped lang="scss">
.sticky-tree-menu {
  padding: 0 16px 16px;
  width: 100%;
  .polyfill {
    position: relative;
    z-index: 10;
  }
  .polyfill-top {
    height: 16px;
  }
  .polyfill-mid {
    height: 8px;
  }
  .tree-node {
    margin: 0;
    background: #fff;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 400;
    color: rgba(51, 51, 51, 1);
    &.border-bottom {
      border-bottom: 1px solid rgba(228, 233, 237, 1);
    }
    &.root-node,
    &.trunk-node {
      z-index: 10;
    }
    &.root-node {
      background: rgba(248, 249, 250, 1);
      border-radius: 4px;
      font-weight: bold;
      color: rgba(70, 77, 98, 1);
    }
    &.leaf-node {
      &:hover {
        background: rgba(243, 244, 245, 1);
      }
      &.selected-node {
        color: rgba(63, 113, 195, 1);
      }
      > span:first-child {
        display: inline-block;
        width: 100%;
      }
      > div {
        width: 100%;
        display: flex;
        align-items: center;
        .content {
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: calc(100% - 26px);
        }
      }
    }
    .check {
      margin-right: 6px;
    }
  }
  .no-result {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    height: 400px;
    color: rgba(153, 153, 153, 1);
    img {
      width: 100%;
    }
  }
}
</style>
