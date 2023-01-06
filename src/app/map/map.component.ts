import { Component, AfterViewInit  } from '@angular/core';
import * as L from 'leaflet';
import * as turf from '@turf/turf';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit  {
  private map : any;
  file :any;
  files : Array<any> = [];
  index_color = 0;
  private initMap(): void {
    this.map = L.map('map', {
      center: [ 39.8282, -98.5795 ],
      zoom: 3
    });
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
  }

  constructor() { }

  ngAfterViewInit(): void {
    this.initMap();
  }
  onFileSelected(event: any) {

    const file:File = event.target.files[0];

    if (file) {

      this.file = file;
      this.parseDocument(this.file)
    }
  }
  parseDocument(file:any): void {
    let fileReader = new FileReader()
    let colors = [ 'blue', 'gray', 'darkred', 'green', 'orange', 'purple', 'red']
    this.index_color = ( this.index_color + 1 ) % colors.length;
    fileReader.onload = async (e: any) => {
      let result = await this.extractGoogleCoords(e.target.result)
      this.files.push(result)
      //Do something with result object here
      for (const market of result){
        for (const polyline of market.polylines){
          var poly = L.polyline(polyline, {color: colors[this.index_color]});
          // this.map.addLayer(poly);
        }
      }

    }
    fileReader.readAsText(file)
    // lets find the intersection of the polygons
    if (this.files.length === 2) {
      
      console.log('starting')
      for(const market_1  of this.files[0]){
        this.index_color = ( this.index_color + 1 ) % colors.length;   
        for(const poly1 of market_1.polygons){
          for(const market_2  of this.files[1]){
            for(const poly2 of market_2.polygons){
              let polygon1 = turf.polygon([poly1]);
              let polygon2 = turf.polygon([poly2]);
              var intersection = turf.intersect(polygon1, polygon2);
              
              intersection?.geometry.coordinates.forEach
                (it  => { 
                  if ("MultiPolygon" === intersection?.geometry.type) {
                    console.log('MultiPolygon');
                    it.forEach((pol: any) => {
                      let poly :[number, number][]= pol.map((item: any) => [Number(item[0]), Number(item[1])])
                      var polyte = L.polyline(poly, {color: colors[this.index_color]});
                      this.map.addLayer(polyte);
                    })
                  } else {
                    let poly :[number, number][]= it.map((item: any) => [Number(item[0]), Number(item[1])])
                    var polyte = L.polyline(poly, {color: colors[this.index_color]});
                    console.log(polyte)
                    this.map.addLayer(polyte);
                  }
                }) // to calculate the area of the intersection var area = turf.area(polygon);
            }
          }
        }
      }
      console.log('ending')
    }
  }

  async extractGoogleCoords(plainText: string) {
    let parser = new DOMParser()
    let xmlDoc = parser.parseFromString(plainText, "text/xml")
    let googleMarkers = []

    if (xmlDoc.documentElement.nodeName == "kml") {
      let name 
      console.log(xmlDoc.getElementsByTagName('Placemark').length)
      for (const item of xmlDoc.getElementsByTagName('Placemark') as any) {
        let googlePolygons = []
        let googlePolylines = []

        name = item.getElementsByTagName('name')[0].childNodes[0].nodeValue.trim()
        let polygons = item.getElementsByTagName('Polygon')
        let markers = item.getElementsByTagName('Point')
        /** POLYGONS PARSE **/        
        for (const polygon of polygons) {
          let coords = polygon.getElementsByTagName('coordinates')[0].childNodes[0].nodeValue.trim()
          let points = coords.split(" ")
          let googlepolylinesPaths = []
          let googlePolygonsPaths = []
          for (const point of points) {
            if (point.length == 0) continue
            let coord = point.split(",")
            googlepolylinesPaths.push([coord[1], coord[0]])
            googlePolygonsPaths.push([Number(coord[1]), Number(coord[0])])
          }
          googlePolygons.push(googlePolygonsPaths)
          googlePolylines.push(googlepolylinesPaths)
        }

      // /** MARKER PARSE **/    
      // for (const marker of markers) {
      //   var coords = marker.getElementsByTagName('coordinates')[0].childNodes[0].nodeValue.trim()
      //   let coord = coords.split(",")
      //   googleMarkers.push({ lat: +coord[1], lng: +coord[0] })
      // }
      googleMarkers.push({ names: name , polygons: googlePolygons , polylines: googlePolylines})
    }
  } else {
      throw "error while parsing"
  }

  return googleMarkers;
  }
}

