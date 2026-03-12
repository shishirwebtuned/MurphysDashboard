import axiosInstance from "./axios";

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  country?: string;
  referralSource?: string;
}

export async function registerUser(data: RegisterUserData) {
  try {
    const response = await axiosInstance.post("/auth/register", data);

    // Store token in localStorage if provided
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    if (response.data.refreshToken) {
      localStorage.setItem("refreshToken", response.data.refreshToken);
    }

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Registration failed");
  }
}
