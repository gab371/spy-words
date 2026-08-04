/**
 * Dictionnaire français par défaut pour Spy Words.
 * 400+ mots thématiques / courants. L'hôte peut aussi ajouter des mots
 * personnalisés via GameConfig.customWords (fusionnés avec ce dictionnaire).
 *
 * Tous les mots sont uniques après normalisation (cf. clueValidator) :
 * pas de doublons ni de sous-chaînes exactes entre eux quand c'est possible.
 */
export const DEFAULT_DICTIONARY: string[] = [
  // Animaux
  "Chat", "Chien", "Loup", "Ours", "Lion", "Tigre", "Renard", "Lapin",
  "Aigle", "Faucon", "Hibou", "Colombe", "Cygne", "Crabe", "Requin", "Baleine",
  "Serpent", "Singe", "Elephant", "Grenouille", "Heron", "Cigogne", "Tortue", "Loutre",
  "Belette", "Blaireau", "Marmotte", "Chamois", "Biche", "Cerf", "Sanglier",
  // Nature / paysages
  "Foret", "Montagne", "Riviere", "Plage", "Desert", "Ile", "Volcan",
  "Glacier", "Cascade", "Prairie", "Marais", "Grotte", "Vague", "Etang",
  "Bassin", "Crique", "Dune", "Oasis", "Caverne", "Lagune",
  // Météo / éléments
  "Pluie", "Neige", "Orage", "Vent", "Brouillard", "Givre", "Soleil",
  "Lune", "Etoile", "Comete", "Eclipse", "Aube", "Crepuscule", "Tornade", "Brume",
  // Couleurs / matières
  "Rubis", "Saphir", "Emeraude", "Argent", "Bronze", "Cuivre", "Fer",
  "Cristal", "Marbre", "Granit", "Argile", "Obsidienne", "Jade", "Ambre",
  // Vêtements / accessoires
  "Chapeau", "Manteau", "Botte", "Gant", "Echarpe", "Ceinture", "Bague", "Couronne",
  "Masque", "Cape", "Armure", "Bouclier", "Casque", "Diademe",
  // Lieux / bâtiments
  "Chateau", "Tour", "Pont", "Moulin", "Cathedrale", "Temple", "Abbaye",
  "Manoir", "Caserne", "Prison", "Taverne", "Marche", "Port", "Aeroport",
  "Gare", "Musee", "Bibliotheque", "Palais", "Forteresse", "Donjon", "Clocher",
  // Véhicules / transport
  "Voiture", "Bateau", "Train", "Avion", "Velo", "Fusée", "Char", "Carriole",
  "Sous-marin", "Montgolfiere", "Tramway", "Navire", "Canoë",
  // Métiers / personnages
  "Roi", "Reine", "Prince", "Princesse", "Chevalier", "Sorcier", "Mage", "Moine",
  "Marchand", "Forgeron", "Boulanger", "Pêcheur", "Chasseur", "Paysan", "Soldat",
  "Espion", "Detective", "Pirate", "Ninja", "Samourai", "Viking", "Berger",
  "Apothicaire", "Alchimiste", "Menestrel", "Jongleur", "Bourreau", "Herault",
  // Nourriture / boisson
  "Pain", "Fromage", "Vin", "Miel", "Sel", "Poivre", "Sucre", "Cafe",
  "The", "Chocolat", "Pomme", "Orange", "Citron", "Raisin", "Fraise", "Cerise",
  "Tomate", "Carotte", "Oignon", "Ail", "Poire", "Peche", "Abricot", "Figue",
  "Noix", "Amande", "Chataigne", "Olive", "Moutarde",
  // Objets / outils
  "Cadenas", "Lampe", "Bougie", "Torche", "Fleche", "Epee", "Dague", "Baton",
  "Corde", "Chaine", "Filet", "Boussole", "Sablier", "Livre", "Plume", "Parchemin",
  "Encre", "Cornemuse", "Ciboire", "Cassolette",
  // Temps / concepts
  "Hiver", "Printemps", "Ete", "Automne", "Siecle", "Epopee", "Legende", "Mythe",
  "Reve", "Cauchemar", "Memoire", "Secret", "Enigme", "Mystere", "Piege", "Ruse",
  "Serment", "Traquenard",
  // Émotions / qualités
  "Joie", "Peur", "Colere", "Amour", "Haine", "Espoir", "Gloire", "Honneur",
  "Trahison", "Vengeance", "Courage", "Sagesse", "Vertu", "Lucidite",
  // Musique / art
  "Guitare", "Violon", "Tambour", "Flute", "Harpe", "Cloche", "Chanson", "Danse",
  "Theatre", "Peinture", "Statue", "Fresque", "Mosaïque", "Tapisserie",
  // Jeux / divertissement
  "Domino", "Cerf-volant", "Carrousel", "Fete", "Bal", "Carnaval", " Parade",
  "Acrobate", "Clown", "Marionnette", "Guignol",
  // Divers objets
  "Horloge", "Miroir", "Cadre", "Vitre", "Porte", "Fenetre", "Escalier", "Puit",
  "Tente", "Hamac", "Nid", "Ruche", "Toile", "Empreinte", "Trace",
  "Ombre", "Silhouette", "Reflet", "Echo", "Fantome", "Spectre",
  // Sciences / techniques
  "Laser", "Robot", "Satellite", "Antenne", "Aimant", "Pile", "Moteur", "Engrenage",
  "Formule", "Experience", "Microscope", "Telescope", "Becquerel", "Dynamo",
  // Géographie / voyages
  "Continent", "Peninsule", "Archipel", "Cap", "Detroit", "Canal", "Route",
  "Sentier", "Carrefour", "Frontiere", "Isthme", "Delta", "Estuaire",
  // Espionnage / enquête (thématique du jeu)
  "Loupe", "Jumelles", "Micro", "Projecteur", "Ecran", "Camera", "Affiche",
  "Timbre", "Enveloppe", "Cire", "Sceau", "Drapeau", "Banniere", "Fanion",
  "Sifflet", "Cornet", "Trompette", "Saxophone", "Orgue", "Banjo", "Accordeon",
  "Castagnette", "Maracas", "Cymbale", "Gong", "Xylophone", "Tambourin",
  // Outils / artisanat
  "Marteau", "Scie", "Lime", "Burin", "Ciseau", "Rabot", "Equerre", "Niveau",
  "Tournesol", "Truelle", "Pinceau", "Crayon", "Gomme", "Cahier", "Carnet",
  // Botanique / plantes
  "Chene", "Sapin", "Bouleau", "Saule", "Peuplier", "Tilleul", "Nénuphar",
  "Pavot", "Lys", "Tulipe", "Dahlia", "Iris", "Muguet", "Jonquille", "Violette",
  "Mycenaise", "Gentiane",
  // Corps / santé
  "Cœur", "Poumon", "Cerveau", "Veine", "Articulation", "Cicatrice", "Fracture",
  "Remede", "Potion", "Elixir", "Cataplasme", "Baume",
  // Religion / mythes
  "Croix", "Calice", "Encens", "Chapelet", "Relique", "Sanctuaire", "Oracle",
  "Sibylle", "Pythie", "Nécropole",
  // Divers compléments pour atteindre 400+
  "Foudre", "Eclair", "Tonnerre", "Grele", "Verglas",
  "Minuit", "Midi", "Pendule", "Montre", "Reveil",
  "Cintre", "Patere", "Vaisselle", "Couvercle", "Louche", "Passoire", "Mortier",
  "Pilon", "Couperet", "Faux", "Fléau", "Rateau", "Houe", "Pioche",
  "Ancre", "Gouvernail", "Mât", "Voile", "Cordes", "Treuil", "Cabestan",
  "Tipi", "Yourte", "Igloo", "Hutte", "Cabane", "Roulotte",
];