"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegisterAdmin } from "@/domains/auth/hooks";
import { RegisterAdminPayload } from "@/domains/auth/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { School, User, AlertCircle } from "lucide-react";

type FormState = {
  school_name: string;
  school_address: string;
  school_phone: string;
  school_email: string;
  school_website: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
};

const initialFormState: FormState = {
  school_name: "",
  school_address: "",
  school_phone: "",
  school_email: "",
  school_website: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useRegisterAdmin();
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.school_name.trim()) errors.school_name = "School name is required";
    if (!formData.school_address.trim()) errors.school_address = "School address is required";
    if (!formData.first_name.trim()) errors.first_name = "First name is required";
    if (!formData.last_name.trim()) errors.last_name = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.password.trim()) errors.password = "Password is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (formData.password && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    // Optional email validation
    if (formData.school_email && !emailRegex.test(formData.school_email)) {
      errors.school_email = "Please enter a valid school email address";
    }

    // Optional website validation
    if (formData.school_website && formData.school_website.trim()) {
      try {
        new URL(formData.school_website);
      } catch {
        errors.school_website = "Please enter a valid website URL";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      // Clean up optional fields
      const payload: RegisterAdminPayload = {
        ...formData,
        school_phone: formData.school_phone.trim() || undefined,
        school_email: formData.school_email.trim() || undefined,
        school_website: formData.school_website.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      };

      await mutateAsync(payload);
      
      // Success - redirect to dashboard
      router.push("/class-updates");
    } catch (err: unknown) {
      console.error("Registration error:", err);
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { 
          response?: { 
            data?: { 
              message?: string;
              errors?: Array<{ field: string; message: string }>; 
            } 
          } 
        };
        
        if (axiosError.response?.data?.errors) {
          // Handle validation errors from backend
          const backendErrors: Record<string, string> = {};
          axiosError.response.data.errors.forEach((error) => {
            backendErrors[error.field] = error.message;
          });
          setValidationErrors(backendErrors);
        } else {
          setError(
            axiosError.response?.data?.message || 
            "Registration failed. Please try again."
          );
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center space-y-2 pb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <School className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Create Your School Account
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Set up your school and admin account to get started with Durusuna
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* School Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <School className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">School Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="school_name">School Name *</Label>
                    <Input
                      id="school_name"
                      type="text"
                      value={formData.school_name}
                      onChange={handleChange("school_name")}
                      placeholder="Enter your school name"
                      className={validationErrors.school_name ? "border-red-500" : ""}
                    />
                    {validationErrors.school_name && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.school_name}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="school_address">School Address *</Label>
                    <Input
                      id="school_address"
                      type="text"
                      value={formData.school_address}
                      onChange={handleChange("school_address")}
                      placeholder="Enter complete school address"
                      className={validationErrors.school_address ? "border-red-500" : ""}
                    />
                    {validationErrors.school_address && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.school_address}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="school_phone">School Phone</Label>
                    <Input
                      id="school_phone"
                      type="tel"
                      value={formData.school_phone}
                      onChange={handleChange("school_phone")}
                      placeholder="+1 (555) 123-4567"
                      className={validationErrors.school_phone ? "border-red-500" : ""}
                    />
                    {validationErrors.school_phone && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.school_phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="school_email">School Email</Label>
                    <Input
                      id="school_email"
                      type="email"
                      value={formData.school_email}
                      onChange={handleChange("school_email")}
                      placeholder="info@yourschool.edu"
                      className={validationErrors.school_email ? "border-red-500" : ""}
                    />
                    {validationErrors.school_email && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.school_email}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="school_website">School Website</Label>
                    <Input
                      id="school_website"
                      type="url"
                      value={formData.school_website}
                      onChange={handleChange("school_website")}
                      placeholder="https://www.yourschool.edu"
                      className={validationErrors.school_website ? "border-red-500" : ""}
                    />
                    {validationErrors.school_website && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.school_website}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200"></div>

              {/* Admin Account Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Administrator Account</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleChange("first_name")}
                      placeholder="Enter your first name"
                      className={validationErrors.first_name ? "border-red-500" : ""}
                    />
                    {validationErrors.first_name && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.first_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleChange("last_name")}
                      placeholder="Enter your last name"
                      className={validationErrors.last_name ? "border-red-500" : ""}
                    />
                    {validationErrors.last_name && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.last_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Admin Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange("email")}
                      placeholder="admin@yourschool.edu"
                      className={validationErrors.email ? "border-red-500" : ""}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Admin Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange("phone")}
                      placeholder="+1 (555) 123-4567"
                      className={validationErrors.phone ? "border-red-500" : ""}
                    />
                    {validationErrors.phone && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange("password")}
                      placeholder="Enter a secure password (minimum 8 characters)"
                      className={validationErrors.password ? "border-red-500" : ""}
                    />
                    {validationErrors.password && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="flex-1"
                >
                  Back to Login
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
