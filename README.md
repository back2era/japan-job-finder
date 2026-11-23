# 日职导航

中文日本求职原型。使用七家企业的公开 Greenhouse 或 Lever 招聘接口。打开页面时从招聘方同步，接口不可用时提供有日期标记的真实职位快照。职位收藏保存在当前浏览器中。

```sh
node --test core.test.cjs
node build.mjs
```

打开 `dist/index.html` 即可使用。构建生成的单个 HTML 包含样式、脚本、照片和职位快照，无需安装依赖。实时同步需要联网。正文翻译使用浏览器自带的 Translator API，是否可用取决于浏览器和设备。

快照只保存职位事实和简短中文摘要。详情中的招聘正文实时来自企业接口。部分职位提供中文职种简译。薪资、申请资格、日语和签证条件以企业原文为准。

东京照片由 Kazuend 拍摄，通过 [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Shiba-koen,_aerial_view_on_Tokyo_Tower_at_dusk_(Unsplash).jpg) 使用，CC0。
