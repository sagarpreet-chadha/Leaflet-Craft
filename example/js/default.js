import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { module } from "angular";
import FreeDraw, {
  NONE,
  CREATE,
  EDIT,
  DELETE,
  DELETEMARKERS,
  DELETEPOINT,
  APPEND,
  ALL,
  polygons
} from "../../src/FreeDraw";

module("leafletApp", [])
  .controller("MapController", $scope => {
    /**
     * @method setModeOnly
     * @param mode {Number}
     * @return {void}
     */
    $scope.setModeOnly = mode => {
      $scope.mode = $scope.MODES.NONE | mode;
    };
  })
  .directive("map", () => {
    return {
      /**
       * @property restrict
       * @type {String}
       */
      restrict: "C",

      /**
       * @property scope
       * @type {Object}
       */
      scope: {
        mode: "="
      },

      /**
       * @method controller
       * @param $scope {Object}
       * @return {void}
       */
      controller($scope) {
        /**
         * @constant TILE_URL
         * @type {String}
         */
        $scope.TILE_URL =
          "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png";
        // $scope.TILE_URL = 'https://tiles.lyrk.org/lr/{z}/{x}/{y}?apikey=f2ae86661a4e487bbced29a755799884';
      },

      /**
       * @method link
       * @param scope {Object}
       * @param element {Object}
       * @return {void}
       */
      link(scope, element) {
        // Instantiate L.Map and the FreeDraw layer, passing in the default mode.
        const map = new L.Map(element[0], { doubleClickZoom: false }).setView(
          [23, 80],
          6
        );
        const freeDraw = (window.freeDraw = new FreeDraw({
          mode: ALL ^ DELETEMARKERS,
          undoRedo: true
        })); // undo redo is true by default

        // Add the tile layer and the FreeDraw layer.
        L.tileLayer(scope.TILE_URL).addTo(map);
        map.addLayer(freeDraw);

        document.addEventListener("keydown", event => {
          // Cancel the current FreeDraw action when the escape key is pressed.
          event.key === "Escape" && freeDraw.cancel();
        });

        freeDraw.on("markers", event => {
          // Listen for any markers added, removed or edited, and then output the lat lng boundaries.
          console.log("LatLngs:", event.latLngs, "Polygons:", freeDraw.size());
        });

        // Exposed for testing purposes.
        window._polygons = freeDraw.all();
      }
    };
  });
