// Shared constants + validation for Campus Connect.
import { z } from "zod";

export const CATEGORIES = [
  "Electronics",
  "Bags & Wallets",
  "Keys",
  "ID & Cards",
  "Books & Stationery",
  "Clothing",
  "Water Bottles",
  "Jewelry",
  "Documents",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const itemFormSchema = z.object({
  type: z.enum(["lost", "found"]),
  title: z.string().trim().min(2, "Title is too short").max(120, "Title is too long"),
  description: z
    .string()
    .trim()
    .min(5, "Please add a short description")
    .max(2000, "Description is too long"),
  category: z.enum(CATEGORIES),
  location: z.string().trim().min(2, "Where on campus?").max(120),
  image_url: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .max(500)
    .optional()
    .or(z.literal("")),
  contact_info: z
    .string()
    .trim()
    .min(3, "How should people reach you?")
    .max(200, "Keep contact info under 200 characters"),
  occurred_at: z.string().min(1, "When did it happen?"),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
