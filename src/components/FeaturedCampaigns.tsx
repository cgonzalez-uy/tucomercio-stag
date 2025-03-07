import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBusinesses } from '../lib/hooks/useBusinesses';
import { Sparkles, ChevronRight, Store } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import type { Campaign } from '../types/campaign';

export function FeaturedCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { businesses } = useBusinesses();
  
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const now = Timestamp.now();
        const campaignsQuery = query(
          collection(db, 'campaigns'),
          where('isActive', '==', true),
          where('startDate', '<=', now),
          where('endDate', '>', now),
          orderBy('startDate', 'desc')
        );
        
        const snapshot = await getDocs(campaignsQuery);
        const activeCampaigns = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Campaign[];
        
        setCampaigns(activeCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaigns();
  }, []);
  
  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (campaigns.length === 0) {
    return null; // Don't show the section if there are no active campaigns
  }
  
  return (
    <section className="py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">Campañas Destacadas</h2>
          </div>
          <Link to="/campaigns" className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1">
            Ver todas
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            // Get the first 4 businesses for this campaign
            const campaignBusinesses = businesses
              .filter(business => campaign.businesses.includes(business.id))
              .slice(0, 4);
              
            return (
              <Link 
                key={campaign.id} 
                to={`/campaigns/${campaign.slug}`}
                className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {campaign.imageUrl ? (
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                    <img 
                      src={campaign.imageUrl} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-primary/5 flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-primary/40" />
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{campaign.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>
                  
                  {campaignBusinesses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Comercios participantes</h4>
                      <div className="flex flex-wrap gap-2">
                        {campaignBusinesses.map(business => (
                          <div 
                            key={business.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700"
                          >
                            <Store className="h-3 w-3" />
                            {business.name}
                          </div>
                        ))}
                        {campaign.businesses.length > 4 && (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                            +{campaign.businesses.length - 4} más
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}