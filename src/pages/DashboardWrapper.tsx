import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";
import PartnerDashboard from "./PartnerDashboard";

const DashboardWrapper = () => {
  const { user } = useAuth();

  // Show partner dashboard for partners
  if (user?.role === 'partner') {
    return <PartnerDashboard />;
  }

  // Show admin dashboard for admins
  return <Dashboard />;
};

export default DashboardWrapper;
