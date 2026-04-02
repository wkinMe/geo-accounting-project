// src/components/shared/Map/components/MapMarker.tsx
import { Marker, Popup } from 'react-leaflet';
import type { MapMarker as MapMarkerType } from '../../types';
import { createCustomIcon } from '../../helpers/createCustomIcon';
import { MapPopup } from '../MapPopup';

interface MapMarkerProps {
  marker: MapMarkerType;
  onMarkerClick?: (marker: MapMarkerType) => void;
}

export function MapMarker({ marker, onMarkerClick }: MapMarkerProps) {
  const handleClick = () => {
    if (marker.onClick) {
      marker.onClick();
    }
    onMarkerClick?.(marker);
  };

  return (
    <Marker
      position={marker.position}
      icon={createCustomIcon(marker.iconColor, marker.type)}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <MapPopup
          marker={marker}
          onDetailsClick={() => {
            if (marker.type === 'warehouse' && marker.onClick) {
              marker.onClick();
            }
          }}
        />
      </Popup>
    </Marker>
  );
}