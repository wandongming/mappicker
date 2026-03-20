import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapImageOverlay from './components/MapImageOverlay'
import './App.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN'

function App() {
  const mapContainerRef = useRef(null)
  const [map, setMap] = useState(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
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

  return (
    <div className="app">
      <div ref={mapContainerRef} className="map-container" />
      <div className="controls">
        <h3>本地图片叠加</h3>
        <MapImageOverlay map={map} />
        <p className="hint">支持 PNG、JPG、WebP。拖拽四角可拉伸，拖拽中心可移动。</p>
      </div>
    </div>
  )
}

export default App
