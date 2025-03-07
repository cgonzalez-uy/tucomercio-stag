import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Crown } from 'lucide-react';

interface PremiumFeatureMessageProps {
  title: string;
  description: string;
}

export function PremiumFeatureMessage({ title, description }: PremiumFeatureMessageProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-yellow-100 rounded-full">
            <Crown className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {title}
        </h2>
        <p className="text-gray-600 mb-6">
          {description}
        </p>
        <Button asChild>
          <Link to="/portal/settings">
            Actualizar a Premium
          </Link>
        </Button>
      </div>
    </div>
  );
}