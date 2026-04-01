import { supabase } from "./supabase";

export interface IdentifiedEquipment {
  universe: string;
  name: string;
  brand: string;
  model: string;
  attributes: Record<string, any>;
}

export async function identifyFromPhoto(
  base64Image: string
): Promise<IdentifiedEquipment> {
  const { data, error } = await supabase.functions.invoke(
    "identify-equipment",
    {
      body: { image: base64Image },
    }
  );
  if (error) throw error;
  return data;
}

export async function searchEquipment(
  query: string
): Promise<IdentifiedEquipment[]> {
  const { data, error } = await supabase.functions.invoke(
    "identify-equipment",
    {
      body: { query },
    }
  );
  if (error) throw error;
  return Array.isArray(data) ? data : [data];
}
