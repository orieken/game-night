# API Design Documentation

> **Historical proposal:** This document describes the original Supabase design and is not the current application API. The app now uses Firebase Authentication, Cloud Firestore repositories, and Netlify Functions. See the root README and `docs/modernization-plan.md` for current architecture.

## Overview
RESTful API design for the Game Night Tracker application using Supabase backend.

**Base URL**: `https://your-project.supabase.co`
**API Version**: v1
**Authentication**: JWT Bearer tokens (Supabase Auth)

---

## Authentication

### Register User
```http
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "data": {
    "username": "gamer123",
    "display_name": "Pro Gamer"
  }
}

Response: 200 OK
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "username": "gamer123",
      "display_name": "Pro Gamer"
    }
  }
}
```

### Login
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response: 200 OK
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

### Logout
```http
POST /auth/v1/logout
Authorization: Bearer {access_token}

Response: 204 No Content
```

### Refresh Token
```http
POST /auth/v1/token?grant_type=refresh_token
Content-Type: application/json

{
  "refresh_token": "..."
}

Response: 200 OK
{
  "access_token": "new_token",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

---

## Users

### Get Current User
```http
GET /rest/v1/users?id=eq.{user_id}&select=*
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "gamer123",
  "display_name": "Pro Gamer",
  "avatar_url": "https://...",
  "bio": "Avid board game player",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Get User Profile
```http
GET /rest/v1/users?id=eq.{user_id}&select=*,user_stats(*)
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": "uuid",
  "username": "gamer123",
  "display_name": "Pro Gamer",
  "avatar_url": "https://...",
  "bio": "Avid board game player",
  "user_stats": {
    "total_games_played": 45,
    "total_wins": 18,
    "total_events_attended": 12,
    "total_achievements": 8,
    "total_points": 450,
    "unique_games_played": 15
  }
}
```

### Update User Profile
```http
PATCH /rest/v1/users?id=eq.{user_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "display_name": "Updated Name",
  "bio": "New bio text",
  "avatar_url": "https://new-avatar-url.com/image.jpg"
}

Response: 200 OK
{
  "id": "uuid",
  "username": "gamer123",
  "display_name": "Updated Name",
  "bio": "New bio text",
  "avatar_url": "https://new-avatar-url.com/image.jpg",
  "updated_at": "2024-01-20T14:30:00Z"
}
```

### Get User Achievements
```http
GET /rest/v1/user_achievements?user_id=eq.{user_id}&select=*,achievements(*)
Authorization: Bearer {access_token}

Response: 200 OK
[
  {
    "id": "uuid",
    "earned_at": "2024-01-10T12:00:00Z",
    "achievements": {
      "name": "First Win",
      "description": "Win your first game",
      "icon_url": "https://...",
      "points": 10,
      "tier": "bronze"
    }
  }
]
```

---

## Game Nights

### List Game Nights
```http
GET /rest/v1/game_nights?order=event_date.desc&limit=20
Authorization: Bearer {access_token}

Query Parameters:
- status: Filter by status (upcoming, in_progress, completed)
- host_id: Filter by host
- order: Sort order (event_date.asc, event_date.desc)
- limit: Number of results (default: 20)
- offset: Pagination offset

Response: 200 OK
[
  {
    "id": "uuid",
    "name": "Friday Night Gaming",
    "description": "Weekly casual game night",
    "event_date": "2024-12-25T19:00:00Z",
    "location": "Game Café Downtown",
    "status": "upcoming",
    "is_public": true,
    "max_attendees": 8,
    "created_at": "2024-12-01T10:00:00Z"
  }
]
```

### Get Game Night Details
```http
GET /rest/v1/game_nights?id=eq.{game_night_id}&select=*,attendees(*,users(*)),game_night_games(*,games(*))
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": "uuid",
  "name": "Friday Night Gaming",
  "description": "Weekly casual game night",
  "event_date": "2024-12-25T19:00:00Z",
  "location": "Game Café Downtown",
  "host_id": "uuid",
  "status": "upcoming",
  "is_public": true,
  "max_attendees": 8,
  "attendees": [
    {
      "status": "confirmed",
      "users": {
        "username": "alice",
        "display_name": "Alice",
        "avatar_url": "https://..."
      }
    }
  ],
  "game_night_games": [
    {
      "is_played": false,
      "games": {
        "name": "Catan",
        "image_url": "https://...",
        "min_players": 3,
        "max_players": 4
      }
    }
  ]
}
```

### Create Game Night
```http
POST /rest/v1/game_nights
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Friday Night Gaming",
  "description": "Weekly casual game night",
  "event_date": "2024-12-25T19:00:00Z",
  "location": "Game Café Downtown",
  "host_id": "{user_id}",
  "is_public": true,
  "max_attendees": 8
}

Response: 201 Created
{
  "id": "new-uuid",
  "name": "Friday Night Gaming",
  "event_date": "2024-12-25T19:00:00Z",
  "status": "upcoming",
  "created_at": "2024-12-21T10:00:00Z"
}
```

### Update Game Night
```http
PATCH /rest/v1/game_nights?id=eq.{game_night_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Updated Event Name",
  "description": "Updated description",
  "max_attendees": 10
}

Response: 200 OK
```

### Delete Game Night
```http
DELETE /rest/v1/game_nights?id=eq.{game_night_id}
Authorization: Bearer {access_token}

Response: 204 No Content
```

### Add Game to Game Night
```http
POST /rest/v1/game_night_games
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "game_night_id": "uuid",
  "game_id": "uuid",
  "added_by": "{user_id}"
}

Response: 201 Created
```

### Remove Game from Game Night
```http
DELETE /rest/v1/game_night_games?game_night_id=eq.{game_night_id}&game_id=eq.{game_id}
Authorization: Bearer {access_token}

Response: 204 No Content
```

---

## Games

### List Games
```http
GET /rest/v1/games?is_available=eq.true&order=name.asc
Authorization: Bearer {access_token}

Query Parameters:
- is_available: Filter by availability
- complexity: Filter by complexity (light, medium, heavy)
- min_players: Filter by minimum players
- max_players: Filter by maximum players
- search: Full-text search on name and description

Response: 200 OK
[
  {
    "id": "uuid",
    "name": "Catan",
    "description": "Settle the island of Catan",
    "min_players": 3,
    "max_players": 4,
    "avg_duration": 90,
    "complexity": "medium",
    "category": ["Strategy", "Trading"],
    "image_url": "https://...",
    "is_available": true
  }
]
```

### Get Game Details
```http
GET /rest/v1/games?id=eq.{game_id}&select=*
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": "uuid",
  "name": "Catan",
  "description": "Settle the island of Catan in this modern classic",
  "min_players": 3,
  "max_players": 4,
  "avg_duration": 90,
  "complexity": "medium",
  "category": ["Strategy", "Trading"],
  "image_url": "https://...",
  "bgg_id": 13,
  "is_available": true
}
```

### Create Game
```http
POST /rest/v1/games
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "New Game",
  "description": "A fun new game",
  "min_players": 2,
  "max_players": 6,
  "avg_duration": 45,
  "complexity": "light",
  "category": ["Party", "Card Game"],
  "image_url": "https://...",
  "is_available": true
}

Response: 201 Created
```

### Update Game
```http
PATCH /rest/v1/games?id=eq.{game_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "is_available": false,
  "avg_duration": 60
}

Response: 200 OK
```

---

## Attendees

### Add Attendee
```http
POST /rest/v1/attendees
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "game_night_id": "uuid",
  "user_id": "uuid",
  "status": "invited",
  "invited_by": "{host_user_id}"
}

Response: 201 Created
```

### Update Attendance Status
```http
PATCH /rest/v1/attendees?game_night_id=eq.{game_night_id}&user_id=eq.{user_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "confirmed",
  "responded_at": "2024-12-21T10:00:00Z"
}

Response: 200 OK
```

### Remove Attendee
```http
DELETE /rest/v1/attendees?game_night_id=eq.{game_night_id}&user_id=eq.{user_id}
Authorization: Bearer {access_token}

Response: 204 No Content
```

---

## Game Sessions

### Start Game Session
```http
POST /rest/v1/game_sessions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "game_night_id": "uuid",
  "game_id": "uuid",
  "started_at": "2024-12-25T20:00:00Z"
}

Response: 201 Created
{
  "id": "new-session-uuid",
  "game_night_id": "uuid",
  "game_id": "uuid",
  "started_at": "2024-12-25T20:00:00Z",
  "ended_at": null
}
```

### End Game Session
```http
PATCH /rest/v1/game_sessions?id=eq.{session_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "ended_at": "2024-12-25T21:30:00Z",
  "notes": "Great game! Very close finish."
}

Response: 200 OK
{
  "id": "session-uuid",
  "ended_at": "2024-12-25T21:30:00Z",
  "duration": 90,
  "notes": "Great game! Very close finish."
}
```

### Record Session Results
```http
POST /rest/v1/game_session_players
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "session_id": "uuid",
  "user_id": "uuid",
  "placement": 1,
  "score": 150
}

Response: 201 Created
```

### Bulk Record Results
```http
POST /rest/v1/rpc/record_session_results
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "session_id": "uuid",
  "results": [
    {"user_id": "uuid1", "placement": 1, "score": 150},
    {"user_id": "uuid2", "placement": 2, "score": 120},
    {"user_id": "uuid3", "placement": 3, "score": 90}
  ]
}

Response: 200 OK
{
  "success": true,
  "records_created": 3
}
```

---

## Voting

### Submit Vote
```http
POST /rest/v1/game_votes
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "game_night_id": "uuid",
  "game_id": "uuid",
  "user_id": "{user_id}",
  "rating": 5,
  "comment": "Amazing game! Would definitely play again.",
  "would_play_again": true
}

Response: 201 Created
```

### Update Vote
```http
PATCH /rest/v1/game_votes?game_night_id=eq.{gn_id}&game_id=eq.{g_id}&user_id=eq.{u_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated: Still great but not perfect."
}

Response: 200 OK
```

### Get Game Night Votes
```http
GET /rest/v1/game_votes?game_night_id=eq.{game_night_id}&select=*,users(username,display_name,avatar_url),games(name)
Authorization: Bearer {access_token}

Response: 200 OK
[
  {
    "rating": 5,
    "comment": "Amazing game!",
    "would_play_again": true,
    "created_at": "2024-12-26T10:00:00Z",
    "users": {
      "username": "alice",
      "display_name": "Alice",
      "avatar_url": "https://..."
    },
    "games": {
      "name": "Catan"
    }
  }
]
```

---

## Leaderboard

### Get Overall Leaderboard
```http
GET /rest/v1/user_stats?select=*&order=total_points.desc&limit=10
Authorization: Bearer {access_token}

Response: 200 OK
[
  {
    "user_id": "uuid",
    "username": "champion",
    "display_name": "The Champion",
    "avatar_url": "https://...",
    "total_games_played": 100,
    "total_wins": 45,
    "total_events_attended": 30,
    "total_achievements": 15,
    "total_points": 1250,
    "unique_games_played": 25
  }
]
```

### Get Monthly Leaderboard
```http
GET /rest/v1/rpc/monthly_leaderboard
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "month": "2024-12",
  "limit": 10
}

Response: 200 OK
[
  {
    "user_id": "uuid",
    "username": "player1",
    "wins": 12,
    "games_played": 20,
    "points": 180
  }
]
```

### Get Game-Specific Leaderboard
```http
GET /rest/v1/rpc/game_leaderboard
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "game_id": "uuid",
  "limit": 10
}

Response: 200 OK
[
  {
    "user_id": "uuid",
    "username": "catan_master",
    "wins": 25,
    "games_played": 40,
    "win_rate": 0.625
  }
]
```

---

## AI/ML Endpoints (Edge Functions)

### Get Game Recommendations
```http
POST /functions/v1/recommend-games
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "game_night_id": "uuid",
  "selected_games": ["uuid1", "uuid2"],
  "player_count": 4,
  "max_duration": 90
}

Response: 200 OK
{
  "recommendations": [
    {
      "game_id": "uuid",
      "name": "7 Wonders",
      "confidence": 0.87,
      "reason": "Complements strategy games, fits player count"
    },
    {
      "game_id": "uuid",
      "name": "Azul",
      "confidence": 0.75,
      "reason": "Different mechanics, quick to play"
    }
  ]
}
```

### Get Balanced Teams
```http
POST /functions/v1/suggest-teams
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "player_ids": ["uuid1", "uuid2", "uuid3", "uuid4"],
  "game_id": "uuid",
  "team_count": 2
}

Response: 200 OK
{
  "teams": [
    {
      "team": 1,
      "players": ["uuid1", "uuid3"],
      "avg_skill": 0.72
    },
    {
      "team": 2,
      "players": ["uuid2", "uuid4"],
      "avg_skill": 0.71
    }
  ],
  "balance_score": 0.95
}
```

### Get Optimal Schedule
```http
POST /functions/v1/optimal-schedule
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "player_ids": ["uuid1", "uuid2", "uuid3"],
  "week_range": {
    "start": "2024-12-25",
    "end": "2025-01-01"
  }
}

Response: 200 OK
{
  "recommended_dates": [
    {
      "date": "2024-12-27T19:00:00Z",
      "availability_score": 0.95,
      "predicted_attendance": 8
    }
  ]
}
```

---

## RPC (Remote Procedure Call) Functions

### Refresh User Stats
```http
POST /rest/v1/rpc/refresh_user_stats
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true
}
```

### Award Achievement
```http
POST /rest/v1/rpc/award_achievement
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "user_id": "uuid",
  "achievement_id": "uuid"
}

Response: 200 OK
{
  "success": true,
  "already_awarded": false
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "code": "400",
  "message": "Invalid request body",
  "details": "Field 'name' is required"
}
```

### 401 Unauthorized
```json
{
  "code": "401",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "code": "403",
  "message": "Insufficient permissions to perform this action"
}
```

### 404 Not Found
```json
{
  "code": "404",
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "code": "409",
  "message": "Resource already exists",
  "details": "User already voted on this game"
}
```

### 500 Internal Server Error
```json
{
  "code": "500",
  "message": "Internal server error",
  "details": "An unexpected error occurred"
}
```

---

## Rate Limiting

- **Anonymous requests**: 100 requests per hour
- **Authenticated requests**: 1000 requests per hour
- **Heavy endpoints** (AI/ML): 50 requests per hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1703174400
```

---

## Pagination

For large result sets, use `limit` and `offset`:

```http
GET /rest/v1/game_nights?limit=20&offset=40
```

Response includes:
```
Content-Range: 40-59/150
```

---

## Filtering & Sorting

### Operators
- `eq`: Equal
- `neq`: Not equal
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `like`: Pattern matching
- `in`: In list

### Examples
```http
GET /rest/v1/games?complexity=eq.medium
GET /rest/v1/games?min_players=gte.3
GET /rest/v1/games?name=like.*Catan*
GET /rest/v1/games?category=cs.{Strategy}
```

### Sorting
```http
GET /rest/v1/games?order=name.asc
GET /rest/v1/games?order=created_at.desc,name.asc
```
