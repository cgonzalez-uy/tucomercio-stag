import { Link } from 'react-router-dom';
import type { CampaignCategory } from '../../types/campaign-category';

interface CategoryCardProps {
  category: CampaignCategory;
  onClick?: () => void;
  selected?: boolean;
  linkTo?: string;
}

export function CategoryCard({ category, onClick, selected = false, linkTo }: CategoryCardProps) {
  const CardContent = () => (
    <div
      className={`relative group overflow-hidden rounded-lg shadow-md transition-all duration-300 ${selected ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'}`}
      style={{
        backgroundColor: category.backgroundColor || '#f3f4f6',
        color: category.textColor || '#1f2937'
      }}
    >
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={category.imageUrl}
          alt={category.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
        {category.description && (
          <p className="text-sm opacity-90">{category.description}</p>
        )}
      </div>
      {onClick && (
        <div
          className={`absolute inset-0 bg-black/0 transition-colors duration-300 cursor-pointer ${selected ? 'bg-blue-500/10' : 'group-hover:bg-black/5'}`}
          onClick={onClick}
        />
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}