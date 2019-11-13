import "regenerator-runtime/runtime";
import "./styles/app.css";

import { FeatureGroup, Point } from "leaflet";
import { select } from "d3-selection";
import { line, curveMonotoneX } from "d3-shape";
import Set from "es6-set";
import WeakMap from "es6-weak-map";
import Symbol from "es6-symbol";
import createPolygon from "turf-polygon";
import { compose, head } from "ramda";
import * as turf from "@turf/helpers";
import pointsWithinPolygon from "@turf/points-within-polygon";
import { updateFor } from "./helpers/Layer";
import { createFor, removeFor, clearFor } from "./helpers/Polygon";
import {
  CREATE,
  EDIT,
  DELETE,
  APPEND,
  DELETEMARKERS,
  DELETEPOINT,
  EDIT_APPEND,
  NONE,
  ALL,
  modeFor
} from "./helpers/Flags";
import simplifyPolygon from "./helpers/Simplify";
import UndoRedo from "./helpers/UndoRedo";
import { latLngsToClipperPoints } from "./helpers/Simplify";
import PubSub from "./helpers/PubSub";
import {
  maintainStackStates,
  undoMainStack,
  undoStackObject,
  redoMainStack,
  redoStackObject,
  mergedPolygonsMap
} from "./helpers/UndoRedo";
import { customControl } from "./helpers/toolbar";
import { undoRedoControl } from "./helpers/UndoRedoToolbar";
import {undoHandler, redoHandler} from "./helpers/Handlers";


/**
 * @constant polygons
 * @type {WeakMap}
 */
export const polygons = new WeakMap();

const {publish, subscribe, clear} = PubSub();
export const pubSub = {publish, subscribe};

/**
 * @constant defaultOptions
 * @type {Object}
 */
export const defaultOptions = {
  mode: ALL ^ DELETEMARKERS,
  smoothFactor: 0.3,
  elbowDistance: 10,
  simplifyFactor: 1.1,
  mergePolygons: true,
  concavePolygon: true,
  maximumPolygons: Infinity,
  notifyAfterEditExit: false,
  leaveModeAfterCreate: false,
  strokeWidth: 2,
  undoRedo: true,
  showUndoRedoBar: true,
  showControlBar: true, 
  onCreateStart: () => {},
  onCreateEnd: () => {},
  onEditStart: () => {},
  onEditEnd: () => {},
  onRemoveStart: () => {},
  onRemoveEnd: () => {}
};

/**
 * @constant instanceKey
 * @type {Symbol}
 */
export const instanceKey = Symbol("freedraw/instance");

/**
 * @constant modesKey
 * @type {Symbol}
 */
export const modesKey = Symbol("freedraw/modes");

/**
 * @constant notifyDeferredKey
 * @type {Symbol}
 */
export const notifyDeferredKey = Symbol("freedraw/notify-deferred");

/**
 * @constant edgesKey
 * @type {Symbol}
 */
export const edgesKey = Symbol("freedraw/edges");
export const rawLatLngKey = Symbol("freedraw/rawLatLngs");
export const polygonID = Symbol("freedraw/polygonID");
export const polygonArea = Symbol("freedraw/polygonArea");
/**
 * @constant cancelKey
 * @type {Symbol}
 */
const cancelKey = Symbol("freedraw/cancel");

export default class FreeDraw extends FeatureGroup {
  /**
   * @constructor
   * @param {Object} [options = {}]
   * @return {void}
   */
  constructor(options = defaultOptions) {
    super();
    this.options = { ...defaultOptions, ...options };
  }

  toggleUndoRedoBar(show) {
    if(show) {
      this.undoRedoBar = new undoRedoControl(this.options);
      this.map.addControl(this.undoRedoBar);
    }
    else {
      this.map.removeControl(this.undoRedoBar);
    }
  }
  
  toggleControlBar(show) {
    if(show) {
      this.controlBar = new customControl(this.options);
      this.map.addControl(this.controlBar);
    }
    else {
      this.map.removeControl(this.controlBar);
    }
  }

  /**
   * @method onAdd
   * @param {Object} map
   * @return {void}
   */
  onAdd(map) {    
    // Memorise the map instance.
    this.map = map;

    // Attach the cancel function and the instance to the map.
    map[cancelKey] = () => {};
    map[instanceKey] = this;
    map[notifyDeferredKey] = () => {};

    // Setup the dependency injection for simplifying the polygon.
    map.simplifyPolygon = simplifyPolygon;

    // Add the item to the map.
    polygons.set(map, new Set());

    // Set the initial mode.
    modeFor(map, this.options.mode, this.options);

    // Instantiate the SVG layer that sits on top of the map.
    const svg = (this.svg = select(map._container)
      .append("svg")
      .classed("free-draw", true)
      .attr("width", "100%")
      .attr("height", "100%")
      .style("pointer-events", "none")
      .style("z-index", "1001")
      .style("position", "relative"));

    // Set the mouse events.
    this.listenForEvents(map, svg, this.options);

    if (this.options.undoRedo) {
       this.history = UndoRedo(map);
      // Set Undo Redo Listeners
      this.history.attachListeners();
      pubSub.subscribe("Add_Undo_Redo", maintainStackStates);
      if(this.options.showUndoRedoBar) {
         //  map.addControl(new undoRedoControl(this.options));
          this.toggleUndoRedoBar(true);
      }
    }

    pubSub.subscribe('create-start', this.options.onCreateStart);
    pubSub.subscribe('create-end', this.options.onCreateEnd);
    pubSub.subscribe('edit-start', this.options.onEditStart);
    pubSub.subscribe('edit-end', this.options.onEditEnd);
    pubSub.subscribe('remove-start', this.options.onRemoveStart);
    pubSub.subscribe('remove-end', this.options.onRemoveEnd);

    if(this.options.showControlBar) {
      //  map.addControl(new customControl(this.options));
        this.toggleControlBar(true);
    }
  }

  /**
   * @method onRemove
   * @param {Object} map
   * @return {void}
   */
  onRemove(map) {
    // Remove the item from the map.
    polygons.delete(map);

    // Remove the SVG layer.
    this.svg.remove();

    // Remove the appendages from the map container.
    delete map[cancelKey];
    delete map[instanceKey];
    delete map.simplifyPolygon;

    this.history.removeListeners();
    undoMainStack.clear();
    redoMainStack.clear();
    undoStackObject.clear();
    redoStackObject.clear();
    mergedPolygonsMap.clear();
    // clear events
    clear();

  }

  /**
   * @method create
   * @param {LatLng[]} latLngs
   * @param {Object} [options = { concavePolygon: false }]
   * @return {Object}
   */
  create(latLngs, options = { concavePolygon: false }) {
   
    const created = createFor(this.map, latLngs, {
      ...this.options,
      ...options
    });
    pubSub.publish("create-end");
    updateFor(this.map, "create");
    return created;
  }

  /**
   * @method remove
   * @param {Object} polygon
   * @return {void}
   */
  remove(polygon) {
    polygon ? removeFor(this.map, polygon) : super.remove();
    // updateFor(this.map, "remove");
  }

  /**
   * @method clear
   * @return {void}
   */
  clear() {
    clearFor(this.map);
    updateFor(this.map, "clear");
    undoMainStack.clear();
    redoMainStack.clear();
    undoStackObject.clear();
    redoStackObject.clear();
    mergedPolygonsMap.clear();
  }

  /**
   * @method setMode
   * @param {Number} [mode = null]
   * @return {Number}
   */
  mode(mode = null) {
    // Set mode when passed `mode` is numeric, and then yield the current mode.
    typeof mode === "number" && modeFor(this.map, mode, this.options);
    return this.map[modesKey];
  }

  toggleMode(mode = null) {
    // Set mode when passed `mode` is numeric, and then yield the current mode.
    
    // Update the mode.
    this.map[modesKey] = mode;

    // Fire the updated mode.
    this.map[instanceKey].fire('mode', { mode });
  }

  /**
   * @method size
   * @return {Number}
   */
  size() {
    return polygons.get(this.map).size;
  }

  /**
   * @method all
   * @return {Array}
   */
  all() {
    return polygons.get(this.map);
  }

  /**
   * @method cancel
   * @return {void}
   */
  cancel() {
    this.map[cancelKey]();
  }

  /**
   * @method listenForEvents
   * @param {Object} map
   * @param {Object} svg
   * @param {Object} options
   * @return {void}
   */
  listenForEvents(map, svg, options) {
    /**
     * @method mouseDown
     * @param {Object} event
     * @return {void}
     */
    const mouseDown = event => {
      if (map[modesKey] & DELETEMARKERS) {
        const latLngs = new Set();
        const lineIterator = this.createPath(
          svg,
          map.latLngToContainerPoint(event.latlng),
          options.strokeWidth
        );
        const mouseMove = event => {
          // Resolve the pixel point to the latitudinal and longitudinal equivalent.
          const point = map.mouseEventToContainerPoint(event.originalEvent);

          // Push each lat/lng value into the points set.
          latLngs.add(map.containerPointToLatLng(point));

          // Invoke the generator by passing in the starting point for the path.
          lineIterator(new Point(point.x, point.y));
        };

        // Create the path when the user moves their cursor.
        map.on("mousemove touchmove", mouseMove);

        const mouseUp = () => {
          // Remove the ability to invoke `cancel`.
          map[cancelKey] = () => {};

          // Stop listening to the events.
          map.off("mouseup", mouseUp);
          map.off("mousemove", mouseMove);
          "body" in document &&
            document.body.removeEventListener("mouseleave", mouseUp);

          // Clear the SVG canvas.
          svg.selectAll("*").remove();

          this.colorMarkersTobeDeleted(latLngs);
        };

        // Clear up the events when the user releases the mouse.
        map.on("mouseup touchend", mouseUp);
        "body" in document &&
          document.body.addEventListener("mouseleave", mouseUp);

        // Setup the function to invoke when `cancel` has been invoked.
        map[cancelKey] = () => mouseUp({}, false);

        return;
      }

      if (!(map[modesKey] & CREATE)) {
        // Polygons can only be created when the mode includes create.
        return;
      }

      /**
       * @constant latLngs
       * @type {Set}
       */
      const latLngs = new Set();

      // Create the line iterator and move it to its first `yield` point, passing in the start point
      // from the mouse down event.
      const lineIterator = this.createPath(
        svg,
        map.latLngToContainerPoint(event.latlng),
        options.strokeWidth
      );

      /**
       * @method mouseMove
       * @param {Object} event
       * @return {void}
       */
      const mouseMove = event => {
        // Resolve the pixel point to the latitudinal and longitudinal equivalent.
        const point = map.mouseEventToContainerPoint(event.originalEvent);

        // Push each lat/lng value into the points set.
        latLngs.add(map.containerPointToLatLng(point));

        // Invoke the generator by passing in the starting point for the path.
        lineIterator(new Point(point.x, point.y));
      };

      // Create the path when the user moves their cursor.
      map.on("mousemove touchmove", mouseMove);

      /**
       * @method mouseUp
       * @param {Boolean} [create = true]
       * @return {Function}
       */
      const mouseUp = async (_, create = true) => {
        // Remove the ability to invoke `cancel`.
        map[cancelKey] = () => {};

        // Stop listening to the events.
        map.off("mouseup", mouseUp);
        map.off("mousemove", mouseMove);
        "body" in document &&
          document.body.removeEventListener("mouseleave", mouseUp);

        // Clear the SVG canvas.
        svg.selectAll("*").remove();

        if (create) {
          // ...And finally if we have any lat/lngs in our set then we can attempt to
          // create the polygon.
          if(latLngs.size >= 3) {
            const response = await pubSub.publish("create-start");
            if (response && response.interrupt) {
              return;
            }
            
            createFor(map, Array.from(latLngs), options);

            // Finally invoke the callback for the polygon regions.
            updateFor(map, "create");
            pubSub.publish("create-end");
            
            // Exit the `CREATE` mode if the options permit it.
            options.leaveModeAfterCreate && this.mode(this.mode() ^ CREATE);
          }
        }
      };

      // Clear up the events when the user releases the mouse.
      map.on("mouseup touchend", mouseUp);
      "body" in document &&
        document.body.addEventListener("mouseleave", mouseUp);

      // Setup the function to invoke when `cancel` has been invoked.
      map[cancelKey] = () => mouseUp({}, false);
    };

    map.on("mousedown touchstart", mouseDown);
  }

  colorMarkersTobeDeleted(latLngs) {
    if (!latLngs || latLngs.size < 3) {
      return;
    }
    latLngs = Array.from(latLngs).map(model => [model.lat, model.lng]);
    const toTurfPolygon = compose(
      createPolygon,
      x => [x],
      x => [...x, head(x)]
    );
    const turfPolygon = toTurfPolygon(Array.from(latLngs));

    const allPolygons = this.all();

    Array.from(allPolygons).map(p => {
      const latLngArr = p[rawLatLngKey].map(model => [model.lat, model.lng]);
      const turfPoints = turf.points(latLngArr);

      const containedMarkers = pointsWithinPolygon(turfPoints, turfPolygon);

      if (containedMarkers.features.length !== 0) {
        const selectedMarkers = [];
        containedMarkers.features.map(f =>
          selectedMarkers.push(f.geometry.coordinates)
        );
        const newlatLngArr = latLngArr.filter(ll => {
          return !selectedMarkers.some(sm => sm === ll);
        });

        removeFor(this.map, p);
        if (newlatLngArr.length > 2) {
          p.setLatLngs(newlatLngArr);
          const points = latLngsToClipperPoints(this.map, p.getLatLngs()[0]);

          const newLatLngs = points.map(model =>
            this.map.layerPointToLatLng(new Point(model.X, model.Y))
          );

          createFor(this.map, newLatLngs, this.options, true, p[polygonID], 0);
        } else {
          undoMainStack.push(p[polygonID]);
          undoStackObject[p[polygonID]].push(null);
        }
      }
      return p;
    });
  }

  /**
   * @method createPath
   * @param {Object} svg
   * @param {Point} fromPoint
   * @param {Number} strokeWidth
   * @return {void}
   */
  createPath(svg, fromPoint, strokeWidth) {
    let lastPoint = fromPoint;

    const lineFunction = line()
      .curve(curveMonotoneX)
      .x(d => d.x)
      .y(d => d.y);

    return toPoint => {
      const lineData = [lastPoint, toPoint];
      lastPoint = toPoint;
      // Draw SVG line based on the last movement of the mouse's position.
      svg
        .append("path")
        .classed("leaflet-line", true)
        .attr("d", lineFunction(lineData))
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", strokeWidth);
    };
  }
}

/**
 * @method freeDraw
 * @return {Object}
 */
export const freeDraw = options => {
  return new FreeDraw(options);
};

export {
  CREATE,
  EDIT,
  DELETE,
  APPEND,
  EDIT_APPEND,
  NONE,
  ALL,
  DELETEMARKERS,
  DELETEPOINT
} from "./helpers/Flags";

export const clickUndo = (map) => {
  undoHandler(map);
}

export const clickRedo = (map) => {
  redoHandler(map);
}

if (typeof window !== "undefined") {
  // Attach to the `window` as `FreeDraw` if it exists, as this would prevent `new FreeDraw.default` when
  // using the web version.
  window.FreeDraw = FreeDraw;
  FreeDraw.CREATE = CREATE;
  FreeDraw.EDIT = EDIT;
  FreeDraw.DELETE = DELETE;
  FreeDraw.DELETEMARKERS = DELETEMARKERS;
  FreeDraw.DELETEPOINT = DELETEPOINT;
  FreeDraw.APPEND = APPEND;
  FreeDraw.EDIT_APPEND = EDIT_APPEND;
  FreeDraw.NONE = NONE;
  FreeDraw.ALL = ALL;
}
