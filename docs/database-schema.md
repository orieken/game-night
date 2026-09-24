# Database Schema

> **Historical proposal:** This PostgreSQL/Supabase schema is retained for design history only. The running app uses group-scoped Cloud Firestore collections governed by `firestore.rules` and `firestore.indexes.json`.

## Overview
This document defines the PostgreSQL database schema for the Game Night Tracker application using Supabase.

---

## Tables

### users
User accounts and profiles.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### game_nights
Game night events.

```sql
CREATE TABLE game_nights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  max_attendees INTEGER,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_game_nights_host ON game_nights(host_id);
CREATE INDEX idx_game_nights_date ON game_nights(event_date DESC);
CREATE INDEX idx_game_nights_status ON game_nights(status);

-- Trigger
CREATE TRIGGER update_game_nights_updated_at
  BEFORE UPDATE ON game_nights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### games
Game library/inventory.

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  min_players INTEGER NOT NULL DEFAULT 1,
  max_players INTEGER NOT NULL DEFAULT 10,
  avg_duration INTEGER, -- in minutes
  complexity TEXT CHECK (complexity IN ('light', 'medium', 'heavy')),
  category TEXT[],
  image_url TEXT,
  bgg_id INTEGER, -- BoardGameGeek ID
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_games_name ON games(name);
CREATE INDEX idx_games_available ON games(is_available);
CREATE INDEX idx_games_complexity ON games(complexity);

-- Full-text search
CREATE INDEX idx_games_search ON games USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Trigger
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### game_night_games
Many-to-many relationship between game nights and games.

```sql
CREATE TABLE game_night_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_night_id UUID REFERENCES game_nights(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id),
  is_played BOOLEAN DEFAULT false,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_night_id, game_id)
);

-- Indexes
CREATE INDEX idx_game_night_games_event ON game_night_games(game_night_id);
CREATE INDEX idx_game_night_games_game ON game_night_games(game_id);
```

---

### game_sessions
Individual game sessions played during game nights.

```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_night_id UUID REFERENCES game_nights(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in minutes, calculated
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_game_sessions_game_night ON game_sessions(game_night_id);
CREATE INDEX idx_game_sessions_game ON game_sessions(game_id);
CREATE INDEX idx_game_sessions_started ON game_sessions(started_at DESC);

-- Trigger
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to calculate duration
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_game_session_duration
  BEFORE INSERT OR UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();
```

---

### game_session_players
Players participating in game sessions with results.

```sql
CREATE TABLE game_session_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  placement INTEGER, -- 1 for winner, 2 for second, etc.
  score INTEGER,
  team TEXT, -- Optional team identifier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Indexes
CREATE INDEX idx_session_players_session ON game_session_players(session_id);
CREATE INDEX idx_session_players_user ON game_session_players(user_id);
CREATE INDEX idx_session_players_placement ON game_session_players(placement);
```

---

### attendees
Game night attendees with RSVP status.

```sql
CREATE TABLE attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_night_id UUID REFERENCES game_nights(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined', 'attended', 'no_show')),
  invited_by UUID REFERENCES users(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_night_id, user_id)
);

-- Indexes
CREATE INDEX idx_attendees_game_night ON attendees(game_night_id);
CREATE INDEX idx_attendees_user ON attendees(user_id);
CREATE INDEX idx_attendees_status ON attendees(status);

-- Trigger
CREATE TRIGGER update_attendees_updated_at
  BEFORE UPDATE ON attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### game_votes
User ratings and reviews for games after game nights.

```sql
CREATE TABLE game_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_night_id UUID REFERENCES game_nights(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  would_play_again BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_night_id, game_id, user_id)
);

-- Indexes
CREATE INDEX idx_game_votes_game_night ON game_votes(game_night_id);
CREATE INDEX idx_game_votes_game ON game_votes(game_id);
CREATE INDEX idx_game_votes_user ON game_votes(user_id);
CREATE INDEX idx_game_votes_rating ON game_votes(rating);

-- Trigger
CREATE TRIGGER update_game_votes_updated_at
  BEFORE UPDATE ON game_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### achievements
Achievement definitions.

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_url TEXT,
  category TEXT CHECK (category IN ('wins', 'participation', 'social', 'variety', 'special')),
  points INTEGER DEFAULT 0,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  criteria JSONB NOT NULL, -- Flexible criteria for different achievement types
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_active ON achievements(is_active);

-- Example criteria JSONB structure:
-- {
--   "type": "first_win",
--   "threshold": 1
-- }
-- {
--   "type": "total_wins",
--   "threshold": 100,
--   "game_id": "uuid-optional"
-- }
-- {
--   "type": "streak",
--   "threshold": 5
-- }
```

---

### user_achievements
User achievement tracking.

```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress JSONB, -- Current progress towards achievement
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_earned ON user_achievements(earned_at DESC);
```

---

### user_stats
Materialized view for user statistics (for performance).

```sql
CREATE MATERIALIZED VIEW user_stats AS
SELECT
  u.id as user_id,
  u.username,
  u.display_name,
  u.avatar_url,
  COUNT(DISTINCT gsp.session_id) as total_games_played,
  COUNT(DISTINCT CASE WHEN gsp.placement = 1 THEN gsp.session_id END) as total_wins,
  COUNT(DISTINCT a.game_night_id) as total_events_attended,
  COUNT(DISTINCT ua.achievement_id) as total_achievements,
  COALESCE(SUM(ach.points), 0) as total_points,
  COUNT(DISTINCT gsp2.game_id) as unique_games_played,
  MAX(gsp.created_at) as last_played_at
FROM users u
LEFT JOIN game_session_players gsp ON u.id = gsp.user_id
LEFT JOIN attendees a ON u.id = a.user_id AND a.status = 'attended'
LEFT JOIN user_achievements ua ON u.id = ua.user_id
LEFT JOIN achievements ach ON ua.achievement_id = ach.id
LEFT JOIN game_session_players gsp2 ON u.id = gsp2.user_id
GROUP BY u.id, u.username, u.display_name, u.avatar_url;

-- Indexes
CREATE UNIQUE INDEX idx_user_stats_user ON user_stats(user_id);
CREATE INDEX idx_user_stats_points ON user_stats(total_points DESC);
CREATE INDEX idx_user_stats_wins ON user_stats(total_wins DESC);

-- Refresh materialized view periodically
-- Can be triggered manually or on schedule
-- REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
```

---

### friendships
User connections/friendships.

```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Indexes
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Trigger
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### activity_feed
Activity feed for social features.

```sql
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'game_night_created',
    'game_played',
    'achievement_earned',
    'game_voted',
    'friend_added',
    'leaderboard_position'
  )),
  entity_id UUID, -- ID of the related entity (game_night, session, etc.)
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_entity ON activity_feed(entity_id);

-- Example metadata JSONB:
-- {
--   "game_name": "Catan",
--   "placement": 1,
--   "opponents": ["Alice", "Bob"]
-- }
```

---

### notifications
User notifications.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'game_night_invitation',
    'game_night_reminder',
    'achievement_unlocked',
    'friend_request',
    'game_night_update',
    'leaderboard_change'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

## Utility Functions

### Updated At Trigger Function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Row Level Security (RLS) Policies

### Users Table
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### Game Nights Table
```sql
ALTER TABLE game_nights ENABLE ROW LEVEL SECURITY;

-- Everyone can view public game nights
CREATE POLICY "Public game nights are viewable by all"
  ON game_nights FOR SELECT
  USING (is_public = true);

-- Users can view game nights they're invited to
CREATE POLICY "Users can view invited game nights"
  ON game_nights FOR SELECT
  USING (
    id IN (
      SELECT game_night_id FROM attendees
      WHERE user_id = auth.uid()
    )
  );

-- Users can create game nights
CREATE POLICY "Users can create game nights"
  ON game_nights FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Hosts can update their own game nights
CREATE POLICY "Hosts can update own game nights"
  ON game_nights FOR UPDATE
  USING (auth.uid() = host_id);

-- Hosts can delete their own game nights
CREATE POLICY "Hosts can delete own game nights"
  ON game_nights FOR DELETE
  USING (auth.uid() = host_id);
```

### Game Votes Table
```sql
ALTER TABLE game_votes ENABLE ROW LEVEL SECURITY;

-- Users can view all votes
CREATE POLICY "Users can view all votes"
  ON game_votes FOR SELECT
  USING (true);

-- Users can create their own votes
CREATE POLICY "Users can create own votes"
  ON game_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
  ON game_votes FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## Seed Data

### Sample Achievements
```sql
INSERT INTO achievements (name, description, category, points, tier, criteria) VALUES
  ('First Win', 'Win your first game', 'wins', 10, 'bronze', '{"type": "total_wins", "threshold": 1}'),
  ('Victorious', 'Win 10 games', 'wins', 50, 'silver', '{"type": "total_wins", "threshold": 10}'),
  ('Champion', 'Win 50 games', 'wins', 200, 'gold', '{"type": "total_wins", "threshold": 50}'),
  ('Legend', 'Win 100 games', 'wins', 500, 'platinum', '{"type": "total_wins", "threshold": 100}'),

  ('Social Butterfly', 'Attend 10 game nights', 'participation', 50, 'silver', '{"type": "events_attended", "threshold": 10}'),
  ('Regular', 'Attend 25 game nights', 'participation', 150, 'gold', '{"type": "events_attended", "threshold": 25}'),

  ('Explorer', 'Play 10 different games', 'variety', 75, 'silver', '{"type": "unique_games", "threshold": 10}'),
  ('Connoisseur', 'Play 25 different games', 'variety', 200, 'gold', '{"type": "unique_games", "threshold": 25}'),

  ('On Fire', 'Win 3 games in a row', 'special', 100, 'gold', '{"type": "win_streak", "threshold": 3}'),
  ('Comeback Kid', 'Win after losing 5 games', 'special', 75, 'silver', '{"type": "comeback", "losses": 5}'),

  ('Friend Magnet', 'Add 10 friends', 'social', 50, 'silver', '{"type": "friends", "threshold": 10}'),
  ('Host with the Most', 'Host 5 game nights', 'social', 100, 'gold', '{"type": "hosted_events", "threshold": 5}');
```

### Sample Games
```sql
INSERT INTO games (name, description, min_players, max_players, avg_duration, complexity, category) VALUES
  ('Catan', 'Settle the island of Catan in this modern classic', 3, 4, 90, 'medium', ARRAY['Strategy', 'Trading']),
  ('Ticket to Ride', 'Build train routes across the country', 2, 5, 60, 'light', ARRAY['Strategy', 'Set Collection']),
  ('Pandemic', 'Work together to save humanity from diseases', 2, 4, 45, 'medium', ARRAY['Cooperative', 'Strategy']),
  ('Codenames', 'Give one-word clues to help your team identify agents', 4, 8, 15, 'light', ARRAY['Party', 'Word Game']),
  ('7 Wonders', 'Lead a civilization and build your city', 2, 7, 30, 'medium', ARRAY['Strategy', 'Card Drafting']),
  ('Azul', 'Draft tiles to create beautiful patterns', 2, 4, 45, 'light', ARRAY['Abstract', 'Pattern Building']),
  ('Wingspan', 'Attract birds to your wildlife preserve', 1, 5, 60, 'medium', ARRAY['Strategy', 'Engine Building']),
  ('Splendor', 'Collect gems and impress nobles', 2, 4, 30, 'light', ARRAY['Strategy', 'Engine Building']);
```

---

## Migration Scripts

### Initial Migration
```sql
-- migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all tables in order
-- (Include all CREATE TABLE statements from above)

-- Create indexes
-- (Include all CREATE INDEX statements from above)

-- Create functions
-- (Include utility functions)

-- Enable RLS
-- (Include RLS policies)

-- Insert seed data
-- (Include seed data)
```

### Future Migrations
```sql
-- migrations/002_add_game_ratings.sql
ALTER TABLE games ADD COLUMN avg_rating DECIMAL(3,2);
ALTER TABLE games ADD COLUMN rating_count INTEGER DEFAULT 0;

-- migrations/003_add_user_preferences.sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_game_categories TEXT[],
  preferred_complexity TEXT[],
  notification_settings JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Database Maintenance

### Refresh Materialized Views
```sql
-- Run periodically (e.g., every hour via cron job)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
```

### Cleanup Old Activity Feed
```sql
-- Delete activity feed items older than 90 days
DELETE FROM activity_feed
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Vacuum and Analyze
```sql
-- Run weekly
VACUUM ANALYZE;
```
