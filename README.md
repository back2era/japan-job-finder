# 日职导航 (Japan Job Finder)

面向中文求职者与赴日/在日留学生的日本求职聚合站，零外部依赖、支持单文件离线运行与 GitHub Pages 自动部署。

## 核心数据源（共收录 1,774 个职位）

- **マイナビ2027 (应届新卒)**：977 家企业，包含完整「初任給（按学历/路线明细）、固定加班制度、月收例、诸手当、昇給・賞与、年間休日、福利厚生、工作时间」以及企业档案（设立年份、资本金、销售额、主营业务、主要客户、研修制度、校招实绩）。
- **マイナビ転職 (Mynavi 社招 / 第二新卒)**：333 个精选技术与商务岗位。
- **Daijob 双语人才网**：120 个面向双语、外籍与留学生的应届/早期岗位（含签证支持与语言要求）。
- **知名科技与跨国名企公开招聘接口 (Greenhouse / Lever)**：344 个来自 Woven by Toyota、Sony Interactive Entertainment、Mujin、SkyDrive、PayPay 证券、Guidepoint、Tanium 的真实岗位。

## 主要功能

- **多维筛选与中日英三语搜索**：支持按城市、职种、招聘类型（应届新卒/第二新卒/实习/社招）、远程/混合办公、公开薪资、**外国人OK（481 岗）**、**有员工口碑评价（1,451 岗）** 过滤。
- **公司口碑与员工真实评价**：整合 **Lighthouse（エン カイシャの評判）** 数据，在详情抽屉展示综合评分（5分制）、回答者在职平均年薪、8 维度评估条以及多条不同维度的员工真实评论。
- **结构化详情与浏览器内一键翻译**：自动分块展示待遇与岗位要点，支持调用浏览器内置 Translator API 一键将日文/英文详情与员工评价翻译为中文。
- **收藏夹持久化**：收藏记录保存在当前浏览器的 `localStorage` 中。

## 本地运行与构建

```sh
node --test core.test.cjs
node build.mjs
```

构建后打开 `dist/index.html` 即可直接使用；或通过仓库内置的 `.github/workflows/pages.yml` 自动部署至 GitHub Pages。

## 版权与声明

- 薪资、申请资格、日语与签证条件及评价数据分别来源于企业招聘原文及公开口碑平台，仅供参考，请以企业官方最新公告为准。
- 东京照片由 Kazuend 拍摄，通过 [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Shiba-koen,_aerial_view_on_Tokyo_Tower_at_dusk_(Unsplash).jpg) 使用（CC0）。
