"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  MapPin,
  Search,
  Filter,
  AlertCircle,
  Clock,
  User,
} from "lucide-react";
import {
  getEvents,
  createApplication,
  getUserApplications,
} from "@/lib/firebase";
import { Event } from "@/types";
import Navbar from "@/components/navbar";

export default function EventsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [appliedEvents, setAppliedEvents] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    "Environment",
    "Education",
    "Community",
    "Healthcare",
    "Social Services",
    "Arts & Culture",
  ];

  // Fetch events from backend
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const eventsData = await getEvents();

      if (!Array.isArray(eventsData)) {
        throw new Error("Invalid events data received");
      }

      const validEvents = eventsData.filter(
        (event: any) =>
          event &&
          event.id &&
          event.name &&
          event.description &&
          event.venue &&
          event.time
      );

      setEvents(validEvents as Event[]);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch events user has already applied to
  const fetchAppliedEvents = useCallback(async () => {
    if (!user) return;
    try {
      const applications = await getUserApplications(user.uid);
      const appliedIds = applications.map((app: any) => app.eventId);
      setAppliedEvents(new Set(appliedIds));
    } catch (err) {
      console.error("Error fetching applied events:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchAppliedEvents();
  }, [fetchAppliedEvents]);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.name?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.venue?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (event) => event.category === selectedCategory
      );
    }

    return filtered;
  }, [events, searchTerm, selectedCategory]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleApply = async (eventId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent the card click event
    }

    if (applying.has(eventId) || appliedEvents.has(eventId)) {
      return;
    }

    if (!user || !userProfile) {
      router.push("/login");
      return;
    }

    if (userProfile.userType !== "volunteer") {
      setError("Only volunteers can apply to events");
      return;
    }

    try {
      setApplying((prev) => new Set([...prev, eventId]));
      setError(null);

      await createApplication({
        eventId,
        userId: user.uid,
        userName: userProfile.fullName || user.email || "Anonymous",
        userEmail: user.email || "",
      });

      // Keep button disabled forever for this event
      setAppliedEvents((prev) => new Set([...prev, eventId]));
    } catch (error) {
      console.error("Error applying to event:", error);
      setError("Failed to submit application. Please try again.");
    } finally {
      setApplying((prev) => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  const formatDate = (dateInput: any): string => {
    try {
      let date: Date;

      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (
        typeof dateInput === "string" ||
        typeof dateInput === "number"
      ) {
        date = new Date(dateInput);
      } else if (dateInput?.toDate) {
        date = dateInput.toDate();
      } else {
        return "Date unavailable";
      }

      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date unavailable";
    }
  };

  const formatDateLong = (dateInput: any): string => {
    try {
      let date: Date;

      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (
        typeof dateInput === "string" ||
        typeof dateInput === "number"
      ) {
        date = new Date(dateInput);
      } else if (dateInput?.toDate) {
        date = dateInput.toDate();
      } else {
        return "Date unavailable";
      }

      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date unavailable";
    }
  };

  const formatTime = (dateInput: any): string => {
    try {
      let date: Date;

      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (
        typeof dateInput === "string" ||
        typeof dateInput === "number"
      ) {
        date = new Date(dateInput);
      } else if (dateInput?.toDate) {
        date = dateInput.toDate();
      } else {
        return "Time unavailable";
      }

      if (isNaN(date.getTime())) {
        return "Invalid time";
      }

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Time unavailable";
    }
  };

  const LoadingSpinner = () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    </div>
  );

  const ErrorMessage = ({
    message,
    onRetry,
  }: {
    message: string;
    onRetry?: () => void;
  }) => (
    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
      <CardContent className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-200">
          Error
        </h3>
        <p className="text-red-600 dark:text-red-400 mb-4">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Volunteer Events</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover meaningful volunteer opportunities in your community
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              onRetry={error.includes("load events") ? fetchEvents : undefined}
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {events.length === 0
                  ? "No events are currently available"
                  : "Try adjusting your search or filter criteria"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <div className="h-48 bg-gradient-to-br bg-[#e7cb89] mt-[-25px] dark:bg-amber-900 rounded-t-lg flex items-center justify-center">
                  <Calendar className="w-16 h-16 text-orange-500 dark:text-white" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">
                      {event.name || "Untitled Event"}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {event.category || "General"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {event.description || "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {event.venue || "Venue TBD"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>{formatDate(event.time)}</span>
                    </div>
                    {event.ownerName && (
                      <div className="text-xs text-gray-500">
                        Organized by: {event.ownerName}
                      </div>
                    )}
                    {event.sponsors && (
                      <div className="text-xs text-gray-500">
                        Sponsors: {event.sponsors}
                      </div>
                    )}
                  </div>

                  {appliedEvents.has(event.id) ? (
                    <Button
                      disabled
                      className="w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Applied ✓
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={(e) => handleApply(event.id, e)}
                      disabled={applying.has(event.id)}
                    >
                      {applying.has(event.id) ? "Applying..." : "Apply Now"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold text-left">
                      {selectedEvent.name || "Untitled Event"}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-sm">
                        {selectedEvent.category || "General"}
                      </Badge>
                      {appliedEvents.has(selectedEvent.id) && (
                        <Badge
                          variant="default"
                          className="text-sm bg-green-100 text-green-800"
                        >
                          Applied ✓
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Event Banner */}
                <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-20 h-20 text-white" />
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Date</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDateLong(selectedEvent.time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Time</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTime(selectedEvent.time)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedEvent.venue || "Venue TBD"}
                        </p>
                      </div>
                    </div>

                    {selectedEvent.ownerName && (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="font-medium">Organizer</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedEvent.ownerName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    About This Event
                  </h3>
                  <DialogDescription className="text-base leading-relaxed">
                    {selectedEvent.description || "No description available"}
                  </DialogDescription>
                </div>

                {/* Additional Details */}
                <div className="space-y-3">
                  {selectedEvent.sponsors && (
                    <div>
                      <h4 className="font-medium mb-2">Sponsors</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedEvent.sponsors}
                      </p>
                    </div>
                  )}
                  {selectedEvent.requirements && (
                    <div>
                      <h4 className="font-medium mb-2">Requirements</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedEvent.requirements}
                      </p>
                    </div>
                  )}
                  {selectedEvent.skills && (
                    <div>
                      <h4 className="font-medium mb-2">Skills Needed</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedEvent.skills}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {appliedEvents.has(selectedEvent.id) ? (
                    <Button disabled className="flex-1">
                      Applied ✓
                    </Button>
                  ) : (
                    <></>
                  )}
                  <Button
                    className="flex-1 flex-outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
