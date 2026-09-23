/* Jedan list za sve ponude: sheetCsvUrl (redovi imaju svoje category/store kolone).
   Poseban list po prodavnici: sheetSources (svaki objekat je jedan list, category/store se ovdje upisuju jednom).
   Kad je sheetSources popunjen, ima prednost nad sheetCsvUrl. Prazno oboje = primjeri. */
window.BN_CONFIG = {
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRmt4xoHPSprGXUkcwrFJfwk3RVh3nGWgwiuDEQxfoVoHjHBEhp-67iSb5wOAQoxiqem1tnZUU0tyw/pub?gid=1809798394&single=true&output=csv",
  sheetSources: [
    // {category: "market", store: "Tropik", url: "https://docs.google.com/.../pub?gid=...&single=true&output=csv"},
    // {category: "market", store: "Fortuna", url: "..."},
    // {category: "market", store: "Bost", url: "..."},
  ],
  refreshMinutes: 15
};
