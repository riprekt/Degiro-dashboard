const languageStorageKey = "folio.language";

const translations = {
  en: {
    "app.title": "Folio — DEGIRO performance, locally",
    "header.update": "Update data",
    "header.more": "More",
    "header.download": "Download data",
    "header.remove": "Remove saved data",
    "import.eyebrow": "SET UP FOLIO",
    "import.title": "Import your DEGIRO history",
    "import.lede":
      "Choose two CSV exports. Folio identifies them automatically and builds your dashboard as soon as both are ready.",
    "import.privacy":
      "Your CSV contents are saved only in this browser. They are never uploaded.",
    "import.help": "How to export the files from DEGIRO",
    "import.helpAccount":
      "Open Inbox → Account statement, select your full account history, then export as CSV.",
    "import.helpTransactions":
      "Open Inbox → Transactions, select the same full date range, then export as CSV.",
    "import.guide": "Open DEGIRO’s export guide",
    "import.accountDescription": "Deposits, fees and cash balance",
    "import.transactionsDescription": "Every purchase and sale",
    "import.needed": "Needed",
    "import.ready": "{size} KB · Ready",
    "import.chooseBoth": "Choose both CSV files",
    "import.drop": "or drop them here",
    "import.selectBoth": "Select Account.csv and Transactions.csv.",
    "import.missing": "{name} is still needed.",
    "import.chooseOne": "Choose {name}",
    "import.valid": "Both files are valid. Building your dashboard…",
    "import.notCsv": "{name} is not a CSV file.",
    "import.unknownFile": "{name} is not an Account or Transactions export.",
    "dashboard.eyebrow": "SINCE YOU STARTED INVESTING",
    "dashboard.title": "Performance",
    "dashboard.imported": "DEGIRO data imported",
    "dashboard.pricesThrough": "Market prices through",
    "dashboard.refresh": "Refresh market prices",
    "dashboard.unavailable": "Unavailable",
    "dashboard.warning": "Review imported data",
    "metric.currentValue": "Current value",
    "metric.moneyAdded": "Money added",
    "metric.totalProfit": "Total profit",
    "metric.yearlyReturn": "Average yearly return",
    "metric.returnHelp":
      "Accounts for when you added money. Also called money-weighted return or XIRR.",
    "metric.returnCaption": "Accounts for when you added money",
    "metric.totalReturn": "{value} total return",
    "metric.holdingsCash": "{count} holdings · {cash} cash",
    "metric.firstInvestment": "First investment {date}",
    "chart.eyebrow": "VALUE / MONEY ADDED",
    "chart.title": "Portfolio over time",
    "chart.range": "Chart range",
    "chart.lines": "Chart lines",
    "chart.value": "Value",
    "chart.moneyAdded": "Money added",
    "chart.description": "Portfolio value and money added over time",
    "chart.note": "Values use the latest available public closing prices.",
    "chart.portfolio": "Portfolio",
    "chart.profit": "Profit",
    "holdings.eyebrow": "CURRENT HOLDINGS",
    "holdings.title": "Holdings",
    "holdings.cash": "{value} cash",
    "update.eyebrow": "REPLACE SAVED EXPORTS",
    "update.title": "Update DEGIRO data",
    "update.description":
      "Export both files again using the full date range. Your current dashboard stays unchanged until both new files are valid.",
    "update.choose": "Choose updated CSV files",
    "update.select": "Select both updated exports.",
    "clear.eyebrow": "LOCAL DATA",
    "clear.title": "Remove saved data?",
    "clear.description":
      "This removes the saved CSV contents from this browser and returns to the import screen.",
    "clear.cancel": "Cancel",
    "clear.confirm": "Remove saved data",
    "loading.reading": "Reading exports…",
    "loading.building": "Building your investment history…",
    "loading.refreshing": "Refreshing market prices…",
    "toast.updated": "DEGIRO data updated.",
    "toast.refreshed": "Market prices refreshed.",
    "toast.cacheFallback": "Live prices were unavailable. Cached prices are still in use.",
    "toast.refreshFailed": "Could not refresh prices: {message}",
    "toast.returnHelp":
      "Average yearly return accounts for when you added money. It is also called money-weighted return or XIRR.",
    "saved.loadFailed":
      "Saved files are ready, but the dashboard could not load: {message}",
    "error.noTransactions": "Transactions.csv contains no dated transactions.",
    "error.marketPrices": "Could not retrieve market prices.",
    "error.emptyExports": "One or more DEGIRO exports contain no usable rows.",
    "warning.duplicateTransaction":
      "1 possible duplicate transaction found in Transactions.csv.",
    "warning.duplicateTransactions":
      "{count} possible duplicate transactions found in Transactions.csv.",
    "warning.unknownInstrument":
      "No market-price mapping for {isin}; omitted from valuation.",
    "warning.missingPrice": "{symbol}: no closing price for {date}.",
    "warning.stalePrices":
      "{symbol}: live prices were unavailable; cached prices are being used.",
  },
  nl: {
    "app.title": "Folio — DEGIRO-resultaten, lokaal",
    "header.update": "Gegevens bijwerken",
    "header.more": "Meer",
    "header.download": "Gegevens downloaden",
    "header.remove": "Opgeslagen gegevens wissen",
    "import.eyebrow": "FOLIO INSTELLEN",
    "import.title": "Importeer je DEGIRO-geschiedenis",
    "import.lede":
      "Kies twee CSV-exports. Folio herkent ze automatisch en bouwt je dashboard zodra beide klaarstaan.",
    "import.privacy":
      "De inhoud van je CSV-bestanden wordt alleen in deze browser bewaard en nooit geüpload.",
    "import.help": "Zo exporteer je de bestanden uit DEGIRO",
    "import.helpAccount":
      "Open Inbox → Rekeningoverzicht, selecteer je volledige rekeninggeschiedenis en exporteer als CSV.",
    "import.helpTransactions":
      "Open Inbox → Transacties, selecteer dezelfde volledige periode en exporteer als CSV.",
    "import.guide": "Open de exporthandleiding van DEGIRO",
    "import.accountDescription": "Stortingen, kosten en kassaldo",
    "import.transactionsDescription": "Elke aankoop en verkoop",
    "import.needed": "Nodig",
    "import.ready": "{size} KB · Klaar",
    "import.chooseBoth": "Kies beide CSV-bestanden",
    "import.drop": "of sleep ze hierheen",
    "import.selectBoth": "Selecteer Account.csv en Transactions.csv.",
    "import.missing": "{name} ontbreekt nog.",
    "import.chooseOne": "Kies {name}",
    "import.valid": "Beide bestanden zijn geldig. Je dashboard wordt opgebouwd…",
    "import.notCsv": "{name} is geen CSV-bestand.",
    "import.unknownFile": "{name} is geen rekening- of transactie-export.",
    "dashboard.eyebrow": "SINDS JE BEGON MET BELEGGEN",
    "dashboard.title": "Resultaat",
    "dashboard.imported": "DEGIRO-gegevens geïmporteerd",
    "dashboard.pricesThrough": "Marktprijzen tot",
    "dashboard.refresh": "Marktprijzen vernieuwen",
    "dashboard.unavailable": "Niet beschikbaar",
    "dashboard.warning": "Controleer de geïmporteerde gegevens",
    "metric.currentValue": "Huidige waarde",
    "metric.moneyAdded": "Ingelegd bedrag",
    "metric.totalProfit": "Totale winst",
    "metric.yearlyReturn": "Gemiddeld jaarrendement",
    "metric.returnHelp":
      "Houdt rekening met het moment waarop je geld inlegde. Ook geldgewogen rendement of XIRR genoemd.",
    "metric.returnCaption": "Houdt rekening met het moment van inleg",
    "metric.totalReturn": "{value} totaalrendement",
    "metric.holdingsCash": "{count} posities · {cash} cash",
    "metric.firstInvestment": "Eerste belegging {date}",
    "chart.eyebrow": "WAARDE / INGELEGD BEDRAG",
    "chart.title": "Portefeuille door de tijd",
    "chart.range": "Grafiekperiode",
    "chart.lines": "Grafieklijnen",
    "chart.value": "Waarde",
    "chart.moneyAdded": "Ingelegd",
    "chart.description": "Portefeuillewaarde en ingelegd bedrag door de tijd",
    "chart.note": "Waarden gebruiken de laatst beschikbare openbare slotkoersen.",
    "chart.portfolio": "Portefeuille",
    "chart.profit": "Winst",
    "holdings.eyebrow": "HUIDIGE POSITIES",
    "holdings.title": "Posities",
    "holdings.cash": "{value} cash",
    "update.eyebrow": "OPGESLAGEN EXPORTS VERVANGEN",
    "update.title": "DEGIRO-gegevens bijwerken",
    "update.description":
      "Exporteer beide bestanden opnieuw over de volledige periode. Je huidige dashboard blijft staan totdat beide nieuwe bestanden geldig zijn.",
    "update.choose": "Kies bijgewerkte CSV-bestanden",
    "update.select": "Selecteer beide bijgewerkte exports.",
    "clear.eyebrow": "LOKALE GEGEVENS",
    "clear.title": "Opgeslagen gegevens wissen?",
    "clear.description":
      "Hiermee wis je de opgeslagen CSV-inhoud uit deze browser en ga je terug naar het importscherm.",
    "clear.cancel": "Annuleren",
    "clear.confirm": "Opgeslagen gegevens wissen",
    "loading.reading": "Exports lezen…",
    "loading.building": "Beleggingsgeschiedenis opbouwen…",
    "loading.refreshing": "Marktprijzen vernieuwen…",
    "toast.updated": "DEGIRO-gegevens bijgewerkt.",
    "toast.refreshed": "Marktprijzen vernieuwd.",
    "toast.cacheFallback": "Live prijzen waren niet beschikbaar. De opgeslagen prijzen blijven in gebruik.",
    "toast.refreshFailed": "Marktprijzen konden niet worden vernieuwd: {message}",
    "toast.returnHelp":
      "Het gemiddelde jaarrendement houdt rekening met wanneer je geld inlegde. Dit heet ook geldgewogen rendement of XIRR.",
    "saved.loadFailed":
      "De opgeslagen bestanden zijn klaar, maar het dashboard kon niet laden: {message}",
    "error.noTransactions": "Transactions.csv bevat geen gedateerde transacties.",
    "error.marketPrices": "Marktprijzen konden niet worden opgehaald.",
    "error.emptyExports": "Een of meer DEGIRO-exports bevatten geen bruikbare rijen.",
    "warning.duplicateTransaction":
      "1 mogelijke dubbele transactie gevonden in Transactions.csv.",
    "warning.duplicateTransactions":
      "{count} mogelijke dubbele transacties gevonden in Transactions.csv.",
    "warning.unknownInstrument":
      "Geen marktprijskoppeling voor {isin}; niet meegenomen in de waardering.",
    "warning.missingPrice": "{symbol}: geen slotkoers voor {date}.",
    "warning.stalePrices":
      "{symbol}: live prijzen waren niet beschikbaar; opgeslagen prijzen worden gebruikt.",
  },
  fr: {
    "app.title": "Folio — performance DEGIRO, en local",
    "header.update": "Actualiser les données",
    "header.more": "Plus",
    "header.download": "Télécharger les données",
    "header.remove": "Supprimer les données",
    "import.eyebrow": "CONFIGURER FOLIO",
    "import.title": "Importez votre historique DEGIRO",
    "import.lede":
      "Choisissez deux exports CSV. Folio les identifie automatiquement et crée votre tableau de bord dès qu’ils sont prêts.",
    "import.privacy":
      "Le contenu de vos CSV reste uniquement dans ce navigateur et n’est jamais téléversé.",
    "import.help": "Comment exporter les fichiers depuis DEGIRO",
    "import.helpAccount":
      "Ouvrez Boîte de réception → Relevé de compte, sélectionnez tout l’historique, puis exportez en CSV.",
    "import.helpTransactions":
      "Ouvrez Boîte de réception → Transactions, sélectionnez la même période complète, puis exportez en CSV.",
    "import.guide": "Ouvrir le guide d’export DEGIRO",
    "import.accountDescription": "Dépôts, frais et solde disponible",
    "import.transactionsDescription": "Tous les achats et ventes",
    "import.needed": "Requis",
    "import.ready": "{size} Ko · Prêt",
    "import.chooseBoth": "Choisir les deux fichiers CSV",
    "import.drop": "ou déposez-les ici",
    "import.selectBoth": "Sélectionnez Account.csv et Transactions.csv.",
    "import.missing": "{name} est encore requis.",
    "import.chooseOne": "Choisir {name}",
    "import.valid": "Les deux fichiers sont valides. Création du tableau de bord…",
    "import.notCsv": "{name} n’est pas un fichier CSV.",
    "import.unknownFile": "{name} n’est pas un export de compte ou de transactions.",
    "dashboard.eyebrow": "DEPUIS VOTRE PREMIER INVESTISSEMENT",
    "dashboard.title": "Performance",
    "dashboard.imported": "Données DEGIRO importées",
    "dashboard.pricesThrough": "Cours de marché au",
    "dashboard.refresh": "Actualiser les cours",
    "dashboard.unavailable": "Indisponible",
    "dashboard.warning": "Vérifiez les données importées",
    "metric.currentValue": "Valeur actuelle",
    "metric.moneyAdded": "Montant investi",
    "metric.totalProfit": "Bénéfice total",
    "metric.yearlyReturn": "Rendement annuel moyen",
    "metric.returnHelp":
      "Tient compte du moment des versements. Aussi appelé rendement pondéré ou XIRR.",
    "metric.returnCaption": "Tient compte du moment des versements",
    "metric.totalReturn": "{value} de rendement total",
    "metric.holdingsCash": "{count} positions · {cash} en espèces",
    "metric.firstInvestment": "Premier investissement le {date}",
    "chart.eyebrow": "VALEUR / MONTANT INVESTI",
    "chart.title": "Portefeuille dans le temps",
    "chart.range": "Période du graphique",
    "chart.lines": "Courbes du graphique",
    "chart.value": "Valeur",
    "chart.moneyAdded": "Montant investi",
    "chart.description": "Valeur du portefeuille et montant investi dans le temps",
    "chart.note": "Les valeurs utilisent les derniers cours de clôture publics disponibles.",
    "chart.portfolio": "Portefeuille",
    "chart.profit": "Bénéfice",
    "holdings.eyebrow": "POSITIONS ACTUELLES",
    "holdings.title": "Positions",
    "holdings.cash": "{value} en espèces",
    "update.eyebrow": "REMPLACER LES EXPORTS ENREGISTRÉS",
    "update.title": "Actualiser les données DEGIRO",
    "update.description":
      "Exportez à nouveau les deux fichiers sur toute la période. Le tableau de bord actuel reste inchangé jusqu’à validation des nouveaux fichiers.",
    "update.choose": "Choisir les CSV actualisés",
    "update.select": "Sélectionnez les deux exports actualisés.",
    "clear.eyebrow": "DONNÉES LOCALES",
    "clear.title": "Supprimer les données enregistrées ?",
    "clear.description":
      "Cette action supprime le contenu CSV enregistré dans ce navigateur et revient à l’écran d’import.",
    "clear.cancel": "Annuler",
    "clear.confirm": "Supprimer les données",
    "loading.reading": "Lecture des exports…",
    "loading.building": "Création de l’historique…",
    "loading.refreshing": "Actualisation des cours…",
    "toast.updated": "Données DEGIRO actualisées.",
    "toast.refreshed": "Cours de marché actualisés.",
    "toast.cacheFallback": "Les cours en direct sont indisponibles. Le cache local reste utilisé.",
    "toast.refreshFailed": "Impossible d’actualiser les cours : {message}",
    "toast.returnHelp":
      "Le rendement annuel moyen tient compte du moment des versements. Il est aussi appelé rendement pondéré ou XIRR.",
    "saved.loadFailed":
      "Les fichiers enregistrés sont prêts, mais le tableau de bord n’a pas pu charger : {message}",
    "error.noTransactions": "Transactions.csv ne contient aucune transaction datée.",
    "error.marketPrices": "Impossible de récupérer les cours de marché.",
    "error.emptyExports": "Un ou plusieurs exports DEGIRO ne contiennent aucune ligne exploitable.",
    "warning.duplicateTransaction":
      "1 transaction potentiellement dupliquée dans Transactions.csv.",
    "warning.duplicateTransactions":
      "{count} transactions potentiellement dupliquées dans Transactions.csv.",
    "warning.unknownInstrument":
      "Aucune correspondance de marché pour {isin} ; instrument omis de la valorisation.",
    "warning.missingPrice": "{symbol} : aucun cours de clôture pour le {date}.",
    "warning.stalePrices":
      "{symbol} : cours en direct indisponibles ; utilisation du cache local.",
  },
  de: {
    "app.title": "Folio — DEGIRO-Performance, lokal",
    "header.update": "Daten aktualisieren",
    "header.more": "Mehr",
    "header.download": "Daten herunterladen",
    "header.remove": "Gespeicherte Daten löschen",
    "import.eyebrow": "FOLIO EINRICHTEN",
    "import.title": "DEGIRO-Verlauf importieren",
    "import.lede":
      "Wähle zwei CSV-Exporte. Folio erkennt sie automatisch und erstellt das Dashboard, sobald beide bereit sind.",
    "import.privacy":
      "Der Inhalt deiner CSV-Dateien wird nur in diesem Browser gespeichert und nie hochgeladen.",
    "import.help": "So exportierst du die Dateien aus DEGIRO",
    "import.helpAccount":
      "Öffne Posteingang → Kontoauszug, wähle den gesamten Kontoverlauf und exportiere ihn als CSV.",
    "import.helpTransactions":
      "Öffne Posteingang → Transaktionen, wähle denselben vollständigen Zeitraum und exportiere als CSV.",
    "import.guide": "DEGIRO-Exportanleitung öffnen",
    "import.accountDescription": "Einzahlungen, Gebühren und Barbestand",
    "import.transactionsDescription": "Alle Käufe und Verkäufe",
    "import.needed": "Benötigt",
    "import.ready": "{size} KB · Bereit",
    "import.chooseBoth": "Beide CSV-Dateien auswählen",
    "import.drop": "oder hier ablegen",
    "import.selectBoth": "Account.csv und Transactions.csv auswählen.",
    "import.missing": "{name} wird noch benötigt.",
    "import.chooseOne": "{name} auswählen",
    "import.valid": "Beide Dateien sind gültig. Dashboard wird erstellt…",
    "import.notCsv": "{name} ist keine CSV-Datei.",
    "import.unknownFile": "{name} ist kein Konto- oder Transaktionsexport.",
    "dashboard.eyebrow": "SEIT DEINEM ERSTEN INVESTMENT",
    "dashboard.title": "Performance",
    "dashboard.imported": "DEGIRO-Daten importiert",
    "dashboard.pricesThrough": "Marktpreise bis",
    "dashboard.refresh": "Marktpreise aktualisieren",
    "dashboard.unavailable": "Nicht verfügbar",
    "dashboard.warning": "Importierte Daten prüfen",
    "metric.currentValue": "Aktueller Wert",
    "metric.moneyAdded": "Eingezahlter Betrag",
    "metric.totalProfit": "Gesamtgewinn",
    "metric.yearlyReturn": "Durchschnittliche Jahresrendite",
    "metric.returnHelp":
      "Berücksichtigt den Zeitpunkt deiner Einzahlungen. Auch geldgewichtete Rendite oder XIRR genannt.",
    "metric.returnCaption": "Berücksichtigt den Zeitpunkt der Einzahlungen",
    "metric.totalReturn": "{value} Gesamtrendite",
    "metric.holdingsCash": "{count} Positionen · {cash} Barbestand",
    "metric.firstInvestment": "Erstes Investment {date}",
    "chart.eyebrow": "WERT / EINGEZAHLTER BETRAG",
    "chart.title": "Portfolio im Zeitverlauf",
    "chart.range": "Diagrammzeitraum",
    "chart.lines": "Diagrammlinien",
    "chart.value": "Wert",
    "chart.moneyAdded": "Eingezahlt",
    "chart.description": "Portfoliowert und Einzahlungen im Zeitverlauf",
    "chart.note": "Die Werte verwenden die neuesten verfügbaren öffentlichen Schlusskurse.",
    "chart.portfolio": "Portfolio",
    "chart.profit": "Gewinn",
    "holdings.eyebrow": "AKTUELLE POSITIONEN",
    "holdings.title": "Positionen",
    "holdings.cash": "{value} Barbestand",
    "update.eyebrow": "GESPEICHERTE EXPORTE ERSETZEN",
    "update.title": "DEGIRO-Daten aktualisieren",
    "update.description":
      "Exportiere beide Dateien erneut für den gesamten Zeitraum. Das aktuelle Dashboard bleibt erhalten, bis beide neuen Dateien gültig sind.",
    "update.choose": "Aktualisierte CSV-Dateien auswählen",
    "update.select": "Beide aktualisierten Exporte auswählen.",
    "clear.eyebrow": "LOKALE DATEN",
    "clear.title": "Gespeicherte Daten löschen?",
    "clear.description":
      "Dadurch werden die gespeicherten CSV-Inhalte aus diesem Browser gelöscht und der Importbildschirm geöffnet.",
    "clear.cancel": "Abbrechen",
    "clear.confirm": "Gespeicherte Daten löschen",
    "loading.reading": "Exporte werden gelesen…",
    "loading.building": "Investmentverlauf wird erstellt…",
    "loading.refreshing": "Marktpreise werden aktualisiert…",
    "toast.updated": "DEGIRO-Daten aktualisiert.",
    "toast.refreshed": "Marktpreise aktualisiert.",
    "toast.cacheFallback": "Live-Kurse waren nicht verfügbar. Der lokale Cache bleibt aktiv.",
    "toast.refreshFailed": "Marktpreise konnten nicht aktualisiert werden: {message}",
    "toast.returnHelp":
      "Die durchschnittliche Jahresrendite berücksichtigt den Zeitpunkt deiner Einzahlungen. Sie wird auch geldgewichtete Rendite oder XIRR genannt.",
    "saved.loadFailed":
      "Die gespeicherten Dateien sind bereit, aber das Dashboard konnte nicht geladen werden: {message}",
    "error.noTransactions": "Transactions.csv enthält keine datierten Transaktionen.",
    "error.marketPrices": "Marktpreise konnten nicht abgerufen werden.",
    "error.emptyExports": "Mindestens ein DEGIRO-Export enthält keine verwendbaren Zeilen.",
    "warning.duplicateTransaction":
      "1 möglicherweise doppelte Transaktion in Transactions.csv gefunden.",
    "warning.duplicateTransactions":
      "{count} möglicherweise doppelte Transaktionen in Transactions.csv gefunden.",
    "warning.unknownInstrument":
      "Keine Marktpreiszuordnung für {isin}; bei der Bewertung ausgelassen.",
    "warning.missingPrice": "{symbol}: kein Schlusskurs für den {date}.",
    "warning.stalePrices":
      "{symbol}: Live-Kurse waren nicht verfügbar; lokale Cache-Daten werden verwendet.",
  },
};

const supportedLanguages = Object.keys(translations);
let activeLanguage = "en";

function bestLanguage() {
  const saved = localStorage.getItem(languageStorageKey);
  if (supportedLanguages.includes(saved)) return saved;

  const browserLanguage = navigator.language.slice(0, 2).toLowerCase();
  return supportedLanguages.includes(browserLanguage) ? browserLanguage : "en";
}

export function currentLanguage() {
  return activeLanguage;
}

export function translationCoverage() {
  const referenceKeys = Object.keys(translations.en);
  return Object.fromEntries(
    supportedLanguages.map((language) => [
      language,
      referenceKeys.filter((key) => !(key in translations[language])),
    ]),
  );
}

export function hasTranslation(key) {
  return key in translations.en;
}

export function t(key, variables = {}) {
  const template = translations[activeLanguage][key] ?? translations.en[key] ?? key;
  return Object.entries(variables).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

export function applyTranslations() {
  document.documentElement.lang = activeLanguage;
  document.title = t("app.title");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.title = t(element.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });

  const selector = document.querySelector("#languageSelect");
  if (selector) selector.value = activeLanguage;
}

export function setLanguage(language) {
  if (!supportedLanguages.includes(language)) return;
  activeLanguage = language;
  localStorage.setItem(languageStorageKey, language);
  applyTranslations();
  window.dispatchEvent(new CustomEvent("folio:languagechange"));
}

export function initializeI18n() {
  activeLanguage = bestLanguage();
  applyTranslations();

  document.querySelector("#languageSelect")?.addEventListener("change", (event) => {
    setLanguage(event.target.value);
  });
}
