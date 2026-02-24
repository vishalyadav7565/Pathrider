import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";

export default function DestinationSearch({ onSelect }) {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      autoClose: true,
      retainZoomLevel: false,
      showMarker: false,
      searchLabel: "Enter destination location",
    });

    map.addControl(searchControl);

    map.on("geosearch/showlocation", (result) => {
      onSelect({
        lat: result.location.y,
        lon: result.location.x,
      });
    });

    return () => map.removeControl(searchControl);
  }, [map, onSelect]);

  return null;
}
