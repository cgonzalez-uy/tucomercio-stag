import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  getDocs,
  getDoc,
  runTransaction,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Campaign, CampaignParticipation } from '../../types/campaign';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to active campaigns
  useEffect(() => {
    const now = serverTimestamp();
    const q = query(
      collection(db, 'campaigns'),
      where('endDate', '>', now),
      orderBy('endDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[]);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching campaigns:', err);
      setError('Error al cargar las campañas');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createCampaign = async (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'metrics' | 'businesses' | 'pendingRequests'>) => {
    try {
      const campaignRef = doc(collection(db, 'campaigns'));
      
      await runTransaction(db, async (transaction) => {
        transaction.set(campaignRef, {
          ...data,
          id: campaignRef.id,
          businesses: [],
          pendingRequests: [],
          metrics: {
            views: 0,
            clicks: 0,
            participantCount: 0
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      return campaignRef.id;
    } catch (err) {
      console.error('Error creating campaign:', err);
      throw err instanceof Error ? err : new Error('Error al crear la campaña');
    }
  };

  const updateCampaign = async (id: string, data: Partial<Campaign>) => {
    try {
      const campaignRef = doc(db, 'campaigns', id);
      await updateDoc(campaignRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating campaign:', err);
      throw err instanceof Error ? err : new Error('Error al actualizar la campaña');
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'campaigns', id));
    } catch (err) {
      console.error('Error deleting campaign:', err);
      throw err instanceof Error ? err : new Error('Error al eliminar la campaña');
    }
  };

  const requestParticipation = async (campaignId: string, businessId: string, note?: string) => {
    try {
      const participationRef = doc(collection(db, `campaigns/${campaignId}/participations`));
      
      await runTransaction(db, async (transaction) => {
        const campaignDoc = await transaction.get(doc(db, 'campaigns', campaignId));
        if (!campaignDoc.exists()) {
          throw new Error('Campaña no encontrada');
        }

        // Create participation request
        transaction.set(participationRef, {
          businessId,
          campaignId,
          status: 'pending',
          requestNote: note,
          joinedAt: serverTimestamp()
        } as CampaignParticipation);

        // Add to pending requests array
        transaction.update(doc(db, 'campaigns', campaignId), {
          pendingRequests: [...campaignDoc.data().pendingRequests, businessId]
        });
      });
    } catch (err) {
      console.error('Error requesting participation:', err);
      throw err instanceof Error ? err : new Error('Error al solicitar participación');
    }
  };

  const approveParticipation = async (campaignId: string, businessId: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const campaignDoc = await transaction.get(doc(db, 'campaigns', campaignId));
        if (!campaignDoc.exists()) {
          throw new Error('Campaña no encontrada');
        }

        const campaignData = campaignDoc.data() as Campaign;

        // Update participation status
        const participationsRef = collection(db, `campaigns/${campaignId}/participations`);
        const q = query(participationsRef, where('businessId', '==', businessId));
        const participationDocs = await getDocs(q);
        
        if (participationDocs.empty) {
          throw new Error('Solicitud no encontrada');
        }

        transaction.update(participationDocs.docs[0].ref, {
          status: 'approved'
        });

        // Update campaign document
        transaction.update(doc(db, 'campaigns', campaignId), {
          businesses: [...campaignData.businesses, businessId],
          pendingRequests: campaignData.pendingRequests.filter(id => id !== businessId),
          'metrics.participantCount': increment(1)
        });
      });
    } catch (err) {
      console.error('Error approving participation:', err);
      throw err instanceof Error ? err : new Error('Error al aprobar la participación');
    }
  };

  const rejectParticipation = async (campaignId: string, businessId: string, reason?: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const campaignDoc = await transaction.get(doc(db, 'campaigns', campaignId));
        if (!campaignDoc.exists()) {
          throw new Error('Campaña no encontrada');
        }

        const campaignData = campaignDoc.data() as Campaign;

        // Update participation status
        const participationsRef = collection(db, `campaigns/${campaignId}/participations`);
        const q = query(participationsRef, where('businessId', '==', businessId));
        const participationDocs = await getDocs(q);
        
        if (participationDocs.empty) {
          throw new Error('Solicitud no encontrada');
        }

        transaction.update(participationDocs.docs[0].ref, {
          status: 'rejected',
          rejectionReason: reason
        });

        // Update campaign document
        transaction.update(doc(db, 'campaigns', campaignId), {
          pendingRequests: campaignData.pendingRequests.filter(id => id !== businessId)
        });
      });
    } catch (err) {
      console.error('Error rejecting participation:', err);
      throw err instanceof Error ? err : new Error('Error al rechazar la participación');
    }
  };

  const trackCampaignView = async (campaignId: string) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), {
        'metrics.views': increment(1)
      });
    } catch (err) {
      console.error('Error tracking campaign view:', err);
    }
  };

  const trackCampaignClick = async (campaignId: string) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), {
        'metrics.clicks': increment(1)
      });
    } catch (err) {
      console.error('Error tracking campaign click:', err);
    }
  };

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    requestParticipation,
    approveParticipation,
    rejectParticipation,
    trackCampaignView,
    trackCampaignClick
  };
}