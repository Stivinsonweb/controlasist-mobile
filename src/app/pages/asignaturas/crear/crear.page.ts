import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  LoadingController,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  saveOutline,
  closeOutline,
  bookOutline,
  codeOutline,
  schoolOutline,
  documentsOutline,
  businessOutline,
  calendarOutline,
  colorPaletteOutline,
  peopleOutline,
  trendingUpOutline,
  documentTextOutline,
  desktopOutline,
  locationOutline,
  checkmark
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-crear',
  templateUrl: './crear.page.html',
  styleUrls: ['./crear.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption
  ]
})
export class CrearPage implements OnInit {
  asignaturaForm!: FormGroup;
  isLoading = false;
  docente: any = null;

  modalidades = [
    { value: 'Presencial', label: 'Presencial' },
    { value: 'Virtual', label: 'Virtual' },
    { value: 'Híbrida', label: 'Híbrida' }
  ];

  colores = [
    { value: '#3b82f6', label: 'Azul' },
    { value: '#10b981', label: 'Verde' },
    { value: '#f59e0b', label: 'Naranja' },
    { value: '#ef4444', label: 'Rojo' },
    { value: '#8b5cf6', label: 'Púrpura' },
    { value: '#ec4899', label: 'Rosa' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#84cc16', label: 'Lima' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private supabase: SupabaseService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      saveOutline,
      closeOutline,
      bookOutline,
      codeOutline,
      schoolOutline,
      documentsOutline,
      businessOutline,
      calendarOutline,
      colorPaletteOutline,
      peopleOutline,
      trendingUpOutline,
      documentTextOutline,
      desktopOutline,
      locationOutline,
      checkmark
    });
  }

  async ngOnInit() {
    this.initForm();
    await this.loadDocenteInfo();
  }

  initForm() {
    this.asignaturaForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      codigo: ['', [Validators.required, Validators.minLength(2)]],
      grupo: ['A', [Validators.required]],
      facultad: [''],
      programa: [''],
      nivel: ['', [Validators.required]],
      periodo: ['', [Validators.required]],
      cds: [''],
      creditos: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      modalidad: ['Presencial', [Validators.required]],
      aula: [''],
      color: ['#3b82f6', [Validators.required]],
      activa: [true]
    });
  }

  async loadDocenteInfo() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }

      const { data: docenteData, error } = await this.supabase
        .from('docentes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      this.docente = docenteData;
      console.log('✅ Docente cargado:', this.docente);

      // Pre-llenar facultad y programa si el docente los tiene
      if (this.docente.entidad) {
        this.asignaturaForm.patchValue({
          facultad: this.docente.entidad
        });
      }
      
      if (this.docente.programa) {
        this.asignaturaForm.patchValue({
          programa: this.docente.programa
        });
      }
    } catch (error) {
      console.error('❌ Error cargando docente:', error);
      await this.showAlert('Error', 'No se pudo cargar la información del docente');
    }
  }

  async crear() {
    if (this.asignaturaForm.valid && this.docente) {
      const loading = await this.loadingController.create({
        message: 'Creando asignatura...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const formData = this.asignaturaForm.value;

        console.log('📝 Datos a enviar:', {
          docente_id: this.docente.id,
          ...formData
        });

        const { data, error } = await this.supabase
          .from('asignaturas')
          .insert([
            {
              docente_id: this.docente.id,
              nombre: formData.nombre,
              codigo: formData.codigo,
              grupo: formData.grupo,
              facultad: formData.facultad || null,
              programa: formData.programa || null,
              nivel: formData.nivel,
              periodo: formData.periodo,
              cds: formData.cds || null,
              creditos: formData.creditos,
              modalidad: formData.modalidad,
              aula: formData.aula || null,
              color: formData.color,
              activa: formData.activa
            }
          ])
          .select()
          .single();

        await loading.dismiss();

        if (error) {
          console.error('❌ Error de Supabase:', error);
          throw error;
        }

        console.log('✅ Asignatura creada:', data);

        await this.showToast('✓ Asignatura creada exitosamente', 'success');
        this.router.navigate(['/home']);

      } catch (error: any) {
        await loading.dismiss();
        console.error('❌ Error creando asignatura:', error);
        await this.showAlert('Error', error.message || 'No se pudo crear la asignatura');
      }
    } else {
      // Validaciones específicas
      if (!this.docente) {
        await this.showToast('No se pudo obtener la información del docente', 'danger');
        return;
      }

      if (this.nombre?.hasError('required')) {
        await this.showToast('El nombre es requerido', 'warning');
      } else if (this.nombre?.hasError('minlength')) {
        await this.showToast('El nombre debe tener al menos 3 caracteres', 'warning');
      } else if (this.codigo?.hasError('required')) {
        await this.showToast('El código es requerido', 'warning');
      } else if (this.grupo?.hasError('required')) {
        await this.showToast('El grupo es requerido', 'warning');
      } else if (this.nivel?.hasError('required')) {
        await this.showToast('El nivel es requerido', 'warning');
      } else if (this.periodo?.hasError('required')) {
        await this.showToast('El periodo es requerido', 'warning');
      } else if (this.creditos?.hasError('required')) {
        await this.showToast('Los créditos son requeridos', 'warning');
      } else if (this.creditos?.hasError('min') || this.creditos?.hasError('max')) {
        await this.showToast('Los créditos deben estar entre 1 y 10', 'warning');
      } else {
        await this.showToast('Por favor completa todos los campos requeridos', 'warning');
      }
    }
  }

  cancelar() {
    this.router.navigate(['/home']);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  // Getters para validación
  get nombre() { return this.asignaturaForm.get('nombre'); }
  get codigo() { return this.asignaturaForm.get('codigo'); }
  get grupo() { return this.asignaturaForm.get('grupo'); }
  get facultad() { return this.asignaturaForm.get('facultad'); }
  get programa() { return this.asignaturaForm.get('programa'); }
  get nivel() { return this.asignaturaForm.get('nivel'); }
  get periodo() { return this.asignaturaForm.get('periodo'); }
  get cds() { return this.asignaturaForm.get('cds'); }
  get creditos() { return this.asignaturaForm.get('creditos'); }
  get modalidad() { return this.asignaturaForm.get('modalidad'); }
  get aula() { return this.asignaturaForm.get('aula'); }
  get color() { return this.asignaturaForm.get('color'); }
}