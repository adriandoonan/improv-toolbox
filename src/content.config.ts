import { defineCollection, z } from "astro:content";

const exercises = defineCollection({
  schema: z.object({
    name: z.string(),
    shortDescription: z.string(),
    focus: z.string().optional(),
    minimumPeople: z.number().optional(),
  })
});

const warmups = defineCollection({
  schema: z.object({
    name: z.string(),
    shortDescription: z.string(),
    focus: z.string().optional(),
    minimumPeople: z.number().optional(),
  })
});

const forms = defineCollection({
  schema: z.object({
    name: z.string(),
    shortDescription: z.string(),
    type: z.string().optional(),
  })
});

export const collections = {
  exercises,
  warmups,
  forms,
};
