"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
    useRef
} from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Types
export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    isVerified: boolean;
    lastLoginAt: Date | null;
}

// Define your error response interface
export interface ApiErrorResponse {
    errors?: {
        message: string;
    }[];
    message?: string;
}

export interface SessionData {
    user: User;
    isAuthenticated: boolean;
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SignOutOptions {
    redirect?: boolean;
    callbackUrl?: string;
}

export interface AuthContextType {
    data: SessionData | null;
    user: User | null;
    status: SessionStatus;
    signOut: (options?: SignOutOptions) => Promise<void>;
    update: (data?: Partial<User>) => Promise<SessionData | null>;
    refreshSession: () => Promise<boolean>;
    checkAuthStatus: () => Promise<boolean>;
    api: AxiosInstance;
    uploadFile: (
        endpoint: string,
        file: File,
        additionalData?: Record<string, any>,
        onUploadProgress?: (progressEvent: any) => void
    ) => Promise<AxiosResponse>;
    uploadMultipleFiles: (
        endpoint: string,
        files: File[],
        additionalData?: Record<string, any>,
        onUploadProgress?: (progressEvent: any) => void
    ) => Promise<AxiosResponse>;
    uploadFormData: (
        endpoint: string,
        formData: FormData,
        options?: {
            onUploadProgress?: (progressEvent: any) => void;
            timeout?: number;
            method?: 'POST' | 'PUT' | 'PATCH';
        }
    ) => Promise<AxiosResponse>;
}

interface FailedRequest {
    resolve: (value: AxiosResponse) => void;
    reject: (error: AxiosError) => void;
    config: InternalAxiosRequestConfig;
}

interface RefreshTokenResponse {
    success?: boolean;
    message?: string;
}

interface CSRFResponse {
    data:{
        csrfToken: string;
    }
}

// Configuration
const API_CONFIG = {
    authBaseUrl: process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://authapi.orderit.in',
    backendBaseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
    endpoints: {
        csrf: '/api/auth/csrf-token',
        me: '/api/auth/me',
        logout: '/api/auth/logout',
        refresh: '/api/auth/refresh-token',
        checkAuth: '/api/auth/check-auth',
    },
    redirectUrls: {
        login: 'https://restaurant.orderit.in/?callbackUrl=https://dashboard.orderit.in',
        afterLogout: 'https://restaurant.orderit.in',
    },
    storage: {
        USER_DATA: 'userData',
        LAST_CHECK: 'lastAuthCheck',
    }
};

// Unified Authentication API Client Class
class AuthApiClient {
    private authApi: AxiosInstance;
    private backendApi: AxiosInstance;
    private csrfToken: string | null = null;
    private csrfTokenSetter: ((token: string | null) => void) | null = null;
    private isRefreshing = false;
    private failedQueue: FailedRequest[] = [];
    private refreshPromise: Promise<boolean> | null = null;
    private csrfFetchPromise: Promise<boolean> | null = null;

    constructor() {
        // Auth API instance (for authentication endpoints)
        this.authApi = axios.create({
            baseURL: API_CONFIG.authBaseUrl,
            withCredentials: true,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        // Backend API instance (for application endpoints)
        this.backendApi = axios.create({
            baseURL: API_CONFIG.backendBaseUrl,
            withCredentials: true,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    // Set CSRF token and state setter from React component
    setCsrfToken(token: string | null, setter?: (token: string | null) => void): void {
        this.csrfToken = token;
        if (setter) {
            this.csrfTokenSetter = setter;
        }
    }

    // Get CSRF token, fetch if empty
    private async ensureCSRFToken(): Promise<string | null> {
        if (this.csrfToken) {
            return this.csrfToken;
        }

        // If already fetching, wait for that promise
        if (this.csrfFetchPromise) {
            await this.csrfFetchPromise;
            return this.csrfToken;
        }

        // Start fetching CSRF token
        this.csrfFetchPromise = this.fetchCSRFToken();
        await this.csrfFetchPromise;
        this.csrfFetchPromise = null;

        return this.csrfToken;
    }

    private async fetchCSRFToken(): Promise<boolean> {
        try {
            console.log('🔐 Fetching CSRF token...');
            const response = await this.authApi.get<CSRFResponse>(API_CONFIG.endpoints.csrf);

            if (response.data?.data?.csrfToken) {
                this.csrfToken = response.data?.data?.csrfToken;

                // Update React state if setter is available
                if (this.csrfTokenSetter) {
                    this.csrfTokenSetter(this.csrfToken);
                }

                console.log('✅ CSRF token fetched successfully');
                return true;
            }

            console.warn('⚠️ No CSRF token received from server');
            return false;
        } catch (error) {
            console.error('❌ Failed to fetch CSRF token:', error);
            return false;
        }
    }

    private setupInterceptors(): void {
        // Request interceptor for backend API
        this.backendApi.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                // Ensure CSRF token is available
                const csrfToken = await this.ensureCSRFToken();
                if (csrfToken) {
                    config.headers['X-CSRF-Token'] = csrfToken;
                }

                // Handle file uploads - don't set Content-Type for FormData
                if (config.data instanceof FormData) {
                    // Remove Content-Type header to let browser set it with boundary
                    delete config.headers['Content-Type'];
                    // Increase timeout for file uploads
                    config.timeout = 300000; // 5 minutes for large files
                    console.log(`📤 Backend API File Upload: ${config.method?.toUpperCase()} ${config.url}`);
                } else {
                    // Add timestamp to prevent caching for GET requests
                    if (config.method === 'get') {
                        config.params = {
                            ...config.params,
                            _t: new Date().getTime()
                        };
                    }
                    console.log(`📤 Backend API Request: ${config.method?.toUpperCase()} ${config.url}`);
                }

                return config;
            },
            (error: AxiosError) => {
                console.error('❌ Backend request interceptor error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor for backend API with refresh logic
        this.backendApi.interceptors.response.use(
            (response: AxiosResponse) => {
                console.log(`📥 Backend API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
                return response;
            },
            async (error: AxiosError<ApiErrorResponse>) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

                console.log(`❌ Backend API Error: ${error.response?.status} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`);

                // Handle CSRF token issues
                if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
                    console.log('🔐 CSRF token expired, refetching...');
                    this.csrfToken = null;
                    if (this.csrfTokenSetter) {
                        this.csrfTokenSetter(null);
                    }

                    // Retry the request with new CSRF token
                    if (!originalRequest._retry) {
                        originalRequest._retry = true;
                        const newToken = await this.ensureCSRFToken();
                        if (newToken) {
                            originalRequest.headers['X-CSRF-Token'] = newToken;
                            return this.backendApi(originalRequest);
                        }
                    }
                }

                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        return new Promise<AxiosResponse>((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject, config: originalRequest });
                        });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        const refreshSuccessful = await this.refreshToken();

                        if (refreshSuccessful) {
                            this.processQueue(null);
                            return this.backendApi(originalRequest);
                        } else {
                            this.processQueue(error);
                            this.handleAuthFailure();
                            return Promise.reject(new Error('Authentication failed. Please log in again.'));
                        }
                    } catch (refreshError) {
                        this.processQueue(error);
                        this.handleAuthFailure();
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                if (error.response?.status === 401) {
                    this.handleAuthFailure();
                }

                return Promise.reject(error);
            }
        );

        // Auth API interceptors (simpler, no refresh logic needed)
        this.authApi.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                console.log(`📤 Auth API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            }
        );

        this.authApi.interceptors.response.use(
            (response: AxiosResponse) => {
                console.log(`📥 Auth API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
                return response;
            },
            (error: AxiosError) => {
                console.log(`❌ Auth API Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
                return Promise.reject(error);
            }
        );
    }

    private processQueue(error: AxiosError | null): void {
        this.failedQueue.forEach(({ resolve, reject, config }) => {
            if (error) {
                reject(error);
            } else {
                this.backendApi(config).then(resolve).catch(reject);
            }
        });

        this.failedQueue = [];
    }

    private handleAuthFailure(): void {
        console.log('🚪 Handling authentication failure - redirecting to login');

        if (typeof window !== 'undefined') {
            const currentUrl = window.location.href;
            const encodedCallbackUrl = encodeURIComponent(currentUrl);
            const redirectUrl = `${API_CONFIG.redirectUrls.login.split('?')[0]}?callbackUrl=${encodedCallbackUrl}`;
            window.location.href = redirectUrl;
        }
    }

    // Initialize CSRF token (now just fetches and updates state)
    async initializeCSRF(): Promise<boolean> {
        return await this.fetchCSRFToken();
    }

    // Check authentication status
    async checkAuthStatus(): Promise<{ isAuthenticated: boolean; user?: User }> {
        try {
            const response = await this.authApi.get(API_CONFIG.endpoints.checkAuth);

            if (response.status === 200 && response.data) {
                return {
                    isAuthenticated: true,
                    user: response.data.data.user
                };
            }

            return { isAuthenticated: false };
        } catch (error) {
            console.error('Auth check failed:', error);
            return { isAuthenticated: false };
        }
    }

    // Fetch user data
    async fetchUserData(): Promise<User | null> {
        try {
            const response = await this.authApi.get(API_CONFIG.endpoints.me);
            return response.status === 200 ? response.data.data : null;
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            return null;
        }
    }

    // Refresh token
    async refreshToken(): Promise<boolean> {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this.performTokenRefresh();
        const result = await this.refreshPromise;
        this.refreshPromise = null;

        return result;
    }

    private async performTokenRefresh(): Promise<boolean> {
        try {
            console.log('🔄 Attempting to refresh token...');
            const response = await this.authApi.post<RefreshTokenResponse>(API_CONFIG.endpoints.refresh);

            if (response.status === 200) {
                console.log('✅ Token refreshed successfully');
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Token refresh failed:', error);
            return false;
        }
    }

    // Logout
    async logout(): Promise<boolean> {
        try {
            const response = await this.authApi.post(API_CONFIG.endpoints.logout);

            // Clear CSRF token on logout
            this.csrfToken = null;
            if (this.csrfTokenSetter) {
                this.csrfTokenSetter(null);
            }

            return response.status === 200;
        } catch (error) {
            console.error('Logout failed:', error);
            return false;
        }
    }

    // Clear request queue (useful for logout)
    clearRequestQueue(): void {
        console.log('🧹 Clearing request queue');
        this.failedQueue = [];
        this.isRefreshing = false;
    }

    // File upload helper methods
    async uploadFile(
        endpoint: string,
        file: File,
        additionalData?: Record<string, any>,
        onUploadProgress?: (progressEvent: any) => void
    ): Promise<AxiosResponse> {
        const formData = new FormData();
        formData.append('file', file);

        // Add any additional data to FormData
        if (additionalData) {
            Object.entries(additionalData).forEach(([key, value]) => {
                formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
            });
        }

        return this.backendApi.post(endpoint, formData, {
            headers: {
                // Don't set Content-Type - let browser set it with boundary
            },
            onUploadProgress,
            timeout: 300000, // 5 minutes for large files
        });
    }

    async uploadMultipleFiles(
        endpoint: string,
        files: File[],
        additionalData?: Record<string, any>,
        onUploadProgress?: (progressEvent: any) => void
    ): Promise<AxiosResponse> {
        const formData = new FormData();

        files.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });

        // Add any additional data to FormData
        if (additionalData) {
            Object.entries(additionalData).forEach(([key, value]) => {
                formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
            });
        }

        return this.backendApi.post(endpoint, formData, {
            onUploadProgress,
            timeout: 600000, // 10 minutes for multiple large files
        });
    }

    // Generic FormData upload (for complex scenarios)
    async uploadFormData(
        endpoint: string,
        formData: FormData,
        options?: {
            onUploadProgress?: (progressEvent: any) => void;
            timeout?: number;
            method?: 'POST' | 'PUT' | 'PATCH';
        }
    ): Promise<AxiosResponse> {
        const { onUploadProgress, timeout = 300000, method = 'POST' } = options || {};

        return this.backendApi({
            method,
            url: endpoint,
            data: formData,
            onUploadProgress,
            timeout,
        });
    }

    // Get backend API instance for external use
    getBackendApi(): AxiosInstance {
        return this.backendApi;
    }

    // Get auth API instance for external use
    getAuthApi(): AxiosInstance {
        return this.authApi;
    }
}

// Storage utilities
const getStoredUser = (): User | null => {
    if (typeof window === 'undefined') return null;

    try {
        const userData = localStorage.getItem(API_CONFIG.storage.USER_DATA);
        return userData ? JSON.parse(userData) : null;
    } catch {
        return null;
    }
};

const storeUser = (user: User | null): void => {
    if (typeof window === 'undefined') return;

    try {
        if (user) {
            localStorage.setItem(API_CONFIG.storage.USER_DATA, JSON.stringify(user));
        } else {
            localStorage.removeItem(API_CONFIG.storage.USER_DATA);
        }
        localStorage.setItem(API_CONFIG.storage.LAST_CHECK, Date.now().toString());
    } catch (error) {
        console.error('Failed to store user data:', error);
    }
};

const shouldCheckAuth = (): boolean => {
    if (typeof window === 'undefined') return true;

    try {
        const lastCheck = localStorage.getItem(API_CONFIG.storage.LAST_CHECK);
        if (!lastCheck) return true;

        const timeSinceLastCheck = Date.now() - parseInt(lastCheck, 10);
        return timeSinceLastCheck > 5 * 60 * 1000; // Check every 5 minutes
    } catch {
        return true;
    }
};

// Create context
export const AuthContext = createContext<AuthContextType>({
    data: null,
    user: null,
    status: 'loading',
    signOut: async () => { },
    update: async () => null,
    refreshSession: async () => false,
    checkAuthStatus: async () => false,
    api: axios.create(), // Placeholder
    uploadFile: async () => ({ data: null } as AxiosResponse),
    uploadMultipleFiles: async () => ({ data: null } as AxiosResponse),
    uploadFormData: async () => ({ data: null } as AxiosResponse),
});

// Custom hook
export const useSession = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useSession must be used within an AuthProvider');
    }
    return context;
};

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [status, setStatus] = useState<SessionStatus>('loading');
    const [csrfToken, setCsrfToken] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const router = useRouter();
    const apiClient = useRef(new AuthApiClient());
    const mountedRef = useRef(true);

    // Update API client when CSRF token changes
    useEffect(() => {
        apiClient.current.setCsrfToken(csrfToken, setCsrfToken);
    }, [csrfToken]);

    // Initialize session
    const initializeSession = useCallback(async () => {
        if (isInitialized) return;

        try {
            setStatus('loading');
            console.log('🚀 Initializing authentication session...');

            // Step 1: Initialize CSRF token (this will set the state)
            const csrfInitialized = await apiClient.current.initializeCSRF();
            if (!csrfInitialized) {
                console.warn('⚠️ Failed to initialize CSRF token, continuing anyway...');
            }

            // Step 2: Check stored user data for quick UI update
            const storedUser = getStoredUser();
            if (storedUser && !shouldCheckAuth()) {
                setSessionData({ user: storedUser, isAuthenticated: true });
                setStatus('authenticated');
                setIsInitialized(true);
                // Still verify in background
                setTimeout(verifyAuthStatus, 100);
                return;
            }

            // Step 3: Verify auth status with server
            await verifyAuthStatus();
            setIsInitialized(true);
        } catch (error) {
            console.error('Session initialization error:', error);
            setStatus('unauthenticated');
            storeUser(null);
            setIsInitialized(true);
        }
    }, [isInitialized]);

    const verifyAuthStatus = async () => {
        try {
            const authCheck = await apiClient.current.checkAuthStatus();

            if (authCheck.isAuthenticated && authCheck.user) {
                const sessionData: SessionData = {
                    user: authCheck.user,
                    isAuthenticated: true
                };

                if (mountedRef.current) {
                    setSessionData(sessionData);
                    setStatus('authenticated');
                    storeUser(authCheck.user);
                }
            } else {
                if (mountedRef.current) {
                    setSessionData(null);
                    setStatus('unauthenticated');
                    storeUser(null);
                }
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            if (mountedRef.current) {
                setStatus('unauthenticated');
                storeUser(null);
            }
        }
    };

    // Check auth status
    const checkAuthStatus = useCallback(async (): Promise<boolean> => {
        const result = await apiClient.current.checkAuthStatus();

        if (result.isAuthenticated && result.user) {
            const sessionData: SessionData = {
                user: result.user,
                isAuthenticated: true
            };
            setSessionData(sessionData);
            setStatus('authenticated');
            storeUser(result.user);
            return true;
        } else {
            setSessionData(null);
            setStatus('unauthenticated');
            storeUser(null);
            return false;
        }
    }, []);

    // Sign out function
    const signOut = useCallback(async (options: SignOutOptions = {}) => {
        try {
            const { redirect = true, callbackUrl = API_CONFIG.redirectUrls.afterLogout } = options;

            // Call logout endpoint
            await apiClient.current.logout();

            // Clear request queue
            apiClient.current.clearRequestQueue();

            // Clear local data
            storeUser(null);
            setSessionData(null);
            setStatus('unauthenticated');
            setCsrfToken(null); // Clear CSRF token state

            // Redirect if requested
            if (redirect) {
                router.push(callbackUrl);
            }
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }, [router]);

    // Update session
    const update = useCallback(async (data?: Partial<User>): Promise<SessionData | null> => {
        if (!sessionData) return null;

        try {
            let updatedUser = sessionData.user;

            if (data) {
                // Update user data locally first
                updatedUser = { ...sessionData.user, ...data };
                const updatedSession = { ...sessionData, user: updatedUser };
                setSessionData(updatedSession);
                storeUser(updatedUser);
            } else {
                // Fetch fresh user data from server
                const freshUser = await apiClient.current.fetchUserData();
                if (freshUser) {
                    updatedUser = freshUser;
                    const updatedSession = { ...sessionData, user: updatedUser };
                    setSessionData(updatedSession);
                    storeUser(updatedUser);
                }
            }

            return { user: updatedUser, isAuthenticated: true };
        } catch (error) {
            console.error('Session update error:', error);
            return sessionData;
        }
    }, [sessionData]);

    // Refresh session
    const refreshSession = useCallback(async (): Promise<boolean> => {
        const success = await apiClient.current.refreshToken();
        if (success) {
            await verifyAuthStatus();
        }
        return success;
    }, []);

    // Initialize on mount
    useEffect(() => {
        mountedRef.current = true;
        initializeSession();

        return () => {
            mountedRef.current = false;
        };
    }, [initializeSession]);

    // Auto-check auth status periodically
    useEffect(() => {
        if (status !== 'authenticated') return;

        const interval = setInterval(async () => {
            if (shouldCheckAuth()) {
                const isStillAuthenticated = await apiClient.current.checkAuthStatus();
                if (!isStillAuthenticated.isAuthenticated) {
                    setSessionData(null);
                    setStatus('unauthenticated');
                    storeUser(null);
                }
            }
        }, 5 * 60 * 1000); // Check every 5 minutes

        return () => clearInterval(interval);
    }, [status]);

    // Handle browser focus to recheck auth
    useEffect(() => {
        const handleFocus = () => {
            if (status === 'authenticated' && shouldCheckAuth()) {
                verifyAuthStatus();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [status]);

    const contextValue: AuthContextType = {
        data: sessionData,
        user: sessionData?.user || null,
        status,
        signOut,
        update,
        refreshSession,
        checkAuthStatus,
        api: apiClient.current.getBackendApi(), // Expose backend API instance
        uploadFile: apiClient.current.uploadFile.bind(apiClient.current),
        uploadMultipleFiles: apiClient.current.uploadMultipleFiles.bind(apiClient.current),
        uploadFormData: apiClient.current.uploadFormData.bind(apiClient.current),
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Export for backward compatibility
export const useUser = useSession;