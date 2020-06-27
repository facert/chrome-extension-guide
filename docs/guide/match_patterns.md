## 匹配模式

[主机权限](https://developer.chrome.com/extensions/declare_permissions#host-permissions)和[内容脚本匹配](./content_scripts.md) 是基于匹配模式定义的一组 URL。匹配模式本质上是一个以允许的 schema（http，https，file 或ftp 开头）的URL，并且可以包含 “*” 字符。特殊模式 < all_urls > 匹配以允许的 schema 开头的任何 URL。 每个模式包含 3 个部分：

* schema - 例如，http 或file 或 *

> 注意：对文件 URL 的访问不是自动的。用户必须访问扩展管理页面，并选择对每个请求扩展的文件进行文件访问。

* host -例如，www.google.com 或*.google.com 或 *； 如果 schema 是 file，则没有 host 部分
* path-例如，/*，/foo* 或 /foo/bar。该路径必须在 host permission 中，但始终被视为 /*。

基本语法如下：

```
<url-pattern> := <scheme>://<host><path>
<scheme> := '*' | 'http' | 'https' | 'file' | 'ftp'
<host> := '*' | '*.' <any char except '/' and '*'>+
<path> := '/' <any chars>
```

" * " 的含义取决于它是在 schema, host 还是 path 部分中。如果 schema 为 " * "，则它匹配 http 或 https，而不匹配 file 或 ftp。 如果 host 为" * "，则它匹配任何主机。如果 host 是 "*.hostname"，则它匹配指定的 host 或任何子域。在 path 部分，每个 " * " 匹配 0个或多个字符。 下表显示了一些有效的模式。


| Pattern | What it does|  Examples of matching URLs |
| --- | --- | --- |
| http://\*/* | 匹配使用 http schema 的所有 URL |  http://www.google.com/   http://example.org/foo/bar.html |
| http://\*/foo* |匹配任何在主机上使用 http schema 的 URL，并且路径以 /foo开头 |  http://example.com/foo/bar.html http://www.google.com/foo |
| https://\*.google.com/foo*bar |匹配 google.com主机上的任何使用 https schema 的 URL（例如 www.google.com，docs.google.com或 google.com），路径以 /foo开头并以 bar 结尾 |  https://www.google.com/foo/baz/bar https://docs.google.com/foobar |
| http://example.org/foo/bar.html | 匹配指定的URL |http://example.org/foo/bar.html|
| file:///foo\* | 匹配路径以 /foo 开头的任何本地文件 |  file:///foo/bar.html file:///foo |
| http://127.0.0.1/\* | 匹配使用 http schema 且位于主机127.0.0.1上的 URL |  http://127.0.0.1/ http://127.0.0.1/foo/bar.html |
| \*://mail.google.com/\* | 匹配以 http://mail.google.com 或https://mail.google.com 开头的 URL。|  http://mail.google.com/foo/baz/bar https://mail.google.com/foobar |
| < all_urls > | 匹配使用允许 schema 的任何 URL。 |  http://example.org/foo/bar.html file:///bar/baz.html |

以下是无效模式匹配的一些示例：


| Bad pattern |  Why it's bad |
| --- | --- |
| http://www.google.com |  没有 path |
| http://\*foo/bar |  主机中的 “\*”后面只能有一个 “.” 或 '/' |
| http://foo.*.bar/baz |  如果主机中有 “\*”，则必须为第一个字符 |
| http:/bar |缺少 schema 分隔符（“/”应为 “//”） |
| foo://\* |  无效的 schema |


