// Powered by OnSpace.AI
import { useContext } from 'react';
import { WeeklyPlanContext } from '@/contexts/WeeklyPlanContext';

export function useWeeklyPlan() {
  const context = useContext(WeeklyPlanContext);
  if (!context) throw new Error('useWeeklyPlan must be used within WeeklyPlanProvider');
  return context;
}
