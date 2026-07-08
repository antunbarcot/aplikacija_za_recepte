const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

export const MealAPI = {
  // pretraga jela po imenu
  searchMealsByName: async (query) => {
    try {
      const response = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error("Error searching meals by name:", error);
      return [];
    }
  },

  // pretraga detalja jela po ID-u
  getMealById: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
      const data = await response.json();
      return data.meals ? data.meals[0] : null;
    } catch (error) {
      console.error("Error getting meal by id:", error);
      return null;
    }
  },

  // pretraga jednog nasumičnog jela
  getRandomMeal: async () => {
    try {
      const response = await fetch(`${BASE_URL}/random.php`);
      const data = await response.json();
      return data.meals ? data.meals[0] : null;
    } catch (error) {
      console.error("Error getting random meal:", error);
      return null;
    }
  },

  // dobivanje više nasumičnih jela
  getRandomMeals: async (count = 6) => {
    try {
      const promises = Array(count)
        .fill()
        .map(() => MealAPI.getRandomMeal());
      const meals = await Promise.all(promises);
      return meals.filter((meal) => meal !== null);
    } catch (error) {
      console.error("Error getting random meals:", error);
      return [];
    }
  },

  // izlistaj kategorije jela
  getCategories: async () => {
    try {
      const response = await fetch(`${BASE_URL}/categories.php`);
      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  },

  // pretraži po sastojku
  filterByIngredient: async (ingredient) => {
    try {
      const response = await fetch(`${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error("Error filtering by ingredient:", error);
      return [];
    }
  },

  // retraži po kategoriji
  filterByCategory: async (category) => {
    try {
      const response = await fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error("Error filtering by category:", error);
      return [];
    }
  },

  // pretvaranje formata iz TheMealDb u format aplikacije
  transformMealData: (meal) => {
    if (!meal) return null;

    // izvlačenje sastojaka 
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        const measureText = measure && measure.trim() ? `${measure.trim()} ` : "";
        ingredients.push(`${measureText}${ingredient.trim()}`);
      }
    }

    // izvlačenje uputa
    const instructions = meal.strInstructions
      ? meal.strInstructions.split(/\r?\n/).filter((step) => step.trim())
      : [];

    return {
      id: meal.idMeal,
      title: meal.strMeal,
      description: meal.strInstructions
        ? meal.strInstructions.substring(0, 120) + "..."
        : "Delicious meal from TheMealDB",
      image: meal.strMealThumb,
      cookTime: "30 minutes",
      servings: 4,
      category: meal.strCategory || "Main Course",
      area: meal.strArea,
      ingredients,
      instructions,
      originalData: meal,
    };
  },
};
