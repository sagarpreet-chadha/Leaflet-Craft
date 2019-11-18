import Stack from "./Stack";
import { pubSub } from "../Freedraw";
import {
  mergedPolygonCreatedHandler,
  mergePolygonUndoHandler,
  mergePolygonRedoHandler,
  newPolygonCreatedHandler,
  existingPolygonEditedHandler,
  undoHandler,
  redoHandler
} from "./Handlers";

// Undo MAIN Stack that stores the sequence in which Polygons are added/edited.
export const undoMainStack = Stack();

// Map with key as PolygonID and value as Stack where Stack stores versions of a Polygon.
export const undoStackObject = new Map();

// Redo MAIN Stack that stores the sequence in which Polygons are removed.
export const redoMainStack = Stack();

// Map with key as PolygonID and value as Stack where Stack stores versions of a Polygon.
export const redoStackObject = new Map();

// Map which holds the Polygons to made when Undo operation is perfromed on Merged Polygon .
export const mergedPolygonsMap = new Map();

pubSub.subscribe("POLYGON_OVERLAPS_OTHER_POLYGON", mergedPolygonCreatedHandler);
pubSub.subscribe("UNDO_MERGED_POLYGON", mergePolygonUndoHandler);
pubSub.subscribe("REDO_MERGED_POLYGON", mergePolygonRedoHandler);
pubSub.subscribe("SIMPLE_POLYGON_CREATED", newPolygonCreatedHandler);
pubSub.subscribe(
  "POLYGON_EDITED_AND_IS_NON_OVERLAPPING",
  existingPolygonEditedHandler
);

/*
from = 0 : When existing polygon is edited -> comes from Polyfill() in Merge.js
from = 1 : When Undo operation is performed -> comes from UndoRedoDS.js
from = 2 : When new Polygon is created AND it is intersecting -> comes from Merge() in Merge.js
from = 3 : When Undo operation is performed on a Merged polygon -> comes from UndoRedo.js
*/
export function maintainStackStates(data) {
  switch (data.from) {
    case 2: {
      pubSub.publish("POLYGON_OVERLAPS_OTHER_POLYGON", data);
      return;
    }
    case 3: {
      pubSub.publish("UNDO_MERGED_POLYGON", data);
      return;
    }
    case 4: {
      pubSub.publish("REDO_MERGED_POLYGON", data);
      return;
    }
    default: {
      if (data.pid) {
        pubSub.publish("POLYGON_EDITED_AND_IS_NON_OVERLAPPING", data);
      } else {
        pubSub.publish("SIMPLE_POLYGON_CREATED", data);
      }
      return;
    }
  }
  // console.log("UNDO Stack : " + undoMainStack.show());
  // console.log("REDO Stack : " + redoMainStack.show());
}

export function clearAllStacks() {
  redoMainStack.clear();
  redoStackObject.clear();
  undoMainStack.clear();
}

export default function UndoRedo(map) {
  const undoRedoEvent = e => {
    // UNDO listener
    if (e.key === "z" && e.metaKey && !e.shiftKey) {
      undoHandler(map);
    }
    // REDO listener
    if (e.key === "z" && e.metaKey && e.shiftKey) {
      redoHandler(map);
    }
  };

  return {
    attachListeners() {
      document.addEventListener("keydown", undoRedoEvent);
    },
    removeListeners() {
      document.removeEventListener("keydown", undoRedoEvent);
    }
  };
}
