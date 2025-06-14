# Internet Download Manager

A multi-threaded download manager application built with Spring Boot and React.

## Features

- Multi-threaded downloads for improved speed
- Resume interrupted downloads
- Download progress tracking
- Queue management
- File type categorization
- Download history

## Tech Stack

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- H2 Database
- Lombok

### Frontend
- React 18
- TypeScript
- Material-UI
- Axios
- React Query

## Project Structure

```
├── backend/                 # Spring Boot application
│   ├── src/
│   └── pom.xml
└── frontend/               # React application
    ├── src/
    └── package.json
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build the project:
   ```bash
   ./mvnw clean install
   ```

3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will start on `http://localhost:3000`

## Usage

1. Open the application in your browser at `http://localhost:3000`
2. Enter the URL of the file you want to download
3. Configure download settings (optional)
4. Start the download
5. Monitor progress in the downloads list

## Development

### Backend Development
The backend uses Spring Boot with a multi-threaded download manager implementation. Key components:
- Download Service: Manages download tasks and thread pool
- File Service: Handles file operations and metadata
- Progress Tracker: Monitors download progress
- Queue Manager: Manages download queue and priorities

### Frontend Development
The frontend is built with React and TypeScript, featuring:
- Modern UI with Material-UI components
- Real-time progress updates
- Download queue management interface
- Settings configuration

## License

MIT License
"# DownloadManagerUsingThreads" 
