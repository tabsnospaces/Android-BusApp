import { Component } from '@angular/core';
import { IonicPage, NavParams, NavController } from 'ionic-angular';
import { ConferenceData } from '../../providers/conference-data';

import { MapPage } from '../map/map';

@IonicPage({
  segment: 'session/:sessionId'
})
@Component({
  selector: 'page-session-detail',
  templateUrl: 'session-detail.html'
})

export class SessionDetailPage {
  session: any;
  dias: any;
  icons: any="alarm";

  constructor(
    public dataProvider: ConferenceData,
    public navParams: NavParams,
    public navCtrl: NavController
  ) {  }
  loadmap(sessionData: any){
    this.navCtrl.push(MapPage, { sessionId: sessionData.id, name: sessionData.name });
  }

  ionViewWillEnter() {
    this.dataProvider.load().subscribe((data: any) => {
      if (
        data &&
        data.schedule &&
        data.schedule[0] &&
        data.schedule[0].groups
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
}
