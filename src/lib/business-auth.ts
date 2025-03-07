import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

export async function createBusinessUser(
  email: string, 
  businessId: string, 
  password?: string
): Promise<{email: string, password: string}> {
  try {
    // Verificar que el comercio existe
    const businessDoc = await getDoc(doc(db, 'businesses', businessId));
    if (!businessDoc.exists()) {
      throw new Error('El comercio no existe');
    }

    // Llamar a la Cloud Function para crear el usuario
    const createUser = httpsCallable(functions, 'createBusinessUser');
    const result = await createUser({ email, password, businessId });

    // Actualizar el perfil del usuario en Firestore
    // Si el usuario ya existe, actualizamos sus roles
    // Si no existe, creamos el perfil con ambos roles
    const userDoc = await getDoc(doc(db, 'users', (result.data as any).uid));
    
    if (userDoc.exists()) {
      // El usuario ya existe, actualizamos para agregar el rol business
      await updateDoc(doc(db, 'users', (result.data as any).uid), {
        roles: ['visitor', 'business'],
        businessId,
        updatedAt: serverTimestamp()
      });
    } else {
      // Crear nuevo perfil con ambos roles
      await setDoc(doc(db, 'users', (result.data as any).uid), {
        email,
        roles: ['visitor', 'business'],
        businessId,
        favorites: [],
        reviews: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Actualizar el comercio con acceso al portal
    await updateDoc(doc(db, 'businesses', businessId), {
      hasPortalAccess: true,
      updatedAt: serverTimestamp()
    });

    return { email, password: password || '' };
  } catch (error: any) {
    console.error('Error creating business user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este email ya está registrado. Por favor, usa un email diferente o contacta a soporte.');
    }
    
    if (error.code === 'auth/invalid-email') {
      throw new Error('El email no es válido');
    }
    
    throw new Error('Error al crear el usuario del comercio. Por favor, intenta nuevamente.');
  }
}