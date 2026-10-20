#pragma once
// Replay-Format v1 fuer Racing the Roots (engine-unabhaengig, C++20).
// Ein Replay = Header + Eingaben pro Physik-Tick. Gespeichert werden nur
// Ticks, an denen sich die Eingabe aendert. Am Ende steht eine CRC32.
#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace roots::replay {

inline constexpr std::uint32_t kMagic = 0x50525452u;  // "RTRP" (little-endian)
inline constexpr std::uint16_t kFormatVersion = 1;

// VORLAEUFIG: muss mit Devphys Eingabe-Struct abgestimmt werden.
// Bewusst quantisierte Ganzzahlen statt float, damit die Aufzeichnung selbst
// bitgenau ist und nicht vom Compiler oder der Plattform abhaengt.
struct InputFrame {
  std::int16_t steer = 0;      // -32767 (voll links) .. 32767 (voll rechts)
  std::uint16_t throttle = 0;  // 0 .. 65535
  std::uint16_t brake = 0;     // 0 .. 65535
  std::uint16_t clutch = 0;    // 0 .. 65535
  std::int8_t gear = 0;        // -1 = R, 0 = N, 1..n
  std::uint8_t buttons = 0;    // Bit 0 = Handbremse, Rest reserviert
  bool operator==(const InputFrame&) const = default;
};

struct Header {
  std::uint16_t tick_hz = 360;          // fester Physiktakt
  std::uint64_t seed = 0;               // Seed fuer alles Zufaellige in der Simulation
  std::uint64_t physics_build = 0;      // Hash aus Physik-Version + Tuning-Daten
  std::string car_id;                   // max. 255 Bytes
  std::string track_id;                 // max. 255 Bytes
  std::uint32_t tick_count = 0;         // Anzahl Ticks der Runde
  std::uint64_t final_state_hash = 0;   // Zustands-Hash nach dem letzten Tick
  bool operator==(const Header&) const = default;
};

struct Replay {
  Header header;
  std::vector<InputFrame> frames;  // genau ein Eintrag pro Tick
};

enum class Error {
  None,
  TooShort,
  BadMagic,
  UnsupportedVersion,
  BadChecksum,
  Malformed,
  TickCountMismatch,
  FieldTooLong,
};

const char* to_string(Error e);

// Kodiert ein Replay. Liefert leeren Vektor und setzt err bei ungueltigen Daten.
std::vector<std::uint8_t> encode(const Replay& replay, Error* err = nullptr);

struct DecodeResult {
  Error error = Error::None;
  Replay replay;
};

DecodeResult decode(const std::uint8_t* data, std::size_t size);
inline DecodeResult decode(const std::vector<std::uint8_t>& bytes) {
  return decode(bytes.data(), bytes.size());
}

std::uint32_t crc32(const std::uint8_t* data, std::size_t size);

}  // namespace roots::replay
