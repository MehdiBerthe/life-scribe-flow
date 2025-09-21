import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Calendar, 
  DollarSign, 
  Activity, 
  Users, 
  PenTool,
  Target,
  BarChart3,
  Brain
} from 'lucide-react';

const navigation = [
  { name: 'Journal', href: '/journal', icon: PenTool },
  { name: 'Reading', href: '/reading', icon: BookOpen },
  { name: 'Planning', href: '/planning', icon: Target },
  { name: 'Finance', href: '/finance', icon: DollarSign },
  { name: 'Physical', href: '/physical', icon: Activity },
  { name: 'Social CRM', href: '/social', icon: Users },
  { name: 'AI Co-Pilot', href: '/ai-copilot', icon: Brain },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="mb-8">
      <div className="flex flex-wrap gap-2">
        <Link
          to="/"
          className={cn(
            "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
            location.pathname === "/" 
              ? "bg-primary text-primary-foreground" 
              : "bg-card text-card-foreground hover:bg-secondary"
          )}
        >
          LifeOS Dashboard
        </Link>
        
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card text-card-foreground hover:bg-secondary"
              )}
            >
              <Icon size={16} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}