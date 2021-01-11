import createPolygon from "turf-polygon";
import { compose, head } from "ramda";

/**
 * @method latLngsToTuple
 * @param {Array} latLngs
 * @return {Array}
 */
export const latLngsToTuple = latLngs => {
  return latLngs.map(model => [model.lat, model.lng]);
};

// Transform a L.LatLng object into a GeoJSON polygon that TurfJS expects to receive.
export const toTurfPolygon = compose(
  createPolygon,
  x => [x],
  x => [...x, head(x)],
  latLngsToTuple
);
