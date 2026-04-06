import { useEffect, useMemo, useRef, useState } from "react";
import "./Globe2D.css";

const STAGE_WIDTH = 1536;
const STAGE_HEIGHT = 791;
const MAP_WIDTH = 4746;
const MAP_HEIGHT = 791;
const WORLD_WIDTH = MAP_WIDTH / 3; // 1582

const BORDER_SCALE_X = 1.012;   // tweak
const BORDER_SCALE_Y = 0.965;   // tweak
const BORDER_OFFSET_X = -8;     // tweak in px
const BORDER_OFFSET_Y = 6;      // tweak in px


const BU_IMAGES = {
  lifescience: `${import.meta.env.BASE_URL}images/lifescience.png`,
  dairy: `${import.meta.env.BASE_URL}images/dairy.png`,
  brewery: `${import.meta.env.BASE_URL}images/brewery.png`,
  sugar: `${import.meta.env.BASE_URL}images/sugar.png`,
  farming: `${import.meta.env.BASE_URL}images/farming.png`
};


const BU_COLORS = {
  lifescience: "#c3c3c3",
  dairy: "#2ab9ce",
  brewery: "#a349a4",
  sugar: "#3f48cc",
  farming: "#b97a57",
  alarm: "#ff0000"
};

const dairy = [
  { name: "Qatar North", lat: 25.89, lng: 51.2, bu: "dairy", buName: "Dairy" },
  { name: "Siberia", lat: 65.15, lng: 71.73, bu: "dairy", buName: "Dairy" },
  { name: "Pittsburgh", lat: 40.23, lng: -79.71, bu: "dairy", buName: "Dairy" },
  { name: "Perth", lat: -32.31, lng: 116.06, bu: "dairy", buName: "Dairy" },
  { name: "North Algeria", lat: 35.62, lng: 4.56, bu: "dairy", buName: "Dairy" },
  { name: "Madrid", lat: 40.42, lng: -3.7, bu: "dairy", buName: "Dairy" }
];

const sugar = [
  { name: "Aghajari", lat: 31.19, lng: 49.52, bu: "sugar", buName: "Sugar" },
  { name: "Greater Burgan", lat: 29.44, lng: 47.66, bu: "sugar", buName: "Sugar" },
  { name: "Bolivar Coastal", lat: 9.88, lng: -64.3, bu: "sugar", buName: "Sugar" },
  { name: "Daqing", lat: 46.43, lng: 125.04, bu: "sugar", buName: "Sugar" },
  { name: "Permian Basin", lat: 33.43, lng: -103.37, bu: "sugar", buName: "Sugar" },
  { name: "UK central", lat: 53.2, lng: -0.63, bu: "sugar", buName: "Sugar" }
];

const farming = [
  { name: "Qatar South", lat: 24.9, lng: 51.3, bu: "farming", buName: "Farming" },
  { name: "Barrow Island", lat: -20.8, lng: 115.4, bu: "farming", buName: "Farming" },
  { name: "Nigeria South", lat: 6.0, lng: 4.89, bu: "farming", buName: "Farming" },
  { name: "Sabine Pass", lat: 30.01, lng: -93.8, bu: "farming", buName: "Farming" },
  { name: "Siberia", lat: 65.94, lng: 71.21, bu: "farming", buName: "Farming" }
];

const brewery = [
  { name: "Qatar South", lat: 24.9, lng: 51.3, bu: "brewery", buName: "Brewery" },
  { name: "Barrow Island", lat: -20.8, lng: 115.4, bu: "brewery", buName: "Brewery" },
  { name: "Nigeria South", lat: 6.0, lng: 4.89, bu: "brewery", buName: "Brewery" },
  { name: "Sabine Pass", lat: 30.01, lng: -93.8, bu: "brewery", buName: "Brewery" },
  { name: "Siberia", lat: 65.94, lng: 71.21, bu: "brewery", buName: "Brewery" },
  { name: "Gujarat", lat: 22.41, lng: 70.05, bu: "brewery", buName: "Brewery" },
  { name: "Saudi Arabia East", lat: 27.62, lng: 48.61, bu: "brewery", buName: "Brewery" },
  { name: "Paraguana Peninsula", lat: 11.93, lng: -70.06, bu: "brewery", buName: "Brewery" }
];

const lifescience = [
  { name: "ZheJiang", lat: 28.22, lng: 120.35, bu: "lifescience", buName: "Life Science" },
  { name: "Abu Dhabi", lat: 24.36, lng: 54.5, bu: "lifescience", buName: "Life Science" },
  { name: "Baytown", lat: 29.73, lng: -94.98, bu: "lifescience", buName: "Life Science" },
  { name: "Ludwigshafen", lat: 49.48, lng: 8.49, bu: "lifescience", buName: "Life Science" }
];

const alarmSite = {
  name: "Berlin",
  lat: 52.52,
  lng: 13.405,
  bu: "alarm",
  buName: "Alarm",
  issue: "Production not meeting targets"
};

export default function Globe2D() {
  const [selectedSite, setSelectedSite] = useState(null);
  const [berlinAlertOpen, setBerlinAlertOpen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(-(MAP_WIDTH - STAGE_WIDTH) / 2);

  const [geoData, setGeoData] = useState(null);
  const [siteTooltip, setSiteTooltip] = useState(null);
  const [countryTooltip, setCountryTooltip] = useState(null);

  const dragState = useRef({
    startPointerX: 0,
    startDragX: 0,
    moved: false
  });

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/worldcountries.json`)
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
      })
      .catch((err) => {
        console.error("Failed to load GeoJSON:", err);
      });
  }, []);

  const allSites = useMemo(() => {
    return [
      ...dairy,
      ...sugar,
      ...farming,
      ...brewery,
      ...lifescience,
      alarmSite
    ];
  }, []);

  const clampX = (x) => {
    const minX = STAGE_WIDTH - MAP_WIDTH;
    const maxX = 0;
    return Math.max(minX, Math.min(maxX, x));
  };

  const latLngToXY = (lat, lng) => {
    const x = ((lng + 180) / 360) * WORLD_WIDTH;

    // Base equirectangular + small visual correction for your custom flattened asset
    let y = ((90 - lat) / 180) * MAP_HEIGHT;
    y = y * 0.92 + MAP_HEIGHT * 0.04;

    return { x, y };
  };

  const handlePointerDown = (e) => {
    setDragging(true);
    dragState.current.startPointerX = e.clientX;
    dragState.current.startDragX = dragX;
    dragState.current.moved = false;
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;

    const deltaX = e.clientX - dragState.current.startPointerX;
    if (Math.abs(deltaX) > 4) {
      dragState.current.moved = true;
    }

    setDragX(clampX(dragState.current.startDragX + deltaX));
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleMarkerClick = (site, e) => {
    e.stopPropagation();

    if (dragState.current.moved) return;

    if (site.bu === "alarm") {
      setBerlinAlertOpen(true);
      return;
    }

    setSelectedSite(site);
  };

  const buildPolygonPath = (coords, repeatIndex = 0) => {
    if (!coords || !coords.length) return "";

    return coords
      .map((ring) => {
        const commands = ring
          .map((coord, i) => {
            const [lng, lat] = coord;
            const pt = latLngToXY(lat, lng);
            const x = pt.x + repeatIndex * WORLD_WIDTH;
            const y = pt.y;
            return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(" ");

        return `${commands} Z`;
      })
      .join(" ");
  };

  const renderFeaturePath = (feature, featureIndex, repeatIndex) => {
    const geometry = feature.geometry;
    const countryName =
      feature.properties?.name ||
      feature.properties?.NAME ||
      feature.properties?.admin ||
      feature.properties?.ADMIN ||
      "Unknown";

    if (!geometry) return null;

    if (geometry.type === "Polygon") {
      const d = buildPolygonPath(geometry.coordinates, repeatIndex);
      return (
        <path
          key={`poly-${featureIndex}-${repeatIndex}`}
          d={d}
          className="country-border"
          onMouseEnter={(e) =>
            setCountryTooltip({
              name: countryName,
              x: e.clientX,
              y: e.clientY
            })
          }
          onMouseMove={(e) =>
            setCountryTooltip({
              name: countryName,
              x: e.clientX,
              y: e.clientY
            })
          }
          onMouseLeave={() => setCountryTooltip(null)}
        />
      );
    }

    if (geometry.type === "MultiPolygon") {
      return geometry.coordinates.map((polygonCoords, polyIndex) => {
        const d = buildPolygonPath(polygonCoords, repeatIndex);
        return (
          <path
            key={`multipoly-${featureIndex}-${polyIndex}-${repeatIndex}`}
            d={d}
            className="country-border"
            onMouseEnter={(e) =>
              setCountryTooltip({
                name: countryName,
                x: e.clientX,
                y: e.clientY
              })
            }
            onMouseMove={(e) =>
              setCountryTooltip({
                name: countryName,
                x: e.clientX,
                y: e.clientY
              })
            }
            onMouseLeave={() => setCountryTooltip(null)}
          />
        );
      });
    }

    return null;
  };

  return (
    <div
      className="globe2d-wrapper"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="globe2d-stage">
        <div
          className={`globe2d-map-track ${dragging ? "dragging" : ""}`}
          style={{ transform: `translateX(${dragX}px)` }}
          onPointerDown={handlePointerDown}
        >
          <img
            src={`${import.meta.env.BASE_URL}images/map.png`}
            alt="World map"
            className="globe2d-map-image"
            draggable={false}
          />

          {/* GEOJSON COUNTRY BORDERS OVERLAY */}
          {geoData?.features && (
            <svg
              className="geojson-overlay"
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              preserveAspectRatio="none"
            >
              {geoData.features.map((feature, featureIndex) =>
                [0, 1, 2].map((repeatIndex) =>
                  renderFeaturePath(feature, featureIndex, repeatIndex)
                )
              )}
            </svg>
          )}

          {/* SITE MARKERS ON ALL 3 REPEATS */}
          {allSites.map((site, siteIndex) => {
            const base = latLngToXY(site.lat, site.lng);

            return [0, 1, 2].map((repeatIndex) => {
              const markerX = base.x + repeatIndex * WORLD_WIDTH;
              const markerY = base.y;
              const markerColor =
                site.bu === "alarm"
                  ? BU_COLORS.alarm
                  : BU_COLORS[site.bu] || "#ffffff";

              return (
                <button
                  key={`${site.name}-${siteIndex}-${repeatIndex}`}
                  type="button"
                  className={`site-marker ${site.bu === "alarm" ? "alarm" : ""}`}
                  style={{
                    left: `${markerX}px`,
                    top: `${markerY}px`,
                    background: markerColor
                  }}
                  onClick={(e) => handleMarkerClick(site, e)}
                  onMouseEnter={(e) =>
                    setSiteTooltip({
                      name: site.name,
                      x: e.clientX,
                      y: e.clientY
                    })
                  }
                  onMouseMove={(e) =>
                    setSiteTooltip({
                      name: site.name,
                      x: e.clientX,
                      y: e.clientY
                    })
                  }
                  onMouseLeave={() => setSiteTooltip(null)}
                  aria-label={site.name}
                />
              );
            });
          })}
        </div>

        <img
          src={`${import.meta.env.BASE_URL}images/background.png`}
          alt="Globe cutout"
          className="globe2d-cutout"
          draggable={false}
        />
      </div>

      {/* COUNTRY TOOLTIP */}
      {countryTooltip && !siteTooltip && (
        <div
          className="hover-tooltip country-tooltip"
          style={{
            left: `${countryTooltip.x + 12}px`,
            top: `${countryTooltip.y + 12}px`
          }}
        >
          {countryTooltip.name}
        </div>
      )}

      {/* SITE TOOLTIP */}
      {siteTooltip && (
        <div
          className="hover-tooltip site-tooltip"
          style={{
            left: `${siteTooltip.x + 12}px`,
            top: `${siteTooltip.y + 12}px`
          }}
        >
          {siteTooltip.name}
        </div>
      )}

      {/* BERLIN PERSISTENT ALERT PANEL */}
      {berlinAlertOpen && (
        <div className="berlin-alert-panel">
          <button
            className="berlin-alert-close"
            onClick={() => setBerlinAlertOpen(false)}
            aria-label="Close Berlin alert"
          >
            ✕
          </button>

          <div className="berlin-alert-badge">ALARM</div>
          <h2>Berlin</h2>
          <p>
            <strong>Status:</strong> Production not meeting targets
          </p>
          <p>
            <strong>Action:</strong> Review site performance and investigate deviation
          </p>
        </div>
      )}

      {/* SITE INFO PANEL */}
      {selectedSite && (
        <div className="site-info-panel">
          <button
            className="close-btn"
            onClick={() => setSelectedSite(null)}
            aria-label="Close"
          >
            ×
          </button>

          <h2>{selectedSite.name}</h2>
          <p>
            <strong>Business Unit:</strong> {selectedSite.buName}
          </p>
          <p>
            <strong>Performance:</strong> {selectedSite.lat} <strong>%</strong>
          </p>
          <p>
            <strong>Revenue Growth: +</strong> {selectedSite.lng} <strong>%</strong>
          </p>

          <img
            src={BU_IMAGES[selectedSite.bu]}
            alt={selectedSite.buName}
            className="bu-image"
          />
        </div>
      )}
    </div>
  );
}
