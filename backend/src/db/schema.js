import { pgTable, serial, text, integer, primaryKey } from "drizzle-orm/pg-core";

// 1. TABLICA KATEGORIJA
export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  thumbnail: text("thumbnail"),
});

// 2. TABLICA REGIJA / KUHINJA (npr. Italian, Mexican, Croatian...)
export const areasTable = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// 3. TABLICA RECEPATA
export const recipesTable = pgTable("recipes", {
  // VAŽNO: id NIJE 'serial' (brojač), nego 'text' jer prepisujemo ID iz TheMealDB-a (npr. "52772")
  id: text("id").primaryKey(), 
  title: text("title").notNull(),
  instructions: text("instructions").notNull(),
  image: text("image"),
  //youtubeUrl: text("youtube_url"),
  cookTime: text("cook_time").default("30-45 min"), // Fiksno jer vanjski API to nema
  servings: text("servings").default("4"),         // Fiksno
  
  // Strani ključevi koji povezuju recept s kategorijom i regijom
  categoryId: integer("category_id").references(() => categoriesTable.id),
  areaId: integer("area_id").references(() => areasTable.id),
});

// 4. TABLICA SASTOJAKA
export const ingredientsTable = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // npr. "Chicken", "Salt"
});

// 5. SPOJNA TABLICA: RECEPTI <-> SASTOJCI (Many-to-Many)
// Jedan recept ima više sastojaka, jedan sastojak ide u više recepata
export const recipeIngredientsTable = pgTable("recipe_ingredients", {
  recipeId: text("recipe_id").references(() => recipesTable.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").references(() => ingredientsTable.id, { onDelete: "cascade" }),
  measure: text("measure").notNull(), // količina, npr. "2 tbsps", "500g"
}, (table) => {
  return {
    // Kombinacija ova dva ID-ja čini jedinstveni primarni ključ ove tablice
    pk: primaryKey({ columns: [table.recipeId, table.ingredientId] }),
  };
});

// // 6. TABLICA FAVORITA (Korisnički dio iz videa)
// export const favoritesTable = pgTable("favorites", {
//   id: serial("id").primaryKey(),
//   userId: text("user_id").notNull(), // ID korisnika iz Clerk-a
  
//   // Sada je recipeId pravi strani ključ (FK) povezan s našom tablicom recipes
//   recipeId: text("recipe_id").references(() => recipesTable.id, { onDelete: "cascade" }),
// });
export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  recipeId: text("recipe_id").references(() => recipesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),       // Vraćamo title!
  image: text("image"),
  cookTime: text("cook_time"),
  servings: text("servings"),
});