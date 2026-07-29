# Audio Player

This repository is my playground for practicing Java Spring Boot by building a personal audio player. The backend is the main learning surface and will be written by me. The frontend will be handled with help from Codex so I can keep my focus on backend design, APIs, persistence, authentication, and Spring Boot patterns.

The requirements for this project are intentionally evolving. I will add and revise features as I find new parts of Spring Boot, databases, security, and audio delivery that I want to explore.

## Current Direction

The application is intended to grow into an audio player with:

- User authentication and account-specific data.
- A PostgreSQL-backed song database.
- Audio playback and streaming endpoints.
- Song metadata and library management.
- Additional features such as playlists, playback history, or search as the project evolves.

Not every listed feature is complete yet. This README describes the direction of the project, while `progress.md` and `audio-player-requirements.md` capture more detailed learning notes and evolving requirements.

## Tech Stack

- Backend: Java, Spring Boot, Spring MVC, Spring Data JPA.
- Database: PostgreSQL.
- Frontend: Angular in `frontend/`, generated and maintained with Codex assistance.
- Templates/static resources: Spring resources under `src/main/resources`.

## Running Locally

Start the Spring Boot backend:

```bash
./mvnw spring-boot:run
```

Run backend tests:

```bash
./mvnw test
```

Install frontend dependencies:

```bash
cd frontend && npm install
```

Start the Angular development server:

```bash
cd frontend && npm start
```

Current local PostgreSQL settings are configured in `src/main/resources/application.properties`. The default database is `audioplayer` on `localhost:5432`.

## Project Notes

- `audio-player-requirements.md` contains broader feature ideas and phased requirements.
- `progress.md` tracks current learning goals, implementation notes, and useful references.
- `AGENTS.md` contains contributor guidance for agents or collaborators working in this repository.
