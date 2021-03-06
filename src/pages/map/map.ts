import { Component, ViewChild, ElementRef } from '@angular/core';

import { ConferenceData } from '../../providers/conference-data';


import { IonicPage, NavParams } from 'ionic-angular';

import { Geolocation } from '@ionic-native/geolocation';



declare var google: any;

@IonicPage({
  segment: 'session/:sessionId'
})
@Component({
  selector: 'page-map',
  templateUrl: 'map.html'
})
export class MapPage {
  
  hora: any
  
  session: any
    
  directionsDisplay: any =new google.maps.DirectionsRenderer;
  directionsService: any = new google.maps.DirectionsService;
  
  map: any;
  
  @ViewChild('mapCanvas') mapElement: ElementRef;
  
  constructor(
    public confData: ConferenceData,
    public navParams: NavParams,
    public geolocation: Geolocation
  ) {
    this.sethora()     
  }
  async load(){
    
    this.spawnMap();
    this.loadPoints()
  }
  clear(){
    this.map= null
  }
  ionViewDidEnter(){
    this.load()
  }
  
  ionViewLoaded(){
    this.load()
  }

  ionViewDidLoad(){
    this.loadUser();
    this.calculateAndDisplayRoute();
  }
  ionViewWillUnload(){
    this.clear()
  }
  
  FindSession() {// encontra qual a rota atual
    this.confData.load().subscribe((data: any) => {
      if (
        data &&
        data.schedule &&
        data.schedule[0] &&
        data.schedule[0].groups &&
        this.navParams.data.sessionId
      ) {
        for (const group of data.schedule[0].groups) {
          if (group && group.sessions) {
            for (const session of group.sessions) {
              if (session && session.id === this.navParams.data.sessionId) {
                this.session = session;
                break;
              }
            }
          }
        }
      }
    })
  }
  
  findRoute() {
    let secao: any = []
    this.confData.load().subscribe((data: any) => {
      if (
        data &&
        data.schedule &&
        data.schedule[0] &&
        data.schedule[0].groups
      ) {
        for (const group of data.schedule[0].groups) {
          if (group && group.sessions) {
            for (const session of group.sessions) {
              if (session) {
                secao.push(session)
              }
            }
          }
        }
      }
    })
    return secao
  }
  
  calculateAndDisplayRoute() {
    this.FindSession();
    if (this.session) {
      
      this.directionsDisplay.setPanel(document.getElementById('details'));
      
      
      let way: any = []
      let route = this.session.rota
      this.confData.getMap().subscribe((mapData: any) => {
        
        // Salva os pontos da rota atual em way 
        if(route){
          route.forEach((route) => {
            mapData.forEach((markerData: any) => {
                if (markerData.id == route)
                way.push({ location: markerData.lat + " , " + markerData.lng, stopover: false })
              })
            
          })
        }
      })
      if(way.length>0){
        let start = way[0].location
        let end = way[way.length - 1].location
        way = way.slice(1, way.length - 1)
        
        this.directionsService.route({
          destination: end,
          origin: start,
          waypoints: way,
          travelMode: 'DRIVING',
          provideRouteAlternatives: true
        }, (response, status) => {
          if (status === 'OK') {
            this.directionsDisplay.setDirections(response);
            console.log('Map is ready!');
          }
        });
      }
    }
  }
  
  sethora() {
    this.hora = new Date();
    setTimeout(() => { this.sethora() }, 1000);
  }
  setnext(horario: any) {
    var d = parseFloat(this.hora.getHours());
    var e = parseFloat(this.hora.getMinutes());
    var i = 0
    for (; i < horario.length && parseFloat(horario[i].split(":")[0]) * 60 + parseFloat(horario[i].split(":")[1]) < d * 60 + e; i++);
    return (horario[i]) ? horario[i] : "Não há mais ônibus hoje";
  }

  spawnMap() {
    this.confData.getMap().subscribe((mapData: any) => {
      let mapEle = this.mapElement.nativeElement;

      this.map = new google.maps.Map(mapEle, {
        center: mapData.find((d: any) => d.center),
        zoom: 16
      });


      google.maps.event.addListenerOnce(this.map, 'idle', () => {
        mapEle.classList.add('show-map');
      });
    })
    
    this.directionsDisplay.setMap(this.map);
    
  }
  loadUser() {
    let markerUser;

    this.geolocation.getCurrentPosition().then(position => {

      let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      console.log(position.coords.latitude + ',' + position.coords.longitude);

      markerUser = new google.maps.Marker({ //user maker for gps
        map: this.map,
        icon: new google.maps.MarkerImage('//maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
          new google.maps.Size(22, 22),
          new google.maps.Point(0, 18),
          new google.maps.Point(11, 11)),
        position: latLng
      });
      let infoWindowUser = new google.maps.InfoWindow({
        content: "<h5>Posição do usuario</h5>",
      });
      markerUser.addListener('click', () => {
        infoWindowUser.open(this.map, markerUser);
      });
    }, (err) => {
      console.log(err);
    });

    this.geolocation.watchPosition().subscribe(position => {
      var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      // set marker position
      markerUser.setPosition(latLng);
    });
    
  }

  loadPoints() {
    let Linhas: any = this.findRoute()

    this.confData.getMap().subscribe((mapData: any) => {
      console.log(mapData)
      mapData.forEach((markerData: any) => {
        let infoWindow;
        let names: any=""
        Linhas.forEach((sessao) => {
          
          if(sessao.rota){
            sessao.rota.forEach( rota=>{
              if (rota == markerData.id) {
                names += "" +
                  "<p>" +
                  "<ion-card-header> linha: " + sessao.name + "</ion-card-header>" +
                  "<ion-card-content> proxímo ônibus:" + this.setnext(sessao.util) + " </ion-card-content>" +
                  "</ion-card>" +
                  "</p>"
              }
              
            })
          }
          
        })

        infoWindow = new google.maps.InfoWindow({
          content: names
        });

        let marker = new google.maps.Marker({
          position: markerData,
          map: this.map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 4
          },
          draggable: true,
          title: markerData.name
        });

        marker.addListener('click', () => {
          infoWindow.open(this.map, marker);
        });

        // Evento que fecha a infoWindow com click no mapa
        google.maps.event.addListener(this.map, 'click', function () {
          infoWindow.close();
        });
      });
    });

  }
}
