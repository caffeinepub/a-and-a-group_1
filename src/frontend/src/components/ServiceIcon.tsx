import {
  Code2,
  Cpu,
  FileText,
  Film,
  Gamepad2,
  Image,
  Instagram,
  Layout,
  type LucideProps,
  Monitor,
  Palette,
  PenTool,
  Search,
  Share2,
  Smartphone,
  Star,
  Wrench,
  Youtube,
  Zap,
} from "lucide-react";

const iconMap: Record<string, React.FC<LucideProps>> = {
  film: Film,
  image: Image,
  palette: Palette,
  "pen-tool": PenTool,
  youtube: Youtube,
  "gamepad-2": Gamepad2,
  instagram: Instagram,
  "share-2": Share2,
  "code-2": Code2,
  monitor: Monitor,
  smartphone: Smartphone,
  layout: Layout,
  search: Search,
  zap: Zap,
  cpu: Cpu,
  wrench: Wrench,
  "file-text": FileText,
  star: Star,
};

interface ServiceIconProps extends LucideProps {
  name: string;
}

export default function ServiceIcon({ name, ...props }: ServiceIconProps) {
  const Icon = iconMap[name.toLowerCase()] ?? Zap;
  return <Icon {...props} />;
}
