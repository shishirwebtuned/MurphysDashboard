'use client'

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/lib/axios";
import { Label } from "@/components/ui/label";

const validationSchema = Yup.object({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], "Passwords must match")
    .required("Please confirm your password"),
  phone: Yup.string()
    // .matches(/^(\+61|0)?[2-478](?:[ -]?[0-9]){8}$/, "Invalid Australian phone number")
    .required("Phone number is required"),
  gender: Yup.string().required("Gender is required"),
});

export default function CompleteRegistrationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordClick, setPasswordClick] = useState(false);
  const [confirmPasswordClick, setConfirmPasswordClick] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No verification token provided');
        setVerifying(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/auth/verify-token?token=${token}`);

        if (response.data.success) {
          setTokenValid(true);
          setUserData(response.data.data);
          setVerificationMessage(response.data.message || null);
        }
      } catch (err: any) {
        console.error('Token verification error:', err);
        setError(err?.response?.data?.message ?? (typeof err?.response?.data === 'string' ? err.response.data : undefined) ?? err?.message ?? 'Invalid or expired token');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleCompleteRegistration = async (values: any, { setSubmitting }: any) => {
    setLoading(true);
    setError(null);

    try {

      // 3. Complete registration in backend
      const response = await axiosInstance.post('/auth/register', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        gender: values.gender,
        phone: values.phone,
        country: "Australia",
        password : values.password,
        referralSource: values.referralSource || '',
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err?.response?.data?.message ?? (typeof err?.response?.data === 'string' ? err.response.data : undefined) ?? err?.message ?? 'Registration failed');
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
        className="w-full max-w-3xl bg-white border border-gray-200 p-10"
      >
        {verifying ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-base">Verifying your email...</p>
          </div>
        ) : !tokenValid ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 flex items-center justify-center text-red-600 text-3xl font-bold">
              ✕
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Failed</h2>
            <p className="text-base text-gray-600 mb-8">{error}</p>
            <Button
              onClick={() => router.push('/register')}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base"
            >
              Start Over
            </Button>
          </div>
        ) : success ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Registration Complete!
            </h2>
            <p className="text-base text-gray-600">
              Redirecting to login...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Complete Registration</h2>
              <p className="text-base text-gray-500">
                Email verified for: <strong>{userData?.email}</strong>
              </p>
            </div>

            <Formik
              enableReinitialize
              initialValues={{
                firstName: userData?.firstName || '',
                lastName: userData?.lastName || '',
                email: userData?.email || '',
                password: "",
                confirmPassword: "",
                phone: "",
                gender: "",
                referralSource: "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleCompleteRegistration}
            >
              {({ isSubmitting, touched, errors, setFieldValue, values }) => (
                <Form className="space-y-5">

                  {/* Verified info */}
                  {verificationMessage && (
                    <div className="mb-4 p-4 border rounded bg-blue-50 text-sm text-blue-800">
                      <div className="font-semibold mb-1">Verification</div>
                      <div>{verificationMessage}</div>
                    </div>
                  )}

                  {/* Disabled name/email (pre-filled from token) */}
                  <div className="grid md:grid-cols-2 grid-cols-1 gap-4 mb-4">

                    <div>
                      <Label  className="pb-2 text-muted-foreground"> Name </Label>
                      <Field
                        as={Input}
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="First Name"
                        disabled
                        className="h-12 text-base bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label  className="pb-2 text-muted-foreground">Last Name</Label>
                      <Field
                        as={Input}
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Last Name"
                        disabled
                        className="h-12 text-base bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label  className="pb-2 text-muted-foreground"  >Email Address</Label>

                    <Field
                      as={Input}
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email"
                      disabled
                      className="h-12 text-base bg-gray-100"
                    />
                  </div>

                  {/* Phone & Gender */}
                  <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                    <div>
                      <Label  className="pb-2 text-muted-foreground">Phone Number</Label>
                      <Field
                        as={Input}
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="Phone Number"
                        className={`h-12 text-base ${touched.phone && errors.phone ? "border-red-500" : ""}`}
                      />
                      {touched.phone && errors.phone && (
                        <p className="text-sm text-red-600 mt-2">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <Label  className="pb-2 text-muted-foreground">Gender</Label>
                      <Select
                        value={values.gender}
                        onValueChange={(value) => setFieldValue('gender', value)}
                      >
                        <SelectTrigger className={`h-12 text-base w-full flex items-center px-3 ${touched.gender && errors.gender ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Gender" className="flex-1 leading-none" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      {touched.gender && errors.gender && (
                        <p className="text-sm text-red-600 mt-2">{errors.gender}</p>
                      )}
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                    <div>
                      <Label className="pb-2 text-muted-foreground">Password</Label>
                      <div className="relative">
                        <Field
                          as={Input}
                          id="password"
                          name="password"
                          type={passwordClick ? "text" : "password"}
                          placeholder="Password"
                          className={`h-12 text-base pr-12 ${touched.password && errors.password ? "border-red-500" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordClick(!passwordClick)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600"
                        >
                          {passwordClick ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {touched.password && errors.password && (
                        <p className="text-sm text-red-600 mt-2">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <Label className="pb-2 text-muted-foreground">Confirm Password</Label>
                      <div className="relative">
                        <Field
                          as={Input}
                          id="confirmPassword"
                          name="confirmPassword"
                          type={confirmPasswordClick ? "text" : "password"}
                          placeholder="Confirm Password"
                          className={`h-12 text-base pr-12 ${touched.confirmPassword && errors.confirmPassword ? "border-red-500" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setConfirmPasswordClick(!confirmPasswordClick)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600"
                        >
                          {confirmPasswordClick ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {touched.confirmPassword && errors.confirmPassword && (
                        <p className="text-sm text-red-600 mt-2">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Referral Source */}
                  <div>
                    <Label className="pb-2 text-muted-foreground">How did you hear about us? (Optional)</Label>
                    <Select
                      value={values.referralSource}
                      onValueChange={(value) => setFieldValue('referralSource', value)}
                    >
                      <SelectTrigger className="h-12 text-base w-full flex items-center px-3">
                        <SelectValue placeholder="How did you hear about us? (Optional)" className="flex-1 leading-none" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="search-engine">Search Engine (Google, Bing, etc.)</SelectItem>
                        <SelectItem value="social-media">Social Media</SelectItem>
                        <SelectItem value="friend-referral">Friend or Colleague Referral</SelectItem>
                        <SelectItem value="advertisement">Online Advertisement</SelectItem>
                        <SelectItem value="blog-article">Blog or Article</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="email">Email Newsletter</SelectItem>
                        <SelectItem value="event">Event or Conference</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="email-verification">Verified Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 text-red-800 text-sm p-4 border border-red-200"
                      >
                        {error}
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
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </Form>
              )}
            </Formik>
          </>
        )}
      </motion.div>
    </div>
  );
}
