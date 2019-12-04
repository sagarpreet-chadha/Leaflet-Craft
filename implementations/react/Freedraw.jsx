import LeafletFreedraw, { clickUndo, clickRedo } from '../../src/FreeDraw';
import { MapLayer, withLeaflet } from 'react-leaflet';

class FreeCraft extends MapLayer {
  createLeafletElement(props) {
    return new LeafletFreedraw({ ...props });
  }

  updateLeafletElement(fromProps, toProps) {
    if (fromProps.showUndoRedoBar !== toProps.showUndoRedoBar) {
      this.leafletElement.toggleUndoRedoBar(toProps.showUndoRedoBar);
      if(!toProps.showUndoRedoBar) {
        this.leafletElement.mode(0);
      }
    }

    if (fromProps.showControlBar !== toProps.showControlBar) {
      this.leafletElement.toggleControlBar(toProps.showControlBar);
      if(!toProps.showControlBar) {
        this.leafletElement.mode(0);
      }
    }

    if (fromProps.mode != toProps.mode) {
      this.leafletElement.mode(toProps.mode);
    }
  }

  componentDidMount() {
    const { map } = this.props.leaflet;
    map.addLayer(this.leafletElement);
    this.attachEvents(map);
  }

  attachEvents(map) {
    this.leafletElement.on('markers', e => {
      if (e.eventType === 'create') {
        clickUndo(map);
        clickRedo(map);
      }
    });
    // this.leafletElement.on('mode', this.props.onModeChange);
  }

  componentWillUnmount() {
    // this.leafletElement.mode(0);
    const { map } = this.props.leaflet;
    map.removeLayer(this.leafletElement);
  }

  render() {
    return null;
  }
}

export const FreeDraw =  withLeaflet(FreeCraft);

export default withLeaflet(FreeCraft);