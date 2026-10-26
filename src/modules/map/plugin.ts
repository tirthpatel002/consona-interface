import { definePlugin } from '../../core/plugin'
import {
  Map,
  GlobeMap,
  MapControls,
  MapLegend,
  MapMarker,
  MapPopup,
  MapHover,
  MapSearch,
  MapRoute,
  MapPath,
  MapGeoJSON,
  MapShape,
  MapArc,
  MapClusterLayer,
} from './components'

export const MapPlugin = definePlugin({
  name: 'map',
  version: '1.0.0',
  components: {
    Map,
    GlobeMap,
    MapControls,
    MapLegend,
    MapMarker,
    MapPopup,
    MapHover,
    MapSearch,
    MapRoute,
    MapPath,
    MapGeoJSON,
    MapShape,
    MapArc,
    MapClusterLayer,
  },
})
