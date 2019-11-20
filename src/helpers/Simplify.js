import TurfUnkinkPolygon from "@turf/unkink-polygon";
import TurfClean from "@turf/clean-coords";
import TurfSimplify from "@turf/simplify";
import { polygon } from '@turf/helpers';


/**
 * @param {LatLng[]} latLngs
 * @return {LatLng[]}
 */
export default (latLngs, options) => {
      const turfPolygon = polygon([latLngs]);
      const unkinkedPolygons = TurfUnkinkPolygon(TurfSimplify(TurfClean(turfPolygon), {tolerance:  options.simplifyFactor, highQuality: true}));
      return unkinkedPolygons.features[0].geometry.coordinates;
};
