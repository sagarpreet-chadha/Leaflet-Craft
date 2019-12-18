import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import postcss from "rollup-plugin-postcss";
module.exports = {
  input: "src/FreeDraw.js",
  output: [
    {
      file: "dist/leaflet-freedraw.esm.js",
      format: "esm",
      sourcemap: true,
      exports: 'named',
      external: ['ramda', 'leaflet', 'react', 'react-leaflet', 'react-dom'],
    },
    {
      file: "dist/leaflet-freedraw.web.js",
      format: "cjs",
      sourcemap: true,
      exports: 'named',
      external: ['ramda', 'leaflet', 'react', 'react-leaflet', 'react-dom'],
    },
    {
      file: "dist/leaflet-freedraw.iife.js",
      format: "iife",
      sourcemap: true,
      name: 'LeafletFreeDraw',
      exports: 'named',
      external: ['ramda', 'leaflet', 'react', 'react-leaflet', 'react-dom'],
    }
  ],
  plugins: [
    resolve(),
    commonjs({
      namedExports: {
        'node_modules/leaflet/dist/leaflet-src.js': [
          'DomUtil',
          'Point',
          'DivIcon',
          'Marker',
          'DomEvent',
          'Polygon',
          'LineUtil',
          'FeatureGroup',
          'Control',
          'Circle',
          'CircleMarker',
          'GeoJSON',
          'GridLayer',
          'ImageOverlay',
          'latLngBounds',
          'LayerGroup',
          'Map',
          'Polyline',
          'Popup',
          'Rectangle',
          'SVGOverlay',
          'TileLayer',
          'Tooltip',
          'VideoOverlay',
          'Layer'
        ],
        'node_modules/ramda/dist/ramda.js': ['flatten', 'compose', 'head', 'complement', 'identical'],
        'node_modules/react/index.js': [
          'createContext',
          'useContext',
          'forwardRef',
          'Component',
          'Fragment',
          'Children',
          'cloneElement'
        ],
        'node_modules/react-dom/index.js': [
          'createPortal'
        ]
      },
      include: 'node_modules/**'
    }),
    postcss({
      plugins: []
    }),
    babel({
      exclude: "node_modules/**"
    }),
    // terser()
  ]
};
