import L from 'leaflet';
import { stopPropagation } from './ToolbarHelper';
import { modeFor } from './Flags';

export const distanceControl = L.Control.extend({

    options: {
        position: 'topleft'
    },

    addButton: function (container, map, type, toolTip='') {

        const child = L.DomUtil.create('div', 'edit-mode-button', container);
        child.style.backgroundColor = 'white';
        child.title = toolTip;

        const icon = L.DomUtil.create('i', 'material-icons', child);
        icon.innerHTML = type;
        icon.style.opacity = 0.3;
        icon.style.color = 'darkslategray';

        map.distanceIcon = icon;
        map.doubleClickZoom.disable();

        child.onclick = function (e) {

             // toggle logic
             if (icon.style.opacity == 0.3) {
                icon.style.opacity = 1;
                icon.style.color = '#0065ff';
             }
             else {
                icon.style.opacity = 0.3;
                icon.style.color = 'darkslategray';
             }

            // if (type === 'undo') {
            //     undoHandler(map);
            // } else {
            //     redoHandler(map);
            // }
            stopPropagation(e);
            e.preventDefault();
        };
    },

    onAdd: function (map) {

         const container = L.DomUtil.create('div', 'distance-button-container');
        L.DomEvent.disableClickPropagation(container);

        this.addButton(container, map, 'timeline', 'Distance');
        return container;
    }
});
