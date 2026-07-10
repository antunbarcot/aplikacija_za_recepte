import { db } from "./src/config/db.js"; 
import { 
  categoriesTable, 
  areasTable, 
  recipesTable, 
  ingredientsTable, 
  recipeIngredientsTable 
} from "./src/db/schema.js";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🚀 Započinjem napredno punjenje baze podataka (6 tablica)...");

  try {
    // 1. Odabiremo 4 atraktivne kategorije s TheMealDB
    const odabraneKategorije = ["Chicken", "Beef", "Dessert", "Seafood"];

    // Mapiramo privremene ID-jeve regija i sastojaka koje unesemo da izbjegnemo duplikate
    const uneseneRegije = {}; // { "Italian": 1, "Mexican": 2 }
    const uneseniSastojci = {}; // { "Salt": 1, "Chicken": 2 }

    for (const katName of odabraneKategorije) {
      // Unosimo kategoriju i hvatamo njezin ID unutar naše baze
      // TheMealDB ima i sličicu kategorije pa je usput povlačimo
      const thumbnail_url = `https://www.themealdb.com/images/category/${katName}.png`;
      const [novaKategorija] = await db
        .insert(categoriesTable)
        .values({ name: katName, thumbnail: thumbnail_url })
        .onConflictDoNothing({ target: categoriesTable.name }) // Ako već postoji, nemoj baciti grešku
        .returning();
      
      // Ako je već postojala, moramo je ručno dohvatiti da saznamo ID
      let categoryId = novaKategorija?.id;
      if (!categoryId) {
        const [postojeca] = await db.select().from(categoriesTable).where(eq(categoriesTable.name, katName));
        categoryId = postojeca.id;
      }

      console.log(`📂 Obrađujem kategoriju: ${katName} (ID u našoj bazi: ${categoryId})`);

      // Povlačimo listu jela za tu kategoriju
      const listaOdgovor = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${katName}`);
      const listaPodaci = await listaOdgovor.json();
      
      // Uzimamo prvih 10 jela iz svake kategorije (ukupno oko 40 recepata, idealno za profesora)
      const jela = listaPodaci.meals.slice(0, 10);

      for (const jelo of jela) {
        // Za svako jelo moramo povući puni detalj (upute, sastojke, regiju)
        const detaljiOdgovor = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${jelo.idMeal}`);
        const detaljiPodaci = await detaljiOdgovor.json();
        const m = detaljiPodaci.meals[0]; // Kratica 'm' za meal radi lakšeg pisanja

        if (!m) continue;

        // --- RUČNI RAD S REGIJAMA (Areas) ---
        let areaId = null;
        if (m.strArea) {
          // Ako regiju nismo unijeli ranije u ovoj skripti
          if (!uneseneRegije[m.strArea]) {
            const [novaRegija] = await db
              .insert(areasTable)
              .values({ name: m.strArea })
              .onConflictDoNothing({ target: areasTable.name })
              .returning();
            
            if (novaRegija) {
              uneseneRegije[m.strArea] = novaRegija.id;
            } else {
              const [postojeca] = await db.select().from(areasTable).where(eq(areasTable.name, m.strArea));
              uneseneRegije[m.strArea] = postojeca.id;
            }
          }
          areaId = uneseneRegije[m.strArea];
        }

        // --- UNOS RECEPATA ---
        await db.insert(recipesTable).values({
          id: m.idMeal, // Prepisujemo njegov originalni ID (tekst)
          title: m.strMeal,
          instructions: m.strInstructions,
          image: m.strMealThumb,
          //youtubeUrl: m.strYoutube,
          cookTime: `${Math.floor(Math.random() * 30) + 20} min`, // Generiramo realno vrijeme kuhanja pošto API nema
          servings: `${Math.floor(Math.random() * 3) + 2}`,       // Generiramo broj porcija (2 do 5)
          categoryId: categoryId,
          areaId: areaId
        }).onConflictDoNothing();

        console.log(`   - Spremljen recept: ${m.strMeal}`);

        // --- PETLJA ZA SASTOJKE (Od 1 do 20) ---
        for (let i = 1; i <= 20; i++) {
          const sastojakNaziv = m[`strIngredient${i}`]?.trim();
          const kolicina = m[`strMeasure${i}`]?.trim();

          // Ako nema više sastojaka u JSON-u, prekini petlju za taj recept
          if (!sastojakNaziv || sastojakNaziv === "") break;

          let ingredientId = null;

          // Ako sastojak ne postoji u našem sjećanju, unesi ga u bazu
          if (!uneseniSastojci[sastojakNaziv]) {
            const [noviSastojak] = await db
              .insert(ingredientsTable)
              .values({ name: sastojakNaziv })
              .onConflictDoNothing({ target: ingredientsTable.name })
              .returning();

            if (noviSastojak) {
              uneseniSastojci[sastojakNaziv] = noviSastojak.id;
            } else {
              const [postojeci] = await db.select().from(ingredientsTable).where(eq(ingredientsTable.name, sastojakNaziv));
              uneseniSastojci[sastojakNaziv] = postojeci.id;
            }
          }
          ingredientId = uneseniSastojci[sastojakNaziv];

          // Sada ih spajamo u Many-to-Many tablicu
          if (ingredientId) {
            await db.insert(recipeIngredientsTable).values({
              recipeId: m.idMeal,
              ingredientId: ingredientId,
              measure: kolicina || "to taste"
            }).onConflictDoNothing();
          }
        }
      }
    }

    console.log("✅ ČESTITAMO! Tvoja baza podataka je uspješno normalizirana i napunjena!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Greška tijekom izvršavanja seed skripte:", error);
    process.exit(1);
  }
}

seed();