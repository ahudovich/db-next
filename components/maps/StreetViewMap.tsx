'use client'

import { useEffect, useRef } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import type { Coordinates } from '@/types/coordinates'

export function StreetViewMap({ position }: { position: Coordinates }) {
  const streetViewRef = useRef<HTMLDivElement>(null)
  const streetViewLibrary = useMapsLibrary('streetView')
  const geometryLibrary = useMapsLibrary('geometry')

  useEffect(() => {
    if (!streetViewLibrary || !streetViewRef.current || !geometryLibrary) return

    const streetViewService = new streetViewLibrary.StreetViewService()

    // Find the nearest street view location to the house
    streetViewService.getPanorama(
      {
        location: position,
        radius: 50, // Search within 50 meters
      },
      (data: unknown, status: string) => {
        if (status === 'OK' && data) {
          const panoramaData = data as { location?: { latLng?: Coordinates } }
          const streetViewPosition = panoramaData.location?.latLng

          if (streetViewPosition) {
            // Calculate heading from street view position to the house
            const heading = geometryLibrary.spherical.computeHeading(streetViewPosition, position)

            // Create the panorama with the calculated heading
            new streetViewLibrary.StreetViewPanorama(streetViewRef.current, {
              position: streetViewPosition,
              pov: {
                heading: heading,
                pitch: 0, // Look straight ahead
              },
              zoom: 1,
              addressControl: false,
              enableCloseButton: false,
              fullscreenControl: false,
            })
            return
          }
        }

        // Fallback: use the house position directly if no nearby street view found
        new streetViewLibrary.StreetViewPanorama(streetViewRef.current, {
          position,
          pov: {
            heading: 0,
            pitch: 0,
          },
          zoom: 1,
          addressControl: false,
          enableCloseButton: false,
          fullscreenControl: false,
        })
      }
    )
  }, [streetViewLibrary, geometryLibrary, position])

  return <div ref={streetViewRef} className="size-full" />
}
