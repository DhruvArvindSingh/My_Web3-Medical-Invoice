import axios, { AxiosResponse, AxiosError } from 'axios';

// Configure axios defaults
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://3.6.40.59:8888';
console.log('API_BASE_URL:', API_BASE_URL);

// Type definitions for better type safety
/**
 * @typedef {Object} ApiResponse
 * @property {boolean} [success]
 * @property {*} [data]
 * @property {string} [message]
 * @property {string} [error]
 */

/**
 * @typedef {Object.<string, number>} S3File
 */

/**
 * @typedef {Object.<string, number>} DropboxFile
 */

/**
 * @typedef {Object} FileContent
 * @property {string} content
 * @property {string} [fileName]
 */

/**
 * @typedef {Object} LogoUploadResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} data
 * @property {string} data.fileName
 * @property {string} data.filePath
 * @property {string} data.email
 * @property {string} data.signedUrl
 * @property {string} data.url
 */

/**
 * @typedef {Object} AuthResponse
 * @property {boolean} success
 * @property {boolean} [authenticated]
 * @property {Object} [data]
 * @property {string} [data.email]
 * @property {string} [data.token]
 * @property {*} [user]
 * @property {string} [message]
 * @property {string} [error]
 */

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
    (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to:`, config.url);
        if (config.data) {
            console.log('Request data:', { ...config.data, content: config.data.content ? '[CONTENT_TRUNCATED]' : undefined });
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => {
        console.log(`Response from ${response.config.url}:`, {
            status: response.status,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response?.status === 401) {
            // Handle unauthorized access
            console.warn('Unauthorized access - please login');
        }

        return Promise.reject(error);
    }
);

class ApiService {
    // Helper method to get token from localStorage only
    static getToken() {
        return localStorage.getItem('token');
    }

    // Helper method to handle API responses consistently
    static handleApiResponse(response) {
        return response.data;
    }

    // Helper method to handle API errors consistently
    static handleApiError(error, operation) {
        console.error(`Failed to ${operation}:`, error);
        throw error;
    }

    // S3 Operations
    /**
     * @returns {Promise<{s3Files: S3File}>}
     */
    static async listAllS3() {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Please login to continue');
            }
            const response = await apiClient.post('/api/v1/listAllS3', { token });
            return this.handleApiResponse(response);
        } catch (error) {
            this.handleApiError(error, 'list S3 files');
        }
    }

    /**
     * @param {string} fileName
     * @returns {Promise<FileContent>}
     */
    static async getFileS3(fileName) {
        try {
            console.log('Requesting S3 file:', fileName);

            if (!fileName || typeof fileName !== 'string') {
                throw new Error('Invalid fileName provided');
            }
            const token = this.getToken();
            if (!token) {
                throw new Error('Please login to continue');
            }
            const response = await apiClient.post('/api/v1/getFileS3', { fileName, token });

            console.log('Raw S3 API response:', response);
            console.log('Response data:', response.data);
            console.log('Response data type:', typeof response.data);
            console.log('Response data keys:', Object.keys(response.data || {}));

            const responseData = this.handleApiResponse(response);

            // Handle different possible response structures
            let fileContent;

            if (typeof responseData === 'string') {
                // If response is directly a string, treat it as content
                fileContent = { content: responseData, fileName };
            } else if (responseData && typeof responseData === 'object') {
                // Check if response has nested data structure
                if (responseData.data && typeof responseData.data === 'object') {
                    fileContent = responseData.data;
                } else if (responseData.content !== undefined) {
                    fileContent = responseData;
                } else {
                    // Try to find content in the response object
                    const possibleContent = responseData.file || responseData.fileContent || responseData.text;
                    if (possibleContent !== undefined) {
                        fileContent = { content: possibleContent, fileName };
                    } else {
                        console.error('Unexpected response structure:', responseData);
                        throw new Error('No content found in S3 API response');
                    }
                }
            } else {
                throw new Error('Invalid response format from S3 API');
            }

            // Validate final content
            if (!fileContent || typeof fileContent.content === 'undefined') {
                console.error('Final validation failed. FileContent:', fileContent);
                throw new Error('No content received from S3 API');
            }

            return fileContent;
        } catch (error) {
            console.error('Error response:', error.response?.data);
            this.handleApiError(error, 'get S3 file');
        }
    }

    /**
     * @param {string} fileName
     * @param {string} content
     * @returns {Promise<ApiResponse>}
     */
    static async uploadFileS3(fileName, content) {
        try {
            if (!fileName || typeof fileName !== 'string') {
                throw new Error('Invalid fileName provided');
            }

            if (typeof content !== 'string') {
                throw new Error('Invalid content provided - must be string');
            }

            const token = this.getToken();
            if (!token) {
                throw new Error('Please login to continue');
            }

            const response = await apiClient.post('/api/v1/uploadFileS3', {
                fileName,
                content,
                token
            });

            return this.handleApiResponse(response);
        } catch (error) {
            this.handleApiError(error, 'upload S3 file');
        }
    }

    /**
     * @param {string} fileName
     * @returns {Promise<ApiResponse>}
     */
    static async deleteFileS3(fileName) {
        try {
            if (!fileName || typeof fileName !== 'string') {
                throw new Error('Invalid fileName provided');
            }

            const token = this.getToken();
            if (!token) {
                throw new Error('Please login to continue');
            }

            const response = await apiClient.post('/api/v1/deleteFileS3', { fileName, token });
            return this.handleApiResponse(response);
        } catch (error) {
            this.handleApiError(error, 'delete S3 file');
        }
    }

    // Dropbox Operations
    /**
     * @returns {Promise<{dropboxFiles: DropboxFile}>}
     */
    static async listAllDropbox() {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Please login to continue');
            }
            const response = await apiClient.post('/api/v1/listAllDropbox', { token });
            return this.handleApiResponse(response);
        } catch (error) {
            this.handleApiError(error, 'list Dropbox files');
        }
    }

    /**
     * @param {string} fileName
     * @returns {Promise<FileContent>}
     */
    static async getFileDropbox(fileName) {
        try {
            console.log('Requesting Dropbox file:', fileName);

            if (!fileName || typeof fileName !== 'string') {
                throw new Error('Invalid fileName provided');
            }
            const token = this.getToken();
            if (!token) {
                throw new Error('Please login to continue');
            }
            const response = await apiClient.post('/api/v1/getFileDropbox', { fileName, token });

            console.log('Raw Dropbox API response:', response);
            console.log('Response data:', response.data);
            console.log('Response data type:', typeof response.data);
            console.log('Response data keys:', Object.keys(response.data || {}));

            const responseData = this.handleApiResponse(response);

            // Handle different possible response structures
            let fileContent;

            if (typeof responseData === 'string') {
                // If response is directly a string, treat it as content
                fileContent = { content: responseData, fileName };
            } else if (responseData && typeof responseData === 'object') {
                // Check if response has nested data structure
                if (responseData.data && typeof responseData.data === 'object') {
                    fileContent = responseData.data;
                } else if (responseData.content !== undefined) {
                    fileContent = responseData;
                } else {
                    // Try to find content in the response object
                    const possibleContent = responseData.file || responseData.fileContent || responseData.text;
                    if (possibleContent !== undefined) {
                        fileContent = { content: possibleContent, fileName };
                    } else {
                        console.error('Unexpected response structure:', responseData);
                        throw new Error('No content found in Dropbox API response');
                    }
                }
            } else {
                throw new Error('Invalid response format from Dropbox API');
            }

            // Validate final content
            if (!fileContent || typeof fileContent.content === 'undefined') {
                console.error('Final validation failed. FileContent:', fileContent);
                throw new Error('No content received from Dropbox API');
            }

            return fileContent;
        } catch (error) {
            console.error('Error response:', error.response?.data);
            this.handleApiError(error, 'get Dropbox file');
        }
    }

    /**
     * @param {string} fileName
     * @param {string} content
     * @returns {Promise<ApiResponse>}
     */
    static async uploadFileDropbox(fileName, content) {
        try {
            if (!fileName || typeof fileName !== 'string') {
                throw new Error('Invalid fileName provided');
            }

            if (typeof content !== 'string') {
                throw new Error('Invalid content provided - must be string');
            }

            const token = this.getToken();
            if (!token) {
                throw new Error('Please login to continue');
            }

            const response = await apiClient.post('/api/v1/uploadFileDropbox', {
                fileName,
                content,
                token
            });

            return this.handleApiResponse(response);
        } catch (error) {
            this.handleApiError(error, 'upload Dropbox file');
        }
    }

    /**
     * @param {string} fileName
     * @returns {Promise<ApiResponse>}
     */
    static async deleteFileDropbox(fileName) {
        try {
            if (!fileName || typeof fileName !== 'string') {
                throw new Error('Invalid fileName provided');
            }

            const token = this.getToken();
            if (!token) {
                throw new Error('Please login to continue');
            }

            const response = await apiClient.post('/api/v1/deleteFileDropbox', { fileName, token });
            return this.handleApiResponse(response);
        } catch (error) {
            this.handleApiError(error, 'delete Dropbox file');
        }
    }

    // Authentication Operations
    /**
     * @param {*} userData
     * @returns {Promise<AuthResponse>}
     */
    static async signup(userData) {
        try {
            if (!userData || typeof userData !== 'object') {
                throw new Error('Invalid user data provided');
            }

            const response = await apiClient.post('/api/v1/signup', userData);
            return this.handleApiResponse(response);
        } catch (error) {
            this.handleApiError(error, 'signup');
        }
    }

    /**
     * @param {*} credentials
     * @returns {Promise<AuthResponse>}
     */
    static async signin(credentials) {
        try {
            if (!credentials || typeof credentials !== 'object') {
                throw new Error('Invalid credentials provided');
            }
            console.log('signin credentials:', credentials);
            const response = await apiClient.post('/api/v1/signin', credentials);
            console.log('signin response:', response);
            console.log('signin response data:', response.data);
            if (response.data.success && response.data.data.token) {
                // Store token in localStorage only
                console.log('signin response token:', response.data.data.token);
                localStorage.setItem('token', response.data.data.token);
                localStorage.setItem('email', response.data.data.email);
            }
            return this.handleApiResponse(response);
        } catch (error) {
            this.handleApiError(error, 'signin');
        }
    }

    /**
     * @returns {Promise<AuthResponse>}
     */
    static async logout() {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            return;
        } catch (error) {
            console.error('Failed to logout:', error);
            // Clear token from localStorage even if logout fails
            // Don't throw error for logout - we still want to clear local state
            return {
                success: false,
                error: error.message || 'Logout failed',
                authenticated: false
            };
        }
    }

    // Check if user is authenticated by making a test API call
    /**
     * @returns {Promise<AuthResponse>}
     */
    static async checkAuth() {
        try {
            const token = this.getToken();
            if (!token) {
                return {
                    success: false,
                    authenticated: false,
                    error: 'No token found'
                };
            }

            const response = await apiClient.post('/api/v1/checkAuth', { token });
            return this.handleApiResponse(response);
        } catch (error) {
            console.error('Auth check failed:', error);
            return {
                success: false,
                authenticated: false,
                error: error.message || 'Auth check failed'
            };
        }
    }

    // Utility method to check if the API is reachable
    /**
     * @returns {Promise<{status: string, timestamp: number}>}
     */
    static async healthCheck() {
        try {
            const response = await apiClient.get('/api/v1/health');
            return {
                ...this.handleApiResponse(response),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Health check failed:', error);
            return {
                status: 'error',
                timestamp: Date.now()
            };
        }
    }

    // Logo Operations
    /**
     * @param {string} fileName
     * @param {string} content
     * @returns {Promise<LogoUploadResponse>}
     */
    static async uploadLogo(fileName, content) {
        try {
            if (!fileName || typeof fileName !== 'string') {
                throw new Error('Invalid fileName provided');
            }

            if (typeof content !== 'string') {
                throw new Error('Invalid content provided - must be string');
            }

            const token = this.getToken();
            if (!token) {
                throw new Error('Please login to continue');
            }

            const response = await apiClient.post('/api/v1/uploadLogo', {
                token,
                fileName,
                content
            });

            return this.handleApiResponse(response);
        } catch (error) {
            this.handleApiError(error, 'upload logo');
        }
    }

    /**
     * @param {string} fileName
     * @returns {Promise<ApiResponse>}
     */
    static async deleteLogo(fileName) {
        try {
            if (!fileName || typeof fileName !== 'string') {
                throw new Error('Invalid fileName provided');
            }

            const token = this.getToken();
            if (!token) {
                throw new Error('Please login to continue');
            }

            const response = await apiClient.post('/api/v1/deleteLogo', {
                fileName,
                token
            });


            return this.handleApiResponse(response);
        } catch (error) {
            this.handleApiError(error, 'delete logo');
        }
    }


}

export default ApiService;