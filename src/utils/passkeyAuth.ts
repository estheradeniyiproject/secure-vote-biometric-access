
export interface PasskeyAuthResult {
  success: boolean;
  error?: string;
  credential?: PublicKeyCredential;
}

export interface PasskeyRegistrationResult {
  success: boolean;
  error?: string;
  credentialId?: string;
}

export class PasskeyAuthenticator {
  private static instance: PasskeyAuthenticator;
  
  static getInstance(): PasskeyAuthenticator {
    if (!PasskeyAuthenticator.instance) {
      PasskeyAuthenticator.instance = new PasskeyAuthenticator();
    }
    return PasskeyAuthenticator.instance;
  }

  async checkPasskeySupport(): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      return false;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.error('Error checking passkey support:', error);
      return false;
    }
  }

  async registerPasskey(userEmail: string, userId: string): Promise<PasskeyRegistrationResult> {
    try {
      const supported = await this.checkPasskeySupport();
      if (!supported) {
        return {
          success: false,
          error: "Passkey authentication is not supported on this device"
        };
      }

      // Generate a challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Convert user ID to ArrayBuffer
      const userIdBuffer = new TextEncoder().encode(userId);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "SecureVote",
          id: window.location.hostname,
        },
        user: {
          id: userIdBuffer,
          name: userEmail,
          displayName: userEmail,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred"
        },
        timeout: 60000,
        attestation: "direct"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to create passkey");
      }

      // Store credential info in localStorage for this demo
      const credentialInfo = {
        id: credential.id,
        userEmail,
        userId,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`passkey_${userId}`, JSON.stringify(credentialInfo));

      return {
        success: true,
        credentialId: credential.id
      };
    } catch (error: any) {
      console.error('Passkey registration error:', error);
      
      if (error.name === 'NotSupportedError') {
        return {
          success: false,
          error: "Passkey authentication is not supported on this device"
        };
      } else if (error.name === 'NotAllowedError') {
        return {
          success: false,
          error: "Passkey registration was cancelled or denied"
        };
      } else if (error.name === 'InvalidStateError') {
        return {
          success: false,
          error: "A passkey is already registered for this account"
        };
      }
      
      return {
        success: false,
        error: "Failed to register passkey. Please try again."
      };
    }
  }

  async authenticateWithPasskey(userEmail: string, userId: string): Promise<PasskeyAuthResult> {
    try {
      const supported = await this.checkPasskeySupport();
      if (!supported) {
        return {
          success: false,
          error: "Passkey authentication is not supported on this device"
        };
      }

      // Check if passkey exists for this user
      const storedCredential = localStorage.getItem(`passkey_${userId}`);
      if (!storedCredential) {
        return {
          success: false,
          error: "No passkey found for this account. Please register a passkey first."
        };
      }

      const credentialInfo = JSON.parse(storedCredential);

      // Generate a challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [{
          type: "public-key",
          id: new TextEncoder().encode(credentialInfo.id),
          transports: ["internal"]
        }],
        userVerification: "required",
        timeout: 60000
      };

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Passkey authentication failed");
      }

      return {
        success: true,
        credential
      };
    } catch (error: any) {
      console.error('Passkey authentication error:', error);
      
      if (error.name === 'NotSupportedError') {
        return {
          success: false,
          error: "Passkey authentication is not supported on this device"
        };
      } else if (error.name === 'NotAllowedError') {
        return {
          success: false,
          error: "Passkey authentication was cancelled or failed"
        };
      } else if (error.name === 'InvalidStateError') {
        return {
          success: false,
          error: "No valid passkey found for this account"
        };
      }
      
      return {
        success: false,
        error: "Passkey authentication failed. Please try again."
      };
    }
  }

  async hasPasskeyRegistered(userId: string): Promise<boolean> {
    const storedCredential = localStorage.getItem(`passkey_${userId}`);
    return !!storedCredential;
  }

  async removePasskey(userId: string): Promise<void> {
    localStorage.removeItem(`passkey_${userId}`);
  }
}

export const passkeyAuth = PasskeyAuthenticator.getInstance();
