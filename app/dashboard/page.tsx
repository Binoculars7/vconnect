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
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Check,
  X,
  User,
  Mail,
  Globe,
  FileText,
  Loader2,
} from "lucide-react";
import {
  getEventsByOwner,
  getApplicationsByUser,
  getApplicationsByEvent,
  updateApplicationStatus,
  getEventById,
  getUserProfile,
} from "@/lib/firebase";
import Navbar from "@/components/navbar";

// Define types locally to avoid import issues
interface Event {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  venue?: string;
  location?: string;
  time?: string;
  date?: string;
  category?: string;
  ownerId?: string;
  createdAt?: string;
}

interface Application {
  id: string;
  userId?: string;
  uid?: string;
  eventId?: string;
  event?: string | { id: string };
  eventName?: string;
  userName?: string;
  userDisplayName?: string;
  userEmail?: string;
  status?: "pending" | "approved" | "declined";
  createdAt?: string;
}

interface VolunteerProfile {
  id?: string;
  fullName?: string;
  displayName?: string;
  username?: string;
  email?: string;
  country?: string;
  location?: string;
  bio?: string;
  description?: string;
  userType?: string;
}

// Modal component for displaying volunteer information
const VolunteerInfoModal = ({
  application,
  isOpen,
  onClose,
  volunteerInfo,
  isLoading,
}: {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  volunteerInfo: VolunteerProfile | null;
  isLoading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Volunteer Information</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {volunteerInfo?.fullName ||
                      volunteerInfo?.displayName ||
                      application?.userName ||
                      "Unknown User"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    @{volunteerInfo?.username || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <p className="text-sm">
                  {volunteerInfo?.email ||
                    application?.userEmail ||
                    "Email not available"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <p className="text-sm">
                  {volunteerInfo?.country ||
                    volunteerInfo?.location ||
                    "Nigeria"}
                </p>
              </div>

              {(volunteerInfo?.description || volunteerInfo?.bio) && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">About</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {volunteerInfo.description || volunteerInfo.bio}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Application Details</p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>Event: {application?.eventName || "Unknown Event"}</p>
                  <p>
                    Applied:{" "}
                    {application?.createdAt
                      ? new Date(application.createdAt).toLocaleDateString()
                      : "Unknown date"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <Badge
                      variant={
                        application?.status === "approved"
                          ? "default"
                          : application?.status === "declined"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {application?.status || "pending"}
                    </Badge>
                  </div>
                </div>
              </div>

              {!volunteerInfo && !isLoading && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Unable to load volunteer information
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [eventApplications, setEventApplications] = useState<{
    [key: string]: Application[];
  }>({});
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [volunteerInfo, setVolunteerInfo] = useState<VolunteerProfile | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingVolunteerInfo, setLoadingVolunteerInfo] = useState(false);

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
  }, [user, userProfile, loading, router]);

  const fetchData = async () => {
    if (!user || !userProfile) return;

    try {
      setLoadingData(true);
      setError(null);

      if (userProfile.userType === "event-owner") {
        // Fetch events for event owners
        const eventsData = await getEventsByOwner(user.uid);
        setEvents(eventsData as Event[]);

        // Fetch applications for each event
        const applicationsMap: { [key: string]: Application[] } = {};

        // Use Promise.allSettled to handle individual failures gracefully
        const applicationPromises = eventsData.map(async (event: Event) => {
          try {
            const eventApps = await getApplicationsByEvent(event.id);
            return { eventId: event.id, apps: eventApps as Application[] };
          } catch (err) {
            console.error(
              `Failed to fetch applications for event ${event.id}:`,
              err
            );
            return { eventId: event.id, apps: [] };
          }
        });

        const applicationResults = await Promise.allSettled(
          applicationPromises
        );

        applicationResults.forEach((result) => {
          if (result.status === "fulfilled") {
            applicationsMap[result.value.eventId] = result.value.apps;
          }
        });

        setEventApplications(applicationsMap);
      } else {
        // Volunteer: fetch user's applications
        const applicationsData = (await getApplicationsByUser(
          user.uid
        )) as Application[];

        // Get unique event IDs, being defensive about data structure
        const eventIds = Array.from(
          new Set(
            applicationsData
              .map((app: Application) => {
                // Handle different possible property names for event ID
                return (
                  app.eventId ||
                  (app.event && typeof app.event === "string"
                    ? app.event
                    : typeof app.event === "object" && app.event?.id
                    ? app.event.id
                    : null) ||
                  null
                );
              })
              .filter((id): id is string => Boolean(id))
          )
        );

        // Fetch event details with error handling
        const eventPromises = eventIds.map(async (eventId) => {
          try {
            const event = await getEventById(eventId);
            return { eventId, event: event as Event | null };
          } catch (err) {
            console.warn(`Could not fetch event for id: ${eventId}`, err);
            return { eventId, event: null };
          }
        });

        const eventResults = await Promise.allSettled(eventPromises);
        const eventMap = new Map<string, Event | null>();

        eventResults.forEach((result) => {
          if (result.status === "fulfilled") {
            eventMap.set(result.value.eventId, result.value.event);
          }
        });

        // Enrich applications with event names
        const enrichedApplications = applicationsData.map(
          (app: Application) => {
            const eventId =
              app.eventId ||
              (app.event && typeof app.event === "string"
                ? app.event
                : typeof app.event === "object" && app.event?.id
                ? app.event.id
                : "") ||
              "";

            const event = eventMap.get(eventId);
            const eventName =
              event?.name || event?.title || app.eventName || "Unknown Event";

            return {
              ...app,
              eventId,
              eventName,
            } as Application;
          }
        );

        setApplications(enrichedApplications);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(
        "Failed to load dashboard data. Please try refreshing the page."
      );
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
      await fetchData(); // Refresh data after update
    } catch (error) {
      console.error("Error updating application status:", error);
      setError("Failed to update application status. Please try again.");
    }
  };

  const handleVolunteerClick = async (application: Application) => {
    // Validate that we have a user ID to fetch
    const userId = application.userId || application.uid;

    if (!userId) {
      console.error("No user ID found in application:", application);
      setError("Unable to load volunteer information - missing user ID");
      return;
    }

    setSelectedApplication(application);
    setLoadingVolunteerInfo(true);
    setIsModalOpen(true);
    setVolunteerInfo(null);

    try {
      const volunteer = await getUserProfile(userId);

      if (!volunteer) {
        console.warn(`No profile found for user ID: ${userId}`);
        setVolunteerInfo(null);
      } else {
        setVolunteerInfo(volunteer as VolunteerProfile);
      }
    } catch (error) {
      console.error("Error fetching volunteer info:", error);
      setVolunteerInfo(null);
    } finally {
      setLoadingVolunteerInfo(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedApplication(null);
    setVolunteerInfo(null);
    setLoadingVolunteerInfo(false);
  };

  // Clear error after a few seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Calculate paginated data for owner applications
  const allOwnerApplications =
    userProfile?.userType === "event-owner"
      ? Object.entries(eventApplications)
          .flatMap(([eventId, apps]) =>
            apps.map((app) => ({
              ...app,
              eventId,
              eventName:
                events.find((e) => e.id === eventId)?.name ||
                events.find((e) => e.id === eventId)?.title ||
                "Unknown Event",
            }))
          )
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          })
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

  // Calculate paginated data for volunteer applications
  const filteredVolunteerApplications = applications.filter(
    (app: Application) =>
      (app.eventName || "").toLowerCase().includes(filterTerm.toLowerCase())
  );
  const totalVolunteerPages = Math.max(
    1,
    Math.ceil(filteredVolunteerApplications.length / pageSize)
  );
  const paginatedVolunteerApplications = filteredVolunteerApplications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Loading state
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

  // Redirect if not authenticated
  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Error notification */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {userProfile.fullName || "User"}!
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
                            {event.name || event.title || "Untitled Event"}
                          </CardTitle>
                          <Badge variant="secondary">
                            {event.category || "General"}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {event.description || "No description provided"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {event.venue || event.location || "Location TBD"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {event.time
                                ? new Date(event.time).toLocaleDateString()
                                : event.date
                                ? new Date(event.date).toLocaleDateString()
                                : "Date TBD"}
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
                          className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          onClick={() => handleVolunteerClick(app)}
                        >
                          <div>
                            <p className="font-medium">
                              {app.userName ||
                                app.userDisplayName ||
                                "Unknown User"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Applied to: {app.eventName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {app.createdAt
                                ? new Date(app.createdAt).toLocaleDateString()
                                : "Unknown date"}
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
                              {app.status || "pending"}
                            </Badge>
                            {(app.status === "pending" || !app.status) && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApplicationStatus(app.id, "approved");
                                  }}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApplicationStatus(app.id, "declined");
                                  }}
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
                        {filterTerm
                          ? "No applications match your filter"
                          : "No applications found"}
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
                      applications.filter(
                        (app) => app.status === "pending" || !app.status
                      ).length
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
                      {filterTerm
                        ? "No matching applications"
                        : "No applications yet"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {filterTerm
                        ? "Try adjusting your filter criteria"
                        : "Start making a difference by applying to volunteer events"}
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
                  {paginatedVolunteerApplications.map(
                    (application: Application) => (
                      <Card key={application.id}>
                        <CardContent className="pl-6 pt-6 pb-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400 mb-1">
                                Event: {application.eventName}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 mb-2">
                                Applied on:{" "}
                                {application.createdAt
                                  ? new Date(
                                      application.createdAt
                                    ).toLocaleDateString()
                                  : "Unknown date"}
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
                              {application.status || "pending"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
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

      {/* Volunteer Info Modal */}
      <VolunteerInfoModal
        application={selectedApplication}
        isOpen={isModalOpen}
        onClose={closeModal}
        volunteerInfo={volunteerInfo}
        isLoading={loadingVolunteerInfo}
      />
    </div>
  );
}
