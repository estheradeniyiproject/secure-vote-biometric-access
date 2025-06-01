
export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  step?: string;
}

export class BiometricAuthenticator {
  private static instance: BiometricAuthenticator;
  
  static getInstance(): BiometricAuthenticator {
    if (!BiometricAuthenticator.instance) {
      BiometricAuthenticator.instance = new BiometricAuthenticator();
    }
    return BiometricAuthenticator.instance;
  }

  async checkBiometricSupport(): Promise<{ fingerprint: boolean; faceId: boolean }> {
    const support = {
      fingerprint: false,
      faceId: false
    };

    // Check for WebAuthn API support
    if (window.PublicKeyCredential) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        support.fingerprint = available;
        support.faceId = available;
      } catch (error) {
        console.error('Error checking biometric support:', error);
      }
    }

    return support;
  }

  async authenticateFingerprint(): Promise<BiometricAuthResult> {
    try {
      const support = await this.checkBiometricSupport();
      
      if (!support.fingerprint) {
        return {
          success: false,
          error: "System hardware not supported.",
          step: "fingerprint"
        };
      }

      // Simulate fingerprint authentication with WebAuthn
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "SecureVote",
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: "user@securevote.com",
            displayName: "Voter",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      });

      if (!credential) {
        throw new Error("Fingerprint authentication failed");
      }

      return {
        success: true,
        step: "fingerprint"
      };
    } catch (error: any) {
      console.error('Fingerprint authentication error:', error);
      
      // Handle specific error cases
      if (error.name === 'NotSupportedError') {
        return {
          success: false,
          error: "System hardware not supported.",
          step: "fingerprint"
        };
      } else if (error.name === 'NotAllowedError') {
        return {
          success: false,
          error: "Fingerprint authentication was cancelled or failed.",
          step: "fingerprint"
        };
      }
      
      return {
        success: false,
        error: "Fingerprint authentication failed. Please try again.",
        step: "fingerprint"
      };
    }
  }

  async authenticateFaceId(): Promise<BiometricAuthResult> {
    try {
      const support = await this.checkBiometricSupport();
      
      if (!support.faceId) {
        return {
          success: false,
          error: "System hardware not supported.",
          step: "faceid"
        };
      }

      // For face ID, we'll use the same WebAuthn API but with a different user interaction
      // In a real implementation, this would interface with platform-specific Face ID APIs
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      // Simulate face recognition with getUserMedia API for camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" } 
        });
        
        // Stop the stream immediately as we're just checking camera access
        stream.getTracks().forEach(track => track.stop());
        
        return {
          success: true,
          step: "faceid"
        };
      } catch (mediaError) {
        return {
          success: false,
          error: "Camera access required for face recognition.",
          step: "faceid"
        };
      }
    } catch (error: any) {
      console.error('Face ID authentication error:', error);
      
      return {
        success: false,
        error: "Face recognition failed. Please try again.",
        step: "faceid"
      };
    }
  }

  async performFullBiometricAuth(): Promise<BiometricAuthResult> {
    // Step 1: Fingerprint authentication
    const fingerprintResult = await this.authenticateFingerprint();
    if (!fingerprintResult.success) {
      return fingerprintResult;
    }

    // Step 2: Face ID authentication
    const faceIdResult = await this.authenticateFaceId();
    if (!faceIdResult.success) {
      return faceIdResult;
    }

    return {
      success: true,
      step: "complete"
    };
  }
}

export const biometricAuth = BiometricAuthenticator.getInstance();
