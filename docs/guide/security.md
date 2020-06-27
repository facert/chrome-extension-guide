## 保持安全

扩展程序可以访问浏览器中的特殊特权，从而使它们成为攻击者的目标。如果某个扩展遭到破坏，则该扩展的所有用户都容易受到恶意和有害入侵的攻击。通过采用这些做法，可以确保扩展的安全性及其用户的安全。

### 保护开发者帐户

扩展代码通过 Google 帐户上传和更新。如果开发人员的帐户遭到入侵，攻击者可能会将恶意代码直接推送给所有用户。通过专门创建开发人员帐户并启用[二次身份验证](https://support.google.com/accounts/answer/185839?hl=en)（最好使用安全密钥）来保护这些帐户。

#### 保持组的可选性

如果使用组发布，则将组限制在受信任的开发人员中。不接受来自陌生人的会员要求。

### 永远不要使用 HTTP

请求或发送数据时，避免使用 HTTP 连接。假定任何 HTTP 连接都具有窃听者或包含修改。始终应首选 HTTPS，因为它具有内置的安全性，可以绕过大多数[中间人攻击](https://www.owasp.org/index.php/Man-in-the-middle_attack)。


### 要求最低权限

Chrome 浏览器将扩展程序的访问权限限制为 manifest 中已明确请求的权限。扩展应仅通过注册其依赖的 API 和网站来最大程度地减少其权限。 随意的代码应保持最小化。

限制扩展权限会限制潜在攻击者可以利用的内容。

#### 跨域XMLHttpRequest

扩展只能使用 XMLHttpRequest 从自身和权限中指定的域中获取资源。

```
 {
    "name": "Very Secure Extension",
    "version": "1.0",
    "description": "Example of a Secure Extension",
    "permissions": [
      "https://developer.chrome.com/*",
      "https://*.google.com/"
    ],
    "manifest_version": 2
  }
```

此扩展程序通过在权限中列出 “https://developer.chrome.com/* ” 和 “https：//*google.com/” 来请求访问developer.chrome.com 和Google 子域上的任何内容。如果扩展名遭到入侵，它仍然仅具有与符合匹配模式的网站进行交互的权限。攻击者将无法访问“https://user_bank_info.com” 或与“https://malicious_website.com” 进行交互。

### 限制 manifest 字段

在 manifest 中包含不必要的注册会产生漏洞，并使扩展更可见。将 manifest 字段限制为扩展所依赖的字段并进行特定的字段注册。

#### Externally Connectable

使用 [externally_connectable](https://developer.chrome.com/manifest/externally_connectable) 字段来声明该扩展程序将与之交换信息的外部扩展程序和网页。 限制扩展与外部连接的来源。

```
 {
    "name": "Super Safe Extension",
    "externally_connectable": {
      "ids": [
        "iamafriendlyextensionhereisdatas"
      ],
      "matches": [
        "https://developer.chrome.com/*",
        "https://*google.com/"
      ],
      "accepts_tls_channel_id": false
    },
    ...
  }
```

#### Web Accessible Resources

通过在 web_accessible_resources 下使资源可通过 Web 访问，将使网站和攻击者可以检测到扩展。

```
{
  ...
  "web_accessible_resources": [
    "images/*.png",
    "style/secure_extension.css",
    "script/secure_extension.js"
  ],
  ...
}
```

可用的 Web 访问资源越多，潜在的攻击者就可以利用更多的途径。将这些文件减至最少。

### 包括明确的内容安全政策

在 manifest 中包含扩展的内容安全性策略，以防止跨站脚本攻击。如果扩展仅从自身加载资源，请注册以下内容：

```
  {
    "name": "Very Secure Extension",
    "version": "1.0",
    "description": "Example of a Secure Extension",
    "content_security_policy": "default-src 'self'"
    "manifest_version": 2
  }

```

如果扩展需要包括来自特定主机的脚本，则可以包括以下脚本：

```
 {
    "name": "Very Secure Extension",
    "version": "1.0",
    "description": "Example of a Secure Extension",
    "content_security_policy": "default-src 'self' https://extension.resource.com"
    "manifest_version": 2
  }
```

### 避免使用可执行 API

可执行代码的 API 应该替换为更安全的方法。

#### document.write() 和 innerHTML

虽然使用 document.write() 和 innerHTML 动态创建 HTML 元素可能更简单，但它会留下扩展以及该扩展名所依赖的网页，从而使攻击者可以插入恶意脚本。应该手动创建 DOM 节点，并使用innerText 插入动态内容。

```
function constructDOM() {
    let newTitle = document.createElement('h1');
    newTitle.innerText = host;
    document.appendChild(newTitle);
  }
```

#### eval()

尽可能避免使用 eval() 来防止攻击，因为eval() 会执行传递给它的任何代码，这可能是恶意的。

```
 var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://api.example.com/data.json", true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      // WARNING! Might be evaluating an evil script!
      var resp = eval("(" + xhr.responseText + ")");
      ...
    }
  }
  xhr.send();
```

取而代之的是，更安全，更快的方法，例如JSON.parse()

```
 var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://api.example.com/data.json", true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      // JSON.parse does not evaluate the attacker's scripts.
      var resp = JSON.parse(xhr.responseText);
    }
  }
  xhr.send();
```

### 谨慎使用内容脚本

尽管内容脚本生活在一个孤立的世界中，但它们无法免受攻击：

* 内容脚本是扩展的唯一可以直接与网页交互的部分。因此，恶意网页可能会操纵内容脚本所依赖的 DOM 部分，或者利用 Web 标准行为，例如[命名项](https://html.spec.whatwg.org/#dom-window-nameditem)。
* 为了与网页的 DOM 交互，内容脚本需要在与网页相同的渲染器进程中执行。这使得内容脚本容易受到通过旁通道攻击（例如 [Spectre](https://spectreattack.com/)）数据泄漏的威胁，并且如果恶意网页感染了渲染器进程，则很容易被攻击者接管。

敏感的任务应在专用进程中执行，例如扩展程序的后台脚本。避免意外地将扩展特权暴露给内容脚本：

* 假设来自内容脚本的消息可能是攻击者制作的（例如，验证并清除所有输入并保护您的脚本免受跨站脚本攻击）。
* 假设发送到内容脚本的任何数据都可能泄漏到网页上。请勿将敏感数据（例如扩展中的密钥，其他 Web 来源的数据，浏览历史记录）发送到内容脚本。
* 限制可以由内容脚本触发的特权操作的范围。不允许内容脚本触发[对任意 URL 的请求](https://developer.chrome.com/xhr#xhr-vs-content-scripts)或将任意参数传递给扩展 API（例如，不允许将任意 URL传递给 fetch 或 chrome.tabs.create API）。


### 注册并清理输入

通过将监听器限制为扩展所期望的内容，验证传入数据的发送方并清除所有输入，来保护扩展免受恶意脚本的攻击。

如果扩展期望从外部网站或扩展进行通信，则仅应注册 [runtime.onRequestExternal](https://developer.chrome.com/runtime#event-onMessageExternal)。 始终验证 sender 是否匹配受信任的来源。

```
  // The ID of an external extension
  const kFriendlyExtensionId = "iamafriendlyextensionhereisdatas";

  chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
      if (sender.id === kFriendlyExtensionId)
        doSomething();
  });
```

即使是扩展本身通过 runtime.onMessage 事件发出的消息，也应进行仔细检查，以确保MessageSender 并非来自受感染的内容脚本。

```
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.allowedAction)
      console.log("This is an allowed action.");
  });
```

通过清除用户输入和输出数据（甚至来自扩展本身和批准的源），防止扩展执行攻击者的脚本。 避免使用可执行的 API。

```
function sanitizeInput(input) {
      return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }
```

-------

关注 微信公众号「**程序化思维**」 获取最新 Chrome 插件开发教程。

![mp_wechat](/mp1.png)





