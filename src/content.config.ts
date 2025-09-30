import { defineCollection, z } from "astro:content";

const exercises = defineCollection({
  schema: z.object({
    name: z.string(),
    purpose: z
      .string()
      .regex(/^[A-Za-z0-9\s]+$/, "Purpose must be letters and spaces only"),
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
    source: z.string().optional(),
    credit: z.string().optional(),
  }),
});

const forms = defineCollection({
  schema: z.object({
    name: z.string(),
    shortDescription: z.string(),
    description: z.string(),
    type: z.string().optional(),
    source: z.string().optional(),
    credit: z.string().optional(),
  }),
});

export const collections = {
  exercises,
  warmups,
  forms,
};
