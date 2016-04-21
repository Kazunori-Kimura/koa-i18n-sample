# koa-i18n-sample

koaでのi18n対応

## 概要

koaでのi18n対応のサンプルです。node v4 以上対応。

現在のロケールに合わせて、表示するメッセージを切り替えます。

デフォルトは日本語

![ja](https://github.com/Kazunori-Kimura/koa-i18n-sample/raw/master/ja.png)

QueryStringで `en` を指定すると英語表記に変わります。

![ja](https://github.com/Kazunori-Kimura/koa-i18n-sample/raw/master/en.png)


### 使用ライブラリ

* koa
* koa-swig
* koa-i18n
* koa-route (今回の内容には直接は影響しません)

---

## コード解説

解説なんて不要、とりあえずソースコードを見たい！って方は
https://github.com/Kazunori-Kimura/koa-i18n-sample を参照ください。


* フォルダ構成

```
./koa-i18n-sample
│
│  app.js
│  package.json
│  
├─locales
│      en.js
│      ja.js
│      
└─views
        index.html
        layout.html
```

### localeファイルの作成

ユーザーのlocaleに対応する定義ファイルを `./locales` 以下に作成します。

ファイル名を `{locale名}.json` とし、localeに対応した文言の定義をjson形式で記述します。

```json:ja.json
{
	"title": "こんにちは Koa",
	"message": "こんにちは、世界！"
}
```

```json:en.json
{
  "title": "Hello Koa",
  "message": "Hello, world!"
}
```

このファイルを [koa-i18n](https://github.com/koa-modules/i18n) が読み取り
localeに対応したデータをviewに渡します。

koa-i18n は [i18n-2](https://github.com/jeresig/i18n-node-2) を
koa向けにラッピングしているようです。


### htmlテンプレートの作成

今回、viewのテンプレートエンジンに [swig](http://paularmstrong.github.io/swig/) を使用します。

koa向けにラッピングされた [koa-swig](https://github.com/koa-modules/swig) モジュールを使用していますが
代わりに `co-views` と `swig` を使用しても同様だと思います。

今回、全体のレイアウトを定義する `layout.html` と
コンテンツを埋め込む `index.html` の、2つのテンプレートファイルを用意します。

```html:layout.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{% block title %}koa-i18n-sample{% endblock %}</title>
  <style>
    html, body {
      margin: 0px;
      padding: 0px;
      background-color: #E9ECF5;
    }
    #content {
      margin: 40px auto;
      padding: 10px;
      width: 60vw;
      height: 40vh;
      background-color: #73BFB8;
      color: #eaeaea;
      font-size: 4em;
    }
  </style>
</head>
<body>
  <section id="content">
    {% block content %}
      <p>Missing content!</p>
    {% endblock %}
  </section>
</body>
</html>
```

テンプレートファイル内で i18n の値を使用するには、`{{ __("key") }}` という形式で記述します。

```html:index.html
{% extends 'layout.html' %}

{% block title %}{{ __("title") }}{% endblock %}


{% block content %}
  <p>{{ __("message") }}</p>
{% endblock %}
```

### app.js

まずは、i18n が localesフォルダ内のjsonファイルを
正しく読み取れるように、設定を行います。

```js:appjs
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
```

今回は日本語(ja)と英語(en)の切り替えを想定しています。

デフォルトは `locales` で指定した配列の先頭要素で指定された locale になるようですが
`defaultLocale` で指定することもできます。

`extension` で `.json` を指定しています。
この指定が無いと、デフォルトの拡張子は `.js` となります。

jsonファイルを `.js` の拡張子で作成するのは気持ち悪いので、
正しく指定しておいた方が良いでしょう。

`modes` では、クライアントのlocaleをどのように取得するかを指定します。

今回は容易に言語切り替えを行いたいので、QueryStringによる判断を優先させます。

通常想定される使用であれば上記の設定で十分かと思いますが
詳しい設定については、[i18n-2](https://github.com/jeresig/i18n-node-2) の README を参照ください。



```js:appjs
// swigの設定
app.context.render = render({
  root: path.resolve(__dirname, "views"),
  ext: "html"
});
```

つづいて、swigの設定です。

今回はテンプレートファイルの保存場所と拡張子を指定しています。

こちらも詳しい設定については [koa-swig](https://github.com/koa-modules/swig) の README や
[swig](http://paularmstrong.github.io/swig/) のドキュメントを参照してください。


```js:appjs
// ルーティングの設定
// [get] /:view
app.use(route.get("/:view", function*(view){
  this.body = yield this.render(view);
}));
```

最後にルーティングの設定です。

今回は `index.html` しか用意していないので、あまり意味はないのですが
クライアントからのリクエストに合わせて表示される view を切り替えるようにしています。

ここで `:view` に入ってくるのは `http://localhost:3000/index` の `index` 部分です。
`render` メソッドには拡張子を除くbasenameを指定します。


### 実行

`node app.js` と入力してサーバーを実行してください。

適当なブラウザで、 `http://localhost:3000/index` にアクセスして
日本語のメッセージが表示されることを確認します。

![ja](https://github.com/Kazunori-Kimura/koa-i18n-sample/raw/master/ja.png)

つづいて、 `http://localhost:3000/index?locale=en` にアクセスして
メッセージが英語になることを確認します。

![en](https://github.com/Kazunori-Kimura/koa-i18n-sample/raw/master/en.png)

---

`koa-i18n` による多言語対応のサンプルについて解説しました。

記事の間違いや「こうするべき！」というのがあれば、ご意見ください。


## LICENSE

MIT
