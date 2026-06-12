import { getDailyData, computeInsights, computeDayScore } from "@/lib/summary";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { daily, workouts } = await getDailyData(90);
  const insights = computeInsights(daily);
  const dayScore = computeDayScore(daily);
  return (
    <Dashboard
      daily={daily}
      workouts={JSON.parse(JSON.stringify(workouts))}
      insights={insights}
      dayScore={dayScore}
    />
  );
}
