<template>
  <div id="viewDiv"></div>
</template>

<script>
import { loadModules } from 'esri-loader'
import axios from 'axios'
import { api } from '../config.js' // ייבוא נכון מהקובץ src/config.js

export default {
  name: 'mapView',
  props: {
    token: String,
  },
  data() {
    return {
      webmap: {},
      authToken: this.token,
    }
  },
  mounted() {
    const self = this
    loadModules([
      'esri/views/MapView',
      'esri/WebMap',
      'esri/symbols/TextSymbol',
      'esri/Graphic',
      'esri/symbols/PictureMarkerSymbol',
      'esri/geometry/support/webMercatorUtils',
      'esri/geometry/Point',
      'esri/core/watchUtils',
    ])
      .then(
        ([
          MapView,
          WebMap,
          TextSymbol,
          Graphic,
          PictureMarkerSymbol,
          webMercatorUtils,
          Point,
          watchUtils,
        ]) => {
          self.webmap = new WebMap({ basemap: 'gray-vector' })

          const view = new MapView({
            center: [-122.31, 47.6],
            container: 'viewDiv',
            map: self.webmap,
            zoom: 12,
          })

          const pinSymbol = new TextSymbol({
            color: '#f50856',
            text: '\ue61d',
            font: {
              size: 20,
              family: 'CalciteWebCoreIcons',
            },
          })

          const unicornSymbol = new PictureMarkerSymbol({
            url: '/images/unicorn-icon.png',
            width: '25px',
            height: '25px',
          })

          let pinGraphic
          let unicornGraphic

          watchUtils.watch(view, 'center', (center) => {
            self.webmap.center = center.clone().toJSON()
          })

          watchUtils.watch(view, 'extent', (extent) => {
            self.webmap.extent = extent.clone().toJSON()
          })

          view.on('click', function handleViewClick(event) {
            self.webmap.selectedPoint = event.mapPoint
            view.graphics.remove(pinGraphic)
            pinGraphic = new Graphic({
              symbol: pinSymbol,
              geometry: self.webmap.selectedPoint,
            })
            view.graphics.add(pinGraphic)
            self.enableRequest(self.webmap)
          })

          self.webmap.animate = function animate(origin, dest, callback) {
            let startTime
            const step = function animateFrame(timestamp) {
              if (!startTime) startTime = timestamp
              const progress = timestamp - startTime
              const progressPct = Math.min(progress / 2000, 1)

              const deltaLat = (dest.latitude - origin.latitude) * progressPct
              const deltaLon = (dest.longitude - origin.longitude) * progressPct
              const point = new Point({
                longitude: origin.longitude + deltaLon,
                latitude: origin.latitude + deltaLat,
              })

              view.graphics.remove(unicornGraphic)
              unicornGraphic = new Graphic({
                geometry: point,
                symbol: unicornSymbol,
              })
              view.graphics.add(unicornGraphic)

              if (progressPct < 1) {
                requestAnimationFrame(step)
              } else {
                callback()
              }
            }
            requestAnimationFrame(step)
          }
        }
      )
      .catch((err) => {
        console.error(err)
      })
  },
  methods: {
    enableRequest(ev) {
      this.$parent.enableButton(ev)
    },
    go(event) {
      this.webmap = event
      this.requestUnicorn(this.webmap.selectedPoint)
    },
    requestUnicorn(pickupLocation) {
      const self = this
      axios({
        method: 'POST',
        url: api.invokeUrl + '/ride',
        headers: {
          Authorization: self.token,
          'Content-Type': 'application/json',
        },
        data: {
          PickupLocation: {
            Latitude: pickupLocation.latitude,
            Longitude: pickupLocation.longitude,
          },
        },
      })
        .then((response) => {
          self.completeRequest(response.data)
        })
        .catch((error) => {
          console.error('Error requesting ride: ', error)
          alert('An error occurred when requesting your unicorn:\n' + error)
        })
    },
    completeRequest(unicornResponse) {
      console.log('Response received from API: ', unicornResponse)

      if (!unicornResponse || !unicornResponse.Unicorn) {
        alert('Invalid response from server.')
        return
      }

      const unicorn = unicornResponse.Unicorn
      const pronoun = unicorn.Gender === 'Male' ? 'his' : 'her'
      this.displayUpdate(
        `${unicorn.Name}, your ${unicorn.Color} unicorn, is on ${pronoun} way.`
      )

      this.animateArrival(() => {
        this.displayUpdate(`${unicorn.Name} has arrived. Giddy up!`)
      })
    },
    displayUpdate(text) {
      this.$parent.addItem(text)
      console.log(text)
    },
    animateArrival(callback) {
      const dest = this.webmap.selectedPoint
      const origin = {}

      origin.latitude =
        dest.latitude > this.webmap.center.latitude
          ? this.webmap.extent.minLat
          : this.webmap.extent.maxLat

      origin.longitude =
        dest.longitude > this.webmap.center.longitude
          ? this.webmap.extent.minLng
          : this.webmap.extent.maxLng

      this.webmap.animate(origin, dest, callback)
    },
  },
}
</script>

<style>
@import 'https://js.arcgis.com/4.3/esri/css/main.css';
</style>
