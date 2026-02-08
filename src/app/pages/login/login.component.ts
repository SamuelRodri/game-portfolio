import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-box">
        <h1>Panel de Administración</h1>
        <p class="subtitle">Acceso restringido</p>

        <form [formGroup]="loginForm" (ngSubmit)="onLogin()" *ngIf="!isLoading">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              placeholder="tu@email.com"
              required
            />
            <small *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              Email inválido
            </small>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              placeholder="••••••••"
              required
            />
            <small *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              La contraseña es requerida
            </small>
          </div>

          <button type="submit" [disabled]="loginForm.invalid" class="btn-login">
            Iniciar Sesión
          </button>
        </form>

        <div class="loading" *ngIf="isLoading">
          <p>Iniciando sesión...</p>
        </div>

        <div class="error" *ngIf="error">
          {{ error }}
        </div>

        <button (click)="goBack()" class="btn-back">
          ← Volver
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-box {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 400px;
    }

    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
    }

    .subtitle {
      text-align: center;
      color: #999;
      margin-bottom: 30px;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
      }
    }

    small {
      display: block;
      color: #e74c3c;
      margin-top: 5px;
      font-size: 12px;
    }

    .btn-login {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-back {
      width: 100%;
      margin-top: 15px;
      padding: 10px;
      background: #f0f0f0;
      color: #333;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;

      &:hover {
        background: #e0e0e0;
      }
    }

    .loading {
      text-align: center;
      color: #667eea;
    }

    .error {
      background: #fee;
      color: #c33;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 20px;
      font-size: 14px;
      border-left: 4px solid #c33;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.error = null;

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.isLoading = false;
        if (user) {
          // Esperar a que se verifique si es admin
          setTimeout(() => {
            this.router.navigate(['/admin']);
          }, 500);
        }
      },
      error: (error: Error) => {
        this.isLoading = false;
        console.error('Error de autenticación:', error);

        // Mensajes de error más específicos
        if (error.message.includes('user-not-found')) {
          this.error = 'Email no encontrado en Firebase';
        } else if (error.message.includes('wrong-password')) {
          this.error = 'Contraseña incorrecta';
        } else if (error.message.includes('too-many-requests')) {
          this.error = 'Demasiados intentos. Intenta más tarde';
        } else {
          this.error = `Error: ${error.message}`;
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
