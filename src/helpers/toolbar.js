import L from 'leaflet';
import { NONE, CREATE, EDIT, DELETE, DELETEMARKERS, DELETEPOINT, APPEND } from '../FreeDraw';
import {  SetUnsetMode } from './ToolbarHelper';

export const customControl = L.Control.extend({

    options: {
        position: 'topleft'
    },

    initialize: function (options) {
        this.mapOptions = options;
    },

    addButton: function (container, mode, map, mapOptions, type, toolTip='') {

        const child = L.DomUtil.create('div', 'edit-mode-button', container);
        child.style.backgroundColor = 'white';
        child.title = toolTip;

        const icon = L.DomUtil.create('i', 'material-icons', child);
        icon.innerHTML = type;

        if (mode === NONE) {
            icon.style.opacity = 1;
            icon.style.color = '#0065ff';
        } else {
            icon.style.opacity = 0.3;
            icon.style.color = 'darkslategray';
        }

        child.onclick = function() {

            if(mode === NONE) {
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
                if (mode === DELETEMARKERS) {
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

                container.childNodes[0].firstChild.style.opacity = 1 ;
                container.childNodes[0].firstChild.style.color = '#0065ff';

                SetUnsetMode(false, mode, map, mapOptions);
            }
        };
    },

    onAdd: function (map) {

        const container = L.DomUtil.create('div', 'edit-mode-buttons-container');
        L.DomEvent.disableClickPropagation(container);

        this.addButton(container, NONE, map, this.mapOptions, 'pan_tool', 'Disable all');
        this.addButton(container, CREATE | EDIT | APPEND | DELETEPOINT, map, this.mapOptions, 'create', 'Add Polygon');
        // this.addButton(container, EDIT, map, this.mapOptions, 'gesture', 'Edit Polygon');
        this.addButton(container, DELETE, map, this.mapOptions, 'delete', 'Delete Polygon');
        // this.addButton(container, APPEND, map, this.mapOptions, 'add', 'Add Marker');
        // this.addButton(container, DELETEPOINT, map, this.mapOptions, 'remove', 'Delete Marker');
        this.addButton(container, DELETEMARKERS, map, this.mapOptions, 'blur_off', 'Delete Multiple Markers');

        return container;
    }
});
