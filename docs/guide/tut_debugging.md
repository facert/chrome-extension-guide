## 调试扩展

扩展程序可以利用 [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/) 为网页提供的一样的调试优势，但它们具有独特的行为属性。成为主扩展调试器需要了解以下行为，扩展组件如何相互配合以及在哪里处理错误。本教程使开发人员对调试扩展有基本的了解。

### 找到日志

扩展由许多不同的组件组成，这些组件有各自的职责。在[此处](https://developer.chrome.com/extensions/examples/tutorials/broken_background_color.zip)下载损坏的扩展程序，以开始查找不同扩展程序组件的错误日志。

#### 后台脚本 Background Script
访问 chrome://extensions chrome 扩展管理页面，并确保已启用开发人员模式。单击加载解压缩按钮，然后选择损坏的扩展目录。扩展名加载后，它应具有三个按钮：详细信息，删除和红色的错误。

![error_button](./assets/error_button.png)

单击错误按钮以查看错误日志。扩展程序系统在后台脚本中发现了一个错误。

``` js
Uncaught TypeError: Cannot read property ‘addListener’ of undefined
```

![background_error](./assets/background_error.png)

此外，可以选择 “查看视图” 视图旁边的蓝色链接背景页打开 Chrome DevTools 面板。

![inspect_views_background](./assets/inspect_views_background.png)

回到代码

``` js
 chrome.runtime.oninstalled.addListener(function() {
    chrome.storage.sync.set({color: '#3aa757'}, function() {
      console.log('The color is green.');
    });
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostEquals: 'developer.chrome.com'},
        })],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
  });
```

后台脚本正在尝试监听 onInstalled 事件，但是属性名称要求使用大写字母 “I”。 更新代码来执行正确的调用，单击右上角的全部清除按钮，然后重新加载该扩展。

#### 弹窗 Popup

现在，该扩展已正确初始化，可以测试其他组件了。 刷新此页面，或打开一个新选项卡并访问 developer.chrome.com 上的任何页面，打开弹出窗口并单击绿色方块。 ...什么都没发生。

回到 “扩展管理页面”，“错误” 按钮重新出现。 单击它以查看新日志。

``` js
Uncaught ReferenceError: tabs is not defined
```

![popup_error](./assets/popup_error.png)

弹出错误也可以通过检查弹出窗口来查看。

![inspect_popup](./assets/inspect_popup.png)


tabs is undefined 错误，表示扩展程序不知道将内容脚本注入哪里。可以通过调用tabs.query() 方法，然后选择 active tab 来更正此错误。

``` js
 let changeColor = document.getElementById('changeColor');

  chrome.storage.sync.get('color', function(data) {
    changeColor.style.backgroundColor = data.color;
    changeColor.setAttribute('value', data.color);
  });

  changeColor.onclick = function(element) {
    let color = element.target.value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.executeScript(
          tabs[0].id,
          {code: 'document.body.style.backgroundColor = color;'});
    });
  };
```

更新代码，单击右上角的全部清除按钮，然后重新加载扩展。

#### 内容脚本 Content Script

刷新页面，打开弹出窗口，然后单击绿色框。...背景仍然没有变色！回扩展管理页面，...没有错误按钮。可能的罪魁祸首是在网页内运行的内容脚本。

打开扩展在尝试更改的网页的 DevTools 面板。

![content_script_error](./assets/content_script_error.png)

仅运行时错误 console.warning 和console.error 将记录在扩展管理页面上。

要从内容脚本中使用 DevTools，请单击顶部旁边的下拉箭头，然后选择扩展名。

![inspect_content_script](./assets/inspect_content_script.png)

错误显示 color 未定义。扩展不能正确传递变量。更正注入的脚本将 color 变量传递到代码中。

```
  {code: 'document.body.style.backgroundColor = "' + color + '";'});
```

#### 扩展标签 Extension Tabs

可以在网页控制台和扩展管理页面中找到显示为 Tab 的扩展页面的日志，例如[替代页面](https://developer.chrome.com/extensions/extensions/override)和[全页选项](https://developer.chrome.com/extensions/extensions/options#full_page)。


### 监视网络请求

弹出窗口通常会发出所有必需的网络请求，即使是最快的开发人员也来不及打开 DevTools。 要查看这些请求，请从网络面板内部刷新。 它将在不关闭DevTools 面板的情况下重新加载弹出窗口。

![network_reload](./assets/network_reload.gif)

### 声明权限

尽管扩展具有与网页相似的功能，但它们通常需要获得许可才能使用某些功能，例如 cookie，storage  和跨域XMLHttpRequsts。 请参阅权限文章和可用的 Chrome API，以确保扩展程序在其 manifest 中请求正确的权限。

```
{
    "name": "Broken Background Color",
    "version": "1.0",
    "description": "Fix an Extension!",
    "permissions": [
      "activeTab",
      "declarativeContent",
      "storage"
    ],
    "options_page": "options.html",
    "background": {
      "scripts": ["background.js"],
      "persistent": false
    },
    "page_action": {
      "default_popup": "popup.html",
      "default_icon": {
        "16": "images/get_started16.png",
        "32": "images/get_started32.png",
        "48": "images/get_started48.png",
        "128": "images/get_started128.png"
      }
    },
    "icons": {
      "16": "images/get_started16.png",
      "32": "images/get_started32.png",
      "48": "images/get_started48.png",
      "128": "images/get_started128.png"
    },
    "manifest_version": 2
  }
```

### 下一步

有关调试扩展的更多信息，请观看“[开发和调试](http://www.youtube.com/watch?v=IP0nMv_NI1s&feature=PlayList&p=CA101D6A85FE9D4B&index=5)”。 阅读文档，详细了解 [Chrome Devtools](https://developers.google.com/web/tools/chrome-devtools/)。

