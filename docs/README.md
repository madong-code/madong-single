# 项目文档

本目录存放 `vue-vben-admin-ele` 单应用版本的工程文档，不包含文档站点运行时或独立 workspace。

## 文档导航

- [架构设计](./architecture.md)：单应用目录、`src/core` 能力域和依赖边界。
- [迁移说明](./migration.md)：从 Vue Vben Admin `v5.7.0` 多应用仓库迁移到当前结构的关键决策。
- [开发指南](./development.md)：环境要求、启动方式、常用命令和交付检查。
- [故障排查](./troubleshooting.md)：开发服务器、Element Plus、Mock 和测试相关问题。

## 维护约定

- 文档内容以当前代码和根目录配置为准。
- 新能力优先归入现有 11 个 `src/core` 能力域，不扩展新的一级抽象层。
- 工程说明集中在本目录，根目录仅保留 `README.md` 作为项目入口。
