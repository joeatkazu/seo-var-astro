import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    author: z.string(),
    readTime: z.string(),
    coverImage: z.string(),
    tags: z.array(z.string()),
  }),
});

export const collections = { posts };
