"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";
import { getMee } from "@/lib/redux/slices/meeSlice";
import { showSuccessToast, showErrorToast } from "@/lib/toast-handler";
import Header from "@/app/page/common/header";
import { useAppSelector,useAppDispatch } from "@/lib/redux/hooks";
import axiosInstance from "@/lib/axios";

export default function Page() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const dispatch = useAppDispatch();
  const meeData = useAppSelector((state) => state.mee.data);
  const userEmail = meeData?.email || "";
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const dispatchGetMee = async () => {
    try {
      await dispatch(getMee()).unwrap();
    } catch (error) {
      // Handle error if needed
    }
  };

  useEffect(() => {
    if (!meeData) dispatchGetMee();
  }, [meeData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showErrorToast("Please fill all fields", "Validation Error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorToast(
        "New password and confirm password do not match",
        "Validation Error"
      );
      return;
    }

    if (newPassword.length < 6) {
      showErrorToast(
        "Password must be at least 6 characters",
        "Validation Error"
      );
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      showSuccessToast("Password changed successfully", "Success");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <Header title="Change Password" description="Update your account password securely" />
      <div className="p-4 max-w-2xl mx-auto   ">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Security Settings</CardTitle>
          <CardDescription>
            Change your account password securely
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email */}
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={userEmail} disabled />
          </div>

          <Separator />

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current password */}
            <div className="space-y-1">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-1">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters
              </p>
            </div>

            {/* Confirm password */}
            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
  );
}
