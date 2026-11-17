<template>
  <ElSelect
    v-model="value"
    :loading="loading"
    :placeholder="placeholder"
    :remote-method="remoteMethod"
    allow-create
    class="w-full"
    filterable
    remote
    @visible-change="onVisibleChange"
  >
    <ElOption
      v-for="opt in options"
      :key="opt.value"
      :label="opt.label"
      :value="opt.value"
    >
      <template #default>
        <div class="tenant-searcher__item">
          <span class="tenant-searcher__name">{{ opt.label }}</span>
          <span class="tenant-searcher__code">{{ opt.code }}</span>
        </div>
      </template>
    </ElOption>
    <template v-if="hasMore" #footer>
      <div class="tenant-searcher__more" @click="loadMore">
        加载更多（{{ options.length }}/{{ total }}）
      </div>
    </template>
  </ElSelect>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getTenantPageApi } from '#/api';

interface Props {
  modelValue?: string;
  /**
   * 分页阈值：命中总数不超过该值时不出现「加载更多」，
   * 超过时才开启分页加载
   */
  threshold?: number;
  /** 每页数量，默认与阈值一致 */
  pageSize?: number;
  placeholder?: string;
  /** 首次加载后若未选择，自动选中第一个租户 */
  autoFirst?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  threshold: 20,
  pageSize: undefined,
  placeholder: '输入租户代码或名称搜索',
  autoFirst: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const value = computed({
  get: () => props.modelValue ?? '',
  set: (val) => {
    const next = val ?? '';
    // ElSelect 初始化/清空时会回写空值，若与当前值相同则不上抛：
    // 否则表单会把该字段标记为「已校验」，登录页一进来就显示必填错误。
    if (next === (props.modelValue ?? '')) return;
    emit('update:modelValue', next);
  },
});

const options = ref<{ label: string; code: string; value: string }[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const keyword = ref('');

const size = computed(() => props.pageSize ?? props.threshold);
const hasMore = computed(() => options.value.length < total.value);

let timer: ReturnType<typeof setTimeout> | undefined;
/** 请求序号：丢弃过期响应，避免并发请求互相覆盖选项 */
let requestSeq = 0;
/** 下拉首次打开时加载一次，之后复用已有选项 */
let initialized = false;
/** code → 名称缓存：保证选项被替换后仍能把 code 显示成租户名称 */
const nameCache = new Map<string, string>();

/**
 * 补齐当前选中项：选中项不在新列表里时补一条，避免输入框回退显示 code。
 * 仅用于展示，提交的始终是 value（即 code）。
 */
function withSelected(list: { label: string; code: string; value: string }[]) {
  const cur = value.value;
  if (!cur || list.some((o) => o.value === cur)) return list;
  const name = nameCache.get(cur);
  if (!name) return list;
  return [{ label: name, code: cur, value: cur }, ...list];
}

/** 当前选中项的展示文本；无匹配项时回退为原始 value */
function currentLabel(): string {
  const opt = options.value.find((o) => o.value === value.value);
  return opt ? opt.label : (value.value ?? '');
}

/** 加载租户分页数据，reset=true 时重置为第一页并整体替换选项 */
async function load(reset = false) {
  const seq = ++requestSeq;
  const targetPage = reset ? 1 : page.value + 1;
  loading.value = true;
  try {
    const res = await getTenantPageApi({
      keyword: keyword.value,
      page: targetPage,
      page_size: size.value,
    });
    // 已有更新的请求发出，丢弃本次结果
    if (seq !== requestSeq) return;
    res.list.forEach((t) => nameCache.set(t.code, t.name));
    const list = res.list.map((t) => ({
      label: t.name,
      code: t.code,
      value: t.code,
    }));
    // 拿到结果后再整体替换，避免加载途中列表跳动
    options.value = reset ? withSelected(list) : [...options.value, ...list];
    total.value = res.total;
    page.value = targetPage;
  } catch {
    if (seq !== requestSeq) return;
    if (reset) {
      options.value = [];
      total.value = 0;
    }
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

/** 防抖加载（300ms） */
function scheduleLoad(reset = true) {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => load(reset), 300);
}

/**
 * 远端搜索：仅在用户真正输入关键字时触发。
 * 聚焦/点击输入框时 Element Plus 会回传当前展示文本或空串，
 * 这些非用户输入统一忽略，避免点击即加载、数据跳动。
 */
function remoteMethod(query: string) {
  const q = (query ?? '').trim();
  if (q === '' || q === currentLabel()) return;
  keyword.value = q;
  initialized = true;
  scheduleLoad(true);
}

/** 下拉首次打开时加载一次，后续复用已有选项 */
function onVisibleChange(visible: boolean) {
  if (!visible || initialized) return;
  initialized = true;
  keyword.value = '';
  load(true);
}

function loadMore() {
  if (!hasMore.value || loading.value) return;
  load(false);
}

// 仅用于「自动选中第一个租户」，不参与下拉选项加载。
// 注意：仅在平台只有一个租户时才自动选中。多租户下静默选中排序第一的
// 租户，会让未主动改选的用户把别人的租户 code 提交上去，后端按该租户
// 查账号 → 误报「账号或密码错误」，导致看起来“数据没错却登录不了”。
onMounted(() => {
  if (!props.autoFirst || value.value) return;
  getTenantPageApi({ page: 1, page_size: 1 })
    .then((res) => {
      if (res.total !== 1) return;
      const first = res.list[0];
      if (!first) return;
      nameCache.set(first.code, first.name);
      if (!value.value) value.value = first.code;
      // 预填后补齐展示项，保证输入框显示名称而不是 code
      options.value = withSelected(options.value);
    })
    .catch(() => {});
});
</script>

<style scoped>
/* 与表单内 VbenInput（h-10 / rounded-md / px-3 / text-sm）保持尺寸一致，
   否则 Element Plus 默认 32px 高度会比下方输入框矮一截 */
:deep(.el-select__wrapper) {
  min-height: 2.5rem;
  padding: 0 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.tenant-searcher__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tenant-searcher__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tenant-searcher__code {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tenant-searcher__more {
  cursor: pointer;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--el-color-primary);
  text-align: center;
}

.tenant-searcher__more:hover {
  background: var(--el-fill-color-light);
}
</style>