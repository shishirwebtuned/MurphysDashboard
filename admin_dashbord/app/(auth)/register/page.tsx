'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/lib/axios";

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
});

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [modalStatus, setModalStatus] = useState<string | null>(null);

 



  const handleSendVerification = async (values: any, { setSubmitting }: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/auth/send-verification', {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
      });

      if (response.data.success) {
        setEmailSent(true);
        setSubmittedEmail(values.email);
      }
    } catch (err: any) {
      console.error('Send verification error:', err);
      setError(err?.response?.data?.message ?? (typeof err?.response?.data === 'string' ? err.response.data : undefined) ?? err?.message ?? 'Failed to send verification email');
    } finally {
      setLoading(false);
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
        {!emailSent ? (
          <>
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Create Account</h1>
              <p className="text-base text-gray-500">
                Enter your details to create your account
              </p>
            </div>

            <Formik
              initialValues={{
                firstName: "",
                lastName: "",
                email: "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSendVerification}
            >
              {({ isSubmitting, touched, errors }) => (
                <Form className="space-y-5">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Field
                        as={Input}
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="First Name"
                        className={`h-12 text-base rounded shadow-none ${touched.firstName && errors.firstName
                            ? "border-red-500"
                            : ""
                          }`}
                      />
                      {touched.firstName && errors.firstName && (
                        <p className="text-sm text-red-600 mt-2">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <Field
                        as={Input}
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Last Name"
                        className={`h-12 text-base rounded shadow-none ${touched.lastName && errors.lastName
                            ? "border-red-500"
                            : ""
                          }`}
                      />
                      {touched.lastName && errors.lastName && (
                        <p className="text-sm text-red-600 mt-2">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

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

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 border border-red-200 p-4"
                      >
                        <p className="text-sm text-red-800">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base"
                  >
                    {isSubmitting || loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </Form>
              )}
            </Formik>

            {/* Login Link */}
            <p className="mt-8 text-center text-base text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => router.push('/login')}
                className="text-blue-600 cursor-pointer hover:text-blue-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Check Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification link to<br />
              <span className="font-semibold text-gray-900">{submittedEmail}</span>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Click the link in the email to verify your address and complete your registration.
            </p>

            <button
              onClick={() => setEmailSent(false)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Didn't receive the email? Try again
            </button>
          </motion.div>
        )}
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
