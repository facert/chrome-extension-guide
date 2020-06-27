## 什么是扩展

扩展是可定制化浏览体验的小程序，它们使用户可以根据个人需要或者偏好定制 Chrome 的功能和行为。它们基于 Web 技术（例如 HTML，JavaScript 和 CSS）构建。

扩展必须满足狭义定义且易于理解的[单一目的](https://developer.chrome.com/extensions/single_purpose)（译者注：功能简单易懂化）。一个扩展可以包括多个组件和一系列功能，只要所有的内容都有助于实现共同的目标。

用户交互界面应尽量小且有意图。他们的范围从简单的图标，如右侧显示的 [Google Mail Checker 扩展](https://developer.chrome.com/samples#google-mail-checker)， 到[覆盖](https://developer.chrome.com/extensions/override)整个页面。![gmail-smal](./assets/gmail-small.png)

扩展文件压缩到单个 .crx 包中，用户可以下载并安装。这意味着扩展与普通的 Web 应用程序不同，它不依赖于 Web 上的内容。

扩展程序通过 Chrome [开发者管理后台](https://chrome.google.com/webstore/developer/dashboard) 分发，并发布到 [Chrome 网上应用商店](http://chrome.google.com/webstore)。有关更多信息，请参阅[商店开发人员文档](https://developer.chrome.com/webstore)。

### Hello 扩展

通过这个快速的 Hello 扩展示例，让大家对扩展有一点了解。 首先创建一个新目录来放置扩展的文件，或者从[示例页面](https://developer.chrome.com/extensions/samples#search:hello)下载它们。

接下来，添加一个名为 manifest.json 的文件，并包含以下代码：

```
{
    "name": "Hello Extensions",
    "description" : "Base Level Extension",
    "version": "1.0",
    "manifest_version": 2
  }  
  
```

每个扩展都需要一个 mainfest，尽管大多数扩展的 mainfest 没有多大作用。为了快速入门，该扩展程序在 [browser_action](./browser_action.md) 字段下声明了一个弹出文件和图标：

```
  {
    "name": "Hello Extensions",
    "description" : "Base Level Extension",
    "version": "1.0",
    "manifest_version": 2,
    "browser_action": {
      "default_popup": "hello.html",
      "default_icon": "hello_extensions.png"
    }
  }
```

下载 [hello_extensions.png](.assets/hello_extensions.png) 然后创建一个文件名：hello.html

```
 <html>
    <body>
      <h1>Hello Extensions</h1>
    </body>
  </html>

```

单击该图标后，扩展会显示 hello.html。 下一步是在 manifest.json 中包含一个启用键盘快捷键的命令。 此步骤很有趣，但不是必需的：

```
 {
    "name": "Hello Extensions",
    "description" : "Base Level Extension",
    "version": "1.0",
    "manifest_version": 2,
    "browser_action": {
      "default_popup": "hello.html",
      "default_icon": "hello_extensions.png"
    },
    "commands": {
      "_execute_browser_action": {
        "suggested_key": {
          "default": "Ctrl+Shift+F",
          "mac": "MacCtrl+Shift+F"
        },
        "description": "Opens hello.html"
      }
    }
  
  }
```

最后一步是在本地计算机上安装扩展。

1. 在浏览器地址栏中输入 chrome://extensions。 你还可以通过点击功能框右上角的 Chrome 菜单，将鼠标悬停在 **更多工具** 上，然后选择 **扩展程序** ，以访问此页面。
2. 选中**开发人员模式**旁边的框。
3. 单击**加载解压缩的扩展名**，然后选择**Hello扩展**的目录。


恭喜你！ 现在，你可以通过单击 hello_world.png 图标或按键盘上的 **Ctrl+Shift+F** 来使用基于弹出窗口的扩展。



-------

关注 微信公众号「**程序化思维**」 获取最新 Chrome 插件开发教程。

![mp_wechat](/mp1.png)


