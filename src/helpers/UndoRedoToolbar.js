import L from 'leaflet';
import { stopPropagation } from './ToolbarHelper';
import { undoHandler, redoHandler } from './Handlers';
import { undoMainStack, redoMainStack } from './UndoRedo';
import { pubSub } from '../Freedraw';

export const undoRedoControl = L.Control.extend({

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
        if (type === 'undo') {
            map.undoIcon = icon;
        } else {
            map.redoIcon = icon;
        }

        map.doubleClickZoom.disable();

        child.onclick = function (e) {

            if (icon.style.opacity === 0.3) {
                return;
            }

            if (type === 'undo') {
                undoHandler(map);
            } else {
                redoHandler(map);
            }
            stopPropagation(e);
            e.preventDefault();
        };
    },

    enableDisableButton: function (data) {
        data.map.doubleClickZoom.disable();
        if (redoMainStack.empty()) {
            data.map.redoIcon.style.opacity = 0.3;
            data.map.redoIcon.style.color = 'darkslategray';
        } else {
            data.map.redoIcon.style.opacity = 1;
            data.map.redoIcon.style.color = 'black';
        }

        if (undoMainStack.empty()) {
            data.map.undoIcon.style.opacity = 0.3;
            data.map.undoIcon.style.color = 'darkslategray';
        } else {
            data.map.undoIcon.style.opacity = 1;
            data.map.undoIcon.style.color = 'black';
        }

    },

    onAdd: function (map) {

        pubSub.subscribe('STACK_STATE_UPDATED', this.enableDisableButton);
        pubSub.subscribe('POLYGON_OVERLAPS_OTHER_POLYGON', this.enableDisableButton);
        pubSub.subscribe('UNDO_MERGED_POLYGON', this.enableDisableButton);
        pubSub.subscribe('REDO_MERGED_POLYGON', this.enableDisableButton);
        pubSub.subscribe('SIMPLE_POLYGON_CREATED', this.enableDisableButton);
        pubSub.subscribe('POLYGON_EDITED_AND_IS_NON_OVERLAPPING', this.enableDisableButton);

        const container = L.DomUtil.create('div', 'undo-redo-buttons-container');
        L.DomEvent.disableClickPropagation(container);

        this.addButton(container, map, 'undo', 'Undo');
        this.addButton(container, map, 'redo', 'Redo');

        return container;
    }
});
