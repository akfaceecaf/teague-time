"""One-time generator for data/teague.json (MVP only).

Every game Jeff Teague was on a roster for, marked played / didn't play.

Usage:
    python3 -m venv .venv && .venv/bin/pip install nba_api
    .venv/bin/python scripts/build_teague_data.py
"""

import json
import time
from collections import defaultdict
from pathlib import Path

from nba_api.stats.endpoints import leaguegamefinder, playergamelog
from nba_api.stats.static import teams

PLAYER_ID = 201952
OUT = Path(__file__).resolve().parent.parent / "data" / "teague.json"

# Roster stints (inclusive). Mid-season moves use transaction dates:
#   MIN -> ATL trade 2020-01-16; BOS -> ORL trade 2021-03-25 (waived 03-27);
#   signed with MIL 2021-04-01.
STINTS = [
    ("ATL", "2009-07-01", "2016-07-06"),
    ("IND", "2016-07-07", "2017-07-09"),
    ("MIN", "2017-07-10", "2020-01-15"),
    ("ATL", "2020-01-16", "2020-10-31"),
    ("BOS", "2020-11-30", "2021-03-24"),
    ("MIL", "2021-04-01", "2021-07-31"),
]
SEASONS = [f"{y}-{str(y + 1)[2:]}" for y in range(2009, 2021)]
SEASON_TYPES = {"Regular Season": "Regular", "Playoffs": "Playoffs"}

# Old abbreviations -> current franchise abbreviation (what the extension uses).
CANONICAL = {"NJN": "BKN", "NOH": "NOP", "NOK": "NOP"}


def canon(abbr):
    return CANONICAL.get(abbr, abbr)


def season_bounds(season):
    start = int(season[:4])
    return f"{start}-07-01", f"{start + 1}-10-31"


def team_id(abbr):
    return teams.find_team_by_abbreviation(abbr)["id"]


def fetch(endpoint, **kwargs):
    time.sleep(0.7)  # stats.nba.com rate-limits aggressively
    return endpoint(timeout=60, **kwargs).get_data_frames()[0]


def roster_games():
    """All team games inside each stint, keyed by GAME_ID."""
    games = {}
    for abbr, start, end in STINTS:
        for season in SEASONS:
            lo, hi = season_bounds(season)
            if hi < start or lo > end:
                continue
            for api_type, label in SEASON_TYPES.items():
                df = fetch(
                    leaguegamefinder.LeagueGameFinder,
                    team_id_nullable=team_id(abbr),
                    season_nullable=season,
                    season_type_nullable=api_type,
                    league_id_nullable="00",
                )
                for row in df.itertuples():
                    if not (start <= row.GAME_DATE <= end):
                        continue
                    # MATCHUP looks like "MIL vs. PHX" (home) or "MIL @ PHX" (away)
                    opp = row.MATCHUP.split()[-1]
                    games[row.GAME_ID] = {
                        "date": row.GAME_DATE,
                        "team": canon(abbr),
                        "opp": canon(opp),
                        "home": "vs." in row.MATCHUP,
                        "seasonType": label,
                        "played": False,
                    }
    return games


def mark_played(games):
    played = 0
    for season in SEASONS:
        for api_type in SEASON_TYPES:
            df = fetch(
                playergamelog.PlayerGameLog,
                player_id=PLAYER_ID,
                season=season,
                season_type_all_star=api_type,
            )
            for row in df.itertuples():
                game = games.get(row.Game_ID)
                if game is None:
                    raise SystemExit(
                        f"Played game outside every stint: {row.GAME_DATE} {row.MATCHUP} "
                        f"({row.Game_ID}) - fix STINTS"
                    )
                game.update(played=True, min=int(row.MIN), pts=int(row.PTS),
                            reb=int(row.REB), ast=int(row.AST))
                played += 1
    return played


def number_playoff_games(games):
    series = defaultdict(list)
    for g in games:
        if g["seasonType"] == "Playoffs":
            series[(g["date"][:4], g["opp"])].append(g)
    for series_games in series.values():
        for i, g in enumerate(sorted(series_games, key=lambda g: g["date"]), start=1):
            g["gameNumber"] = i


def main():
    games = roster_games()
    played = mark_played(games)
    ordered = sorted(games.values(), key=lambda g: g["date"])
    number_playoff_games(ordered)

    data = {
        "playerId": PLAYER_ID,
        "careerStart": ordered[0]["date"],
        "careerEnd": ordered[-1]["date"],
        "stints": [{"team": t, "from": f, "to": e} for t, f, e in STINTS],
        "games": ordered,
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(data, indent=1) + "\n")

    print(f"{len(ordered)} roster games, {played} played, {len(ordered) - played} DNP")
    for abbr, start, end in STINTS:
        stint = [g for g in ordered if g["team"] == abbr and start <= g["date"] <= end]
        p = [g for g in stint if g["played"]]
        print(f"  {abbr} {start}..{end}: {len(stint)} games, {len(p)} played, "
              f"first played {p[0]['date'] if p else '-'}, last {p[-1]['date'] if p else '-'}")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
