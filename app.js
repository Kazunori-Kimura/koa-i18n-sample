"use strict";
const koa = require("koa");
const route = require("koa-route");
const render = require("koa-swig");
const locale = require("koa-locale");
const i18n = require("koa-i18n");
const path = require("path");
const app = koa();
const PORT = 3000;

locale(app);

// i18nの設定
app.use(i18n(app, {
  directory: path.resolve(__dirname, "locales"),
  locales: ["ja", "en"],
  extension: ".json",
  modes: [
    "query",  // optional detect querystring - `/?locale=en`
    "cookie", // optional detect cookie      - `Cookie: locale=zh-TW`
    "header"  // optional detect header      - `Accept-Language: zh-CN,zh;q=0.5`
  ]
}));

// swigの設定
app.context.render = render({
  root: path.resolve(__dirname, "views"),
  ext: "html"
});

// ルーティングの設定
// [get] /:view
app.use(route.get("/:view", function*(view){
  this.body = yield this.render(view);
}));

app.listen(PORT);
console.log(`listening on port ${PORT}`);
