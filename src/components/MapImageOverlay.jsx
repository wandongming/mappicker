import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

const SOURCE_ID = 'overlay-image'
const LAYER_ID = 'overlay-raster'

function generateId() {
  return 'pin_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
}

function MapImageOverlay({ map }) {
  const imageSourceRef = useRef(null)
  const cornerMarkersRef = useRef([])
  const imageCoordsRef = useRef(null)
  const currentBlobUrlRef = useRef(null)
  const dragStartRef = useRef(null)
  const pinMarkersRef = useRef([])
  const [pins, setPins] = useState([])
  const [addPinMode, setAddPinMode] = useState(false)
  const [hasImage, setHasImage] = useState(false)
  const addPinModeRef = useRef(addPinMode)
  const addPinRef = useRef(null)
  addPinModeRef.current = addPinMode

  const removeExistingOverlay = useCallback(() => {
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current)
      currentBlobUrlRef.current = null
    }
    cornerMarkersRef.current.forEach((m) => m.remove())
    cornerMarkersRef.current = []
    pinMarkersRef.current.forEach((m) => m.remove())
    pinMarkersRef.current = []
    setPins([])
    setHasImage(false)
    if (map?.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
    if (map?.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    imageSourceRef.current = null
  }, [map])

  const addImageToMap = useCallback(
    (url, imgWidth, imgHeight) => {
      if (!map) return
      removeExistingOverlay()
      currentBlobUrlRef.current = url

      const center = map.getCenter()
      const bounds = map.getBounds()
      const aspect = imgHeight / imgWidth
      const viewportWidth = bounds.getEast() - bounds.getWest()
      const viewportHeight = bounds.getNorth() - bounds.getSouth()
      const w = Math.min(viewportWidth, viewportHeight / aspect) * 0.6
      const h = w * aspect

      const coords = [
        [center.lng - w / 2, center.lat + h / 2],
        [center.lng + w / 2, center.lat + h / 2],
        [center.lng + w / 2, center.lat - h / 2],
        [center.lng - w / 2, center.lat - h / 2],
      ]
      imageCoordsRef.current = coords

      map.addSource(SOURCE_ID, {
        type: 'image',
        url,
        coordinates: coords,
      })

      map.addLayer({
        id: LAYER_ID,
        type: 'raster',
        source: SOURCE_ID,
        paint: { 'raster-opacity': 0.9 },
      })

      imageSourceRef.current = map.getSource(SOURCE_ID)
      setHasImage(true)

      const markers = []
      ;[0, 1, 2, 3].forEach((idx) => {
        const el = document.createElement('div')
        el.className = 'corner-marker'

        const marker = new mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat(coords[idx])
          .addTo(map)

        marker.on('drag', () => {
          const lngLat = marker.getLngLat()
          imageCoordsRef.current[idx] = [lngLat.lng, lngLat.lat]
          if (imageSourceRef.current) {
            imageSourceRef.current.setCoordinates(imageCoordsRef.current)
          }
        })

        markers.push(marker)
      })
      cornerMarkersRef.current = markers
    },
    [map, removeExistingOverlay]
  )

  const addPin = useCallback(
    (lng, lat) => {
      const name = window.prompt('请输入标记名称：', `标记 ${pins.length + 1}`)
      if (name === null) return
      const pin = { id: generateId(), name: name || '未命名', lng, lat }
      setPins((prev) => [...prev, pin])

      const el = document.createElement('div')
      el.className = 'pin-marker'
      el.title = pin.name

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map)

      const escapedName = pin.name
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
      const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
        .setHTML(`<div class="pin-popup"><strong>${escapedName}</strong></div>`)
      marker.setPopup(popup)

      pinMarkersRef.current.push(marker)
    },
    [map, pins.length]
  )
  addPinRef.current = addPin

  const exportData = useCallback(() => {
    const coords = imageCoordsRef.current
    const data = {
      bounds: coords ? coords.map((c) => [c[0], c[1]]) : null,
      pins: pins.map(({ id, name, lng, lat }) => ({ id, name, lng, lat })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `map-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [pins])

  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (!file || !map) return

      const blobUrl = URL.createObjectURL(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = new Image()
        img.onload = () => {
          addImageToMap(blobUrl, img.width, img.height)
        }
        img.src = ev.target.result
      }
      reader.readAsDataURL(file)
    },
    [map, addImageToMap]
  )

  useEffect(() => {
    if (!map) return

    const getImageBbox = () => {
      const coords = imageCoordsRef.current
      if (!coords) return null
      const lngs = coords.map((c) => c[0])
      const lats = coords.map((c) => c[1])
      return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
    }

    const onImageDragMove = (e) => {
      const dragStart = dragStartRef.current
      if (!dragStart || !imageSourceRef.current) return
      const dlng = e.lngLat.lng - dragStart.lng
      const dlat = e.lngLat.lat - dragStart.lat
      imageCoordsRef.current = dragStart.coords.map(([lng, lat]) => [lng + dlng, lat + dlat])
      imageSourceRef.current.setCoordinates(imageCoordsRef.current)
      cornerMarkersRef.current.forEach((m, i) =>
        m.setLngLat(imageCoordsRef.current[i])
      )
    }

    const endImageDrag = () => {
      if (!dragStartRef.current) return
      dragStartRef.current = null
      map.dragPan.enable()
      map.off('mousemove', onImageDragMove)
      window.removeEventListener('mouseup', endImageDrag, true)
      window.removeEventListener('pointerup', endImageDrag, true)
      window.removeEventListener('pointercancel', endImageDrag, true)
    }

    const startImageDrag = (e) => {
      const coords = imageCoordsRef.current
      if (!coords) return
      dragStartRef.current = {
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        coords: coords.map((c) => [...c]),
      }
      map.dragPan.disable()
      map.on('mousemove', onImageDragMove)
      window.addEventListener('mouseup', endImageDrag, true)
      window.addEventListener('pointerup', endImageDrag, true)
      window.addEventListener('pointercancel', endImageDrag, true)
    }

    const onMapMouseDown = (e) => {
      if (addPinModeRef.current) return
      if (!imageSourceRef.current || !imageCoordsRef.current) return
      const bbox = getImageBbox()
      if (!bbox) return
      const [lng, lat] = e.lngLat.toArray()
      if (lng >= bbox[0] && lng <= bbox[2] && lat >= bbox[1] && lat <= bbox[3]) {
        e.preventDefault()
        startImageDrag(e)
      }
    }

    const onMapClick = (e) => {
      if (!addPinModeRef.current) return
      const { lng, lat } = e.lngLat
      addPinRef.current?.(lng, lat)
    }

    map.on('mousedown', onMapMouseDown)
    map.on('click', onMapClick)

    return () => {
      map.off('mousedown', onMapMouseDown)
      map.off('click', onMapClick)
      removeExistingOverlay()
    }
  }, [map, removeExistingOverlay])

  if (!map) return null

  return (
    <>
      <div className="btn-group">
        <label className="btn" htmlFor="fileInput">
          选择图片
        </label>
        <input
          type="file"
          id="fileInput"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className={`btn btn-outline ${addPinMode ? 'active' : ''}`}
          onClick={() => setAddPinMode((v) => !v)}
          title={addPinMode ? '点击地图添加标记，再次点击按钮退出' : '点击地图添加标记'}
        >
          {addPinMode ? '添加标记中...' : '添加标记'}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={exportData}
          disabled={pins.length === 0 && !hasImage}
          title="导出图片边界和标记点"
        >
          导出
        </button>
      </div>
    </>
  )
}

export default MapImageOverlay
