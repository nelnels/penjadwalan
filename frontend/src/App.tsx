import ScheduleListView from "./components/schedules/ScheduleListView";
import ScheduleCalendarView from "./components/schedules/ScheduleCalendarView";
import ToastViewport from "./components/common/ToastViewport";

export default function App() {
  const content = window.location.pathname === "/schedules/calendar" ? <ScheduleCalendarView /> : <ScheduleListView />;
  return <>{content}<ToastViewport /></>;
}
