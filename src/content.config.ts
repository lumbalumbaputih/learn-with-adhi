import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const courses = defineCollection({
  loader: glob({ base: './src/content/courses', pattern: '**/*.mdx' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    eyebrow: z.string(),
    description: z.string(),
    icon: z.string(),
    tags: z.array(z.string()),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    kombinasi: z.enum(['K1', 'K2', 'K3', 'K4', 'K5']),
    courseKey: z.enum(['code', 'carbon', 'ai', 'bahasa', 'precision']),
    updated: z.coerce.date(),
  }),
});

export const collections = { courses };
