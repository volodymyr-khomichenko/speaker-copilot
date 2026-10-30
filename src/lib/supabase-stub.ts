/** Stand-in so the offline preview build never bundles the Supabase client. */
export function createClient(): never {
  throw new Error("Supabase is not part of the offline preview build");
}
