import L from 'leaflet';
import { CREATE, EDIT, DELETE, DELETEMARKERS, DELETEPOINT, APPEND } from '../FreeDraw';
import { toggleMode } from './ToolbarHelper';

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

        if (mode === DELETEMARKERS) {
            icon.style.opacity = 0.3;
        } else {
            icon.style.opacity = 1;
        }

        child.onclick = function() {
            // toggle logic
            if (icon.style.opacity == 0.3) {
                if (mode === DELETEMARKERS) {
                    // disable all other buttons
                    container.childNodes.forEach(element => {
                        element.firstChild.style.opacity = 0.3;
                    });
                } else {
                    container.childNodes[5].firstChild.style.opacity = 0.3;
                }
                icon.style.opacity = 1;
            } else {
                icon.style.opacity = 0.3;
            }
            toggleMode(mode, map, mapOptions);
        };
    },

    onAdd: function (map) {

        const container = L.DomUtil.create('div', 'edit-mode-buttons-container');
        L.DomEvent.disableClickPropagation(container);

        this.addButton(container, CREATE, map, this.mapOptions, 'create', 'Create Polygon');
        this.addButton(container, EDIT, map, this.mapOptions, 'gesture', 'Edit Polygon');
        this.addButton(container, DELETE, map, this.mapOptions, 'delete_forever', 'Delete Polygon');
        this.addButton(container, APPEND, map, this.mapOptions, 'add', 'Add Marker');
        this.addButton(container, DELETEPOINT, map, this.mapOptions, 'remove', 'Delete Marke');
        this.addButton(container, DELETEMARKERS, map, this.mapOptions, 'delete_sweep', 'Delete Multiple Markers');

        return container;
    }
});
