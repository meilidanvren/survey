把你提供的三个视频放到这个文件夹，并按下面的名字命名：

  video-1.mp4      对应 verbal（言语型）
  video-2.mp4      对应 numeric（数理型）
  video-3.mp4      对应 logical（逻辑型）

文件名故意用中性编号，避免被试从地址栏或开发者工具里猜到自己的类型。
如果文件名不一样，打开 assets/js/bankA.js，改最下面的 videos 配置即可。

建议格式：
- MP4（H.264 视频 + AAC 音频）
- 单个文件尽量控制在 20MB 以内，手机流量打开更快
- GitHub 单个文件上限 100MB，超过会被拒绝

视频还没准备好时不影响测试：页面会提示“视频文件还没有配置”，
在 config.js 里把 flow.videoFallback 设为 'allow' 就可以跳过继续。
正式收数据前记得把视频放进来，并考虑把它改成 'block'。
