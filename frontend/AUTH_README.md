# TextDating Frontend - Authentication Setup

This React Native application includes a complete authentication system that connects to your Django backend.

## Features

- **User Registration**: Anonymous account creation with username and optional email
- **User Login**: Authentication with JWT tokens
- **Token Management**: Automatic token refresh and secure storage
- **Protected Routes**: Authentication context for managing user state
- **Modern UI**: Beautiful and responsive login/register screens

## Backend Integration

The app is configured to work with your Django backend API endpoints:

- `POST /api/register/` - User registration
- `POST /api/login/` - User login
- `POST /api/token/refresh/` - Token refresh

## Configuration

### Backend URL Configuration

Update the backend URL in `config/index.ts`:

```typescript
const devConfig: Config = {
  // For development
  API_BASE_URL: 'http://localhost:8000', // Update this
};

const prodConfig: Config = {
  // For production
  API_BASE_URL: 'https://your-production-backend.com', // Update this
};
```

### Device-Specific URLs

- **iOS Simulator**: Use `http://localhost:8000`
- **Android Emulator**: Use `http://10.0.2.2:8000`
- **Physical Device**: Use your computer's IP address (e.g., `http://192.168.1.100:8000`)

## Installation

1. Install dependencies:
   ```bash
   cd frontend
   bun install
   ```

2. Run the app:
   ```bash
   bun start
   ```

## File Structure

```
frontend/
├── app/
│   ├── _layout.tsx          # Root layout with AuthProvider
│   ├── index.tsx            # Main screen with auth state handling
│   ├── login.tsx            # Login screen
│   └── register.tsx         # Register screen
├── contexts/
│   └── AuthContext.tsx      # Authentication context and state management
├── utils/
│   ├── api.ts              # Axios configuration with interceptors
│   └── authService.ts      # Authentication service methods
└── config/
    └── index.ts            # Environment configuration
```

## Usage

### Authentication Context

The app uses React Context for authentication state management:

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Use authentication state and methods
}
```

### API Service

All authenticated requests automatically include JWT tokens:

```typescript
import api from '../utils/api';

// This will automatically include the Bearer token
const response = await api.get('/api/some-protected-endpoint/');
```

### Token Storage

Tokens are securely stored using AsyncStorage:
- Access Token: `access_token`
- Refresh Token: `refresh_token`
- User Data: `user_data`

## Screens

### Main Screen (`index.tsx`)
- Shows welcome message for unauthenticated users
- Displays user info and logout button for authenticated users
- Navigation buttons to login/register

### Login Screen (`login.tsx`)
- Username and password fields
- Error handling with user-friendly messages
- Navigation to register screen

### Register Screen (`register.tsx`)
- Anonymous name (username) field
- Optional email field
- Password and confirm password fields
- Password validation (minimum 8 characters)
- Error handling for duplicate usernames

## Error Handling

The app includes comprehensive error handling:

- Network errors
- Validation errors
- Authentication failures
- Token expiration (automatic refresh)
- Server errors

## Security Features

- JWT token-based authentication
- Automatic token refresh
- Secure token storage
- Password validation
- Request/response interceptors
- Logout clears all stored data

## Customization

### Styling
All screens use consistent styling with:
- Modern color scheme
- Responsive design
- Accessibility considerations
- Loading states
- Error states

### Adding New Authenticated Screens
1. Create your screen component
2. Use the `useAuth` hook to check authentication
3. Access user data and authentication methods

Example:
```typescript
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedScreen() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirect to login or show login prompt
    return <LoginPrompt />;
  }

  return (
    <View>
      <Text>Hello, {user?.username}!</Text>
    </View>
  );
}
```

## Troubleshooting

### Common Issues

1. **Network Connection Error**
   - Check backend URL in `config/index.ts`
   - Ensure Django backend is running
   - For physical devices, use computer's IP address

2. **Login/Register Not Working**
   - Verify backend API endpoints are correct
   - Check Django CORS settings
   - Verify Django is accepting requests

3. **Token Issues**
   - Clear app storage if experiencing token problems
   - Check token expiration settings in Django

### Development Tips

1. Use React Native Debugger for network inspection
2. Check Metro bundler logs for errors
3. Use `console.log` in catch blocks for debugging
4. Test on both iOS and Android platforms

## Next Steps

1. Update `config/index.ts` with your backend URL
2. Test registration and login flows
3. Add additional authenticated screens
4. Implement user profile features
5. Add password reset functionality (when backend supports it)
