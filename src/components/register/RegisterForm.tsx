import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RegisterStepper } from './RegisterStepper';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { CategoriesStep } from './steps/CategoriesStep';
import { ContactStep } from './steps/ContactStep';
import { PaymentMethodsStep } from './steps/PaymentMethodsStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { ImageUploadStep } from './steps/ImageUploadStep';
import { DEFAULT_SCHEDULE } from '../../types/business';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { CancelDialog } from './CancelDialog';

interface RegisterFormProps {
  onComplete: (data: any) => void;
  onCancel: () => void;
}

const STEPS = [
  {
    title: 'Información básica',
    description: 'Datos principales de tu comercio'
  },
  {
    title: 'Imagen',
    description: 'Logo o foto del comercio'
  },
  {
    title: 'Categorías',
    description: 'Clasifica tu comercio'
  },
  {
    title: 'Contacto',
    description: 'Redes sociales y web'
  },
  {
    title: 'Métodos',
    description: 'Pagos y envíos'
  },
  {
    title: 'Horarios',
    description: 'Horarios de atención'
  }
];

export function RegisterForm({ onComplete, onCancel }: RegisterFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    imageFile: undefined as File | undefined,
    categories: [] as string[],
    whatsapp: '',
    instagram: '',
    facebook: '',
    website: '',
    paymentMethods: [] as string[],
    shippingMethods: [] as string[],
    schedule: DEFAULT_SCHEDULE
  });

  const handleNext = () => {
    if (currentStep === STEPS.length - 1) {
      onComplete(formData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header con navegación */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a comercios</span>
            </Link>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowCancelDialog(true)}
            className="text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            Cancelar registro
          </Button>
        </div>

        <RegisterStepper currentStep={currentStep} steps={STEPS} />

        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          {currentStep === 0 && (
            <BasicInfoStep
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              onCancel={() => setShowCancelDialog(true)}
            />
          )}

          {currentStep === 1 && (
            <ImageUploadStep
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onCancel={() => setShowCancelDialog(true)}
            />
          )}

          {currentStep === 2 && (
            <CategoriesStep
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onCancel={() => setShowCancelDialog(true)}
            />
          )}

          {currentStep === 3 && (
            <ContactStep
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onCancel={() => setShowCancelDialog(true)}
            />
          )}

          {currentStep === 4 && (
            <PaymentMethodsStep
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onCancel={() => setShowCancelDialog(true)}
            />
          )}

          {currentStep === 5 && (
            <ScheduleStep
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onCancel={() => setShowCancelDialog(true)}
            />
          )}
        </div>
      </div>

      <CancelDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={onCancel}
      />
    </div>
  );
}