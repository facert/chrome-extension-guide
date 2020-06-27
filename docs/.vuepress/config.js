module.exports = {
  title: 'Chrome 扩展(插件) 开发教程',
  description: 'Chrome 扩展(插件) 开发教程 最新 Chrome 扩展官方文档教程中文版',
  themeConfig: {
    nav: [
      { text: '官方中文版教程', link: '/guide/what-is-extensions.html' },
      { text: 'Github', link: 'https://github.com/facert', target:'_blank', rel:'' },
    ],
    //sidebar: 'auto',
    sidebar: [
     {
	title: '官方教程',
        path: '/',
        children: [
     '/guide/what-is-extensions',
     '/guide/getstarted',
     '/guide/overview',
     '/guide/manifest',
     '/guide/background_content',
     '/guide/user_interface',
     '/guide/content_scripts',
     '/guide/permission_warnings',
     '/guide/options',
     '/guide/devguide',
     '/guide/performance',
     '/guide/user_privacy',
     '/guide/tut_debugging',
     '/guide/tut_oauth',
     '/guide/a11y',
     '/guide/contentSecurityPolicy',
     '/guide/xhr',
     '/guide/messaging',
     '/guide/nativeMessaging',
     '/guide/match_patterns',
    ]}],
    sidebarDepth: 2
  }
}
