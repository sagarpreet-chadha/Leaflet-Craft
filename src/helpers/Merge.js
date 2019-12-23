
import { identical, complement } from 'ramda';
import isIntersecting from 'turf-intersect';
import { polygonID } from '../FreeDraw';
import { createFor, removeFor } from './Polygon';
import { clearAllStacks } from './UndoRedo';
import { toTurfPolygon } from './Utils';
import TurfUnkinkPolygon from "@turf/unkink-polygon";
import TurfClean from "@turf/clean-coords";
import TurfUnion from "@turf/union";


/**
 * @method fillPolygon
 * @param {Object} map
 * @param {Array} polygons
 * @param {Object} options
 * @return {Array}
 */
export function fillPolygon(map, polygon, options) {

    const turfPolygon = toTurfPolygon(polygon.getLatLngs()[0]);
    const unkinkedPolygons = TurfUnkinkPolygon(TurfClean(turfPolygon));
    const pid = polygon[polygonID];
    removeFor(map, polygon);

    unkinkedPolygons.features.map(feature => {
        createFor(
        map,
        feature.geometry.coordinates[0],
        options,
        true,
        pid,
        0
        );
    });
}


function returnIntersections(map, polygons) {

    const analysis = polygons.reduce((accum, polygon) => {
        const latLngs = polygon.getLatLngs()[0];
        const turfPolygon = toTurfPolygon(latLngs);

        // Determine if the current polygon intersects any of the other polygons currently on the map.
        const intersects = polygons.filter(complement(identical(polygon))).some(polygon => {
            return Boolean(isIntersecting(turfPolygon, toTurfPolygon(polygon.getLatLngs()[0])));
        });

        const key = intersects ? 'intersecting' : 'rest';

        return {
            ...accum,
            [key]: [...accum[key], latLngs],
            intersectingPolygons: intersects ? [...accum.intersectingPolygons, polygon] : accum.intersectingPolygons
        };

    }, { intersecting: [], rest: [], intersectingPolygons: [] });

    return analysis;
}

export function isIntersectingPolygon(map, polygons) {
    const analysis = returnIntersections(map, polygons);
    if (analysis.intersectingPolygons.length !== 0) {
        return true;
    }
    return false;
}

/**
 * @param {Object} map
 * @param {Array} polygons
 * @param {Object} options
 * @return {Array}
 */
export default (map, polygons, options) => {

    const analysis = returnIntersections(map, polygons);

    // Merge all of the polygons.
    const intersectingTurfPolygons = analysis.intersecting.map(latLngs =>
        toTurfPolygon(latLngs)
    );

    // Remove all of the existing polygons that are intersecting another polygon.
    analysis.intersectingPolygons.forEach(polygon => removeFor(map, polygon));

    if(intersectingTurfPolygons.length) {
        const mergePolygons = TurfUnion(...intersectingTurfPolygons);

        // Create the polygon, but this time prevent any merging, otherwise we'll find ourselves
        // in an infinite loop.
        options.mergedFromPolygons = analysis.intersectingPolygons;
        options.currentOverlappingPolygon && (options.mergedFromPolygons = options.mergedFromPolygons.filter(polygon =>
            polygon[polygonID] !== options.currentOverlappingPolygon[polygonID]
        ));

        const isMultiPolygon = mergePolygons.geometry.type === "MultiPolygon";
        const coordinates = mergePolygons.geometry.coordinates;

        // Not handling Self-Intersecting case .
        const updateStackState = !isMultiPolygon;
        // Also if Self-intersecting case found, clear all Stacks and Undo-Redo feature will not work until we have removed all Self-intersections.
        !updateStackState && clearAllStacks();

        const polygonsToCreate = isMultiPolygon
            ? coordinates.map(coords => {
                createFor(map, coords[0], options, true,  0, 2, updateStackState); // pid = 0 bcoz to create new Polygon
                })
            : createFor(map, coordinates[0], options, true,  0, 2, updateStackState); // pid = 0 bcoz to create new Polygon
        return polygonsToCreate;
    }

    return [];
};
