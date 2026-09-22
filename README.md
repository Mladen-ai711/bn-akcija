# BN akcija

Web verzija aplikacije. Otvara se na telefonu i računaru kroz preglednik. Javna probna verzija: https://mladen-ai711.github.io/bn-akcija/.

## Šta radi

- Naslovna sa izborom Marketi, Mesare i Apoteke
- Po tri početna objekta u svakoj kategoriji
- Tri dnevne i deset sedmičnih primjernih proizvoda po objektu
- Pretraga objekata i proizvoda
- Čuvanje ponuda na istom uređaju
- Kratki uvodni ekran sa logom i sloganom

Sve cijene u početnoj verziji su izmišljeni primjeri i tako su označene u aplikaciji.

## Pokretanje na računaru

U fascikli `dist` pokrenite lokalni web server. Ako imate Python:

```powershell
python -m http.server 8765 --directory dist
```

Zatim otvorite `http://127.0.0.1:8765/`.

Za pristup s telefona otvorite javni link. Lokalna adresa 127.0.0.1 radi samo na računaru na kojem je pokrenut server.

## Google Sheet

U `dist/config.js` nalazi se polje `sheetCsvUrl`. Kada Google Sheet bude spreman, izvezite ga kao CSV, sačuvajte u `dist/offers.csv` i upišite `./offers.csv` u to polje. Tako svi podaci ostaju među fajlovima aplikacije. Može se koristiti i direktan javni CSV URL ako izvor dopušta učitavanje iz preglednika. Kolone su navedene u `sheet-template.csv`.

Obavezne kolone: `category, store, period, product, unit, price, valid_until`. Opcionalna kolona: `old_price`.

- `category`: `market`, `mesara` ili `apoteka`
- `period`: `daily` ili `weekly`
- `price` i `old_price`: npr. `1,65` ili `1.65`
- `valid_until`: tekst datuma koji će biti prikazan korisnicima

Novi naziv u koloni `store` automatski dodaje objekat. Uklanjanjem svih njegovih redova objekat nestaje. Aplikacija prikazuje najviše tri dnevna i deset sedmičnih proizvoda po objektu, prema redoslijedu u tabeli. Ako učitavanje ne uspije, prikazaće jasno označene primjere i poruku o grešci.

Javno objavljen CSV može čitati svako ko ima njegov link. Za privatni Sheet trebaće server koji pristupa podacima uz dozvolu; to ćemo dodati kada pošaljete stvarnu tabelu. Ne unosite interne ili osjetljive podatke u javni list.

## Fajlovi

- `dist/index.html` — početna datoteka
- `dist/styles.css` — izgled
- `dist/app.js` — navigacija, ponude, pretraga i čuvanje
- `dist/config.js` — adresa Google Sheeta
- `dist/assets/` — odabrane Higgsfield ilustracije

Aplikacija je bez dodatnih biblioteka i može se prenijeti na standardni statički web hosting.



## Objava preko GitHub Pages

Repozitorij sadrži automatsku objavu datoteka iz `dist` na GitHub Pages nakon slanja promjena na granu `main`. U postavkama repozitorija, pod **Pages → Build and deployment**, izaberite **GitHub Actions** kao izvor. Javni link: `https://mladen-ai711.github.io/bn-akcija/`.

Dok je `sheetCsvUrl` prazan, javna stranica prikazuje isključivo jasno označene primjerne cijene. Prije korištenja sa stvarnim akcijama povežite i provjerite stvarne podatke. Svaki CSV objavljen kroz `dist` biće javno dostupan.

