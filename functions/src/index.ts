import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

interface CreateBusinessUserData {
  email: string;
  password: string;
  businessId: string;
}

// Create business user
export const createBusinessUser = functions.https.onCall(
  async (data: CreateBusinessUserData, context) => {
    try {
      // Verify admin permissions
      if (!context.auth?.token?.email ||
          !["cgonzalez.uy@gmail.com", "sole.emery@gmail.com"].includes(
            context.auth.token.email,
          )) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Solo los administradores pueden crear usuarios de comercio",
        );
      }

      const {email, password, businessId} = data;

      // Validate required data
      if (!email || !password || !businessId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Se requieren email, password y businessId",
        );
      }

      // Verify business exists
      const businessDoc = await admin.firestore()
        .collection("businesses")
        .doc(businessId)
        .get();
      if (!businessDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "El comercio no existe",
        );
      }

      let userRecord;
      const plural = "businesses";
      // Check if user already exists
      try {
        userRecord = await admin.auth().getUserByEmail(email);

        // Update existing user's claims
        await admin.auth().setCustomUserClaims(userRecord.uid, {
          businessId,
          role: "business",
        });

        // Update user data in Firestore
        await admin.firestore().collection("users").doc(userRecord.uid).set({
          email,
          businessId,
          role: "business",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, {merge: true});

        return {
          success: true,
          existing: true,
          uid: userRecord.uid,
        };
      } catch (error: any) {
        // Only proceed if error is user-not-found
        if (error.code !== "auth/user-not-found") {
          throw error;
        }

        // Create new user
        userRecord = await admin.auth().createUser({
          email,
          password,
          emailVerified: false,
        });

        // Set custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, {
          businessId,
          role: "business",
        });

        // Store user data in Firestore
        await admin.firestore().collection("users").doc(userRecord.uid).set({
          email,
          businessId,
          role: "business",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await admin.firestore().collection(plural).doc(businessId).update({
          hasPortalAccess: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          existing: false,
          uid: userRecord.uid,
        };
      }
    } catch (error: any) {
      console.error("Error in createBusinessUser:", error);

      // Handle specific errors
      if (error.code === "auth/email-already-exists") {
        throw new functions.https.HttpsError(
          "already-exists",
          "El email ya está registrado",
        );
      }

      if (error.code === "auth/invalid-email") {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "El email no es válido",
        );
      }

      if (error.code === "auth/operation-not-allowed") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "La creación de usuarios no está habilitada",
        );
      }

      // For any other error, return a generic error message
      throw new functions.https.HttpsError(
        "internal",
        "Error al crear el usuario del comercio",
      );
    }
  }
);