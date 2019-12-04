import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import postcss from "rollup-plugin-postcss";

module.exports = {
  input: "implementations/react/FreeDraw.jsx",
  output: [
    {
      file: "dist/react-leaflet.js",
      format: "cjs",
      exports: "named",
      sourcemap: true,
      external: ["react", "leaflet","react-dom"]
    }
  ],
  plugins: [
    resolve(),
    commonjs({
        namedExports: {
            "node_modules/react/index.js": [
                "createContext",
                "forwardRef",
                "useContext",
                "Component",
                "Fragment",
                "Children",
                "cloneElement"
              ],
              "node_modules/leaflet/dist/leaflet-src.js": [
                  "Control",
                  "Circle",
                  "CircleMarker",
                  "DomUtil",
                  "Point",
                  "DivIcon",
                  "Marker",
                  "DomEvent",
                  "Polygon",
                  "LineUtil",
                  "FeatureGroup",
                  "GeoJSON",
                  "GridLayer",
                  "ImageOverlay",
                  "latLngBounds",
                  "LayerGroup",
                  "Map",
                  "Polyline",
                  "Popup",
                  "Rectangle",
                  "SVGOverlay",
                  "TileLayer",
                  "Tooltip",
                  "VideoOverlay"
              ],
              "node_modules/react-dom/index.js": [
                  "createPortal"
              ]
        }
    }),
    postcss({
      plugins: []
    }),
    babel({
      exclude: "node_modules/**"
    }),
    terser()
  ]
};
