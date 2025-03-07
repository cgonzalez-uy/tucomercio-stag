import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { DashboardPage } from './DashboardPage';
import { BusinessesPage } from './BusinessesPage';
import { RequestsPage } from './RequestsPage';
import { BusinessForm } from '../components/admin/BusinessForm';
import { PaymentMethodsPage } from './settings/PaymentMethodsPage';
import { ShippingMethodsPage } from './settings/ShippingMethodsPage';
import { CategoriesPage } from './settings/CategoriesPage';
import { PlansPage } from './settings/PlansPage';
import { PaymentAccountsPage } from './settings/PaymentAccountsPage';
import { SiteSettingsPage } from './settings/SiteSettingsPage';
import { ReportedReviewsPage } from './ReportedReviewsPage';
import { AdminMessagesPage } from './AdminMessagesPage';
import { BusLinesPage } from './bus/BusLinesPage';
import { BusLineTypesPage } from './bus/BusLineTypesPage';
import { BusDestinationsPage } from './bus/BusDestinationsPage';
import { BusRoutesPage } from './bus/BusRoutesPage';
import { AdminBusSchedulesPage } from './bus/AdminBusSchedulesPage';
import { PointsOfInterestPage } from './admin/PointsOfInterestPage';
import { EventsPage } from './admin/EventsPage';
import { PlanExpirationsPage } from './admin/PlanExpirationsPage';
import { AnalyticsPage } from './admin/AnalyticsPage';
import { BannersPage } from './admin/BannersPage';
import { CampaignsPage } from './admin/CampaignsPage';
import { CampaignFormStepper } from '../components/admin/CampaignFormStepper';

export function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<DashboardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="businesses" element={<BusinessesPage />} />
        <Route path="businesses/new" element={<BusinessForm />} />
        <Route path="businesses/:id/edit" element={<BusinessForm />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="reviews" element={<ReportedReviewsPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
        <Route path="payment-methods" element={<PaymentMethodsPage />} />
        <Route path="shipping-methods" element={<ShippingMethodsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="payment-accounts" element={<PaymentAccountsPage />} />
        <Route path="settings" element={<SiteSettingsPage />} />
        <Route path="points-of-interest" element={<PointsOfInterestPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="plan-expirations" element={<PlanExpirationsPage />} />
        <Route path="banners" element={<BannersPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="campaigns/new" element={<CampaignFormStepper 
          onSubmit={async (data) => {
            const { collection, doc, setDoc, Timestamp } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');
            const newCampaignRef = doc(collection(db, 'campaigns'));
            await setDoc(newCampaignRef, {
              ...data,
              startDate: Timestamp.fromDate(data.startDate),
              endDate: Timestamp.fromDate(data.endDate),
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
          }} 
          onCancel={() => window.history.back()} 
        />} />
        <Route path="campaigns/edit/:id" element={<CampaignFormStepper 
          onSubmit={async (data) => {
            const { useParams } = await import('react-router-dom');
            const { id } = useParams<{ id: string }>();
            const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');
            await updateDoc(doc(db, 'campaigns', id!), {
              ...data,
              startDate: Timestamp.fromDate(data.startDate),
              endDate: Timestamp.fromDate(data.endDate),
              updatedAt: Timestamp.now()
            });
          }}
          onCancel={() => window.history.back()}
        />} />
        
        {/* Bus Management Routes */}
        <Route path="bus/lines" element={<BusLinesPage />} />
        <Route path="bus/types" element={<BusLineTypesPage />} />
        <Route path="bus/destinations" element={<BusDestinationsPage />} />
        <Route path="bus/routes" element={<BusRoutesPage />} />
        <Route path="bus/schedules" element={<AdminBusSchedulesPage />} />
      </Routes>
    </AdminLayout>
  );
}