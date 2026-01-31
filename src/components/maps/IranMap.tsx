"use client";

import { useEffect, useState } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface ProvinceData {
  victims: number;
  actions: number;
  mercenaries: number;
}

interface IranMapProps {
  data?: Record<string, ProvinceData>;
  onNewActivity?: (provinceCode: string) => void;
}

// Color scale function
const getColor = (victims: number) => {
  if (victims > 150) return "#7f1d1d";
  if (victims > 100) return "#991b1b";
  if (victims > 50) return "#dc2626";
  if (victims > 20) return "#ef4444";
  return "#fca5a5";
};

function MapComponent({
  provinceData,
  previousData,
}: {
  provinceData: Record<string, ProvinceData>;
  previousData: Record<string, ProvinceData>;
}) {
  const [geoData, setGeoData] = useState<Record<string, unknown> | null>(null);
  const [animatingProvinces, setAnimatingProvinces] = useState<Set<string>>(
    new Set(),
  );
  const map = useMap();

  useEffect(() => {
    // Load GeoJSON data
    fetch("/data/iran-provinces.json")
      .then((res) => res.json())
      .then((data: Record<string, unknown>) => {
        setGeoData(data);
      })
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, [map]);

  // Detect new data and trigger animations
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const newAnimations = new Set<string>();

    Object.keys(provinceData).forEach((provinceCode) => {
      const current = provinceData[provinceCode];
      const previous = previousData[provinceCode];

      if (
        previous &&
        (current.victims > previous.victims ||
          current.actions > previous.actions ||
          current.mercenaries > previous.mercenaries)
      ) {
        newAnimations.add(provinceCode);
      }
    });

    if (newAnimations.size > 0) {
      // Schedule state update to avoid synchronous setState in effect
      timeoutId = setTimeout(() => {
        setAnimatingProvinces(newAnimations);
        // Clear animations after 3 seconds
        setTimeout(() => setAnimatingProvinces(new Set()), 3000);
      }, 0);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [provinceData, previousData]);

  const onEachFeature = (feature: { properties?: { tags?: Record<string, string> } }, layer: L.Layer) => {
    const provinceCode = feature.properties?.tags?.["ISO3166-2"];
    const provinceName =
      feature.properties?.tags?.["name:en"] ||
      feature.properties?.tags?.name ||
      "Unknown";
    const data = provinceData[provinceCode || ""];

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

      (layer as L.Path).bindPopup(popupContent);

      // Add hover effect with proper z-index
      layer.on({
        mouseover: (e: L.LeafletMouseEvent) => {
          const targetLayer = e.target as L.Path;
          targetLayer.setStyle({
            weight: 4,
            color: "#fbbf24",
            fillOpacity: 0.95,
          });
          targetLayer.bringToFront();
        },
        mouseout: (e: L.LeafletMouseEvent) => {
          const targetLayer = e.target as L.Path;
          const provinceCode = feature.properties?.tags?.["ISO3166-2"];
          const isAnimating = animatingProvinces.has(provinceCode || "");
          targetLayer.setStyle({
            weight: isAnimating ? 4 : 1.5,
            color: isAnimating ? "#fbbf24" : "#ffffff",
            fillOpacity: isAnimating ? 0.9 : 0.8,
          });
        },
      });
    }
  };

  const style = (feature?: { properties?: { tags?: Record<string, string> } }) => {
    const provinceCode = feature?.properties?.tags?.["ISO3166-2"] || "";
    const data = provinceData[provinceCode];
    const fillColor = data ? getColor(data.victims) : "#e5e7eb";
    const isAnimating = animatingProvinces.has(provinceCode);

    return {
      fillColor,
      weight: isAnimating ? 4 : 1.5,
      opacity: 1,
      color: isAnimating ? "#fbbf24" : "#ffffff",
      fillOpacity: isAnimating ? 0.9 : 0.8,
      className: isAnimating ? "animate-pulse" : "",
    };
  };

  if (!geoData) return null;

  return <GeoJSON data={geoData as never} style={style} onEachFeature={onEachFeature} />;
}

export default function IranMap({ data = {} }: IranMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [zoom, setZoom] = useState(6);
  const [center, setCenter] = useState<[number, number]>([32, 54]);
  const [mapScale, setMapScale] = useState(1);
  const [previousData, setPreviousData] = useState<Record<string, ProvinceData>>({});

  useEffect(() => {
    setIsMounted(true);

    // Set initial zoom and center based on screen size
    const updateMapView = () => {
      if (window.innerWidth < 768) {
        setZoom(4); // Mobile - lower zoom to show full map
        setCenter([33, 53.5]); // Adjusted center for better framing
        setMapScale(1.5); // Scale UP to make map bigger on small screens
      } else if (window.innerWidth < 1024) {
        setZoom(5); // Tablet - whole number zoom
        setCenter([32.5, 54]);
        setMapScale(1);
      } else {
        setZoom(6); // Desktop
        setCenter([32.5, 54]);
        setMapScale(1);
      }
    };

    updateMapView();
    window.addEventListener("resize", updateMapView);

    return () => window.removeEventListener("resize", updateMapView);
  }, []);

  useEffect(() => {
    // Update previous data state after render
    setPreviousData(data);
  }, [data]);

  if (!isMounted) {
    return (
      <div className="w-full h-100 md:h-125 lg:h-150 bg-muted/20 rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  return (
    <div className="w-full h-100 md:h-200 lg:h-200 rounded-lg relative overflow-hidden flex items-center justify-center">
      <div
        style={{
          transform: `scale(${mapScale})`,
          transformOrigin: "center center",
          height: "100%",
          width: "100%",
        }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          key={`${zoom}-${center[0]}-${center[1]}`}
          style={{
            height: "100%",
            width: "100%",
            backgroundColor: "transparent",
            borderRadius: "0.5rem",
          }}
          scrollWheelZoom={false}
          zoomControl={false}
          doubleClickZoom={false}
          dragging={false}
          attributionControl={false}
        >
          <MapComponent provinceData={data} previousData={previousData} />
        </MapContainer>
      </div>
    </div>
  );
}
