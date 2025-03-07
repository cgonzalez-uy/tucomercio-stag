import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { collection, query, where, getDocs, Timestamp, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Sparkles, Check, X, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { cn } from '../../lib/utils';
import type { Campaign, CampaignParticipation } from '../../types/campaign';
import { trackEvent } from '../../lib/analytics';

export function BusinessCampaigns() {
  const [user] = useAuthState(auth);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [participations, setParticipations] = useState<Record<string, CampaignParticipation>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Get business ID from user claims
  useEffect(() => {
    const getBusinessId = async () => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          const id = idTokenResult.claims.businessId;
          setBusinessId(id);
        } catch (err) {
          console.error('Error getting business ID:', err);
          setError('Error al obtener información del comercio');
        }
      }
    };

    getBusinessId();
  }, [user]);

  // Fetch active campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!businessId) return;

      try {
        setLoading(true);
        const now = Timestamp.now();
        
        // Get active campaigns
        const campaignsQuery = query(
          collection(db, 'campaigns'),
          where('isActive', '==', true),
          where('endDate', '>', now)
        );
        
        const campaignsSnapshot = await getDocs(campaignsQuery);
        const activeCampaigns = campaignsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Campaign[];
        
        setCampaigns(activeCampaigns);
        
        // Get business participations
        const participationsMap: Record<string, CampaignParticipation> = {};
        
        await Promise.all(activeCampaigns.map(async (campaign) => {
          const participationsQuery = query(
            collection(db, `campaigns/${campaign.id}/participations`),
            where('businessId', '==', businessId)
          );
          
          const participationsSnapshot = await getDocs(participationsQuery);
          if (!participationsSnapshot.empty) {
            const participation = participationsSnapshot.docs[0].data() as CampaignParticipation;
            participationsMap[campaign.id] = participation;
          }
        }));
        
        setParticipations(participationsMap);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError('Error al cargar las campañas');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaigns();
  }, [businessId]);

  const handleRequestParticipation = async () => {
    if (!businessId || !selectedCampaign) return;
    
    try {
      setIsSubmitting(true);
      
      // Create a new participation request
      const participationRef = collection(db, `campaigns/${selectedCampaign.id}/participations`);
      await getDocs(query(participationRef, where('businessId', '==', businessId)));
      
      // Add to pending requests in campaign document
      const campaignRef = doc(db, 'campaigns', selectedCampaign.id);
      await runTransaction(db, async (transaction) => {
        const campaignDoc = await transaction.get(campaignRef);
        if (!campaignDoc.exists()) {
          throw new Error('Campaña no encontrada');
        }
        
        const campaignData = campaignDoc.data() as Campaign;
        
        // Create participation request
        const newParticipationRef = doc(collection(db, `campaigns/${selectedCampaign.id}/participations`));
        transaction.set(newParticipationRef, {
          businessId,
          campaignId: selectedCampaign.id,
          status: 'pending',
          requestNote,
          joinedAt: serverTimestamp()
        });
        
        // Update campaign document
        transaction.update(campaignRef, {
          pendingRequests: [...campaignData.pendingRequests, businessId]
        });
      });
      
      // Update local state
      setParticipations(prev => ({
        ...prev,
        [selectedCampaign.id]: {
          businessId,
          campaignId: selectedCampaign.id,
          status: 'pending',
          requestNote,
          joinedAt: Timestamp.now()
        }
      }));
      
      // Track event
      trackEvent('campaign_participation_request', {
        campaign_id: selectedCampaign.id,
        business_id: businessId
      });
      
      toast({
        title: 'Solicitud enviada',
        description: 'Tu solicitud para participar en la campaña ha sido enviada correctamente.',
        variant: 'default'
      });
      
      // Close dialog
      setSelectedCampaign(null);
      setRequestNote('');
    } catch (err) {
      console.error('Error requesting participation:', err);
      toast({
        title: 'Error',
        description: 'Ha ocurrido un error al enviar tu solicitud. Por favor, intenta nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getParticipationStatus = (campaignId: string) => {
    const participation = participations[campaignId];
    if (!participation) return null;
    
    return participation.status;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-gray-900">Campañas Promocionales</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border rounded-lg p-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-gray-900">Campañas Promocionales</h2>
        </div>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold text-gray-900">Campañas Promocionales</h2>
      </div>
      
      <p className="text-gray-600">
        Participa en campañas promocionales para aumentar la visibilidad de tu comercio. 
        Las campañas son colecciones temáticas de comercios que se destacan en la plataforma.
      </p>
      
      {campaigns.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <Sparkles className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay campañas disponibles</h3>
          <p className="text-gray-600">Actualmente no hay campañas promocionales activas. Revisa más tarde.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map(campaign => {
            const participationStatus = getParticipationStatus(campaign.id);
            
            return (
              <div 
                key={campaign.id}
                className="bg-white border rounded-lg overflow-hidden shadow-sm"
              >
                {campaign.imageUrl ? (
                  <div className="h-32 overflow-hidden bg-gray-100">
                    <img 
                      src={campaign.imageUrl} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-primary/5 flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-primary/40" />
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{campaign.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{campaign.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                      {campaign.businesses.length} comercios participantes
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                      Hasta {new Date(campaign.endDate.seconds * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    {participationStatus === 'approved' ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-5 w-5" />
                        <span className="font-medium">Participando</span>
                      </div>
                    ) : participationStatus === 'pending' ? (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Solicitud pendiente</span>
                      </div>
                    ) : participationStatus === 'rejected' ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <X className="h-5 w-5" />
                        <span className="font-medium">Solicitud rechazada</span>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setSelectedCampaign(campaign)}
                        variant="outline"
                      >
                        Solicitar participación
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Participation Request Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Solicitar participación en campaña</DialogTitle>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-medium text-gray-900">{selectedCampaign.title}</h3>
                <p className="text-sm text-gray-600">{selectedCampaign.description}</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="note" className="text-sm font-medium text-gray-700">
                  Nota (opcional)
                </label>
                <Textarea
                  id="note"
                  placeholder="Escribe una nota para los administradores explicando por qué tu comercio debería participar en esta campaña..."
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  className="resize-none"
                  rows={4}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCampaign(null)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleRequestParticipation}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}