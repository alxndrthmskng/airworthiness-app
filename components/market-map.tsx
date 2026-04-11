'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type MapOrg = {
  id: number
  reference_number: string
  organisation_name: string
  city: string | null
  country_code: string
  latitude: number
  longitude: number
}

const COUNTRY_NAMES: Record<string, string> = {
  AE: 'UAE', AT: 'Austria', AU: 'Australia', BE: 'Belgium', BG: 'Bulgaria',
  BH: 'Bahrain', BR: 'Brazil', CA: 'Canada', CH: 'Switzerland', CN: 'China',
  CY: 'Cyprus', CZ: 'Czech Republic', DE: 'Germany', DK: 'Denmark',
  ES: 'Spain', FI: 'Finland', FR: 'France', GB: 'United Kingdom',
  GR: 'Greece', HK: 'Hong Kong', HR: 'Croatia', HU: 'Hungary',
  IE: 'Ireland', IL: 'Israel', IN: 'India', IT: 'Italy',
  JP: 'Japan', KR: 'South Korea', KW: 'Kuwait', MY: 'Malaysia',
  NL: 'Netherlands', NO: 'Norway', NZ: 'New Zealand', PL: 'Poland',
  PT: 'Portugal', QA: 'Qatar', RO: 'Romania', SA: 'Saudi Arabia',
  SE: 'Sweden', SG: 'Singapore', TH: 'Thailand', TR: 'Turkey',
  US: 'United States', ZA: 'South Africa',
}

export function MarketMap({ organisations }: { organisations: MapOrg[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? organisations.filter(o => {
        const q = search.toLowerCase()
        return o.organisation_name.toLowerCase().includes(q) ||
          o.reference_number.toLowerCase().includes(q) ||
          (o.city || '').toLowerCase().includes(q) ||
          (COUNTRY_NAMES[o.country_code] || '').toLowerCase().includes(q)
      })
    : organisations

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [51.5, -0.1],
      zoom: 3,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.MarkerClusterGroup) {
        map.removeLayer(layer)
      }
    })

    // Custom marker icon
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="width:10px;height:10px;border-radius:50%;background:#6366f1;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    // Add markers
    const markers: L.Marker[] = []
    for (const org of filtered) {
      if (!org.latitude || !org.longitude) continue

      const marker = L.marker([org.latitude, org.longitude], { icon })
      marker.bindPopup(`
        <div style="min-width:200px">
          <strong>${org.organisation_name}</strong><br/>
          <span style="color:#666;font-size:12px">${org.reference_number}</span><br/>
          ${org.city ? `<span style="font-size:12px">${org.city}, ${COUNTRY_NAMES[org.country_code] || org.country_code}</span><br/>` : ''}
          <a href="/market/${org.reference_number}" style="color:#6366f1;font-size:12px;text-decoration:underline">View profile →</a>
        </div>
      `)
      marker.addTo(map)
      markers.push(marker)
    }

    // Fit bounds if we have markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers)
      map.fitBounds(group.getBounds().pad(0.1))
    }
  }, [filtered])

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter map by organisation, location..."
          className="w-full h-10 rounded-lg border border-input bg-transparent px-4 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="rounded-xl border overflow-hidden bg-card">
        <div ref={mapRef} style={{ height: '600px', width: '100%' }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {filtered.length.toLocaleString()} organisations plotted
      </p>
    </div>
  )
}
