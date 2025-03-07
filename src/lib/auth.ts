import { auth } from './firebase';
import { User } from 'firebase/auth';

const SUPER_ADMINS = ['cgonzalez.uy@gmail.com', 'sole.emery@gmail.com'];

export function isSuperAdmin(user: User | null): boolean {
  return user ? SUPER_ADMINS.includes(user.email || '') : false;
}

export function generateRandomPassword(): string {
  const length = 8;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

export function isBusinessUser(user: User | null, businessId: string): boolean {
  return user?.customClaims?.businessId === businessId;
}