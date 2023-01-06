import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as turf from '@turf/turf'; 

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {
  url : string = '';
  qualites : string[] = ['good', 'bad', 'ugly'];
  qualite : string = 'good';
  types_down: string[] = ['Video', 'audio'];
  type_down: string = 'Video';
  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void { }

  helloWorld = ()=> {}
  download = ()=> {
    if (this.url !== '') {
      console.log('download');
    }
  }
}
