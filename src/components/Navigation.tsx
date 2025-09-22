import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  BookOpen, 
  Calendar, 
  DollarSign, 
  Activity, 
  Users, 
  PenTool,
  Target,
  BarChart3,
  Menu,
  Home,
  Settings,
  Bot
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'AI Assistant', href: '/ai-copilot', icon: Bot },
  { name: 'Planning', href: '/planning', icon: Target },
  { name: 'Journal', href: '/journal', icon: PenTool },
  { name: 'Reading', href: '/reading', icon: BookOpen },
  { name: 'Finance', href: '/finance', icon: DollarSign },
  { name: 'Physical', href: '/physical', icon: Activity },
  { name: 'Social CRM', href: '/social', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavItem = ({ item, mobile = false }: { item: typeof navigation[0], mobile?: boolean }) => {
    const Icon = item.icon;
    const isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href);
    
    return (
      <Link
        to={item.href}
        onClick={() => mobile && setIsOpen(false)}
        className={cn(
          "inline-flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
          mobile 
            ? "w-full px-4 py-3 justify-start hover:bg-secondary/80" 
            : "px-3 py-2 hover:bg-secondary/60",
          isActive 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon size={mobile ? 20 : 16} />
        <span className={mobile ? "text-base" : "hidden sm:inline"}>{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">LifeX</h1>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Menu size={20} />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">Navigation</h2>
                </div>
                <nav className="flex-1 p-4">
                  <div className="space-y-2">
                    {navigation.map((item) => (
                      <NavItem key={item.name} item={item} mobile />
                    ))}
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:block mb-8">
        <div className="flex flex-wrap gap-2">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>
      </nav>

      {/* Mobile spacer */}
      <div className="md:hidden h-16" />
    </>
  );
}