## 本机消息

扩展程序和应用程序可以使用与其他消息传递 API 相似的 API 与本机应用程序交换消息。支持此功能的本机应用程序必须注册知道如何与扩展进行通信的本机消息传递主机。 Chrome 会在一个单独的进程中启动主机，并使用标准输入和标准输出流与其进行通信。

### 本机消息传递主机

为了注册本机消息传递主机，应用程序必须安装 manifest 文件，该 manifest 文件定义了本机消息传递主机配置。 以下是 manifest 文件的示例：

```
{
  "name": "com.my_company.my_application",
  "description": "My Application",
  "path": "C:\\Program Files\\My Application\\chrome_native_messaging_host.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://knldjmfmopnpolahpmmgbagdohdnhkik/"
  ]
}
```

本机消息传递主机 manifest 文件必须是有效的JSON，并且包含以下字段：


| Name | Description |
| --- | --- |
| name | 本机消息传递主机的名称。客户端将此字符串传递给 runtime.connectNative 或runtime.sendNativeMessage。此名称只能包含小写字母数字字符，下划线和点。名称不能以点开头或结尾，并且点后不能再有另一个点。 |
| description | 简短的应用程序描述。 |
| path | 本地消息传递主机二进制文件的路径。在 Linux 和 OSX 上，路径必须是绝对路径。在Windows 上，它可以是相对于 manifest 文件所在的目录。主机进程以当前目录设置为包含主机二进制文件的目录启动。例如，如果此参数设置为 C:\ Application\nm_host.exe，则它将从当前目录C:\Application\ 启动。 |
| type | 用于与本机消息传递主机进行通信的接口的类型。当前，此参数只有一个可能的值：stdio。这表明 Chrome 应该使用 stdin 和stdout 与主机进行通信。 |
| allowed_origins | 应该有权访问本机消息传递主机的扩展列表。不允许使用通配符，例如chrome-extension://\*/\* |

##### 本机消息传递主机位置

manifest 文件的位置取决于平台。

在Windows上，manifest 文件可以位于文件系统中的任何位置。 应用程序安装程序必须创建注册表项 HKEY_LOCAL_MACHINE\SOFTWARE\Google \Chrome\NativeMessagingHosts\com.my_company.my_application 或HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.my_company.my_application，并将该项的默认值设置为完整路径到 manifest 文件。 例如，使用以下命令：

```
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.my_company.my_application" /ve /t REG_SZ /d "C:\path\to\nmh-manifest.json" /f
```
或者使用 .reg 文件

```
Windows Registry Editor Version 5.00
[HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.my_company.my_application]
@="C:\\path\\to\\nmh-manifest.json"
```

当 Chrome 查找本机消息传递主机时，首先查询 32 位注册表，然后查询 64 位注册表。
在 OS X 和 Linux 上，本机消息传递主机 manifest 文件的位置因浏览器（Google Chrome 或 Chromium）而异。 在固定位置查找系统级本机消息传递主机，而在用户配置文件目录中名为 NativeMessagingHosts 的子目录中查找用户级的本机消息传递主机。

* OS X (系统级)
    Google Chrome: /Library/Google/Chrome/NativeMessagingHosts/com.my_company.my_application.json
Chromium: /Library/Application Support/Chromium/NativeMessagingHosts/com.my_company.my_application.json

* OS X (用户级, 默认路径)
    Google Chrome: ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.my_company.my_application.json
Chromium: ~/Library/Application Support/Chromium/NativeMessagingHosts/com.my_company.my_application.json 

* Linux（系统级）
    Google Chrome: /etc/opt/chrome/native-messaging-hosts/com.my_company.my_application.json
Chromium: /etc/chromium/native-messaging-hosts/com.my_company.my_application.json

* Linux（用户级，默认路径）
    Google Chrome: ~/.config/google-chrome/NativeMessagingHosts/com.my_company.my_application.json
Chromium: ~/.config/chromium/NativeMessagingHosts/com.my_company.my_application.json


##### 本机消息传递协议

Chrome 会在一个单独的进程中启动每个本机消息传递主机，并使用标准输入（stdin）和标准输出（stdout）与之通信。使用相同的格式双向发送消息：每条消息均使用 JSON（UTF-8编码）进行序列化，前缀加本机字节序 32 位消息长度。来自本地消息传递主机的单个消息的最大大小为 1 MB，主要是为了防止Chrome 出现异常的本地应用程序行为。发送到本机消息传递主机的消息的最大为 4 GB。

本地消息传递主机的第一个参数是调用方的来源，通常是 chrome-extension://[允许的extension ID]。当在本机消息传递主机 manifest 的 allowed_origins 键中指定了多个扩展名时，这使本机消息传递主机可以标识消息的来源。
警告：在 Windows 中，在 Chrome 54 及更低版本中，origin 作为第二个参数而不是第一个参数传递。

使用 runtime.connectNative 创建消息传递端口后，Chrome 会启动本机消息传递宿主进程并保持其运行状态，直到端口被关掉为止。另一方面，当使用runtime.sendNativeMessage 发送消息而未创建消息传递端口时，Chrome 会为每条消息启动一个新的本机消息传递宿主进程。在那种情况下，由主机进程生成的第一条消息将作为对原始请求的响应进行处理，即 Chrome 会将其传递给调用 runtime.sendNativeMessage 时指定的响应回调。在这种情况下，将忽略本机消息传递主机生成的所有其他消息。

在 Windows 上，还向本机消息传递主机传递了带有调用 chrome 本机窗口的句柄的命令行参数：--parent-window=\<decimal handle value>。这样，本机消息传递主机可以创建正确获取焦点的本机 UI 窗口。

### 连接到本机应用程序

与本机应用程序之间收发消息与跨扩展消息收发非常相似。主要区别在于，使用runtime.connectNative 代替了runtime.connect，并且使用runtime.sendNativeMessage 代替 runtime.sendMessage。
仅当扩展的 manifest 文件中声明了 “nativeMessaging” 权限时，才能使用这些方法。

下面的示例创建一个 runtime.Port 对象，该对象连接到本地消息传递主机com.my_company.my_application，开始监听来自该端口的消息并发送一条消息：

``` js
var port = chrome.runtime.connectNative('com.my_company.my_application');
port.onMessage.addListener(function(msg) {
  console.log("Received" + msg);
});
port.onDisconnect.addListener(function() {
  console.log("Disconnected");
});
port.postMessage({ text: "Hello, my_application" });
```

runtime.sendNativeMessage 可用于将消息发送到本机应用程序而无需创建端口，例如：


``` js
chrome.runtime.sendNativeMessage('com.my_company.my_application',
  { text: "Hello" },
  function(response) {
    console.log("Received " + response);
  });
```

### 调试本机消息传递

当本机消息传递主机无法启动，无法写入 stderr 或违反通信协议时，输出将写入 Chrome 的错误日志。在 Linux 和 OS X 上，可以通过从命令行启动Chrome 并在终端中查看其输出来轻松访问此日志。在 Windows 上，使用 --enable-logging 。详见：[How to enable logging](https://www.chromium.org/for-testers/enable-logging) 。

以下是解决问题的一些错误和提示：

* 无法启动本机消息传递主机。

    检查您是否具有执行该文件的足够权限。
    
* 指定的本机消息传递主机名无效。
    检查名称中是否包含无效字符。仅允许使用小写字母数字字符，下划线和点。名称不能以点开头或结尾，并且点后不能再有另一个点。
* 本机主机已退出。
    Chrome 读取邮件之前，到本机邮件传递主机的管道已断开。这很可能是从您的本机消息传递主机启动的。
* 找不到指定的本机消息传递主机。
    扩展名和清单文件中的名称拼写正确吗？
    manifest 是否放在正确的目录中并具有正确的名称？请参阅本机消息传递主机位置以获取期望的格式。
    manifes 文件的格式正确吗？特别是JSON语法是否正确，并且这些值是否与本机消息传递主机清单的定义匹配？
    路径中指定的文件是否存在？在Windows上，路径可能是相对的，但在OS X和Linux上，路径必须是绝对的。
* 本机消息传递主机主机名未注册。（仅限Windows）
    在Windows注册表中找不到本机消息传递主机。使用 regedit 仔细检查密钥是否确实创建，并且是否与本机消息传递主机位置中记录的所需格式匹配。
* 禁止访问指定的本机消息传递主机。
    扩展名的来源是否在allowed_origins中列出？
* 与本机消息传递主机通信时出错。
    
    这是一个非常常见的错误，表示在本机消息传递主机中通信协议的实现不正确。
    * 确保 stdout 中的所有输出都遵循本机消息传递协议。如果要出于调试目的打印一些数据，请写入 stderr。
    * 确保32位消息长度采用平台的本机整数格式（little-endian / big-endian）。
    * 邮件长度不得超过1024 * 1024。
    * 消息大小必须等于消息中的字节数。这可能与字符串的“长度”不同，因为字符可能由多个字节表示。
    * 仅Windows：确保程序的 I/O模式设置为 O_BINARY。默认情况下，I/O模式为 O_TEXT，它将用换行符（\n=0A）替换为 Windows 样式的行尾（\r\n=0D0A）破坏消息格式。可以使用 __setmode 设置 I/O 模式。


### 例子
[examples/api/nativeMessaging](https://chromium.googlesource.com/chromium/src/+/master/chrome/common/extensions/docs/examples/api/nativeMessaging) 目录包含一个示例应用程序，该应用程序使用本机消息传递与用作本机消息传递主机的Python 脚本进行通信。示例主机的目录还包含用于安装/删除本机消息传递主机的脚本。

要尝试该示例，请首先下载并解压缩[示例应用程序](https://developer.chrome.com/extensions/examples/api/nativeMessaging/app.zip)和[示例主机](https://developer.chrome.com/extensions/examples/api/nativeMessaging/host.zip)。运行 install_host.bat（Windows）或install_host.sh（Linux/OS X）以安装本机消息传递主机。然后加载该应用程序并与该应用程序进行交互。完成后，运行 uninstall_host.bat 或uninstall_host.sh 取消注册本机消息传递主机。

-------

关注 微信公众号「**程序化思维**」 获取最新 Chrome 插件开发教程。

![mp_wechat](/mp1.png)


