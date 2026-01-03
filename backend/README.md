# FastPost Backend

Express.js backend server for the FastPost application.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`

### Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

## Project Structure

```
backend/
├── config/           # Configuration files
├── routes/           # API routes
├── server.js         # Main server file
├── package.json      # Dependencies and scripts
├── .env.example      # Environment variables template
└── README.md         # This file
```

## API Endpoints

- `GET /api/health` - Server health check
- `GET /api` - Welcome message and available endpoints

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with auto-reload
- `npm test` - Run tests (not yet configured)

## Environment Variables

See `.env.example` for the complete list of available configuration options.

## Contributing

For contribution guidelines, please refer to the main project README.

## License

ISC
