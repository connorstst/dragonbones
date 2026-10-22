# DragonBones-Slots-Starter

Dieses Verzeichnis ist die gemeinsame Produktionsbasis fuer deine Slot-Animationen.

## Ordner

- `01_source/` – einzelne, transparente PNG-Ebenen (der unveraenderte Master).
- `02_dragonbones/` – DragonBones-Projektdateien (`.dbproj`) und Arbeitsstaende.
- `03_exports/` – nur exportierte Laufzeitdateien: Skelett-JSON, Texture-Atlas-JSON und PNG-Atlas.
- `04_previews/` – MP4/GIF/PNG-Sequenzen fuer schnelle Abnahme.
- `05_briefs/` – dein Briefing pro Figur, Symbol oder Effekt.
- `99_archive/` – eingefrorene freigegebene Versionen.

## Arbeitsablauf mit mir

1. Du schreibst z. B.: `Erstelle ein Wild-Symbol: goldener Tiger, 5x3-Slot, Idle + Win, Stil ...`.
2. Ich erstelle daraus ein Produktionsbriefing, Layerliste, Pivot-/Bone-Plan und auf Wunsch die Quellillustrationen.
3. Du legst die gelieferten Ebenen in `01_source/<asset-id>/` ab oder gibst mir vorhandene Assets.
4. Ich fuehre dich beim Aufbau im DragonBones-Editor, kontrolliere die Struktur und erstelle Export-/Integrationsvorgaben.
5. Nach deiner Freigabe kommt genau eine Exportversion in `03_exports/<asset-id>/v001/`.

## Regeln fuer Slot-Assets

- Jede Ebene ist ein transparentes PNG, RGB/RGBA, ohne eingebrannten Hintergrund.
- Dateinamen nur mit `a-z`, `0-9`, `_`; keine Leerzeichen, Umlaute oder Sonderzeichen.
- Basisgroesse dokumentieren; Skalierung erfolgt im Spiel, nicht durch stilles Nachbearbeiten des Masters.
- Halte Symbol, FX und UI getrennt. Ein Symbol soll auch ohne Partikel lesbar sein.
- Der Registrationspunkt liegt bei Symbols in der Mitte unten, bei Figuren auf der Standflaeche zwischen den Fuessen.
- Keine Lizenz-/Marken-Assets ohne ausdrueckliche Nutzungsrechte in den Master-Ordner legen.

## Empfohlene Animationen

| Assettyp | Minimum | Optional |
|---|---|---|
| Basissymbol | `idle`, `win` | `anticipation`, `transform`, `scatter_land` |
| Wild-Symbol | `idle`, `win` | `expand`, `substitute`, `multiplier` |
| Figur/Mascot | `idle`, `win`, `lose` | `intro`, `celebrate`, `talk`, `react` |
| Feature-Symbol | `idle`, `trigger` | `collect`, `upgrade`, `retrigger` |

## Versionierung

`<asset-id>_v001` ist ein neuer Export. Wenn sich Skeleton, Atlas oder Bounding Box aendert, wird die Versionsnummer immer erhoeht.

## Aktueller Stand

Projektgeruest angelegt. DragonBones Pro selbst muss noch installiert und gegen das Zielruntime getestet werden.

## GitHub-Ablauf

Das Projektverzeichnis ist für Git vorgesehen: Quelldateien, `.dbproj`, Exporte, Briefings und freigegebene Vorschauen werden versioniert. Große Zwischenstände und Cache-Dateien bleiben draußen. LoongBones ist der aktuelle DragonBones-kompatible Online-Editor; seine Bedienungsanleitung liegt im offiziellen DragonBones-GitHub unter `DragonBones/Loongbones-doc`. Die Editor-Webseite ist `https://www.loongbones.app/`. Nach dem Bearbeiten exportierst du das Projekt/JSON und Atlas, speicherst die Dateien hier und committest sie in dein GitHub-Repository.
