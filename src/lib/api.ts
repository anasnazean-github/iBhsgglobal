"use client";

import { auth } from "./firebase";

export interface UserProfile {
  email: string;
  name: string;
  phone_number: string | null;
  role: "Administrator" | "Manager" | "Operator" | "Moderator";
  pages_access: string[]; // parsed JSON array
  modules_access: string[]; // parsed JSON array
  active: number; // 0 = inactive, 1 = active
  contract_signature_base64?: string | null;
  contract_pdf_link?: string | null;
  contract_signed_at?: number | null;
}

const WORKER_URL = "https://ib.hsgglobalpteltd.workers.dev";

// Resolves a fresh token from Firebase Auth dynamically, falling back to the passed state token
async function getFreshToken(passedToken?: string): Promise<string> {
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken(false);
      if (token) return token;
    } catch (e) {
      console.warn("Failed to get fresh Firebase token:", e);
    }
  }
  return passedToken || "";
}

// Returns X-Session-ID header if it exists in client storage
function getSessionIdHeader(): Record<string, string> {
  if (typeof window !== "undefined") {
    const sid = localStorage.getItem("session_id");
    if (sid) {
      return { "X-Session-ID": sid };
    }
  }
  return {};
}

// Standard response handler to parse structured API error messages
async function handleResponse(res: Response, errorPrefix: string): Promise<any> {
  if (!res.ok) {
    let errBody: any = null;
    let errText = "";
    try {
      errText = await res.text();
      errBody = JSON.parse(errText);
    } catch {}
    if (errBody && errBody.error) {
      const err = new Error(errBody.message || errBody.error || `${errorPrefix} failed: ${res.statusText}`);
      (err as any).code = errBody.error;
      throw err;
    }
    throw new Error(`${errorPrefix} failed: ${errText || res.statusText}`);
  }
  return res.json();
}

// Parsing JSON safely
function safeParseAccess(field: any): string[] {
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  }
  return [];
}

// 1. SYNC USER PROFILE
export async function syncUserProfile(
  idToken: string, 
  email: string, 
  name: string,
  sessionId?: string | null,
  force?: boolean
): Promise<UserProfile> {
  const token = await getFreshToken(idToken);
  const res = await fetch(`${WORKER_URL}/api/users/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(sessionId ? { "X-Session-ID": sessionId } : getSessionIdHeader()),
    },
    body: JSON.stringify({ email, name, session_id: sessionId, force }),
  });
  const data = await handleResponse(res, "Profile sync");
  return {
    ...data,
    pages_access: safeParseAccess(data.pages_access),
    modules_access: safeParseAccess(data.modules_access),
  };
}

// 2. GET CURRENT PROFILE
export async function fetchMyProfile(idToken: string, email: string): Promise<UserProfile> {
  const token = await getFreshToken(idToken);
  const res = await fetch(`${WORKER_URL}/api/users/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      ...getSessionIdHeader(),
    },
  });
  const data = await handleResponse(res, "Retrieve profile");
  return {
    ...data,
    pages_access: safeParseAccess(data.pages_access),
    modules_access: safeParseAccess(data.modules_access),
  };
}

// 3. UPDATE PROFILE
export async function updateOwnProfile(idToken: string, email: string, name: string, phoneNumber: string): Promise<UserProfile> {
  const token = await getFreshToken(idToken);
  const res = await fetch(`${WORKER_URL}/api/users/update-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...getSessionIdHeader(),
    },
    body: JSON.stringify({ name, phone_number: phoneNumber }),
  });
  const data = await handleResponse(res, "Update profile");
  return {
    ...data,
    pages_access: safeParseAccess(data.pages_access),
    modules_access: safeParseAccess(data.modules_access),
  };
}

// 4. GET ALL USERS (Admin only)
export async function fetchAllUsers(idToken: string, email: string): Promise<UserProfile[]> {
  const token = await getFreshToken(idToken);
  const res = await fetch(`${WORKER_URL}/api/users`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      ...getSessionIdHeader(),
    },
  });
  const results = await handleResponse(res, "Retrieve users") as any[];
  return results.map((u) => ({
    ...u,
    pages_access: safeParseAccess(u.pages_access),
    modules_access: safeParseAccess(u.modules_access),
  }));
}

// 5. UPDATE OTHER USER
export async function adminUpdateUser(
  idToken: string,
  requestorEmail: string,
  targetEmail: string,
  role: "Administrator" | "Manager" | "Operator" | "Moderator",
  pagesAccess: string[],
  modulesAccess: string[],
  active: number,
  name?: string,
  phoneNumber?: string | null
): Promise<UserProfile> {
  const token = await getFreshToken(idToken);
  const res = await fetch(`${WORKER_URL}/api/users/admin-update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...getSessionIdHeader(),
    },
    body: JSON.stringify({
      email: targetEmail,
      role,
      pages_access: pagesAccess,
      modules_access: modulesAccess,
      active,
      name,
      phone_number: phoneNumber,
    }),
  });
  const data = await handleResponse(res, "Update user");
  return {
    ...data,
    pages_access: safeParseAccess(data.pages_access),
    modules_access: safeParseAccess(data.modules_access),
  };
}

// 6. DELETE USER (Admin only)
export async function adminDeleteUser(
  idToken: string,
  requestorEmail: string,
  targetEmail: string
): Promise<{ success: boolean; email: string }> {
  const token = await getFreshToken(idToken);
  const res = await fetch(`${WORKER_URL}/api/users/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...getSessionIdHeader(),
    },
    body: JSON.stringify({ email: targetEmail }),
  });
  return handleResponse(res, "Delete user");
}

// 7. CONTRACT APIs
export async function fetchLatestContract(): Promise<{ text: string; updated_at: number }> {
  const res = await fetch(`${WORKER_URL}/api/contract/latest`, {
    method: "GET",
  });
  return handleResponse(res, "Retrieve latest contract");
}

export async function adminUpdateContract(idToken: string, text: string): Promise<{ success: boolean; updated_at: number }> {
  const token = await getFreshToken(idToken);
  const res = await fetch(`${WORKER_URL}/api/contract/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...getSessionIdHeader(),
    },
    body: JSON.stringify({ text }),
  });
  return handleResponse(res, "Update contract");
}

export async function startSigningSession(email: string): Promise<{ session_id: string }> {
  const res = await fetch(`${WORKER_URL}/api/contract/start-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res, "Start signing session");
}

export async function pollSigningSession(sessionId: string): Promise<{
  session_id: string;
  email: string;
  status: string;
  name?: string;
  phone?: string;
  signature_data?: string;
}> {
  const res = await fetch(`${WORKER_URL}/api/contract/session-status?sessionId=${encodeURIComponent(sessionId)}`, {
    method: "GET",
  });
  return handleResponse(res, "Poll signing status");
}

export async function submitMobileSignature(
  sessionId: string,
  name: string,
  phone: string,
  signatureData: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${WORKER_URL}/api/contract/submit-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      name,
      phone,
      signature_data: signatureData,
    }),
  });
  return handleResponse(res, "Submit signature");
}

export async function finalizeContractSignature(
  idToken: string,
  email: string,
  name: string,
  phone: string,
  signatureBase64: string,
  pdfLink: string,
  signedAt: number
): Promise<UserProfile> {
  const token = await getFreshToken(idToken);
  const res = await fetch(`${WORKER_URL}/api/contract/finalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...getSessionIdHeader(),
    },
    body: JSON.stringify({
      email,
      name,
      phone_number: phone,
      signature_base64: signatureBase64,
      pdf_link: pdfLink,
      signed_at: signedAt,
    }),
  });
  const data = await handleResponse(res, "Finalize contract signing");
  return {
    ...data,
    pages_access: safeParseAccess(data.pages_access),
    modules_access: safeParseAccess(data.modules_access),
  };
}
