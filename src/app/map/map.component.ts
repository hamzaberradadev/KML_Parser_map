import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import * as turf from '@turf/turf';



@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  private map: any;
  file: any;
  files: Array<any> = [];
  index_color = 0;
  colors = ['blue', 'gray', 'darkred', 'green', 'orange', 'purple', 'red']
  private initMap(): void {
    this.map = L.map('map', {
      center: [39.8282, -98.5795],
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

    const file: File = event.target.files[0];

    if (file) {

      this.file = file;
      this.parseDocument(this.file)
    }
  }
  parseDocument(file: any): void {
    let fileReader = new FileReader()

    this.index_color = (this.index_color + 1) % this.colors.length;
    fileReader.onload = async (e: any) => {
      let result: Array<any> = await this.extractGoogleCoords(e.target.result)
      this.files.push(result)
      this.generate_intersection()
      //Do something with result object here
      // for (const market of result){
      //   for (const polyline of market.polylines){
      //     var poly = L.polyline(polyline, {color: this.colors[this.index_color]});
      //     // this.map.addLayer(poly);
      //   }
      // }
    }
    fileReader.readAsText(file)

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
        let description = parser.parseFromString(item.getElementsByTagName('description')[0].childNodes[0].nodeValue.trim(), "text/html")
        let tier = description.getElementsByTagName('tbody')[0].childNodes[0].childNodes[1].textContent
        name = item.getElementsByTagName('name')[0].childNodes[0].nodeValue.trim()
        let polygons = item.getElementsByTagName('Polygon')
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
        googleMarkers.push({ names: name, polygons: googlePolygons, polylines: googlePolylines, tier: tier })
      }
      return googleMarkers;
    } else {
      throw "error while parsing"
    }
  }

  generate_intersection(): void {

    if (this.files.length >= 2) {
      let result = new Map();
      console.log('starting')
      for (const market_1 of this.files[0]) {
        this.index_color = (this.index_color + 1) % this.colors.length;
        let total_v = 0
        let found_v = 0
        for (const poly1 of market_1.polygons) {
          let polygon1 = turf.polygon([poly1]);
          total_v += turf.area(polygon1)
          for (const market_2 of this.files[1]) {
            for (const poly2 of market_2.polygons) {
              let polygon2 = turf.polygon([poly2]);
              var intersection = turf.intersect(polygon1, polygon2);

              
              intersection?.geometry.coordinates.forEach
                (it => {
                  if ("MultiPolygon" === intersection?.geometry.type) {
                    it.forEach((pol: any) => {
                      let poly: [number, number][] = pol.map((item: any) => [Number(item[0]), Number(item[1])])
                      found_v +=  turf.area(turf.polygon([poly]))
                      var polyte = L.polyline(poly, { color: this.colors[this.index_color] });
                      this.map.addLayer(polyte);
                    })
                  } else {
                    let poly: [number, number][] = it.map((item: any) => [Number(item[0]), Number(item[1])])
                    found_v +=  turf.area(turf.polygon([poly]))
                    var polyte = L.polyline(poly, { color: this.colors[this.index_color] });
                    this.map.addLayer(polyte);
                  }
                }) // to calculate the area of the intersection var area = turf.area(polygon);
            }
            result.set(`${market_1.tier}/${market_2.tier}`, total_v/found_v )
          }
        }
      }
      const obj = Object.fromEntries(result);
      let string_result = JSON.stringify(obj);
      console.log(obj)
      console.log('ending')
      this.create_save_txt(string_result)
    }

  }
  create_save_txt(content:string): void{
    // Create element with <a> tag
    const link = document.createElement("a");

    // Create a blog object with the file content which you want to add to the file
    const file = new Blob([content], { type: 'text/plain' });

    // Add file content in the object URL
    link.href = URL.createObjectURL(file);

    // Add file name
    link.download = "result.json";

    // Add click event to <a> tag to save file.
    link.click();
    URL.revokeObjectURL(link.href);

  }
}

