// src/components/shared/Map/helpers/createCustomIcon.ts
import { divIcon } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { FaWarehouse, FaBuilding } from 'react-icons/fa';

export const createCustomIcon = (color: string, type: 'warehouse' | 'organization') => {
  const IconComponent = type === 'warehouse' ? FaWarehouse : FaBuilding;
  
  const svgHtml = renderToString(
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          backgroundColor: color,
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          border: '2px solid white',
        }}
      >
        <IconComponent style={{ color: 'white', fontSize: '18px' }} />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `8px solid ${color}`,
        }}
      />
    </div>
  );

  return divIcon({
    html: svgHtml,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
    className: 'custom-marker',
  });
};