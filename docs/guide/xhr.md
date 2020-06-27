## 跨域XMLHttpRequest

常规网页可以使用 [XMLHttpRequest](https://www.w3.org/TR/XMLHttpRequest/) 对象从远程服务器发送和接收数据，但是它们受 [same origin](https://en.wikipedia.org/wiki/Same_origin_policy) 策略的限制。内容脚本已将其注入其中的 Web origin 发起请求，因此，内容脚本也应遵循相同的 same origin 策略。 （[自Chrome 73 以来，内容脚本就一直受 CORB 的限制](https://www.chromium.org/Home/chromium-security/extension-content-script-fetches)，而 自Chrome 83以来，内容脚本就受 CORS 的限制。）扩展源的限制不是很有效-只要在扩展的背景页面或前台选项卡中执行脚本，就可以与源之外的远程服务器通信。只要该扩展请求了跨域权限。

### 扩展 origin

每个运行的扩展都存在于其自己的安全 origin 中。在不请求额外权限的情况下，扩展可以使用XMLHttpRequest 来获取其安装中的资源。例如，如果扩展名在 config_resources 文件夹中包含一个名为 config.json 的 JSON 配置文件，则该扩展名可以按以下方式检索文件的内容：

``` js
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = handleStateChange; // Implemented elsewhere.
xhr.open("GET", chrome.extension.getURL('/config_resources/config.json'), true);
xhr.send();
```

如果扩展程序尝试使用其自身以外的安全来源（例如https://www.google.com），则除非扩展程序已请求适当的跨域许可，否则浏览器将不会允许。

### 请求跨域权限

通过将主机或主机匹配模式（或两者）添加到 manifest 文件的 permissions 部分，该扩展可以请求访问其 origin 之外的远程服务器。

```
{
  "name": "My extension",
  ...
  "permissions": [
    "https://www.google.com/"
  ],
  ...
}
```

跨域权限的值可以是完全限定的主机名，如下所示：

* https://www.google.com/
* https://www.gmail.com/


或者可以是匹配模式，如下所示：

* https://*.google.com/
* https://*/



匹配模式 “https://*/” 允许 HTTPS 访问所有可访问的域。请注意，此处的匹配模式类似于内容脚本匹配模式，但是主机后面的所有路径信息都将被忽略。

还要注意，访问权限是由 host 和 scheme 授予的。 如果扩展要对给定主机或一组主机同时进行安全和非安全的 HTTP 访问，则它必须分别声明权限：

```
"permissions": [
  "http://www.google.com/",
  "https://www.google.com/"
]
```

### 安全注意事项

##### 避免跨站脚本攻击

当使用通过 XMLHttpRequest 检索的资源时，您的后台页面应注意不要成为跨站脚本的牺牲品。具体来说，请避免使用危险的API，例如：

``` js
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
``` js
var xhr = new XMLHttpRequest();
xhr.open("GET", "https://api.example.com/data.json", true);
xhr.onreadystatechange = function() {
  if (xhr.readyState == 4) {
    // WARNING! Might be injecting a malicious script!
    document.getElementById("resp").innerHTML = xhr.responseText;
    ...
  }
}
xhr.send();
```

相反，请选择不运行脚本的更安全的API：


``` js
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

``` js
var xhr = new XMLHttpRequest();
xhr.open("GET", "https://api.example.com/data.json", true);
xhr.onreadystatechange = function() {
  if (xhr.readyState == 4) {
    // innerText does not let the attacker inject HTML elements.
    document.getElementById("resp").innerText = xhr.responseText;
  }
}
xhr.send();

```

##### 限制内容脚本对跨域请求的访问

当内容脚本执行跨域请求时，请小心防范可能试图假冒内容脚本的恶意网页。特别是，不允许内容脚本请求任意 URL。

考虑一个示例，其中扩展执行跨域请求以使内容脚本发现商品价格。 一种（不安全的）方法是让内容脚本指定要由后台页面获取的确切资源。

``` js
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.contentScriptQuery == 'fetchUrl') {
        // WARNING: SECURITY PROBLEM - a malicious web page may abuse
        // the message handler to get access to arbitrary cross-origin
        // resources.
        fetch(request.url)
            .then(response => response.text())
            .then(text => sendResponse(text))
            .catch(error => ...)
        return true;  // Will respond asynchronously.
      }
    });
```

``` js
chrome.runtime.sendMessage(
    {contentScriptQuery: 'fetchUrl',
     url: 'https://another-site.com/price-query?itemId=' +
              encodeURIComponent(request.itemId)},
    response => parsePrice(response.text()));
```

在上面的方法中，内容脚本可以要求扩展请求可以访问的任意 URL。恶意网页可能伪造此类消息并欺骗该扩展以提供对跨域资源的访问。

相反，设计消息处理程序，以限制可以获取的资源。 下面，内容脚本仅提供 itemId，而不提供完整的URL。

``` js
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.contentScriptQuery == 'queryPrice') {
        var url = 'https://another-site.com/price-query?itemId=' +
            encodeURIComponent(request.itemId);
        fetch(url)
            .then(response => response.text())
            .then(text => parsePrice(text))
            .then(price => sendResponse(price))
            .catch(error => ...)
        return true;  // Will respond asynchronously.
      }
    });
```

``` js
chrome.runtime.sendMessage(
    {contentScriptQuery: 'queryPrice', itemId: 12345},
    price => ...);
```

##### 优先使用HTTPS

此外，请特别注意通过 HTTP 检索资源。 如果您的扩展程序在恶意网络上使用，则网络攻击者（又名“中间人”）可能会修改响应信息，并有可能攻击您的扩展程序。请尽可能使用HTTPS。

##### 调整内容安全策略

如果您通过在 manifest 添加content_security_policy 属性来修改应用或扩展程序的默认内容安全策略，则需要确保允许您要连接的任何主机。尽管默认策略不限制与主机的连接，但是在显式添加 connect-src 或 default-src 指令时要小心。


