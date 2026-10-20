#pragma once
#include "roots/replay/format.hpp"

namespace roots::replay {

// Zeichnet pro Physik-Tick genau eine Eingabe auf.
class Recorder {
 public:
  explicit Recorder(Header header) { replay_.header = std::move(header); }

  void push(const InputFrame& frame) { replay_.frames.push_back(frame); }
  std::uint32_t ticks() const { return static_cast<std::uint32_t>(replay_.frames.size()); }

  // Schliesst die Runde ab und liefert die kodierten Bytes.
  std::vector<std::uint8_t> finish(std::uint64_t final_state_hash, Error* err = nullptr) {
    replay_.header.tick_count = ticks();
    replay_.header.final_state_hash = final_state_hash;
    return encode(replay_, err);
  }

  const Replay& replay() const { return replay_; }

 private:
  Replay replay_;
};

// Spielt ein dekodiertes Replay Tick fuer Tick ab.
class Player {
 public:
  explicit Player(Replay replay) : replay_(std::move(replay)) {}

  const Header& header() const { return replay_.header; }
  bool done() const { return tick_ >= replay_.frames.size(); }
  std::uint32_t tick() const { return static_cast<std::uint32_t>(tick_); }
  const InputFrame& next() { return replay_.frames[tick_++]; }
  void rewind() { tick_ = 0; }

 private:
  Replay replay_;
  std::size_t tick_ = 0;
};

}  // namespace roots::replay
