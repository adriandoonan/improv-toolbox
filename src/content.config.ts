import { defineCollection, z } from "astro:content";

const exercises = defineCollection({
  schema: z.object({
    name: z.string(),
    purpose: z
      .string()
      .regex(/^[A-Za-z0-9]+$/, "Purpose must be a single word with no spaces"),
    shortDescription: z.string(),
    focus: z.string().optional(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    source: z.string(),
    credit: z.string(),
    minimumPeople: z.number().optional(),
  }),
});

const warmups = defineCollection({
  schema: z.object({
    name: z.string(),
    shortDescription: z.string(),
    description: z.string(),
    focus: z.string().optional(),
    minimumPeople: z.number().optional(),
  }),
});

const forms = defineCollection({
  schema: z.object({
    name: z.string(),
    shortDescription: z.string(),
    description: z.string(),
    type: z.string().optional(),
  }),
});

export const collections = {
  exercises,
  warmups,
  forms,
};
