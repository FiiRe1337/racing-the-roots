#include "roots/replay/format.hpp"

#include <array>

namespace roots::replay {
namespace {

// Feld-Bits fuer die Aenderungsmaske eines Eintrags.
enum : std::uint8_t {
  kSteer = 1u << 0,
  kThrottle = 1u << 1,
  kBrake = 1u << 2,
  kClutch = 1u << 3,
  kGear = 1u << 4,
  kButtons = 1u << 5,
  kAllFields = 0x3f,
};

class Writer {
 public:
  void u8(std::uint8_t v) { buf_.push_back(v); }
  void u16(std::uint16_t v) { le(v, 2); }
  void u32(std::uint32_t v) { le(v, 4); }
  void u64(std::uint64_t v) { le(v, 8); }
  void varint(std::uint32_t v) {
    while (v >= 0x80) {
      buf_.push_back(static_cast<std::uint8_t>(v | 0x80));
      v >>= 7;
    }
    buf_.push_back(static_cast<std::uint8_t>(v));
  }
  void str(const std::string& s) {
    u8(static_cast<std::uint8_t>(s.size()));
    buf_.insert(buf_.end(), s.begin(), s.end());
  }
  std::vector<std::uint8_t>& bytes() { return buf_; }

 private:
  void le(std::uint64_t v, int n) {
    for (int i = 0; i < n; ++i) buf_.push_back(static_cast<std::uint8_t>(v >> (8 * i)));
  }
  std::vector<std::uint8_t> buf_;
};

class Reader {
 public:
  Reader(const std::uint8_t* p, std::size_t n) : p_(p), n_(n) {}
  bool ok() const { return ok_; }
  std::size_t remaining() const { return n_ - pos_; }
  std::uint8_t u8() { return static_cast<std::uint8_t>(le(1)); }
  std::uint16_t u16() { return static_cast<std::uint16_t>(le(2)); }
  std::uint32_t u32() { return static_cast<std::uint32_t>(le(4)); }
  std::uint64_t u64() { return le(8); }
  std::uint32_t varint() {
    std::uint32_t v = 0;
    for (int shift = 0; shift < 35; shift += 7) {
      if (!need(1)) return 0;
      const std::uint8_t b = p_[pos_++];
      if (shift == 28 && (b & 0xf0)) break;  // ueberlaeuft 32 Bit
      v |= static_cast<std::uint32_t>(b & 0x7f) << shift;
      if (!(b & 0x80)) return v;
    }
    ok_ = false;
    return 0;
  }
  std::string str() {
    const std::uint8_t len = u8();
    if (!need(len)) return {};
    std::string s(reinterpret_cast<const char*>(p_ + pos_), len);
    pos_ += len;
    return s;
  }

 private:
  bool need(std::size_t k) {
    if (!ok_ || remaining() < k) ok_ = false;
    return ok_;
  }
  std::uint64_t le(int k) {
    if (!need(static_cast<std::size_t>(k))) return 0;
    std::uint64_t v = 0;
    for (int i = 0; i < k; ++i) v |= static_cast<std::uint64_t>(p_[pos_ + i]) << (8 * i);
    pos_ += static_cast<std::size_t>(k);
    return v;
  }
  const std::uint8_t* p_;
  std::size_t n_;
  std::size_t pos_ = 0;
  bool ok_ = true;
};

std::uint8_t diff_mask(const InputFrame& a, const InputFrame& b) {
  std::uint8_t m = 0;
  if (a.steer != b.steer) m |= kSteer;
  if (a.throttle != b.throttle) m |= kThrottle;
  if (a.brake != b.brake) m |= kBrake;
  if (a.clutch != b.clutch) m |= kClutch;
  if (a.gear != b.gear) m |= kGear;
  if (a.buttons != b.buttons) m |= kButtons;
  return m;
}

constexpr std::array<std::uint32_t, 256> make_crc_table() {
  std::array<std::uint32_t, 256> t{};
  for (std::uint32_t i = 0; i < 256; ++i) {
    std::uint32_t c = i;
    for (int k = 0; k < 8; ++k) c = (c & 1) ? 0xEDB88320u ^ (c >> 1) : c >> 1;
    t[i] = c;
  }
  return t;
}
constexpr auto kCrcTable = make_crc_table();

}  // namespace

const char* to_string(Error e) {
  switch (e) {
    case Error::None: return "ok";
    case Error::TooShort: return "zu kurz";
    case Error::BadMagic: return "kein Replay (Magic falsch)";
    case Error::UnsupportedVersion: return "Formatversion nicht unterstuetzt";
    case Error::BadChecksum: return "Pruefsumme falsch";
    case Error::Malformed: return "Daten beschaedigt";
    case Error::TickCountMismatch: return "Tick-Anzahl passt nicht";
    case Error::FieldTooLong: return "Feld zu lang";
  }
  return "unbekannt";
}

std::uint32_t crc32(const std::uint8_t* data, std::size_t size) {
  std::uint32_t c = 0xFFFFFFFFu;
  for (std::size_t i = 0; i < size; ++i) c = kCrcTable[(c ^ data[i]) & 0xff] ^ (c >> 8);
  return c ^ 0xFFFFFFFFu;
}

std::vector<std::uint8_t> encode(const Replay& replay, Error* err) {
  const Header& h = replay.header;
  auto fail = [&](Error e) {
    if (err) *err = e;
    return std::vector<std::uint8_t>{};
  };
  if (h.car_id.size() > 255 || h.track_id.size() > 255) return fail(Error::FieldTooLong);
  if (h.tick_count != replay.frames.size()) return fail(Error::TickCountMismatch);

  // Eintraege sammeln: nur Ticks, an denen sich etwas aendert.
  struct Change { std::uint32_t tick; std::uint8_t mask; };
  std::vector<Change> changes;
  InputFrame prev{};
  for (std::uint32_t t = 0; t < replay.frames.size(); ++t) {
    const std::uint8_t m = diff_mask(prev, replay.frames[t]);
    if (m) changes.push_back({t, m});
    prev = replay.frames[t];
  }

  Writer w;
  w.u32(kMagic);
  w.u16(kFormatVersion);
  w.u16(h.tick_hz);
  w.u64(h.seed);
  w.u64(h.physics_build);
  w.str(h.car_id);
  w.str(h.track_id);
  w.u32(h.tick_count);
  w.u64(h.final_state_hash);
  w.u32(static_cast<std::uint32_t>(changes.size()));

  std::uint32_t last_tick = 0;
  for (const Change& c : changes) {
    const InputFrame& f = replay.frames[c.tick];
    w.varint(c.tick - last_tick);
    w.u8(c.mask);
    if (c.mask & kSteer) w.u16(static_cast<std::uint16_t>(f.steer));
    if (c.mask & kThrottle) w.u16(f.throttle);
    if (c.mask & kBrake) w.u16(f.brake);
    if (c.mask & kClutch) w.u16(f.clutch);
    if (c.mask & kGear) w.u8(static_cast<std::uint8_t>(f.gear));
    if (c.mask & kButtons) w.u8(f.buttons);
    last_tick = c.tick;
  }

  auto& out = w.bytes();
  w.u32(crc32(out.data(), out.size()));
  if (err) *err = Error::None;
  return std::move(out);
}

DecodeResult decode(const std::uint8_t* data, std::size_t size) {
  DecodeResult res;
  constexpr std::size_t kMinSize = 4 + 2 + 2 + 8 + 8 + 1 + 1 + 4 + 8 + 4 + 4;
  if (size < kMinSize) return {Error::TooShort, {}};

  const std::uint8_t* tail = data + size - 4;
  const std::uint32_t stored_crc = static_cast<std::uint32_t>(tail[0]) |
                                   static_cast<std::uint32_t>(tail[1]) << 8 |
                                   static_cast<std::uint32_t>(tail[2]) << 16 |
                                   static_cast<std::uint32_t>(tail[3]) << 24;
  {
    Reader r(data, 4);
    if (r.u32() != kMagic) return {Error::BadMagic, {}};
  }
  if (crc32(data, size - 4) != stored_crc) return {Error::BadChecksum, {}};

  Reader r(data, size - 4);
  r.u32();
  if (r.u16() != kFormatVersion) return {Error::UnsupportedVersion, {}};
  Header& h = res.replay.header;
  h.tick_hz = r.u16();
  h.seed = r.u64();
  h.physics_build = r.u64();
  h.car_id = r.str();
  h.track_id = r.str();
  h.tick_count = r.u32();
  h.final_state_hash = r.u64();
  const std::uint32_t change_count = r.u32();
  if (!r.ok()) return {Error::Malformed, {}};
  // Jeder Eintrag braucht mindestens 2 Bytes, schuetzt vor riesigen Allokationen.
  if (change_count > r.remaining() / 2 || change_count > h.tick_count) return {Error::Malformed, {}};

  auto& frames = res.replay.frames;
  frames.reserve(h.tick_count);
  InputFrame cur{};
  std::uint64_t tick = 0;
  for (std::uint32_t i = 0; i < change_count; ++i) {
    const std::uint32_t delta = r.varint();
    const std::uint8_t mask = r.u8();
    if (!r.ok() || mask == 0 || (mask & ~kAllFields)) return {Error::Malformed, {}};
    if (i > 0 && delta == 0) return {Error::Malformed, {}};
    tick += delta;
    if (tick >= h.tick_count) return {Error::TickCountMismatch, {}};
    while (frames.size() < tick) frames.push_back(cur);
    if (mask & kSteer) cur.steer = static_cast<std::int16_t>(r.u16());
    if (mask & kThrottle) cur.throttle = r.u16();
    if (mask & kBrake) cur.brake = r.u16();
    if (mask & kClutch) cur.clutch = r.u16();
    if (mask & kGear) cur.gear = static_cast<std::int8_t>(r.u8());
    if (mask & kButtons) cur.buttons = r.u8();
    if (!r.ok()) return {Error::Malformed, {}};
  }
  if (r.remaining() != 0) return {Error::Malformed, {}};
  while (frames.size() < h.tick_count) frames.push_back(cur);
  return res;
}

}  // namespace roots::replay
