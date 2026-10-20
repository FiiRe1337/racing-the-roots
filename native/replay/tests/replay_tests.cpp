// Unit-Tests ohne externe Abhaengigkeiten.
#include <cstdio>
#include <cstdlib>
#include <functional>
#include <string>
#include <vector>

#include "roots/replay/determinism.hpp"
#include "roots/replay/format.hpp"
#include "roots/replay/recorder.hpp"

using namespace roots::replay;

static int g_failures = 0;
#define CHECK(cond)                                                     \
  do {                                                                  \
    if (!(cond)) {                                                      \
      std::printf("  FEHLER %s:%d: %s\n", __FILE__, __LINE__, #cond);   \
      ++g_failures;                                                     \
    }                                                                   \
  } while (0)

// Deterministischer Pseudo-Zufall fuer Testeingaben (kein std::rand).
struct SplitMix {
  std::uint64_t s;
  std::uint64_t next() {
    std::uint64_t z = (s += 0x9E3779B97F4A7C15ull);
    z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ull;
    z = (z ^ (z >> 27)) * 0x94D049BB133111EBull;
    return z ^ (z >> 31);
  }
};

// Erzeugt eine realistische Runde: Eingaben aendern sich nur alle paar Ticks.
static Replay make_lap(std::uint32_t ticks, std::uint64_t seed) {
  Header h;
  h.tick_hz = 360;
  h.seed = seed;
  h.physics_build = 0xABCDEF0123456789ull;
  h.car_id = "nissan_r34_gtr";
  h.track_id = "test_oval_v0";
  Recorder rec(h);
  SplitMix rng{seed};
  InputFrame f;
  for (std::uint32_t t = 0; t < ticks; ++t) {
    if (rng.next() % 6 == 0) f.steer = static_cast<std::int16_t>(static_cast<int>(rng.next() % 65535) - 32767);
    if (rng.next() % 12 == 0) f.throttle = static_cast<std::uint16_t>(rng.next());
    if (rng.next() % 30 == 0) f.brake = static_cast<std::uint16_t>(rng.next());
    if (rng.next() % 900 == 0) f.gear = static_cast<std::int8_t>(1 + rng.next() % 6);
    rec.push(f);
  }
  Replay r = rec.replay();
  r.header.tick_count = ticks;
  return r;
}

// Spielzeug-Simulation mit reiner Ganzzahl-Mathematik, steht fuer Devphys Bibliothek.
struct ToySim {
  std::int64_t x = 0, v = 0, heading = 0;
  std::uint64_t rng = 0;
  std::function<void(ToySim&, std::uint32_t)> fault;  // optionaler Fehler fuer Tests
  std::uint32_t tick = 0;
  void reset(const Header& h) { x = v = heading = 0; rng = h.seed; tick = 0; }
  void step(const InputFrame& in) {
    v += (in.throttle >> 6) - (in.brake >> 5) - v / 64;
    heading += in.steer / 256;
    rng = rng * 6364136223846793005ull + 1442695040888963407ull;  // Seed-abhaengiges "Rauschen"
    x += v + static_cast<std::int64_t>(rng >> 60);
    if (fault) fault(*this, tick);
    ++tick;
  }
  std::uint64_t state_hash() const {
    std::uint64_t h = 1469598103934665603ull;  // FNV-1a
    for (std::int64_t val : {x, v, heading, static_cast<std::int64_t>(rng)}) {
      for (int i = 0; i < 8; ++i) {
        h ^= static_cast<std::uint8_t>(static_cast<std::uint64_t>(val) >> (8 * i));
        h *= 1099511628211ull;
      }
    }
    return h;
  }
};

static std::uint64_t run_final_hash(const Replay& r) {
  ToySim sim;
  sim.reset(r.header);
  for (const auto& f : r.frames) sim.step(f);
  return sim.state_hash();
}

static void test_roundtrip() {
  Replay r = make_lap(360 * 90, 42);  // 90 Sekunden bei 360 Hz
  r.header.final_state_hash = run_final_hash(r);
  Error err;
  auto bytes = encode(r, &err);
  CHECK(err == Error::None);
  auto res = decode(bytes);
  CHECK(res.error == Error::None);
  CHECK(res.replay.header == r.header);
  CHECK(res.replay.frames == r.frames);
  const double raw = static_cast<double>(r.frames.size() * sizeof(InputFrame));
  std::printf("  90 s Runde: %zu Bytes statt %.0f Bytes roh (%.1f%%)\n", bytes.size(), raw,
              100.0 * static_cast<double>(bytes.size()) / raw);
  CHECK(bytes.size() < r.frames.size() * sizeof(InputFrame) / 4);
}

static void test_edge_cases() {
  // Leere Runde
  Replay empty;
  auto b = encode(empty);
  auto res = decode(b);
  CHECK(res.error == Error::None && res.replay.frames.empty());

  // Konstante Eingabe ab Tick 0, Aenderung erst am letzten Tick
  Replay r;
  r.frames.assign(1000, InputFrame{});
  r.frames.back().throttle = 65535;
  r.header.tick_count = 1000;
  res = decode(encode(r));
  CHECK(res.error == Error::None && res.replay.frames == r.frames);

  // Extremwerte
  Replay x;
  InputFrame f{-32767, 65535, 65535, 65535, -1, 0xff};
  x.frames = {f, InputFrame{}, f};
  x.header.tick_count = 3;
  res = decode(encode(x));
  CHECK(res.error == Error::None && res.replay.frames == x.frames);

  // Tick-Anzahl passt nicht zu den Frames
  Replay bad = r;
  bad.header.tick_count = 5;
  Error err;
  CHECK(encode(bad, &err).empty() && err == Error::TickCountMismatch);

  // Zu lange ID
  Replay longid;
  longid.header.car_id.assign(300, 'a');
  CHECK(encode(longid, &err).empty() && err == Error::FieldTooLong);
}

static void test_corruption() {
  Replay r = make_lap(5000, 7);
  auto bytes = encode(r);
  CHECK(decode(bytes.data(), 10).error == Error::TooShort);

  auto flipped = bytes;
  flipped[flipped.size() / 2] ^= 0x01;
  CHECK(decode(flipped).error == Error::BadChecksum);

  auto magic = bytes;
  magic[0] ^= 0xff;
  CHECK(decode(magic).error == Error::BadMagic);

  // Andere Version mit korrekter CRC
  auto ver = bytes;
  ver[4] = 99;
  const std::uint32_t c = crc32(ver.data(), ver.size() - 4);
  for (int i = 0; i < 4; ++i) ver[ver.size() - 4 + i] = static_cast<std::uint8_t>(c >> (8 * i));
  CHECK(decode(ver).error == Error::UnsupportedVersion);

  // Abgeschnitten mit neu berechneter CRC: darf nicht abstuerzen
  for (std::size_t cut = 40; cut < bytes.size(); cut += 97) {
    std::vector<std::uint8_t> t(bytes.begin(), bytes.begin() + static_cast<long>(cut));
    const std::uint32_t cc = crc32(t.data(), t.size());
    for (int i = 0; i < 4; ++i) t.push_back(static_cast<std::uint8_t>(cc >> (8 * i)));
    CHECK(decode(t).error != Error::None);
  }
}

static void test_player() {
  Replay r = make_lap(1234, 3);
  Player p(r);
  std::uint32_t n = 0;
  while (!p.done()) {
    CHECK(p.next() == r.frames[n]);
    ++n;
  }
  CHECK(n == 1234);
  p.rewind();
  CHECK(p.tick() == 0 && !p.done());
}

static void test_determinism_ok() {
  Replay r = make_lap(360 * 60, 11);
  r.header.final_state_hash = run_final_hash(r);
  auto rep = check_determinism(r, [](int) { return ToySim{}; }, 4);
  CHECK(rep.ok);
}

static void test_determinism_detects_divergence() {
  Replay r = make_lap(360 * 60, 11);
  r.header.final_state_hash = run_final_hash(r);
  // Lauf 2 weicht ab Tick 5000 minimal ab, z. B. durch andere float-Rundung.
  auto rep = check_determinism(
      r,
      [](int run) {
        ToySim s;
        if (run == 2) s.fault = [](ToySim& sim, std::uint32_t t) { if (t == 5000) sim.x += 1; };
        return s;
      },
      4);
  CHECK(!rep.ok);
  CHECK(rep.failing_run == 2);
  CHECK(rep.first_bad_tick.has_value() && *rep.first_bad_tick == 5000);
}

static void test_final_hash_mismatch() {
  Replay r = make_lap(2000, 5);
  r.header.final_state_hash = 0x1234;  // z. B. Replay einer anderen Physik-Version
  auto rep = check_determinism(r, [](int) { return ToySim{}; }, 2);
  CHECK(!rep.ok && rep.final_hash_mismatch);
}

static void test_seed_matters() {
  Replay a = make_lap(3000, 1);
  Replay b = a;
  b.header.seed = 2;
  CHECK(run_final_hash(a) != run_final_hash(b));
}

int main() {
  struct T { const char* name; void (*fn)(); };
  const T tests[] = {
      {"roundtrip", test_roundtrip},
      {"edge_cases", test_edge_cases},
      {"corruption", test_corruption},
      {"player", test_player},
      {"determinism_ok", test_determinism_ok},
      {"determinism_detects_divergence", test_determinism_detects_divergence},
      {"final_hash_mismatch", test_final_hash_mismatch},
      {"seed_matters", test_seed_matters},
  };
  for (const auto& t : tests) {
    std::printf("[ RUN  ] %s\n", t.name);
    const int before = g_failures;
    t.fn();
    std::printf("[ %s ] %s\n", g_failures == before ? " OK " : "FAIL", t.name);
  }
  std::printf("%s (%d Fehler)\n", g_failures ? "FEHLGESCHLAGEN" : "ALLE TESTS OK", g_failures);
  return g_failures ? EXIT_FAILURE : EXIT_SUCCESS;
}
