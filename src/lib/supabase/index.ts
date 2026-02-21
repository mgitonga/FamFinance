export { createClient } from "./client";
export { createClient as createServerClient, getUser, getUserProfile, isAdmin } from "./server";
export { updateSession } from "./middleware";
export type { Database, Tables, InsertTables, UpdateTables, Enums } from "./types";
