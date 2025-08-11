"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Heart, Globe, Lightbulb } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getEvents } from "@/lib/firebase";
import { Event } from "@/types";
import Navbar from "@/components/navbar";
import ChatBot from "@/components/chatbot";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await getEvents();
        setEvents(eventsData.slice(0, 6)); // Show only first 6 events
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const categories = [
    { name: "Environment", icon: Globe, color: "bg-green-100 text-green-800" },
    { name: "Education", icon: Lightbulb, color: "bg-blue-100 text-blue-800" },
    { name: "Community", icon: Users, color: "bg-purple-100 text-purple-800" },
    { name: "Healthcare", icon: Heart, color: "bg-red-100 text-red-800" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-black-0 to-white-100 dark:from-black-100 dark:to-white-0">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 md:leading-18 lg:leading-18 xl:leading-18">
            <span className="relative">
              <span className="text-orange-500">Vconnect</span>
              <svg
                className="absolute -bottom-2 left-0 w-full h-3"
                viewBox="0 0 200 12"
                fill="none"
              >
                <path
                  d="M2 10C50 2 150 2 198 10"
                  stroke="#f97316"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            is
            <br />
            connecting volunteers
            <br />
            to events that matter.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Whether you need 10 or 10,000 volunteers, our platform is an
            easy-to-use tools built to get volunteers for your events. Plus,
            we're proud to be #1 in customer support and we are here to help at
            every step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
              onClick={() => router.push("/signup")}
            >
              Join Vconnect
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-orange-500 text-orange-500 hover:bg-orange-50 px-8 py-3 text-lg"
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
          </div>
          <button
            className="mt-6 text-orange-500 hover:text-orange-600 font-medium flex items-center mx-auto"
            onClick={() => router.push("/signup")}
          >
            I'm a volunteer →
          </button>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Popular Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card
                key={category.name}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader className="text-center">
                  <div
                    className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center mx-auto mb-4`}
                  >
                    <category.icon className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Featured Events</h2>
            <Button
              variant="outline"
              onClick={() => router.push(user ? "/events" : "/login")}
            >
              View All Events
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gradient-to-br bg-[#e7cb89] mt-[-25px]   dark:bg-amber-900 rounded-t-lg flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-orange-500 dark:text-white" />
                  </div>
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
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.time).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
                      onClick={() => router.push(user ? "/events" : "/login")}
                    >
                      {user ? "Apply Now" : "Login to Apply"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <ChatBot />
    </div>
  );
}
