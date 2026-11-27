import CompareBar from './components/CompareBar'
import Footer from './components/Footer'
import Header from './components/Header'
import { useCompare } from './hooks/useCompare'
import { useFavorites } from './hooks/useFavorites'
import { useRoute } from './hooks/useRoute'
import AlertManage from './pages/AlertManage'
import Catalogue from './pages/Catalogue'
import Commande from './pages/Commander'
import Compare from './pages/Compare'
import Contact from './pages/Contact'
import Favorites from './pages/Favorites'
import Home from './pages/Home'
import Legal from './pages/Legal'
import OrderConfirm from './pages/OrderConfirm'
import OrderTracking from './pages/OrderTracking'
import Simulation from './pages/Simulation'
import VehicleDetail from './pages/VehicleDetail'
import AdminGate from './pages/admin/AdminGate'

export default function App() {
  const { route, navigate } = useRoute()
  const favorites = useFavorites()
  const compare = useCompare()

  return (
    <div className="site">
      <Header route={route} favoritesCount={favorites.ids.length} compareCount={compare.ids.length} />
      <main id="main-content">
        {route.page === 'home' && <Home favorites={favorites} compare={compare} />}
        {route.page === 'catalogue' && <Catalogue favorites={favorites} compare={compare} />}
        {route.page === 'vehicle' && <VehicleDetail id={route.id} favorites={favorites} compare={compare} />}
        {route.page === 'favorites' && <Favorites favorites={favorites} compare={compare} />}
        {route.page === 'contact' && <Contact />}
        {route.page === 'legal' && <Legal />}
        {route.page === 'compare' && <Compare compare={compare} />}
        {route.page === 'simulation' && <Simulation favorites={favorites} compare={compare} />}
        {route.page === 'checkout' && <Commande id={route.id} navigate={navigate} />}
        {route.page === 'order-confirm' && <OrderConfirm orderNumber={route.orderNumber} />}
        {route.page === 'tracking' && <OrderTracking orderNumber={route.orderNumber} />}
        {route.page === 'alert' && <AlertManage token={route.token} navigate={navigate} />}
        {route.page === 'admin' && <AdminGate section={route.section} />}
      </main>
      <CompareBar compare={compare} hidden={route.page === 'compare'} />
      <Footer />
    </div>
  )
}
