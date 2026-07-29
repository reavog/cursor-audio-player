# Personal Audio Media Player - Requirements Document

**Project Goal:** Build a personal audio media player with playlist management capabilities, progressing from local development to AWS cloud deployment.

**Learning Objectives:**
- Master Java Spring Boot backend development
- Build a modern frontend with React or Angular
- Deploy and scale infrastructure on AWS
- Implement production-ready patterns (authentication, error handling, logging)

---

## Phase 1: Local Development (Weeks 1-3)

### 1.1 Project Setup & Infrastructure

**Database:** PostgreSQL (local, via Docker)
**Backend:** Java Spring Boot 3.x
**Frontend:** React or Angular (choose one)
**Development Environment:** Docker Compose for local stack

**Acceptance Criteria:**
- [ ] Spring Boot application runs locally
- [ ] PostgreSQL database container spins up via Docker Compose
- [ ] Frontend development server runs on localhost:3000
- [ ] Backend API runs on localhost:8080
- [ ] All endpoints are documented with Swagger/OpenAPI

---

### 1.2 User Management

**As a** user  
**I want to** create an account and log in securely  
**So that** my audio library and playlists are private to me

**Features:**
- User registration (email, password, username)
- User login with JWT token authentication
- Password hashing (bcrypt)
- JWT token refresh mechanism
- User profile endpoint (retrieve current user info)

**API Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me
```

**Database Schema:**
- users table (id, username, email, password_hash, created_at)

**Acceptance Criteria:**
- [ ] User can register with email validation
- [ ] User can log in and receive JWT token
- [ ] JWT token is required for all subsequent requests
- [ ] Token expires after 1 hour, refresh token lasts 7 days
- [ ] Password is hashed and never stored in plaintext
- [ ] User info endpoint returns only authenticated user's data

---

### 1.3 Song Library Management

**As a** user  
**I want to** upload audio files and manage my song library  
**So that** I can organize and play my personal music collection

**Features:**
- Upload MP3/WAV/FLAC audio files (limit: 100MB per file)
- Store audio files locally on disk
- List all songs in library with metadata
- Search songs by title, artist, or album
- Delete songs from library
- Edit song metadata (title, artist, album, duration)
- View song details (duration, file size, upload date)

**API Endpoints:**
```
POST   /api/songs/upload
GET    /api/songs
GET    /api/songs/{id}
GET    /api/songs/search?q=query
PUT    /api/songs/{id}
DELETE /api/songs/{id}
```

**Database Schema:**
- songs table (id, user_id, title, artist, album, duration, file_path, file_size, uploaded_at)

**File Storage:**
- Local directory: `/data/uploads/songs/{user_id}/`
- Files named by UUID to avoid conflicts

**Acceptance Criteria:**
- [ ] User can upload audio file (max 100MB)
- [ ] File is stored locally with metadata in database
- [ ] Audio file metadata is extracted (duration, bitrate)
- [ ] User can list all their songs
- [ ] User can search songs by title/artist
- [ ] User can edit song metadata
- [ ] User can delete a song (removes file + database record)
- [ ] Only authenticated user can see/modify their own songs
- [ ] Attempting to upload unsupported format is rejected

---

### 1.4 Playlist Management

**As a** user  
**I want to** create playlists and manage songs within them  
**So that** I can organize my music by mood, genre, or activity

**Features:**
- Create playlist (name, description)
- View all playlists
- View songs in a playlist (with order)
- Add songs to playlist
- Remove songs from playlist
- Reorder songs within playlist (drag-and-drop friendly)
- Edit playlist metadata (name, description)
- Delete playlist
- View playlist details (creation date, song count, total duration)

**API Endpoints:**
```
POST   /api/playlists
GET    /api/playlists
GET    /api/playlists/{id}
PUT    /api/playlists/{id}
DELETE /api/playlists/{id}

POST   /api/playlists/{id}/songs
GET    /api/playlists/{id}/songs
PUT    /api/playlists/{id}/songs/{songId}
DELETE /api/playlists/{id}/songs/{songId}
POST   /api/playlists/{id}/songs/reorder
```

**Database Schema:**
- playlists table (id, user_id, name, description, created_at, updated_at)
- playlist_songs table (id, playlist_id, song_id, position, added_at)

**Acceptance Criteria:**
- [ ] User can create a playlist with name and optional description
- [ ] User can view all their playlists
- [ ] User can add a song to a playlist
- [ ] User can remove a song from a playlist
- [ ] User can reorder songs within a playlist via position field
- [ ] User can view all songs in a playlist (ordered by position)
- [ ] User can edit playlist name/description
- [ ] User can delete a playlist (cascade delete playlist_songs)
- [ ] Playlist shows total duration of all songs
- [ ] Only playlist owner can modify playlists
- [ ] Cannot add the same song to a playlist twice

---

### 1.5 Playback & History

**As a** user  
**I want to** track what songs I play  
**So that** I can see my listening habits and resume playback

**Features:**
- Record play history (song, timestamp, duration played)
- View play history (list last 50 plays, newest first)
- Get most played songs (aggregate data)
- Stream audio file for playback (with proper HTTP range headers for seeking)

**API Endpoints:**
```
POST   /api/history
GET    /api/history
GET    /api/history/top-songs
GET    /api/songs/{id}/stream
```

**Database Schema:**
- play_history table (id, user_id, song_id, played_at, duration_played)

**Stream Response:**
- Support HTTP 206 Partial Content for seeking
- Return audio file with proper Content-Type headers
- Include Content-Length and Accept-Ranges headers

**Acceptance Criteria:**
- [ ] When user plays a song, a play_history record is created
- [ ] User can view their play history (paginated, 50 per page)
- [ ] User can see which songs they play most frequently
- [ ] Audio streaming endpoint supports byte range requests (for seeking)
- [ ] Stream endpoint returns appropriate HTTP status codes (200, 206, 416)
- [ ] Only authenticated user can access their own history

---

### 1.6 Frontend UI (React or Angular)

**As a** user  
**I want to** interact with my audio library through an intuitive interface  
**So that** I can easily manage my music and playlists

**Pages/Components:**

**Authentication:**
- [ ] Login page (email, password, submit button, error messages)
- [ ] Register page (username, email, password, confirm password)
- [ ] Redirect to login if not authenticated
- [ ] Logout functionality in navbar

**Library Page:**
- [ ] Display all songs in a table (title, artist, album, duration, upload date)
- [ ] Search bar (filters songs in real-time)
- [ ] Upload button → file picker for audio files
- [ ] Delete button for each song
- [ ] Edit metadata modal for each song
- [ ] Show loading state during upload
- [ ] Show success/error notifications

**Playlists Page:**
- [ ] List all playlists (name, song count, total duration, created date)
- [ ] Create new playlist button → modal form
- [ ] Edit playlist button → modal to rename/update description
- [ ] Delete playlist button with confirmation
- [ ] Click playlist to view songs

**Playlist Detail Page:**
- [ ] Show playlist name, description, total duration
- [ ] Display all songs in playlist (ordered by position)
- [ ] Search box to find songs in library to add
- [ ] Add song button → shows available songs, adds to playlist
- [ ] Remove song button for each song in playlist
- [ ] Drag-and-drop or up/down buttons to reorder songs
- [ ] Back button to return to playlists list

**Player Component (Global):**
- [ ] Now-playing info (song title, artist, duration)
- [ ] Progress bar with current time display (clickable for seeking)
- [ ] Play/Pause button
- [ ] Skip Next button
- [ ] Skip Previous button
- [ ] Shuffle toggle
- [ ] Repeat mode toggle (off, repeat all, repeat one)
- [ ] Volume control
- [ ] Queue indicator (showing current song position in playlist)

**History Page:**
- [ ] Display last 50 plays (song, artist, played time)
- [ ] Show most played songs (bar chart or list with play counts)
- [ ] Pagination or infinite scroll

**Acceptance Criteria:**
- [ ] All pages are responsive (mobile-friendly)
- [ ] Loading states show during API calls
- [ ] Error messages display clearly (400, 401, 404, 500 errors)
- [ ] User can perform all CRUD operations from UI
- [ ] Player persists across page navigation
- [ ] Audio playback works smoothly with seeking

---

### 1.7 Error Handling & Validation

**Acceptance Criteria:**
- [ ] Backend returns meaningful error messages with HTTP status codes
- [ ] Frontend displays validation errors for user input
- [ ] Invalid file uploads are rejected with clear feedback
- [ ] JWT expiration is handled gracefully (redirect to login)
- [ ] Network errors are caught and displayed to user
- [ ] Database constraints prevent invalid data (unique emails, etc.)

---

### 1.8 Testing (Phase 1)

**Backend:**
- [ ] Unit tests for service layer (50%+ code coverage)
- [ ] Integration tests for API endpoints
- [ ] Test user authentication flows
- [ ] Test playlist CRUD operations

**Frontend:**
- [ ] Component tests for key UI components
- [ ] Mock API calls for testing without backend
- [ ] Test user interactions (login, upload, playlist creation)

---

## Phase 2: AWS Deployment (Weeks 4-6)

### 2.1 AWS Infrastructure Setup

**Goal:** Migrate from local development to a scalable AWS architecture.

**Services to Use:**
- **S3:** Store audio files (replacing local `/data/uploads/`)
- **RDS:** PostgreSQL database (replacing local Postgres container)
- **EC2 or ECS:** Run Spring Boot application
- **CloudFront:** CDN for audio streaming (cache frequently played songs)
- **CloudWatch:** Logging and monitoring
- **IAM:** Secure access to AWS resources

**Acceptance Criteria:**
- [ ] S3 bucket created with proper permissions (private, signed URLs for access)
- [ ] RDS PostgreSQL instance running (multi-AZ for reliability)
- [ ] Spring Boot application containerized (Dockerfile)
- [ ] Application deployed to ECS (Fargate) or EC2 instance
- [ ] CloudFront distribution configured for audio streaming
- [ ] Environment variables for AWS credentials managed via IAM roles
- [ ] Application logs stream to CloudWatch
- [ ] Health check endpoint configured for load balancer

---

### 2.2 S3 Audio File Storage

**Goal:** Replace local file storage with AWS S3.

**Features:**
- Upload audio files to S3 bucket
- Generate signed URLs for secure audio streaming (15-minute expiration)
- Delete files from S3 when song is deleted
- Store S3 object key in database instead of local file path

**Acceptance Criteria:**
- [ ] Audio files are stored in S3 with proper ACLs (private)
- [ ] Upload endpoint creates S3 pre-signed URL for client-side upload (optional, but more efficient)
- [ ] Audio stream endpoint returns CloudFront signed URL (if using CloudFront)
- [ ] Uploading 100MB file completes in reasonable time
- [ ] Deleting a song removes file from S3
- [ ] No unauthenticated user can access audio files directly
- [ ] File storage costs are logged/monitored

---

### 2.3 RDS Database

**Goal:** Move PostgreSQL to AWS RDS for managed persistence.

**Configuration:**
- PostgreSQL 14+ on RDS
- Multi-AZ for high availability
- Automatic backups enabled (7-day retention)
- Parameter group configured for optimal performance
- Security group restricts access to application only

**Acceptance Criteria:**
- [ ] Application connects to RDS via environment variables
- [ ] Database is properly encrypted at rest
- [ ] Automated backups run daily
- [ ] RDS metrics visible in CloudWatch (CPU, memory, disk I/O)
- [ ] Connection pooling configured in Spring Boot (HikariCP)
- [ ] Database performance is acceptable (<100ms for typical queries)

---

### 2.4 Application Deployment (ECS or EC2)

**Goal:** Run Spring Boot application on AWS infrastructure.

**Option A: ECS (Fargate) - Recommended**
- Containerize Spring Boot with Dockerfile
- Push image to ECR (Elastic Container Registry)
- Create ECS task definition referencing ECR image
- Deploy via ECS service with auto-scaling
- Load balancer (ALB) routes traffic to ECS tasks
- Environment variables injected via ECS task definition

**Option B: EC2**
- Launch EC2 instance (t3.micro or t3.small for free tier)
- Install Java 17+, Docker, docker-compose
- Pull Docker image, run Spring Boot container
- Configure security group for port 8080 (backend) and 3000 (frontend)
- Setup SSH for remote access

**Acceptance Criteria:**
- [ ] Spring Boot application starts successfully on AWS
- [ ] Health check endpoint returns 200 OK
- [ ] API endpoints are accessible via public URL
- [ ] Database connections work from application
- [ ] S3 uploads/downloads work from application
- [ ] CloudWatch logs show application startup and requests
- [ ] Application can scale up/down based on load (ECS) or manual scaling (EC2)

---

### 2.5 Frontend Deployment

**Goal:** Host React/Angular frontend on AWS.

**Options:**
- **S3 + CloudFront:** Static hosting (recommended, cheapest)
- **Amplify:** Managed hosting with CI/CD
- **EC2:** Run frontend on same instance as backend (simpler but less scalable)

**S3 + CloudFront Approach:**
- Build frontend to static files (`npm run build`)
- Upload build folder to S3 bucket
- Configure S3 for static website hosting
- Create CloudFront distribution pointing to S3
- Set up custom domain (optional)

**Acceptance Criteria:**
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Static files uploaded to S3
- [ ] CloudFront distribution created and deployed
- [ ] Frontend accessible via CloudFront URL
- [ ] API requests from frontend go to backend URL (environment-based)
- [ ] Page refresh works (configure S3 to route 404s to index.html)
- [ ] HTTPS enabled via CloudFront

---

### 2.6 Security & Authentication

**Goal:** Implement secure authentication in production.

**Features:**
- JWT tokens signed with strong secret (stored in AWS Secrets Manager)
- HTTPS enforced (CloudFront handles SSL for frontend, ALB/Application for backend)
- CORS configured properly (frontend domain only)
- IAM roles limit application permissions to only needed AWS resources
- No hardcoded credentials in code (use environment variables or IAM roles)

**Acceptance Criteria:**
- [ ] All API requests require valid JWT token
- [ ] JWT secret is stored in AWS Secrets Manager, not in code
- [ ] Backend rejects requests from unapproved origins
- [ ] IAM role for application has least-privilege permissions
- [ ] Environment variables for secrets are injected at runtime
- [ ] Passwords are hashed with bcrypt (cost factor 10+)
- [ ] HTTPS is enforced (redirect HTTP to HTTPS)

---

### 2.7 Monitoring & Logging

**Goal:** Observe application health and performance.

**Features:**
- Application logs stream to CloudWatch
- Custom metrics for business logic (songs uploaded, playlists created, etc.)
- Alerts for errors (error rate > 1%, latency > 500ms)
- Dashboard showing key metrics

**Acceptance Criteria:**
- [ ] Application logs appear in CloudWatch Logs
- [ ] Log levels are appropriate (INFO, WARN, ERROR)
- [ ] Errors include stack traces for debugging
- [ ] CloudWatch dashboard shows API response times
- [ ] CloudWatch dashboard shows S3 upload/download rates
- [ ] CloudWatch dashboard shows RDS database metrics
- [ ] Alerts configured for critical errors

---

### 2.8 Cost Optimization

**Goal:** Keep AWS costs minimal.

**Considerations:**
- [ ] S3 files are served via CloudFront (avoid direct S3 downloads)
- [ ] RDS is right-sized (t3.micro for dev, scale for production)
- [ ] ECS tasks have CPU/memory limits set appropriately
- [ ] Unused resources (old snapshots, unused volumes) are cleaned up
- [ ] S3 versioning disabled (unless needed)
- [ ] CloudWatch logs retention set to 30 days (not indefinite)
- [ ] Estimate monthly cost with AWS Calculator

---

### 2.9 Infrastructure as Code (Optional Enhancement)

**Goal:** Automate infrastructure deployment.

**Tools:**
- Terraform or CloudFormation to define AWS resources
- GitHub Actions for CI/CD pipeline
- Auto-deploy on git push to `main` branch

**Acceptance Criteria:**
- [ ] Terraform/CloudFormation files define all AWS resources
- [ ] Infrastructure can be created/destroyed reliably via code
- [ ] CI/CD pipeline builds and tests application
- [ ] CI/CD pipeline deploys to AWS on successful tests
- [ ] Environment variables injected securely during deploy

---

### 2.10 Documentation & Handoff

**Acceptance Criteria:**
- [ ] README explains how to set up local development environment
- [ ] README explains how to deploy to AWS
- [ ] API documentation (Swagger/OpenAPI) is complete and accurate
- [ ] Architecture diagram shows AWS components and their relationships
- [ ] Deployment runbook documents manual steps (if not fully automated)
- [ ] Cost estimate is documented
- [ ] Troubleshooting guide for common issues

---

## Non-Functional Requirements

### Performance
- API response time: <200ms for typical requests
- Audio streaming: Support 5+ concurrent streams without degradation
- Frontend load time: <3 seconds (Lighthouse score 80+)
- Database query time: <50ms for 95th percentile

### Scalability
- Application can scale to 1000+ active users (via load balancing)
- Database can handle 10,000+ songs and 100+ playlists
- S3 can store unlimited audio files (AWS scales automatically)

### Reliability
- Uptime: 99.5% (Phase 2, via RDS Multi-AZ and ECS auto-scaling)
- Backup: Daily automated RDS snapshots, 7-day retention
- Disaster recovery: RDS can be restored from backup in <30 minutes

### Security
- All passwords hashed with bcrypt
- JWT tokens signed and validated
- HTTPS enforced
- Audio files accessible only to authenticated users
- No sensitive data in logs

---

## Definition of Done

**Phase 1 Complete When:**
- [ ] All features listed above are implemented and tested
- [ ] Application runs locally with `docker-compose up`
- [ ] Frontend and backend communicate successfully
- [ ] User can upload, create playlists, and play audio end-to-end
- [ ] Code is pushed to GitHub with clear commit history

**Phase 2 Complete When:**
- [ ] Application is deployed to AWS and accessible via public URL
- [ ] All data persists in RDS and S3
- [ ] Audio files stream from CloudFront without latency
- [ ] CloudWatch logs show healthy application metrics
- [ ] Documentation is complete
- [ ] Estimated monthly cost is <$10/month (if using free tier limits)

---

## Success Metrics

**Technical:**
- [ ] Zero security vulnerabilities (OWASP Top 10)
- [ ] 70%+ test coverage on backend
- [ ] <3s frontend load time
- [ ] <200ms API response time (p95)

**Portfolio/Interview Value:**
- [ ] Can explain architecture decisions in depth
- [ ] Can demonstrate app deployed on AWS
- [ ] Can discuss scaling challenges and solutions
- [ ] Can talk about tradeoffs (local vs. S3, ECS vs. EC2, etc.)
