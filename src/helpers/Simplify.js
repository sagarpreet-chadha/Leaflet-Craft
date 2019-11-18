import TurfUnkinkPolygon from "@turf/unkink-polygon";
import TurfClean from "@turf/clean-coords";
import { polygon } from "@turf/helpers";

/**
 * @param {LatLng[]} latLngs
 * @return {LatLng[]}
 */
export default latLngs => {
  const turfPolygon = polygon([latLngs]);
  const unkinkedPolygons = TurfUnkinkPolygon(TurfClean(turfPolygon));
  return unkinkedPolygons.features[0].geometry.coordinates;
};
