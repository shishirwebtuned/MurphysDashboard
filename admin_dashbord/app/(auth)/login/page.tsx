'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import axiosInstance from "@/lib/axios";

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function LoginPage() {

  const router = useRouter();
  const [passwordClick, setPasswordClick] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [modalStatus, setModalStatus] = useState<string | null>(null);
  const handleLogin = async (
    values: { email: string; password: string },
    { setSubmitting, setStatus }: any
  ) => {
    try {
      const userCredential = await axiosInstance.post("/auth/login", {
        email: values.email,
        password: values.password,
      });
      console.log(userCredential.data)
      if (userCredential.data && userCredential.data.token) {
        localStorage.setItem("token", userCredential.data.token);
        setModalStatus("Login successful! Redirecting...");
        setTimeout(() => {
          setModalStatus(null);
          router.push("/admin/dashboard");
        }, 1000);
      }

    } catch (error: any) {
      setStatus({ error: error?.response?.data?.message ?? (typeof error?.response?.data === 'string' ? error.response.data : undefined) ?? error?.message ?? "Invalid email or password" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-white border border-gray-200 p-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">Murphy’s | Admin Login</h1>
          <p className="text-base text-gray-500">
            Enter your credentials to access your account
          </p>
        </div>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={validationSchema}
          onSubmit={handleLogin}
        >
          {({ isSubmitting, status, touched, errors }) => (
            <Form className="space-y-5">
              {/* Email Field */}
              <div>
                <Field
                  as={Input}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  className={`h-12 text-base rounded shadow-none ${touched.email && errors.email
                    ? "border-red-500"
                    : ""
                    }`}
                />
                {touched.email && errors.email && (
                  <p className="text-sm text-red-600 mt-2">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="relative">
                  <Field
                    as={Input}
                    id="password"
                    name="password"
                    type={passwordClick ? "text" : "password"}
                    placeholder="Password"
                    className={`h-12 text-base pr-12 rounded shadow-none ${touched.password && errors.password
                      ? "border-red-500"
                      : ""
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordClick(!passwordClick)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {passwordClick ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="text-sm text-red-600 mt-2">{errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-gray-600 cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-sm text-blue-600 cursor-pointer hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {status?.error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-200 p-4"
                  >
                    <p className="text-sm text-red-800">{status.error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </Form>
          )}
        </Formik>

        {/* Sign Up Link */}
        {/* <p className="mt-8 text-center text-base text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={() => router.push("/register")}
            className="text-blue-600 cursor-pointer hover:text-blue-700 font-medium"
          >
            Create one
          </button>
        </p> */}
      </motion.div>
      {/* Toast Notification */}
      <AnimatePresence>
        {modalStatus && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-gray-900 text-white px-6 py-3">
              <p className="text-sm">{modalStatus}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}