import { Injectable } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { ADMIN_EMAILS } from '../config/admin-config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = getAuth();
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private authInitializedSubject = new BehaviorSubject<boolean>(false);
  public authInitialized$ = this.authInitializedSubject.asObservable();

  constructor() {
    this.initAuthState();
  }

  private initAuthState(): void {
    onAuthStateChanged(this.auth, (user) => {
      console.log('Auth state changed:', user?.email || 'No user');
      this.currentUserSubject.next(user);
      // Marca que la autenticación se ha inicializado
      this.authInitializedSubject.next(true);
    });
  }

  /**
   * Iniciar sesión con email y contraseña
   */
  login(email: string, password: string): Observable<User | null> {
    return from(
      signInWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      map(userCredential => userCredential.user)
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  /**
   * Obtener usuario actual como Observable
   */
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Verificar si el usuario actual es administrador
   */
  isAdmin(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => {
        if (!user || !user.email) {
          console.log('No hay usuario autenticado o sin email');
          return false;
        }
        const isAdmin = ADMIN_EMAILS.includes(user.email);
        console.log(`Usuario: ${user.email}, Es admin: ${isAdmin}, Admin emails: ${ADMIN_EMAILS.join(', ')}`);
        return isAdmin;
      })
    );
  }

  /**
   * Obtener el usuario actual de forma síncrona (si está disponible)
   */
  getCurrentUserSync(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => user !== null)
    );
  }

  /**
   * Obtener lista de emails admin
   */
  getAdminEmails(): string[] {
    return [...ADMIN_EMAILS];
  }
}
