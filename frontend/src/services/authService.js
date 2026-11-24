import { apiRequest } from "./api";

export const loginUser = async (email, password) => {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const registerUser = async (name, email, password) => {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
};

export const logoutUser = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authUser");
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("authUser") || "null");
  } catch {
    return null;
  }
};

export const saveAuthData = (data) => {
  if (!data?.accessToken) {
    throw new Error("Access token is missing.");
  }

  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("authUser", JSON.stringify(data.user || null));
};
