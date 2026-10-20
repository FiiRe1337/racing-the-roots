# roots-replay

Engine-unabhängige C++20-Bibliothek für Replays aus Eingaben plus Seed (Meilenstein 1, Devend).
Dient als Determinismus-Test für Devphys Fahrphysik und später als Grundlage für Ghosts und prüfbare Bestzeiten.

## Bauen und testen

```
flock /workspace/.heavy.lock cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
flock /workspace/.heavy.lock cmake --build build -j2
ctest --test-dir build --output-on-failure
```

## Format v1 (little-endian)

| Feld | Typ |
|---|---|
| Magic `RTRP` | u32 |
| Formatversion | u16 |
| Physiktakt (Hz) | u16 |
| Seed | u64 |
| Physik-Build-Hash | u64 |
| Auto-ID, Strecken-ID | je u8 Länge + Bytes |
| Tick-Anzahl | u32 |
| Zustands-Hash nach letztem Tick | u64 |
| Anzahl Einträge | u32 |
| Einträge | varint Ticks seit letztem Eintrag, u8 Feldmaske, nur geänderte Felder |
| CRC32 | u32 über alles davor |

Eingaben sind quantisierte Ganzzahlen (Lenkung i16, Gas, Bremse, Kupplung je u16, Gang i8, Tasten u8),
damit die Aufzeichnung selbst bitgenau ist. Eine 90-Sekunden-Testrunde bei 360 Hz mit häufigen
Eingabeänderungen braucht rund 35 KB statt 324 KB roh.

## Determinismus-Test

`check_determinism(replay, make_sim, runs)` spielt ein Replay mehrfach ab, vergleicht den Zustands-Hash
nach jedem Tick und meldet den ersten abweichenden Tick und Lauf. Zusätzlich wird der Hash im Header geprüft.
Die Simulation muss nur `reset(Header)`, `step(InputFrame)` und `state_hash()` anbieten.

## Offen mit Devphy

- Eingabe-Struct: Felder, Wertebereiche und Quantisierung (z. B. Lenkrad mit 16 Bit oder mehr, Schaltwippen als Tasten oder Gang).
- Was in `state_hash()` einfließt (Karosserie, Räder, Antrieb, Reifentemperaturen) und wie gerundet wird.
- Wie `physics_build` entsteht, damit alte Replays nach Tuning-Änderungen erkannt werden.
- Gleitkomma-Regeln für bitgleiche Ergebnisse über Compiler und Optimierungsstufen (kein `-ffast-math`, FMA-Kontraktion aus, feste Reihenfolge).
