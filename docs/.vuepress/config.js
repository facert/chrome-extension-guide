module.exports = {
  title: 'Chrome 扩展(插件) 开发教程',
  description: 'Chrome 扩展(插件) 开发教程 最新 Chrome 扩展官方文档教程中文版',
  head: [
    [
      "script",
      {
        "data-ad-client": "ca-pub-6048304318304307",
        async: true,
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
      }
    ]
  ],
  plugins: [
    [
      '@vuepress/google-analytics',
      {
        'ga': 'UA-165277587-3' // UA-00000000-0
      }
    ]
  ],
  themeConfig: {
    nav: [
      { text: '官方中文版教程', link: '/guide/what-is-extensions.html' },
      { text: 'Blog文章', link: '/blog/pornhub-video-download-extension.html' },
      { text: 'Github', link: 'https://github.com/facert/chrome-extension-guide', target:'_blank', rel:'' },
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
