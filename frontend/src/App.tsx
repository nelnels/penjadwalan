import { useState } from "react";
import ScheduleListView from "./components/schedules/ScheduleListView";
import ScheduleCalendarView from "./components/schedules/ScheduleCalendarView";
import ToastViewport from "./components/common/ToastViewport";
import AppNavigation from "./components/layout/AppNavigation";
import HealthTrackerView from "./components/health/HealthTrackerView";
import TodoListView from "./components/tasks/TodoListView";
import HabitTrackerView from "./components/habits/HabitTrackerView";
import AuthModal from "./components/auth/AuthModal";

export default function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const path = window.location.pathname;
  const content = path === "/health" ? <HealthTrackerView /> : path === "/todo" ? <TodoListView /> : path === "/habits" ? <HabitTrackerView /> : path === "/schedules/calendar" ? <ScheduleCalendarView /> : <ScheduleListView />;
  return <><AppNavigation onOpenAuthModal={() => setIsAuthModalOpen(true)} />{content}<AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} /><ToastViewport /></>;
}
