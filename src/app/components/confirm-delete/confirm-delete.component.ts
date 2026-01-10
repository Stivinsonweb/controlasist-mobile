import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  warningOutline,
  timeOutline,
  peopleOutline,
  checkmarkDoneOutline,
  barChartOutline,
  alertCircleOutline,
  closeOutline,
  trashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.component.html',
  styleUrls: ['./confirm-delete.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel
  ]
})
export class ConfirmDeleteComponent {
  @Input() asignaturaNombre: string = '';

  constructor(private modalCtrl: ModalController) {
    addIcons({
      warningOutline,
      timeOutline,
      peopleOutline,
      checkmarkDoneOutline,
      barChartOutline,
      alertCircleOutline,
      closeOutline,
      trashOutline
    });
  }

  cancelar() {
    this.modalCtrl.dismiss({ confirmed: false });
  }

  confirmar() {
    this.modalCtrl.dismiss({ confirmed: true });
  }
}