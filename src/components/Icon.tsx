import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Bell, BookOpen, Boxes,
  Braces, Building2, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert,
  CircleCheck, CircleX, Clock, Cloud, Code2, Copy, Cpu, Database, Download, ExternalLink,
  Eye, FileText, Filter, FolderTree, Gauge, GitBranch, HardDrive, HelpCircle, KeyRound,
  Layers, LayoutDashboard, Link2, ListChecks, LogOut, Mail, Menu, MoreHorizontal, Network,
  Pencil, Play, Plus, Radio, RefreshCw, ScanLine, ScrollText, Search, Server, Settings,
  ShieldCheck, SlidersHorizontal, Sparkles, Store, Table2, Tags, Target, Trash2, Upload,
  UploadCloud, UserCog, Users, Workflow, X, Zap, Cable, ClipboardList, MemoryStick,
  PanelLeftClose, PanelLeft, DatabaseZap, ChartNoAxesCombined, ShieldAlert, Rocket, Bot,
  Save, Maximize2, Minimize2, Rows3, Columns3, ListFilter, TerminalSquare, Fingerprint,
  Pause, GitMerge, Moon, Sun, Palette,
  Box, Info,
} from 'lucide-react';

const map: Record<string, any> = {
  activity: Activity, alert: AlertTriangle, arrowleft: ArrowLeft, arrowright: ArrowRight,
  arrowupright: ArrowUpRight, bell: Bell, book: BookOpen, boxes: Boxes, braces: Braces,
  building: Building2, calendar: Calendar, check: Check, chevron: ChevronDown,
  chevronleft: ChevronLeft, chevronright: ChevronRight, circlealert: CircleAlert,
  checkcircle: CircleCheck, circlex: CircleX, clock: Clock, cloud: Cloud, code: Code2,
  copy: Copy, cpu: Cpu, database: Database, download: Download, external: ExternalLink,
  eye: Eye, file: FileText, filter: Filter, folder: FolderTree, gauge: Gauge, git: GitBranch,
  harddrive: HardDrive, help: HelpCircle, key: KeyRound, layers: Layers, dashboard: LayoutDashboard,
  link: Link2, list: ListChecks, logout: LogOut, mail: Mail, menu: Menu, more: MoreHorizontal,
  network: Network, pencil: Pencil, play: Play, plus: Plus, radio: Radio, refresh: RefreshCw,
  scan: ScanLine, scroll: ScrollText, search: Search, server: Server, settings: Settings,
  shield: ShieldCheck, sliders: SlidersHorizontal, sparkles: Sparkles, store: Store, table: Table2,
  tags: Tags, target: Target, trash: Trash2, upload: Upload, uploadcloud: UploadCloud,
  usercog: UserCog, users: Users, workflow: Workflow, x: X, zap: Zap, cable: Cable,
  clipboard: ClipboardList, memory: MemoryStick, panelclose: PanelLeftClose, panel: PanelLeft,
  databasezap: DatabaseZap, chart: ChartNoAxesCombined, shieldalert: ShieldAlert, rocket: Rocket, bot: Bot,
  save: Save, expand: Maximize2, minimize: Minimize2, rows: Rows3, columns: Columns3,
  listfilter: ListFilter, terminal: TerminalSquare, fingerprint: Fingerprint,
  pause: Pause, merge: GitMerge, moon: Moon, sun: Sun, palette: Palette,
  box: Box, info: Info,
};

export type IconName = keyof typeof map;

export function Icon({ name, size = 16, strokeWidth = 1.8, className = '' }: { name: string; size?: number; strokeWidth?: number; className?: string }) {
  const Cmp = map[name] || Activity;
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
