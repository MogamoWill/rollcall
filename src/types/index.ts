// ============================================
// EQUIPMENT
// ============================================

export type EquipmentUniverse =
  | "camera"
  | "lens"
  | "lighting"
  | "audio"
  | "cable"
  | "power"
  | "grip"
  | "monitoring"
  | "storage"
  | "accessory";

export const UNIVERSE_LABELS: Record<EquipmentUniverse, string> = {
  camera: "Boîtiers",
  lens: "Objectifs",
  lighting: "Lumières",
  audio: "Audio",
  cable: "Câbles",
  power: "Alimentation",
  grip: "Grip & Support",
  monitoring: "Monitoring",
  storage: "Stockage",
  accessory: "Accessoires",
};

export const UNIVERSE_ICONS: Record<EquipmentUniverse, string> = {
  camera: "camera",
  lens: "aperture",
  lighting: "flashlight",
  audio: "mic",
  cable: "git-merge",
  power: "battery-charging",
  grip: "expand",
  monitoring: "monitor",
  storage: "hard-drive",
  accessory: "tool",
};

export interface Equipment {
  id: string;
  name: string;
  universe: EquipmentUniverse;
  brand?: string;
  model?: string;
  serial_number?: string;
  qr_code?: string; // Only for high-value items
  is_high_value: boolean;
  notes?: string;
  image_url?: string;
  attributes?: Record<string, any>;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentKit {
  id: string;
  name: string;
  description?: string;
  items: KitItem[];
  user_id: string;
  created_at: string;
}

export interface KitItem {
  id: string;
  kit_id: string;
  equipment_id: string;
  quantity: number;
  equipment?: Equipment;
}

// ============================================
// PROJECTS
// ============================================

export type ProjectStatus = "draft" | "pre_prod" | "production" | "post_prod" | "delivered" | "archived";

export interface Project {
  id: string;
  name: string;
  client?: string;
  status: ProjectStatus;
  description?: string;
  shoot_date?: string;
  location?: string;
  kit_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// SHOT LIST
// ============================================

export type ShotType = "wide" | "medium" | "close_up" | "detail" | "drone" | "tracking" | "static" | "other";
export type ShotPriority = "must_have" | "nice_to_have" | "optional";

export interface Shot {
  id: string;
  project_id: string;
  description: string;
  shot_type: ShotType;
  priority: ShotPriority;
  is_completed: boolean;
  notes?: string;
  number?: number;
  sort_order: number;
}

// ============================================
// CHECKLISTS (Pre/Prod/Post templates)
// ============================================

export type ChecklistPhase = "pre_prod" | "production" | "post_prod";

export interface Checklist {
  id: string;
  project_id?: string; // null = template
  name: string;
  phase: ChecklistPhase;
  is_template: boolean;
  items: ChecklistItem[];
  user_id: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  label: string;
  is_checked: boolean;
  order: number;
}

// ============================================
// KANBAN BOARD
// ============================================

export interface Board {
  id: string;
  name: string;
  columns: BoardColumn[];
  user_id: string;
  created_at: string;
}

export interface BoardColumn {
  id: string;
  board_id: string;
  name: string;
  color: string;
  order: number;
  cards: BoardCard[];
}

export interface BoardCard {
  id: string;
  column_id: string;
  project_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  labels: string[];
  order: number;
  project?: Project;
}

// ============================================
// FIELD NOTES
// ============================================

export interface FieldNote {
  id: string;
  project_id: string;
  content: string;
  type: "text" | "audio";
  audio_url?: string;
  created_at: string;
}
