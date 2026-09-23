import type { FilesRow } from './types';

import BaseService from '#/api/core/base';
import { requestClient } from '#/api/request';

const baseUrl = '/system/files';

export const FilesService = {
  ...BaseService<FilesRow>({ baseUrl }),

  uploadFile(data: { file: File; sub_dir: string }) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('sub_dir', data.sub_dir);
    return requestClient.post(`${baseUrl}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadImageBase64(data: any) {
    return requestClient.post(`${baseUrl}/upload-image-base64`, data);
  },

  /**
   * 按资源 key 批量换取可访问地址
   *
   * 公开空间返回访问域名拼接结果；私有空间（非公开读）返回带签名的临时直链。
   *
   * @param keys 资源地址集合（相对路径或本空间域名下的绝对地址）
   */
  accessUrls(keys: string[]) {
    return requestClient.post(`${baseUrl}/access-urls`, { keys }) as Promise<
      { key: string; url: string }[]
    >;
  },

  downloadById(id: number | string) {
    return requestClient.get(`${baseUrl}/download-by-id/${id}`, {
      responseType: 'blob',
    } as any);
  },

  getFileInfoByIds(params: any) {
    return requestClient.post('/sys/fileInfo/getFileInfoByIds', params);
  },

  initiateMultipartUpload(params: any) {
    return requestClient.post('/sys/fileInfo/initiateMultipartUpload', params);
  },

  uploadPart(data: any) {
    return requestClient.post('/sys/fileInfo/uploadPart', data);
  },

  completeMultipartUpload(params: any) {
    return requestClient.post('/sys/fileInfo/completeMultipartUpload', params);
  },

  abortMultipartUpload(params: any) {
    return requestClient.post('/sys/fileInfo/abortMultipartUpload', params);
  },

  getFileList(params: any) {
    return requestClient.get(baseUrl, { params });
  },

  getCategories() {
    return requestClient.get(`${baseUrl}/categories`);
  },
};
