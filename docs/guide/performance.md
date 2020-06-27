## 达到最佳性能

扩展是浏览器的补充，旨在提供补充和自定义功能。 延缓或损害浏览体验的扩展程序对用户来说是有问题的，并且违背了Chrome 扩展程序的目标。除了一般的良好编码习惯外，开发人员还应遵循这些做法，以确保其扩展以最佳性能运行。

### 尽可能延迟

直到需要它们再加载资源。 在启动功能中仅包括打开扩展所需的功能。在启动过程中，请勿加载仅在用户点击按钮时才需要的东西，或仅在用户登录后才起作用的功能。

#### 管理重要事件

高效的后台脚本包含对其扩展很重要的已注册事件。 它们处于休眠状态，直到触发了侦听器，再采取相应的操作，然后返回休眠状态。保持不需要的脚本运行，对系统资源的浪费。

如果可能，应在 manifest 中注册后台脚本，并将其持久性设置为 false。

```
{
  "name": "High Performance Extension",
  "description" : "Sleepy Background Script",
  "version": "1.0",
  ...
  "background": {
   "scripts": ["background.js"],
   "persistent": false
  },
  ...
}
```

使扩展程序使用 chrome.webRequest API 劫持或修改网络请求的唯一方法是始终使后台脚本保持活动状态。 webRequest API 与非持久性后台页面不兼容。

```
{
  "name": "High Performance Extension",
  "description" : "Persistent Background Script",
  "version": "1.0",
  ...
  "background": {
    "scripts": ["background.js"],
    "persistent": true
  },
  "permissions": [
    "webRequest",
    "webRequestBlocking",
    "https://<distracting social media site>.com/*"
  ],
 ...
 }
```

``` js
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
      return {redirectUrl: "https://developer.chrome.com/"};
    },
    {urls: ["https://social.media.distraction.com/*"]},
    ["blocking"]
  );
```

### 包含内容脚本

内容脚本应充当扩展程序的秘密代理，在扩展程序核心执行更繁琐的逻辑的同时，巧妙地读取或修改网页。他们应该有明确的目标，避免在不相关的页面上进行侵入性活动。理想情况下，除了有目的的行为外，内容脚本不应在浏览体验中引起注意。

#### 声明目标

如果扩展程序在不必要的位置或不适当的时间运行内容脚本，可能会导致浏览器运行缓慢，并可能导致功能错误。通过在 manifest 中提供[匹配模式](https://developer.chrome.com/match_patterns)并在 document_idle 而不是document_start 上运行脚本来避免这种情况。

```
{
  "name": "High Performance Extension",
  "description" : "Superfly Superlight Content Scripts",
  "version": "1.0",
  ...
  "content_scripts": [
    {
      "js": ["content_script.js"],
      "matches": ["https://developer.chrome.com/*"],
      "run_at": "document_idle"
    }
  ]
  ...
}
```

如果扩展程序仅需要使用用户的操作来访问网页，请以代码方式将其注入。 只有在用户调用时，代码注入才会运行。

``` js
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript({
      code: 'document.body.style.fontSize="100px"'
    });
  });
```

#### 仅在需要时使用内容脚本

许多扩展可能根本不需要内容脚本即可完成所需的功能。使用 declarativeContent API 将为扩展设置规则，以识别何时满足相关条件。这比内容脚本更有效，并且使用的代码更少！

如果扩展需要在用户访问带有 HTML5 < video >元素的网站时向用户显示页面操作，则可以指定声明性规则。

``` js
chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([
        {
          conditions: [
            new chrome.declarativeContent.PageStateMatcher({
              css: ["video"],
            })
          ],
          actions: [ new chrome.declarativeContent.ShowPageAction() ]
        }
      ]);
    });
  });
```

### 评估代码效率

可以将相同的网站性能通用做法应用于扩展，例如异步编程的实现技术以及使代码最少且紧凑。

使用 Lighthouse 之类的工具评估扩展程序的性能，并确定可以在可视扩展程序页面上改进的目标区域。






