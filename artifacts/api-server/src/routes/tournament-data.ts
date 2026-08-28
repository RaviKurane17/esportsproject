import {
  GetDashboardSummaryResponse,
  GetDashboardTournamentsResponseItem,
  ListGamesResponseItem,
  ListLeaderboardsResponseItem,
  ListTournamentsResponseItem,
  RegisterForTournamentResponse,
  GetTournamentResponse,
} from "@workspace/api-zod";
import type {
  DashboardSummary,
  Game,
  LeaderboardEntry,
  RegisteredTournament,
  Registration,
  TournamentDetail,
} from "@workspace/api-zod";

export type { Registration };
export type Tournament = TournamentDetail;

export const games: Game[] = [
  {
    id: "bgmi",
    name: "Battlegrounds Mobile India",
    slug: "bgmi",
    shortName: "BGMI",
    description: "Squad up for tactical battle royale tournaments.",
    color: "#ffb547",
    status: "ACTIVE",
    playerCount: 12480,
  },
  {
    id: "free-fire",
    name: "Free Fire",
    slug: "free-fire",
    shortName: "Free Fire",
    description: "Fast rounds, sharp aim, big local rivalries.",
    color: "#ff5c73",
    status: "ACTIVE",
    playerCount: 9340,
  },
  {
    id: "ludo",
    name: "Ludo King",
    slug: "ludo",
    shortName: "Ludo",
    description: "Classic board play with a competitive twist.",
    color: "#8f7cff",
    status: "ACTIVE",
    playerCount: 5120,
  },
  {
    id: "valorant",
    name: "Valorant",
    slug: "valorant",
    shortName: "Valorant",
    description: "Precision, teamwork, and clutch moments.",
    color: "#6a7cff",
    status: "COMING_SOON",
    playerCount: 0,
  },
  {
    id: "cod-mobile",
    name: "Call of Duty Mobile",
    slug: "cod-mobile",
    shortName: "COD Mobile",
    description: "Competitive mobile FPS tournaments are on the way.",
    color: "#70d6bd",
    status: "COMING_SOON",
    playerCount: 0,
  },
];

export const tournaments: TournamentDetail[] = [];

export const dashboardSummary: DashboardSummary = {
  playerName: "Guest",
  gamerTag: "GUEST",
  avatar: "?",
  upcomingCount: 0,
  liveCount: 0,
  completedCount: 0,
  totalPoints: 0,
};

export const registeredTournaments: RegisteredTournament[] = [];

export const leaderboard: LeaderboardEntry[] = [];