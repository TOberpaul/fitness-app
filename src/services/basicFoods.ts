import type { Food } from '../types';

/**
 * Lokale Datenbank mit frischen Grundnahrungsmitteln.
 * Nährwerte pro 100g, Quelle: BLS / USDA SR Legacy.
 * Deckt frisches Obst, Gemüse, Fleisch, Fisch, Milchprodukte, Eier, Getreide ab.
 */
const basicFoods: Food[] = [
  // Gemüse
  { id: 'basic_kartoffel', source: 'local', name: 'Kartoffel, roh', kcal_per_100g: 77, protein_per_100g: 2, carbs_per_100g: 17, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_suesskartoffel', source: 'local', name: 'Süßkartoffel, roh', kcal_per_100g: 86, protein_per_100g: 1.6, carbs_per_100g: 20, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_karotte', source: 'local', name: 'Karotte, roh', kcal_per_100g: 41, protein_per_100g: 0.9, carbs_per_100g: 10, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_tomate', source: 'local', name: 'Tomate, roh', kcal_per_100g: 18, protein_per_100g: 0.9, carbs_per_100g: 3.9, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_gurke', source: 'local', name: 'Gurke, roh', kcal_per_100g: 12, protein_per_100g: 0.6, carbs_per_100g: 1.8, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_paprika_rot', source: 'local', name: 'Paprika rot, roh', kcal_per_100g: 31, protein_per_100g: 1, carbs_per_100g: 6, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_paprika_gruen', source: 'local', name: 'Paprika grün, roh', kcal_per_100g: 20, protein_per_100g: 0.9, carbs_per_100g: 3.5, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_brokkoli', source: 'local', name: 'Brokkoli, roh', kcal_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4, default_unit: 'g' },
  { id: 'basic_blumenkohl', source: 'local', name: 'Blumenkohl, roh', kcal_per_100g: 25, protein_per_100g: 1.9, carbs_per_100g: 5, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_zucchini', source: 'local', name: 'Zucchini, roh', kcal_per_100g: 17, protein_per_100g: 1.2, carbs_per_100g: 3.1, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_spinat', source: 'local', name: 'Spinat, roh', kcal_per_100g: 23, protein_per_100g: 2.9, carbs_per_100g: 3.6, fat_per_100g: 0.4, default_unit: 'g' },
  { id: 'basic_salat_eisberg', source: 'local', name: 'Eisbergsalat', kcal_per_100g: 14, protein_per_100g: 0.9, carbs_per_100g: 3, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_zwiebel', source: 'local', name: 'Zwiebel, roh', kcal_per_100g: 40, protein_per_100g: 1.1, carbs_per_100g: 9.3, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_knoblauch', source: 'local', name: 'Knoblauch, roh', kcal_per_100g: 149, protein_per_100g: 6.4, carbs_per_100g: 33, fat_per_100g: 0.5, default_unit: 'g' },
  { id: 'basic_champignon', source: 'local', name: 'Champignon, roh', kcal_per_100g: 22, protein_per_100g: 3.1, carbs_per_100g: 3.3, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_aubergine', source: 'local', name: 'Aubergine, roh', kcal_per_100g: 25, protein_per_100g: 1, carbs_per_100g: 6, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_mais', source: 'local', name: 'Mais, roh', kcal_per_100g: 86, protein_per_100g: 3.3, carbs_per_100g: 19, fat_per_100g: 1.4, default_unit: 'g' },
  { id: 'basic_erbsen', source: 'local', name: 'Erbsen, grün, roh', kcal_per_100g: 81, protein_per_100g: 5.4, carbs_per_100g: 14, fat_per_100g: 0.4, default_unit: 'g' },
  { id: 'basic_bohnen_gruen', source: 'local', name: 'Grüne Bohnen, roh', kcal_per_100g: 31, protein_per_100g: 1.8, carbs_per_100g: 7, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_kohlrabi', source: 'local', name: 'Kohlrabi, roh', kcal_per_100g: 27, protein_per_100g: 1.7, carbs_per_100g: 6.2, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_sellerie', source: 'local', name: 'Sellerie, roh', kcal_per_100g: 14, protein_per_100g: 0.7, carbs_per_100g: 3, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_lauch', source: 'local', name: 'Lauch / Porree, roh', kcal_per_100g: 61, protein_per_100g: 1.5, carbs_per_100g: 14, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_kuerbis', source: 'local', name: 'Kürbis, roh', kcal_per_100g: 26, protein_per_100g: 1, carbs_per_100g: 6.5, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_spargel', source: 'local', name: 'Spargel, roh', kcal_per_100g: 20, protein_per_100g: 2.2, carbs_per_100g: 3.9, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_rosenkohl', source: 'local', name: 'Rosenkohl, roh', kcal_per_100g: 43, protein_per_100g: 3.4, carbs_per_100g: 9, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_rotkohl', source: 'local', name: 'Rotkohl, roh', kcal_per_100g: 31, protein_per_100g: 1.4, carbs_per_100g: 7.4, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_weisskohl', source: 'local', name: 'Weißkohl, roh', kcal_per_100g: 25, protein_per_100g: 1.3, carbs_per_100g: 5.8, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_fenchel', source: 'local', name: 'Fenchel, roh', kcal_per_100g: 31, protein_per_100g: 1.2, carbs_per_100g: 7.3, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_radieschen', source: 'local', name: 'Radieschen, roh', kcal_per_100g: 16, protein_per_100g: 0.7, carbs_per_100g: 3.4, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_rote_bete', source: 'local', name: 'Rote Bete, roh', kcal_per_100g: 43, protein_per_100g: 1.6, carbs_per_100g: 10, fat_per_100g: 0.2, default_unit: 'g' },

  // Obst
  { id: 'basic_apfel', source: 'local', name: 'Apfel, roh', kcal_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_banane', source: 'local', name: 'Banane, roh', kcal_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_orange', source: 'local', name: 'Orange, roh', kcal_per_100g: 47, protein_per_100g: 0.9, carbs_per_100g: 12, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_erdbeere', source: 'local', name: 'Erdbeere, roh', kcal_per_100g: 32, protein_per_100g: 0.7, carbs_per_100g: 7.7, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_heidelbeere', source: 'local', name: 'Heidelbeere, roh', kcal_per_100g: 57, protein_per_100g: 0.7, carbs_per_100g: 14, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_himbeere', source: 'local', name: 'Himbeere, roh', kcal_per_100g: 52, protein_per_100g: 1.2, carbs_per_100g: 12, fat_per_100g: 0.7, default_unit: 'g' },
  { id: 'basic_traube', source: 'local', name: 'Weintraube, roh', kcal_per_100g: 69, protein_per_100g: 0.7, carbs_per_100g: 18, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_birne', source: 'local', name: 'Birne, roh', kcal_per_100g: 57, protein_per_100g: 0.4, carbs_per_100g: 15, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_pfirsich', source: 'local', name: 'Pfirsich, roh', kcal_per_100g: 39, protein_per_100g: 0.9, carbs_per_100g: 10, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_kirsche', source: 'local', name: 'Kirsche, roh', kcal_per_100g: 50, protein_per_100g: 1, carbs_per_100g: 12, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_wassermelone', source: 'local', name: 'Wassermelone, roh', kcal_per_100g: 30, protein_per_100g: 0.6, carbs_per_100g: 8, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_mango', source: 'local', name: 'Mango, roh', kcal_per_100g: 60, protein_per_100g: 0.8, carbs_per_100g: 15, fat_per_100g: 0.4, default_unit: 'g' },
  { id: 'basic_ananas', source: 'local', name: 'Ananas, roh', kcal_per_100g: 50, protein_per_100g: 0.5, carbs_per_100g: 13, fat_per_100g: 0.1, default_unit: 'g' },
  { id: 'basic_kiwi', source: 'local', name: 'Kiwi, roh', kcal_per_100g: 61, protein_per_100g: 1.1, carbs_per_100g: 15, fat_per_100g: 0.5, default_unit: 'g' },
  { id: 'basic_zitrone', source: 'local', name: 'Zitrone, roh', kcal_per_100g: 29, protein_per_100g: 1.1, carbs_per_100g: 9.3, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_avocado', source: 'local', name: 'Avocado, roh', kcal_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 8.5, fat_per_100g: 15, default_unit: 'g' },
  { id: 'basic_pflaume', source: 'local', name: 'Pflaume, roh', kcal_per_100g: 46, protein_per_100g: 0.7, carbs_per_100g: 11, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_granatapfel', source: 'local', name: 'Granatapfel, roh', kcal_per_100g: 83, protein_per_100g: 1.7, carbs_per_100g: 19, fat_per_100g: 1.2, default_unit: 'g' },

  // Fleisch & Geflügel
  { id: 'basic_haehnchenbrust', source: 'local', name: 'Hähnchenbrust, roh', kcal_per_100g: 120, protein_per_100g: 22, carbs_per_100g: 0, fat_per_100g: 3, default_unit: 'g' },
  { id: 'basic_haehnchenkeule', source: 'local', name: 'Hähnchenschenkel, roh', kcal_per_100g: 180, protein_per_100g: 17, carbs_per_100g: 0, fat_per_100g: 12, default_unit: 'g' },
  { id: 'basic_putenbrust', source: 'local', name: 'Putenbrust, roh', kcal_per_100g: 104, protein_per_100g: 24, carbs_per_100g: 0, fat_per_100g: 1, default_unit: 'g' },
  { id: 'basic_rindfleisch', source: 'local', name: 'Rindfleisch mager, roh', kcal_per_100g: 136, protein_per_100g: 21, carbs_per_100g: 0, fat_per_100g: 5.5, default_unit: 'g' },
  { id: 'basic_rinderhack', source: 'local', name: 'Rinderhackfleisch, roh', kcal_per_100g: 212, protein_per_100g: 17, carbs_per_100g: 0, fat_per_100g: 16, default_unit: 'g' },
  { id: 'basic_schweinefleisch', source: 'local', name: 'Schweinefleisch mager, roh', kcal_per_100g: 143, protein_per_100g: 21, carbs_per_100g: 0, fat_per_100g: 6.5, default_unit: 'g' },
  { id: 'basic_schweinehack', source: 'local', name: 'Schweinehackfleisch, roh', kcal_per_100g: 263, protein_per_100g: 15, carbs_per_100g: 0, fat_per_100g: 22, default_unit: 'g' },
  { id: 'basic_lammfleisch', source: 'local', name: 'Lammfleisch mager, roh', kcal_per_100g: 162, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 9, default_unit: 'g' },

  // Fisch & Meeresfrüchte
  { id: 'basic_lachs', source: 'local', name: 'Lachs, roh', kcal_per_100g: 208, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 13, default_unit: 'g' },
  { id: 'basic_thunfisch', source: 'local', name: 'Thunfisch, roh', kcal_per_100g: 130, protein_per_100g: 29, carbs_per_100g: 0, fat_per_100g: 1, default_unit: 'g' },
  { id: 'basic_kabeljau', source: 'local', name: 'Kabeljau / Dorsch, roh', kcal_per_100g: 82, protein_per_100g: 18, carbs_per_100g: 0, fat_per_100g: 0.7, default_unit: 'g' },
  { id: 'basic_forelle', source: 'local', name: 'Forelle, roh', kcal_per_100g: 119, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 3.5, default_unit: 'g' },
  { id: 'basic_garnelen', source: 'local', name: 'Garnelen, roh', kcal_per_100g: 85, protein_per_100g: 20, carbs_per_100g: 0.2, fat_per_100g: 0.5, default_unit: 'g' },
  { id: 'basic_hering', source: 'local', name: 'Hering, roh', kcal_per_100g: 158, protein_per_100g: 18, carbs_per_100g: 0, fat_per_100g: 9, default_unit: 'g' },
  { id: 'basic_makrele', source: 'local', name: 'Makrele, roh', kcal_per_100g: 205, protein_per_100g: 19, carbs_per_100g: 0, fat_per_100g: 14, default_unit: 'g' },

  // Milchprodukte & Eier
  { id: 'basic_vollmilch', source: 'local', name: 'Vollmilch 3,5%', kcal_per_100g: 64, protein_per_100g: 3.3, carbs_per_100g: 4.7, fat_per_100g: 3.5, default_unit: 'ml' },
  { id: 'basic_fettarme_milch', source: 'local', name: 'Fettarme Milch 1,5%', kcal_per_100g: 47, protein_per_100g: 3.4, carbs_per_100g: 4.9, fat_per_100g: 1.5, default_unit: 'ml' },
  { id: 'basic_magerquark', source: 'local', name: 'Magerquark', kcal_per_100g: 67, protein_per_100g: 12, carbs_per_100g: 4, fat_per_100g: 0.3, default_unit: 'g' },
  { id: 'basic_naturjoghurt', source: 'local', name: 'Naturjoghurt 3,5%', kcal_per_100g: 61, protein_per_100g: 3.5, carbs_per_100g: 4.7, fat_per_100g: 3.5, default_unit: 'g' },
  { id: 'basic_skyr', source: 'local', name: 'Skyr natur', kcal_per_100g: 63, protein_per_100g: 11, carbs_per_100g: 4, fat_per_100g: 0.2, default_unit: 'g' },
  { id: 'basic_ei', source: 'local', name: 'Hühnerei, roh', kcal_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11, default_unit: 'g' },
  { id: 'basic_butter', source: 'local', name: 'Butter', kcal_per_100g: 717, protein_per_100g: 0.9, carbs_per_100g: 0.1, fat_per_100g: 81, default_unit: 'g' },
  { id: 'basic_gouda', source: 'local', name: 'Gouda, 48% Fett i.Tr.', kcal_per_100g: 356, protein_per_100g: 25, carbs_per_100g: 0, fat_per_100g: 28, default_unit: 'g' },
  { id: 'basic_mozzarella', source: 'local', name: 'Mozzarella', kcal_per_100g: 280, protein_per_100g: 22, carbs_per_100g: 2.2, fat_per_100g: 21, default_unit: 'g' },
  { id: 'basic_frischkaese', source: 'local', name: 'Frischkäse Doppelrahmstufe', kcal_per_100g: 262, protein_per_100g: 6, carbs_per_100g: 3, fat_per_100g: 25, default_unit: 'g' },
  { id: 'basic_sahne', source: 'local', name: 'Schlagsahne 30%', kcal_per_100g: 292, protein_per_100g: 2.4, carbs_per_100g: 3.2, fat_per_100g: 30, default_unit: 'ml' },

  // Getreide, Hülsenfrüchte & Beilagen
  { id: 'basic_reis_weiss', source: 'local', name: 'Reis weiß, roh', kcal_per_100g: 360, protein_per_100g: 6.7, carbs_per_100g: 79, fat_per_100g: 0.6, default_unit: 'g' },
  { id: 'basic_reis_vollkorn', source: 'local', name: 'Vollkornreis, roh', kcal_per_100g: 362, protein_per_100g: 7.5, carbs_per_100g: 76, fat_per_100g: 2.7, default_unit: 'g' },
  { id: 'basic_nudeln', source: 'local', name: 'Nudeln / Pasta, roh', kcal_per_100g: 359, protein_per_100g: 12, carbs_per_100g: 72, fat_per_100g: 1.5, default_unit: 'g' },
  { id: 'basic_vollkornnudeln', source: 'local', name: 'Vollkornnudeln, roh', kcal_per_100g: 348, protein_per_100g: 13, carbs_per_100g: 66, fat_per_100g: 2.5, default_unit: 'g' },
  { id: 'basic_haferflocken', source: 'local', name: 'Haferflocken', kcal_per_100g: 379, protein_per_100g: 13, carbs_per_100g: 67, fat_per_100g: 7, default_unit: 'g' },
  { id: 'basic_brot_vollkorn', source: 'local', name: 'Vollkornbrot', kcal_per_100g: 213, protein_per_100g: 7, carbs_per_100g: 41, fat_per_100g: 1.2, default_unit: 'g' },
  { id: 'basic_brot_weizen', source: 'local', name: 'Weizenbrot / Toast', kcal_per_100g: 265, protein_per_100g: 9, carbs_per_100g: 49, fat_per_100g: 3.2, default_unit: 'g' },
  { id: 'basic_linsen', source: 'local', name: 'Linsen, getrocknet', kcal_per_100g: 353, protein_per_100g: 25, carbs_per_100g: 60, fat_per_100g: 1.1, default_unit: 'g' },
  { id: 'basic_kichererbsen', source: 'local', name: 'Kichererbsen, getrocknet', kcal_per_100g: 364, protein_per_100g: 19, carbs_per_100g: 61, fat_per_100g: 6, default_unit: 'g' },
  { id: 'basic_kidneybohnen', source: 'local', name: 'Kidneybohnen, getrocknet', kcal_per_100g: 333, protein_per_100g: 24, carbs_per_100g: 60, fat_per_100g: 0.8, default_unit: 'g' },
  { id: 'basic_tofu', source: 'local', name: 'Tofu natur', kcal_per_100g: 76, protein_per_100g: 8, carbs_per_100g: 1.9, fat_per_100g: 4.8, default_unit: 'g' },
  { id: 'basic_quinoa', source: 'local', name: 'Quinoa, roh', kcal_per_100g: 368, protein_per_100g: 14, carbs_per_100g: 64, fat_per_100g: 6, default_unit: 'g' },
  { id: 'basic_couscous', source: 'local', name: 'Couscous, roh', kcal_per_100g: 376, protein_per_100g: 13, carbs_per_100g: 77, fat_per_100g: 0.6, default_unit: 'g' },

  // Öle & Fette
  { id: 'basic_olivenoel', source: 'local', name: 'Olivenöl', kcal_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100, default_unit: 'ml' },
  { id: 'basic_rapsoel', source: 'local', name: 'Rapsöl', kcal_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100, default_unit: 'ml' },

  // Nüsse & Samen
  { id: 'basic_mandeln', source: 'local', name: 'Mandeln', kcal_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50, default_unit: 'g' },
  { id: 'basic_walnuesse', source: 'local', name: 'Walnüsse', kcal_per_100g: 654, protein_per_100g: 15, carbs_per_100g: 14, fat_per_100g: 65, default_unit: 'g' },
  { id: 'basic_erdnuesse', source: 'local', name: 'Erdnüsse', kcal_per_100g: 567, protein_per_100g: 26, carbs_per_100g: 16, fat_per_100g: 49, default_unit: 'g' },
  { id: 'basic_chiasamen', source: 'local', name: 'Chiasamen', kcal_per_100g: 486, protein_per_100g: 17, carbs_per_100g: 42, fat_per_100g: 31, default_unit: 'g' },
  { id: 'basic_leinsamen', source: 'local', name: 'Leinsamen', kcal_per_100g: 534, protein_per_100g: 18, carbs_per_100g: 29, fat_per_100g: 42, default_unit: 'g' },

  // Sonstiges
  { id: 'basic_honig', source: 'local', name: 'Honig', kcal_per_100g: 304, protein_per_100g: 0.3, carbs_per_100g: 82, fat_per_100g: 0, default_unit: 'g' },
  { id: 'basic_zucker', source: 'local', name: 'Zucker', kcal_per_100g: 400, protein_per_100g: 0, carbs_per_100g: 100, fat_per_100g: 0, default_unit: 'g' },
  { id: 'basic_mehl_weizen', source: 'local', name: 'Weizenmehl Type 405', kcal_per_100g: 364, protein_per_100g: 10, carbs_per_100g: 76, fat_per_100g: 1, default_unit: 'g' },
];

/**
 * Durchsucht die lokale Grundnahrungsmittel-Datenbank.
 * Fuzzy-Match auf Name — gibt alle Treffer zurück, sortiert nach Relevanz.
 */
export function searchBasicFoods(query: string): Food[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return basicFoods
    .filter(f => f.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aIdx = a.name.toLowerCase().indexOf(q);
      const bIdx = b.name.toLowerCase().indexOf(q);
      return aIdx - bIdx;
    });
}

export default basicFoods;
