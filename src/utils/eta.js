export const calculateETA = (driver, drop) => {
  const R = 6371;
  const dLat = ((drop.lat - driver.lat) * Math.PI) / 180;
  const dLon = ((drop.lon - driver.lon) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((driver.lat * Math.PI) / 180) *
      Math.cos((drop.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const minutes = Math.ceil((km / 30) * 60); // avg 30 km/h

  return { km: km.toFixed(2), minutes };
};
