import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  peopleOutline,
  documentTextOutline,
  barChartOutline,
  settingsOutline,
  logOutOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class DashboardPage implements OnInit {
  adminName: string = 'Administrador';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      peopleOutline,
      documentTextOutline,
      barChartOutline,
      settingsOutline,
      logOutOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit() {
    console.log('✅ Dashboard de Administrador cargado');
    this.loadAdminInfo();
  }

  async loadAdminInfo() {
    const user = await this.authService.checkSession();
    // Aquí puedes cargar más información del admin si es necesario
  }

  logout() {
    this.authService.logout();
  }
}