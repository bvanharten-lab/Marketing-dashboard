# Team Marketing

Meetingpagina van Team Marketing (Coalition58): OKR's met key results en acties, lopende weekenden en reizen met aanmeldingen uit het Weekendbord, marketingprojecten, brainstorm, acties, besluiten, agenda en planning, plus een persoonlijke omgeving per teamlid. Zelfde opzet als de site van Team Operations, maar volledig los: eigen datasheet, eigen Apps Script, eigen repo.

- **Site:** https://bvanharten-lab.github.io/team-marketing/ (of de naam die je deze repo geeft)
- **Data:** Google Sheet "Team Marketing (data)". De site leest en schrijft daarin via een Apps Script-web-app; wat op de site gebeurt staat direct in de sheet en andersom.
- **Toegang:** inloggen met een Google-account van `4m.nl` of `de4emusketier.nl` (lijst op twee plekken: `CONFIG.domains` in `index.html` en de scriptproperty DOMAIN, te zetten via het menu).

## Hoe het werkt

```
browser (GitHub Pages: index.html)
   │  POST + Google ID-token
   ▼
Apps Script web-app (Code.gs, gebonden aan de Marketing-datasheet, draait als Bart)
   │  verifieert token bij Google (client-ID + domein)
   ▼
Google Sheet "Team Marketing (data)"   ←  leest ook het Weekendbord (aanmeldingen per weekend, JSON)
```

## Eenmalige installatie (±15 minuten)

### 1. Apps Script in de datasheet
1. Open de sheet **Team Marketing (data)** → **Extensies → Apps Script**.
2. Vervang de inhoud van `Code.gs` door het bestand `Code.gs` uit deze repo. Opslaan.
3. Herlaad de sheet. Er staat nu een menu **Marketing site**.

### 2. OAuth client-ID
De bestaande client-ID van de OPS-site werkt ook hier: GitHub Pages draait voor beide repo's op `https://bvanharten-lab.github.io`, en dat is de geautoriseerde JavaScript-origin. Een nieuwe aanmaken hoeft dus niet. Wil je ze toch gescheiden houden: Google Cloud → APIs & Services → Credentials → OAuth client ID (Web application) met origin `https://bvanharten-lab.github.io`.

### 3. Script instellen en publiceren
1. In de sheet: menu **Marketing site → Instellen**, plak de client-ID, domeinen `4m.nl, de4emusketier.nl`. Dit zet ook de opmaak en keuzelijsten van alle tabbladen (kolombreedtes, keuzelijsten, kleuren).
2. In Apps Script: **Implementeren → Nieuwe implementatie** → type **Web-app**, uitvoeren als **Ik**, toegang **Iedereen** (de toegang wordt door het ID-token afgedwongen). Implementeren → autoriseren → kopieer de **web-app-URL** (eindigt op `/exec`).
3. Menu **Marketing site → Test: lees alles** moet alle tabs met rijen tonen.

### 4. GitHub koppelen
1. Maak een nieuwe repo (bijv. `team-marketing`) en zet deze bestanden erin: `index.html`, `Code.gs`, `.github/workflows/deploy.yml`, `.nojekyll`, `README.md`.
2. **Settings → Pages**: Source = GitHub Actions.
3. **Settings → Secrets and variables → Actions → Variables**: `API_URL` = web-app-URL uit stap 3, `CLIENT_ID` = client-ID uit stap 2.
4. **Actions → Deploy naar GitHub Pages → Run workflow** (of push). Na een minuut staat de site live.
5. Zet de definitieve URL in de sheet: Instellingen → `siteUrl`.

### 5. Testen
Open de site, log in met je 4m.nl-account, zet een actie op "Bezig" en kijk in de sheet (tab Acties).

### 6. Week-tab en persoonlijke omgeving
Tab **Team** in de sheet: vul kolom **E-mail (agenda)** met het werkadres van elk teamlid. Daarmee werkt de Week-tab (agenda's ma–vr) en herkent de site wie is ingelogd voor de persoonlijke omgeving (Vandaag, Mijn taken, Mijn projecten, Mijn agenda, Ideeën & notities). Draai eenmalig **Marketing site → Test: agenda van het team** om de agenda-rechten te accepteren en publiceer daarna een nieuwe versie van de web-app.

### 7. Aanmeldingen uit het Weekendbord
De weekendkaarten tonen aanmeldingen tegenover het doel, weken te gaan en het tempo ten opzichte van vorige edities. Bron: Instellingen → `aanmeldingenUrl` (de exec-URL van het Weekendbord met `?format=json`); de knop **Weekendbord** op elke kaart gebruikt `weekendbordUrl`. Het script haalt de JSON op (cache 10 minuten) en verwacht:

```json
{"peildatum":"2026-11-09","weekenden":[{"naam":"KW Schotland","label":"4M","start":"2027-04-15","aanmeldingen":52,"zonderAnnulering":52,"doel":180,"ondergrens":100,"historie":55,"weken":22,"trend":-5,"status":"op tempo"}]}
```

Alleen aantallen per campagne, geen persoonsgegevens. De site koppelt op naam (jaartal en seizoen worden genegeerd) en label of startdatum; campagnes zonder kaart staan onderaan met **+ Toevoegen**. Zolang het Weekendbord-script bij `?format=json` nog de HTML-pagina teruggeeft, meldt de site "Weekendbord niet gelezen: geen JSON". Voeg dan in dat script aan `doGet(e)` toe:

```js
if (e && e.parameter && e.parameter.format === 'json') {
  const data = /* het object dat de pagina nu via google.script.run ophaalt */;
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
```
Controleer met **Marketing site → Test: aanmeldingen**.

## Instellingen (tab Instellingen)
`kwartaal`, `jaar`, `meetingDag` (ma … vr; bepaalt de titel van de site en de planning), `werkafspraken` (één per regel), `siteUrl`, `aanmeldingenUrl`, `weekendbordUrl`, `todoLabels` (prioriteitslabels persoonlijk bord, max 6). Ook via de knop **Instellingen** op de site.

## Wijzigingen later
- **Site aanpassen:** bewerk `index.html`, push naar `main`; de workflow publiceert automatisch.
- **Script aanpassen:** plak de nieuwe `Code.gs` en maak een **nieuwe versie** van de implementatie (Implementeren → Implementaties beheren → potlood → Versie: Nieuw). Zonder nieuwe versie draait de oude code door; de site toont dan een gele balk "Apps Script verouderd".
- **Nieuwe kolom:** voeg hem toe in `SPEC` in `Code.gs` en in de sheet (rij 1 = label, rij 2 = veldnaam). De site negeert velden die hij niet kent.

## Spelregels in de sheet
- Rij 1 = kolomnaam, rij 2 = veldnaam voor de koppeling. Rij 2 en kolom A (ID) niet wijzigen.
- Nieuwe rijen liefst via de site; in de sheet zelf: unieke ID in kolom A.
- Datums als `jjjj-mm-dd` of via de datumkiezer.

## Privacy
De sheet bevat alleen teamwerk (OKR's, acties, besluiten, planning), namen en werk-e-mailadressen van teamleden en campagnecijfers (aantallen). Agenda's worden live gelezen en niet opgeslagen. Geen deelnemers-, crew- of donateursgegevens.
