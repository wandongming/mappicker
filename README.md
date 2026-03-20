# Map Picker - 地图图片叠加

基于 Mapbox GL JS + React 的地图应用，支持将本地图片叠加到底图上，并可拖拽、拉伸调整位置和形状。

## 功能

- 选择本地图片（PNG、JPG、WebP）叠加到地图
- 拖拽四角控制点拉伸图片
- 拖拽图片中心区域移动位置
- 添加 Pin 标记点并设置名称
- 导出图片边界（bounds）和标记点信息到本地 JSON 文件

## 技术栈

- React 18
- Vite
- Mapbox GL JS

## 使用

1. 安装依赖：

```bash
npm install
```

2. 配置 Mapbox Token：复制 `.env.example` 为 `.env`，填入你的 [Mapbox Access Token](https://account.mapbox.com)：

```bash
cp .env.example .env
# 编辑 .env，设置 VITE_MAPBOX_TOKEN=your_token
```

3. 启动开发服务器：

```bash
npm run dev
```

4. 在浏览器打开对应地址，点击「选择图片」上传图片，拖拽四角拉伸、拖拽中心移动

## 导出格式

导出的 JSON 文件包含：

```json
{
  "bounds": [[lng1, lat1], [lng2, lat2], [lng3, lat3], [lng4, lat4]],
  "pins": [
    { "id": "pin_xxx", "name": "标记名称", "lng": 116.4, "lat": 39.9 }
  ]
}
```

- `bounds`: 图片四角的地理坐标（左上、右上、右下、左下）
- `pins`: 标记点列表，包含 id、名称和经纬度