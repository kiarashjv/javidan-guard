"use client";

import { useEffect, useState } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ProvinceData {
  victims: number;
  actions: number;
  mercenaries: number;
}

interface IranMapProps {
  data?: Record<string, ProvinceData>;
}

// Color scale function
const getColor = (victims: number) => {
  if (victims > 150) return "#7f1d1d";
  if (victims > 100) return "#991b1b";
  if (victims > 50) return "#dc2626";
  if (victims > 20) return "#ef4444";
  return "#fca5a5";
};

function MapComponent({ provinceData }: { provinceData: Record<string, ProvinceData> }) {
  const [geoData, setGeoData] = useState<any>(null);
  const map = useMap();

  useEffect(() => {
    // Load GeoJSON data
    fetch("/data/iran-provinces.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("Loaded provinces:", data.features?.length);
        setGeoData(data);

        // Fit map to Iran bounds
        if (data.features) {
          const geoJsonLayer = L.geoJSON(data);
          map.fitBounds(geoJsonLayer.getBounds());
        }
      })
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, [map]);

  if (!geoData) return null;

  const onEachFeature = (feature: any, layer: any) => {
    const provinceCode = feature.properties?.tags?.["ISO3166-2"];
    const provinceName = feature.properties?.tags?.["name:en"] || feature.properties?.tags?.name || "Unknown";
    const data = provinceData[provinceCode];

    if (data) {
      // Create popup content
      const popupContent = `
        <div class="p-2">
          <div class="font-semibold text-lg mb-2">${provinceName}</div>
          <div class="text-sm space-y-1">
            <div class="flex justify-between gap-4">
              <span class="text-gray-600">Victims:</span>
              <span class="font-semibold text-red-600">${data.victims}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-gray-600">Actions:</span>
              <span class="font-semibold">${data.actions}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-gray-600">Mercenaries:</span>
              <span class="font-semibold">${data.mercenaries}</span>
            </div>
          </div>
        </div>
      `;

      layer.bindPopup(popupContent);

      // Add hover effect
      layer.on({
        mouseover: () => {
          layer.setStyle({
            weight: 3,
            color: "#fbbf24",
            fillOpacity: 0.9,
          });
        },
        mouseout: () => {
          layer.setStyle({
            weight: 2,
            color: "#ffffff",
            fillOpacity: 0.7,
          });
        },
      });
    }
  };

  const style = (feature: any) => {
    const provinceCode = feature?.properties?.tags?.["ISO3166-2"];
    const data = provinceData[provinceCode];
    const fillColor = data ? getColor(data.victims) : "#e5e7eb";

    return {
      fillColor,
      weight: 2,
      opacity: 1,
      color: "#ffffff",
      fillOpacity: 0.7,
    };
  };

  return <GeoJSON data={geoData} style={style} onEachFeature={onEachFeature} />;
}

export default function IranMap({ data = {} }: IranMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-200 bg-muted/20 rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  return (
    <div className="w-full h-200 rounded-lg overflow-hidden">
      <MapContainer
        center={[32, 54]}
        style={{ height: "100%", width: "100%", backgroundColor: "white" }}
        scrollWheelZoom={false}
        zoomControl={false}
        doubleClickZoom={false}
        dragging={false}
        attributionControl={false}
      >
        <MapComponent provinceData={data} />
      </MapContainer>
    </div>
  );
}
