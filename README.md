# EventPlanner

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green)](https://expressjs.com/)

EventPlanner is a full-stack web application designed to simplify the process of planning events and gatherings. It allows users to create events with customizable fields, collect responses from participants, visualize voting results, and finalize event details based on group preferences.

![Event Planner Screenshot](https://via.placeholder.com/800x400)

## ✨ Features

### 📅 Event Creation
- Create events with customizable date options, locations, and various field types
- Support for multiple date and location suggestions
- Add custom fields including text fields, lists, radio buttons, and checkboxes
- Setting voting limits for participants

### 📝 Response Collection
- Share event links with participants
- Allow participants to vote on preferred dates and locations
- Collect user responses for custom fields
- Support for user-suggested alternatives to existing options

### 📊 Event Management
- Comprehensive dashboard for event creators to view responses
- Visualization of voting patterns with charts
- View participant details and responses
- Close, reopen, or finalize events

### 🔐 User Authentication
- Secure registration and login system
- Email verification
- Password reset functionality
- Session management

## 🛠️ Technologies Used

### Frontend
- **React**: UI library for building the user interface
- **TypeScript**: For type-safe code
- **React Router**: For navigation and routing
- **React Query**: For server state management
- **React Hook Form**: For form management
- **Zod**: For validation schemas
- **shadcn/ui**: For UI components
- **Tailwind CSS**: For styling
- **Chart.js**: For data visualization
- **Lucide React**: For icons

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: For type-safe code
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **JWT**: For authentication
- **Bcrypt**: For password hashing
- **Zod**: For validation

## 📁 Project Structure

The project follows a typical full-stack application structure:

### Backend
- **controllers/**: Contains route controllers for handling API requests
- **models/**: Mongoose models for database entities
- **routes/**: Express routes for API endpoints
- **middleware/**: Custom middleware for authentication, error handling, etc.
- **utils/**: Utility functions and helpers
- **constants/**: Configuration constants and environment variables
- **services/**: Business logic organized by domain

### Frontend
- **components/**: Reusable UI components
- **pages/**: Top-level views for routes
- **hooks/**: Custom React hooks
- **lib/**: Utility functions and API client
- **config/**: Configuration for various libraries
- **types/**: TypeScript type definitions

## 📡 API Endpoints

### Authentication
- `POST /auth/register`: Register a new user
- `POST /auth/login`: Login a user
- `GET /auth/refresh`: Refresh access token
- `GET /auth/logout`: Logout a user
- `GET /auth/email/verify/:code`: Verify email address
- `POST /auth/password/forgot`: Request password reset
- `POST /auth/password/reset`: Reset password

### User
- `GET /user`: Get current user information
- `GET /sessions`: Get user sessions
- `DELETE /sessions/:id`: Delete a user session

### Events
- `POST /event/create`: Create a new event
- `GET /event/submit/:eventUUID`: Get event by UUID
- `POST /event/response`: Submit a response to an event
- `GET /event/:eventId/responses`: Get all responses for an event
- `GET /event/:eventId/response`: Get user's response to an event
- `GET /event/:eventId/other-responses`: Get other users' responses
- `GET /event/created`: Get events created by user
- `GET /event/responded`: Get events user has responded to
- `GET /event/:eventId/edit`: Get event data for editing
- `PATCH /event/:eventId/close`: Close an event
- `PATCH /event/:eventId/reopen`: Reopen an event
- `POST /event/:eventId/finalize`: Finalize an event

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- This project was built using [shadcn/ui](https://ui.shadcn.com/) components
- Icons provided by [Lucide React](https://lucide.dev/)
- Charts built with [Chart.js](https://www.chartjs.org/)
- Animation effects using [anime.js](https://animejs.com/)

## 🔮 Future Enhancements

- Calendar integration with Apple, and Outlook calendars
- Email reminders for events
- Advanced filters for event searching
- Mobile application
- Real-time collaboration features
