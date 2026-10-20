#pragma once
// Determinismus-Test: spielt dasselbe Replay mehrfach ab und vergleicht den
// Zustands-Hash nach jedem Tick. Meldet den ersten Tick, an dem ein Lauf abweicht.
//
// Sim-Schnittstelle (wird von Devphys Physik-Bibliothek erfuellt):
//   void reset(const roots::replay::Header&);
//   void step(const roots::replay::InputFrame&);
//   std::uint64_t state_hash() const;
#include <cstdint>
#include <optional>
#include <vector>

#include "roots/replay/recorder.hpp"

namespace roots::replay {

struct DeterminismReport {
  bool ok = true;
  int failing_run = -1;                       // welcher Lauf zuerst abwich
  std::optional<std::uint32_t> first_bad_tick;  // erster abweichender Tick
  std::uint64_t expected_hash = 0;
  std::uint64_t actual_hash = 0;
  bool final_hash_mismatch = false;           // Abweichung vom Hash im Header
};

template <class MakeSim>
DeterminismReport check_determinism(const Replay& replay, MakeSim make_sim, int runs = 3) {
  DeterminismReport report;
  std::vector<std::uint64_t> reference;
  reference.reserve(replay.frames.size());

  for (int run = 0; run < runs; ++run) {
    auto sim = make_sim(run);
    sim.reset(replay.header);
    for (std::uint32_t t = 0; t < replay.frames.size(); ++t) {
      sim.step(replay.frames[t]);
      const std::uint64_t h = sim.state_hash();
      if (run == 0) {
        reference.push_back(h);
      } else if (h != reference[t]) {
        report.ok = false;
        report.failing_run = run;
        report.first_bad_tick = t;
        report.expected_hash = reference[t];
        report.actual_hash = h;
        return report;
      }
    }
  }

  const std::uint64_t final_hash = reference.empty() ? 0 : reference.back();
  if (replay.header.final_state_hash != 0 && final_hash != replay.header.final_state_hash) {
    report.ok = false;
    report.final_hash_mismatch = true;
    report.failing_run = 0;
    report.expected_hash = replay.header.final_state_hash;
    report.actual_hash = final_hash;
  }
  return report;
}

}  // namespace roots::replay
