import L from 'leaflet';
import { NONE, CREATE, EDIT, DELETE, DELETEMARKERS, DELETEPOINT, APPEND, DISTANCE_FLAG } from '../FreeDraw';
import {  SetUnsetMode } from './ToolbarHelper';
import {rulerLayer} from "../ruler/ruler"

export const customControl = L.Control.extend({

    options: {
        position: 'topleft',
        circleMarker: {
          color: 'red',
          radius: 2
        },
        lineStyle: {
          color: 'red',
          dashArray: '1,6'
        },
        lengthUnit: {
          display: 'km',
          decimal: 2,
          factor: null,
          label: 'Distance:'
        },
        angleUnit: {
          display: '&deg;',
          decimal: 2,
          factor: null,
          label: 'Bearing:'
        }
      },

    initialize: function (options) {
        this.mapOptions = options;
        this._choice = false;
        // this._defaultCursor = this._map._container.style.cursor;
        this._allLayers = L.layerGroup();
    },

    addButton: function (self, togglefunction,container, mode, map, mapOptions, type, toolTip='') {

        const child = L.DomUtil.create('div', 'edit-mode-button', container);
        child.style.backgroundColor = 'white';
        child.title = toolTip;

        const icon = L.DomUtil.create('i', 'material-icons', child);
        icon.innerHTML = type;

        if (mode === NONE) {
            icon.style.opacity = 1;
            icon.style.color = '#0065ff';
        } else if(mode === DISTANCE_FLAG) {
            child.classList.add('leaflet-ruler');
            icon.style.opacity = 0.3;
            icon.style.color = 'darkslategray';
            self.options.container = child;
        }
        else {
            icon.style.opacity = 0.3;
            icon.style.color = 'darkslategray';
        }

        child.onclick = function() {

            if(mode === NONE) {
                // disable RULER
                self._choice = true;
                togglefunction(self);

                 // disable all other buttons
                 container.childNodes.forEach(element => {
                    element.firstChild.style.opacity = 0.3;
                    element.firstChild.style.color = 'darkslategray';
                });
                icon.style.opacity = 1;
                icon.style.color = '#0065ff';
                // mode = NONE
                SetUnsetMode(true, mode, map, mapOptions);
                return;
            }

            // toggle logic
            if (icon.style.opacity == 0.3) {
                
                // disable RULER
                  self._choice = true;
                  togglefunction(self);

                if(mode === DISTANCE_FLAG) {
                    // disable all other buttons
                    container.childNodes.forEach(element => {
                        element.firstChild.style.opacity = 0.3;
                        element.firstChild.style.color = 'darkslategray';
                    });
                    togglefunction(self);
                    
                }
                else if (mode === DELETEMARKERS) {
                    // disable all other buttons
                    container.childNodes.forEach(element => {
                        element.firstChild.style.opacity = 0.3;
                        element.firstChild.style.color = 'darkslategray';
                    });
                } 
                else if(mode === DELETE) {
                    // disable all other buttons
                    container.childNodes.forEach(element => {
                       element.firstChild.style.opacity = 0.3;
                       element.firstChild.style.color = 'darkslategray';
                   });
                   container.childNodes[0].firstChild.style.opacity = 1 ;
                   container.childNodes[0].firstChild.style.color = '#0065ff';
               }
                else if(mode === CREATE | EDIT | APPEND | DELETEPOINT) {
                     // disable all other buttons
                     container.childNodes.forEach(element => {
                        element.firstChild.style.opacity = 0.3;
                        element.firstChild.style.color = 'darkslategray';
                    });
                }
                else if(mode === DELETEMARKERS) {
                  
                     // disable all other buttons
                     container.childNodes.forEach(element => {
                        element.firstChild.style.opacity = 0.3;
                        element.firstChild.style.color = 'darkslategray';
                    });
                }
                icon.style.opacity = 1;
                icon.style.color = '#0065ff';
                SetUnsetMode(true, mode, map, mapOptions);
            } else {
                icon.style.opacity = 0.3;
                icon.style.color = 'darkslategray';

                if(mode === DISTANCE_FLAG) {
                    togglefunction(self);
                }

                container.childNodes[0].firstChild.style.opacity = 1 ;
                container.childNodes[0].firstChild.style.color = '#0065ff';
                SetUnsetMode(false, mode, map, mapOptions);
            }
        };
    },

    onAdd: function (map) {
        this._map = map;

        this._choice = false;
        // this._defaultCursor = this._map._container.style.cursor;
        this._allLayers = L.layerGroup();

        const container = L.DomUtil.create('div', 'edit-mode-buttons-container');
        L.DomEvent.disableClickPropagation(container);

        this.addButton(this, this._toggleMeasure, container, NONE, map, this.mapOptions, 'pan_tool', 'Disable all');
        this.addButton(this, this._toggleMeasure,container, CREATE | EDIT | APPEND | DELETEPOINT, map, this.mapOptions, 'create', 'Add Polygon');
        // this.addButton(container, EDIT, map, this.mapOptions, 'gesture', 'Edit Polygon');
        this.addButton(this, this._toggleMeasure,container, DELETE, map, this.mapOptions, 'delete', 'Delete Polygon');
        // this.addButton(container, APPEND, map, this.mapOptions, 'add', 'Add Marker');
        // this.addButton(container, DELETEPOINT, map, this.mapOptions, 'remove', 'Delete Marker');
        this.addButton(this, this._toggleMeasure,container, DELETEMARKERS, map, this.mapOptions, 'blur_off', 'Delete Multiple Markers');

        this.addButton(this, this._toggleMeasure,container, DISTANCE_FLAG, map, this.mapOptions, 'timeline', 'Distance');

        return container;
    },

    onRemove: function() {
        // L.DomEvent.off(this.options.container, 'click', this._toggleMeasure, this);
          // disable RULER
          this._choice = true;
          this._toggleMeasure(this);
      },

    _toggleMeasure: function(self) {
        console.log('toggleMeasure');
        console.log(self._choice);
        self._choice = !self._choice;
        self._clickedLatLong = null;
        self._clickedPoints = [];
        self._totalLength = 0;
        if (self._choice) {
            self._map && self._map.doubleClickZoom.disable();
            self._map && L.DomEvent.on(self._map._container, 'keydown', self._escape, self);
            self._map && L.DomEvent.on(self._map._container, 'dblclick', self._closePath, self);
            self.options && self.options.container && self.options.container.classList.add("leaflet-ruler-clicked");
          self._clickCount = 0;
          self._tempLine = L.featureGroup().addTo(self._allLayers);
          self._tempPoint = L.featureGroup().addTo(self._allLayers);
          self._pointLayer = L.featureGroup().addTo(self._allLayers);
          self._polylineLayer = L.featureGroup().addTo(self._allLayers);
          self._allLayers.addTo(self._map);
          self._map._container.style.cursor = 'crosshair';
          self._map.on('click', self._clicked, self);
          self._map.on('mousemove', self._moving, self);
        }
        else {
            // self._map.doubleClickZoom.enable();
        //   L.DomEvent.off(self._map._container, 'keydown', self._escape, self);
        //   L.DomEvent.off(self._map._container, 'dblclick', self._closePath, self);
        self.options && self.options.container && self.options.container.classList.remove("leaflet-ruler-clicked");
          self._map.removeLayer(self._allLayers);
          self._allLayers = L.layerGroup();
        //   this._map._container.style.cursor = this._defaultCursor;
        self._map.off('click', self._clicked, self);
          self._map.off('mousemove', self._moving, self);
        }
      },
      _clicked: function(e) {
        this._clickedLatLong = e.latlng;
        this._clickedPoints.push(this._clickedLatLong);
        L.circleMarker(this._clickedLatLong, this.options.circleMarker).addTo(this._pointLayer);
        if(this._clickCount > 0 && !e.latlng.equals(this._clickedPoints[this._clickedPoints.length - 2])){
          if (this._movingLatLong){
            L.polyline([this._clickedPoints[this._clickCount-1], this._movingLatLong], this.options.lineStyle).addTo(this._polylineLayer);
          }
          var text;
          this._totalLength += this._result.Distance;
          if (this._clickCount > 1){
            text = '<b>' + this.options.angleUnit.label + '</b>&nbsp;' + this._result.Bearing.toFixed(this.options.angleUnit.decimal) + '&nbsp;' + this.options.angleUnit.display + '<br><b>' + this.options.lengthUnit.label + '</b>&nbsp;' + this._totalLength.toFixed(this.options.lengthUnit.decimal) + '&nbsp;' +  this.options.lengthUnit.display;
          }
          else {
            text = '<b>' + this.options.angleUnit.label + '</b>&nbsp;' + this._result.Bearing.toFixed(this.options.angleUnit.decimal) + '&nbsp;' + this.options.angleUnit.display + '<br><b>' + this.options.lengthUnit.label + '</b>&nbsp;' + this._result.Distance.toFixed(this.options.lengthUnit.decimal) + '&nbsp;' +  this.options.lengthUnit.display;
          }
          L.circleMarker(this._clickedLatLong, this.options.circleMarker).bindTooltip(text, {permanent: true, className: 'result-tooltip'}).addTo(this._pointLayer).openTooltip();
        }
        this._clickCount++;
      },
      _moving: function(e) {
        if (this._clickedLatLong){
          L.DomEvent.off(this.options.container, 'click', this._toggleMeasure, this);
          this._movingLatLong = e.latlng;
          if (this._tempLine){
            this._map.removeLayer(this._tempLine);
            this._map.removeLayer(this._tempPoint);
          }
          var text;
          this._addedLength = 0;
          this._tempLine = L.featureGroup();
          this._tempPoint = L.featureGroup();
          this._tempLine.addTo(this._map);
          this._tempPoint.addTo(this._map);
          this._calculateBearingAndDistance();
          this._addedLength = this._result.Distance + this._totalLength;
          L.polyline([this._clickedLatLong, this._movingLatLong], this.options.lineStyle).addTo(this._tempLine);
          if (this._clickCount > 1){
            text = '<b>' + this.options.angleUnit.label + '</b>&nbsp;' + this._result.Bearing.toFixed(this.options.angleUnit.decimal) + '&nbsp;' + this.options.angleUnit.display + '<br><b>' + this.options.lengthUnit.label + '</b>&nbsp;' + this._addedLength.toFixed(this.options.lengthUnit.decimal) + '&nbsp;' +  this.options.lengthUnit.display + '<br><div class="plus-length">(+' + this._result.Distance.toFixed(this.options.lengthUnit.decimal) + ')</div>';
          }
          else {
            text = '<b>' + this.options.angleUnit.label + '</b>&nbsp;' + this._result.Bearing.toFixed(this.options.angleUnit.decimal) + '&nbsp;' + this.options.angleUnit.display + '<br><b>' + this.options.lengthUnit.label + '</b>&nbsp;' + this._result.Distance.toFixed(this.options.lengthUnit.decimal) + '&nbsp;' +  this.options.lengthUnit.display;
          }
          L.circleMarker(this._movingLatLong, this.options.circleMarker).bindTooltip(text, {sticky: true, offset: L.point(0, -40) ,className: 'moving-tooltip'}).addTo(this._tempPoint).openTooltip();
        }
      },
      _escape: function(e) {
        if (e.keyCode === 27){
          if (this._clickCount > 0){
            console.log('closepath')
            this._closePath();
          }
        //   else {
        //       console.log('I here')
        //     this._choice = true;
        //     this._toggleMeasure(this);
        //   }
        }
      },
      removeRuler: function() {

      },
      _calculateBearingAndDistance: function() {
        var f1 = this._clickedLatLong.lat, l1 = this._clickedLatLong.lng, f2 = this._movingLatLong.lat, l2 = this._movingLatLong.lng;
        var toRadian = Math.PI / 180;
        // haversine formula
        // bearing
        var y = Math.sin((l2-l1)*toRadian) * Math.cos(f2*toRadian);
        var x = Math.cos(f1*toRadian)*Math.sin(f2*toRadian) - Math.sin(f1*toRadian)*Math.cos(f2*toRadian)*Math.cos((l2-l1)*toRadian);
        var brng = Math.atan2(y, x)*((this.options.angleUnit.factor ? this.options.angleUnit.factor/2 : 180)/Math.PI);
        brng += brng < 0 ? (this.options.angleUnit.factor ? this.options.angleUnit.factor : 360) : 0;
        // distance
        var R = this.options.lengthUnit.factor ? 6371 * this.options.lengthUnit.factor : 6371; // kilometres
        var deltaF = (f2 - f1)*toRadian;
        var deltaL = (l2 - l1)*toRadian;
        var a = Math.sin(deltaF/2) * Math.sin(deltaF/2) + Math.cos(f1*toRadian) * Math.cos(f2*toRadian) * Math.sin(deltaL/2) * Math.sin(deltaL/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var distance = R * c;
        this._result = {
          Bearing: brng,
          Distance: distance
        };
      },
      _closePath: function() {
          console.log('closepath')
        this._map.removeLayer(this._tempLine);
        this._map.removeLayer(this._tempPoint);
        this._choice = false;
        L.DomEvent.on(this.options.container, 'click', this._toggleMeasure, this);
        this._toggleMeasure(this);
      }
});
