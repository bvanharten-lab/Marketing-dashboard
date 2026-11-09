# Team Operations Woensdag

Meetingpagina van Team Operations (Coalition58) voor de wekelijkse woensdagmeeting: OKR's met key results en acties, lopende weekenden, Operations-projecten, brainstorm, acties, besluiten, agenda en planning.

- **Site:** https://bvanharten-lab.github.io/ops-woensdag/
- **Data:** Google Sheet "Team Operations Woensdag (data)". De site leest en schrijft daarin via een Apps Script-web-app. Alles wat op de site gebeurt staat dus direct in de sheet, en wat je in de sheet aanpast staat binnen een minuut op de site.
- **Toegang:** inloggen met een Google-account van `4m.nl` of `de4emusketier.nl`. Andere accounts komen er niet in. De lijst staat op twee plekken: `CONFIG.domains` in `index.html` en de scriptproperty `DOMAIN` in Apps Script (menu **OPS site → Toegestane domeinen wijzigen**).

## Hoe het werkt

```
browser (GitHub Pages: index.html)
   │  POST + Google ID-token
   ▼
Apps Script web-app (Code.gs, draait als Bart)
   │  verifieert token bij Google (client-ID + domein 4m.nl)
   ▼
Google Sheet "Team Operations Woensdag (data)"   ←  leest ook "OPS Dashboard projecten" (live weekenden)
```

## Eenmalige installatie (±15 minuten)

### 1. Apps Script in de datasheet
1. Open de sheet **Team Operations Woensdag (data)** → **Extensies → Apps Script**.
2. Vervang de inhoud van `Code.gs` door het bestand `Code.gs` uit deze repo. Opslaan.
3. Herlaad de sheet. Er staat nu een menu **OPS site**.

### 2. OAuth client-ID aanmaken (Google Cloud)
1. Ga naar https://console.cloud.google.com/ → kies of maak een project (bijv. "OPS Woensdag").
2. **APIs & Services → OAuth consent screen**: type **Internal** als alle toegestane domeinen (4m.nl, de4emusketier.nl) in dezelfde Google Workspace-organisatie zitten. Zit de4emusketier.nl in een aparte Workspace, kies dan **External** en zet de app op "In production" (anders kunnen alleen testgebruikers inloggen); de domeincontrole in de site en het script houdt andere accounts buiten. Naam "Team Operations Woensdag", opslaan.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → type **Web application**.
   - Authorized JavaScript origins: `https://bvanharten-lab.github.io`
   - (geen redirect URI nodig)
4. Kopieer de **Client ID** (eindigt op `.apps.googleusercontent.com`).

### 3. Script instellen en publiceren
1. In de sheet: menu **OPS site → Instellen**, plak de client-ID, domeinen `4m.nl, de4emusketier.nl`. Dit zet ook de opmaak en keuzelijsten van alle tabbladen.
2. In Apps Script: **Implementeren → Nieuwe implementatie** → type **Web-app**:
   - Uitvoeren als: **Ik**
   - Wie heeft toegang: **Iedereen** (de toegang wordt door het ID-token afgedwongen, niet door Google's deelinstelling)
   - Implementeren → autoriseren → kopieer de **web-app-URL** (eindigt op `/exec`).

### 4. GitHub koppelen
1. In deze repo: **Settings → Secrets and variables → Actions → Variables** → **New repository variable**:
   - `API_URL` = de web-app-URL uit stap 3
   - `CLIENT_ID` = de client-ID uit stap 2
2. **Actions → Deploy naar GitHub Pages → Run workflow** (of push een wijziging). Na een minuut staat de site live.

### 5. Testen
Open https://bvanharten-lab.github.io/ops-woensdag/, log in met je 4m.nl-account, zet een actie op "Bezig" en kijk in de sheet (tab Acties).

### 6. Week-tab: Google Agenda van het team (optioneel)
De tab **Week** toont per teamlid de agenda van maandag t/m vrijdag, wie vrij is om de telefoon op te nemen in het belvenster (standaard ma–do 09:00–12:00, in te stellen via Instellingen → `telefoonVenster` en `telefoonDagen` of de knop "Belvenster") en de weekfocus (voor de maandag-weekstart).
1. Tab **Team** in de sheet: vul kolom **E-mail (agenda)** met het 4m.nl-adres van elk teamlid dat zijn agenda wil laten zien. Leeg = niet gekoppeld.
2. Menu **OPS site → Test: agenda van het team** → accepteer de agenda-rechten (eenmalig). Het script leest de agenda's als Bart, dus alleen agenda's die Bart in Google Agenda mag zien.
3. Maak een **nieuwe versie** van de web-app (Implementeren → Implementaties beheren → potlood → Versie: Nieuw → Implementeren).

Privé-afspraken worden als "Bezet" getoond, afgewezen uitnodigingen niet. Hele-dag-afspraken zoals Kantoor of Thuiswerken (ook Google's werklocatie) tellen niet als bezet; "Niet op kantoor" en hele-dag-afspraken met vakantie/verlof/vrije dag/afwezig in de titel wel. Afspraken die op "Beschikbaar" staan tellen nooit als bezet. De site cachet de agenda's 5 minuten; "Agenda's verversen" haalt ze direct opnieuw op.

### 6b. Knop "Productiesheet" op de Weekenden-tab
Elk weekendblok heeft een rode knop naar de productiesheet. De link komt uit het OPS Dashboard, tab **Configuratie** (kolom "Productiesheet ID of URL", gekoppeld op projectnaam), of uit het veld **Productiesheet (URL)** van het weekend zelf (Weekend bewerken; dat veld wint). Geen van beide ingevuld = geen knop, met een hint in het open blok.

### 6c. Klantenservice-tab (inbox + telefoon)
De tab **Klantenservice** leest twee dashboards live via het script: het **TWD Dashboard** (tabs Feed, Feed_backlog, Instellingen) en het **OPS Telefonie Dashboard** (tab Maandcijfers en de kop van Dashboard totaal). Alleen geaggregeerde tabbladen; nooit tickets, gesprekken of nummers. De sheet-ID's staan op Instellingen (`dashInboxId`, `dashTelefoonId`); `dashPersonen` = `ja` toont ook cijfers per medewerker (standaard uit). Het script moet de twee dashboards kunnen lezen (uitvoeren als Bart). Eerste keer: menu **OPS site → Test: klantenservice-dashboards** en de rechten accepteren, daarna nieuwe versie. Cijfers worden 10 minuten gecachet; "Verversen" haalt ze direct op.

### 6d. Persoonlijke omgeving
Links in de tabbalk staat een schakelaar **Team | Persoonlijk**. Persoonlijk toont voor wie is ingelogd: drie prioriteiten voor de week, de teamacties op zijn of haar naam, eigen to-do's, de eigen projecten en weekenden (eigenaar = jij), de eigen Google Agenda (14 dagen, plus woensdagmeetings, weekenden en afwezigheid) en een eigen parkeerplaats voor ideeën en notities. Herkenning gaat via het e-mailadres op de Team-tab (kolom E-mail): zonder dat adres werken alleen de eigen to-do's. Eigen items staan in tab **Persoonlijk** van de sheet, met het e-mailadres als eigenaar; het script geeft iedereen alleen zijn eigen rijen en laat niemand andermans rijen wijzigen. Let op: wie de datasheet zelf kan openen, ziet die tab wel in zijn geheel — houd de sheet dus bij jezelf.

**Mijn taken** is een bord met kolommen. Links staan de teamacties op jouw naam (uit de woensdagmeeting). Daarnaast maak je eigen kolommen met **+ Kolom** (bijvoorbeeld Nu · Deze week · Later · Delegeren) en hang je to-do's eronder: typ onderaan een kolom "+ to-do en Enter", sleep kaarten tussen kolommen (de kaart zweeft mee, een rode stippellijn toont waar hij landt; op een telefoon sleep je aan de greep ⠿) of gebruik de pijltjes ▲▼ voor de volgorde. Ook teamacties sleep je in je eigen kolommen; ze blijven teamacties (rode rand, status zichtbaar, vinkje = status Gereed voor het hele team) en je sleept ze terug naar de teamkolom om ze uit je kolommen te halen. Kolommen verschuif je met ◀ ▶ en hernoem of verwijder je via ⋯ (kaarten uit een verwijderde kolom komen in de Inbox). To-do's zonder kolom staan in de Inbox. In de sheet is een kolom een rij met soort `lijst` op tab Persoonlijk; een to-do verwijst ernaar in kolom L `lijst` (het ID van de kolom), `order` is de volgorde; een geplaatste teamactie is een rij met soort `teamactie` en `project` = `actie:<ID>`.

Elke kaart kan een **prioriteitslabel** krijgen: ⚑ op de kaart (of het veld Prioriteit / label in het formulier) opent een menu met zes labels — Urgent (rood), Hoog (oranje), Normaal (geel), Laag (groen), Wachten (blauw), Delegeren (paars). De kaart krijgt een gekleurde rand en een chip; de legenda boven het bord telt per label en filtert met één klik. De namen staan in Instellingen → `todoLabels` (max 6, komma-gescheiden; de kleur hoort bij de positie). Hernoem je een label, dan verliezen kaarten met de oude naam hun kleur (grijs) tot je ze opnieuw labelt. In de sheet: kolom M `label` op tab Persoonlijk.

### 7. Processen & busfactor
De tab **Processen** bevat alle basisprocessen uit het Office Handboek (tab Processen in de sheet, 67 regels vooraf ingevuld, met link naar het procesdocument) en alles wat je zelf toevoegt. Per proces vink je op de kaart aan wie het kan uitvoeren, per label (4M, 4Family, Arise, Muskathlon, LIFE, Common Ground). Een kernproces is gedekt als elk label door minimaal twee mensen gedaan kan worden (busfactor ≥ 2). Het percentage gedekte kernprocessen wordt automatisch in de huidige maand van KPI #8 "% kernprocessen met bus-factor ≥ 2" gezet, zodra er iets aan een proces wijzigt. In de sheet staat "wie kan uitvoeren" leesbaar als `Naam: alle; Naam: 4M, Arise`. De labels zelf staan in Instellingen → `procLabels` (komma-gescheiden; ook via de knop **Labels** op de tab). Een label hernoemen: pas daarna ook de kolommen Labels en Wie kan uitvoeren op tab Processen aan (zoeken/vervangen), anders herkent de site de oude naam niet meer.

## 8. Team Marketing (zelfde site, eigen datasheet)

Sinds versie 21 staat in de repo ook `marketing/index.html`: dezelfde site, gebouwd voor Team Marketing. De workflow publiceert hem op **…/ops-woensdag/marketing/**. Verschillen met de OPS-versie: geen tabs Processen en Klantenservice, thema 3 heet *Marketingprojecten*, de Week-tab heeft geen belvenster, en de weekendkaarten tonen **aanmeldingen** (uit het Weekendbord) in plaats van productiesheet-voortgang, met een knop naar het Weekendbord. Inloggen, persoonlijke omgeving, OKR's, acties, besluiten, planning, agenda en team werken hetzelfde. De meetingdag staat in Instellingen (`meetingDag`: ma … vr) en bepaalt de titel en de planning.

**Eén Apps Script voor beide teams (Code.gs v9).** De site stuurt `team` mee; `ops` leest de sheet waar het script aan hangt, `marketing` de sheet uit scripteigenschap `SHEET_MARKETING`. Inrichten:
1. Plak de nieuwe `Code.gs` in Apps Script (sheet Team Operations Woensdag (data)) en sla op.
2. Herlaad de sheet → menu **OPS site → Marketing: datasheet koppelen** → plak de URL of het ID van "Team Marketing (data)".
3. **OPS site → Marketing: opmaak en keuzelijsten toepassen** (kolombreedtes, keuzelijsten, kleuren), daarna **Marketing: test lees alles**.
4. Implementeren → Implementaties beheren → potlood → Versie: nieuw → Implementeren. De URL blijft gelijk; dezelfde `API_URL` en `CLIENT_ID` gelden voor beide sites (zelfde domein op GitHub Pages).
5. Voeg `marketing/index.html` toe aan de repo (plus de bijgewerkte `index.html`, `Code.gs` en `.github/workflows/deploy.yml`) en push.

**Aanmeldingen uit het Weekendbord.** De API-op `aanmeldingen` haalt `aanmeldingenUrl` uit Instellingen op (UrlFetchApp, cache 10 minuten) en verwacht JSON: `{"peildatum":"2026-11-09","weekenden":[{"naam":"KW Schotland","label":"4M","start":"2027-04-15","aanmeldingen":52,"zonderAnnulering":52,"doel":180,"ondergrens":100,"historie":55,"weken":22,"trend":-5,"status":"op tempo"}]}`. Alleen aantallen per campagne, geen persoonsgegevens. De site koppelt op naam (jaartal en seizoen worden genegeerd) en label of startdatum; campagnes zonder kaart staan onderaan met **+ Toevoegen**. Zolang het Weekendbord-script bij `?format=json` nog de HTML-pagina teruggeeft, meldt de site "Weekendbord niet gelezen: geen JSON". Voeg in dat script aan `doGet(e)` toe:

```js
if (e && e.parameter && e.parameter.format === 'json') {
  const data = /* het object dat de pagina nu via google.script.run ophaalt */;
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
```
Ook de OPS-site toont die aanmeldingen op de weekendkaarten zodra `aanmeldingenUrl` in de OPS-Instellingen staat.

## Wijzigingen later

- **Site aanpassen:** bewerk `index.html` (en `marketing/index.html`: beide komen uit dezelfde bron, alleen `TEAM_KEY` verschilt), push naar `main`; de workflow publiceert automatisch.
- **Script aanpassen:** plak de nieuwe `Code.gs` in Apps Script en maak een **nieuwe versie** van de implementatie (Implementeren → Implementaties beheren → potlood → Versie: Nieuw). De URL blijft gelijk. Zonder nieuwe versie draait de oude code door: de site toont dan een gele balk "Apps Script verouderd" en nieuwe tabs (zoals Processen) blijven leeg. Gebruikt de nieuwe code een extra Google-dienst (zoals Agenda), draai dan eerst een testfunctie uit het menu om de rechten te accepteren.
- **Nieuwe kolom:** voeg hem toe in `SPEC` in `Code.gs` (en in de sheet rij 1 = label, rij 2 = veldnaam). De site negeert velden die hij niet kent.

## Spelregels in de sheet

- Rij 1 = kolomnaam, rij 2 = veldnaam voor de koppeling. Rij 2 en kolom A (ID) niet wijzigen.
- Nieuwe rijen liefst via de site; in de sheet zelf: unieke ID in kolom A.
- Datums als `jjjj-mm-dd` of via de datumkiezer. Percentages bij key results als fractie (`0,95`).
- Tab **Instellingen**: huidig kwartaal, jaar, ID van het OPS Dashboard-sheet, werkafspraken.

## Privacy

De sheet bevat alleen teamwerk (OKR's, acties, besluiten, planning, processen), namen en werk-e-mailadressen van teamleden. Agenda's worden live gelezen en niet opgeslagen. Geen deelnemers-, crew- of donateursgegevens.
