/**
 * Team Operations Woensdag — API en opmaak voor de datasheet. Bedient sinds v9 ook Team Marketing:
 * de site stuurt `team` mee ('ops' of 'marketing'); 'ops' leest de sheet waar dit script aan hangt,
 * 'marketing' de sheet uit scripteigenschap SHEET_MARKETING (menu: "Marketing: datasheet koppelen").
 *
 * Installatie (eenmalig):
 *  1. Open de sheet "Team Operations Woensdag (data)" → Extensies → Apps Script, plak dit bestand als Code.gs en sla op.
 *  2. Herlaad de sheet. Kies in het menu "OPS site" → "Instellen" en vul de OAuth client-ID in (zie README).
 *  3. Implementeren → Nieuwe implementatie → type "Web-app" → Uitvoeren als: Ik, Toegang: Iedereen → Implementeren.
 *     Kopieer de web-app-URL (eindigt op /exec) naar de GitHub-variabele API_URL.
 *  4. Week-tab (agenda van het team): zet per teamlid het 4m.nl-adres in kolom "E-mail (agenda)" op tab Team,
 *     draai "OPS site" → "Test: agenda van het team" en accepteer de agenda-rechten. Publiceer daarna een
 *     nieuwe versie (Implementeren → Implementaties beheren → potlood → Versie: nieuw → Implementeren).
 *
 * Beveiliging: elke aanroep draagt een Google ID-token mee. Het token wordt bij Google geverifieerd
 * (aud = client-ID, e-mail geverifieerd, domein in DOMAIN — komma-gescheiden lijst, standaard 4m.nl en de4emusketier.nl).
 * Zonder geldig token wordt niets gelezen of geschreven.
 */

const SPEC = {"tabs": [{"key": "okrs", "title": "OKR's", "sheetId": 1001, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 70, "opts": null}, {"key": "code", "label": "Code", "type": "text", "width": 70, "opts": null}, {"key": "order", "label": "Volgorde", "type": "num", "width": 80, "opts": null}, {"key": "title", "label": "Objective", "type": "text", "width": 300, "opts": null}, {"key": "desc", "label": "Toelichting", "type": "long", "width": 420, "opts": null}, {"key": "owner", "label": "Eigenaar", "type": "owner", "width": 160, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "krs", "title": "Key results", "sheetId": 1002, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 70, "opts": null}, {"key": "okr", "label": "Objective", "type": "list", "width": 90, "opts": "okrs"}, {"key": "code", "label": "Code", "type": "text", "width": 70, "opts": null}, {"key": "order", "label": "Volgorde", "type": "num", "width": 80, "opts": null}, {"key": "title", "label": "Key result", "type": "text", "width": 360, "opts": null}, {"key": "owner", "label": "Eigenaar", "type": "owner", "width": 160, "opts": null}, {"key": "type", "label": "Type", "type": "list", "width": 110, "opts": ["Uitkomst", "Output", "Gezondheid"]}, {"key": "unit", "label": "Eenheid", "type": "list", "width": 90, "opts": ["aantal", "%", "cijfer", "uren", "dagen"]}, {"key": "direction", "label": "Richting", "type": "list", "width": 130, "opts": ["Hoger is beter", "Lager is beter"]}, {"key": "source", "label": "Meetbron", "type": "long", "width": 280, "opts": null}, {"key": "nulmeting", "label": "Nulmeting", "type": "num", "width": 90, "opts": null}, {"key": "jaardoel", "label": "Jaardoel", "type": "num", "width": 90, "opts": null}, {"key": "q1d", "label": "Q1 doel", "type": "num", "width": 80, "opts": null}, {"key": "q1w", "label": "Q1 werkelijk", "type": "num", "width": 90, "opts": null}, {"key": "q2d", "label": "Q2 doel", "type": "num", "width": 80, "opts": null}, {"key": "q2w", "label": "Q2 werkelijk", "type": "num", "width": 90, "opts": null}, {"key": "q3d", "label": "Q3 doel", "type": "num", "width": 80, "opts": null}, {"key": "q3w", "label": "Q3 werkelijk", "type": "num", "width": 90, "opts": null}, {"key": "q4d", "label": "Q4 doel", "type": "num", "width": 80, "opts": null}, {"key": "q4w", "label": "Q4 werkelijk", "type": "num", "width": 90, "opts": null}, {"key": "status", "label": "Status", "type": "list", "width": 120, "opts": ["Niet gestart", "Op koers", "Aandacht", "Achter", "Behaald", "Vervallen"]}, {"key": "note", "label": "Toelichting", "type": "long", "width": 320, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "acties", "title": "Acties", "sheetId": 1003, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 90, "opts": null}, {"key": "code", "label": "Code", "type": "text", "width": 70, "opts": null}, {"key": "datum", "label": "Afgesproken op", "type": "date", "width": 120, "opts": null}, {"key": "thema", "label": "Thema", "type": "list", "width": 170, "opts": ["OKR's", "Lopende weekenden", "Operations-projecten", "Brainstorm & vooruitkijken"]}, {"key": "text", "label": "Actie", "type": "long", "width": 380, "opts": null}, {"key": "owner", "label": "Eigenaar", "type": "owner", "width": 160, "opts": null}, {"key": "deadline", "label": "Deadline", "type": "date", "width": 110, "opts": null}, {"key": "status", "label": "Status", "type": "list", "width": 100, "opts": ["Open", "Bezig", "Gereed", "Vervallen"]}, {"key": "kr", "label": "Key result", "type": "list", "width": 90, "opts": "krs"}, {"key": "okr", "label": "Objective", "type": "list", "width": 90, "opts": "okrs"}, {"key": "project", "label": "Project", "type": "list", "width": 110, "opts": "projecten"}, {"key": "mijlpaal", "label": "Mijlpaal", "type": "list", "width": 110, "opts": "mijlpalen"}, {"key": "weekend", "label": "Weekend", "type": "list", "width": 110, "opts": "weekenden"}, {"key": "idee", "label": "Idee", "type": "list", "width": 110, "opts": "brainstorm"}, {"key": "besluit", "label": "Volgt uit besluit", "type": "list", "width": 120, "opts": "besluiten"}, {"key": "note", "label": "Notitie / blokkade", "type": "long", "width": 300, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "besluiten", "title": "Besluiten", "sheetId": 1004, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 90, "opts": null}, {"key": "datum", "label": "Genomen op", "type": "date", "width": 110, "opts": null}, {"key": "thema", "label": "Thema", "type": "list", "width": 170, "opts": ["OKR's", "Lopende weekenden", "Operations-projecten", "Brainstorm & vooruitkijken"]}, {"key": "text", "label": "Besluit", "type": "long", "width": 380, "opts": null}, {"key": "context", "label": "Context / aanleiding", "type": "long", "width": 300, "opts": null}, {"key": "owner", "label": "Genomen door", "type": "owner", "width": 160, "opts": null}, {"key": "status", "label": "Status", "type": "list", "width": 110, "opts": ["Vastgelegd", "Herzien", "Ingetrokken"]}, {"key": "kr", "label": "Key result", "type": "list", "width": 90, "opts": "krs"}, {"key": "okr", "label": "Objective", "type": "list", "width": 90, "opts": "okrs"}, {"key": "project", "label": "Project", "type": "list", "width": 110, "opts": "projecten"}, {"key": "mijlpaal", "label": "Mijlpaal", "type": "list", "width": 110, "opts": "mijlpalen"}, {"key": "weekend", "label": "Weekend", "type": "list", "width": 110, "opts": "weekenden"}, {"key": "idee", "label": "Idee", "type": "list", "width": 110, "opts": "brainstorm"}, {"key": "geldigTot", "label": "Herzien op", "type": "date", "width": 110, "opts": null}, {"key": "note", "label": "Opvolging / notitie", "type": "long", "width": 300, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "projecten", "title": "Projecten", "sheetId": 1005, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 70, "opts": null}, {"key": "title", "label": "Project", "type": "text", "width": 240, "opts": null}, {"key": "result", "label": "Gewenst resultaat", "type": "long", "width": 380, "opts": null}, {"key": "owner", "label": "Eigenaar", "type": "owner", "width": 160, "opts": null}, {"key": "status", "label": "Status", "type": "list", "width": 100, "opts": ["Groen", "Oranje", "Rood"]}, {"key": "deadline", "label": "Deadline", "type": "date", "width": 110, "opts": null}, {"key": "voortgang", "label": "Voortgang %", "type": "num", "width": 100, "opts": null}, {"key": "blokkade", "label": "Blokkade", "type": "long", "width": 260, "opts": null}, {"key": "hulp", "label": "Benodigde hulp of besluit", "type": "long", "width": 300, "opts": null}, {"key": "volgende", "label": "Volgende stap", "type": "long", "width": 260, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "mijlpalen", "title": "Mijlpalen", "sheetId": 1006, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 70, "opts": null}, {"key": "project", "label": "Project", "type": "list", "width": 110, "opts": "projecten"}, {"key": "title", "label": "Mijlpaal", "type": "text", "width": 300, "opts": null}, {"key": "deadline", "label": "Deadline", "type": "date", "width": 110, "opts": null}, {"key": "status", "label": "Status", "type": "list", "width": 100, "opts": ["Open", "Bezig", "Gereed"]}, {"key": "order", "label": "Volgorde", "type": "num", "width": 80, "opts": null}, {"key": "note", "label": "Toelichting", "type": "long", "width": 320, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "weekenden", "title": "Weekenden", "sheetId": 1007, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 70, "opts": null}, {"key": "title", "label": "Weekend", "type": "text", "width": 240, "opts": null}, {"key": "merk", "label": "Label", "type": "list", "width": 130, "opts": ["4M", "4Family", "Arise", "Arise / 4Family", "Muskathlon", "LIFE", "Common Ground", "Promo"]}, {"key": "datum", "label": "Startdatum", "type": "date", "width": 110, "opts": null}, {"key": "owner", "label": "Eigenaar", "type": "owner", "width": 160, "opts": null}, {"key": "status", "label": "Status", "type": "list", "width": 100, "opts": ["Groen", "Oranje", "Rood"]}, {"key": "bezetting", "label": "Bezetting rond", "type": "list", "width": 110, "opts": ["Ja", "Bijna", "Nee"]}, {"key": "risico", "label": "Grootste risico", "type": "long", "width": 260, "opts": null}, {"key": "maatregel", "label": "Maatregel", "type": "long", "width": 260, "opts": null}, {"key": "besluit", "label": "Besluit nodig", "type": "list", "width": 100, "opts": ["Ja", "Nee"]}, {"key": "besluitTekst", "label": "Welk besluit", "type": "long", "width": 220, "opts": null}, {"key": "volgende", "label": "Volgende stap", "type": "long", "width": 240, "opts": null}, {"key": "evaluatie", "label": "Evaluatie", "type": "long", "width": 300, "opts": null}, {"key": "voortgang", "label": "Voortgang %", "type": "num", "width": 100, "opts": null}, {"key": "achterstallig", "label": "Achterstallig", "type": "num", "width": 100, "opts": null}, {"key": "peildatum", "label": "Peildatum", "type": "date", "width": 110, "opts": null}, {"key": "eersteTaak", "label": "Eerste open taak", "type": "text", "width": 220, "opts": null}, {"key": "eersteDeadline", "label": "Deadline eerste taak", "type": "date", "width": 120, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}, {"key": "evalGoed", "label": "Evaluatie: wat ging goed", "type": "long", "width": 300, "opts": null}, {"key": "evalBeter", "label": "Evaluatie: wat kan beter", "type": "long", "width": 300, "opts": null}, {"key": "evalLeerpunt", "label": "Evaluatie: leerpunt", "type": "long", "width": 300, "opts": null}, {"key": "evalDatum", "label": "Geëvalueerd op", "type": "date", "width": 110, "opts": null}, {"key": "sheetUrl", "label": "Productiesheet (URL)", "type": "text", "width": 260, "opts": null}]}, {"key": "brainstorm", "title": "Brainstorm", "sheetId": 1008, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 90, "opts": null}, {"key": "datum", "label": "Datum", "type": "date", "width": 110, "opts": null}, {"key": "title", "label": "Kans, risico of idee", "type": "long", "width": 340, "opts": null}, {"key": "categorie", "label": "Categorie", "type": "list", "width": 120, "opts": ["Proces", "Systeem", "Team", "Deelnemer", "Crew", "Communicatie", "Overig"]}, {"key": "impact", "label": "Impact", "type": "list", "width": 90, "opts": ["Hoog", "Midden", "Laag"]}, {"key": "inspanning", "label": "Inspanning", "type": "list", "width": 100, "opts": ["Hoog", "Midden", "Laag"]}, {"key": "prioriteit", "label": "Prioriteit", "type": "list", "width": 120, "opts": ["Nu oppakken", "Later", "Parkeren"]}, {"key": "status", "label": "Status", "type": "list", "width": 120, "opts": ["Nieuw", "In verkenning", "Afgerond", "Afgewezen"]}, {"key": "owner", "label": "Eigenaar", "type": "owner", "width": 160, "opts": null}, {"key": "stap", "label": "Eerste stap", "type": "long", "width": 280, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "planning", "title": "Planning", "sheetId": 1009, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 100, "opts": null}, {"key": "datum", "label": "Datum", "type": "date", "width": 110, "opts": null}, {"key": "thema", "label": "Thema", "type": "list", "width": 200, "opts": ["OKR's", "Lopende weekenden", "Operations-projecten", "Brainstorm & vooruitkijken"]}, {"key": "status", "label": "Status", "type": "list", "width": 130, "opts": ["Vervallen"]}, {"key": "voorzitter", "label": "Voorzitter", "type": "owner", "width": 160, "opts": null}, {"key": "notulist", "label": "Notulist", "type": "owner", "width": 160, "opts": null}, {"key": "hoofdonderwerp", "label": "Hoofdonderwerp", "type": "long", "width": 300, "opts": null}, {"key": "mijlpaal", "label": "Mijlpaal", "type": "text", "width": 200, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "agenda", "title": "Agenda", "sheetId": 1010, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 100, "opts": null}, {"key": "datum", "label": "Datum", "type": "date", "width": 110, "opts": null}, {"key": "checkin", "label": "Check-in (0–5)", "type": "long", "width": 340, "opts": null}, {"key": "afronding", "label": "Afronding (55–60)", "type": "long", "width": 340, "opts": null}, {"key": "volgende", "label": "Voor de volgende meeting", "type": "long", "width": 340, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "agendapunten", "title": "Agendapunten", "sheetId": 1011, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 90, "opts": null}, {"key": "datum", "label": "Meeting", "type": "date", "width": 110, "opts": null}, {"key": "blok", "label": "Blok", "type": "list", "width": 110, "opts": ["punt", "onderwerp"]}, {"key": "soort", "label": "Soort", "type": "list", "width": 110, "opts": ["Informeren", "Bespreken", "Besluiten"]}, {"key": "tekst", "label": "Punt", "type": "long", "width": 360, "opts": null}, {"key": "door", "label": "Ingebracht door", "type": "owner", "width": 160, "opts": null}, {"key": "toelichting", "label": "Toelichting", "type": "long", "width": 300, "opts": null}, {"key": "voorbereiding", "label": "Voorbereiding", "type": "long", "width": 260, "opts": null}, {"key": "klaar", "label": "Behandeld", "type": "bool", "width": 90, "opts": null}, {"key": "order", "label": "Volgorde", "type": "num", "width": 110, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "team", "title": "Team", "sheetId": 1012, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 70, "opts": null}, {"key": "naam", "label": "Naam", "type": "text", "width": 200, "opts": null}, {"key": "rol", "label": "Rol", "type": "text", "width": 240, "opts": null}, {"key": "gebied", "label": "Aandachtsgebied", "type": "long", "width": 320, "opts": null}, {"key": "order", "label": "Volgorde", "type": "num", "width": 80, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}, {"key": "email", "label": "E-mail (agenda)", "type": "text", "width": 220, "opts": null}]}, {"key": "parkeerplaats", "title": "Parkeerplaats", "sheetId": 1014, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 90, "opts": null}, {"key": "datum", "label": "Geparkeerd op", "type": "date", "width": 110, "opts": null}, {"key": "tekst", "label": "Onderwerp", "type": "long", "width": 360, "opts": null}, {"key": "door", "label": "Ingebracht door", "type": "owner", "width": 160, "opts": null}, {"key": "status", "label": "Status", "type": "list", "width": 110, "opts": ["Open", "Ingepland", "Afgehandeld"]}, {"key": "note", "label": "Notitie", "type": "long", "width": 300, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "werkdruk", "title": "Werkdruk", "sheetId": 1015, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 150, "opts": null}, {"key": "datum", "label": "Meeting", "type": "date", "width": 110, "opts": null}, {"key": "naam", "label": "Teamlid", "type": "owner", "width": 160, "opts": null}, {"key": "score", "label": "Score (1 rustig, 5 te veel)", "type": "num", "width": 100, "opts": null}, {"key": "opmerking", "label": "Opmerking", "type": "long", "width": 300, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "kpis", "title": "KPI's", "sheetId": 1016, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 70, "opts": null}, {"key": "nr", "label": "#", "type": "num", "width": 50, "opts": null}, {"key": "categorie", "label": "Categorie", "type": "list", "width": 180, "opts": ["Deelnemersreis", "Website & informatie", "Reisvoorbereiding & vertrek", "Team, werkdruk & continuïteit", "Data & sturing", "Overig"]}, {"key": "title", "label": "KPI", "type": "long", "width": 360, "opts": null}, {"key": "owner", "label": "Eigenaar", "type": "owner", "width": 160, "opts": null}, {"key": "unit", "label": "Eenheid", "type": "list", "width": 80, "opts": ["%", "aantal", "uren", "cijfer"]}, {"key": "norm", "label": "Norm", "type": "num", "width": 80, "opts": null}, {"key": "direction", "label": "Richting", "type": "list", "width": 130, "opts": ["Hoger is beter", "Lager is beter"]}, {"key": "m1", "label": "jan", "type": "num", "width": 70, "opts": null}, {"key": "m2", "label": "feb", "type": "num", "width": 70, "opts": null}, {"key": "m3", "label": "mrt", "type": "num", "width": 70, "opts": null}, {"key": "m4", "label": "apr", "type": "num", "width": 70, "opts": null}, {"key": "m5", "label": "mei", "type": "num", "width": 70, "opts": null}, {"key": "m6", "label": "jun", "type": "num", "width": 70, "opts": null}, {"key": "m7", "label": "jul", "type": "num", "width": 70, "opts": null}, {"key": "m8", "label": "aug", "type": "num", "width": 70, "opts": null}, {"key": "m9", "label": "sep", "type": "num", "width": 70, "opts": null}, {"key": "m10", "label": "okt", "type": "num", "width": 70, "opts": null}, {"key": "m11", "label": "nov", "type": "num", "width": 70, "opts": null}, {"key": "m12", "label": "dec", "type": "num", "width": 70, "opts": null}, {"key": "note", "label": "Toelichting", "type": "long", "width": 260, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "weken", "title": "Weken", "sheetId": 1019, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 110, "opts": null}, {"key": "weekstart", "label": "Week van (maandag)", "type": "date", "width": 130, "opts": null}, {"key": "focus", "label": "Focus deze week", "type": "long", "width": 380, "opts": null}, {"key": "afspraken", "label": "Afspraken / weekplanning", "type": "long", "width": 420, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "processen", "title": "Processen", "sheetId": 1020, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 70, "opts": null}, {"key": "order", "label": "Volgorde", "type": "num", "width": 80, "opts": null}, {"key": "categorie", "label": "Categorie", "type": "list", "width": 220, "opts": ["Team office", "Campagne / event", "Website", "Mailings", "Voorbereiden en nazorg weekend", "Benodigdheden weekend / event", "Klantcontact", "Labels: 4M / 4Family / Arise", "Muskathlon", "LIFE Netwerk", "Crew", "Financiën", "Beheer informatiesystemen", "Overig"]}, {"key": "title", "label": "Proces", "type": "text", "width": 300, "opts": null}, {"key": "soort", "label": "Soort", "type": "list", "width": 100, "opts": ["Proces", "Naslag", "Template", "Handboek"]}, {"key": "kern", "label": "Kernproces", "type": "bool", "width": 90, "opts": null}, {"key": "labels", "label": "Labels (leeg = alle)", "type": "text", "width": 180, "opts": null}, {"key": "link", "label": "Link", "type": "text", "width": 260, "opts": null}, {"key": "eigenaar", "label": "Proceseigenaar", "type": "owner", "width": 160, "opts": null}, {"key": "uitvoerders", "label": "Wie kan uitvoeren (naam: labels; …)", "type": "long", "width": 320, "opts": null}, {"key": "frequentie", "label": "Frequentie", "type": "list", "width": 140, "opts": ["Dagelijks", "Wekelijks", "Maandelijks", "Per weekend / reis", "Per kwartaal", "Jaarlijks", "Ad hoc"]}, {"key": "status", "label": "Status documentatie", "type": "list", "width": 140, "opts": ["Actueel", "In bewerking", "Verouderd", "Ontbreekt"]}, {"key": "gecheckt", "label": "Laatst gecontroleerd", "type": "date", "width": 120, "opts": null}, {"key": "note", "label": "Toelichting", "type": "long", "width": 300, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}, {"key": "persoonlijk", "title": "Persoonlijk", "sheetId": 1021, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 110, "opts": null}, {"key": "eigenaar", "label": "Eigenaar (e-mail)", "type": "text", "width": 220, "opts": null}, {"key": "soort", "label": "Soort", "type": "list", "width": 110, "opts": ["todo", "prio", "idee", "notitie", "lijst", "teamactie"]}, {"key": "title", "label": "Titel", "type": "long", "width": 380, "opts": null}, {"key": "due", "label": "Datum", "type": "date", "width": 110, "opts": null}, {"key": "done", "label": "Klaar", "type": "bool", "width": 80, "opts": null}, {"key": "week", "label": "Week (prio)", "type": "text", "width": 100, "opts": null}, {"key": "order", "label": "Volgorde", "type": "num", "width": 80, "opts": null}, {"key": "project", "label": "Project / weekend", "type": "text", "width": 140, "opts": null}, {"key": "note", "label": "Notitie", "type": "long", "width": 320, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}, {"key": "lijst", "label": "Kolom (lijst-id)", "type": "text", "width": 130, "opts": null}, {"key": "label", "label": "Prioriteit / label", "type": "list", "width": 130, "opts": ["Urgent", "Hoog", "Normaal", "Laag", "Wachten", "Delegeren"]}]}, {"key": "afwezigheid", "title": "Afwezigheid", "sheetId": 1017, "cols": [{"key": "id", "label": "ID", "type": "id", "width": 90, "opts": null}, {"key": "naam", "label": "Teamlid", "type": "owner", "width": 160, "opts": null}, {"key": "soort", "label": "Soort", "type": "list", "width": 140, "opts": ["Vakantie", "Vrij", "Cursus / opleiding", "Extern / op reis", "Anders"]}, {"key": "van", "label": "Van", "type": "date", "width": 110, "opts": null}, {"key": "tot", "label": "Tot en met", "type": "date", "width": 110, "opts": null}, {"key": "note", "label": "Notitie", "type": "long", "width": 300, "opts": null}, {"key": "updatedAt", "label": "Bijgewerkt", "type": "ts", "width": 150, "opts": null}]}], "settings": {"title": "Instellingen", "sheetId": 1013}, "start": {"title": "Start", "sheetId": 1000}, "statusColors": {"Op koers": ["#E4F2E8", "#1E7A3C"], "Behaald": ["#E4F2E8", "#1E7A3C"], "Gereed": ["#E4F2E8", "#1E7A3C"], "Groen": ["#E4F2E8", "#1E7A3C"], "Vastgelegd": ["#E4F2E8", "#1E7A3C"], "Afgerond": ["#E4F2E8", "#1E7A3C"], "Nu oppakken": ["#E4F2E8", "#1E7A3C"], "Aandacht": ["#FBF0D9", "#A8640A"], "Oranje": ["#FBF0D9", "#A8640A"], "Herzien": ["#FBF0D9", "#A8640A"], "Bezig": ["#E3ECFA", "#1F4E9A"], "In verkenning": ["#E3ECFA", "#1F4E9A"], "Achter": ["#FBE5E3", "#B4261E"], "Rood": ["#FBE5E3", "#B4261E"], "Vervallen": ["#ECECE8", "#6B6B66"], "Ingetrokken": ["#ECECE8", "#6B6B66"], "Afgewezen": ["#ECECE8", "#6B6B66"]}, "colors": {"black": "#0F0F0F", "red": "#DD0000", "grey": "#F1F1EE", "muted": "#6B6B66"}, "font": "Epilogue", "display": "Big Shoulders Display"};
const API_VERSION = 9;   // ophogen bij elke wijziging van SPEC of ops; de site controleert dit
const HEADER_ROWS = 2;
const PROPS = PropertiesService.getScriptProperties();
/* teams: welke datasheet hoort bij welk team. ops = de sheet waar dit script aan gebonden is; andere teams via een scripteigenschap met het sheet-ID. */
const TEAMS = { ops: null, marketing: 'SHEET_MARKETING' };
let TEAM = 'ops';
function setTeam(t){ TEAM = Object.prototype.hasOwnProperty.call(TEAMS, t) ? t : 'ops'; return TEAM; }
const ss = () => {
  if(TEAM === 'ops') return SpreadsheetApp.getActiveSpreadsheet();
  const id = PROPS.getProperty(TEAMS[TEAM]); if(!id) throw new Error('Geen datasheet gekoppeld voor team ' + TEAM + ' (menu OPS site → Marketing: datasheet koppelen)');
  return SpreadsheetApp.openById(id);
};

/* ---------------- menu ---------------- */
function onOpen(){
  SpreadsheetApp.getUi().createMenu('OPS site')
    .addItem('Instellen (client-ID en domeinen)', 'setupPrompt')
    .addItem('Toegestane domeinen wijzigen', 'setupDomains')
    .addItem('Opmaak en keuzelijsten toepassen', 'applyFormatting')
    .addItem('Test: lees alles', 'testAll')
    .addItem('Test: agenda van het team (deze week)', 'testWeek')
    .addItem('Test: klantenservice-dashboards', 'testDash')
    .addItem('Test: aanmeldingen (Weekendbord-JSON)', 'testAanmeldingen')
    .addSeparator()
    .addItem('Marketing: datasheet koppelen', 'setupMarketingSheet')
    .addItem('Marketing: opmaak en keuzelijsten toepassen', 'applyFormattingMarketing')
    .addItem('Marketing: test lees alles', 'testAllMarketing')
    .addToUi();
}
const DEFAULT_DOMAINS = '4m.nl, de4emusketier.nl';
function allowedDomains(){ return String(PROPS.getProperty('DOMAIN') || DEFAULT_DOMAINS).toLowerCase().split(/[,;\s]+/).map(x => x.replace(/^@/, '').trim()).filter(Boolean); }
function setupDomains(){
  const ui = SpreadsheetApp.getUi();
  const d = ui.prompt('Toegestane domeinen', 'Welke e-maildomeinen mogen inloggen? Komma-gescheiden.\nNu: ' + allowedDomains().join(', '), ui.ButtonSet.OK_CANCEL);
  if(d.getSelectedButton() !== ui.Button.OK) return;
  PROPS.setProperty('DOMAIN', d.getResponseText().trim() || DEFAULT_DOMAINS);
  ui.alert('Toegestane domeinen: ' + allowedDomains().join(', ') + '\nZet dezelfde lijst in index.html (CONFIG.domains).');
}
function setupPrompt(){
  const ui = SpreadsheetApp.getUi();
  const a = ui.prompt('OAuth client-ID', 'Plak de client-ID uit Google Cloud (eindigt op .apps.googleusercontent.com):', ui.ButtonSet.OK_CANCEL);
  if(a.getSelectedButton() !== ui.Button.OK) return;
  PROPS.setProperty('CLIENT_ID', a.getResponseText().trim());
  const d = ui.prompt('Toegestane domeinen', 'Welke e-maildomeinen mogen inloggen? Komma-gescheiden (standaard: ' + DEFAULT_DOMAINS + ')', ui.ButtonSet.OK_CANCEL);
  PROPS.setProperty('DOMAIN', (d.getSelectedButton() === ui.Button.OK && d.getResponseText().trim()) || DEFAULT_DOMAINS);
  applyFormatting();
  ui.alert('Klaar. Publiceer nu de web-app (Implementeren → Nieuwe implementatie → Web-app, uitvoeren als ik, toegang: iedereen) en zet de URL in GitHub als API_URL.');
}
function setupMarketingSheet(){
  const ui = SpreadsheetApp.getUi();
  const a = ui.prompt('Datasheet Team Marketing', 'Plak het ID (of de URL) van de Google Sheet "Team Marketing (data)". Nu: ' + (PROPS.getProperty('SHEET_MARKETING') || '–'), ui.ButtonSet.OK_CANCEL);
  if(a.getSelectedButton() !== ui.Button.OK) return;
  const m = /[-\w]{25,}/.exec(a.getResponseText()); if(!m){ ui.alert('Geen geldig sheet-ID gevonden.'); return; }
  PROPS.setProperty('SHEET_MARKETING', m[0]);
  setTeam('marketing'); const name = ss().getName(); setTeam('ops');
  ui.alert('Gekoppeld: ' + name + '\nDraai daarna "Marketing: opmaak en keuzelijsten toepassen" en publiceer een nieuwe versie van de web-app.');
}
function applyFormattingMarketing(){ setTeam('marketing'); try{ applyFormatting(); } finally { setTeam('ops'); } SpreadsheetApp.getUi().alert('Opmaak toegepast op de Marketing-datasheet.'); }
function testAllMarketing(){ setTeam('marketing'); try{ const d = readAll(false); SpreadsheetApp.getUi().alert('Marketing · ' + ss().getName() + '\n\n' + Object.keys(d).map(k => k + ': ' + (Array.isArray(d[k]) ? d[k].length + ' rijen' : 'ok')).join('\n')); } finally { setTeam('ops'); } }
function testAanmeldingen(){ const d = readAanmeldingen(true); SpreadsheetApp.getUi().alert(d.error ? 'FOUT: ' + d.error : 'OK: ' + (d.weekenden || []).length + ' campagnes, peildatum ' + (d.peildatum || '?')); }
function testAll(){ const d = readAll(true); SpreadsheetApp.getUi().alert('API-versie ' + API_VERSION + ' · toegestane domeinen: ' + allowedDomains().join(', ') + '\n\n' + Object.keys(d).map(k => k + ': ' + (Array.isArray(d[k]) ? d[k].length + ' rijen' : 'ok')).join('\n')); }

/* ---------------- web app ---------------- */
function doGet(){ return json({ok:true, service:'Team Operations Woensdag API', version:API_VERSION}); }
function doPost(e){
  try{
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    setTeam(body.team);
    const v = verify(body.token); const user = v.user;
    if(!user) return json({error:'auth', reason:v.reason, email:v.email || '', domains: allowedDomains(), version: API_VERSION});
    const lock = LockService.getScriptLock();
    switch(body.op){
      case 'all': return json({ok:true, version: API_VERSION, user:user.email, data: readAll(!!body.live, user)});
      case 'write':
        lock.waitLock(20000);
        try{ (body.writes || []).forEach(w => applyWrite(w, user)); } finally { lock.releaseLock(); }
        return json({ok:true});
      case 'settings':
        lock.waitLock(20000);
        try{ writeSettings(body.settings || {}); } finally { lock.releaseLock(); }
        return json({ok:true});
      case 'week': return json({ok:true, data: readWeek(body.from, body.to, !!body.force, body.email ? String(body.email).toLowerCase() : '')});
      case 'dash': return json({ok:true, data: readDash(!!body.force)});
      case 'aanmeldingen': return json({ok:true, data: readAanmeldingen(!!body.force)});
      default: return json({error:'bad_op'});
    }
  }catch(err){ return json({error:'server', message:String(err && err.message || err)}); }
}
function json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------------- auth ---------------- */
/* Geeft {user:{email}} terug, of {reason, email} als het token niet geaccepteerd wordt — de site toont de reden op het inlogscherm. */
function verify(token){
  if(!token) return {reason:'no_token'};
  const clientId = PROPS.getProperty('CLIENT_ID'); const domains = allowedDomains();
  if(!clientId) return {reason:'no_client_id'};
  const cache = CacheService.getScriptCache();
  const key = 'tok:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  const hit = cache.get(key); if(hit) return {user: JSON.parse(hit)};
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), {muteHttpExceptions:true});
  if(res.getResponseCode() !== 200) return {reason:'google_rejected'};
  const info = JSON.parse(res.getContentText());
  const email = String(info.email || '').toLowerCase();
  if(info.aud !== clientId) return {reason:'aud', email:email};
  if(String(info.email_verified) !== 'true') return {reason:'unverified', email:email};
  if(!domains.some(d => email.endsWith('@' + d))) return {reason:'domain', email:email};
  const ttl = Math.floor((Number(info.exp) * 1000 - Date.now()) / 1000);
  if(ttl <= 0) return {reason:'expired', email:email};
  const user = {email};
  cache.put(key, JSON.stringify(user), Math.max(60, Math.min(ttl, 1800)));
  return {user};
}

/* ---------------- lezen ---------------- */
const PRIVATE_TABS = {persoonlijk: 'eigenaar'};   // tab → kolom met het e-mailadres van de eigenaar; alleen eigen rijen worden teruggegeven
function readAll(withLive, user){
  const out = {};
  const me = String(user && user.email || '').toLowerCase();
  SPEC.tabs.forEach(t => { let rows = readTab(t); const col = PRIVATE_TABS[t.key]; if(col) rows = rows.filter(r => String(r[col] || '').toLowerCase() === me); out[t.key] = rows; });
  out.settings = readSettings();
  if(withLive) out.live = readLive(out.settings.opsDashboardId);
  return out;
}
function readTab(tab){
  const sh = ss().getSheetByName(tab.title); if(!sh) return [];
  const vals = sh.getDataRange().getValues();
  if(vals.length <= HEADER_ROWS) return [];
  const keys = vals[1].map(String);
  const out = [];
  for(let r = HEADER_ROWS; r < vals.length; r++){
    const row = vals[r]; const id = conv(row[0], {type:'id'});
    if(id === '') continue;
    const d = {};
    keys.forEach((k, i) => { if(!k) return; d[k] = conv(row[i], tab.cols.find(c => c.key === k)); });
    d.id = String(id);
    out.push(d);
  }
  return out;
}
function conv(v, spec){
  const t = spec ? spec.type : 'text';
  if(v instanceof Date) return t === 'ts' ? Utilities.formatDate(v, tz(), "yyyy-MM-dd'T'HH:mm:ss") : Utilities.formatDate(v, tz(), 'yyyy-MM-dd');
  if(v === '' || v === null || v === undefined) return t === 'num' ? null : (t === 'bool' ? false : '');
  if(t === 'bool') return v === true || String(v).toUpperCase() === 'TRUE';
  if(t === 'num') return typeof v === 'number' ? v : (isNaN(Number(String(v).replace(',', '.'))) ? null : Number(String(v).replace(',', '.')));
  return String(v);
}
function tz(){ return ss().getSpreadsheetTimeZone() || 'Europe/Amsterdam'; }
function readSettings(){
  const sh = ss().getSheetByName(SPEC.settings.title); const s = {};
  if(sh && sh.getLastRow() > HEADER_ROWS){
    sh.getRange(HEADER_ROWS + 1, 1, sh.getLastRow() - HEADER_ROWS, 2).getValues().forEach(r => { const k = String(r[0]).trim(); if(!k) return; s[k] = r[1] instanceof Date ? Utilities.formatDate(r[1], tz(), 'yyyy-MM-dd') : r[1]; });
  }
  s.werkafspraken = String(s.werkafspraken || '').split('\n').map(x => x.trim()).filter(Boolean);
  s.kwartaal = s.kwartaal || 'Q4'; s.jaar = Number(s.jaar) || new Date().getFullYear();
  return s;
}
function readLive(sheetId){
  if(!sheetId) return {error:'Geen opsDashboardId in Instellingen'};
  try{
    const dash = SpreadsheetApp.openById(String(sheetId));
    const sh = dash.getSheetByName('Projecten data');
    if(!sh) return {error:"Tab 'Projecten data' niet gevonden"};
    const out = {values: sh.getDataRange().getDisplayValues(), links: {}};
    // productiesheet-links uit tab Configuratie (kolommen Project + "Productiesheet ID of URL")
    try{
      const cfg = dash.getSheetByName('Configuratie');
      if(cfg){
        const v = cfg.getDataRange().getDisplayValues();
        const hi = v.findIndex(r => String(r[0]).trim().toLowerCase() === 'project');
        if(hi >= 0){
          const head = v[hi].map(x => String(x).trim().toLowerCase());
          const pi = head.indexOf('project'), ui = head.findIndex(h => h.indexOf('productiesheet') >= 0);
          if(pi >= 0 && ui >= 0) v.slice(hi + 1).forEach(r => { const p = String(r[pi] || '').trim(), u = String(r[ui] || '').trim(); if(p && u) out.links[p] = u; });
        }
      }
    }catch(e){}
    return out;
  }catch(e){ return {error:String(e && e.message || e)}; }
}

/* ---------------- week: Google Agenda van het team ----------------
 * Leest per teamlid (kolom "E-mail (agenda)" op tab Team) de agenda via CalendarApp.
 * De site berekent hieruit wie vrij is om te bellen in het belvenster (Instellingen: telefoonVenster, telefoonDagen).
 * Hele-dag-afspraken (Kantoor, Thuiswerken) blokkeren niet; "Niet op kantoor" en vakantie/verlof wel.
 * Vereist dat de eigenaar van dit script (uitvoeren als: ik) de agenda's van het team mag zien
 * (standaard binnen een Google Workspace-domein). Privé-afspraken worden als "Bezet" getoond.
 * Draai eenmalig testWeek() in de editor om de agenda-rechten te accepteren; publiceer daarna een nieuwe versie.
 */
function readWeek(from, to, force, onlyEmail){
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if(!re.test(String(from)) || !re.test(String(to))) throw new Error('Ongeldige periode');
  const cache = CacheService.getScriptCache(); const key = 'week:' + TEAM + ':' + from + ':' + to + ':' + (onlyEmail || '');
  if(!force){ const hit = cache.get(key); if(hit) return JSON.parse(hit); }
  const teamTab = SPEC.tabs.find(t => t.key === 'team');
  const team = readTab(teamTab).filter(m => m.email && (!onlyEmail || String(m.email).trim().toLowerCase() === onlyEmail)).sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
  const start = toCell(from, {type:'date'}); const end = new Date(toCell(to, {type:'date'}).getTime() + 86400000 - 1);
  const zone = tz();
  const members = team.map(m => {
    const email = String(m.email).trim().toLowerCase();
    try{
      let cal = CalendarApp.getCalendarById(email);
      if(!cal){ try{ cal = CalendarApp.subscribeToCalendar(email, {hidden:true}); }catch(e){ cal = null; } }
      if(!cal) return {naam:m.naam, email:email, ok:false, error:'geen toegang tot deze agenda'};
      const events = cal.getEvents(start, end).map(ev => {
        let title = '';
        try{ const vis = ev.getVisibility(); title = (vis === CalendarApp.Visibility.PRIVATE || vis === CalendarApp.Visibility.CONFIDENTIAL) ? 'Bezet' : (ev.getTitle() || 'Bezet'); }catch(e){ title = ev.getTitle() || 'Bezet'; }
        let declined = false;
        try{ const g = ev.getGuestByEmail(email); declined = !!g && g.getGuestStatus() === CalendarApp.GuestStatus.NO; }catch(e){}
        if(declined) return null;
        let free = false;   // "Beschikbaar" in Google Agenda: telt niet als bezet voor het belvenster
        try{ free = ev.getTransparency() === CalendarApp.EventTransparency.TRANSPARENT; }catch(e){}
        let kind = 'default';   // ooo = Niet op kantoor, loc = werklocatie (Kantoor/Thuiswerken), focus = focustijd
        try{ const et = ev.getEventType(); const T = CalendarApp.EventType; kind = et === T.OUT_OF_OFFICE ? 'ooo' : et === T.WORKING_LOCATION ? 'loc' : et === T.FOCUS_TIME ? 'focus' : 'default'; }catch(e){}
        const allDay = ev.isAllDayEvent();
        return {d: Utilities.formatDate(ev.getStartTime(), zone, 'yyyy-MM-dd'), start: allDay ? '' : Utilities.formatDate(ev.getStartTime(), zone, 'HH:mm'), end: allDay ? '' : Utilities.formatDate(ev.getEndTime(), zone, 'HH:mm'),
          endD: Utilities.formatDate(new Date(ev.getEndTime().getTime() - (allDay ? 1 : 0)), zone, 'yyyy-MM-dd'), allDay: allDay, free: free, kind: kind, title: String(title).slice(0, 80)};
      }).filter(Boolean);
      // meerdaagse (hele dag) afspraken op elke dag tonen
      const expanded = [];
      events.forEach(e => { if(e.allDay && e.endD > e.d){ let d = new Date(toCell(e.d, {type:'date'})); const last = toCell(e.endD, {type:'date'}); while(d <= last){ expanded.push(Object.assign({}, e, {d: Utilities.formatDate(d, zone, 'yyyy-MM-dd')})); d = new Date(d.getTime() + 86400000); } } else expanded.push(e); });
      expanded.sort((a, b) => (a.d + (a.allDay ? '!' : a.start)).localeCompare(b.d + (b.allDay ? '!' : b.start)));
      return {naam:m.naam, email:email, ok:true, events: expanded.map(e => ({d:e.d, start:e.start, end:e.end, allDay:e.allDay, free:e.free, kind:e.kind, title:e.title}))};
    }catch(e){ return {naam:m.naam, email:email, ok:false, error:String(e && e.message || e)}; }
  });
  const data = {from:from, to:to, members:members, generatedAt: Utilities.formatDate(new Date(), zone, "yyyy-MM-dd'T'HH:mm:ss")};
  try{ cache.put(key, JSON.stringify(data), 300); }catch(e){}
  return data;
}
function testWeek(){
  const d = new Date(); const day = (d.getDay() + 6) % 7; const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day); const sun = new Date(mon.getTime() + 6 * 86400000);
  const f = x => Utilities.formatDate(x, tz(), 'yyyy-MM-dd');
  const w = readWeek(f(mon), f(sun), true);
  SpreadsheetApp.getUi().alert('Week ' + w.from + ' t/m ' + w.to + '\n' + (w.members.length ? w.members.map(m => m.naam + ': ' + (m.ok ? m.events.length + ' afspraken' : 'FOUT – ' + m.error)).join('\n') : 'Geen teamleden met e-mail op tab Team.'));
}

/* ---------------- klantenservice: inbox- en telefoniedashboard ----------------
 * Leest alleen geaggregeerde tabbladen: TWD Dashboard → Feed, Feed_backlog, Instellingen (doelen);
 * Telefonie Dashboard → Maandcijfers en de kop van Dashboard totaal. Geen tickets, gesprekken of nummers.
 * Per-persoon-cijfers (niveau agent, blok "per collega") worden weggelaten tenzij Instellingen dashPersonen = ja.
 */
const DASH_INBOX_DEFAULT = '16xEkT_Da8f_4agCcb2I7qOowEmCkNVvvssssmzlyv0o';
const DASH_TELEFOON_DEFAULT = '1YgMdej7Pjg56_9tA-bU-w54MFdg0GM61K2Kx7vue3Fc';
function readDash(force){
  const cache = CacheService.getScriptCache(); const key = 'dash:v1:' + TEAM;
  if(!force){ const hit = cache.get(key); if(hit) return JSON.parse(hit); }
  const s = readSettings();
  const personen = String(s.dashPersonen || '').trim().toLowerCase() === 'ja';
  const out = {inbox:null, telefoon:null, personen:personen, fetchedAt: Utilities.formatDate(new Date(), tz(), "yyyy-MM-dd'T'HH:mm:ss")};
  try{
    const ss2 = SpreadsheetApp.openById(String(s.dashInboxId || DASH_INBOX_DEFAULT));
    const feed = ss2.getSheetByName('Feed'); const back = ss2.getSheetByName('Feed_backlog'); const inst = ss2.getSheetByName('Instellingen');
    if(!feed) throw new Error("Tab 'Feed' niet gevonden");
    let rows = feed.getDataRange().getDisplayValues().filter(r => String(r[0]).trim());
    const head = rows[0]; const ni = head.indexOf('Niveau');
    rows = [head].concat(rows.slice(1).filter(r => personen || String(r[ni]).toLowerCase() !== 'agent'));
    const inbox = {feed: rows, backlog: back ? back.getDataRange().getDisplayValues().filter(r => String(r[0]).trim()) : []};
    if(inst){ const v = inst.getRange('A3:B9').getDisplayValues(); const g = n => { const r = v.find(x => String(x[0]).toLowerCase().indexOf(n) === 0); return r ? r[1] : ''; };
      inbox.doelMin = g('doel eerste reactie (min'); inbox.doelAandeel = g('doel aandeel'); inbox.peildatum = g('peildatum'); inbox.periode = g('periode'); inbox.jaar = g('lopend jaar'); }
    inbox.url = ss2.getUrl();
    out.inbox = inbox;
  }catch(e){ out.inbox = {error: String(e && e.message || e)}; }
  try{
    const ss3 = SpreadsheetApp.openById(String(s.dashTelefoonId || DASH_TELEFOON_DEFAULT));
    const mc = ss3.getSheetByName('Maandcijfers'); const dt = ss3.getSheetByName('Dashboard totaal');
    if(!mc) throw new Error("Tab 'Maandcijfers' niet gevonden");
    let rows = mc.getDataRange().getDisplayValues().filter(r => String(r[0]).trim());
    if(!personen){ const i = rows.findIndex(r => /per collega/i.test(String(r[0]))); if(i >= 0) rows = rows.slice(0, i); }
    const tel = {maand: rows, kop: dt ? dt.getRange('A1:J10').getDisplayValues() : [], url: ss3.getUrl()};
    out.telefoon = tel;
  }catch(e){ out.telefoon = {error: String(e && e.message || e)}; }
  try{ cache.put(key, JSON.stringify(out), 600); }catch(e){}
  return out;
}
/* ---------------- aanmeldingen: Weekendbord (Apps Script met JSON-uitvoer) ----------------
 * Instellingen → aanmeldingenUrl = de exec-URL van het Weekendbord met ?format=json. Verwacht JSON als
 * {peildatum:'2026-11-09', weekenden:[{naam, label, start:'2027-04-15', aanmeldingen, doel, ondergrens, historie, weken, trend, status}]}.
 * Alleen aantallen per campagne; geen persoonsgegevens. Cache 10 minuten. */
function readAanmeldingen(force){
  const s = readSettings(); const url = String(s.aanmeldingenUrl || '').trim();
  if(!url) return {error: 'Geen aanmeldingenUrl in Instellingen'};
  const cache = CacheService.getScriptCache(); const key = 'aanm:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, url));
  if(!force){ const hit = cache.get(key); if(hit) return JSON.parse(hit); }
  try{
    const res = UrlFetchApp.fetch(url, {muteHttpExceptions: true, followRedirects: true});
    const code = res.getResponseCode(); const text = res.getContentText();
    if(code !== 200) return {error: 'HTTP ' + code};
    let data; try{ data = JSON.parse(text); }catch(e){ return {error: 'geen JSON (krijg je de HTML-pagina terug? zet ?format=json achter de URL en zorg dat doGet dan ContentService-JSON geeft)'}; }
    const list = Array.isArray(data) ? data : (data.weekenden || data.items || data.rows || data.data || []);
    const out = {peildatum: data.peildatum || data.date || Utilities.formatDate(new Date(), tz(), 'yyyy-MM-dd'), weekenden: list};
    try{ cache.put(key, JSON.stringify(out), 600); }catch(e){}
    return out;
  }catch(e){ return {error: String(e && e.message || e)}; }
}
function testDash(){ const d = readDash(true); SpreadsheetApp.getUi().alert('Inbox: ' + (d.inbox && d.inbox.error ? 'FOUT ' + d.inbox.error : (d.inbox.feed.length - 1) + ' feedregels, ' + d.inbox.backlog.length + ' backlogregels') + '\nTelefonie: ' + (d.telefoon && d.telefoon.error ? 'FOUT ' + d.telefoon.error : d.telefoon.maand.length + ' regels Maandcijfers') + '\nPer persoon: ' + (d.personen ? 'ja' : 'nee')); }

/* ---------------- schrijven ---------------- */
function applyWrite(w, user){
  const tab = SPEC.tabs.find(t => t.key === w.col); if(!tab) throw new Error('Onbekende tabel: ' + w.col);
  const sh = ss().getSheetByName(tab.title); if(!sh) throw new Error('Tabblad ontbreekt: ' + tab.title);
  const all = sh.getDataRange().getValues(); const lastRow = all.length;
  const keys = all[1].map(String);
  const ids = all.slice(HEADER_ROWS).map(r => conv(r[0], {type:'id'}));
  const idx = ids.indexOf(String(w.id));
  const privCol = PRIVATE_TABS[w.col]; const me = String(user && user.email || '').toLowerCase();
  if(privCol){ // persoonlijke rijen: alleen de eigenaar mag ze aanmaken, wijzigen of verwijderen
    if(idx >= 0){ const ci = keys.indexOf(privCol); const owner = String(all[idx + HEADER_ROWS][ci] || '').toLowerCase(); if(owner && owner !== me) throw new Error('Niet jouw item'); }
    if(!w.del) w.doc = Object.assign({}, w.doc || {}, {[privCol]: me});
  }
  if(w.del){ if(idx >= 0) sh.deleteRow(idx + HEADER_ROWS + 1); return; }
  const doc = w.doc || {};
  const row = keys.map(k => { if(!k) return ''; const spec = tab.cols.find(c => c.key === k); return toCell(k === 'id' ? w.id : doc[k], spec); });
  const r = idx >= 0 ? idx + HEADER_ROWS + 1 : lastRow + 1;
  sh.getRange(r, 1, 1, row.length).setValues([row]);
}
function toCell(v, spec){
  const t = spec ? spec.type : 'text';
  if(v === undefined || v === null) return '';
  if(Array.isArray(v) || typeof v === 'object') return JSON.stringify(v);
  if(t === 'bool') return v === true || v === 'true' || v === '1' || v === 1;
  if(t === 'date'){ const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v)); return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : ''; }
  if(t === 'num') return v === '' ? '' : Number(v);
  return String(v);
}
function writeSettings(s){
  const sh = ss().getSheetByName(SPEC.settings.title);
  const cur = readSettings();
  const merged = Object.assign({}, cur, s);
  const rows = [];
  Object.keys(merged).forEach(k => { let v = merged[k]; if(Array.isArray(v)) v = v.join('\n'); rows.push([k, v]); });
  const n = Math.max(sh.getLastRow() - HEADER_ROWS, 0);
  if(n) sh.getRange(HEADER_ROWS + 1, 1, n, 2).clearContent();
  sh.getRange(HEADER_ROWS + 1, 1, rows.length, 2).setValues(rows);
}

/* ---------------- opmaak ---------------- */
function applyFormatting(){
  const book = ss();
  const C = SPEC.colors;
  SPEC.tabs.forEach(tab => {
    let sh = book.getSheetByName(tab.title);
    if(!sh){ sh = book.insertSheet(tab.title); sh.getRange(1, 1, 2, tab.cols.length).setValues([tab.cols.map(c => c.label), tab.cols.map(c => c.key)]); }
    const n = tab.cols.length, rows = Math.max(sh.getMaxRows(), 100);
    sh.setFrozenRows(2); sh.setFrozenColumns(1);
    sh.getRange(1, 1, rows, n).setFontFamily(SPEC.font).setFontSize(10).setVerticalAlignment('top').setWrap(true);
    sh.getRange(1, 1, 1, n).setBackground(C.black).setFontColor('#FFFFFF').setFontWeight('bold').setVerticalAlignment('middle').setWrap(false)
      .setBorder(null, null, true, null, null, null, C.red, SpreadsheetApp.BorderStyle.SOLID_THICK);
    sh.getRange(2, 1, 1, n).setBackground(C.grey).setFontColor(C.muted).setFontFamily('Roboto Mono').setFontSize(8).setFontStyle('italic').setVerticalAlignment('middle').setWrap(false);
    sh.setRowHeight(1, 34); sh.setRowHeight(2, 18);
    sh.getRange(3, 1, rows - 2, n).clearDataValidations();
    sh.clearConditionalFormatRules();
    const rules = [];
    tab.cols.forEach((c, i) => {
      const col = i + 1; const data = sh.getRange(3, col, rows - 2, 1);
      sh.setColumnWidth(col, c.type === 'long' ? 320 : (['id','num','date','bool'].indexOf(c.type) >= 0 ? 90 : 150));
      if(c.type === 'id') data.setFontFamily('Roboto Mono').setFontSize(9).setFontColor(C.muted).setNumberFormat('@');
      if(c.type === 'ts') data.setFontSize(8).setFontColor(C.muted);
      if(c.type === 'date') data.setNumberFormat('dd-mm-yyyy').setHorizontalAlignment('left');
      if(c.type === 'num') data.setNumberFormat('0.##').setHorizontalAlignment('right');
      if(c.type === 'bool') data.setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
      if(c.type === 'owner') data.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(book.getRange('Team!$B$3:$B$200'), true).setAllowInvalid(true).build());
      if(c.type === 'list'){
        if(typeof c.opts === 'string'){
          const ref = SPEC.tabs.find(t => t.key === c.opts);
          data.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(book.getRange("'" + ref.title + "'!$A$3:$A$600"), true).setAllowInvalid(true).build());
        } else {
          data.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(c.opts, true).setAllowInvalid(true).build());
          c.opts.forEach(v => { const sc = SPEC.statusColors[v]; if(sc) rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(v).setBackground(sc[0]).setFontColor(sc[1]).setBold(true).setRanges([data]).build()); });
        }
      }
    });
    sh.setConditionalFormatRules(rules);
    const bands = sh.getRange(3, 1, rows - 2, n).getBandings(); bands.forEach(b => b.remove());
    sh.getRange(3, 1, rows - 2, n).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
  });
}
