# 日职导航

中文日本求职原型。整合マイナビ転職（Mynavi）海量日职数据与多家知名企业公开招聘接口（Greenhouse / Lever）。支持按城市、职种、第二新卒/应届、公开薪资、远程办公进行多维筛选与中日双语关键词搜索。打开页面时尝试同步，接口不可用时提供包含真实岗位细节与中文摘要的职位快照。职位收藏保存在当前浏览器中。

```sh
node --test core.test.cjs
node build.mjs
```

打开 `dist/index.html` 即可使用。构建生成的单个 HTML 包含样式、脚本、照片和职位快照，无需安装依赖。实时同步需要联网。正文翻译使用浏览器自带的 Translator API，是否可用取决于浏览器和设备。

快照收录职位事实、薪资范围、签证与语言要求以及岗位详情正文。详情中的招聘正文在支持的接口下实时同步，或由本地快照提供。职位提供中文职种简译及岗位要点。薪资、申请资格、日语和签证条件以企业原文为准。

东京照片由 Kazuend 拍摄，通过 [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Shiba-koen,_aerial_view_on_Tokyo_Tower_at_dusk_(Unsplash).jpg) 使用，CC0。
