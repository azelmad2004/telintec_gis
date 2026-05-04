import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, useMap, TileLayer, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.offline';
import { Download, Crosshair, Plus, Minus } from 'lucide-react';
const getMarkerIcon = (type, status) => {
  const colors = {
    'NRO': '#800080',      
    'SR': '#00008B',       
    'Splitter': '#FF991F', 
    'PCO': '#00BFFF',      
    'PCO FTTH': '#00BFFF', 
    'PCO ADSL': '#FF9900', 
    'CLIENT': '#6554C0',   
    'default': '#333333'
  };
  const color = colors[type] || colors.default;
  const border = status === 'maintenance' ? 'dashed 2px #ff0000' : 'solid 2px white';
  const size = type === 'NRO' ? 18 : (type === 'SR' ? 14 : 10);
  return L.divIcon({
    className: 'custom-nms-marker',
    html: `<div style="
      width: ${size}px; 
      height: ${size}px; 
      background-color: ${color}; 
      border: ${border}; 
      border-radius: 50%;
      box-shadow: 0 0 5px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};
function MapFeatures({ onLocationFound }) {
  const map = useMap();
  useEffect(() => {
    map.on('locationfound', (e) => {
      onLocationFound(e.latlng);
      map.flyTo(e.latlng, 20, { animate: true, duration: 1.5 });
    });
  }, [map, onLocationFound]);
  return null;
}
function MapClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    if (!onMapClick) return;
    const onClick = (e) => onMapClick(e.latlng);
    map.on('click', onClick);
    return () => map.off('click', onClick);
  }, [map, onMapClick]);
  return null;
}
function OfflineControl() {
  const map = useMap();
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  useEffect(() => {
    const tileLayerOffline = L.tileLayer.offline(
      'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        attribution: '&copy; Google Maps',
        minZoom: 1,
        maxNativeZoom: 20,
        maxZoom: 22,
        detectRetina: true,
        crossOrigin: true,
      }
    );
    tileLayerOffline.addTo(map);
    const c = L.control.savetiles(tileLayerOffline, {
      zoomlevels: [12, 13, 14, 15, 16, 17, 18, 19, 20],
      confirm(layer, successCallback) { setIsDownloading(true); successCallback(); },
      confirmRemoval(layer, successCallback) { successCallback(); },
      saveText: '', rmText: '',
    });
    tileLayerOffline.on('savetiles:progress', (e) => {
      setProgress(Math.round((e._saved / e._expected) * 100));
    });
    tileLayerOffline.on('savetiles:loaded', () => {
      setIsDownloading(false);
      setProgress(0);
    });
    return () => { map.removeLayer(tileLayerOffline); };
  }, [map]);
  const handleLocate = () => {
    map.locate({ setView: false, enableHighAccuracy: true });
  };
  return (
    <div className="map-tools-stack">
      <button className="tool-btn" onClick={() => map.zoomIn()}><Plus size={20} /></button>
      <button className="tool-btn" onClick={() => map.zoomOut()}><Minus size={20} /></button>
      <div style={{ height: '4px' }}></div>
      <button className="tool-btn" onClick={handleLocate} title="Ma position exacte"><Crosshair size={20} color="#0052CC" /></button>
      <div style={{ height: '4px' }}></div>
      {!isDownloading ? (
        <button className="tool-btn" onClick={() => alert("Le mode hors-ligne est prêt. Les dalles de cette zone ont été mises en cache.")} title="Offline Ready"><Download size={20} /></button>
      ) : (
        <div className="download-progress-bubble">{progress}%</div>
      )}
    </div>
  );
}
export default function MapView({ equipements, onEquipementClick, selectedEquipement, onMapClick }) {
  const [userLocation, setUserLocation] = useState(null);
  const position = [32.9348, -5.6697];
  const khenifraBounds = [[32.85, -5.75], [33.02, -5.58]];
  function FlyToSelected() {
    const map = useMap();
    useEffect(() => {
      if (selectedEquipement) map.flyTo([selectedEquipement.latitude, selectedEquipement.longitude], 20);
    }, [selectedEquipement, map]);
    return null;
  }
  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', background: '#000' }}>
      <MapContainer
        center={position}
        zoom={14}
        minZoom={12}
        maxZoom={22}
        maxBounds={khenifraBounds}
        style={{ height: '100%', width: '100%', background: '#000' }}
        zoomControl={false}
      >
        <MapFeatures onLocationFound={setUserLocation} />
        <OfflineControl />
        <FlyToSelected />
        <MapClickHandler onMapClick={onMapClick} />
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          attribution="&copy; Google Satellite"
          opacity={1}
          zIndex={5}
          maxNativeZoom={20}
          maxZoom={22}
          detectRetina={true}
          className="light-satellite-layer"
        />
        {userLocation && (
          <>
            <Circle center={userLocation} radius={3} pathOptions={{ fillColor: '#0052CC', color: 'white', weight: 2, fillOpacity: 1 }} />
            <Circle center={userLocation} radius={25} pathOptions={{ fillColor: '#0052CC', color: 'transparent', fillOpacity: 0.15 }} />
          </>
        )}
        {equipements.map((eq) => (
          <Marker 
            key={eq.id} 
            position={[Number(eq.latitude), Number(eq.longitude)]} 
            icon={getMarkerIcon(eq.type, eq.status)}
            eventHandlers={{ click: () => onEquipementClick(eq) }}
          />
        ))}
      </MapContainer>
    </div>
  );
}