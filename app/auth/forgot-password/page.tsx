import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { JapandiLayout } from "@/components/japandi-layout";

export default function Page() {
  return (
    <JapandiLayout 
      title="Reset Password" 
      subtitle="Enter your email address and we'll send you a link to reset your password."
      showNav={false}
      maxWidth="sm"
    >
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <ForgotPasswordForm />
        </div>
      </div>
    </JapandiLayout>
  );
}
