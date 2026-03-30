import type { EquipmentUniverse } from "@/types";

export type FieldType = "text" | "select" | "toggle";

export interface EquipmentFieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
}

export const EQUIPMENT_FIELDS: Record<EquipmentUniverse, EquipmentFieldConfig[]> = {
  camera: [
    {
      key: "sensor_size",
      label: "Capteur",
      type: "select",
      options: ["Full Frame", "APS-C", "MFT", "Super 35", "Medium Format"],
    },
    {
      key: "max_resolution",
      label: "Resolution max",
      type: "select",
      options: ["8K", "6K", "4K", "1080p"],
    },
    {
      key: "mount",
      label: "Monture",
      type: "select",
      options: ["EF", "RF", "E-Mount", "Z-Mount", "L-Mount", "PL", "MFT"],
    },
    {
      key: "recording_media",
      label: "Support",
      type: "select",
      options: ["CFexpress", "SD", "XQD", "SSD", "Interne"],
    },
  ],

  lens: [
    {
      key: "lens_type",
      label: "Type",
      type: "select",
      options: ["Prime", "Zoom", "Cine", "Anamorphique", "Macro"],
    },
    {
      key: "focal_length",
      label: "Focale",
      type: "text",
      placeholder: "50mm ou 24-70mm",
    },
    {
      key: "max_aperture",
      label: "Ouverture max",
      type: "select",
      options: ["f/1.2", "f/1.4", "f/1.8", "f/2", "f/2.8", "f/4", "f/5.6"],
    },
    {
      key: "mount",
      label: "Monture",
      type: "select",
      options: ["EF", "RF", "E-Mount", "Z-Mount", "L-Mount", "PL", "MFT", "M42", "Leica M"],
    },
    {
      key: "filter_size",
      label: "Diametre filtre",
      type: "text",
      placeholder: "77mm",
    },
    {
      key: "has_stabilization",
      label: "Stabilisation optique",
      type: "toggle",
    },
  ],

  cable: [
    {
      key: "connector_type",
      label: "Connecteur",
      type: "select",
      options: [
        "HDMI", "USB-C", "USB-A", "SDI", "XLR", "Jack 3.5mm",
        "Jack 6.35mm", "Ethernet", "DisplayPort", "D-Tap", "V-Mount",
      ],
    },
    {
      key: "cable_length",
      label: "Longueur",
      type: "select",
      options: ["Court (<1m)", "Standard (1-3m)", "Long (3-5m)", "Tres long (>5m)"],
    },
    {
      key: "cable_version",
      label: "Version",
      type: "text",
      placeholder: "HDMI 2.1, USB 3.2...",
    },
  ],

  power: [
    {
      key: "power_type",
      label: "Type",
      type: "select",
      options: [
        "Multiprise", "Rallonge", "Batterie V-Mount", "Batterie NP-F",
        "Chargeur", "Adaptateur secteur", "D-Tap",
      ],
    },
    {
      key: "outlet_count",
      label: "Nombre de prises",
      type: "text",
      placeholder: "4 prises",
    },
    {
      key: "wattage",
      label: "Puissance",
      type: "text",
      placeholder: "100W",
    },
  ],

  lighting: [
    {
      key: "light_type",
      label: "Type",
      type: "select",
      options: ["LED Panel", "Tube LED", "Fresnel", "Softbox", "Ring Light", "Flex", "COB"],
    },
    {
      key: "color_temp",
      label: "Temperature couleur",
      type: "select",
      options: ["Bi-color", "Daylight (5600K)", "Tungsten (3200K)", "RGB", "RGBWW"],
    },
    {
      key: "power_source",
      label: "Alimentation",
      type: "select",
      options: ["Secteur", "Batterie", "Les deux"],
    },
    {
      key: "wattage",
      label: "Puissance",
      type: "text",
      placeholder: "100W",
    },
  ],

  audio: [
    {
      key: "audio_type",
      label: "Type",
      type: "select",
      options: [
        "Micro cravate", "Micro canon", "Micro main",
        "Enregistreur", "Mixette", "Recepteur HF", "Emetteur HF",
      ],
    },
    {
      key: "connectivity",
      label: "Connectique",
      type: "select",
      options: ["XLR", "Jack 3.5mm", "USB", "Sans-fil", "Bluetooth"],
    },
    {
      key: "phantom_power",
      label: "Alimentation fantome 48V",
      type: "toggle",
    },
  ],

  monitoring: [
    {
      key: "screen_size",
      label: "Taille ecran",
      type: "select",
      options: ['5"', '5.5"', '7"', '9"', '13"+'],
    },
    {
      key: "resolution",
      label: "Resolution",
      type: "select",
      options: ["Full HD", "4K", "2K"],
    },
    {
      key: "features",
      label: "Fonctions",
      type: "text",
      placeholder: "HDR, LUT, Waveform, Peaking...",
    },
  ],

  grip: [
    {
      key: "grip_type",
      label: "Type",
      type: "select",
      options: [
        "Trepied", "Monopode", "Slider", "Gimbal", "Dolly",
        "Steadicam", "Cage", "Bras articule", "Clamp",
      ],
    },
    {
      key: "max_load",
      label: "Charge max",
      type: "text",
      placeholder: "15kg",
    },
    {
      key: "max_height",
      label: "Hauteur max",
      type: "text",
      placeholder: "180cm",
    },
  ],

  storage: [
    {
      key: "storage_type",
      label: "Type",
      type: "select",
      options: ["CFexpress A", "CFexpress B", "SD", "microSD", "SSD externe", "HDD", "NAS"],
    },
    {
      key: "capacity",
      label: "Capacite",
      type: "text",
      placeholder: "512GB",
    },
    {
      key: "speed",
      label: "Vitesse",
      type: "text",
      placeholder: "1700MB/s",
    },
  ],

  accessory: [
    {
      key: "accessory_type",
      label: "Type",
      type: "select",
      options: [
        "Color Checker", "Matte Box", "Follow Focus", "Filtre ND",
        "Filtre polarisant", "Diffusion", "Gelatine", "Clap", "Moniteur de retour",
      ],
    },
  ],
};

/**
 * Returns a short summary string of the most relevant attributes for an equipment item.
 */
export function getAttributeSummary(item: {
  universe: EquipmentUniverse;
  attributes?: Record<string, any>;
}): string {
  const attrs = item.attributes;
  if (!attrs || Object.keys(attrs).length === 0) return "";

  const parts: string[] = [];

  switch (item.universe) {
    case "camera":
      if (attrs.sensor_size) parts.push(attrs.sensor_size);
      if (attrs.max_resolution) parts.push(attrs.max_resolution);
      if (attrs.mount) parts.push(attrs.mount);
      break;
    case "lens":
      if (attrs.focal_length) parts.push(attrs.focal_length);
      if (attrs.max_aperture) parts.push(attrs.max_aperture);
      if (attrs.mount) parts.push(attrs.mount);
      break;
    case "cable":
      if (attrs.connector_type) parts.push(attrs.connector_type);
      if (attrs.cable_length) parts.push(attrs.cable_length);
      break;
    case "power":
      if (attrs.power_type) parts.push(attrs.power_type);
      if (attrs.wattage) parts.push(attrs.wattage);
      break;
    case "lighting":
      if (attrs.light_type) parts.push(attrs.light_type);
      if (attrs.color_temp) parts.push(attrs.color_temp);
      if (attrs.wattage) parts.push(attrs.wattage);
      break;
    case "audio":
      if (attrs.audio_type) parts.push(attrs.audio_type);
      if (attrs.connectivity) parts.push(attrs.connectivity);
      break;
    case "monitoring":
      if (attrs.screen_size) parts.push(attrs.screen_size);
      if (attrs.resolution) parts.push(attrs.resolution);
      break;
    case "grip":
      if (attrs.grip_type) parts.push(attrs.grip_type);
      if (attrs.max_load) parts.push(attrs.max_load);
      break;
    case "storage":
      if (attrs.storage_type) parts.push(attrs.storage_type);
      if (attrs.capacity) parts.push(attrs.capacity);
      break;
    case "accessory":
      if (attrs.accessory_type) parts.push(attrs.accessory_type);
      break;
  }

  return parts.join(" \u2022 ");
}
