# Game Night Tracker - Web App Prototype Brief

**Live app:** [rieken-game-night.netlify.app](https://rieken-game-night.netlify.app/)

## Product Vision
A social gaming platform that transforms casual game nights into engaging competitions with intelligent recommendations, gamification, and community features.

---

## Core Features

### User Management
- User registration and authentication
- Player profiles with stats and achievements
- Social connections between players

### Event Management
- Create game night events with date/time/location
- Pre-select games from venue inventory
- Add games dynamically during events
- Track attendees and RSVPs

### Game Session Tracking
- Record games played during each event
- Track winners and participants per game
- Session duration and completion tracking
- Post-game voting and ratings

### Gamification & Leaderboards
- **Points System**: Wins, participation, streaks, variety bonuses
- **Achievement Badges**: First win, attendance milestones, game variety, comeback victories
- **Leaderboards**: Overall, per-game, monthly champions, most social player
- **Challenges**: Head-to-head rivalries, team tournaments, themed nights

### AI/ML Features

#### Game Recommendation Engine
- Analyze past game selections and ratings
- Consider player preferences and attendance patterns
- Suggest complementary games based on event context (number of players, duration, difficulty mix)
- Recommend new games to add to venue inventory based on trends

#### Additional AI Opportunities
- **Match Balancing**: Suggest player pairings/teams for competitive balance
- **Optimal Game Sequencing**: Recommend game order based on energy levels and duration
- **Sentiment Analysis**: Analyze vote patterns to predict game popularity
- **Predictive Attendance**: Forecast turnout based on historical patterns
- **Smart Scheduling**: Suggest optimal game night times based on availability

---

## Technical Stack

### Frontend
- **Framework**: Vue 3 (Composition API)
- **State Management**: Pinia
- **UI Components**: Consider Vuetify, PrimeVue, or custom with TailwindCSS
- **Testing**: Vitest (unit/integration), Playwright (E2E)

### Backend Options
- **Option 1**: Serverless functions (Netlify Functions) + Supabase
- **Option 2**: Firebase (Auth + Firestore + Functions)
- **Option 3**: PocketBase (self-hosted lightweight backend)
- **Recommendation**: Supabase for robust features, real-time capabilities, and edge functions for ML

### Data Storage
- **User Data**: Supabase PostgreSQL
- **Real-time Updates**: Supabase real-time subscriptions
- **File Storage**: Avatar images, game photos (Supabase Storage)
- **ML Models**: Edge functions or integration with external API

### Deployment
- **Hosting**: Netlify
- **Production URL**: [https://rieken-game-night.netlify.app/](https://rieken-game-night.netlify.app/)
- **Environment variables**: Firebase browser configuration uses the `VITE_FIREBASE_*` names from `.env.example`. Configure these in Netlify so Vite exposes them to the client build.
- **CI/CD**: GitHub Actions with automated testing
- **Environment Management**: Staging and production branches

---

## Architecture Principles

### Clean Architecture Layers
```
┌─────────────────────────────────────┐
│  Presentation (Vue Components)      │
├─────────────────────────────────────┤
│  Application (Pinia Stores, Services)│
├─────────────────────────────────────┤
│  Domain (Entities, Use Cases)       │
├─────────────────────────────────────┤
│  Infrastructure (API, Database)     │
└─────────────────────────────────────┘
```

### Project Structure
```
/src
  /components      # Vue components
  /composables     # Vue composition functions
  /stores          # Pinia stores
  /domain          # Business logic, entities
  /services        # Application services
  /infrastructure  # API clients, repositories
  /utils           # Shared utilities
  /types           # TypeScript definitions

/tests
  /unit           # Vitest unit tests
  /integration    # Vitest integration tests
  /e2e            # Playwright E2E tests

/docs
  /agents         # AI agent coding rules
  /architecture   # ADRs and design docs
  /api            # API documentation
```

---

## Four Mockup Concepts

### Mockup 1: "Board Game Café Aesthetic"
**Theme**: Warm, inviting, tactile
**Color Palette**: Warm browns, cream, forest green, gold accents
**Typography**: Serif headings, clean sans-serif body
**Key Elements**:
- Card-based layout with subtle shadows (physical game box feel)
- Wooden texture backgrounds
- Illustrated game pieces as icons (meeples, dice, cards)
- Physical trophy/medal imagery for leaderboard
- Retro-inspired achievement badges
- Polaroid-style photos for event memories

**UX Focus**: Nostalgia, community, cozy gathering

---

### Mockup 2: "Modern Minimalist Dashboard"
**Theme**: Clean, data-driven, professional
**Color Palette**: White, light gray, accent blue/purple
**Typography**: Modern sans-serif (Inter, Poppins)
**Key Elements**:
- Sleek glassmorphism cards with blur effects
- Data visualization charts (wins over time, game popularity)
- Minimalist icons and illustrations
- Clean table layouts for leaderboards
- Subtle animations on hover/interaction
- Professional sports scoreboard aesthetic

**UX Focus**: Clarity, stats, performance tracking

---

### Mockup 3: "Playful Gamification Focus"
**Theme**: Energetic, achievement-driven, fun
**Color Palette**: Bright primary colors, gradients
**Typography**: Bold, rounded fonts
**Key Elements**:
- RPG-style character avatars with levels
- Animated progress bars and XP meters
- Quest board for challenges
- Pixel art or illustrated badge designs
- Confetti animations for achievements
- Power-up style game recommendations
- Battle/duel interfaces for head-to-head

**UX Focus**: Progression, rewards, competition

---

### Mockup 4: "Social Feed Experience"
**Theme**: Connected, shareable, mobile-first
**Color Palette**: Instagram-inspired with brand colors
**Typography**: Clean, readable mobile fonts
**Key Elements**:
- Vertical feed of game night "stories"
- Social reactions (likes, emojis) on games/results
- Story-style highlights with circular avatars
- Comment threads on events
- Share buttons for social media
- Activity notifications feed
- Swipe gestures for mobile interactions

**UX Focus**: Social engagement, mobile experience, shareability

---

## Implementation Roadmap

### Phase 1: MVP (Weeks 1-4)
- [ ] Project setup (Vue 3, Vite, TypeScript, Vitest, Playwright)
- [ ] Authentication (Supabase Auth)
- [ ] Basic user profiles
- [ ] Create game night events
- [ ] Add games to game library
- [ ] Select games for game night
- [ ] Basic session tracking (winners only)
- [ ] Simple leaderboard (win count)

### Phase 2: Gamification (Weeks 5-6)
- [ ] Points system implementation
- [ ] Achievement system
- [ ] Enhanced leaderboards (multiple categories)
- [ ] Badges and progression
- [ ] Challenges framework

### Phase 3: Social Features (Weeks 7-8)
- [ ] Voting and rating system
- [ ] Comments on events
- [ ] Activity feed
- [ ] User connections/friends
- [ ] Notifications

### Phase 4: AI/ML Integration (Weeks 9-10)
- [ ] Game recommendation engine (collaborative filtering)
- [ ] Match balancing algorithm
- [ ] Sentiment analysis on votes
- [ ] Predictive attendance model
- [ ] Smart scheduling suggestions

### Phase 5: Polish & Launch (Weeks 11-12)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Mobile responsiveness
- [ ] User testing and feedback
- [ ] Production deployment
- [ ] Analytics integration

---

## Success Metrics

### Engagement
- Daily/Weekly active users
- Game nights created per week
- Average attendance per event
- Games played per event
- User retention rate

### Gamification
- Achievement unlock rate
- Leaderboard competition (users in top 10)
- Challenge participation rate
- Average session duration

### AI/ML
- Recommendation acceptance rate
- Team balance satisfaction scores
- Schedule suggestion adoption
- Prediction accuracy (attendance)

---

## Next Steps

1. **Choose Mockup**: Review the 4 concepts and select primary design direction
2. **Setup Project**: Initialize repository with tech stack
3. **Create Agent Docs**: Finalize `/docs/agents` directory with coding standards
4. **Database Setup**: Configure Supabase and create schema
5. **First Feature (TDD)**: Build authentication with tests first
6. **CI/CD Pipeline**: Setup GitHub Actions with Netlify deployment

**Ready to start building?** 🚀
