import {
  Briefcase,
  Car,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  PawPrint,
  Plane,
  Receipt,
  Repeat,
  ShoppingBag,
  Sparkles,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Utensils,
  Car,
  Home,
  PawPrint,
  ShoppingBag,
  Gift,
  HeartPulse,
  Plane,
  Repeat,
  Briefcase,
  GraduationCap,
  Sparkles,
};

export function TransactionIcon({
  name,
  className,
  size = 22,
  strokeWidth = 1.75,
}: {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = iconMap[name] ?? Receipt;
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden className={className} />;
}
