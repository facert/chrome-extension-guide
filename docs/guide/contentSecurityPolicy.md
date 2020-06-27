## 内容安全政策（CSP）

为了缓解大量潜在的跨站点脚本问题，Chrome 浏览器的扩展程序整合了内容安全策略（CSP）的一般概念。这引入了一些相当严格的策略，这些策略将使扩展默认情况下更加安全，并为您提供创建和执行规则的能力，以管理扩展和应用程序可以加载和执行的内容类型。

通常，CSP 充当扩展程序加载或执行资源的阻止/允许列表机制。为扩展程序定义合理的策略使您可以仔细考虑扩展程序所需的资源，并要求浏览器确保这些是扩展程序可以访问的唯一资源。这些策略提供了扩展请求所要求的主机权限之外的安全性；它们是附加的保护层，而不是替代品。

在网络上，此类策略是通过 HTTP 头或 meta 元素定义的。在 Chrome 的扩展程序内部，没有合适的机制。而是通过扩展的 manifest.json 文件定义扩展的策略，如下所示：

```
{
  ...,
  "content_security_policy": "[POLICY STRING GOES HERE]"
  ...
}
```

> 有关 CSP 语法的完整详细信息，请查看[内容安全策略规范](http://dvcs.w3.org/hg/content-security-policy/raw-file/tip/csp-specification.dev.html#syntax)和HTML5Rocks上的“[内容安全策略简介](http://www.html5rocks.com/en/tutorials/security/content-security-policy/)”文章。
> 

### 默认策略限制

未定义 manifest_version 的软件包没有默认的内容安全性策略。 选择 manifest_version 2 的用户具有默认的内容安全策略：

```
script-src 'self'; object-src 'self'
```

此策略通过三种方式限制扩展和应用程序来增加安全性：

#### Eval 和相关功能已禁用

如下代码无法正常工作：

```js
alert(eval("foo.bar.baz"));
window.setTimeout("alert('hi')", 10);
window.setInterval("alert('hi')", 10);
new Function("return foo.bar.baz");
```

像这样执行 JavaScript 字符串是常见的 XSS 攻击媒介。相反，您应该编写如下代码：

```js
alert(foo && foo.bar && foo.bar.baz);
window.setTimeout(function() { alert('hi'); }, 10);
window.setInterval(function() { alert('hi'); }, 10);
function() { return foo && foo.bar && foo.bar.baz };

```

#### 内联 JavaScript 将不会执行

内联 JavaScript 将不会执行。此限制禁止内联< script > 块 和内联事件处理程序（例如< button onclick ="..." >)。

第一个限制通过使您无法意外执行由恶意第三方提供的脚本，消除了一大类跨站点脚本攻击。 但是，它确实要求您编写代码时必须将内容和行为区分开来（当然，无论如何都应该这样做，对吗？）。 一个例子可以使这一点更加清楚。您可以尝试将浏览器操作弹出窗口编写为单个 popup.html，其中包含：


``` html

<!doctype html>
<html>
  <head>
    <title>My Awesome Popup!</title>
    <script>
      function awesome() {
        // do something awesome!
      }

      function totallyAwesome() {
        // do something TOTALLY awesome!
      }

      function clickHandler(element) {
        setTimeout("awesome(); totallyAwesome()", 1000);
      }

      function main() {
        // Initialization work goes here.
      }
    </script>
  </head>
  <body onload="main();">
    <button onclick="clickHandler(this)">
      Click for awesomeness!
    </button>
  </body>
</html>

```


为了使代码按您期望的方式进行，需要进行三个更改：

* clickHandler 定义需要移到外部 JavaScript文件中（popup.js将是一个不错的选择）。
* 内联事件处理程序定义必须使用addEventListener 进行重写，并提取到 popup.js 中。

  如果您当前正通过 < body onload ="main()" > 之类的代码执行程序，则可以根据需要考虑通过挂载到文档的 DOMContentLoaded 事件或窗口的 load 事件来替换程序。下面我们将使用前者，因为前者通常会更快地触发。

* setTimeout 调用将需要重写，以避免将字符串“awesome(); totallyAwesome()” 转换为JavaScript 执行。

这些更改可能类似于以下内容：

``` js
function awesome() {
  // Do something awesome!
}

function totallyAwesome() {
  // do something TOTALLY awesome!
}

function awesomeTask() {
  awesome();
  totallyAwesome();
}

function clickHandler(e) {
  setTimeout(awesomeTask, 1000);
}

function main() {
  // Initialization work goes here.
}

// Add event listeners once the DOM has fully loaded by listening for the
// `DOMContentLoaded` event on the document, and adding your listeners to
// specific elements when it triggers.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('button').addEventListener('click', clickHandler);
  main();
});
```

``` html
<!doctype html>
<html>
  <head>
    <title>My Awesome Popup!</title>
    <script src="popup.js"></script>
  </head>
  <body>
    <button>Click for awesomeness!</button>
  </body>
</html>
```

#### 仅加载本地脚本和对象资源

脚本和对象资源只能从扩展包中加载，而不能从整个Web 上加载。这样可以确保您的扩展程序仅执行您专门批准的代码，从而防止活动的网络攻击者恶意重定向您对资源的请求。

与其编写依赖于从外部 CDN 加载jQuery（或任何其他库）的代码，不如考虑将特定版本的 jQuery 包含在扩展包中。 也就是说，代替：

``` html
<!doctype html>
<html>
  <head>
    <title>My Awesome Popup!</title>
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
  </head>
  <body>
    <button>Click for awesomeness!</button>
  </body>
</html>
```

下载文件，将其包含在您的软件包中，然后编写：

``` html
<!doctype html>
<html>
  <head>
    <title>My Awesome Popup!</title>
    <script src="jquery.min.js"></script>
  </head>
  <body>
    <button>Click for awesomeness!</button>
  </body>
</html>
```

### 放宽默认策略

#### 内联脚本

直到 Chrome 45，还没有任何机制可以放宽执行内联 JavaScript 的限制。特别是，设置包含“unsafe-inline” 的脚本策略将无效。

从 Chrome 46 开始，可以通过在策略中指定源代码的 base64 编码的哈希值来允许内联脚本。该哈希必须以使用的哈希算法（sha256，sha384或sha512）作为前缀。有关示例，请参见 [script 元素的哈希用法](http://www.w3.org/TR/2015/CR-CSP2-20150721/#script-src-hash-usage)。

#### 远程脚本
如果您需要一些外部 JavaScript 或对象资源，则可以通过列出允许接受脚本的安全来源来在一定程度上放宽策略。我们要确保加载了扩展权限提升权限的可执行资源与您期望的资源完全相同，并且未被网络攻击者取代。由于中间人攻击既琐碎又无法通过HTTP 进行检测，因此这些来源将不被接受。

当前，开发人员可以使用以下方案允许列表来源：blob，filesystem，https 和 chrome-extension。必须为 https 和 chrome-extension 方案明确指定来源的主机部分。不允许使用通用通配符，例如 https:，https://* 和https:/*.com ；允许使用子域通配符，例如https://*.example.com。  [Public Suffix list](https://publicsuffix.org/list/) 列表中的域也被视为通用顶级域。要从这些域中加载资源，必须明确列出子域。例如，https://*.cloudfront.net 无效，但可以允许列出 https://XXXX.cloudfront.net 和 https://*.XXXX.cloudfront.net。

为了便于开发，可以允许列出通过 HTTP 从本地计算机上的服务器加载的资源。您可以在 http://127.0.0.1 或 http://localhost 的任何端口上允许列表脚本和对象源。

> 通过 HTTP 加载的资源限制仅适用于直接执行的资源。例如，您仍然可以自由地将XMLHTTPRequest 连接到您喜欢的任何来源。默认策略不会以任何方式限制 connect-src 或任何其他 CSP 指令。

一个宽松的策略定义，它允许通过 HTTPS 从example.com 加载脚本资源可能类似于：

```
"content_security_policy": "script-src 'self' https://example.com; object-src 'self'"
```

> 请注意，script-src 和 object-src 均由策略定义。Chrome 不会接受一个策略，即不将这些值限制为（至少）“self”。

使用 Google Analytics是这种策略定义的典型示例。足够常见的是，我们在带有 Google [Analytics 的事件跟踪示例扩展](https://developer.chrome.com/extensions/samples#event-tracking-with-google-analytics)中提供了各种 Analytics 样板，并提供了更详细的[简短教程](https://developer.chrome.com/extensions/tut_analytics)。

#### 执行 JavaScript

可以通过在策略中添加 'unsafe-eval' 来放宽针对 eval() 及其诸如 setTimeout(String），setInterval(String）和 new Function(String) 的相关策略：

```
"content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self'"
```


但是，强烈建议您不要这样做。这些功能是臭名昭著的XSS攻击媒介。


### 收紧默认策略

当然，您可以在扩展允许的任何范围内收紧此策略，以牺牲便利为代价提高安全性。指定扩展只能从其自己的包中加载任何类型的资源（图像等），例如，使用 default-src 'self' 的策略。 [Mappy示例](https://developer.chrome.com/extensions/samples#mappy) 扩展是已被锁定在默认值之上和之外的扩展的一个很好的例子。

### 内容脚本
我们一直在讨论的策略适用于扩展程序的后台页面和事件页面。策略如何应用于扩展的内容脚本更加复杂。

内容脚本通常不受扩展程序 CSP 的约束。由于内容脚本不是 HTML，因此主要影响是，即使扩展程序的CSP 未指定 unsafe-eval，它们也可以使用eval，尽管不建议这样做。此外，页面的 CSP 不适用于内容脚本。内容脚本创建并放入其运行页面的DOM 中的 < script > 标签更加复杂。我们将这些称为 DOM注 入脚本。

DOM 注入脚本将在您注入页面后立即执行，想象一个包含以下代码的内容脚本作为一个简单示例：

```
document.write("<script>alert(1);</script>");
```
    
此内容脚本将在 document.write() 上立即 alert。请注意，无论页面可以指定什么策略，此操作都会执行。

但是，该行为在该 DOM 注入脚本内以及对于任何在注入后不会立即执行的脚本中都变得更加复杂。想象一下，我们的扩展程序正在一个页面上运行，该页面提供了自己的 CSP，该 CSP 指定 script-src 'self' 。现在想象一下内容脚本执行以下代码：

```
document.write("<button onclick='alert(1);'>click me</button>'");
```
    
如果用户单击该按钮，将不会执行 onclick 脚本。这是因为在单击事件发生之前，脚本不会立即执行并且不会解释代码，因此不将其视为内容脚本的一部分，页面（而非扩展）的CSP会限制其行为。并且由于该 CSP 未指定 unsafe-inline，所以内联事件处理程序被阻止。

在这种情况下，实现所需行为的正确方法是从内容脚本中将 onclick 处理程序添加为函数，如下所示：

``` js
 document.write("<button id='mybutton'>click me</button>'");
    var button = document.getElementById('mybutton');
    button.onclick = function() {
      alert(1);
    };
```
  
如果内容脚本执行以下操作，则会出现另一个类似的问题：

``` js
 var script = document.createElement('script');
script.innerHTML = 'alert(1);'
    document.getElementById('body').appendChild(script);
```

在这种情况下，脚本将执行并 alert。然而。请看这个例子：
   
```js
 var script = document.createElement('script');
    script.innerHTML = 'eval("alert(1);")';
    document.getElementById('body').appendChild(script);
  
```   

当执行初始脚本时，对 eval 的调用将被阻止。也就是说，虽然允许执行初始脚本，但脚本中的行为将由页面的 CSP 进行控制。

因此，根据您在扩展中编写 DOM 注入脚本的方式，对页面 CSP 的更改可能会影响扩展的行为。由于内容脚本不受页面 CSP 的影响，因此这是将扩展功能尽可能多地放入内容脚本而不是 DOM 注入脚本的重要原因。

-------

关注 微信公众号「**程序化思维**」 获取最新 Chrome 插件开发教程。

![mp_wechat](/mp1.png)

