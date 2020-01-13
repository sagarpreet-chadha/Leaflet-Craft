declare module 'leaflet-craft' {
    import * as React from 'react';

    export const polygonArea: number;
    interface ReactLeafletCraftProps {
        ref: any;
        mode: number;
        onCreateEnd: (e: { eventType: string }) => void;
        onEditEnd: (e: { eventType: string }) => void;
        onRemoveEnd: (e: { eventType: string }) => void;
        showUndoRedoBar: boolean;
        showControlBar: boolean;
        simplifyFactor: number;
        smoothFactor: number;
        elbowDistance: number;
    }
    export const ReactLeafletCraft: React.ClassicComponentClass<ReactLeafletCraftProps>;

}