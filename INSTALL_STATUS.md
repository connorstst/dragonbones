# Editor-Installation

## Status

DragonBones Pro ist auf diesem Rechner noch nicht installiert.

## Gewaehlte Editorversion

**DragonBones Pro 5.6.3 fuer Windows.** Das ist die letzte verbreitete Editorversion; DragonBones wird nicht mehr aktiv gepflegt. Der Editor exportiert die JSON-/PNG-Artefakte, die im Projektgeruest vorgesehen sind.

## Sicherheitspruefung vor der Installation

Der Editorinstaller soll nur aus einer nachvollziehbaren Quelle bezogen und vor dem Ausfuehren geprueft werden. Eine in mehreren Projektdokumentationen referenzierte Pruefsumme fuer `DragonBonesPro-v5.6.3.exe` lautet:

```
SHA-256: 593053196DA93BBE9822E2923145F800AFEFEA3DA00E6E9E174FECE0AAF8C796
```

Nach der Installation wird der erwartete Programmpfad geprueft:

```
C:\Program Files\Egret\DragonBonesPro\DragonBonesPro.exe
```

## Danach

1. Ein Test-Symbol wird als separierte PNG-Ebenen importiert.
2. Wir legen `idle` und `win` an.
3. Wir exportieren Skeleton, Atlas und Textur nach `03_exports/`.
4. Erst danach verbinden wir das Format mit deiner konkreten Spielengine.
