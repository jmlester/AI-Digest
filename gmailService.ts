
import type { Email } from '../types';

// Declare GAPI and GSI clients as global variables to satisfy TypeScript
declare const gapi: any;
declare const google: any;

const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

let gapiInited = false;
let tokenClient: any = null;

/**
 * Initializes the GAPI client for making API calls.
 * This should only be called after a user has authenticated.
 */
export function initializeGapiClient(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (gapiInited) {
            return resolve();
        }
        gapi.load('client', () => {
            gapi.client.init({
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
            })
            .then(() => {
                gapiInited = true;
                resolve();
            })
            .catch((err: any) => reject(new Error(`Failed to initialize GAPI client: ${err?.details || err?.message || 'Unknown error'}`)));
        });
    });
}

/**
 * Initializes the GSI client for authentication.
 * This should be called once when the app has the necessary client ID.
 */
export function initializeGsiClient(clientId: string, callback: (tokenResponse: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!clientId) {
            return reject(new Error("Google Client ID is missing."));
        }
        
        if (google && google.accounts && google.accounts.oauth2) {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: SCOPES,
                callback: callback,
                error_callback: (error: any) => {
                    // Route GSI-specific errors to the main callback for unified handling.
                     callback({ error: error.type || 'unknown_error', error_description: error.message || 'An unknown GSI error occurred.' });
                }
            });
            resolve();
        } else {
            // This can happen if the script is blocked or hasn't loaded yet.
            setTimeout(() => {
                 if (google && google.accounts && google.accounts.oauth2) {
                     initializeGsiClient(clientId, callback).then(resolve).catch(reject);
                 } else {
                    reject(new Error("Google Sign-In library not loaded. It might be blocked by an ad-blocker or network issue."));
                 }
            }, 500);
        }
    });
}

/**
 *  Triggers the Google Sign-In flow by requesting an access token.
 */
export function signIn() {
  if (tokenClient) {
    // requestAccessToken should be called to trigger the popup for the user.
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    throw new Error("Authentication client is not initialized. Please configure the app first.");
  }
}

/**
 *  Sign out the user.
 */
export function signOut() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token, () => {});
    gapi.client.setToken(null);
  }
}

/**
 * Parses the body of an email message.
 */
function getEmailBody(message: any): string {
    const payload = message.payload;
    if (!payload) return "";

    let bodyData = "";
    if (payload.body?.data) {
        bodyData = payload.body.data;
    } else if (payload.parts) {
        // Find plain text part, preferring it over HTML
        let textPart = payload.parts.find((part: any) => part.mimeType === 'text/plain');
        if (!textPart) {
            // Fallback to HTML if no plain text part is available
            textPart = payload.parts.find((part: any) => part.mimeType === 'text/html');
        }
        if (textPart && textPart.body?.data) {
            bodyData = textPart.body.data;
        }
    }
    
    if (bodyData) {
       // Decode base64url encoding
       try {
         return atob(bodyData.replace(/-/g, '+').replace(/_/g, '/'));
       } catch (e) {
         console.error("Failed to decode base64 body:", e);
         return "";
       }
    }
    return "";
}

/**
 * Fetches recent AI newsletters from the user's Gmail inbox.
 */
export async function fetchRecentAiNewsletters(): Promise<Email[]> {
    if (!gapiInited) {
        throw new Error("GAPI client not initialized. Cannot fetch emails.");
    }
    
    try {
        // 1. List messages matching our query. Date filtering is now done in App.tsx
        const response = await gapi.client.gmail.users.messages.list({
            'userId': 'me',
            'q': '(subject:(AI "Artificial Intelligence" "Machine Learning" "newsletter"))',
            'maxResults': 50,
        });

        const messages = response.result.messages;
        if (!messages || messages.length === 0) {
            console.log('No AI newsletters found.');
            return [];
        }

        // 2. Use a batch request to fetch full details for each message
        const batch = gapi.client.newBatch();
        messages.forEach((message: any) => {
            if (message.id) {
                batch.add(gapi.client.gmail.users.messages.get({ 'userId': 'me', 'id': message.id! }));
            }
        });

        const batchResponse = await batch;
        const emailDetails = Object.values((batchResponse as any).result).map((res: any) => res.result);

        // 3. Parse the details into our Email format
        const parsedEmails: Email[] = emailDetails.map((detail: any) => {
            const headers = detail.payload?.headers || [];
            const fromHeader = headers.find((h: any) => h.name === 'From');
            const subjectHeader = headers.find((h: any) => h.name === 'Subject');
            const dateHeader = headers.find((h: any) => h.name === 'Date');

            return {
                id: detail.id!,
                from: fromHeader?.value || 'Unknown Sender',
                subject: subjectHeader?.value || 'No Subject',
                date: new Date(dateHeader?.value || Date.now()).toISOString(),
                body: getEmailBody(detail),
            };
        }).filter(email => email.body); // Only include emails where we could parse the body

        return parsedEmails;

    } catch (err: unknown) {
        console.error('Gmail API Error:', err);
        // If it's a 401, the token might be expired, sign out the user.
        const gapiError = err as any;
        if (gapiError?.result?.error?.code === 401 || gapiError?.status === 401) {
            signOut();
        }
        throw new Error('Failed to fetch emails from Gmail.');
    }
}
