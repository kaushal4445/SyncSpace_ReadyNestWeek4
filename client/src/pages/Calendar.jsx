import { useEffect, useState, useCallback } from "react";
import { FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import CalendarHeader from "../components/calendar/CalendarHeader.jsx";
import CalendarGrid from "../components/calendar/CalendarGrid.jsx";
import MiniCalendar from "../components/calendar/MiniCalendar.jsx";
import TodayTasks from "../components/calendar/TodayTasks.jsx";
import UpcomingMeetings from "../components/calendar/UpcomingMeetings.jsx";
import CalendarStats from "../components/calendar/CalendarStats.jsx";
import ScheduleMeetingModal from "../components/calendar/ScheduleMeetingModal.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { calendarService, meetingService } from "../services/calendarService.js";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

const Calendar = () => {
  const { currentWorkspace } = useWorkspace() || {};
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [events, setEvents] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!currentWorkspace) return;
    const from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    try {
      const { data } = await calendarService.getEvents(currentWorkspace._id, {
        from: from.toISOString(),
        to: to.toISOString(),
      });
      setEvents(data.events);
    } catch (error) {
      toast.error("Failed to load calendar events");
    }
  }, [currentWorkspace, currentDate]);

  const fetchSidebarData = useCallback(async () => {
    try {
      const [todayRes, upcomingRes] = await Promise.all([calendarService.getToday(), meetingService.getUpcoming()]);
      setTodayEvents(todayRes.data.events);
      setUpcomingMeetings(upcomingRes.data.meetings);
    } catch (error) {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchSidebarData();
  }, [fetchSidebarData]);

  const changeMonth = (delta) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  if (!currentWorkspace) {
    return <EmptyState title="No workspace selected" description="Select a workspace to view its calendar." />;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
          <FiPlus /> Schedule
        </Button>
      </div>

      <CalendarStats totalEvents={events.length} totalMeetings={upcomingMeetings.length} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <CalendarHeader
            currentDate={currentDate}
            view={view}
            onViewChange={setView}
            onPrev={() => changeMonth(-1)}
            onNext={() => changeMonth(1)}
            onToday={() => setCurrentDate(new Date())}
          />
          {/* Week/day views can reuse CalendarGrid with a narrower date range — month view shown by default */}
          <CalendarGrid currentDate={currentDate} events={events} onDayClick={() => setModalOpen(true)} />
        </div>

        <div className="space-y-4">
          <MiniCalendar value={currentDate} onChange={setCurrentDate} markedDates={events.map((e) => e.startTime)} />
          <TodayTasks events={todayEvents} />
          <UpcomingMeetings meetings={upcomingMeetings} />
        </div>
      </div>

      <ScheduleMeetingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        workspaceId={currentWorkspace._id}
        onCreated={() => {
          fetchEvents();
          fetchSidebarData();
        }}
      />
    </div>
  );
};

export default Calendar;
