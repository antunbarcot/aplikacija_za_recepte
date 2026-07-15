import express from "express";
import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import {
  favoritesTable,
  categoriesTable,
  recipesTable,
  ingredientsTable,
  recipeIngredientsTable,
  areasTable,
} from "./db/schema.js";
import { and, eq, ilike, inArray } from "drizzle-orm";
import job from "./config/cron.js";

const app = express();
const PORT = ENV.PORT || 5001;

if (ENV.NODE_ENV === "production") job.start();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true });
});

app.post("/api/favorites", async (req, res) => {
  try {
    const { userId, recipeId, title, image, cookTime, servings } = req.body;

    if (!userId || !recipeId || !title) {
      return res
        .status(400)
        .json({ error: "Missing required fields: userId, recipeId or title" });
    }

    const newFavorite = await db
      .insert(favoritesTable)
      .values({
        userId,
        recipeId,
        title,
        image,
        cookTime,
        servings,
      })
      .returning();

    res.status(201).json(newFavorite[0]);
  } catch (error) {
    console.log("Error adding favorite", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const userFavorites = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId));

    res.status(200).json(userFavorites);
  } catch (error) {
    console.log("Error fetching the favorites", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
  try {
    const { userId, recipeId } = req.params;

    await db
      .delete(favoritesTable)
      .where(
        and(
          eq(favoritesTable.userId, userId),
          eq(favoritesTable.recipeId, recipeId)
        )
      );

    res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.log("Error removing a favorite", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const allCategories = await db.select().from(categoriesTable);
    res.status(200).json(allCategories);
  } catch (error) {
    console.log("Greška pri dohvaćanju kategorija:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/recipes", async (req, res) => {
  try {
    const { search, categoryId } = req.query;

    const conditions = [];

    if (search) {
      conditions.push(ilike(recipesTable.title, `%${search}%`));
    }

    if (categoryId) {
      conditions.push(eq(recipesTable.categoryId, Number(categoryId)));
    }

    let query = db.select().from(recipesTable);

    if (conditions.length === 1) {
      query = query.where(conditions[0]);
    } else if (conditions.length > 1) {
      query = query.where(and(...conditions));
    }

    const filteredRecipes = await query;
    res.status(200).json(filteredRecipes);
  } catch (error) {
    console.log("Greška pri dohvaćanju recepata:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// app.get("/api/recipes/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const recipeRows = await db
//       .select()
//       .from(recipesTable)
//       .where(eq(recipesTable.id, id));

//     if (!recipeRows.length) {
//       return res.status(404).json({ error: "Recipe not found" });
//     }

//     const recipe = recipeRows[0];

//     let categoryName = "Uncategorized";

//     if (recipe.categoryId) {
//       const categoryRows = await db
//         .select()
//         .from(categoriesTable)
//         .where(eq(categoriesTable.id, recipe.categoryId));

//       if (categoryRows.length > 0) {
//         categoryName = categoryRows[0].name;
//       }
//     }

//     const recipeIngredientRows = await db
//       .select()
//       .from(recipeIngredientsTable)
//       .where(eq(recipeIngredientsTable.recipeId, id));

//     const ingredientIds = recipeIngredientRows.map((row) => row.ingredientId);

//     let ingredients = [];

//     if (ingredientIds.length > 0) {
//       ingredients = await db
//         .select()
//         .from(ingredientsTable)
//         .where(inArray(ingredientsTable.id, ingredientIds));
//     }

//     const ingredientMap = new Map(
//       ingredients.map((ingredient) => [ingredient.id, ingredient])
//     );

//     const formattedIngredients = recipeIngredientRows.map((row) => {
//       const ingredient = ingredientMap.get(row.ingredientId);
//       if (!ingredient) return row.measure;
//       return row.measure
//         ? `${ingredient.name} - ${row.measure}`
//         : ingredient.name;
//     });

//     const formattedInstructions = recipe.instructions
//       ? recipe.instructions
//           .split(/\r?\n/)
//           .map((step) => step.trim())
//           .filter(Boolean)
//       : [];

//     res.status(200).json({
//       ...recipe,
//       category: categoryName,
//       ingredients: formattedIngredients,
//       instructions: formattedInstructions,
//     });
//   } catch (error) {
//     console.log("Greška pri dohvaćanju detalja recepta:", error);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// });
app.get("/api/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const recipeRows = await db
      .select()
      .from(recipesTable)
      .where(eq(recipesTable.id, id));

    if (!recipeRows.length) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const recipe = recipeRows[0];

    // 1. Dohvat naziva kategorije
    let categoryName = "Uncategorized";
    if (recipe.categoryId) {
      const categoryRows = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, recipe.categoryId));

      if (categoryRows.length > 0) {
        categoryName = categoryRows[0].name;
      }
    }

    // 2. NOVO: Dohvat naziva regije (Area)
    let areaName = "Unknown";
    if (recipe.areaId) {
      const areaRows = await db
        .select()
        .from(areasTable)
        .where(eq(areasTable.id, recipe.areaId));

      if (areaRows.length > 0) {
        areaName = areaRows[0].name;
      }
    }

    // 3. Dohvat sastojaka recepta
    const recipeIngredientRows = await db
      .select()
      .from(recipeIngredientsTable)
      .where(eq(recipeIngredientsTable.recipeId, id));

    const ingredientIds = recipeIngredientRows.map((row) => row.ingredientId);

    let ingredients = [];
    if (ingredientIds.length > 0) {
      ingredients = await db
        .select()
        .from(ingredientsTable)
        .where(inArray(ingredientsTable.id, ingredientIds));
    }

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient])
    );

    const formattedIngredients = recipeIngredientRows.map((row) => {
      const ingredient = ingredientMap.get(row.ingredientId);
      if (!ingredient) return row.measure;
      return row.measure
        ? `${ingredient.name} - ${row.measure}`
        : ingredient.name;
    });

    // 4. Formatiranje uputa
    const formattedInstructions = recipe.instructions
      ? recipe.instructions
          .split(/\r?\n/)
          .map((step) => step.trim())
          .filter(Boolean)
      : [];

    // 5. Slanje odgovora s uključenom regijom
    res.status(200).json({
      ...recipe,
      category: categoryName,
      area: areaName, // <--- SADA ŠALJEMO NAZIV REGIJE (npr. "Italian") NA FRONTEND!
      ingredients: formattedIngredients,
      instructions: formattedInstructions,
    });
  } catch (error) {
    console.log("Greška pri dohvaćanju detalja recepta:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log("Server is running on PORT:", PORT);
});