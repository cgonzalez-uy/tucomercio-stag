import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Welcome } from '../components/register/Welcome';
import { RegisterForm } from '../components/register';
import { PlanSelection } from '../components/register/PlanSelection';
import { RegistrationComplete } from '../components/register';
import { useBusinesses } from '../lib/hooks/useBusinesses';
import { DEFAULT_SCHEDULE } from '../types/business';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { Navbar } from '../components/Navbar';
type Step = 'welcome' | 'form' | 'plans' | 'complete';

export function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [formData, setFormData] = useState<any>(null);
  const { createBusiness } = useBusinesses();
  const navigate = useNavigate();

  const handleWelcomeComplete = () => {
    setCurrentStep('form');
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleFormComplete = (data: any) => {
    setFormData({
      ...data,
      schedule: data.schedule || DEFAULT_SCHEDULE
    });
    setCurrentStep('plans');
  };

  const handlePlanSelected = async (planId: string) => {
    try {
      let imageUrl = '';

      // Si hay un archivo de imagen, subirlo a Firebase Storage
      if (formData.imageFile) {
        const storageRef = ref(storage, `businesses/${formData.imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, formData.imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // Crear el objeto de datos del comercio
      const businessData = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        address: formData.address,
        phone: formData.phone,
        email: formData.email || '',
        whatsapp: formData.whatsapp || '',
        instagram: formData.instagram || '',
        facebook: formData.facebook || '',
        website: formData.website || '',
        image: imageUrl,
        categories: formData.categories,
        paymentMethods: formData.paymentMethods,
        shippingMethods: formData.shippingMethods,
        schedule: formData.schedule,
        planId,
        isActive: false, // El comercio comienza deshabilitado
        hasPortalAccess: false
      };

      // Crear el comercio
      await createBusiness(businessData);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Error al registrar el comercio:', error);
      // Aquí podrías mostrar un mensaje de error
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <Navbar />
      {currentStep === 'welcome' && (
        <Welcome onContinue={handleWelcomeComplete} />
      )}
      
      {currentStep === 'form' && (
        <RegisterForm 
          onComplete={handleFormComplete} 
          onCancel={handleCancel}
        />
      )}
      
      {currentStep === 'plans' && (
        <PlanSelection 
          formData={formData}
          onPlanSelected={handlePlanSelected}
          onBack={handleBackToForm}
        />
      )}

      {currentStep === 'complete' && (
        <RegistrationComplete />
      )}
    </div>
  );
}