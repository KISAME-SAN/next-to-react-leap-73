import { NavLink } from "react-router-dom";
import {
  Home,
  UserPlus,
  Users,
  GraduationCap,
  BarChart3,
  CalendarDays,
  Euro,
  UserCheck,
  CreditCard,
  RefreshCcw,
} from "lucide-react";
import YearSwitcher from "@/components/YearSwitcher";
interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
}

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: Home, url: "/" },
    { id: "student-registration", label: "Inscription des Élèves", icon: UserPlus, url: "/students/register" },
    { id: "student-reenroll", label: "Réinscription par ID", icon: RefreshCcw, url: "/students/reenroll" },
    { id: "student-management", label: "Gestion des Élèves", icon: Users, url: "/students" },
    { id: "teacher-registration", label: "Inscription des Professeurs", icon: BarChart3, url: "/teachers/register" },
    { id: "teacher-management", label: "Gestion des Professeurs", icon: BarChart3, url: "/teachers" },
    { id: "class-management", label: "Gestion des Classes", icon: GraduationCap, url: "/classes" },
    { id: "grades-management", label: "Gestion des Notes", icon: BarChart3, url: "/grades" },
    { id: "schedule-management", label: "Gestion des Emplois du Temps", icon: CalendarDays, url: "/schedule" },
    { id: "attendance-management", label: "Gestion des Présences", icon: UserCheck, url: "/attendance" },
    { id: "payment-management", label: "Gestion des Paiements", icon: Euro, url: "/payments" },
    { id: "payment-pay", label: "Verser un paiement", icon: CreditCard, url: "/payments/students/pay" },
  ];

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center px-6 py-3 text-left transition-colors duration-200 border-r ${
      isActive
        ? "bg-muted text-primary border-primary"
        : "text-muted-foreground hover:bg-muted/50 border-transparent"
    }`;

  return (
    <aside aria-hidden={collapsed} className={`h-screen ${collapsed ? "w-0 border-transparent" : "w-64 border-border"} flex-shrink-0 bg-card border-r flex flex-col overflow-hidden transition-all duration-300`}>
      <div className="p-6 border-b border-border flex-shrink-0">
        <h1 className="text-2xl font-bold">École Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion Scolaire</p>
        <div className="mt-4">
          <YearSwitcher />
        </div>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.id} to={item.url} end className={navCls}>
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
