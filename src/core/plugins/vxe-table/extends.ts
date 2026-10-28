import type { VxeGridProps, VxeUIExport } from 'vxe-table';

import type { VxeGridApi } from './api';

import type { Recordable } from '#/core/shared/types';

import { formatDate, formatDateTime, isFunction } from '#/core/shared';

export function extendProxyOptions(
  api: VxeGridApi,
  options: VxeGridProps,
  getFormValues: () => Recordable<any>,
  onToolbarRefresh?: () => Promise<null | Recordable<any>>,
) {
  [
    'query',
    'querySuccess',
    'queryError',
    'queryAll',
    'queryAllSuccess',
    'queryAllError',
  ].forEach((key) => {
    extendProxyOption(key, api, options, getFormValues, onToolbarRefresh);
  });
}

function extendProxyOption(
  key: string,
  api: VxeGridApi,
  options: VxeGridProps,
  getFormValues: () => Recordable<any>,
  onToolbarRefresh?: () => Promise<null | Recordable<any>>,
) {
  const { proxyConfig } = options;
  const configFn = (proxyConfig?.ajax as Recordable<any>)?.[key];
  if (!isFunction(configFn)) {
    return options;
  }

  const wrapperFn = async (
    params: Recordable<any>,
    customValues: Recordable<any>,
    ...args: Recordable<any>[]
  ) => {
    let formValues = getFormValues();
    /**
     * 开启toolbarConfig.refresh功能
     * 点击刷新按钮 这里的值为PointerEvent 会携带错误参数
     *
     * 刷新按钮触发时，以当前搜索表单的值为准（而非上次提交值），
     * 避免用户修改了筛选条件但未点击「搜索」时，刷新丢失当前生效的条件。
     * onToolbarRefresh 由调用方注入，负责读取当前表单值并回写最新提交值，
     * 返回 null 时回退为上次提交值，保证行为向后兼容。
     */
    if (customValues instanceof PointerEvent && onToolbarRefresh) {
      try {
        const currentValues = await onToolbarRefresh();
        if (currentValues) {
          formValues = currentValues;
        }
      } catch (error) {
        console.error(
          'Failed to read current form values on toolbar refresh:',
          error,
        );
      }
    }
    const data = await configFn(
      params,
      {
        ...(customValues instanceof PointerEvent ? {} : customValues),
        ...formValues,
      },
      ...args,
    );
    return data;
  };
  api.setState({
    gridOptions: {
      proxyConfig: {
        ajax: {
          [key]: wrapperFn,
        },
      },
    },
  });
}

export function extendsDefaultFormatter(vxeUI: VxeUIExport) {
  vxeUI.formats.add('formatDate', {
    tableCellFormatMethod({ cellValue }) {
      return formatDate(cellValue);
    },
  });

  vxeUI.formats.add('formatDateTime', {
    tableCellFormatMethod({ cellValue }) {
      return formatDateTime(cellValue);
    },
  });
}
