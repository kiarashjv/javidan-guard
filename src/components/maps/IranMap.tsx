"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, GeoJSON, useMap, Circle } from "react-leaflet";
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

// Helper function to calculate province centroid
function getProvinceCentroid(feature: {
  geometry: { type: string; coordinates: unknown };
}): [number, number] | null {
  try {
    let coords: number[][] = [];

    if (feature.geometry.type === "Polygon") {
      coords = (feature.geometry.coordinates as number[][][])[0];
    } else if (feature.geometry.type === "MultiPolygon") {
      // For MultiPolygon, take the first polygon's outer ring
      coords = ((feature.geometry.coordinates as number[][][][])[0][0]);
    }

    if (coords.length === 0) return null;

    const lats = coords.map((c: number[]) => c[1]);
    const lngs = coords.map((c: number[]) => c[0]);

    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];
  } catch (error) {
    console.error("Error calculating centroid:", error);
    return null;
  }
}

function MapComponent({
  provinceData,
}: {
  provinceData: Record<string, ProvinceData>;
}) {
  const [geoData, setGeoData] = useState<Record<string, unknown> | null>(null);
  const [animatingProvinces, setAnimatingProvinces] = useState<Set<string>>(
    new Set(),
  );
  const [provinceCentroids, setProvinceCentroids] = useState<
    Map<string, [number, number]>
  >(new Map());
  const [previousData, setPreviousData] = useState<Record<string, ProvinceData>>({});
  const animatingRef = useRef<Set<string>>(new Set());
  const map = useMap();

  // Update previous data after animations are triggered
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviousData(provinceData);
    }, 100);
    return () => clearTimeout(timer);
  }, [provinceData]);

  useEffect(() => {
    // Load GeoJSON data
    fetch("/data/iran-provinces.json")
      .then((res) => res.json())
      .then((data: Record<string, unknown>) => {
        setGeoData(data);

        // Calculate province centroids
        const features = (data as { features?: unknown[] })?.features || [];
        const centroids = new Map<string, [number, number]>();

        features.forEach((feature: unknown) => {
          const f = feature as {
            properties?: { tags?: Record<string, string> };
            geometry: { type: string; coordinates: unknown };
          };
          const provinceCode = f.properties?.tags?.["ISO3166-2"];
          if (provinceCode) {
            const centroid = getProvinceCentroid(f);
            if (centroid) {
              centroids.set(provinceCode, centroid);
            }
          }
        });

        setProvinceCentroids(centroids);
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

      // Only animate if not already animating and data increased
      if (
        previous &&
        !animatingRef.current.has(provinceCode) &&
        (current.victims > previous.victims ||
          current.actions > previous.actions ||
          current.mercenaries > previous.mercenaries)
      ) {
        newAnimations.add(provinceCode);
      }
    });

    if (newAnimations.size > 0) {
      // Add to ref immediately to prevent duplicate animations
      newAnimations.forEach((code) => animatingRef.current.add(code));

      // Schedule state update to avoid synchronous setState in effect
      timeoutId = setTimeout(() => {
        setAnimatingProvinces((prev) => new Set([...prev, ...newAnimations]));
        // Clear animations after all ripples complete with extra buffer
        // Last ripple: 1800ms delay + 2000ms duration = 3800ms + 700ms buffer = 4500ms
        setTimeout(() => {
          setAnimatingProvinces((prev) => {
            const updated = new Set(prev);
            newAnimations.forEach((code) => {
              updated.delete(code);
              animatingRef.current.delete(code);
            });
            return updated;
          });
        }, 4500);
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

    return {
      fillColor,
      weight: 1.5,
      opacity: 1,
      color: "#ffffff",
      fillOpacity: 0.8,
    };
  };

  if (!geoData) return null;

  // Render radar animation circles for animating provinces
  const radarCircles = Array.from(animatingProvinces).flatMap((provinceCode) => {
    const centroid = provinceCentroids.get(provinceCode);
    if (!centroid) return [];

    // Create 4 ripple circles with staggered delays for water droplet effect
    // All start at same size and scale up while fading out
    return [0, 600, 1200, 1800].map((_, index) => (
      <Circle
        key={`${provinceCode}-radar-${index}`}
        center={centroid}
        radius={15000} // Base radius in meters (~50px at typical zoom)
        pathOptions={{
          fillColor: "#ffffff",
          fillOpacity: 0,
          color: "#dc2626",
          weight: 3,
          opacity: 0,
        }}
        className={`radar-ripple radar-ripple-${index}`}
        eventHandlers={{}}
      />
    ));
  });

  // Inline styles for radar ripple animation
  const radarStyles = (
    <style>
      {`
        .radar-ripple-0,
        .radar-ripple-1,
        .radar-ripple-2,
        .radar-ripple-3 {
          transform-box: fill-box;
          transform-origin: center center;
        }

        @keyframes radar-ripple {
          0% {
            transform: scale(0);
            opacity: 0;
            stroke-opacity: 0;
            fill-opacity: 0;
          }
          15% {
            opacity: 1;
            stroke-opacity: 1;
            fill-opacity: 0.6;
          }
          100% {
            transform: scale(3);
            opacity: 0;
            stroke-opacity: 0;
            fill-opacity: 0;
          }
        }

        .radar-ripple-0 {
          animation: radar-ripple 2s ease-out 0ms 1 forwards;
        }
        .radar-ripple-1 {
          animation: radar-ripple 2s ease-out 600ms 1 forwards;
        }
        .radar-ripple-2 {
          animation: radar-ripple 2s ease-out 1200ms 1 forwards;
        }
        .radar-ripple-3 {
          animation: radar-ripple 2s ease-out 1800ms 1 forwards;
        }
      `}
    </style>
  );

  return (
    <>
      {radarStyles}
      <GeoJSON data={geoData as never} style={style} onEachFeature={onEachFeature} />
      {radarCircles}
    </>
  );
}

export default function IranMap({ data = {} }: IranMapProps) {
  const [zoom, setZoom] = useState(6);
  const [center, setCenter] = useState<[number, number]>([32, 54]);
  const [mapScale, setMapScale] = useState(1);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for client-side mounting before rendering map
    requestAnimationFrame(() => setIsReady(true));

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

  if (!isReady) {
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
          <MapComponent provinceData={data} />
        </MapContainer>
      </div>
    </div>
  );
}
