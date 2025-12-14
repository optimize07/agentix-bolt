import { useMemo, useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, GripVertical } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import type { EventClickArg, EventDropArg, EventInput, EventContentArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { EventResizeDoneArg } from "@fullcalendar/interaction";
// FullCalendar CSS: use plugin styles; core ships no CSS to import
// Note: FullCalendar v6 ships JS-only modules. Styles can be added via custom CSS or CDN if desired.

type CalendarType = "Strategy" | "Advertising" | "Marketing" | "Sales" | "Operations" | "Financials";

interface AgencyEvent extends EventInput {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  calendar: CalendarType;
  description?: string;
}

const calendarColors: Record<CalendarType, string> = {
  Strategy: "hsl(var(--chart-1))",
  Advertising: "hsl(var(--chart-2))",
  Marketing: "hsl(var(--chart-3))",
  Sales: "hsl(var(--chart-4))",
  Operations: "hsl(var(--primary))",
  Financials: "hsl(var(--chart-5))",
};

const AdminCalendar = () => {
  const initialEvents: AgencyEvent[] = useMemo(
    () => [
      {
        id: "e-001",
        title: "Weekly Ops Sync",
        start: new Date().toISOString().slice(0, 10) + "T10:00:00",
        end: new Date().toISOString().slice(0, 10) + "T11:00:00",
        calendar: "Operations",
        description: "Status, blockers, priorities",
      },
      {
        id: "e-002",
        title: "Client Portfolio Review",
        start: addDaysISO(new Date(), 1) + "T14:00:00",
        end: addDaysISO(new Date(), 1) + "T15:00:00",
        calendar: "Strategy",
        description: "Executive weekly review",
      },
      {
        id: "e-003",
        title: "Ad Creative Workshop",
        start: addDaysISO(new Date(), 2) + "T11:00:00",
        end: addDaysISO(new Date(), 2) + "T12:30:00",
        calendar: "Advertising",
        description: "Brainstorm new hooks & angles",
      },
      {
        id: "e-004",
        title: "Finance Closeout",
        start: addDaysISO(new Date(), 4) + "T16:00:00",
        end: addDaysISO(new Date(), 4) + "T17:00:00",
        calendar: "Financials",
        description: "Monthly close checklist",
      },
    ],
    [],
  );

  const [events, setEvents] = useState<AgencyEvent[]>(initialEvents);
  const [activeCalendars, setActiveCalendars] = useState<CalendarType[]>([
    "Strategy",
    "Advertising",
    "Marketing",
    "Sales",
    "Operations",
    "Financials",
  ]);
  const [selected, setSelected] = useState<AgencyEvent | null>(null);

  const filteredEvents = useMemo(
    () =>
      events
        .filter((e) => activeCalendars.includes(e.calendar))
        .map((e) => ({
          ...e,
          backgroundColor: calendarColors[e.calendar],
          borderColor: calendarColors[e.calendar],
        })),
    [events, activeCalendars],
  );

  function onEventClick(arg: EventClickArg) {
    const found = events.find((e) => e.id === arg.event.id);
    if (found) setSelected(found);
  }

  function onEventDrop(arg: EventDropArg) {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === arg.event.id
          ? {
              ...e,
              start: arg.event.start?.toISOString(),
              end: arg.event.end?.toISOString(),
            }
          : e,
      ),
    );
  }

  function onEventResize(arg: EventResizeDoneArg) {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === arg.event.id
          ? {
              ...e,
              start: arg.event.start?.toISOString(),
              end: arg.event.end?.toISOString(),
            }
          : e,
      ),
    );
  }

  function toggleCalendar(cal: CalendarType) {
    setActiveCalendars((prev) =>
      prev.includes(cal) ? prev.filter((c) => c !== cal) : [...prev, cal],
    );
  }

  function renderEventContent(eventInfo: any) {
    return (
      <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 opacity-80" />
        <span className="truncate">{eventInfo.event.title}</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full" style={{ background: 'var(--page-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">Agency Calendar</h1>
              <p className="text-sm text-muted-foreground">Daily, weekly, and monthly views with drag-and-drop scheduling.</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[12rem] justify-between">
                {activeCalendars.length === 6 ? "All calendars" : `${activeCalendars.length} selected`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Calendars</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={activeCalendars.length === 6}
                onCheckedChange={(checked) =>
                  setActiveCalendars(checked ? ["Strategy","Advertising","Marketing","Sales","Operations","Financials"] : [])
                }
              >
                Select All
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {(["Strategy","Advertising","Marketing","Sales","Operations","Financials"] as CalendarType[]).map((c) => (
                <DropdownMenuCheckboxItem
                  key={c}
                  checked={activeCalendars.includes(c)}
                  onCheckedChange={() => toggleCalendar(c)}
                  style={{ color: activeCalendars.includes(c) ? calendarColors[c] : undefined }}
                >
                  {c}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="border border-border bg-card p-3">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height="auto"
            events={filteredEvents}
            editable
            selectable
            eventResizableFromStart
            eventClick={onEventClick}
            eventDrop={onEventDrop}
            eventResize={onEventResize}
            eventContent={renderEventContent}
          />
        </Card>
      </main>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected?.calendar} • {selected?.start?.toString()?.slice(0, 16)} {selected?.end ? `→ ${selected.end.toString().slice(0,16)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 text-sm text-muted-foreground">{selected?.description}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCalendar;

function addDaysISO(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}


