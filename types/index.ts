export interface Event {
  id: string
  name: string
  description: string
  venue: string
  time: string
  category: string
  sponsors?: string
  imageUrl?: string
  ownerId: string
  ownerName: string
  createdAt: Date
  updatedAt: Date
}

export interface Application {
  id: string
  eventId: string
  userId: string
  userName: string
  userEmail: string
  status: 'pending' | 'approved' | 'declined'
  createdAt: Date
  updatedAt?: Date
}

export interface UserProfile {
  fullName: string
  username: string
  country: string
  userType: 'volunteer' | 'event-owner'
  bio?: string
  profileImage?: string
  createdAt: Date
  updatedAt: Date
}
