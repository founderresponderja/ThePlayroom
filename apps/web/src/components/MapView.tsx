'use client'
import { useEffect, useRef } from 'react'

type Props = {
  lat: number
  lng: number
  exact?: boolean
  zoom?: number
  height?: string
}

export default function MapView({ lat, lng, exact = false, zoom = 13, height = '300px' }: Props) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY
    if (!apiKey || !mapRef.current) return

    const loadMap = async () => {
      const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader')

      setOptions({ key: apiKey, v: 'weekly', libraries: ['places'] })

      // importLibrary loads the library and populates the global google.maps namespace
      await importLibrary('maps')
      if (exact) await importLibrary('marker')

      const map = new google.maps.Map(mapRef.current!, {
        center: { lat, lng },
        zoom,
        styles: [
          { elementType: 'geometry',           stylers: [{ color: '#0B0708' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0708' }] },
          { elementType: 'labels.text.fill',   stylers: [{ color: '#B69AA1' }] },
          { featureType: 'road',  elementType: 'geometry', stylers: [{ color: '#2A1B20' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#171012' }] },
        ],
        disableDefaultUI: true,
        zoomControl: true,
      })

      mapInstanceRef.current = map

      if (exact) {
        // Show exact pin
        new google.maps.Marker({
          position: { lat, lng },
          map,
          icon: {
            path:          google.maps.SymbolPath.CIRCLE,
            scale:         10,
            fillColor:     '#FF1F3D',
            fillOpacity:   1,
            strokeColor:   '#FF2E9A',
            strokeWeight:  2,
          },
        })
      } else {
        // Show approximate area circle
        new google.maps.Circle({
          strokeColor:   '#FF1F3D',
          strokeOpacity: 0.6,
          strokeWeight:  2,
          fillColor:     '#FF1F3D',
          fillOpacity:   0.08,
          map,
          center: { lat, lng },
          radius: 1500,
        })
      }
    }

    void loadMap()
  }, [lat, lng, exact, zoom])

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY) {
    return (
      <div style={{ height, background: 'var(--surface)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📍 Mapa não disponível</p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }} />
      {!exact && (
        <div style={{
          position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(11,7,8,0.85)', color: 'var(--text-muted)', fontSize: '0.75rem',
          padding: '4px 12px', borderRadius: '999px', whiteSpace: 'nowrap',
        }}>
          🔒 Localização aproximada — exacta após reserva aceite
        </div>
      )}
    </div>
  )
}
