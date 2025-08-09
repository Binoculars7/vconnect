"use client";

import { useEffect, useState } from "react";
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
import { Calendar, MapPin, Users, Plus, Check, X } from "lucide-react";
import {
  getEventsByOwner,
  getApplicationsByUser,
  getApplicationsByEvent,
  updateApplicationStatus,
  getEventById,
} from "@/lib/firebase";
import { Event, Application } from "@/types";
import Navbar from "@/components/navbar";

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [eventApplications, setEventApplications] = useState<{
    [key: string]: Application[];
  }>({});
  const [loadingData, setLoadingData] = useState(true);

  // Filter & pagination state
  const [filterTerm, setFilterTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user && userProfile) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile, loading]);

  const fetchData = async () => {
    if (!user || !userProfile) return;

    try {
      setLoadingData(true);

      if (userProfile.userType === "event-owner") {
        const eventsData = await getEventsByOwner(user.uid);
        setEvents(eventsData as Event[]);

        const applicationsMap: { [key: string]: Application[] } = {};
        for (const event of eventsData) {
          const eventApps = await getApplicationsByEvent(event.id);
          applicationsMap[event.id] = eventApps as Application[];
        }
        setEventApplications(applicationsMap);
      } else {
        // Volunteer: fetch user's applications and enrich with event names
        const applicationsData = (await getApplicationsByUser(
          user.uid
        )) as Application[];

        // Build unique eventId list (guarding for different possible property names)
        const eventIds = Array.from(
          new Set(
            applicationsData
              .map((a: any) => a.eventId || (a.event && a.event.id) || "")
              .filter(Boolean)
          )
        );

        // Use a Map to avoid TS index-signature problems and make lookups explicit
        const eventMap = new Map<string, Event | null>();

        // Fetch event details for each eventId in parallel
        await Promise.all(
          eventIds.map(async (id) => {
            try {
              // getEventById should return Event | null (cast defensively)
              const ev = (await getEventById(id)) as Event | null;
              eventMap.set(id, ev ?? null);
            } catch (err) {
              console.warn("Could not fetch event for id:", id, err);
              eventMap.set(id, null);
            }
          })
        );

        // Enrich applications with eventName (fallback to empty string)
        const enriched = applicationsData.map((a: any) => {
          const id = a.eventId || (a.event && a.event.id) || "";
          const event = eventMap.get(id) ?? null;
          return {
            ...a,
            eventName: (event && (event.name ?? "")) || a.eventName || "",
          } as Application;
        });

        setApplications(enriched);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleApplicationStatus = async (
    applicationId: string,
    status: "approved" | "declined"
  ) => {
    try {
      await updateApplicationStatus(applicationId, status);
      await fetchData();
    } catch (error) {
      console.error("Error updating application status:", error);
    }
  };

  // ===== Owner Applications =====
  const allOwnerApplications =
    userProfile?.userType === "event-owner"
      ? Object.entries(eventApplications)
          .flatMap(([eventId, apps]) =>
            apps.map((app) => ({
              ...app,
              eventId,
              eventName: events.find((e) => e.id === eventId)?.name || "",
            }))
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
      : [];

  const filteredOwnerApplications = allOwnerApplications.filter((app) =>
    (app.eventName || "").toLowerCase().includes(filterTerm.toLowerCase())
  );
  const totalOwnerPages = Math.max(
    1,
    Math.ceil(filteredOwnerApplications.length / pageSize)
  );
  const paginatedOwnerApplications = filteredOwnerApplications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ===== Volunteer Applications =====
  const filteredVolunteerApplications = applications.filter((app: any) =>
    ((app as any).eventName || "")
      .toLowerCase()
      .includes(filterTerm.toLowerCase())
  );
  const totalVolunteerPages = Math.max(
    1,
    Math.ceil(filteredVolunteerApplications.length / pageSize)
  );
  const paginatedVolunteerApplications = filteredVolunteerApplications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {userProfile.fullName}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {userProfile.userType === "event-owner"
                ? "Manage your events and volunteer applications"
                : "Track your volunteer applications and discover new opportunities"}
            </p>
          </div>

          {userProfile.userType === "event-owner" && (
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => router.push("/create-event")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>

        {userProfile.userType === "event-owner" ? (
          <div className="space-y-8">
            {/* Events Section */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Your Events</h2>
              {events.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No events yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create your first event to start connecting with
                      volunteers
                    </p>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => router.push("/create-event")}
                    >
                      Create Event
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <Card
                      key={event.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg line-clamp-2">
                            {event.name}
                          </CardTitle>
                          <Badge variant="secondary">{event.category}</Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {event.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{event.venue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(event.time).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>
                              {eventApplications[event.id]?.length || 0}{" "}
                              applications
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Applications Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Recent Applications</h2>
                <input
                  type="text"
                  placeholder="Filter by event name..."
                  value={filterTerm}
                  onChange={(e) => {
                    setFilterTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border rounded px-3 py-1 text-sm"
                />
              </div>
              <Card>
                <CardContent className="p-0">
                  {paginatedOwnerApplications.length > 0 ? (
                    <div className="divide-y">
                      {paginatedOwnerApplications.map((app) => (
                        <div
                          key={app.id}
                          className="p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{app.userName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Applied to: {app.eventName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                app.status === "approved"
                                  ? "default"
                                  : app.status === "declined"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {app.status}
                            </Badge>
                            {app.status === "pending" && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() =>
                                    handleApplicationStatus(app.id, "approved")
                                  }
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() =>
                                    handleApplicationStatus(app.id, "declined")
                                  }
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No applications found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {totalOwnerPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalOwnerPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalOwnerPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalOwnerPages, p + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Volunteer Dashboard
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-500">
                    {applications.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Approved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">
                    {
                      applications.filter((app) => app.status === "approved")
                        .length
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-500">
                    {
                      applications.filter((app) => app.status === "pending")
                        .length
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Your Applications</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Filter by event name..."
                    value={filterTerm}
                    onChange={(e) => {
                      setFilterTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border rounded px-3 py-1 text-sm"
                  />
                  <Button
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => router.push("/events")}
                  >
                    Browse Events
                  </Button>
                </div>
              </div>

              {paginatedVolunteerApplications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No applications yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Start making a difference by applying to volunteer events
                    </p>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => router.push("/events")}
                    >
                      Browse Events
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {paginatedVolunteerApplications.map((application: any) => (
                    <Card key={application.id}>
                      <CardContent className="pl-6 pt-1 pb-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">
                              Event: {application.eventName || "Unknown Event"}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                              Applied on:{" "}
                              {new Date(
                                application.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              application.status === "approved"
                                ? "default"
                                : application.status === "declined"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {application.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {totalVolunteerPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalVolunteerPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalVolunteerPages}
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(totalVolunteerPages, p + 1)
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
