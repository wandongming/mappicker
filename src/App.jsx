import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import MapImageOverlay from './components/MapImageOverlay'
import './App.css'

function App() {
  const mapContainerRef = useRef(null)
  const [map, setMap] = useState(null)
  const [lng, setLng] = useState('116.4074')
  const [lat, setLat] = useState('39.9042')

  useEffect(() => {
    if (!mapContainerRef.current) return

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          tianditu: {
            type: 'raster',
            tiles: ['https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=c193cc10a93c8b9812eee27133dbc792'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.tianditu.gov.cn/">天地图</a>',
          },
          tiandituLabel: {
            type: 'raster',
            tiles: ['https://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=c193cc10a93c8b9812eee27133dbc792'],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'tianditu-tiles',
            type: 'raster',
            source: 'tianditu',
            minzoom: 0,
            maxzoom: 18,
          },
          {
            id: 'tianditu-label',
            type: 'raster',
            source: 'tiandituLabel',
            minzoom: 0,
            maxzoom: 18,
          },
        ],
      },
      center: [116.4074, 39.9042],
      zoom: 12,
    })

    mapInstance.on('load', () => setMap(mapInstance))

    return () => {
      mapInstance.remove()
      setMap(null)
    }
  }, [])

  const handleJump = () => {
    if (!map) return
    const longitude = parseFloat(lng)
    const latitude = parseFloat(lat)
    if (isNaN(longitude) || isNaN(latitude)) {
      alert('请输入有效的经纬度')
      return
    }
    map.flyTo({
      center: [longitude, latitude],
      zoom: 14,
      essential: true
    })
  }

  return (
    <div className="app">
      <div ref={mapContainerRef} className="map-container" />
      <div className="controls">
        <h3>本地图片叠加</h3>
        <div className="jump-controls">
          <input
            type="text"
            placeholder="经度"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="coord-input"
          />
          <input
            type="text"
            placeholder="纬度"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="coord-input"
          />
          <button onClick={handleJump} className="jump-btn">跳转</button>
        </div>
        <MapImageOverlay map={map} />
        <p className="hint">支持 PNG、JPG、WebP。拖拽四角可拉伸，拖拽中心可移动。</p>
      </div>
    </div>
  )
}

export default App
