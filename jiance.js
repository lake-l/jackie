async function test() {
  let region = "未知";
  try {
    const response = await fetch("https://www.youtube.com/red", {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
      },
      method: "GET"
    });
    
    // YouTube 会根据 IP 重定向到对应地区的 Premium 页面
    // 例如：https://www.youtube.com/premium/hk
    const url = response.url;
    const match = url.match(/\/premium\/([a-z]{2})/);
    
    if (match) {
      region = match[1].toUpperCase();
    } else if (response.status === 200) {
      region = "US (默认)";
    }
    
    return {
      title: "YouTube 解锁状态",
      content: `检测地区: ${region} \n节点连接: 正常`,
      icon: "play.rectangle.fill",
      "icon-color": "#FF0000"
    };
  } catch (e) {
    return {
      title: "YouTube 检测失败",
      content: "无法访问 YouTube",
      icon: "exclamationmark.triangle.fill",
      "icon-color": "#808080"
    };
  }
}
