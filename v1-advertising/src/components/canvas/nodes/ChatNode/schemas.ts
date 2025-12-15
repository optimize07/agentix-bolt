import { z } from "zod";

// Zod schema for metadata validation
export const MessageMetadataSchema = z.object({
  images: z.array(z.string().url()).optional(),
  creatives: z.array(z.object({
    title: z.string(),
    headline: z.string(),
    primary_text: z.string(),
    description_text: z.string(),
    visual_prompt: z.string().optional(),
    tags: z.array(z.string()),
    image_data: z.string().optional(),
  })).optional(),
}).nullable();

// Safe metadata parser with validation
export const parseMetadata = (metadata: any) => {
  try {
    const parsed = MessageMetadataSchema.parse(metadata);
    return {
      images: parsed?.images || [],
      creatives: parsed?.creatives || []
    };
  } catch (error) {
    console.warn("Invalid metadata format:", error);
    return { images: [], creatives: [] };
  }
};
