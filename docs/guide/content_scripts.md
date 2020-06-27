## 内容脚本 Content Scripts

内容脚本是在网页上下文中运行的文件。 通过使用标准的文档对象模型（DOM），他们能够读取浏览器访问网页的详细信息，对其进行更改并将信息传递给其父扩展。


### 了解内容脚本功能

内容脚本可以通过与扩展程序交换消息来访问其父扩展程序使用的 Chrome API。他们还可以使用 chrome.runtime.getURL() 访问扩展程序文件的 URL，并使用与其他 URL 相同的结果。

``` js
//Code for displaying <extensionDir>/images/myimage.png:
  var imgURL = chrome.runtime.getURL("images/myimage.png");
  document.getElementById("someImage").src = imgURL;
```

此外，内容脚本可以直接访问以下 chrome API：

* [i18n](https://developer.chrome.com/extensions/i18n)
* [storage](https://developer.chrome.com/extensions/storage)
* [runtime](https://developer.chrome.com/extensions/runtime):
    * [connect](https://developer.chrome.com/extensions/runtime#method-connect)
    * [getManifest](https://developer.chrome.com/extensions/runtime#method-getManifest)
    * [getURL](https://developer.chrome.com/extensions/runtime#method-getURL)
    * [id](https://developer.chrome.com/extensions/runtime#property-id)
    * [onConnect](https://developer.chrome.com/extensions/runtime#event-onConnect)
    * [onMessage](https://developer.chrome.com/extensions/runtime#event-onMessage)
    * [sendMessage](https://developer.chrome.com/extensions/runtime#method-sendMessage)

内容脚本无法直接访问其他 API。

### 在孤立的世界中执行

内容脚本生活在一个孤立的世界中，它允许内容脚本对其 JavaScript 环境进行更改，而不会与页面或其他内容脚本发生冲突。

扩展程序可以使用类似于以下示例的代码在网页中运行。

``` html
<html>
    <button id="mybutton">click me</button>
    <script>
      var greeting = "hello, ";
      var button = document.getElementById("mybutton");
      button.person_name = "Bob";
      button.addEventListener("click", function() {
        alert(greeting + button.person_name + ".");
      }, false);
    </script>
  </html>
```

该扩展可以注入以下内容脚本。

``` js
  var greeting = "hola, ";
  var button = document.getElementById("mybutton");
  button.person_name = "Roberto";
  button.addEventListener("click", function() {
    alert(greeting + button.person_name + ".");
  }, false);
```

如果按下该按钮，将同时出现两个 alert。

孤立的世界不允许扩展的内容脚本和网页互相访问彼此的变量或函数。这也使内容脚本能够启用网页不能访问的功能。[Youtube](https://youtu.be/laLudeUmXHM)

### 注入脚本

内容脚本可以以代码方式或声明方式注入。

#### 以代码方式注入

对需要在特定情况下运行的内容脚本使用代码注入。

要注入代码式内容脚本，请在 manifest 中赋予[activeTab](https://developer.chrome.com/activeTab) 权限。 这将赋予对当前主机的安全访问权限以及对[选项卡](https://developer.chrome.com/tabs#manifest)的临时访问权限，从而使内容脚本可以在当前活动选项卡上运行，而无需指定[跨域权限](https://developer.chrome.com/extensions/xhr#requesting-permission)。

```
 {
    "name": "My extension",
    ...
    "permissions": [
      "activeTab"
    ],
    ...
  }
```

内容脚本可以作为代码注入。

``` js
 chrome.runtime.onMessage.addListener(
    function(message, callback) {
      if (message == “changeColor”){
        chrome.tabs.executeScript({
          code: 'document.body.style.backgroundColor="orange"'
        });
      }
   });
```

或者可以注入整个文件。

``` js 
  chrome.runtime.onMessage.addListener(
    function(message, callback) {
      if (message == “runContentScript”){
        chrome.tabs.executeScript({
          file: 'contentScript.js'
        });
      }
   });
```

#### 声明式注入

在指定页面上自动运行的内容脚本可使用声明式注入。

以声明方式注入的脚本被注册在 manifest 的 “content_scripts” 字段下。它们可以包括JavaScript 文件或 CSS 文件。所有自动运行的内容脚本都必须指定[匹配模式](https://developer.chrome.com/extensions/match_patterns)。

```
{
 "name": "My extension",
 ...
 "content_scripts": [
   {
     "matches": ["http://*.nytimes.com/*"],
     "css": ["myStyles.css"],
     "js": ["contentScript.js"]
   }
 ],
 ...
}
```


| Name  | Type | Description |
| --- | --- | --- |
| matches | 字符串数组 | 必需。指定此内容脚本将被注入到哪些页面。|
| css | 字符串数组 | 可选。要插入匹配页面的CSS文件列表。在为页面构造或显示任何DOM之前，将按照它们在此数组中出现的顺序注入它们。|
| js | 字符串数组 |  可选。要插入匹配页面的JavaScript文件列表。以它们在此数组中出现的顺序注入。|
| match_about_blank | boolean | 可选。脚本是否应该注入到 about:blank 框架中，其中父框架或opener 框架与 match 中声明的模式之一相匹配。默认为false。 |



#### Exclude Matches and Globs


通过在 manifest 注册中包括以下字段，可以自定义指定页面匹配。


| Name | Type | Description |
| --- | --- | --- |
| exclude_matches | 字符串数组 | 可选。排除此内容脚本将被注入的页面。|
| include_globs | 字符串数组 | 可选。 在 matches 后应用，以匹配与此 glob 匹配的URL。旨在模拟 @exclude 油猴关键字。 |
| exclude_globs | 字符串数组 |  可选。 在 matches 后应用，以排除与此 glob 匹配的URL。旨在模拟 @exclude 油猴关键字。</div> |


如果内容脚本的 URL 匹配任何 matches 模式和任何 include_globs 模式，则该内容脚本将被注入到页面中，只要 URL 不匹配 exclude_matches 或 exclude_globs 模式。

因为 matchs 属性是必需的，所以 exclude_matches，include_globs 和exclude_globs 限制于仅可影响哪些页面。

以下扩展会将内容脚本注入到 http://www.nytimes.com/health 中，但不会注入到 http://www.nytimes.com/business 中。

```
{
  "name": "My extension",
  ...
  "content_scripts": [
    {
      "matches": ["http://*.nytimes.com/*"],
      "exclude_matches": ["*://*/*business*"],
      "js": ["contentScript.js"]
    }
  ],
  ...
}
```

与 [match patterns](https://developer.chrome.com/extensions/match_patterns) 相比，Glob 属性遵循更灵活的语法。可接受的 Glob 字符串可能包含“通配符”星号和问号的 URL。 星号 * 匹配任意长度的字符串，包括空字符串，而问号 ？匹配任何单个字符。

例如，glob http://???.example.com/foo/* 匹配以下任何一个：

* http:// www .example.com/foo /bar
* http:// the .example.com/foo / 

但是，它不匹配以下条数：

* http://my.example.com/foo/bar
* http://example.com/foo/
* http://www.example.com/foo  

此扩展程序会将内容脚本注入 http://www.nytimes.com/arts/index.html 和 http://www.nytimes.com/jobs/index.html， 但不会注入  http://www.nytimes.com/sports/index.html 。


```
{
  "name": "My extension",
  ...
  "content_scripts": [
    {
      "matches": ["http://*.nytimes.com/*"],
      "include_globs": ["*nytimes.com/???s/*"],
      "js": ["contentScript.js"]
    }
  ],
  ...
}
```

此扩展程序会将内容脚本注入 http://history.nytimes.com 和 http://.nytimes.com/history， 但不会注入 http://science.nytimes.com 或 http://www.nytimes.com/science 。

```
{
  "name": "My extension",
  ...
  "content_scripts": [
    {
      "matches": ["http://*.nytimes.com/*"],
      "exclude_globs": ["*science*"],
      "js": ["contentScript.js"]
    }
  ],
  ...
}
```

可以包括其中的一个，多个或全部，以匹配到到正确的范围。

```
{
  "name": "My extension",
  ...
  "content_scripts": [
    {
      "matches": ["http://*.nytimes.com/*"],
      "exclude_matches": ["*://*/*business*"],
      "include_globs": ["*nytimes.com/???s/*"],
      "exclude_globs": ["*science*"],
      "js": ["contentScript.js"]
    }
  ],
  ...
}
```

#### Run Time

将 JavaScript 文件注入网页时，由 run_at 字段控制。首选的默认字段是“document_idle”，但如果需要，也可以指定为 “document_start” 或“document_end”。

```
{
  "name": "My extension",
  ...
  "content_scripts": [
    {
      "matches": ["http://*.nytimes.com/*"],
      "run_at": "document_idle",
      "js": ["contentScript.js"]
    }
  ],
  ...
}
```


| Name | Type | Description |
| --- | --- | --- |
| document_idle | string |  首选。 尽可能使用 “document_idle”。浏览器选择一个时间在 “document_end” 和window.onload 事件触发后立即注入脚本。 注入的确切时间取决于文档的复杂程度以及加载所需的时间，并且已针对页面加载速度进行了优化。在 “document_idle” 上运行的内容脚本不需要监听 window.onload 事件，因此可以确保它们在 DOM 完成之后运行。如果确实需要在window.onload 之后运行脚本，则扩展可以使用 document.readyState 属性检查 onload 是否已触发。|
| document_start | string | 在 css 文件之后，但在构造其他 DOM 或运行其他脚本前注入。 |
| document_end | string |  在 DOM 创建完成后，但在加载子资源（例如 images 和 frames ）之前，立即注入脚本。 |

#### 其他 Frames

“all_frames” 字段指定扩展是将 JavaScript 和 CSS 文件注入到符合指定 URL 的所有 Frames 中，还是仅注入到选项卡中最顶部的 Frame 中。

```
{
  "name": "My extension",
  ...
  "content_scripts": [
    {
      "matches": ["http://*.nytimes.com/*"],
      "all_frames": true,
      "js": ["contentScript.js"]
    }
  ],
  ...
}
```


| Name | Type | Description |
| --- | --- | --- |
| all_frames | boolean |  可选。默认为 false，表示仅匹配顶部 frame。如果指定为 true，则它将注入所有 frame，即使该frame 不是选项卡中最上面的 frame 也是如此。 独立检查每个 frame 的 URL，如果不满足 URL，则不会将其插入子 frame。 |


### 与嵌入页面的通信

尽管内容脚本的执行环境和托管它们的页面是相互隔离的，但是它们共享对页面 DOM 的访问。如果页面希望与内容脚本或通过内容脚本与扩展通信，则它必须通过共享 DOM 进行通信。

可以使用 [window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) 来完成一个示例：

``` js
var port = chrome.runtime.connect();

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "FROM_PAGE")) {
    console.log("Content script received: " + event.data.text);
    port.postMessage(event.data.text);
  }
}, false);
```

``` js
document.getElementById("theButton").addEventListener("click",
    function() {
  window.postMessage({ type: "FROM_PAGE", text: "Hello from the webpage!" }, "*");
}, false);
```

非扩展页面 example.html 将消息发布到其自身。内容脚本会拦截并检查此消息，然后将其发布到扩展。这样，页面就建立了与扩展过程的通讯线路。通过类似的方式可以实现相反的效果。

### 保持安全

尽管孤立的世界提供了一层保护，但使用内容脚本可能会在扩展程序和网页中创建漏洞。如果内容脚本从另一个网站接收内容（例如发出 XMLHttpRequest），请在注入内容之前小心过滤[跨站点脚本](http://en.wikipedia.org/wiki/Cross-site_scripting)攻击。 仅使用 HTTPS 通信，以避免“[中间人](http://en.wikipedia.org/wiki/Man-in-the-middle_attack)”攻击。

确保过滤掉恶意网页。例如，以下模式很危险：

``` js
var data = document.getElementById("json-data")
// WARNING! Might be evaluating an evil script!
var parsed = eval("(" + data + ")")
```

```
var elmt_id = ...
// WARNING! elmt_id might be "); ... evil script ... //"!
window.setTimeout("animate(" + elmt_id + ")", 200);
```

相反，请选择不会运行脚本的更安全的 API：

``` js
var data = document.getElementById("json-data")
// JSON.parse does not evaluate the attacker's scripts.
var parsed = JSON.parse(data);
```

``` js
var elmt_id = ...
// The closure form of setTimeout does not evaluate scripts.
window.setTimeout(function() {
  animate(elmt_id);
}, 200);
```



-------

关注 微信公众号「**程序化思维**」 获取最新 Chrome 插件开发教程。

![mp_wechat](/mp1.png)



