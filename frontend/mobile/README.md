# FastPost Mobile Application

FastPost mobile application built with React Native and Expo.

## 📱 Overview

This is the mobile client for the FastPost application, providing iOS and Android support through React Native.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (for iOS development)
- Android: Android Studio (for Android development)

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration values

### Development

#### Start the development server:
```bash
npm start
```

#### Run on specific platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📁 Project Structure

```
src/
├── components/       # Reusable components
├── screens/          # Screen components
├── hooks/            # Custom React hooks
├── services/         # API and external services
├── store/            # State management (Zustand)
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── constants/        # Application constants
├── assets/           # Images, fonts, etc.
└── App.tsx           # Main App component
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📝 Code Quality

Linting:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

Format code:
```bash
npm run format
```

## 🏗️ Build

### Build for iOS:
```bash
npm run build:ios
```

### Build for Android:
```bash
npm run build:android
```

## 🔧 Configuration

Key configuration files:
- `app.json` - Expo app configuration
- `.env.example` - Environment variables template
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - ESLint configuration
- `.prettierrc.json` - Prettier configuration

## 📚 Dependencies

### Core
- **React Native** - Mobile app framework
- **Expo** - React Native development platform
- **React Router** - Navigation

### State Management
- **Zustand** - State management
- **React Query** - Server state management

### Forms & Validation
- **React Hook Form** - Form management
- **Yup** - Schema validation

### HTTP Client
- **Axios** - HTTP client

### Utilities
- **Lodash** - Utility functions

## 🔐 Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_API_TIMEOUT` - API request timeout
- `REACT_APP_LOG_LEVEL` - Logging level

## 🐛 Troubleshooting

### Clear cache and reinstall:
```bash
rm -rf node_modules
rm -rf .expo
npm install
npm start
```

### Reset Expo:
```bash
expo logout
expo start -c
```

## 📖 Documentation

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 📄 License

This project is part of the FastPost application.

## 👥 Contributors

- Sardar Walee

## 📧 Support

For issues and questions, please refer to the main FastPost repository.
