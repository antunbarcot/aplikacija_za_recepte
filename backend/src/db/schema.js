import { pgTable, serial, text, integer, primaryKey } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  thumbnail: text("thumbnail"),
});

export const areasTable = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const recipesTable = pgTable("recipes", {
  id: text("id").primaryKey(), 
  title: text("title").notNull(),
  instructions: text("instructions").notNull(),
  image: text("image"),
  cookTime: text("cook_time").default("30-45 min"), 
  servings: text("servings").default("4"),         
  categoryId: integer("category_id").references(() => categoriesTable.id),
  areaId: integer("area_id").references(() => areasTable.id),
});

export const ingredientsTable = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), 
});

export const recipeIngredientsTable = pgTable("recipe_ingredients", {
  recipeId: text("recipe_id").references(() => recipesTable.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").references(() => ingredientsTable.id, { onDelete: "cascade" }),
  measure: text("measure").notNull(), 
}, (table) => {
  return {

    pk: primaryKey({ columns: [table.recipeId, table.ingredientId] }),
  };
});

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  recipeId: text("recipe_id").references(() => recipesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),       
  image: text("image"),
  cookTime: text("cook_time"),
  servings: text("servings"),
});